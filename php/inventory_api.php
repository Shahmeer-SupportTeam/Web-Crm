<?php
require_once 'db_connect.php';
require_once 'auth_check.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$userId = $_SESSION['user_id'];

try {
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        handleGetRequest();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        handlePostRequest();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        handlePutRequest();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        handleDeleteRequest();
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Inventory API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error']);
}

function handleGetRequest() {
    global $pdo, $userId;
    
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            getProducts();
            break;
        case 'analytics':
            getAnalytics();
            break;
        case 'export':
            exportInventory();
            break;
        case 'low_stock':
            getLowStockProducts();
            break;
        default:
            getProducts();
    }
}

function handlePostRequest() {
    global $pdo, $userId;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? 'create';
    
    switch ($action) {
        case 'create':
            createProduct($input);
            break;
        case 'adjust_stock':
            adjustStock($input);
            break;
        case 'bulk_import':
            bulkImport();
            break;
        default:
            createProduct($input);
    }
}

function handlePutRequest() {
    global $pdo, $userId;
    
    $input = json_decode(file_get_contents('php://input'), true);
    updateProduct($input);
}

function handleDeleteRequest() {
    global $pdo, $userId;
    
    $input = json_decode(file_get_contents('php://input'), true);
    deleteProduct($input);
}

function getProducts() {
    global $pdo, $userId;
    
    $search = $_GET['search'] ?? '';
    $category = $_GET['category'] ?? '';
    $stockLevel = $_GET['stock_level'] ?? '';
    
    $sql = "SELECT * FROM products WHERE user_id = ?";
    $params = [$userId];
    
    if ($search) {
        $sql .= " AND (name LIKE ? OR sku LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    if ($category) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    
    if ($stockLevel === 'low') {
        $sql .= " AND current_stock <= alert_threshold";
    } elseif ($stockLevel === 'out') {
        $sql .= " AND current_stock = 0";
    } elseif ($stockLevel === 'normal') {
        $sql .= " AND current_stock > alert_threshold";
    }
    
    $sql .= " ORDER BY name ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($products);
}

function getAnalytics() {
    global $pdo, $userId;
    
    // Total products
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE user_id = ?");
    $stmt->execute([$userId]);
    $totalProducts = $stmt->fetchColumn();
    
    // Low stock products
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE user_id = ? AND current_stock <= alert_threshold");
    $stmt->execute([$userId]);
    $lowStockCount = $stmt->fetchColumn();
    
    // Total value
    $stmt = $pdo->prepare("SELECT SUM(purchase_price * current_stock) FROM products WHERE user_id = ? AND purchase_price IS NOT NULL");
    $stmt->execute([$userId]);
    $totalValue = $stmt->fetchColumn() ?: 0;
    
    // Average stock
    $stmt = $pdo->prepare("SELECT AVG(current_stock) FROM products WHERE user_id = ?");
    $stmt->execute([$userId]);
    $avgStock = $stmt->fetchColumn() ?: 0;
    
    // Category distribution
    $stmt = $pdo->prepare("SELECT category, COUNT(*) as count, SUM(purchase_price * current_stock) as value 
                          FROM products WHERE user_id = ? GROUP BY category");
    $stmt->execute([$userId]);
    $categoryDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Stock movement (last 30 days)
    $stmt = $pdo->prepare("SELECT DATE(created_at) as date, SUM(quantity) as movement 
                          FROM stock_movements WHERE user_id = ? 
                          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                          GROUP BY DATE(created_at) ORDER BY date");
    $stmt->execute([$userId]);
    $stockMovement = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $analytics = [
        'total_products' => $totalProducts,
        'low_stock_count' => $lowStockCount,
        'total_value' => $totalValue,
        'average_stock' => round($avgStock, 2),
        'category_distribution' => $categoryDistribution,
        'stock_movement' => $stockMovement
    ];
    
    echo json_encode($analytics);
}

function getLowStockProducts() {
    global $pdo, $userId;
    
    $stmt = $pdo->prepare("SELECT * FROM products 
                          WHERE user_id = ? AND current_stock <= alert_threshold 
                          ORDER BY current_stock ASC");
    $stmt->execute([$userId]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($products);
}

function createProduct($input) {
    global $pdo, $userId;
    
    // Validate required fields
    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product name is required']);
        return;
    }
    
    // Check if product with same name already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE user_id = ? AND name = ?");
    $stmt->execute([$userId, $input['name']]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product with this name already exists']);
        return;
    }
    
    // Check if SKU is unique
    if (!empty($input['sku'])) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE user_id = ? AND sku = ?");
        $stmt->execute([$userId, $input['sku']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Product with this SKU already exists']);
            return;
        }
    }
    
    $stmt = $pdo->prepare("INSERT INTO products (
        user_id, name, category, sku, brand, current_stock, alert_threshold, 
        purchase_price, selling_price, description, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
    
    $success = $stmt->execute([
        $userId,
        $input['name'],
        $input['category'] ?? null,
        $input['sku'] ?? null,
        $input['brand'] ?? null,
        $input['current_stock'] ?? 0,
        $input['alert_threshold'] ?? 5,
        $input['purchase_price'] ?? null,
        $input['selling_price'] ?? null,
        $input['description'] ?? null
    ]);
    
    if ($success) {
        $productId = $pdo->lastInsertId();
        
        // Record initial stock movement
        if (($input['current_stock'] ?? 0) > 0) {
            $stmt = $pdo->prepare("INSERT INTO stock_movements (
                user_id, product_id, movement_type, quantity, reason, notes, created_at
            ) VALUES (?, ?, 'initial', ?, 'Initial stock', 'Initial product creation', NOW())");
            $stmt->execute([$userId, $productId, $input['current_stock'] ?? 0]);
        }
        
        echo json_encode(['success' => true, 'product_id' => $productId]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create product']);
    }
}

function updateProduct($input) {
    global $pdo, $userId;
    
    if (empty($input['product_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID is required']);
        return;
    }
    
    // Check if product exists and belongs to user
    $stmt = $pdo->prepare("SELECT * FROM products WHERE product_id = ? AND user_id = ?");
    $stmt->execute([$input['product_id'], $userId]);
    $existingProduct = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingProduct) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Product not found']);
        return;
    }
    
    // Check if name is unique (excluding current product)
    if (!empty($input['name']) && $input['name'] !== $existingProduct['name']) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE user_id = ? AND name = ? AND product_id != ?");
        $stmt->execute([$userId, $input['name'], $input['product_id']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Product with this name already exists']);
            return;
        }
    }
    
    // Check if SKU is unique (excluding current product)
    if (!empty($input['sku']) && $input['sku'] !== $existingProduct['sku']) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE user_id = ? AND sku = ? AND product_id != ?");
        $stmt->execute([$userId, $input['sku'], $input['product_id']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Product with this SKU already exists']);
            return;
        }
    }
    
    $stmt = $pdo->prepare("UPDATE products SET 
        name = ?, category = ?, sku = ?, brand = ?, current_stock = ?, alert_threshold = ?,
        purchase_price = ?, selling_price = ?, description = ?, updated_at = NOW()
                          WHERE product_id = ? AND user_id = ?");
    
    $success = $stmt->execute([
        $input['name'] ?? $existingProduct['name'],
        $input['category'] ?? $existingProduct['category'],
        $input['sku'] ?? $existingProduct['sku'],
        $input['brand'] ?? $existingProduct['brand'],
        $input['current_stock'] ?? $existingProduct['current_stock'],
        $input['alert_threshold'] ?? $existingProduct['alert_threshold'],
        $input['purchase_price'] ?? $existingProduct['purchase_price'],
        $input['selling_price'] ?? $existingProduct['selling_price'],
        $input['description'] ?? $existingProduct['description'],
        $input['product_id'],
        $userId
    ]);
    
    if ($success) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update product']);
    }
}

function adjustStock($input) {
    global $pdo, $userId;
    
    if (empty($input['product_id']) || empty($input['quantity']) || empty($input['adjustment_type'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID, quantity, and adjustment type are required']);
        return;
    }
    
    // Get current product
    $stmt = $pdo->prepare("SELECT * FROM products WHERE product_id = ? AND user_id = ?");
    $stmt->execute([$input['product_id'], $userId]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Product not found']);
        return;
    }
    
    $currentStock = $product['current_stock'];
    $quantity = (int)$input['quantity'];
    $adjustmentType = $input['adjustment_type'];
    
    // Calculate new stock
    switch ($adjustmentType) {
        case 'add':
            $newStock = $currentStock + $quantity;
            $movementType = 'in';
            break;
        case 'remove':
            if ($currentStock < $quantity) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Insufficient stock']);
                return;
            }
            $newStock = $currentStock - $quantity;
            $movementType = 'out';
            break;
        case 'set':
            $newStock = $quantity;
            $movementType = $quantity > $currentStock ? 'in' : 'out';
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid adjustment type']);
            return;
    }
    
    if ($newStock < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Stock cannot be negative']);
        return;
    }
    
    // Update product stock
    $stmt = $pdo->prepare("UPDATE products SET current_stock = ?, updated_at = NOW() WHERE product_id = ? AND user_id = ?");
    $success = $stmt->execute([$newStock, $input['product_id'], $userId]);
    
    if ($success) {
        // Record stock movement
        $stmt = $pdo->prepare("INSERT INTO stock_movements (
            user_id, product_id, movement_type, quantity, reason, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        
        $movementQuantity = abs($newStock - $currentStock);
        $reason = $input['reason'] ?? 'manual_adjustment';
        $notes = $input['notes'] ?? '';
        
        $stmt->execute([$userId, $input['product_id'], $movementType, $movementQuantity, $reason, $notes]);
        
        echo json_encode(['success' => true, 'new_stock' => $newStock]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to adjust stock']);
    }
}

function deleteProduct($input) {
    global $pdo, $userId;
    
    if (empty($input['product_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID is required']);
        return;
    }
    
    // Check if product has sales records
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM detailed_sales WHERE product_id = ?");
    $stmt->execute([$input['product_id']]);
    $hasSales = $stmt->fetchColumn() > 0;
    
    if ($hasSales) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cannot delete product with sales records']);
        return;
    }
    
    // Check if product exists and belongs to user
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE product_id = ? AND user_id = ?");
    $stmt->execute([$input['product_id'], $userId]);
    if ($stmt->fetchColumn() == 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Product not found']);
        return;
    }
    
    // Delete stock movements first
    $stmt = $pdo->prepare("DELETE FROM stock_movements WHERE product_id = ? AND user_id = ?");
    $stmt->execute([$input['product_id'], $userId]);
    
    // Delete product
    $stmt = $pdo->prepare("DELETE FROM products WHERE product_id = ? AND user_id = ?");
    $success = $stmt->execute([$input['product_id'], $userId]);
    
    if ($success) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
    }
}

function exportInventory() {
    global $pdo, $userId;
    
    $stmt = $pdo->prepare("SELECT 
        name, category, sku, brand, current_stock, alert_threshold, 
        purchase_price, selling_price, description, created_at, updated_at
        FROM products WHERE user_id = ? ORDER BY name");
    $stmt->execute([$userId]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="inventory_export_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Add headers
    fputcsv($output, [
        'Name', 'Category', 'SKU', 'Brand', 'Current Stock', 'Alert Threshold',
        'Purchase Price', 'Selling Price', 'Description', 'Created At', 'Updated At'
    ]);
    
    // Add data
    foreach ($products as $product) {
        fputcsv($output, [
            $product['name'],
            $product['category'] ?? '',
            $product['sku'] ?? '',
            $product['brand'] ?? '',
            $product['current_stock'],
            $product['alert_threshold'],
            $product['purchase_price'] ?? '',
            $product['selling_price'] ?? '',
            $product['description'] ?? '',
            $product['created_at'],
            $product['updated_at']
        ]);
    }
    
    fclose($output);
}

function bulkImport() {
    global $pdo, $userId;
    
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error']);
        return;
    }
    
    $file = $_FILES['file'];
    $handle = fopen($file['tmp_name'], 'r');
    
    if (!$handle) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Failed to read uploaded file']);
        return;
    }
    
    // Read headers
    $headers = fgetcsv($handle);
    if (!$headers) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid CSV format']);
        return;
    }
    
    $importedCount = 0;
    $errors = [];
    $rowNumber = 1;
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        while (($data = fgetcsv($handle)) !== false) {
            $rowNumber++;
            
            if (count($data) < count($headers)) {
                $errors[] = "Row $rowNumber: Insufficient data";
                continue;
            }
            
            $row = array_combine($headers, $data);
            
            // Validate required fields
            if (empty($row['Name'])) {
                $errors[] = "Row $rowNumber: Name is required";
                continue;
            }
            
            // Check for duplicate name
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE user_id = ? AND name = ?");
            $stmt->execute([$userId, $row['Name']]);
            if ($stmt->fetchColumn() > 0) {
                $errors[] = "Row $rowNumber: Product with name '{$row['Name']}' already exists";
                continue;
            }
            
            // Check for duplicate SKU
            if (!empty($row['SKU'])) {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE user_id = ? AND sku = ?");
                $stmt->execute([$userId, $row['SKU']]);
                if ($stmt->fetchColumn() > 0) {
                    $errors[] = "Row $rowNumber: Product with SKU '{$row['SKU']}' already exists";
                    continue;
                }
            }
            
            // Insert product
            $stmt = $pdo->prepare("INSERT INTO products (
                user_id, name, category, sku, brand, current_stock, alert_threshold,
                purchase_price, selling_price, description, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
            
            $success = $stmt->execute([
                $userId,
                $row['Name'],
                $row['Category'] ?? null,
                $row['SKU'] ?? null,
                $row['Brand'] ?? null,
                (int)($row['Stock'] ?? 0),
                (int)($row['Alert Threshold'] ?? 5),
                !empty($row['Purchase Price']) ? (float)$row['Purchase Price'] : null,
                !empty($row['Selling Price']) ? (float)$row['Selling Price'] : null,
                $row['Description'] ?? null
            ]);
            
            if ($success) {
                $importedCount++;
                
                // Record initial stock movement if stock > 0
                if (($row['Stock'] ?? 0) > 0) {
                    $productId = $pdo->lastInsertId();
                    $stmt = $pdo->prepare("INSERT INTO stock_movements (
                        user_id, product_id, movement_type, quantity, reason, notes, created_at
                    ) VALUES (?, ?, 'initial', ?, 'Bulk import', 'Imported via bulk import', NOW())");
                    $stmt->execute([$userId, $productId, (int)($row['Stock'] ?? 0)]);
                }
            } else {
                $errors[] = "Row $rowNumber: Failed to insert product";
            }
        }
        
        fclose($handle);
        
        if (count($errors) > 0) {
            $pdo->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Import completed with errors',
                'imported_count' => $importedCount,
                'errors' => $errors
            ]);
        } else {
            $pdo->commit();
            echo json_encode([
                'success' => true,
                'imported_count' => $importedCount
            ]);
        }
        
    } catch (Exception $e) {
        $pdo->rollBack();
        fclose($handle);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Import failed: ' . $e->getMessage()]);
    }
}
?>
<?php
require_once 'db_connect.php';
require_once 'auth_check.php';

header('Content-Type: application/json');

// Authenticate user
$user = authenticateUser($pdo);
$userId = $user['user_id'];
$userMode = $user['mode'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get sales data
    if ($userMode === 'simple') {
        $stmt = $pdo->prepare("SELECT * FROM simple_sales WHERE user_id = ? ORDER BY sale_date DESC LIMIT 30");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->prepare("
            SELECT ds.*, p.name as product_name, p.purchase_price 
            FROM detailed_sales ds
            JOIN products p ON ds.product_id = p.product_id
            WHERE ds.user_id = ?
            ORDER BY ds.sale_date DESC 
            LIMIT 30
        ");
        $stmt->execute([$userId]);
    }
    
    $sales = $stmt->fetchAll();
    echo json_encode($sales);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($userMode === 'simple') {
        // Simple mode sale
        $stmt = $pdo->prepare("INSERT INTO simple_sales (user_id, sale_date, amount, notes) VALUES (?, ?, ?, ?)");
        $success = $stmt->execute([
            $userId,
            $input['date'],
            $input['amount'],
            $input['notes'] ?? null
        ]);
    } else {
        // Detailed mode sale - use transaction
        $pdo->beginTransaction();
        
        try {
            foreach ($input['items'] as $item) {
                // Insert sale
                $stmt = $pdo->prepare("
                    INSERT INTO detailed_sales 
                    (user_id, product_id, sale_date, quantity, sale_price, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $userId,
                    $item['productId'],
                    $input['date'],
                    $item['quantity'],
                    $item['price'],
                    $input['notes'] ?? null
                ]);
                
                // Update inventory
                $updateStmt = $pdo->prepare("
                    UPDATE products 
                    SET current_stock = current_stock - ? 
                    WHERE product_id = ? AND user_id = ?
                ");
                $updateStmt->execute([
                    $item['quantity'],
                    $item['productId'],
                    $userId
                ]);
            }
            
            $pdo->commit();
            $success = true;
        } catch (Exception $e) {
            $pdo->rollBack();
            $success = false;
        }
    }
    
    echo json_encode(['success' => $success]);
}
?>
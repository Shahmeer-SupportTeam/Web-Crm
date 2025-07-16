<?php
require_once 'db_connect.php';
require_once 'auth_check.php';

header('Content-Type: application/json');

// Authenticate user
$user = authenticateUser($pdo);
$userId = $user['user_id'];
$userMode = $user['mode'];

$response = [];

if ($userMode === 'simple') {
    // Simple mode dashboard data
    
    // Today's sales
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as today_sales 
        FROM simple_sales 
        WHERE user_id = ? AND sale_date = CURDATE()
    ");
    $stmt->execute([$userId]);
    $response['todaySales'] = $stmt->fetchColumn();

    // Yesterday's sales
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as yesterday_sales 
        FROM simple_sales 
        WHERE user_id = ? AND sale_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    ");
    $stmt->execute([$userId]);
    $yesterdaySales = $stmt->fetchColumn();
    $response['salesChange'] = $yesterdaySales > 0 ? 
        (($response['todaySales'] - $yesterdaySales) / $yesterdaySales * 100) : 0;

    // Current month sales by day
    $stmt = $pdo->prepare("
        SELECT 
            sale_date as day,
            SUM(amount) as sales
        FROM simple_sales
        WHERE user_id = ? 
            AND sale_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE()
        GROUP BY sale_date
        ORDER BY sale_date
    ");
    $stmt->execute([$userId]);
    $response['monthlySales'] = $stmt->fetchAll();

} else {
    // Detailed mode dashboard data
    
    // Total sales value
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(ds.quantity * ds.sale_price), 0) as total_sales,
            COALESCE(SUM(ds.quantity), 0) as items_sold
        FROM detailed_sales ds
        WHERE ds.user_id = ?
    ");
    $stmt->execute([$userId]);
    $salesData = $stmt->fetch();
    $response['totalSales'] = $salesData['total_sales'];
    $response['itemsSold'] = $salesData['items_sold'];

    // Inventory value
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(purchase_price * current_stock), 0) as inventory_value,
            COUNT(*) as inventory_items
        FROM products
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $inventoryData = $stmt->fetch();
    $response['inventoryValue'] = $inventoryData['inventory_value'];
    $response['inventoryItems'] = $inventoryData['inventory_items'];

    // Low stock items
    $stmt = $pdo->prepare("
        SELECT name, current_stock, alert_threshold
        FROM products
        WHERE user_id = ? AND current_stock <= alert_threshold
        ORDER BY current_stock ASC
    ");
    $stmt->execute([$userId]);
    $response['lowStockItems'] = $stmt->fetchAll();

    // Recent sales
    $stmt = $pdo->prepare("
        SELECT 
            ds.sale_date,
            p.name as product_name,
            ds.quantity,
            ds.sale_price,
            (ds.quantity * ds.sale_price) as total,
            (ds.quantity * (ds.sale_price - COALESCE(p.purchase_price, 0))) as profit
        FROM detailed_sales ds
        JOIN products p ON ds.product_id = p.product_id
        WHERE ds.user_id = ?
        ORDER BY ds.sale_date DESC, ds.sale_id DESC
        LIMIT 5
    ");
    $stmt->execute([$userId]);
    $response['recentSales'] = $stmt->fetchAll();
}

echo json_encode($response);
?>


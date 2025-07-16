<?php
require_once 'db_connect.php';
require_once 'auth_check.php';

header('Content-Type: application/json');

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

try {
    switch ($method) {
        case 'GET':
            handleGetRequest($userId, $pathParts);
            break;
        case 'POST':
            handlePostRequest($userId);
            break;
        case 'PUT':
            handlePutRequest($userId, $pathParts);
            break;
        case 'DELETE':
            handleDeleteRequest($userId, $pathParts);
            break;
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function handleGetRequest($userId, $pathParts) {
    if (isset($_GET['summary'])) {
        getExpenseSummary($userId);
    } elseif (isset($_GET['recent'])) {
        getRecentExpenses($userId);
    } elseif (isset($_GET['trend'])) {
        getExpenseTrend($userId);
    } elseif (isset($_GET['export'])) {
        exportExpenses($userId);
    } elseif (count($pathParts) > 2 && $pathParts[2] === 'expenses') {
        if (isset($pathParts[3])) {
            getExpenseById($userId, $pathParts[3]);
        } else {
            getAllExpenses($userId);
        }
    } else {
        getExpenseSummary($userId);
    }
}

function handlePostRequest($userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['date']) || !isset($input['amount']) || !isset($input['category'])) {
        throw new Exception('Missing required fields');
    }
    
    $stmt = $pdo->prepare("INSERT INTO expenses (user_id, amount, category, expense_date, notes) VALUES (?, ?, ?, ?, ?)");
    $success = $stmt->execute([
        $userId,
        $input['amount'],
        $input['category'],
        $input['date'],
        $input['notes'] ?? null
    ]);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Expense added successfully',
            'expense_id' => $pdo->lastInsertId()
        ]);
    } else {
        throw new Exception('Failed to add expense');
    }
}

function handlePutRequest($userId, $pathParts) {
    if (count($pathParts) < 4) {
        throw new Exception('Expense ID required');
    }
    
    $expenseId = $pathParts[3];
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Verify ownership
    $stmt = $pdo->prepare("SELECT expense_id FROM expenses WHERE expense_id = ? AND user_id = ?");
    $stmt->execute([$expenseId, $userId]);
    if (!$stmt->fetch()) {
        throw new Exception('Expense not found or access denied');
    }
    
    $stmt = $pdo->prepare("UPDATE expenses SET amount = ?, category = ?, expense_date = ?, notes = ? WHERE expense_id = ? AND user_id = ?");
    $success = $stmt->execute([
        $input['amount'],
        $input['category'],
        $input['date'],
        $input['notes'] ?? null,
        $expenseId,
        $userId
    ]);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Expense updated successfully'
        ]);
    } else {
        throw new Exception('Failed to update expense');
    }
}

function handleDeleteRequest($userId, $pathParts) {
    if (count($pathParts) < 4) {
        throw new Exception('Expense ID required');
    }
    
    $expenseId = $pathParts[3];
    
    // Verify ownership
    $stmt = $pdo->prepare("SELECT expense_id FROM expenses WHERE expense_id = ? AND user_id = ?");
    $stmt->execute([$expenseId, $userId]);
    if (!$stmt->fetch()) {
        throw new Exception('Expense not found or access denied');
    }
    
    $stmt = $pdo->prepare("DELETE FROM expenses WHERE expense_id = ? AND user_id = ?");
    $success = $stmt->execute([$expenseId, $userId]);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Expense deleted successfully'
        ]);
    } else {
        throw new Exception('Failed to delete expense');
    }
}

function getExpenseSummary($userId) {
    // Current month total
    $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM expenses 
                          WHERE user_id = ? 
                          AND MONTH(expense_date) = MONTH(CURRENT_DATE())
                          AND YEAR(expense_date) = YEAR(CURRENT_DATE())");
    $stmt->execute([$userId]);
    $currentMonth = $stmt->fetch()['total'] ?? 0;
    
    // Previous month total for comparison
    $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM expenses 
                          WHERE user_id = ? 
                          AND MONTH(expense_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                          AND YEAR(expense_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))");
    $stmt->execute([$userId]);
    $previousMonth = $stmt->fetch()['total'] ?? 0;
    
    // Total expenses
    $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM expenses WHERE user_id = ?");
    $stmt->execute([$userId]);
    $totalExpenses = $stmt->fetch()['total'] ?? 0;
    
    // Categories count
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT category) as count FROM expenses WHERE user_id = ?");
    $stmt->execute([$userId]);
    $categoriesCount = $stmt->fetch()['count'] ?? 0;
    
    // Average monthly expense
    $stmt = $pdo->prepare("SELECT AVG(monthly_total) as avg_monthly FROM (
        SELECT YEAR(expense_date) as year, MONTH(expense_date) as month, SUM(amount) as monthly_total
        FROM expenses 
        WHERE user_id = ?
        GROUP BY YEAR(expense_date), MONTH(expense_date)
    ) as monthly_totals");
    $stmt->execute([$userId]);
    $averageExpense = $stmt->fetch()['avg_monthly'] ?? 0;
    
    // Category breakdown
    $stmt = $pdo->prepare("SELECT category, SUM(amount) as total FROM expenses 
                          WHERE user_id = ?
                          GROUP BY category
                          ORDER BY total DESC");
    $stmt->execute([$userId]);
    $categories = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Monthly trend (last 6 months)
    $stmt = $pdo->prepare("SELECT 
        DATE_FORMAT(expense_date, '%Y-%m') as month,
        SUM(amount) as total
        FROM expenses 
        WHERE user_id = ? 
        AND expense_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
        ORDER BY month");
    $stmt->execute([$userId]);
    $monthlyTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate changes
    $monthChange = $previousMonth > 0 ? (($currentMonth - $previousMonth) / $previousMonth) * 100 : 0;
    $totalChange = 0; // You can implement this based on your business logic
    
    echo json_encode([
        'success' => true,
        'currentMonthTotal' => (float)$currentMonth,
        'totalExpenses' => (float)$totalExpenses,
        'categoriesCount' => (int)$categoriesCount,
        'averageExpense' => (float)$averageExpense,
        'monthChange' => round($monthChange, 1),
        'totalChange' => round($totalChange, 1),
        'categoryBreakdown' => $categories,
        'monthlyTrend' => $monthlyTrend
    ]);
}

function getRecentExpenses($userId) {
    $stmt = $pdo->prepare("SELECT * FROM expenses 
                          WHERE user_id = ? 
                          ORDER BY expense_date DESC 
                          LIMIT 10");
    $stmt->execute([$userId]);
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'expenses' => $expenses
    ]);
}

function getExpenseById($userId, $expenseId) {
    $stmt = $pdo->prepare("SELECT * FROM expenses WHERE expense_id = ? AND user_id = ?");
    $stmt->execute([$expenseId, $userId]);
    $expense = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$expense) {
        throw new Exception('Expense not found');
    }
    
    echo json_encode([
        'success' => true,
        'expense' => $expense
    ]);
}

function getAllExpenses($userId) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;
    
    $stmt = $pdo->prepare("SELECT * FROM expenses 
                          WHERE user_id = ? 
                          ORDER BY expense_date DESC 
                          LIMIT ? OFFSET ?");
    $stmt->execute([$userId, $limit, $offset]);
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM expenses WHERE user_id = ?");
    $stmt->execute([$userId]);
    $total = $stmt->fetch()['total'];
    
    echo json_encode([
        'success' => true,
        'expenses' => $expenses,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getExpenseTrend($userId) {
    $period = isset($_GET['period']) ? (int)$_GET['period'] : 6;
    
    $stmt = $pdo->prepare("SELECT 
        DATE_FORMAT(expense_date, '%Y-%m') as month,
        SUM(amount) as total
        FROM expenses 
        WHERE user_id = ? 
        AND expense_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? MONTH)
        GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
        ORDER BY month");
    $stmt->execute([$userId, $period]);
    $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $trend
    ]);
}

function exportExpenses($userId) {
    $stmt = $pdo->prepare("SELECT 
        expense_date,
        category,
        amount,
        notes
        FROM expenses 
        WHERE user_id = ? 
        ORDER BY expense_date DESC");
    $stmt->execute([$userId]);
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Create CSV content
    $csv = "Date,Category,Amount,Notes\n";
    foreach ($expenses as $expense) {
        $csv .= sprintf(
            "%s,%s,%.2f,%s\n",
            $expense['expense_date'],
            $expense['category'],
            $expense['amount'],
            str_replace(',', ';', $expense['notes'] ?? '')
        );
    }
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="expenses_' . date('Y-m-d') . '.csv"');
    echo $csv;
    exit;
}
?>
<?php
require_once 'db_connect.php';
require_once 'auth_check.php';

header('Content-Type: application/json');

$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get trial status
    $stmt = $pdo->prepare("SELECT trial_start FROM users WHERE user_id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    $trialStart = new DateTime($user['trial_start']);
    $trialEnd = (clone $trialStart)->modify('+7 days');
    $today = new DateTime();
    
    $trialActive = $today <= $trialEnd;
    $daysLeft = $trialActive ? $today->diff($trialEnd)->days : 0;
    
    // Get subscription status
    $stmt = $pdo->prepare("SELECT * FROM subscriptions 
                          WHERE user_id = ? 
                          ORDER BY end_date DESC 
                          LIMIT 1");
    $stmt->execute([$userId]);
    $subscription = $stmt->fetch();
    
    $response = [
        'trial_active' => $trialActive,
        'trial_days_left' => $daysLeft,
        'subscribed' => false
    ];
    
    if ($subscription && new DateTime($subscription['end_date']) >= $today) {
        $response['subscribed'] = true;
        $response['plan'] = $subscription['plan'];
        $response['next_billing'] = $subscription['end_date'];
    }
    
    echo json_encode($response);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // In a real app, you would process payment here
    // For demo, we'll just record the subscription
    
    $startDate = date('Y-m-d');
    $endDate = date('Y-m-d', strtotime('+1 month'));
    
    $stmt = $pdo->prepare("INSERT INTO subscriptions 
                          (user_id, plan, payment_method, start_date, end_date)
                          VALUES (?, ?, ?, ?, ?)");
    $success = $stmt->execute([
        $userId,
        $input['plan'],
        $input['payment_method'],
        $startDate,
        $endDate
    ]);
    
    if ($success) {
        // Update user's subscribed status
        $updateStmt = $pdo->prepare("UPDATE users SET subscribed = TRUE WHERE user_id = ?");
        $updateStmt->execute([$userId]);
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
}
?>
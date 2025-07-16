<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once 'db_connect.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }
    
    $action = $input['action'] ?? '';
    
    if ($action === 'login') {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            throw new Exception('Email and password are required');
        }
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            throw new Exception('Invalid email or password');
        }
        
        if (!password_verify($password, $user['password_hash'])) {
            throw new Exception('Invalid email or password');
        }
        
        // Check trial status
        $trialEnd = date('Y-m-d', strtotime($user['trial_start'] . ' +7 days'));
        $trialExpired = date('Y-m-d') > $trialEnd && !$user['subscribed'];
        
        if ($trialExpired) {
            throw new Exception('Trial period expired. Please subscribe.');
        }
        
        echo json_encode([
            'success' => true,
            'token' => bin2hex(random_bytes(32)),
            'user' => [
                'id' => $user['user_id'],
                'email' => $user['email'],
                'shopName' => $user['shop_name'],
                'mode' => $user['mode'],
                'subscribed' => $user['subscribed']
            ]
        ]);
        exit;
        
    } elseif ($action === 'signup') {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $shopName = $input['shopName'] ?? '';
        $mode = $input['mode'] ?? 'simple';
        
        if (empty($email) || empty($password) || empty($shopName)) {
            throw new Exception('All fields are required');
        }
        
        // Check if email exists
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->fetch()) {
            throw new Exception('Email already registered');
        }
        
        // Create new user
        $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, shop_name, mode, trial_start) VALUES (?, ?, ?, ?, CURDATE())");
        $success = $stmt->execute([
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $shopName,
            $mode
        ]);
        
        if (!$success) {
            throw new Exception('Registration failed');
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful. 7-day trial started.',
            'userId' => $pdo->lastInsertId()
        ]);
        exit;
    } else {
        throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}
?> 
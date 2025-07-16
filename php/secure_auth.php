<?php
session_start();

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Content-Type: application/json');

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db_connect.php';

// CSRF Protection
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Input validation and sanitization
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validatePassword($password) {
    // Password must be at least 6 characters
    return strlen($password) >= 6;
}

// Rate limiting
function checkRateLimit($action, $identifier, $maxAttempts = 5, $timeWindow = 300) {
    $key = "rate_limit_{$action}_{$identifier}";
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = ['attempts' => 0, 'first_attempt' => time()];
    }
    
    $rateLimit = &$_SESSION[$key];
    
    // Reset if time window has passed
    if (time() - $rateLimit['first_attempt'] > $timeWindow) {
        $rateLimit = ['attempts' => 0, 'first_attempt' => time()];
    }
    
    if ($rateLimit['attempts'] >= $maxAttempts) {
        return false;
    }
    
    $rateLimit['attempts']++;
    return true;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }
    
    $action = sanitizeInput($input['action'] ?? '');
    
    if ($action === 'login') {
        // Rate limiting for login attempts
        $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!checkRateLimit('login', $clientIP, 5, 300)) {
            throw new Exception('Too many login attempts. Please try again in 5 minutes.');
        }
        
        $email = sanitizeInput($input['email'] ?? '');
        $password = $input['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            throw new Exception('Email and password are required');
        }
        
        if (!validateEmail($email)) {
            throw new Exception('Invalid email format');
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
        
        // Create secure session
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['shop_name'] = $user['shop_name'];
        $_SESSION['mode'] = $user['mode'];
        $_SESSION['subscribed'] = $user['subscribed'];
        $_SESSION['last_activity'] = time();
        
        // Generate new CSRF token for this session
        generateCSRFToken();
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'csrf_token' => $_SESSION['csrf_token'],
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
        $email = sanitizeInput($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $shopName = sanitizeInput($input['shopName'] ?? '');
        $mode = sanitizeInput($input['mode'] ?? 'simple');
        
        if (empty($email) || empty($password) || empty($shopName)) {
            throw new Exception('All fields are required');
        }
        
        if (!validateEmail($email)) {
            throw new Exception('Invalid email format');
        }
        
        if (!validatePassword($password)) {
            throw new Exception('Password must be at least 6 characters');
        }
        
        if (strlen($shopName) < 2 || strlen($shopName) > 100) {
            throw new Exception('Shop name must be between 2 and 100 characters');
        }
        
        if (!in_array($mode, ['simple', 'detailed'])) {
            throw new Exception('Invalid mode selected');
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
        
    } elseif ($action === 'logout') {
        // Clear session
        session_destroy();
        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
        exit;
        
    } elseif ($action === 'get_csrf_token') {
        echo json_encode([
            'success' => true,
            'csrf_token' => generateCSRFToken()
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
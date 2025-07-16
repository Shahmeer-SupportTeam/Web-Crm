<?php
session_start();

// Session security settings
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');

// Session timeout (30 minutes)
$sessionTimeout = 1800;

// Check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']) && 
           isset($_SESSION['last_activity']) && 
           (time() - $_SESSION['last_activity']) < $GLOBALS['sessionTimeout'];
}

// Check session timeout
function checkSessionTimeout() {
    if (isset($_SESSION['last_activity']) && 
        (time() - $_SESSION['last_activity']) > $GLOBALS['sessionTimeout']) {
        session_destroy();
        return false;
    }
    return true;
}

// Update session activity
function updateSessionActivity() {
    $_SESSION['last_activity'] = time();
}

// Get current user data
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return [
        'user_id' => $_SESSION['user_id'],
        'email' => $_SESSION['email'],
        'shop_name' => $_SESSION['shop_name'],
        'mode' => $_SESSION['mode'],
        'subscribed' => $_SESSION['subscribed']
    ];
}

// Require authentication for protected pages
function requireAuth() {
    if (!isLoggedIn()) {
        header('Location: login.html');
        exit;
    }
    
    if (!checkSessionTimeout()) {
        header('Location: login.html?timeout=1');
        exit;
    }
    
    updateSessionActivity();
}

// Logout function
function logout() {
    session_destroy();
    header('Location: login.html');
    exit;
}

// Generate CSRF token
function getCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Validate CSRF token
function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Sanitize output
function sanitizeOutput($data) {
    if (is_array($data)) {
        return array_map('sanitizeOutput', $data);
    }
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

// Log activity
function logActivity($action, $details = '') {
    if (!isLoggedIn()) return;
    
    $userId = $_SESSION['user_id'];
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    // You can implement logging to database or file here
    error_log("Activity: User $userId performed $action at $timestamp from $ip - $details");
}
?> 
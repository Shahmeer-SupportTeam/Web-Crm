<?php
require_once 'db_connect.php';

// Simple token-based authentication (in production, use JWT)
function authenticateUser($pdo) {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    // In a real app, validate the token properly
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
    
    // For demo, we'll just get the first user (replace with proper token validation)
    $stmt = $pdo->prepare("SELECT * FROM users LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    return $user;
}
?>
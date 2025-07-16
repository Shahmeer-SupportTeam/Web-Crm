<?php
header('Content-Type: application/json');

// Test if the script is accessible
echo json_encode([
    'success' => true,
    'message' => 'Auth endpoint is accessible',
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
]);
?> 
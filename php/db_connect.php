<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'SHAHMEER'); // Replace with your MySQL username
define('DB_PASS', '112003'); // Replace with your MySQL password
define('DB_NAME', 'shopledger');

// Create connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Function to verify password
function verifyPassword($inputPassword, $hashedPassword) {
    return password_verify($inputPassword, $hashedPassword);
}

// Function to hash password
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}
?>
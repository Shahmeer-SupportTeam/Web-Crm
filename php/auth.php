<?php
/**
 * Professional Authentication API
 * Handles login, signup, forgot password, password reset, and Google OAuth
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connect.php';
require_once 'session_manager.php';

class AuthAPI {
    private $pdo;
    private $sessionManager;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->sessionManager = new SessionManager($pdo);
    }

    public function handleRequest() {
try {
    $input = json_decode(file_get_contents('php://input'), true);
    
            if (!$input) {
                throw new Exception('Invalid request data');
    }
    
    $action = $input['action'] ?? '';
    
            switch ($action) {
                case 'login':
                    return $this->login($input);
                case 'signup':
                    return $this->signup($input);
                case 'google_signin':
                    return $this->googleSignIn($input);
                case 'forgot_password':
                    return $this->forgotPassword($input);
                case 'reset_password':
                    return $this->resetPassword($input);
                case 'verify_token':
                    return $this->verifyToken($input);
                case 'logout':
                    return $this->logout($input);
                default:
                    throw new Exception('Invalid action');
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
    
    private function login($data) {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $remember = $data['remember'] ?? false;
        
        if (empty($email) || empty($password)) {
            throw new Exception('Email and password are required');
        }
        
        // Check login attempts
        $this->checkLoginAttempts($email);
        
        // Get user
        $stmt = $this->pdo->prepare("
            SELECT u.*, s.shop_name, s.mode 
            FROM users u 
            LEFT JOIN shops s ON u.shop_id = s.id 
            WHERE u.email = ? AND u.deleted_at IS NULL
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($password, $user['password'])) {
            $this->recordLoginAttempt($email, false);
            throw new Exception('Invalid email or password');
        }
        
        // Check if account is active
        if ($user['status'] !== 'active') {
            throw new Exception('Account is not active. Please contact support.');
        }
        
        // Record successful login
        $this->recordLoginAttempt($email, true);
        
        // Create session
        $sessionData = [
            'user_id' => $user['id'],
            'email' => $user['email'],
            'shop_id' => $user['shop_id'],
            'shop_name' => $user['shop_name'],
            'mode' => $user['mode'],
            'login_method' => 'email'
        ];
        
        $token = $this->sessionManager->createSession($sessionData, $remember);
        
        // Update last login
        $stmt = $this->pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        return $this->successResponse([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'shop_name' => $user['shop_name'],
                'mode' => $user['mode'],
                'login_method' => 'email'
            ]
        ]);
    }
    
    private function signup($data) {
        $email = $data['email'] ?? '';
        $shopName = $data['shopName'] ?? '';
        $password = $data['password'] ?? '';
        $mode = $data['mode'] ?? 'simple';
        
        if (empty($email) || empty($shopName) || empty($password)) {
            throw new Exception('All fields are required');
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }
        
        if (strlen($password) < 8) {
            throw new Exception('Password must be at least 8 characters long');
        }
        
        if (strlen($shopName) < 3) {
            throw new Exception('Shop name must be at least 3 characters long');
        }
        
        // Check if email already exists
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ? AND deleted_at IS NULL");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            throw new Exception('Email already registered');
        }
        
        // Check if shop name already exists
        $stmt = $this->pdo->prepare("SELECT id FROM shops WHERE shop_name = ? AND deleted_at IS NULL");
        $stmt->execute([$shopName]);
        if ($stmt->fetch()) {
            throw new Exception('Shop name already taken');
        }
        
        $this->pdo->beginTransaction();
        
        try {
            // Create shop
            $stmt = $this->pdo->prepare("
                INSERT INTO shops (shop_name, mode, status, created_at) 
                VALUES (?, ?, 'active', NOW())
            ");
            $stmt->execute([$shopName, $mode]);
            $shopId = $this->pdo->lastInsertId();
            
            // Create user
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $this->pdo->prepare("
                INSERT INTO users (email, password, shop_id, status, created_at) 
                VALUES (?, ?, ?, 'active', NOW())
            ");
            $stmt->execute([$email, $hashedPassword, $shopId]);
            $userId = $this->pdo->lastInsertId();
            
            // Create default categories and settings
            $this->createDefaultData($shopId);
            
            $this->pdo->commit();
            
            return $this->successResponse([
                'message' => 'Account created successfully',
                'user_id' => $userId,
                'shop_id' => $shopId
            ]);
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    private function googleSignIn($data) {
        $credential = $data['credential'] ?? '';
        $userData = $data['user'] ?? null;
        
        if (empty($credential) || !$userData) {
            throw new Exception('Invalid Google sign-in data');
        }
        
        // Verify Google token (in production, verify with Google's servers)
        $googleUser = $this->verifyGoogleToken($credential, $userData);
        
        if (!$googleUser) {
            throw new Exception('Invalid Google token');
        }
        
        $email = $googleUser['email'];
        $googleId = $googleUser['sub'];
        $name = $googleUser['name'] ?? '';
        $picture = $googleUser['picture'] ?? '';
        
        // Check if user exists
        $stmt = $this->pdo->prepare("
            SELECT u.*, s.shop_name, s.mode 
            FROM users u 
            LEFT JOIN shops s ON u.shop_id = s.id 
            WHERE u.email = ? AND u.deleted_at IS NULL
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // User exists - log them in
            if ($user['status'] !== 'active') {
                throw new Exception('Account is not active. Please contact support.');
            }
            
            // Update Google ID if not set
            if (empty($user['google_id'])) {
                $stmt = $this->pdo->prepare("UPDATE users SET google_id = ? WHERE id = ?");
                $stmt->execute([$googleId, $user['id']]);
            }
            
        } else {
            // Create new user with Google data
            $this->pdo->beginTransaction();
            
            try {
                // Create shop with Google user's name
                $shopName = $name ? $name . "'s Shop" : "Google User's Shop";
                $stmt = $this->pdo->prepare("
                    INSERT INTO shops (shop_name, mode, status, created_at) 
                    VALUES (?, 'simple', 'active', NOW())
                ");
                $stmt->execute([$shopName]);
                $shopId = $this->pdo->lastInsertId();
                
                // Create user
                $stmt = $this->pdo->prepare("
                    INSERT INTO users (email, google_id, name, avatar, shop_id, status, created_at) 
                    VALUES (?, ?, ?, ?, ?, 'active', NOW())
                ");
                $stmt->execute([$email, $googleId, $name, $picture, $shopId]);
                $userId = $this->pdo->lastInsertId();
                
                // Create default data
                $this->createDefaultData($shopId);
                
                $this->pdo->commit();
                
                // Get the created user
                $stmt = $this->pdo->prepare("
                    SELECT u.*, s.shop_name, s.mode 
                    FROM users u 
                    LEFT JOIN shops s ON u.shop_id = s.id 
                    WHERE u.id = ?
                ");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
            } catch (Exception $e) {
                $this->pdo->rollBack();
                throw $e;
            }
        }
        
        // Create session
        $sessionData = [
            'user_id' => $user['id'],
            'email' => $user['email'],
            'shop_id' => $user['shop_id'],
            'shop_name' => $user['shop_name'],
            'mode' => $user['mode'],
            'login_method' => 'google'
        ];
        
        $token = $this->sessionManager->createSession($sessionData, true);
        
        // Update last login
        $stmt = $this->pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        return $this->successResponse([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'shop_name' => $user['shop_name'],
                'mode' => $user['mode'],
                'login_method' => 'google'
            ]
        ]);
    }
    
    private function verifyGoogleToken($credential, $userData) {
        // In production, you should verify the token with Google's servers
        // For now, we'll trust the client-side verification
        // You should implement proper server-side verification
        
        try {
            // Basic validation
            if (!isset($userData['email']) || !isset($userData['sub'])) {
                return false;
            }
            
            // Check if email is verified
            if (!isset($userData['email_verified']) || !$userData['email_verified']) {
                return false;
            }
            
            return $userData;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function forgotPassword($data) {
        $email = $data['email'] ?? '';
        
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Valid email is required');
        }
        
        // Check if user exists
        $stmt = $this->pdo->prepare("SELECT id, email FROM users WHERE email = ? AND deleted_at IS NULL");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // Don't reveal if email exists or not
            return $this->successResponse(['message' => 'If the email exists, a reset link has been sent']);
        }
        
        // Generate reset token
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Store reset token
        $stmt = $this->pdo->prepare("
            INSERT INTO password_resets (email, token, expires_at, created_at) 
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$email, $token, $expires]);
        
        // In production, send email with reset link
        // For now, we'll just return success
        $resetLink = "login.html?token=" . $token;
        
        return $this->successResponse([
            'message' => 'Password reset link sent to your email',
            'reset_link' => $resetLink // Remove this in production
        ]);
    }
    
    private function resetPassword($data) {
        $token = $data['token'] ?? '';
        $password = $data['password'] ?? '';
        
        if (empty($token) || empty($password)) {
            throw new Exception('Token and password are required');
        }
        
        if (strlen($password) < 8) {
            throw new Exception('Password must be at least 8 characters long');
        }
        
        // Find valid reset token
        $stmt = $this->pdo->prepare("
            SELECT email, expires_at 
            FROM password_resets 
            WHERE token = ? AND used = 0 AND expires_at > NOW()
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$token]);
        $reset = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$reset) {
            throw new Exception('Invalid or expired reset token');
        }
        
        // Update password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
        $stmt->execute([$hashedPassword, $reset['email']]);
        
        // Mark token as used
        $stmt = $this->pdo->prepare("UPDATE password_resets SET used = 1 WHERE token = ?");
        $stmt->execute([$token]);
        
        return $this->successResponse(['message' => 'Password updated successfully']);
    }
    
    private function verifyToken($data) {
        $token = $data['token'] ?? '';
        
        if (empty($token)) {
            throw new Exception('Token is required');
        }
        
        $session = $this->sessionManager->verifySession($token);
        
        if (!$session) {
            throw new Exception('Invalid or expired token');
        }
        
        return $this->successResponse(['session' => $session]);
    }
    
    private function logout($data) {
        $token = $data['token'] ?? '';
        
        if (!empty($token)) {
            $this->sessionManager->destroySession($token);
        }
        
        return $this->successResponse(['message' => 'Logged out successfully']);
    }
    
    private function checkLoginAttempts($email) {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as attempts 
            FROM login_attempts 
            WHERE email = ? AND success = 0 AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->execute([$email]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['attempts'] >= 5) {
            throw new Exception('Too many failed login attempts. Please try again in 15 minutes.');
        }
    }
    
    private function recordLoginAttempt($email, $success) {
        $stmt = $this->pdo->prepare("
            INSERT INTO login_attempts (email, success, ip_address, user_agent, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $email, 
            $success ? 1 : 0, 
            $_SERVER['REMOTE_ADDR'] ?? '', 
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
    }
    
    private function createDefaultData($shopId) {
        // Create default expense categories
        $categories = ['General', 'Marketing', 'Maintenance', 'Insurance', 'Utilities', 'Rent', 'Salaries'];
        $stmt = $this->pdo->prepare("
            INSERT INTO expense_categories (shop_id, name, created_at) 
            VALUES (?, ?, NOW())
        ");
        foreach ($categories as $category) {
            $stmt->execute([$shopId, $category]);
        }
        
        // Create default product categories
        $productCategories = ['General', 'Electronics', 'Clothing', 'Food', 'Books', 'Sports'];
        $stmt = $this->pdo->prepare("
            INSERT INTO product_categories (shop_id, name, created_at) 
            VALUES (?, ?, NOW())
        ");
        foreach ($productCategories as $category) {
            $stmt->execute([$shopId, $category]);
        }
    }
    
    private function successResponse($data) {
        return [
            'success' => true,
            'data' => $data
        ];
    }
    
    private function errorResponse($message) {
        return [
            'success' => false,
            'message' => $message
        ];
    }
}

// Initialize and handle request
try {
    $pdo = getConnection();
    $authAPI = new AuthAPI($pdo);
    $result = $authAPI->handleRequest();
    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
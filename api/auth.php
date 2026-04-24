<?php
/**
 * Authentication API
 * Handles user login, registration, logout
 */

require_once __DIR__ . '/Api.php';

$request = getRequestData();
$action = isset($request['action']) ? $request['action'] : '';

$db = new Database();
$conn = $db->connect();

switch($action) {
  case 'register':
    handleRegister($conn, $request);
    break;

  case 'login':
    handleLogin($conn, $request);
    break;

  case 'logout':
    handleLogout();
    break;

  case 'getUser':
    handleGetUser($conn, $request);
    break;

  case 'updateProfile':
    handleUpdateProfile($conn, $request);
    break;

  default:
    sendResponse(false, 'Invalid action', null, 400);
}

/**
 * Register new user
 */
function handleRegister($conn, $data) {
  $user = new User($conn);

  // Validate required fields
  if(empty($data['email']) || empty($data['password']) || empty($data['fullName'])) {
    sendResponse(false, 'Missing required fields', null, 400);
  }

  // Check if email already exists
  $checkQuery = 'SELECT id FROM users WHERE email = :email LIMIT 1';
  $stmt = $conn->prepare($checkQuery);
  $stmt->bindParam(':email', $data['email']);
  $stmt->execute();

  if($stmt->rowCount() > 0) {
    sendResponse(false, 'Email already registered', null, 409);
  }

  // Validate password length
  if(strlen($data['password']) < 6) {
    sendResponse(false, 'Password must be at least 6 characters', null, 400);
  }

  // Set user properties
  $user->email = $data['email'];
  $user->password = $data['password'];
  $user->fullName = $data['fullName'];
  $user->university = isset($data['university']) ? $data['university'] : '';

  if($user->register()) {
    $userId = $conn->lastInsertId();
    sendResponse(true, 'Registration successful', ['userId' => $userId, 'email' => $data['email']], 201);
  } else {
    sendResponse(false, 'Registration failed', null, 500);
  }
}

/**
 * Login user
 */
function handleLogin($conn, $data) {
  if(empty($data['email']) || empty($data['password'])) {
    sendResponse(false, 'Email and password required', null, 400);
  }

  $user = new User($conn);
  $user->email = $data['email'];
  $user->password = $data['password'];

  $result = $user->login();

  if($result) {
    // Generate session token
    $token = bin2hex(random_bytes(32));
    
    // Store token in session or database
    // For now, we'll just return the token
    
    // Update last login
    $updateQuery = 'UPDATE users SET lastLogin = NOW() WHERE id = :id';
    $stmt = $conn->prepare($updateQuery);
    $stmt->bindParam(':id', $result['id']);
    $stmt->execute();

    // Remove password from result
    unset($result['password']);

    sendResponse(true, 'Login successful', [
      'user' => $result,
      'token' => $token
    ], 200);
  } else {
    sendResponse(false, 'Invalid email or password', null, 401);
  }
}

/**
 * Logout user
 */
function handleLogout() {
  sendResponse(true, 'Logout successful', null, 200);
}

/**
 * Get user profile
 */
function handleGetUser($conn, $data) {
  if(empty($data['userId'])) {
    sendResponse(false, 'User ID required', null, 400);
  }

  $user = new User($conn);
  $userData = $user->getUserById($data['userId']);

  if($userData) {
    sendResponse(true, 'User found', $userData, 200);
  } else {
    sendResponse(false, 'User not found', null, 404);
  }
}

/**
 * Update user profile
 */
function handleUpdateProfile($conn, $data) {
  if(empty($data['userId']) || empty($data['updates'])) {
    sendResponse(false, 'User ID and updates required', null, 400);
  }

  $user = new User($conn);
  
  if($user->updateProfile($data['userId'], $data['updates'])) {
    $updatedUser = $user->getUserById($data['userId']);
    sendResponse(true, 'Profile updated', $updatedUser, 200);
  } else {
    sendResponse(false, 'Update failed', null, 500);
  }
}

?>

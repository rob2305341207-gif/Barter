<?php
/**
 * API Endpoints Setup
 * Base API file with CORS and common functions
 */

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

if($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
  http_response_code(200);
  exit();
}

require_once __DIR__ . '/../api/Database.php';

/**
 * Send JSON response
 */
function sendResponse($success, $message = '', $data = null, $httpCode = 200) {
  http_response_code($httpCode);
  echo json_encode([
    'success' => $success,
    'message' => $message,
    'data' => $data
  ]);
  exit();
}

/**
 * Get request data (JSON or POST)
 */
function getRequestData() {
  if($_SERVER['REQUEST_METHOD'] == 'POST' || $_SERVER['REQUEST_METHOD'] == 'PUT') {
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if(strpos($contentType, 'application/json') !== false) {
      return json_decode(file_get_contents("php://input"), true);
    }
    return $_POST;
  }
  return $_GET;
}

/**
 * Validate token/session
 */
function validateSession() {
  $headers = getallheaders();
  
  if(!isset($headers['Authorization'])) {
    sendResponse(false, 'Authorization header missing', null, 401);
  }

  $token = str_replace('Bearer ', '', $headers['Authorization']);
  
  // Validate token (simple session validation - in production use JWT)
  if(!$token || strlen($token) < 10) {
    sendResponse(false, 'Invalid token', null, 401);
  }

  return $token;
}

?>

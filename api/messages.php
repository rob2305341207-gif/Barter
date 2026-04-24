<?php
/**
 * Messages API
 * Handles sending and retrieving messages
 */

require_once __DIR__ . '/Api.php';

$request = getRequestData();
$action = isset($request['action']) ? $request['action'] : '';

$db = new Database();
$conn = $db->connect();

switch($action) {
  case 'sendMessage':
  case 'send':
    handleSendMessage($conn, $request);
    break;

  case 'getMessages':
  case 'getConversation':
    handleGetConversation($conn, $request);
    break;

  case 'getContacts':
    handleGetContacts($conn, $request);
    break;

  case 'markAsRead':
    handleMarkAsRead($conn, $request);
    break;

  default:
    sendResponse(false, 'Invalid action', null, 400);
}

/**
 * Send message
 */
function handleSendMessage($conn, $data) {
  // Support both 'receiverId' and 'recipientId' parameter names
  $receiverId = isset($data['receiverId']) ? $data['receiverId'] : (isset($data['recipientId']) ? $data['recipientId'] : '');
  
  if(empty($data['senderId']) || empty($receiverId) || empty($data['text'])) {
    sendResponse(false, 'Missing required fields: senderId, receiverId/recipientId, text', null, 400);
  }

  $message = new Message($conn);
  
  // Sanitize message text
  $text = trim($data['text']);
  if(strlen($text) > 5000) {
    sendResponse(false, 'Message too long (max 5000 characters)', null, 400);
  }

  if($message->save($data['senderId'], $receiverId, $text)) {
    sendResponse(true, 'Message sent', ['timestamp' => date('c')], 201);
  } else {
    sendResponse(false, 'Failed to send message', null, 500);
  }
}

/**
 * Get conversation
 */
function handleGetConversation($conn, $data) {
  // Support both 'userId1/userId2' and 'senderId/recipientId' parameter names
  $userId1 = isset($data['userId1']) ? $data['userId1'] : (isset($data['senderId']) ? $data['senderId'] : '');
  $userId2 = isset($data['userId2']) ? $data['userId2'] : (isset($data['recipientId']) ? $data['recipientId'] : '');
  
  if(empty($userId1) || empty($userId2)) {
    sendResponse(false, 'Both user IDs required', null, 400);
  }

  $limit = isset($data['limit']) ? intval($data['limit']) : 50;
  $message = new Message($conn);
  $messages = $message->getConversation($userId1, $userId2, $limit);

  sendResponse(true, 'Conversation retrieved', $messages, 200);
}

/**
 * Get contacts list
 */
function handleGetContacts($conn, $data) {
  if(empty($data['userId'])) {
    sendResponse(false, 'User ID required', null, 400);
  }

  $limit = isset($data['limit']) ? intval($data['limit']) : 50;
  $message = new Message($conn);
  $contacts = $message->getContacts($data['userId'], $limit);

  sendResponse(true, 'Contacts retrieved', $contacts, 200);
}

/**
 * Mark message as read
 */
function handleMarkAsRead($conn, $data) {
  if(empty($data['messageId'])) {
    sendResponse(false, 'Message ID required', null, 400);
  }

  $message = new Message($conn);
  
  if($message->markAsRead($data['messageId'])) {
    sendResponse(true, 'Message marked as read', null, 200);
  } else {
    sendResponse(false, 'Failed to mark message', null, 500);
  }
}

?>

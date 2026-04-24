<?php
/**
 * Users API
 * Handles user search and discovery
 */

require_once __DIR__ . '/Api.php';

$request = getRequestData();
$action = isset($request['action']) ? $request['action'] : '';

$db = new Database();
$conn = $db->connect();

switch($action) {
  case 'getUser':
    handleGetUser($conn, $request);
    break;

  case 'getAllUsers':
    handleGetAllUsers($conn, $request);
    break;

  case 'search':
    handleSearchUsers($conn, $request);
    break;

  case 'getMatches':
    handleGetMatches($conn, $request);
    break;

  case 'getUserTeams':
    handleGetUserTeams($conn, $request);
    break;

  case 'updateProfile':
    handleUpdateProfile($conn, $request);
    break;

  case 'deleteUser':
    handleDeleteUser($conn, $request);
    break;

  case 'createTeam':
    handleCreateTeam($conn, $request);
    break;

  case 'addReview':
    handleAddReview($conn, $request);
    break;

  case 'getReviews':
    handleGetReviews($conn, $request);
    break;

  case 'getSkills':
    handleGetSkills($conn);
    break;

  default:
    sendResponse(false, 'Invalid action', null, 400);
}

/**
 * Search users
 */
function handleSearchUsers($conn, $data) {
  if(empty($data['search'])) {
    sendResponse(false, 'Search term required', null, 400);
  }

  $limit = isset($data['limit']) ? intval($data['limit']) : 20;
  $user = new User($conn);
  $results = $user->searchUsers($data['search'], $limit);

  sendResponse(true, 'Users found', $results, 200);
}

/**
 * Get matches for user
 */
function handleGetMatches($conn, $data) {
  if(empty($data['userId'])) {
    sendResponse(false, 'User ID required', null, 400);
  }

  $limit = isset($data['limit']) ? intval($data['limit']) : 10;
  $match = new UserMatch($conn);
  $matches = $match->findMatches($data['userId'], $limit);

  sendResponse(true, 'Matches found', $matches, 200);
}

/**
 * Add review for user
 */
function handleAddReview($conn, $data) {
  $required = ['reviewerId', 'reviewedUserId', 'rating'];
  foreach($required as $field) {
    if(empty($data[$field])) {
      sendResponse(false, "Missing required field: $field", null, 400);
    }
  }

  $rating = intval($data['rating']);
  if($rating < 1 || $rating > 5) {
    sendResponse(false, 'Rating must be between 1 and 5', null, 400);
  }

  $review = new Review($conn);
  $comment = isset($data['comment']) ? trim($data['comment']) : '';

  if($review->addReview($data['reviewerId'], $data['reviewedUserId'], $rating, $comment)) {
    sendResponse(true, 'Review added', null, 201);
  } else {
    sendResponse(false, 'Failed to add review', null, 500);
  }
}

/**
 * Get reviews for user
 */
function handleGetReviews($conn, $data) {
  if(empty($data['userId'])) {
    sendResponse(false, 'User ID required', null, 400);
  }

  $review = new Review($conn);
  $reviews = $review->getUserReviews($data['userId']);
  $avgRating = $review->getAverageRating($data['userId']);

  sendResponse(true, 'Reviews retrieved', [
    'reviews' => $reviews,
    'averageRating' => $avgRating['avgRating'],
    'totalReviews' => $avgRating['totalReviews']
  ], 200);
}

/**
 * Get all skills
 */
function handleGetSkills($conn) {
  $skill = new Skill($conn);
  $skills = $skill->getAllSkills();

  sendResponse(true, 'Skills retrieved', $skills, 200);
}

/**
 * Get single user by ID
 */
function handleGetUser($conn, $data) {
  if(empty($data['userId'])) {
    sendResponse(false, 'User ID required', null, 400);
  }

  $user = new User($conn);
  $userData = $user->getUserById($data['userId']);

  if($userData) {
    sendResponse(true, 'User retrieved', $userData, 200);
  } else {
    sendResponse(false, 'User not found', null, 404);
  }
}

/**
 * Get all users (excluding current user)
 */
function handleGetAllUsers($conn, $data) {
  $currentUserId = isset($data['userId']) ? $data['userId'] : '';
  $user = new User($conn);
  $users = $user->getAllUsers();

  // Filter out current user if provided
  if(!empty($currentUserId)) {
    $users = array_filter($users, function($u) use ($currentUserId) {
      return $u['id'] != $currentUserId;
    });
  }

  sendResponse(true, 'Users retrieved', array_values($users), 200);
}

/**
 * Get user teams
 */
function handleGetUserTeams($conn, $data) {
  if(empty($data['userId'])) {
    sendResponse(false, 'User ID required', null, 400);
  }

  try {
    $query = "SELECT t.*, COUNT(tm.memberId) as memberCount 
              FROM teams t 
              LEFT JOIN team_members tm ON t.id = tm.teamId 
              WHERE t.createdBy = :userId 
              GROUP BY t.id 
              ORDER BY t.createdAt DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':userId', $data['userId']);
    $stmt->execute();
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(true, 'Teams retrieved', $teams, 200);
  } catch(Exception $e) {
    sendResponse(false, 'Failed to retrieve teams', null, 500);
  }
}

/**
 * Update user profile
 */
function handleUpdateProfile($conn, $data) {
  if(empty($data['userId'])) {
    sendResponse(false, 'User ID required', null, 400);
  }

  try {
    $updates = [];
    $params = [':userId' => $data['userId']];

    if(isset($data['bio'])) {
      $updates[] = 'bio = :bio';
      $params[':bio'] = trim($data['bio']);
    }
    if(isset($data['fullName'])) {
      $updates[] = 'fullName = :fullName';
      $params[':fullName'] = trim($data['fullName']);
    }
    if(isset($data['university'])) {
      $updates[] = 'university = :university';
      $params[':university'] = trim($data['university']);
    }
    if(isset($data['skills'])) {
      // Handle skills separately if needed
      $updates[] = 'skills = :skills';
      $params[':skills'] = json_encode($data['skills']);
    }
    if(isset($data['interests'])) {
      // Handle interests separately if needed
      $updates[] = 'interests = :interests';
      $params[':interests'] = json_encode($data['interests']);
    }

    if(empty($updates)) {
      sendResponse(false, 'No fields to update', null, 400);
    }

    $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :userId";
    $stmt = $conn->prepare($query);
    
    foreach($params as $key => $value) {
      $stmt->bindValue($key, $value);
    }
    
    if($stmt->execute()) {
      $user = new User($conn);
      $updatedUser = $user->getUserById($data['userId']);
      sendResponse(true, 'Profile updated', $updatedUser, 200);
    } else {
      sendResponse(false, 'Failed to update profile', null, 500);
    }
  } catch(Exception $e) {
    sendResponse(false, 'Error updating profile: ' . $e->getMessage(), null, 500);
  }
}

/**
 * Delete user account
 */
function handleDeleteUser($conn, $data) {
  if(empty($data['userId'])) {
    sendResponse(false, 'User ID required', null, 400);
  }

  try {
    $conn->beginTransaction();

    // Delete all user related data
    $queries = [
      "DELETE FROM messages WHERE senderId = :userId OR recipientId = :userId",
      "DELETE FROM reviews WHERE reviewerId = :userId OR reviewedUserId = :userId",
      "DELETE FROM matches WHERE userId1 = :userId OR userId2 = :userId",
      "DELETE FROM team_members WHERE memberId = :userId",
      "DELETE FROM teams WHERE createdBy = :userId",
      "DELETE FROM user_teaching_skills WHERE userId = :userId",
      "DELETE FROM user_learning_interests WHERE userId = :userId",
      "DELETE FROM users WHERE id = :userId"
    ];

    foreach($queries as $query) {
      $stmt = $conn->prepare($query);
      $stmt->bindParam(':userId', $data['userId']);
      $stmt->execute();
    }

    $conn->commit();
    sendResponse(true, 'User account deleted', null, 200);
  } catch(Exception $e) {
    $conn->rollBack();
    sendResponse(false, 'Failed to delete account: ' . $e->getMessage(), null, 500);
  }
}

/**
 * Create team
 */
function handleCreateTeam($conn, $data) {
  $required = ['name', 'createdBy'];
  foreach($required as $field) {
    if(empty($data[$field])) {
      sendResponse(false, "Missing required field: $field", null, 400);
    }
  }

  try {
    $query = "INSERT INTO teams (name, description, teamType, createdBy, status, createdAt, skillsNeeded, teamSize, deadline, university, requireResume, autoMatch, isPublic)
              VALUES (:name, :description, :type, :createdBy, :status, NOW(), :skillsNeeded, :teamSize, :deadline, :university, :requireResume, :autoMatch, :isPublic)";
    
    $stmt = $conn->prepare($query);
    
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':description', isset($data['description']) ? $data['description'] : '');
    $stmt->bindParam(':type', isset($data['type']) ? $data['type'] : 'hackathon');
    $stmt->bindParam(':createdBy', $data['createdBy']);
    $stmt->bindParam(':status', isset($data['status']) ? $data['status'] : 'active');
    $stmt->bindParam(':skillsNeeded', isset($data['skillsNeeded']) ? json_encode($data['skillsNeeded']) : '[]');
    $stmt->bindParam(':teamSize', isset($data['teamSize']) ? $data['teamSize'] : 5);
    $stmt->bindParam(':deadline', isset($data['deadline']) ? $data['deadline'] : null);
    $stmt->bindParam(':university', isset($data['university']) ? $data['university'] : '');
    $stmt->bindParam(':requireResume', isset($data['requireResume']) ? ($data['requireResume'] ? 1 : 0) : 0);
    $stmt->bindParam(':autoMatch', isset($data['autoMatch']) ? ($data['autoMatch'] ? 1 : 0) : 0);
    $stmt->bindParam(':isPublic', isset($data['isPublic']) ? ($data['isPublic'] ? 1 : 0) : 1);
    
    if($stmt->execute()) {
      $teamId = $conn->lastInsertId();
      
      // Add creator as team member
      $memberQuery = "INSERT INTO team_members (teamId, memberId) VALUES (:teamId, :memberId)";
      $memberStmt = $conn->prepare($memberQuery);
      $memberStmt->bindParam(':teamId', $teamId);
      $memberStmt->bindParam(':memberId', $data['createdBy']);
      $memberStmt->execute();
      
      sendResponse(true, 'Team created successfully', ['teamId' => $teamId], 201);
    } else {
      sendResponse(false, 'Failed to create team', null, 500);
    }
  } catch(Exception $e) {
    sendResponse(false, 'Error creating team: ' . $e->getMessage(), null, 500);
  }
}

?>

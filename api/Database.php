<?php
/**
 * Database Configuration and Connection
 * For XAMPP MySQL
 */

class Database {
  private $host = 'localhost';
  private $db_name = 'barter';
  private $user = 'root';
  private $password = '';
  private $conn;

  /**
   * Connect to database
   */
  public function connect() {
    $this->conn = null;

    try {
      $this->conn = new PDO(
        'mysql:host=' . $this->host . ';dbname=' . $this->db_name,
        $this->user,
        $this->password
      );
      $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch(PDOException $e) {
      echo 'Connection Error: ' . $e->getMessage();
    }

    return $this->conn;
  }
}

/**
 * User Model
 */
class User {
  private $conn;
  private $table = 'users';

  public $id;
  public $email;
  public $password;
  public $fullName;
  public $university;
  public $bio;
  public $rating;
  public $verified;

  public function __construct($db) {
    $this->conn = $db;
  }

  /**
   * Register user
   */
  public function register() {
    $query = 'INSERT INTO ' . $this->table . '
              (email, password, fullName, university)
              VALUES (:email, :password, :fullName, :university)';

    $stmt = $this->conn->prepare($query);

    // Hash password
    $hashedPassword = password_hash($this->password, PASSWORD_BCRYPT);

    $stmt->bindParam(':email', $this->email);
    $stmt->bindParam(':password', $hashedPassword);
    $stmt->bindParam(':fullName', $this->fullName);
    $stmt->bindParam(':university', $this->university);

    if($stmt->execute()) {
      return true;
    }
    return false;
  }

  /**
   * Login user
   */
  public function login() {
    $query = 'SELECT id, email, password, fullName, university, bio, rating, verified
              FROM ' . $this->table . '
              WHERE email = :email AND isActive = TRUE
              LIMIT 1';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':email', $this->email);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      if(password_verify($this->password, $row['password'])) {
        return $row;
      }
    }
    return false;
  }

  /**
   * Get user by ID
   */
  public function getUserById($id) {
    $query = 'SELECT id, email, fullName, university, bio, rating, verified, createdAt
              FROM ' . $this->table . '
              WHERE id = :id AND isActive = TRUE
              LIMIT 1';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    return $stmt->fetch(PDO::FETCH_ASSOC);
  }

  /**
   * Update user profile
   */
  public function updateProfile($id, $data) {
    $updateFields = [];
    $params = [':id' => $id];

    foreach($data as $key => $value) {
      $updateFields[] = "$key = :$key";
      $params[":$key"] = $value;
    }

    $query = 'UPDATE ' . $this->table . '
              SET ' . implode(', ', $updateFields) . '
              WHERE id = :id';

    $stmt = $this->conn->prepare($query);
    return $stmt->execute($params);
  }

  /**
   * Search users
   */
  public function searchUsers($searchTerm, $limit = 20) {
    $query = 'SELECT id, fullName, email, university, rating, bio
              FROM ' . $this->table . '
              WHERE (fullName LIKE :search OR university LIKE :search OR email LIKE :search)
              AND isActive = TRUE
              LIMIT :limit';

    $stmt = $this->conn->prepare($query);
    $searchTerm = '%' . $searchTerm . '%';
    $stmt->bindParam(':search', $searchTerm);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  /**
   * Get all users
   */
  public function getAllUsers($limit = 100) {
    $query = 'SELECT id, fullName, email, university, bio, rating, verified, skills, interests
              FROM ' . $this->table . '
              WHERE isActive = TRUE
              ORDER BY fullName ASC
              LIMIT :limit';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }
}

/**
 * Message Model
 */
class Message {
  private $conn;
  private $table = 'messages';

  public function __construct($db) {
    $this->conn = $db;
  }

  /**
   * Save message
   */
  public function save($senderId, $receiverId, $text) {
    $query = 'INSERT INTO ' . $this->table . '
              (senderId, receiverId, text)
              VALUES (:senderId, :receiverId, :text)';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':senderId', $senderId);
    $stmt->bindParam(':receiverId', $receiverId);
    $stmt->bindParam(':text', $text);

    return $stmt->execute();
  }

  /**
   * Get conversation between two users
   */
  public function getConversation($userId1, $userId2, $limit = 50) {
    $query = 'SELECT * FROM ' . $this->table . '
              WHERE (senderId = :userId1 AND receiverId = :userId2)
              OR (senderId = :userId2 AND receiverId = :userId1)
              ORDER BY createdAt DESC
              LIMIT :limit';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':userId1', $userId1);
    $stmt->bindParam(':userId2', $userId2);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  /**
   * Get contacts list (people user has messaged)
   */
  public function getContacts($userId, $limit = 50) {
    $query = 'SELECT DISTINCT u.id, u.fullName, u.email, u.university, u.rating
              FROM users u
              WHERE u.id IN (
                SELECT DISTINCT CASE 
                  WHEN senderId = :userId THEN receiverId
                  ELSE senderId
                END as contactId
                FROM messages
                WHERE senderId = :userId OR receiverId = :userId
              )
              AND u.id != :userId
              LIMIT :limit';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  /**
   * Mark message as read
   */
  public function markAsRead($messageId) {
    $query = 'UPDATE ' . $this->table . '
              SET isRead = TRUE
              WHERE id = :id';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':id', $messageId);
    return $stmt->execute();
  }
}

/**
 * Skill Model
 */
class Skill {
  private $conn;
  private $table = 'skills';

  public function __construct($db) {
    $this->conn = $db;
  }

  /**
   * Get all skills
   */
  public function getAllSkills() {
    $query = 'SELECT id, name, category FROM ' . $this->table . ' ORDER BY name';
    $stmt = $this->conn->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  /**
   * Search skills
   */
  public function searchSkills($searchTerm) {
    $query = 'SELECT id, name, category FROM ' . $this->table . '
              WHERE name LIKE :search
              ORDER BY name
              LIMIT 20';

    $stmt = $this->conn->prepare($query);
    $searchTerm = '%' . $searchTerm . '%';
    $stmt->bindParam(':search', $searchTerm);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }
}

/**
 * Match Model (for finding complementary users)
 */
class UserMatch {
  private $conn;
  private $table = 'matches';

  public function __construct($db) {
    $this->conn = $db;
  }

  /**
   * Find matches for a user
   */
  public function findMatches($userId, $limit = 10) {
    $query = 'SELECT 
                u.id, u.fullName, u.email, u.university, u.rating, u.bio,
                COUNT(DISTINCT CASE WHEN uts.skillId IN (
                  SELECT skillId FROM user_learning_interests WHERE userId = :userId
                ) THEN uts.skillId END) as commonTeachingSkills
              FROM users u
              LEFT JOIN user_teaching_skills uts ON u.id = uts.userId
              WHERE u.id != :userId 
              AND u.isActive = TRUE
              GROUP BY u.id
              ORDER BY commonTeachingSkills DESC, u.rating DESC
              LIMIT :limit';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  /**
   * Save a match
   */
  public function saveMatch($userId1, $userId2, $score, $reason) {
    $query = 'INSERT INTO ' . $this->table . '
              (userId1, userId2, matchScore, reason)
              VALUES (:userId1, :userId2, :score, :reason)
              ON DUPLICATE KEY UPDATE matchScore = :score, reason = :reason';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':userId1', $userId1);
    $stmt->bindParam(':userId2', $userId2);
    $stmt->bindParam(':score', $score);
    $stmt->bindParam(':reason', $reason);

    return $stmt->execute();
  }
}

/**
 * Review Model
 */
class Review {
  private $conn;
  private $table = 'reviews';

  public function __construct($db) {
    $this->conn = $db;
  }

  /**
   * Add review
   */
  public function addReview($reviewerId, $reviewedUserId, $rating, $comment) {
    $query = 'INSERT INTO ' . $this->table . '
              (reviewerId, reviewedUserId, rating, comment)
              VALUES (:reviewerId, :reviewedUserId, :rating, :comment)
              ON DUPLICATE KEY UPDATE rating = :rating, comment = :comment';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':reviewerId', $reviewerId);
    $stmt->bindParam(':reviewedUserId', $reviewedUserId);
    $stmt->bindParam(':rating', $rating);
    $stmt->bindParam(':comment', $comment);

    return $stmt->execute();
  }

  /**
   * Get user reviews
   */
  public function getUserReviews($userId) {
    $query = 'SELECT r.*, u.fullName as reviewerName
              FROM ' . $this->table . ' r
              JOIN users u ON r.reviewerId = u.id
              WHERE r.reviewedUserId = :userId
              ORDER BY r.createdAt DESC';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  /**
   * Get average rating
   */
  public function getAverageRating($userId) {
    $query = 'SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews
              FROM ' . $this->table . '
              WHERE reviewedUserId = :userId';

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->execute();

    return $stmt->fetch(PDO::FETCH_ASSOC);
  }
}

?>

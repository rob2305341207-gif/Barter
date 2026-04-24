-- ============================================
-- BARTER - Skill Exchange Platform Database
-- MySQL Database Schema
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  university VARCHAR(255),
  bio TEXT,
  profilePhoto LONGBLOB,
  rating DECIMAL(3,2) DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastLogin TIMESTAMP NULL,
  isActive BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email),
  INDEX idx_createdAt (createdAt),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. SKILLS TABLE (Skill Dictionary)
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. USER TEACHING SKILLS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS user_teaching_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  skillId INT NOT NULL,
  proficiencyLevel ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Beginner',
  yearsOfExperience INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skillId) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_skill (userId, skillId),
  INDEX idx_userId (userId),
  INDEX idx_skillId (skillId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. USER LEARNING INTERESTS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS user_learning_interests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  skillId INT NOT NULL,
  priority INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skillId) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_interest (userId, skillId),
  INDEX idx_userId (userId),
  INDEX idx_skillId (skillId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  senderId INT NOT NULL,
  receiverId INT NOT NULL,
  text LONGTEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_senderId (senderId),
  INDEX idx_receiverId (receiverId),
  INDEX idx_conversation (senderId, receiverId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. REVIEWS & RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reviewerId INT NOT NULL,
  reviewedUserId INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  skillId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewedUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skillId) REFERENCES skills(id) ON DELETE SET NULL,
  UNIQUE KEY unique_review (reviewerId, reviewedUserId),
  INDEX idx_reviewedUserId (reviewedUserId),
  INDEX idx_rating (rating),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creatorId INT NOT NULL,
  maxMembers INT DEFAULT 10,
  skillFocus INT,
  status ENUM('Active', 'Inactive', 'Archived') DEFAULT 'Active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skillFocus) REFERENCES skills(id) ON DELETE SET NULL,
  INDEX idx_creatorId (creatorId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teamId INT NOT NULL,
  userId INT NOT NULL,
  role ENUM('Creator', 'Admin', 'Member') DEFAULT 'Member',
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_user (teamId, userId),
  INDEX idx_teamId (teamId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. COMPETITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  skillId INT,
  creatorId INT NOT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  maxParticipants INT,
  prize VARCHAR(255),
  status ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (skillId) REFERENCES skills(id) ON DELETE SET NULL,
  FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_skillId (skillId),
  INDEX idx_creatorId (creatorId),
  INDEX idx_status (status),
  INDEX idx_startDate (startDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. COMPETITION PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competition_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  competitionId INT NOT NULL,
  userId INT NOT NULL,
  rank INT,
  score INT,
  registeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competitionId) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_competition_user (competitionId, userId),
  INDEX idx_competitionId (competitionId),
  INDEX idx_userId (userId),
  INDEX idx_rank (rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. MATCHES/CONNECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId1 INT NOT NULL,
  userId2 INT NOT NULL,
  matchScore DECIMAL(3,2),
  commonSkills JSON,
  reason VARCHAR(255),
  status ENUM('Suggested', 'Connected', 'Blocked') DEFAULT 'Suggested',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId1) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (userId2) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_match (userId1, userId2),
  INDEX idx_userId1 (userId1),
  INDEX idx_userId2 (userId2),
  INDEX idx_matchScore (matchScore),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type ENUM('Message', 'TeamInvite', 'CompetitionUpdate', 'Review', 'Match') DEFAULT 'Message',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  relatedUserId INT,
  relatedTeamId INT,
  relatedCompetitionId INT,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (relatedUserId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (relatedTeamId) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (relatedCompetitionId) REFERENCES competitions(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_isRead (isRead),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample skills
INSERT INTO skills (name, category, description) VALUES
('Web Development', 'Technology', 'HTML, CSS, JavaScript, Responsive Design'),
('Python Programming', 'Technology', 'Python, Data Science, Automation'),
('UI/UX Design', 'Design', 'User Interface and User Experience Design'),
('Digital Marketing', 'Business', 'SEO, Social Media, Content Marketing'),
('Graphic Design', 'Design', 'Logo Design, Branding, Visual Communication'),
('Content Writing', 'Communication', 'Blog Writing, Copywriting, Technical Writing'),
('Video Editing', 'Media', 'Video Production, Motion Graphics'),
('Mobile App Development', 'Technology', 'iOS and Android Development'),
('Data Analysis', 'Technology', 'Data Visualization, Excel, SQL'),
('Public Speaking', 'Communication', 'Presentation, Storytelling, Communication Skills');

-- Sample users (with bcrypt hashed passwords - for production use bcrypt)
INSERT INTO users (email, password, fullName, university, bio, rating) VALUES
('user1@example.com', '$2y$10$abcdef...', 'Arif Khan', 'AIUB', 'Full stack web developer', 4.5),
('user2@example.com', '$2y$10$ghijkl...', 'Fatima Ahmed', 'DU', 'UI/UX Designer', 4.8),
('user3@example.com', '$2y$10$mnopqr...', 'Karim Hassan', 'BUET', 'Python enthusiast', 4.2);

-- ============================================
-- USEFUL QUERIES FOR FRONTEND
-- ============================================

-- Find matches for a user (users with complementary skills)
-- SELECT u.id, u.fullName, u.email, u.rating, 
--        COUNT(DISTINCT uts.skillId) as commonTeachingSkills,
--        COUNT(DISTINCT uli.skillId) as commonInterests
-- FROM users u
-- JOIN user_teaching_skills uts ON uts.skillId IN (
--   SELECT skillId FROM user_learning_interests WHERE userId = ?
-- )
-- JOIN user_learning_interests uli ON uli.skillId IN (
--   SELECT skillId FROM user_teaching_skills WHERE userId = ?
-- )
-- WHERE u.id != ? AND uts.userId = u.id AND uli.userId = u.id
-- GROUP BY u.id
-- ORDER BY (COUNT(DISTINCT uts.skillId) + COUNT(DISTINCT uli.skillId)) DESC;

-- Get user profile with all details
-- SELECT u.*, 
--        JSON_ARRAYAGG(DISTINCT JSON_OBJECT('skill', s.name, 'level', uts.proficiencyLevel)) as teachingSkills,
--        JSON_ARRAYAGG(DISTINCT JSON_OBJECT('skill', s.name)) as learningInterests,
--        AVG(r.rating) as avgRating,
--        COUNT(DISTINCT r.id) as totalReviews
-- FROM users u
-- LEFT JOIN user_teaching_skills uts ON u.id = uts.userId
-- LEFT JOIN skills s ON uts.skillId = s.id
-- LEFT JOIN user_learning_interests uli ON u.id = uli.userId
-- LEFT JOIN reviews r ON u.id = r.reviewedUserId
-- WHERE u.id = ?
-- GROUP BY u.id;

-- Get recent messages between two users
-- SELECT * FROM messages 
-- WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
-- ORDER BY createdAt DESC LIMIT 50;

-- Get user's teams with member count
-- SELECT t.*, u.fullName as creatorName, COUNT(DISTINCT tm.userId) as memberCount
-- FROM teams t
-- JOIN users u ON t.creatorId = u.id
-- LEFT JOIN team_members tm ON t.id = tm.teamId
-- WHERE t.id IN (SELECT teamId FROM team_members WHERE userId = ?)
-- GROUP BY t.id;

-- Get notifications for user
-- SELECT * FROM notifications 
-- WHERE userId = ? 
-- ORDER BY createdAt DESC LIMIT 20;

# Barter - Database Setup Guide

## Overview
Barter is transitioning from localStorage to a proper MySQL database for better scalability and data management. This guide explains how to set up and use the database.

---

## 📋 Database Schema

### Tables Created:
1. **users** - User accounts and profiles
2. **skills** - Skill dictionary (reusable skills)
3. **user_teaching_skills** - Skills users can teach (many-to-many)
4. **user_learning_interests** - Skills users want to learn (many-to-many)
5. **messages** - Private messages between users
6. **reviews** - User reviews and ratings
7. **teams** - Team/group information
8. **team_members** - Team membership and roles
9. **competitions** - Competitions/contests
10. **competition_participants** - Competition registrations
11. **matches** - User matches based on complementary skills
12. **notifications** - User notifications

---

## 🔧 Setup Instructions

### Step 1: Run Database Setup Script
1. Start XAMPP (Apache + MySQL)
2. Visit: `http://localhost/Skill%20Exchange%20Server/api/setup.php`
3. This will automatically:
   - Create the `barter` database
   - Create all 12 tables
   - Insert sample skills data

### Step 2: Update Database Credentials (if needed)
Edit `/api/Database.php`:
```php
private $host = 'localhost';
private $db_name = 'barter';
private $user = 'root';        // Your MySQL username
private $password = '';         // Your MySQL password
```

### Step 3: Verify Setup
Test the API endpoint:
```
GET http://localhost/Skill%20Exchange%20Server/api/users.php?action=getSkills
```

Should return a JSON list of available skills.

---

## 🚀 API Endpoints

### Authentication API (`/api/auth.php`)

#### Register User
```json
POST /api/auth.php
{
  "action": "register",
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "university": "AIUB"
}
```

#### Login
```json
POST /api/auth.php
{
  "action": "login",
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get User Profile
```json
POST /api/auth.php
{
  "action": "getUser",
  "userId": 1
}
```

#### Update Profile
```json
POST /api/auth.php
{
  "action": "updateProfile",
  "userId": 1,
  "updates": {
    "bio": "New bio",
    "university": "DU"
  }
}
```

---

### Messages API (`/api/messages.php`)

#### Send Message
```json
POST /api/messages.php
{
  "action": "send",
  "senderId": 1,
  "receiverId": 2,
  "text": "Hello there!"
}
```

#### Get Conversation
```json
POST /api/messages.php
{
  "action": "getConversation",
  "userId1": 1,
  "userId2": 2,
  "limit": 50
}
```

#### Get Contacts List
```json
POST /api/messages.php
{
  "action": "getContacts",
  "userId": 1,
  "limit": 50
}
```

---

### Users API (`/api/users.php`)

#### Search Users
```json
POST /api/users.php
{
  "action": "search",
  "search": "web development",
  "limit": 20
}
```

#### Get Matches (Recommended Users)
```json
POST /api/users.php
{
  "action": "getMatches",
  "userId": 1,
  "limit": 10
}
```

#### Add Review
```json
POST /api/users.php
{
  "action": "addReview",
  "reviewerId": 1,
  "reviewedUserId": 2,
  "rating": 5,
  "comment": "Great tutor!"
}
```

#### Get Reviews
```json
POST /api/users.php
{
  "action": "getReviews",
  "userId": 2
}
```

#### Get All Skills
```json
GET /api/users.php?action=getSkills
```

---

## 📊 Database Models (PHP Classes)

### User Model
```php
$user = new User($db);
$user->email = "user@example.com";
$user->password = "password123";
$user->fullName = "John Doe";
$user->register();

$result = $user->login();
$profile = $user->getUserById($userId);
$results = $user->searchUsers("web development", 20);
```

### Message Model
```php
$message = new Message($db);
$message->save($senderId, $receiverId, "Hello!");
$conversation = $message->getConversation($userId1, $userId2, 50);
$contacts = $message->getContacts($userId, 50);
$message->markAsRead($messageId);
```

### Skill Model
```php
$skill = new Skill($db);
$allSkills = $skill->getAllSkills();
$searchResults = $skill->searchSkills("web");
```

### Match Model
```php
$match = new Match($db);
$matches = $match->findMatches($userId, 10);
$match->saveMatch($userId1, $userId2, 0.85, "Web development match");
```

### Review Model
```php
$review = new Review($db);
$review->addReview($reviewerId, $reviewedUserId, 5, "Great tutor!");
$userReviews = $review->getUserReviews($userId);
$avgRating = $review->getAverageRating($userId);
```

---

## 🔐 Security Considerations

### Current Implementation:
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention (prepared statements)
- ✅ CORS headers configured
- ✅ HTML escaping in frontend

### Recommended Improvements:
- [ ] Implement JWT token authentication
- [ ] Add rate limiting on API endpoints
- [ ] Use HTTPS in production
- [ ] Add user input validation on all endpoints
- [ ] Implement CSRF protection
- [ ] Add database backups
- [ ] Monitor for SQL errors in production

---

## 🗄️ Database Migration

To migrate from localStorage to MySQL:

1. Export localStorage data from browser (DevTools Console):
```javascript
// Get all users
JSON.parse(localStorage.getItem('users'))

// Export to copy/paste
copy(localStorage.getItem('users'))
```

2. Insert into database:
```sql
INSERT INTO users (email, password, fullName, university, bio, rating, createdAt)
VALUES (...);

INSERT INTO user_teaching_skills (userId, skillId)
VALUES (...);
```

---

## 🐛 Troubleshooting

### "Connection Error" on setup.php
- Ensure MySQL is running in XAMPP
- Check database credentials in `Database.php`
- Verify XAMPP MySQL service is started

### API returns empty results
- Verify tables were created (check `/api/setup.php` output)
- Check that sample data was inserted
- Ensure query parameters match table schema

### PHP files not executing
- Check XAMPP Apache is running
- Verify file path is correct
- Check error logs in XAMPP

---

## 📝 Sample Queries

### Get user with all skills
```sql
SELECT u.*, 
       GROUP_CONCAT(s.name) as teachingSkills
FROM users u
LEFT JOIN user_teaching_skills uts ON u.id = uts.userId
LEFT JOIN skills s ON uts.skillId = s.id
WHERE u.id = 1
GROUP BY u.id;
```

### Find best matches for a user
```sql
SELECT u.id, u.fullName, u.rating,
       COUNT(DISTINCT tc.skillId) as commonSkills
FROM users u
LEFT JOIN user_teaching_skills tc ON u.id = tc.userId
WHERE tc.skillId IN (
  SELECT skillId FROM user_learning_interests WHERE userId = 1
)
AND u.id != 1
GROUP BY u.id
ORDER BY commonSkills DESC, u.rating DESC
LIMIT 10;
```

---

## 🔄 Next Steps

1. ✅ Database schema created
2. ✅ API endpoints implemented
3. ⏳ Update frontend JavaScript to use API instead of localStorage
4. ⏳ Add user management panel
5. ⏳ Implement team management in database
6. ⏳ Add competition tracking
7. ⏳ Create admin dashboard

---

**For support or questions, refer to the inline comments in API files.**

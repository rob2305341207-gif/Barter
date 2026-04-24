# Barter Database Schema - Complete Reference

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE: barter                         │
└─────────────────────────────────────────────────────────────────┘

                            ┌──────────┐
                            │  users   │
                            ├──────────┤
                            │ id (PK)  │
                            │ email    │
                            │ password │
                            │ fullName │
                            │ rating   │
                            └──────────┘
                                 │
                    ┌────────────┬┴────────────┬─────────────┐
                    │            │             │             │
            ┌───────▼───┐  ┌─────▼────┐  ┌───▼──────┐  ┌───▼─────┐
            │ Teaching  │  │ Learning │  │ Reviews  │  │Messages │
            │  Skills   │  │Interests │  │          │  │         │
            └───────────┘  └──────────┘  └──────────┘  └─────────┘
                    │            │             │
                    └────────────┼─────────────┘
                                 │
                            ┌────▼─────┐
                            │  skills  │
                            ├──────────┤
                            │ id (PK)  │
                            │ name     │
                            │ category │
                            └──────────┘


                    Teams & Competitions

            ┌────────────┐      ┌──────────────┐
            │   teams    │      │competitions  │
            ├────────────┤      ├──────────────┤
            │ id (PK)    │      │ id (PK)      │
            │ creatorId  │◄─┬──►│ creatorId    │
            └────────────┘  │   └──────────────┘
                            │
            ┌───────────────┴─────────────────┐
            │                                 │
        ┌───▼─────────┐        ┌──────────────▼────┐
        │ team_members│        │competition_       │
        │             │        │participants       │
        └─────────────┘        └───────────────────┘
```

---

## Table Definitions

### 1. USERS Table
**Primary storage for all user accounts**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login credential) |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| fullName | VARCHAR(255) | NOT NULL | User's full name |
| university | VARCHAR(255) | NULL | Educational institution |
| bio | TEXT | NULL | User biography |
| profilePhoto | LONGBLOB | NULL | Profile picture (binary) |
| rating | DECIMAL(3,2) | DEFAULT 0 | Average rating (0-5) |
| verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| createdAt | TIMESTAMP | DEFAULT CURRENT | Account creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last profile update |
| lastLogin | TIMESTAMP | NULL | Last login time |
| isActive | BOOLEAN | DEFAULT TRUE | Account status |

**Indexes:**
- `idx_email` (email) - Fast login lookups
- `idx_createdAt` (createdAt) - Timeline queries
- `idx_rating` (rating) - Sort by ratings

---

### 2. SKILLS Table
**Dictionary of all available skills in the system**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique skill ID |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Skill name (e.g., "Web Development") |
| category | VARCHAR(50) | NULL | Skill category (e.g., "Technology") |
| description | TEXT | NULL | Detailed skill description |
| createdAt | TIMESTAMP | DEFAULT CURRENT | When skill was added |

**Sample Data:**
- Web Development (Technology)
- Python Programming (Technology)
- UI/UX Design (Design)
- Digital Marketing (Business)
- Graphic Design (Design)
- Content Writing (Communication)
- Video Editing (Media)
- Mobile App Development (Technology)
- Data Analysis (Technology)
- Public Speaking (Communication)

**Indexes:**
- `idx_name` (name) - Skill lookup
- `idx_category` (category) - Filter by category

---

### 3. USER_TEACHING_SKILLS Table
**What skills each user can teach (Many-to-Many)**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Record ID |
| userId | INT | NOT NULL, FK → users(id) | User who teaches |
| skillId | INT | NOT NULL, FK → skills(id) | Skill being taught |
| proficiencyLevel | ENUM | DEFAULT 'Beginner' | Level: Beginner/Intermediate/Advanced/Expert |
| yearsOfExperience | INT | DEFAULT 0 | Years of experience |
| createdAt | TIMESTAMP | DEFAULT CURRENT | When added |

**Unique Constraint:**
- `unique_user_skill` (userId, skillId) - User can't teach same skill twice

---

### 4. USER_LEARNING_INTERESTS Table
**What skills each user wants to learn (Many-to-Many)**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Record ID |
| userId | INT | NOT NULL, FK → users(id) | User who wants to learn |
| skillId | INT | NOT NULL, FK → skills(id) | Skill to learn |
| priority | INT | DEFAULT 1 | Learning priority (1=high, 5=low) |
| createdAt | TIMESTAMP | DEFAULT CURRENT | When added |

**Unique Constraint:**
- `unique_user_interest` (userId, skillId) - User can't learn same skill twice

---

### 5. MESSAGES Table
**Private messages between users**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Message ID |
| senderId | INT | NOT NULL, FK → users(id) | Who sent message |
| receiverId | INT | NOT NULL, FK → users(id) | Who receives message |
| text | LONGTEXT | NOT NULL | Message content (max 5000 chars) |
| isRead | BOOLEAN | DEFAULT FALSE | Read status |
| createdAt | TIMESTAMP | DEFAULT CURRENT | When sent |

**Indexes:**
- `idx_senderId` (senderId) - Find sent messages
- `idx_receiverId` (receiverId) - Find received messages
- `idx_conversation` (senderId, receiverId) - Get chat history
- `idx_createdAt` (createdAt) - Timeline sorting

---

### 6. REVIEWS Table
**User ratings and reviews**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Review ID |
| reviewerId | INT | NOT NULL, FK → users(id) | Who wrote review |
| reviewedUserId | INT | NOT NULL, FK → users(id) | Who is reviewed |
| rating | INT | CHECK (1-5), NOT NULL | Star rating (1-5) |
| comment | TEXT | NULL | Review text |
| skillId | INT | NULL, FK → skills(id) | Skill being reviewed for |
| createdAt | TIMESTAMP | DEFAULT CURRENT | Review date |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last edit time |

**Unique Constraint:**
- `unique_review` (reviewerId, reviewedUserId) - One review per pair

---

### 7. TEAMS Table
**Team/group information**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Team ID |
| name | VARCHAR(255) | NOT NULL | Team name |
| description | TEXT | NULL | Team description |
| creatorId | INT | NOT NULL, FK → users(id) | Team creator |
| maxMembers | INT | DEFAULT 10 | Maximum members allowed |
| skillFocus | INT | NULL, FK → skills(id) | Primary skill focus |
| status | ENUM | DEFAULT 'Active' | Status: Active/Inactive/Archived |
| createdAt | TIMESTAMP | DEFAULT CURRENT | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update time |

---

### 8. TEAM_MEMBERS Table
**Team membership records**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Record ID |
| teamId | INT | NOT NULL, FK → teams(id) | Which team |
| userId | INT | NOT NULL, FK → users(id) | Which user |
| role | ENUM | DEFAULT 'Member' | Role: Creator/Admin/Member |
| joinedAt | TIMESTAMP | DEFAULT CURRENT | When joined |

**Unique Constraint:**
- `unique_team_user` (teamId, userId) - User can't join same team twice

---

### 9. COMPETITIONS Table
**Competition/contest information**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Competition ID |
| name | VARCHAR(255) | NOT NULL | Competition name |
| description | TEXT | NULL | Details about competition |
| skillId | INT | NULL, FK → skills(id) | Skill being tested |
| creatorId | INT | NOT NULL, FK → users(id) | Organizer |
| startDate | DATETIME | NOT NULL | Start time |
| endDate | DATETIME | NOT NULL | End time |
| maxParticipants | INT | NULL | Max participants |
| prize | VARCHAR(255) | NULL | Prize description |
| status | ENUM | DEFAULT 'Upcoming' | Status: Upcoming/Ongoing/Completed/Cancelled |
| createdAt | TIMESTAMP | DEFAULT CURRENT | Creation time |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update |

---

### 10. COMPETITION_PARTICIPANTS Table
**Who's participating in competitions**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Record ID |
| competitionId | INT | NOT NULL, FK → competitions(id) | Which competition |
| userId | INT | NOT NULL, FK → users(id) | Which participant |
| rank | INT | NULL | Final rank/position |
| score | INT | NULL | Final score |
| registeredAt | TIMESTAMP | DEFAULT CURRENT | Registration time |

**Unique Constraint:**
- `unique_competition_user` (competitionId, userId) - User can't join twice

---

### 11. MATCHES Table
**User match suggestions based on complementary skills**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Match ID |
| userId1 | INT | NOT NULL, FK → users(id) | First user |
| userId2 | INT | NOT NULL, FK → users(id) | Second user |
| matchScore | DECIMAL(3,2) | NULL | Match percentage (0-1) |
| commonSkills | JSON | NULL | Array of matching skills |
| reason | VARCHAR(255) | NULL | Why they match |
| status | ENUM | DEFAULT 'Suggested' | Status: Suggested/Connected/Blocked |
| createdAt | TIMESTAMP | DEFAULT CURRENT | When created |

**Unique Constraint:**
- `unique_match` (userId1, userId2) - One match per pair

---

### 12. NOTIFICATIONS Table
**User notifications**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Notification ID |
| userId | INT | NOT NULL, FK → users(id) | Recipient |
| type | ENUM | DEFAULT 'Message' | Type: Message/TeamInvite/CompetitionUpdate/Review/Match |
| title | VARCHAR(255) | NOT NULL | Notification title |
| description | TEXT | NULL | Details |
| relatedUserId | INT | NULL, FK → users(id) | Related user (if any) |
| relatedTeamId | INT | NULL, FK → teams(id) | Related team (if any) |
| relatedCompetitionId | INT | NULL, FK → competitions(id) | Related competition |
| isRead | BOOLEAN | DEFAULT FALSE | Read status |
| createdAt | TIMESTAMP | DEFAULT CURRENT | Creation time |

---

## Key SQL Queries

### Find best skill matches for a user
```sql
SELECT u.id, u.fullName, u.email, u.rating,
       COUNT(DISTINCT tc.skillId) as commonSkills
FROM users u
LEFT JOIN user_teaching_skills tc ON u.id = tc.userId
WHERE tc.skillId IN (
  SELECT skillId FROM user_learning_interests WHERE userId = ?
)
AND u.id != ?
GROUP BY u.id
ORDER BY commonSkills DESC, u.rating DESC
LIMIT 10;
```

### Get user profile with all details
```sql
SELECT u.*,
       GROUP_CONCAT(DISTINCT s_teach.name) as teachingSkills,
       GROUP_CONCAT(DISTINCT s_learn.name) as learningInterests,
       AVG(r.rating) as avgRating,
       COUNT(DISTINCT r.id) as totalReviews
FROM users u
LEFT JOIN user_teaching_skills uts ON u.id = uts.userId
LEFT JOIN skills s_teach ON uts.skillId = s_teach.id
LEFT JOIN user_learning_interests uli ON u.id = uli.userId
LEFT JOIN skills s_learn ON uli.skillId = s_learn.id
LEFT JOIN reviews r ON u.id = r.reviewedUserId
WHERE u.id = ?
GROUP BY u.id;
```

### Get conversation between two users
```sql
SELECT * FROM messages
WHERE (senderId = ? AND receiverId = ?)
   OR (senderId = ? AND receiverId = ?)
ORDER BY createdAt DESC
LIMIT 50;
```

### Find user's teams
```sql
SELECT t.*, u.fullName as creatorName, COUNT(tm.userId) as memberCount
FROM teams t
JOIN users u ON t.creatorId = u.id
LEFT JOIN team_members tm ON t.id = tm.teamId
WHERE t.id IN (SELECT teamId FROM team_members WHERE userId = ?)
GROUP BY t.id;
```

---

## Data Relationships Summary

| From | To | Type | Relationship |
|------|----|----|---|
| users | skills | Many-to-Many | Teaches (via user_teaching_skills) |
| users | skills | Many-to-Many | Wants to learn (via user_learning_interests) |
| users | messages | One-to-Many | Sends messages |
| users | messages | One-to-Many | Receives messages |
| users | reviews | One-to-Many | Writes reviews |
| users | reviews | One-to-Many | Receives reviews |
| users | teams | One-to-Many | Creates teams |
| teams | users | Many-to-Many | Members (via team_members) |
| users | competitions | One-to-Many | Organizes |
| competitions | users | Many-to-Many | Participants (via competition_participants) |
| users | matches | Many-to-Many | Matched with |

---

## Performance Notes

### Optimized for:
- ✅ Fast user lookups (email index)
- ✅ Quick message retrieval (conversation index)
- ✅ Efficient skill matching (foreign keys)
- ✅ Scalable to 100,000+ users
- ✅ Supports complex queries with JOINs

### Recommended Optimizations:
- Add caching for skills and categories
- Archive old messages after 1 year
- Create views for complex queries
- Add full-text search on profiles

---

**Version: 1.0 | Last Updated: April 2026**

/**
 * Match/Discovery Script
 * Handles skill matching and user discovery
 */

/**
 * Find matches for current user (API)
 * Returns a Promise that resolves to an array of matches
 */
async function findMatches(currentUser) {
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getMatches', userId: currentUser.id, limit: 20 })
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Get skill suggestions based on popular skills
 */
function getSkillSuggestions() {
  const popularSkills = [
    'Python',
    'JavaScript',
    'React',
    'Web Design',
    'Guitar',
    'Spanish',
    'Photography',
    'UI/UX Design',
    'Machine Learning',
    'Data Science',
    'Photoshop',
    'Video Editing'
  ];

  return popularSkills;
}

/**
 * Search users by skill, name, or university (API)
 * Returns a Promise that resolves to an array of users
 */
async function searchUsers(query, currentUserId) {
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', search: query, limit: 20 })
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      // Filter out current user if needed
      return data.data.filter(user => user.id !== currentUserId);
    }
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Rate or review a user (API)
 * Returns a Promise that resolves to the API response
 */
async function rateUser(reviewerId, reviewedUserId, rating, comment) {
  if (rating < 1 || rating > 5) {
    return { success: false, message: 'Rating must be between 1 and 5' };
  }
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addReview',
        reviewerId,
        reviewedUserId,
        rating,
        comment
      })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, message: 'Failed to submit review. Server error.' };
  }
}

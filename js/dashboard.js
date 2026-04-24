/**
 * Dashboard Script
 * Handles dashboard UI and data loading
 */

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

document.addEventListener('DOMContentLoaded', async function() {
  // Check authentication
  const currentUser = authManager.getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Initialize dashboard
  await initDashboard(currentUser);
});

/**
 * Initialize dashboard with user data
 */
async function initDashboard(user) {
  // Load matches
  await loadMatches(user);
  // Load user skills
  await loadUserSkills(user);
  // Load learning interests
  await loadLearningInterests(user);
  // Load recent activity
  await loadRecentActivity(user);
}

/**
 * Load and display matches
 */
async function loadMatches(currentUser) {
  const matchesList = document.getElementById('matchesList');
  if (!matchesList) {
    console.warn('matchesList element not found');
    return;
  }
  matchesList.innerHTML = '<div style="color:var(--muted);padding:12px;">Loading matches...</div>';
  let matches = [];
  try {
    matches = await findMatches(currentUser);
  } catch (e) {
    matches = [];
  }
  if (!matches || matches.length === 0) {
    matchesList.innerHTML = '<p style="color:var(--muted);">No matches found yet.</p>';
    return;
  }
  matchesList.innerHTML = matches.slice(0, 6).map(user => `
    <div class="match-card" style="border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px;background:rgba(0,255,153,0.05);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:32px;height:32px;border-radius:8px;background:var(--neon);display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;font-size:0.8rem;">
          ${escapeHtml(user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U')}
        </div>
        <div>
          <div style="font-weight:600;font-size:0.9rem;">${escapeHtml(user.fullName || 'User')}</div>
          <div style="font-size:0.8rem;color:var(--muted);">${escapeHtml(user.university || 'Student')}</div>
        </div>
      </div>
      <div style="font-size:0.85rem;color:var(--muted);margin-bottom:8px;">
        <strong>Teaches:</strong> ${user.skills && user.skills.length > 0 ? user.skills.slice(0, 2).map(escapeHtml).join(', ') : 'Not specified'}
      </div>
      <div style="font-size:0.85rem;color:var(--muted);margin-bottom:10px;">
        <strong>Wants:</strong> ${user.interests && user.interests.length > 0 ? user.interests.slice(0, 2).map(escapeHtml).join(', ') : 'Not specified'}
      </div>
      <button onclick="sendMessage('${escapeHtml(user.id)}')" style="width:100%;padding:6px;background:var(--neon);color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem;">
        Message
      </button>
    </div>
  `).join('');
}

/**
 * Load and display user skills
 */
async function loadUserSkills(user) {
  const skillsList = document.getElementById('skillsList');
  if (!skillsList) {
    console.warn('skillsList element not found');
    return;
  }
  // Fetch user profile from API
  let userData = user;
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getUser', userId: user.id })
    });
    const data = await res.json();
    if (data.success && data.data) {
      userData = data.data;
    }
  } catch (e) {}
  const skills = userData.skills || [];
  if (skills.length === 0) {
    skillsList.innerHTML = '<span style="color:var(--muted);font-size:0.9rem;">No skills added yet. <a href="profile.html" style="color:var(--neon);">Add skills</a></span>';
    return;
  }
  skillsList.innerHTML = skills.map(skill => `
    <span style="display:inline-block;background:var(--neon);color:#000;padding:6px 12px;border-radius:6px;font-size:0.85rem;font-weight:600;">
      ${escapeHtml(skill)}
    </span>
  `).join('');
}

/**
 * Load and display learning interests
 */
async function loadLearningInterests(user) {
  const interestsList = document.getElementById('interestsList');
  if (!interestsList) {
    console.warn('interestsList element not found');
    return;
  }
  // Fetch user profile from API
  let userData = user;
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getUser', userId: user.id })
    });
    const data = await res.json();
    if (data.success && data.data) {
      userData = data.data;
    }
  } catch (e) {}
  const interests = userData.interests || [];
  if (interests.length === 0) {
    interestsList.innerHTML = '<span style="color:var(--muted);font-size:0.9rem;">No interests added yet. <a href="profile.html" style="color:var(--neon);">Add interests</a></span>';
    return;
  }
  interestsList.innerHTML = interests.map(interest => `
    <span style="display:inline-block;background:rgba(0,255,153,0.2);color:var(--neon);padding:6px 12px;border-radius:6px;font-size:0.85rem;border:1px solid var(--neon);">
      ${escapeHtml(interest)}
    </span>
  `).join('');
}

/**
 * Load recent activity
 */
async function loadRecentActivity(user) {
  const activityList = document.getElementById('activityList');
  if (!activityList) {
    console.warn('activityList element not found');
    return;
  }
  activityList.innerHTML = '<li style="color:var(--muted);">Loading recent activity...</li>';
  let userTeams = [];
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getUserTeams', userId: user.id })
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      userTeams = data.data;
    }
  } catch (e) {}
  if (!userTeams || userTeams.length === 0) {
    activityList.innerHTML = '<li style="color:var(--muted);">No recent activity. <a href="team-create.html" style="color:var(--neon);">Create a team</a></li>';
    return;
  }
  activityList.innerHTML = userTeams.slice(0, 5).map(team => `
    <li style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <div>
        <strong style="display:block;margin-bottom:4px;">${escapeHtml(team.name)}</strong>
        <span style="font-size:0.85rem;color:var(--muted);">${escapeHtml(team.status || '')} • ${team.members ? team.members.length : 0} members</span>
      </div>
      <a href="team-find.html" style="color:var(--neon);text-decoration:none;font-size:0.9rem;">View</a>
    </li>
  `).join('');
}

/**
 * Send message to user
 */
function sendMessage(userId) {
  // Store selected user ID for chat (sessionStorage is safer than localStorage for temp data)
  sessionStorage.setItem('selectedChatUserId', userId);
  window.location.href = 'chat.html';
}

/**
 * Navigation link click handler
 */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function() {
    // Smooth scroll if it's an anchor
    const href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      event.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

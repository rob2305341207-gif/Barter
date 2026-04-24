/**
 * Profile Script
 * Handles user profile management and updates
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const currentUser = authManager.getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Load profile data
  loadProfileData(currentUser);

  // Setup event listeners
  setupProfileEvents(currentUser);
});

/**
 * Load profile data
 */
function loadProfileData(user) {
  // Display user info
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const aboutMe = document.getElementById('aboutMe');

  if (profileName) profileName.textContent = user.fullName || 'User';
  if (profileEmail) profileEmail.textContent = user.email || '';
  if (aboutMe) aboutMe.value = user.bio || '';

  // Load teaching skills
  displaySkills(user.skills || [], 'teachSkills');

  // Load learning interests
  displaySkills(user.interests || [], 'learnSkills');
}

/**
 * Display skills/interests
 */
function displaySkills(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = '<span style="color:var(--muted);font-size:0.9rem;">No skills added yet</span>';
    return;
  }

  container.innerHTML = items.map(item => `
    <span style="display:inline-block;background:var(--neon);color:#000;padding:6px 12px;border-radius:6px;font-size:0.85rem;font-weight:600;margin-right:8px;margin-bottom:8px;">
      ${escapeHtml(item)}
      <button type="button" class="remove-skill" data-skill="${escapeHtml(item)}" style="margin-left:6px;background:none;border:none;color:#000;cursor:pointer;font-weight:bold;">×</button>
    </span>
  `).join('');

  // Add remove event listeners
  document.querySelectorAll('.remove-skill').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const skill = this.getAttribute('data-skill');
      removeSkill(skill, containerId);
    });
  });
}

/**
 * Remove skill
 */
function removeSkill(skill, containerId) {
  const currentUser = authManager.getCurrentUser();
  const isTeachingSkill = containerId === 'teachSkills';
  const skillsArray = isTeachingSkill ? (currentUser.skills || []) : (currentUser.interests || []);

  const updatedSkills = skillsArray.filter(s => s !== skill);

  const updateData = isTeachingSkill 
    ? { skills: updatedSkills }
    : { interests: updatedSkills };

  authManager.updateProfile(currentUser.id, updateData);
  displaySkills(updatedSkills, containerId);
}

/**
 * Setup event listeners
 */
function setupProfileEvents(user) {
  const saveBtn = document.getElementById('saveProfile');
  const deleteBtn = document.getElementById('deleteProfile');
  const newSkillInput = document.getElementById('newSkillInput');
  const newInterestInput = document.getElementById('newInterestInput');
  const addSkillBtn = document.querySelector('button:contains("Add Skill")');
  const addInterestBtn = document.querySelector('button:contains("Add Interest")');

  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      saveProfile(user);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        deleteProfile(user);
      }
    });
  }

  // Get all buttons and find the "Add Skill" ones
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    if (btn.textContent.includes('Add Skill')) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (newSkillInput && newSkillInput.value.trim()) {
          addSkill(newSkillInput.value.trim(), 'teachSkills');
          newSkillInput.value = '';
        }
      });
    }
    if (btn.textContent.includes('Add Interest')) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (newInterestInput && newInterestInput.value.trim()) {
          addSkill(newInterestInput.value.trim(), 'learnSkills');
          newInterestInput.value = '';
        }
      });
    }
  });

  // Keyboard submit
  if (newSkillInput) {
    newSkillInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.value.trim()) {
          addSkill(this.value.trim(), 'teachSkills');
          this.value = '';
        }
      }
    });
  }

  if (newInterestInput) {
    newInterestInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.value.trim()) {
          addSkill(this.value.trim(), 'learnSkills');
          this.value = '';
        }
      }
    });
  }
}

/**
 * Add new skill/interest
 */
function addSkill(skill, type) {
  const currentUser = authManager.getCurrentUser();
  const isTeachingSkill = type === 'teachSkills';
  const skillsArray = isTeachingSkill ? (currentUser.skills || []) : (currentUser.interests || []);

  if (skillsArray.includes(skill)) {
    alert('This skill is already added');
    return;
  }

  const updatedSkills = [...skillsArray, skill];
  const updateData = isTeachingSkill 
    ? { skills: updatedSkills }
    : { interests: updatedSkills };

  const result = authManager.updateProfile(currentUser.id, updateData);
  if (result.success) {
    displaySkills(updatedSkills, type);
  } else {
    alert(result.message || 'Failed to add skill');
  }
}

/**
 * Save profile changes
 */
function saveProfile(user) {
  const aboutMe = document.getElementById('aboutMe');
  const bio = aboutMe ? aboutMe.value : '';

  const result = authManager.updateProfile(user.id, { bio });

  if (result.success) {
    alert('Profile updated successfully!');
  } else {
    alert(result.message || 'Failed to update profile');
  }
}

/**
 * Delete profile via API
 */
async function deleteProfile(user) {
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteUser',
        userId: user.id
      })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.removeItem('currentUser');
      alert('Account deleted successfully');
      window.location.href = 'login.html';
    } else {
      alert(data.message || 'Failed to delete account');
    }
  } catch (e) {
    alert('Failed to delete account: ' + e.message);
  }
}

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
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

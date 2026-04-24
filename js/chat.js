/**
 * Chat Script
 * Handles real-time messaging and chat UI
 */

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

let selectedUserId = null;
let selectedUserName = null;
let conversations = {};

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const currentUser = authManager.getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Initialize chat
  initChat(currentUser);
});

/**
 * Initialize chat UI
 */
function initChat(currentUser) {
  loadContacts(currentUser);
  setupMessageForm(currentUser);

  // Load selected chat if exists
  const selectedId = sessionStorage.getItem('selectedChatUserId');
  if (selectedId) {
    openChat(selectedId, currentUser);
    sessionStorage.removeItem('selectedChatUserId');
  }
}

/**
 * Load contacts list from API
 */
async function loadContacts(currentUser) {
  const contactsList = document.getElementById('contactsList');
  if (!contactsList) {
    console.warn('contactsList element not found');
    return;
  }
  contactsList.innerHTML = '<div style="padding:16px;color:var(--muted);text-align:center;">Loading contacts...</div>';
  
  let contacts = [];
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getAllUsers', userId: currentUser.id })
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      contacts = data.data.filter(u => u.id !== currentUser.id);
    }
  } catch (e) {
    console.error('Failed to load contacts:', e);
  }

  if (contacts.length === 0) {
    contactsList.innerHTML = '<div style="padding:16px;color:var(--muted);text-align:center;">No contacts yet</div>';
    return;
  }

  contactsList.innerHTML = contacts.map(user => {
    const fullName = escapeHtml(user.fullName || 'User');
    const university = escapeHtml(user.university || 'Student');
    return `
    <div class="contact-item" onclick="openChat('${escapeHtml(user.id)}', event)" 
         style="padding:12px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:background 0.2s;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;border-radius:8px;background:var(--neon);display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;">
          ${fullName.substring(0, 2).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${fullName}
          </div>
          <div style="font-size:0.85rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${university}
          </div>
        </div>
      </div>
    </div>
  `; }).join('');
}

/**
 * Open chat with user
 */
async function openChat(userId, event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  selectedUserId = userId;

  // Fetch user details from API
  try {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getUser', userId: userId })
    });
    const data = await res.json();
    if (data.success && data.data) {
      selectedUserName = data.data.fullName;
      const chatName = document.getElementById('chatName');
      if (chatName) {
        chatName.textContent = escapeHtml(data.data.fullName);
      }
    }
  } catch (e) {
    console.error('Failed to load user:', e);
  }

  // Load messages
  await loadMessages(userId);
}

/**
 * Load messages for selected user from API
 */
async function loadMessages(userId) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) {
    console.warn('chatMessages element not found');
    return;
  }

  chatMessages.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">Loading messages...</div>';
  const currentUser = authManager.getCurrentUser();
  let messages = [];

  try {
    const res = await fetch('api/messages.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getMessages', senderId: currentUser.id, recipientId: userId })
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      messages = data.data;
    }
  } catch (e) {
    console.error('Failed to load messages:', e);
  }

  if (messages.length === 0) {
    chatMessages.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">No messages yet. Start a conversation!</div>';
    return;
  }

  chatMessages.innerHTML = messages.map(msg => `
    <div style="margin-bottom:12px;${msg.senderId === currentUser.id ? 'text-align:right;' : ''}">
      <div style="display:inline-block;max-width:70%;padding:10px 14px;border-radius:12px;background:${msg.senderId === currentUser.id ? 'var(--neon)' : 'rgba(255,255,255,0.1)'};color:${msg.senderId === currentUser.id ? '#000' : '#fff'};word-wrap:break-word;">
        ${escapeHtml(msg.text)}
      </div>
      <div style="font-size:0.75rem;color:var(--muted);margin-top:4px;">
        ${new Date(msg.timestamp).toLocaleTimeString()}
      </div>
    </div>
  `).join('');

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Setup message form
 */
function setupMessageForm(currentUser) {
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');

  if (!messageForm || !sendBtn) {
    console.warn('Message form elements not found');
    return;
  }

  sendBtn.addEventListener('click', function() {
    if (!selectedUserId) {
      alert('Please select a user to message');
      return;
    }

    const text = messageInput.value.trim();
    if (!text) {
      alert('Please type a message');
      return;
    }

    sendMessage(currentUser, text);
    messageInput.value = '';
    messageInput.focus();
  });

  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }
}

/**
 * Send message via API
 */
async function sendMessage(sender, text) {
  try {
    const res = await fetch('api/messages.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendMessage',
        senderId: sender.id,
        recipientId: selectedUserId,
        text: text
      })
    });
    const data = await res.json();
    if (data.success) {
      // Reload messages
      await loadMessages(selectedUserId);
    } else {
      alert(data.message || 'Failed to send message');
    }
  } catch (e) {
    alert('Failed to send message: ' + e.message);
  }
}

/**
 * Search contacts
 */
const searchInput = document.getElementById('searchContacts');
if (searchInput) {
  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const contactItems = document.querySelectorAll('.contact-item');

    contactItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? 'block' : 'none';
    });
  });
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
  return text.replace(/[&<>"']/g, m => map[m]);
}

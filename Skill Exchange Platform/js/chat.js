// Chat Module
// Handles messaging functionality between users

class ChatManager {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.conversations = [];
        this.currentConversationId = null;
        this.apiBase = '/api/chat';
        this.initializeEventListeners();
    }

    /**
     * Load current user from localStorage
     */
    loadCurrentUser() {
        const user = localStorage.getItem('currentUser');
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        return JSON.parse(user);
    }

    /**
     * Load all conversations from localStorage
     */
    loadConversations() {
        const conversations = localStorage.getItem('conversations');
        return conversations ? JSON.parse(conversations) : [];
    }

    /**
     * Save conversations to localStorage
     */
    saveConversations() {
        localStorage.setItem('conversations', JSON.stringify(this.conversations));
    }

    /**
     * Get or create conversation between two users
     */
    getConversation(userId) {
        let conversation = this.conversations.find(c =>
            (c.participant1Id === this.currentUser.id && c.participant2Id === userId) ||
            (c.participant1Id === userId && c.participant2Id === this.currentUser.id)
        );

        if (!conversation) {
            conversation = {
                id: Date.now(),
                participant1Id: this.currentUser.id,
                participant2Id: userId,
                messages: [],
                createdAt: new Date().toISOString()
            };
            this.conversations.push(conversation);
            this.saveConversations();
        }

        return conversation;
    }

    /**
     * Send message
     */
    sendMessage(conversationId, message) {
        if (!message.trim()) return false;
        const token = localStorage.getItem('token');
        return fetch(`${this.apiBase}/${conversationId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ text: message })
        }).then(r => r.json());
    }

    /**
     * Get all conversations for current user
     */
    getUserConversations() {
        return this.conversations;
    }

    /**
     * Get messages for a conversation
     */
    getConversationMessages(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        return conversation ? conversation.messages : [];
    }

    /**
     * Get user details by ID
     */
    getUserById(userId) {
        const users = localStorage.getItem('users');
        const userList = users ? JSON.parse(users) : [];
        return userList.find(u => u.id === userId);
    }

    /**
     * Initialize chat event listeners
     */
    initializeEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        const searchContacts = document.getElementById('searchContacts');
        const logoutBtn = document.getElementById('logoutBtn');

        if (sendBtn && messageInput) {
            sendBtn.addEventListener('click', () => this.handleSendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSendMessage();
                }
            });
        }

        if (searchContacts) {
            searchContacts.addEventListener('input', () => this.filterContacts());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Load conversations from API
        this.loadConversationsFromServer();
    }

    /**
     * Handle send message
     */
    handleSendMessage() {
        const messageInput = document.getElementById('messageInput');
        const chatMessages = document.getElementById('chatMessages');

        if (!messageInput || !chatMessages || !this.currentConversationId) {
            if (!this.currentConversationId) {
                alert('Select a conversation first!');
            }
            return;
        }

        const message = messageInput.value.trim();
        if (!message) return;

        this.sendMessage(this.currentConversationId, message).then(updatedConv => {
            // append message locally
            const messageEl = document.createElement('div');
            messageEl.className = 'message sent';
            messageEl.textContent = message;
            chatMessages.appendChild(messageEl);
            messageInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }).catch(() => alert('Message failed'));
    }

    /**
     * Display conversations in sidebar
     */
    displayConversations(filter = '') {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        const conversations = this.getUserConversations();

        if (conversations.length === 0) {
            contactsList.innerHTML = '<p style="padding: 1rem; color: #6b7280;">No conversations yet</p>';
            return;
        }

        contactsList.innerHTML = '';

        conversations.forEach(conv => {
            const otherUserId = conv.participant1Id === this.currentUser.id
                ? conv.participant2Id
                : conv.participant1Id;

            const otherUser = this.getUserById(otherUserId);

            if (otherUser && otherUser.fullName.toLowerCase().includes(filter.toLowerCase())) {
                const contact = document.createElement('div');
                contact.className = 'contact-item';
                contact.innerHTML = `
                    <div class="contact-avatar">${otherUser.fullName.charAt(0).toUpperCase()}</div>
                    <div class="contact-info">
                        <h4>${otherUser.fullName}</h4>
                        <p>${conv.messages.length > 0
                            ? conv.messages[conv.messages.length - 1].text.substring(0, 30) + (conv.messages[conv.messages.length - 1].text.length > 30 ? '...' : '')
                            : 'No messages'
                        }</p>
                    </div>
                    <div class="contact-status"></div>
                `;

                contact.addEventListener('click', () => this.openConversation(conv._id || conv.id, otherUser.fullName));

                contactsList.appendChild(contact);
            }
        });
    }

    /**
     * Open a conversation
     */
    openConversation(conversationId, participantName) {
        const chatName = document.getElementById('chatName');
        const chatMessages = document.getElementById('chatMessages');

        if (!chatName || !chatMessages) return;

        this.currentConversationId = conversationId;
        chatName.textContent = participantName;

        // Try to find conversation locally
        const conv = this.conversations.find(c => (c._id === conversationId || c.id === conversationId));
        chatMessages.innerHTML = '';
        if (conv && conv.messages) {
            conv.messages.forEach(msg => {
                const messageEl = document.createElement('div');
                const senderId = msg.senderId && msg.senderId.toString ? msg.senderId.toString() : msg.senderId;
                const meId = this.currentUser && this.currentUser.id ? this.currentUser.id : (this.currentUser && this.currentUser._id ? this.currentUser._id : null);
                messageEl.className = senderId === meId ? 'message sent' : 'message received';
                messageEl.textContent = msg.text;
                chatMessages.appendChild(messageEl);
            });
        }

        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async loadConversationsFromServer() {
        // Prefer Firebase Firestore if available
        if (window.db && window.firebaseAuth) {
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) return;
                const uid = user.uid;
                const convsSnapshot = await window.db.collection('conversations').where('participants', 'array-contains', uid).get();
                this.conversations = convsSnapshot.docs.map(d => ({ _id: d.id, ...d.data() }));
                this.displayConversations();
                return;
            } catch (err) {
                console.warn('Firestore load convs failed', err);
            }
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(this.apiBase, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
            if (!res.ok) throw new Error('failed');
            this.conversations = await res.json();
            this.displayConversations();
        } catch (err) {
            // fall back to localStorage conversations
            const convs = localStorage.getItem('conversations');
            this.conversations = convs ? JSON.parse(convs) : [];
            this.displayConversations();
        }
    }

    /**
     * Filter contacts based on search input
     */
    filterContacts() {
        const searchInput = document.getElementById('searchContacts');
        if (searchInput) {
            this.displayConversations(searchInput.value);
        }
    }

    /**
     * Handle logout
     */
    handleLogout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Initialize chat manager
const chatManager = new ChatManager();

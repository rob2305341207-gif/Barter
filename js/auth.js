/**
 * Authentication Manager
 * Handles user registration, login, and session management
 */

class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
  }

  /**
   * Register new user
   */
  async register(fullName, email, password, confirmPassword, additionalData = {}) {
    // Validate inputs (frontend)
    if (!fullName || fullName.trim().length < 2) {
      return { success: false, message: 'Full name must be at least 2 characters' };
    }
    if (!email || !this.isValidEmail(email)) {
      return { success: false, message: 'Please enter a valid email' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }
    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    // API call
    try {
      const res = await fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email,
          password,
          fullName,
          university: additionalData.university || ''
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Set current user session
        this.setCurrentUser({
          id: data.data.userId,
          email,
          fullName,
          university: additionalData.university || '',
          ...additionalData
        });
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Registration failed. Server error.' };
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    if (!email || !this.isValidEmail(email)) {
      return { success: false, message: 'Please enter a valid email' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Invalid password' };
    }
    try {
      const res = await fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password
        })
      });
      const data = await res.json();
      if (data.success && data.data && data.data.user) {
        this.setCurrentUser(data.data.user);
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Login failed. Server error.' };
    }
  }

  /**
   * Logout current user
   */
  logout() {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Set current user in session
   */
  setCurrentUser(user) {
    // Remove sensitive data before storing
    const safeUser = { ...user };
    delete safeUser.password;
    localStorage.setItem('currentUser', JSON.stringify(safeUser));
    this.currentUser = safeUser;
  }

  /**
   * Load current user from session
   */
  loadUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser || this.loadUser();
  }

  /**
   * Update user profile via API
   */
  async updateProfile(userId, updates) {
    try {
      const res = await fetch('api/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProfile',
          userId: userId,
          ...updates
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Update current user if it's the same
        if (this.currentUser && this.currentUser.id === userId) {
          this.setCurrentUser(data.data);
        }
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Profile update failed. Server error.' };
    }
  }

  /**
   * Simple email validation
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Simple password hash (NOT SECURE - for demo only)
   */
  hashPassword(password) {
    // In production, use bcrypt or similar
    let hash = 0;
    if (password.length === 0) return hash.toString();
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }
}

// Create global instance
const authManager = new AuthManager();

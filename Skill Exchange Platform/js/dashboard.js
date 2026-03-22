// Dashboard Module
// Handles dashboard functionality and user profile management

class DashboardManager {
    constructor() {
        this.currentUser = this.loadCurrentUser();
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
     * Get all users from localStorage
     */
    getAllUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    /**
     * Update current user profile
     */
    updateProfile(updates) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);

        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            localStorage.setItem('users', JSON.stringify(users));
            
            const updatedUser = { ...this.currentUser, ...updates };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.currentUser = updatedUser;

            return true;
        }
        return false;
    }

    /**
     * Add skill to user
     */
    addSkill(skill) {
        if (!skill.trim()) return false;

        const skills = this.currentUser.skills || [];
        if (!skills.includes(skill)) {
            skills.push(skill);
            this.updateProfile({ skills });
            return true;
        }
        return false;
    }

    /**
     * Remove skill from user
     */
    removeSkill(skill) {
        const skills = (this.currentUser.skills || []).filter(s => s !== skill);
        this.updateProfile({ skills });
    }

    /**
     * Add learning interest
     */
    addInterest(interest) {
        if (!interest.trim()) return false;

        const interests = this.currentUser.interests || [];
        if (!interests.includes(interest)) {
            interests.push(interest);
            this.updateProfile({ interests });
            return true;
        }
        return false;
    }

    /**
     * Remove learning interest
     */
    removeInterest(interest) {
        const interests = (this.currentUser.interests || []).filter(i => i !== interest);
        this.updateProfile({ interests });
    }

    /**
     * Delete user account
     */
    deleteAccount() {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            const users = this.getAllUsers().filter(u => u.id !== this.currentUser.id);
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Profile page event listeners
        const saveProfileBtn = document.getElementById('saveProfile');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.handleSaveProfile());
        }

        const deleteProfileBtn = document.getElementById('deleteProfile');
        if (deleteProfileBtn) {
            deleteProfileBtn.addEventListener('click', () => this.deleteAccount());
        }

        // Populate profile on page load
        if (document.getElementById('profileName')) {
            this.populateProfile();
        }
    }

    /**
     * Populate profile data on profile page
     */
    populateProfile() {
        document.getElementById('profileName').textContent = this.currentUser.fullName || 'User Name';
        document.getElementById('profileEmail').textContent = this.currentUser.email || 'user@example.com';
        document.getElementById('aboutMe').value = this.currentUser.bio || '';

        this.displaySkills();
        this.displayInterests();
    }

    /**
     * Display teaching skills
     */
    displaySkills() {
        const skillsContainer = document.getElementById('teachSkills');
        if (!skillsContainer) return;

        skillsContainer.innerHTML = '';
        const skills = this.currentUser.skills || [];
        
        skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';
            tag.innerHTML = `
                ${skill}
                <button class="remove-btn" data-skill="${skill}" style="background:none; border:none; color:inherit; cursor:pointer; margin-left:0.5rem;">×</button>
            `;
            skillsContainer.appendChild(tag);
        });

        // Add event listeners for remove buttons
        document.querySelectorAll('.skill-tag .remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skill = e.target.getAttribute('data-skill');
                this.removeSkill(skill);
                this.displaySkills();
            });
        });
    }

    /**
     * Display learning interests
     */
    displayInterests() {
        const interestsContainer = document.getElementById('learnSkills');
        if (!interestsContainer) return;

        interestsContainer.innerHTML = '';
        const interests = this.currentUser.interests || [];
        
        interests.forEach(interest => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';
            tag.innerHTML = `
                ${interest}
                <button class="remove-btn" data-interest="${interest}" style="background:none; border:none; color:inherit; cursor:pointer; margin-left:0.5rem;">×</button>
            `;
            interestsContainer.appendChild(tag);
        });

        // Add event listeners for remove buttons
        document.querySelectorAll('.skill-tag .remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const interest = e.target.getAttribute('data-interest');
                if (interest) {
                    this.removeInterest(interest);
                    this.displayInterests();
                }
            });
        });
    }

    /**
     * Handle save profile button click
     */
    handleSaveProfile() {
        const aboutMe = document.getElementById('aboutMe').value;
        const newSkillInput = document.getElementById('newSkillInput');
        const newInterestInput = document.getElementById('newInterestInput');

        this.updateProfile({ bio: aboutMe });

        if (newSkillInput && newSkillInput.value) {
            this.addSkill(newSkillInput.value);
            newSkillInput.value = '';
            this.displaySkills();
        }

        if (newInterestInput && newInterestInput.value) {
            this.addInterest(newInterestInput.value);
            newInterestInput.value = '';
            this.displayInterests();
        }

        alert('Profile updated successfully!');
    }
}

// Initialize dashboard manager
const dashboardManager = new DashboardManager();

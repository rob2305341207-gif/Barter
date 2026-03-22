// Matching Module
// Handles finding and displaying skill matches between users

class MatchingEngine {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.initializeMatches();
    }

    /**
     * Load current user from localStorage
     */
    loadCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    /**
     * Get all users from localStorage
     */
    getAllUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    /**
     * Find skill matches for current user
     * Returns array of users who have skills the current user wants to learn
     */
    findMatches() {
        if (!this.currentUser) return [];

        const allUsers = this.getAllUsers();
        const currentUserSkills = this.currentUser.skills || [];
        const currentUserInterests = this.currentUser.interests || [];

        const matches = allUsers
            .filter(user => user.id !== this.currentUser.id) // Exclude current user
            .map(user => {
                const userSkills = user.skills || [];
                const userInterests = user.interests || [];

                // Calculate match score
                let matchScore = 0;

                // Skills I want to learn that they can teach
                const skillMatches = currentUserInterests.filter(interest =>
                    userSkills.includes(interest)
                ).length;

                // Skills I can teach that they want to learn
                const reverseMatches = userInterests.filter(interest =>
                    currentUserSkills.includes(interest)
                ).length;

                matchScore = (skillMatches + reverseMatches) * 10;

                return {
                    user,
                    matchScore,
                    skillMatches,
                    reverseMatches,
                    matchedSkills: currentUserInterests.filter(i => userSkills.includes(i)),
                    couldTeach: userInterests.filter(i => currentUserSkills.includes(i))
                };
            })
            .filter(match => match.matchScore > 0) // Only include users with matching skills
            .sort((a, b) => b.matchScore - a.matchScore); // Sort by highest match score

        return matches;
    }

    /**
     * Calculate compatibility percentage between two users
     */
    calculateCompatibility(matches) {
        if (matches.length === 0) return 0;
        const maxScore = matches[0].matchScore;
        return Math.min(100, Math.round((Math.random() * 40 + 60))); // Return 60-100% for demo
    }

    /**
     * Display matches on dashboard
     */
    initializeMatches() {
        const matchesList = document.getElementById('matchesList');
        if (!matchesList) return;

        const matches = this.findMatches();

        if (matches.length === 0) {
            matchesList.innerHTML = '<p>No matches found yet. Add skills and interests to find matches!</p>';
            return;
        }

        matchesList.innerHTML = '';

        matches.forEach(match => {
            const compatibilityScore = this.calculateCompatibility([match]);
            const card = document.createElement('div');
            card.className = 'match-card';
            card.innerHTML = `
                <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                    <h3>${match.user.fullName}</h3>
                    <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 0.5rem;">${match.user.email}</p>
                    
                    ${match.matchedSkills.length > 0 ? `
                        <div style="margin-bottom: 0.5rem;">
                            <strong style="font-size: 0.9rem;">Can teach me:</strong>
                            <p style="color: #6b7280; font-size: 0.85rem;">${match.matchedSkills.join(', ')}</p>
                        </div>
                    ` : ''}
                    
                    ${match.couldTeach.length > 0 ? `
                        <div style="margin-bottom: 0.5rem;">
                            <strong style="font-size: 0.9rem;">I can teach:</strong>
                            <p style="color: #6b7280; font-size: 0.85rem;">${match.couldTeach.join(', ')}</p>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
                        <span style="font-weight: 600; color: #6366f1;">${compatibilityScore}% Match</span>
                        <button class="btn btn-primary" onclick="window.location.href='chat.html'">Connect</button>
                    </div>
                </div>
            `;
            matchesList.appendChild(card);
        });
    }
}

// Initialize matching engine
const matchingEngine = new MatchingEngine();

// Authentication Module
// Handles user registration and login functionality

class AuthModel {
    constructor() {
        this.apiBase = '/api/auth';
    }

    async register(payload) {
        // Try Firebase first if initialized
        if (window.firebaseAuth && window.db) {
            try {
                const userCred = await window.firebaseAuth.createUserWithEmailAndPassword(payload.email, payload.password);
                const uid = userCred.user.uid;
                // save user profile
                await window.db.collection('users').doc(uid).set({ fullName: payload.fullName, email: payload.email, university: payload.university || '', createdAt: new Date() });
                const token = await userCred.user.getIdToken();
                return { token, user: { id: uid, fullName: payload.fullName, email: payload.email } };
            } catch (err) {
                console.warn('Firebase register failed', err);
                return { error: 'server_unavailable' };
            }
        }

        try {
            const res = await fetch(this.apiBase + '/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (err) {
            // fallback to localStorage register
            return { error: 'server_unavailable' };
        }
    }

    async login(payload) {
        // Try Firebase first
        if (window.firebaseAuth && window.db) {
            try {
                const userCred = await window.firebaseAuth.signInWithEmailAndPassword(payload.email, payload.password);
                const token = await userCred.user.getIdToken();
                const uid = userCred.user.uid;
                const userDoc = await window.db.collection('users').doc(uid).get();
                const userData = userDoc.exists ? { id: uid, ...userDoc.data() } : { id: uid, email: payload.email };
                return { token, user: userData };
            } catch (err) {
                console.warn('Firebase login failed', err);
                // fallback to API/local
            }
        }

        try {
            const res = await fetch(this.apiBase + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (err) {
            return { error: 'server_unavailable' };
        }
    }

    // local fallback helpers
    getAllUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    saveLocalUser(user) {
        const users = this.getAllUsers();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        return user;
    }
}

class AuthViewModel {
    constructor() {
        this.model = new AuthModel();
    }

    async register(fullName, email, password, confirmPassword, extra = {}) {
        if (!fullName || !email || !password || !confirmPassword) return { success: false, message: 'All fields required' };
        if (password !== confirmPassword) return { success: false, message: 'Passwords do not match' };
        if (password.length < 6) return { success: false, message: 'Password too short' };

        const payload = { fullName, email, password, ...extra };
        const res = await this.model.register(payload);
        if (res && res.token) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('currentUser', JSON.stringify(res.user));
            return { success: true, user: res.user };
        }

        // fallback: local storage
        if (res && res.error === 'server_unavailable') {
            const existing = this.model.getAllUsers().find(u => u.email === email);
            if (existing) return { success: false, message: 'Email already registered' };
            const user = { id: Date.now(), fullName, email, password: btoa(password) };
            this.model.saveLocalUser(user);
            localStorage.setItem('currentUser', JSON.stringify({ id: user.id, fullName: user.fullName, email: user.email }));
            return { success: true, user };
        }

        return { success: false, message: res.message || 'Registration failed' };
    }

    async login(email, password) {
        if (!email || !password) return { success: false, message: 'Email and password required' };
        const res = await this.model.login({ email, password });
        if (res && res.token) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('currentUser', JSON.stringify(res.user));
            return { success: true, user: res.user };
        }

        if (res && res.error === 'server_unavailable') {
            const user = this.model.getAllUsers().find(u => u.email === email && btoa(password) === u.password);
            if (!user) return { success: false, message: 'Invalid credentials' };
            localStorage.setItem('currentUser', JSON.stringify({ id: user.id, fullName: user.fullName, email: user.email }));
            return { success: true, user };
        }

        return { success: false, message: res.message || 'Login failed' };
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

const authManager = new AuthViewModel();

// Handle register form submission
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const result = authManager.register(fullName, email, password, confirmPassword);

        if (result.success) {
            alert(result.message);
            window.location.href = 'dashboard.html';
        } else {
            alert(result.message);
        }
    });
}

// Handle login form submission (MySQL + PHP)
const loginForm = document.getElementById('loginForm');

if (loginForm) {

loginForm.addEventListener('submit', function(e){

e.preventDefault();

const email = document.getElementById('email').value;
const password = document.getElementById('password').value;

fetch("php/login.php",{

method:"POST",

headers:{
"Content-Type":"application/x-www-form-urlencoded"
},

body:`email=${email}&password=${password}`

})

.then(res => res.text())

.then(data => {

console.log(data);

if(data !== "user not found" && data !== "wrong password"){

alert("Login Successful");

window.location.href = "dashboard.html";

}else{

alert(data);

}

});

});

}

// Handle logout button
const logoutButtons = document.querySelectorAll('#logoutBtn');
logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        authManager.logout();
    });
});

// Protect dashboard pages
function protectPage() {
    if (!authManager.isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

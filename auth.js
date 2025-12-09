// ═══════════════════════════════════════════════════════════════════════════════
// RASE GAMES - Authentication System
// ═══════════════════════════════════════════════════════════════════════════════

// Firebase SDK URLs
const FIREBASE_AUTH = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js';

let auth = null;
let currentUser = null;

// Initialize auth after Firebase is loaded
async function initAuth() {
    if (auth) return;

    // Make sure Firebase is loaded
    if (typeof firebase === 'undefined') {
        await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    }
    await loadScript(FIREBASE_AUTH);

    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: "AIzaSyBigRK1QV1nO-qTmMMLUcnCtXtW0e_sXnQ",
            authDomain: "rasegames-9934f.firebaseapp.com",
            databaseURL: "https://rasegames-9934f-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "rasegames-9934f"
        });
    }

    auth = firebase.auth();

    // Set persistence to LOCAL (stays logged in until logout)
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    // Listen for auth state changes
    let authStateChecked = false;
    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI();

        // Store in window for other scripts
        window.currentUser = user;

        // Only show modal after first auth check and if not logged in
        if (!authStateChecked) {
            authStateChecked = true;
            window.authStateChecked = true;
            if (!user) {
                showAuthModal();
            }
        }
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function registerUser(email, password, username) {
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        // Update profile with username
        await result.user.updateProfile({ displayName: username });

        // Save username to database
        const db = firebase.database();
        await db.ref(`users/${result.user.uid}`).set({
            username: username,
            createdAt: Date.now()
        });

        hideAuthModal();
        showNotification('Registration successful!', 'success');
        return { success: true };
    } catch (error) {
        return { success: false, error: getErrorMessage(error.code) };
    }
}

async function loginUser(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
        hideAuthModal();
        showNotification('Login successful!', 'success');
        return { success: true };
    } catch (error) {
        return { success: false, error: getErrorMessage(error.code) };
    }
}

async function loginAnonymous() {
    try {
        await auth.signInAnonymously();
        hideAuthModal();
        return { success: true };
    } catch (error) {
        return { success: false, error: getErrorMessage(error.code) };
    }
}

async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);

        // Try to save to database (don't fail if this doesn't work)
        try {
            const db = firebase.database();
            const userRef = db.ref(`users/${result.user.uid}`);
            const snapshot = await userRef.once('value');
            if (!snapshot.exists()) {
                await userRef.set({
                    username: result.user.displayName,
                    createdAt: Date.now()
                });
            }
        } catch (dbError) {
            console.log('Database save skipped:', dbError.message);
        }

        hideAuthModal();
        showNotification('Google login successful!', 'success');
        return { success: true };
    } catch (error) {
        console.error('Google login error:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

async function logoutUser() {
    try {
        await auth.signOut();
        showNotification('Logged out', 'info');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function isRegisteredUser() {
    return currentUser && !currentUser.isAnonymous;
}

function getUsername() {
    if (!currentUser) return null;
    return currentUser.displayName || 'Anonymous';
}

function getErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'Email already in use',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/user-not-found': 'User not found',
        'auth/wrong-password': 'Wrong password'
    };
    return messages[code] || 'An error occurred';
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function createAuthModal() {
    if (document.getElementById('auth-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-modal hidden';
    modal.innerHTML = `
        <div class="auth-overlay" onclick="hideAuthModal()"></div>
        <div class="auth-container">
            <button class="auth-close" onclick="hideAuthModal()">×</button>
            
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="switchAuthTab('login')">Log In</button>
                <button class="auth-tab" onclick="switchAuthTab('register')">Sign Up</button>
            </div>
            
            <form id="login-form" class="auth-form" onsubmit="handleLogin(event)">
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit" class="auth-btn primary">Log In</button>
                <div class="auth-divider">or</div>
                <button type="button" class="auth-btn google" onclick="handleGoogle()">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Sign in with Google
                </button>
                <button type="button" class="auth-btn secondary" onclick="handleAnonymous()">Continue as Guest</button>
                <p class="auth-note">⚠️ Guests cannot appear on leaderboard</p>
            </form>
            
            <form id="register-form" class="auth-form hidden" onsubmit="handleRegister(event)">
                <input type="text" id="register-username" placeholder="Username" required minlength="3" maxlength="20">
                <input type="email" id="register-email" placeholder="Email" required>
                <input type="password" id="register-password" placeholder="Password (min 6 chars)" required minlength="6">
                <button type="submit" class="auth-btn primary">Sign Up</button>
            </form>
            
            <div id="auth-error" class="auth-error hidden"></div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showAuthModal() {
    createAuthModal();
    document.getElementById('auth-modal').classList.remove('hidden');
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab:${tab === 'login' ? 'first' : 'last'}-child`).classList.add('active');

    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    document.getElementById('auth-error').classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await loginUser(email, password);
    if (!result.success) {
        showAuthError(result.error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const result = await registerUser(email, password, username);
    if (!result.success) {
        showAuthError(result.error);
    }
}

async function handleAnonymous() {
    await loginAnonymous();
}

async function handleGoogle() {
    const result = await loginWithGoogle();
    if (!result.success) {
        showAuthError(result.error);
    }
}

function showAuthError(message) {
    const error = document.getElementById('auth-error');
    error.textContent = message;
    error.classList.remove('hidden');
}

function updateAuthUI() {
    const userDisplay = document.getElementById('user-display');
    if (!userDisplay) return;

    if (currentUser) {
        if (currentUser.isAnonymous) {
            userDisplay.innerHTML = `<span class="user-guest">👤 Guest</span> <button onclick="showAuthModal()" class="btn-small">Sign Up</button>`;
        } else {
            userDisplay.innerHTML = `<a href="/profile" onclick="route()" class="user-name-link">👤 ${currentUser.displayName}</a> <button onclick="logoutUser()" class="btn-small">Logout</button>`;
        }
    } else {
        userDisplay.innerHTML = `<button onclick="showAuthModal()" class="btn-small">Log In</button>`;
    }
}

function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `auth-notif ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

// Export
window.Auth = {
    login: loginUser,
    register: registerUser,
    loginAnonymous,
    logout: logoutUser,
    isRegistered: isRegisteredUser,
    getUsername,
    showModal: showAuthModal
};

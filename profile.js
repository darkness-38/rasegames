// ═══════════════════════════════════════════════════════════════════════════════
// RASE GAMES - Profile Page
// ═══════════════════════════════════════════════════════════════════════════════

const AVATARS = ['🎮', '👾', '🕹️', '🎯', '🏆', '⚡', '🔥', '💎', '🌟', '🎪', '🎭', '🎨',
    '🐍', '🏃', '💻', '🚀', '👑', '🎵', '🌈', '💀', '🤖', '👽', '🦊', '🐉'];

let selectedAvatar = '🎮';
let userProfile = null;

// Initialize profile page
function initProfile() {
    // Render avatar grid first
    renderAvatarGrid();

    // Wait for auth to initialize
    let attempts = 0;
    const checkAuth = setInterval(() => {
        attempts++;
        const user = window.currentUser;

        if (user !== undefined) {
            clearInterval(checkAuth);

            if (user && !user.isAnonymous) {
                showProfileContent();
                loadUserProfile();
            } else {
                showNotLoggedIn();
            }
        } else if (attempts > 30) { // 3 seconds max
            clearInterval(checkAuth);
            showNotLoggedIn();
        }
    }, 100);
}

function showProfileContent() {
    document.getElementById('not-logged-in').classList.add('hidden');
    document.getElementById('profile-content').classList.remove('hidden');
}

function showNotLoggedIn() {
    document.getElementById('not-logged-in').classList.remove('hidden');
    document.getElementById('profile-content').classList.add('hidden');
}

function renderAvatarGrid() {
    const grid = document.getElementById('avatar-grid');
    if (!grid) return;

    grid.innerHTML = AVATARS.map(avatar => `
        <div class="avatar-option ${avatar === selectedAvatar ? 'selected' : ''}" 
             onclick="selectAvatar('${avatar}')">${avatar}</div>
    `).join('');
}

function selectAvatar(avatar) {
    selectedAvatar = avatar;
    document.getElementById('current-avatar').textContent = avatar;
    renderAvatarGrid();
}

async function loadUserProfile() {
    const user = window.currentUser;
    if (!user) return;

    // Display basic info
    document.getElementById('display-name').textContent = user.displayName || 'Player';
    document.getElementById('user-email').textContent = user.email || '';
    document.getElementById('input-username').value = user.displayName || '';

    // Load from database
    try {
        await loadFirebaseDB();
        const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        userProfile = snapshot.val() || {};

        // Set avatar
        if (userProfile.avatar) {
            selectedAvatar = userProfile.avatar;
            document.getElementById('current-avatar').textContent = selectedAvatar;
            renderAvatarGrid();
        }

        // Set stats
        if (userProfile.gamesPlayed) {
            document.getElementById('stat-games').textContent = userProfile.gamesPlayed;
        }
        if (userProfile.bestScore) {
            document.getElementById('stat-best').textContent = formatScore(userProfile.bestScore);
        }
        if (userProfile.createdAt) {
            document.getElementById('stat-joined').textContent = formatDate(userProfile.createdAt);
        }

    } catch (e) {
        console.error('Load profile error:', e);
    }
}

async function loadFirebaseDB() {
    if (typeof firebase !== 'undefined' && firebase.database) return;

    await loadScriptOnce('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    await loadScriptOnce('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');

    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: "AIzaSyBigRK1QV1nO-qTmMMLUcnCtXtW0e_sXnQ",
            authDomain: "rasegames-9934f.firebaseapp.com",
            databaseURL: "https://rasegames-9934f-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "rasegames-9934f"
        });
    }
}

function loadScriptOnce(src) {
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

async function saveProfile(e) {
    e.preventDefault();

    const btn = document.getElementById('save-btn');
    const username = document.getElementById('input-username').value.trim();

    if (!username || username.length < 2) {
        alert('Kullanıcı adı en az 2 karakter olmalı');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Kaydediliyor...';

    try {
        const user = window.currentUser;
        // Update Firebase Auth profile
        await user.updateProfile({ displayName: username });

        // Update database
        await loadFirebaseDB();
        await firebase.database().ref(`users/${user.uid}`).update({
            username: username,
            avatar: selectedAvatar,
            updatedAt: Date.now()
        });

        // Update UI
        document.getElementById('display-name').textContent = username;

        showProfileNotification('Profil kaydedildi!', 'success');

    } catch (e) {
        console.error('Save profile error:', e);
        showProfileNotification('Bir hata oluştu', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Kaydet';
}

function formatScore(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function showProfileNotification(message, type) {
    const notif = document.createElement('div');
    notif.className = `auth-notif ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Listen for auth changes
if (typeof window !== 'undefined') {
    const originalUpdateAuthUI = window.updateAuthUI;
    window.updateAuthUI = function () {
        if (originalUpdateAuthUI) originalUpdateAuthUI();

        // Refresh profile if on profile page
        if (document.getElementById('profile-content')) {
            const user = window.currentUser;
            if (user && !user.isAnonymous) {
                showProfileContent();
                loadUserProfile();
            } else {
                showNotLoggedIn();
            }
        }
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProfile);

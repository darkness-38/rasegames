



const AVATARS = ['🎮', '👾', '🕹️', '🎯', '🏆', '⚡', '🔥', '💎', '🌟', '🎪', '🎭', '🎨',
    '🐍', '🏃', '💻', '🚀', '👑', '🎵', '🌈', '💀', '🤖', '👽', '🦊', '🐉'];

let selectedAvatar = '🎮';
let userProfile = null;


function initProfile() {

    renderAvatarGrid();


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
        } else if (attempts > 30) {
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

// Edit Modal Functions
function openEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // Set current username in input
        const user = window.currentUser;
        if (user) {
            document.getElementById('input-username').value = user.displayName || '';
        }
        renderAvatarGrid();
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Export functions
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;

async function loadUserProfile() {
    const user = window.currentUser;
    if (!user) return;


    document.getElementById('display-name').textContent = user.displayName || 'Player';
    document.getElementById('user-email').textContent = user.email || '';
    document.getElementById('input-username').value = user.displayName || '';


    try {
        await loadFirebaseDB();
        const db = firebase.database();


        const snapshot = await db.ref(`users/${user.uid}`).once('value');
        userProfile = snapshot.val() || {};


        if (userProfile.avatar) {
            selectedAvatar = userProfile.avatar;
            document.getElementById('current-avatar').textContent = selectedAvatar;
            renderAvatarGrid();
        }

        // Show account creation date from Firebase metadata (actual account creation time)
        // Firebase's creationTime is an ISO string like "Fri, 20 Dec 2024 09:00:00 GMT"
        if (user.metadata && user.metadata.creationTime) {
            const createdAt = new Date(user.metadata.creationTime);
            document.getElementById('stat-joined').textContent = formatDate(createdAt);
        } else if (userProfile.createdAt) {
            document.getElementById('stat-joined').textContent = formatDate(new Date(userProfile.createdAt));
        }


        const games = ['snake', 'clicker', 'runner'];
        let bestRank = null;
        let totalGames = 0;

        for (const game of games) {
            const leaderboardSnapshot = await db.ref(`leaderboards/${game}`)
                .orderByChild('score')
                .once('value');

            const entries = [];
            leaderboardSnapshot.forEach(child => {
                entries.push({
                    uid: child.val().uid,
                    score: child.val().score
                });
            });


            entries.sort((a, b) => b.score - a.score);


            const userIndex = entries.findIndex(e => e.uid === user.uid);
            if (userIndex !== -1) {
                totalGames++;
                const rank = userIndex + 1;
                if (bestRank === null || rank < bestRank) {
                    bestRank = rank;
                }
            }
        }


        document.getElementById('stat-games').textContent = totalGames;
        document.getElementById('stat-best').textContent = bestRank ? `#${bestRank}` : '-';

    } catch (e) {
        console.error('Load profile error:', e);
    }
}

async function loadFirebaseDB() {
    if (typeof firebase !== 'undefined' && typeof firebase.database === 'function') return;

    await loadScriptOnce('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    await loadScriptOnce('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');


    await new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            if (typeof firebase !== 'undefined' && typeof firebase.database === 'function') {
                resolve();
            } else if (attempts++ > 30) {
                reject(new Error('firebase.database not available'));
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });

    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: atob('QUl6YVN5QmlnUksxUVYxbk8tcVRtTU1MVWNuQ3RYdFcwZV9zWG5R'),
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
        script.onload = () => setTimeout(resolve, 50);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function saveProfile(e) {
    e.preventDefault();

    const btn = document.getElementById('save-btn');
    const username = document.getElementById('input-username').value.trim();

    if (!username || username.length < 2) {
        showProfileNotification('Username must be at least 2 characters', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Checking...';

    try {
        const user = window.currentUser;

        // Check if username is already taken by another user
        if (typeof window.checkUsernameAvailable === 'function') {
            const isAvailable = await window.checkUsernameAvailable(username, user.uid);
            if (!isAvailable) {
                showProfileNotification('This username is already taken', 'error');
                btn.disabled = false;
                btn.textContent = 'Save';
                return;
            }
        }

        btn.textContent = 'Saving...';

        await user.updateProfile({ displayName: username });


        await loadFirebaseDB();
        const db = firebase.database();

        await db.ref(`users/${user.uid}`).update({
            username: username,
            usernameLower: username.toLowerCase(),
            avatar: selectedAvatar,
            updatedAt: Date.now()
        });

        // Update username in all leaderboard entries
        const games = ['tictactoe', 'minesweeper', 'pong', 'memory', 'game2048', 'flappy', 'snake', 'clicker', 'runner', 'tetris'];
        for (const game of games) {
            try {
                const snapshot = await db.ref(`leaderboards/${game}`)
                    .orderByChild('uid')
                    .equalTo(user.uid)
                    .once('value');

                if (snapshot.exists()) {
                    const updates = {};
                    snapshot.forEach(child => {
                        updates[`leaderboards/${game}/${child.key}/name`] = username;
                    });
                    if (Object.keys(updates).length > 0) {
                        await db.ref().update(updates);
                    }
                }
            } catch (e) {
                console.log(`Could not update ${game} leaderboard:`, e);
            }
        }

        document.getElementById('display-name').textContent = username;

        closeEditModal();
        showProfileNotification('Profile saved!', 'success');

    } catch (e) {
        console.error('Save profile error:', e);
        showProfileNotification('An error occurred', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Save';
}

function formatScore(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function showProfileNotification(message, type) {
    const notif = document.createElement('div');
    notif.className = `auth-notif ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}


if (typeof window !== 'undefined') {
    const originalUpdateAuthUI = window.updateAuthUI;
    window.updateAuthUI = function () {
        if (originalUpdateAuthUI) originalUpdateAuthUI();


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


document.addEventListener('DOMContentLoaded', initProfile);


window.initProfile = initProfile;

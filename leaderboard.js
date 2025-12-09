// ═══════════════════════════════════════════════════════════════════════════════
// RASE GAMES - Global Leaderboard System
// ═══════════════════════════════════════════════════════════════════════════════

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBigRK1QV1nO-qTmMMLUcnCtXtW0e_sXnQ",
    authDomain: "rasegames-9934f.firebaseapp.com",
    databaseURL: "https://rasegames-9934f-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "rasegames-9934f",
    storageBucket: "rasegames-9934f.firebasestorage.app",
    messagingSenderId: "762399445136",
    appId: "1:762399445136:web:7dea2f9064963fc03dc815"
};

// Firebase SDK (using compat version for simplicity)
const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
const FIREBASE_DB = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js';

let db = null;
let firebaseReady = false;
let firebaseLoading = null; // Loading lock

// Load Firebase SDK
async function loadFirebase() {
    if (firebaseReady && db) {
        return true;
    }

    // If already loading, wait for that to complete
    if (firebaseLoading) {
        return firebaseLoading;
    }

    firebaseLoading = (async () => {
        try {
            // Load Firebase App first
            await loadScript(FIREBASE_SDK);

            // Wait for firebase to be available
            await waitForGlobal('firebase', 3000);

            // Load Database
            await loadScript(FIREBASE_DB);

            // Wait for firebase.database to be a function
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const check = () => {
                    if (typeof firebase.database === 'function') {
                        resolve();
                    } else if (attempts++ > 30) {
                        reject(new Error('firebase.database not available'));
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });

            // Initialize
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            db = firebase.database();
            firebaseReady = true;
            return true;
        } catch (e) {
            console.error('Firebase load error:', e);
            return false;
        }
    })();

    return firebaseLoading;
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
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

function waitForGlobal(name, timeout = 2000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            if (window[name]) {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error(`${name} not loaded`));
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Get player name (stored in cookie or prompt)
function getPlayerName() {
    let name = getCookieLB('playerName');
    if (!name) {
        name = prompt('Enter your name for the leaderboard:', 'Player');
        if (name && name.trim()) {
            name = name.trim().substring(0, 20); // Max 20 chars
            setCookieLB('playerName', name);
        } else {
            name = 'Anonymous';
        }
    }
    return name;
}

function setCookieLB(name, value) {
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000`;
}

function getCookieLB(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// Submit score to leaderboard (only for registered users)
async function submitScore(game, score) {
    // Check if user is registered (not anonymous)
    const user = window.currentUser;
    if (!user || user.isAnonymous) {
        console.log('Leaderboard: Only registered users can submit scores');
        return false;
    }

    if (!await loadFirebase()) {
        console.error('Firebase not loaded');
        return false;
    }

    const name = user.displayName || 'Player';
    const uid = user.uid;
    const ref = db.ref(`leaderboards/${game}`);

    try {
        // Check if user already has a score (by uid)
        const snapshot = await ref.orderByChild('uid').equalTo(uid).once('value');
        const existing = snapshot.val();

        if (existing) {
            // Update only if new score is higher
            const key = Object.keys(existing)[0];
            if (score > existing[key].score) {
                await ref.child(key).update({
                    score: score,
                    name: name, // Update name in case it changed
                    timestamp: Date.now()
                });
            }
        } else {
            // Add new entry
            await ref.push({
                uid: uid,
                name: name,
                score: score,
                timestamp: Date.now()
            });
        }

        return true;
    } catch (e) {
        console.error('Submit score error:', e);
        return false;
    }
}

// Get top scores for a game
async function getLeaderboard(game, limit = 10) {
    if (!await loadFirebase()) {
        return [];
    }

    try {
        console.log(`Fetching leaderboard: ${game}`);
        const snapshot = await db.ref(`leaderboards/${game}`)
            .orderByChild('score')
            .limitToLast(limit)
            .once('value');

        const entries = [];
        snapshot.forEach(child => {
            entries.push({
                name: child.val().name,
                score: child.val().score
            });
        });

        // Sort descending
        entries.sort((a, b) => b.score - a.score);
        console.log(`Leaderboard ${game}: ${entries.length} entries`);
        return entries;
    } catch (e) {
        console.error('Get leaderboard error:', e);
        return [];
    }
}

// Render leaderboard to table
function renderLeaderboard(elementId, entries) {
    const tbody = document.getElementById(elementId);
    if (!tbody) return;

    if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-message">No scores yet. Be the first!</td></tr>';
        return;
    }

    tbody.innerHTML = entries.map((entry, i) => `
        <tr>
            <td class="rank rank-${i + 1}">#${i + 1}</td>
            <td class="player-name">${escapeHtml(entry.name)}</td>
            <td class="player-score">${formatNumber(entry.score)}</td>
        </tr>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD LEADERBOARDS ON PAGE
// ═══════════════════════════════════════════════════════════════════════════════

async function loadAllLeaderboards() {
    const [snake, clicker, runner] = await Promise.all([
        getLeaderboard('snake'),
        getLeaderboard('clicker'),
        getLeaderboard('runner')
    ]);

    renderLeaderboard('snake-leaderboard', snake);
    renderLeaderboard('clicker-leaderboard', clicker);
    renderLeaderboard('runner-leaderboard', runner);
}

// Auto-load if on leaderboard page
async function tryLoadLeaderboards() {
    const el = document.getElementById('snake-leaderboard');
    if (el) {
        console.log('Loading leaderboards...');
        await loadAllLeaderboards();
        console.log('Leaderboards loaded');
        return true;
    }
    return false;
}

// Try loading with multiple attempts
async function initLeaderboards() {
    if (await tryLoadLeaderboards()) return;

    // Retry after short delays (for SPA routing)
    setTimeout(tryLoadLeaderboards, 300);
    setTimeout(tryLoadLeaderboards, 800);
    setTimeout(tryLoadLeaderboards, 1500);
}

// Initialize
initLeaderboards();
document.addEventListener('DOMContentLoaded', initLeaderboards);

// Also expose for manual trigger
window.loadLeaderboards = loadAllLeaderboards;

// Export for games to use
window.Leaderboard = {
    submit: submitScore,
    get: getLeaderboard,
    getPlayerName: getPlayerName
};

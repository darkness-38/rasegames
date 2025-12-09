// Game Variables
let score = 0;
let clickPower = 1;
let passiveIncome = 0;
let totalClicks = 0;
let clickCount = 0;

// DOM Elements
const scoreElement = document.getElementById('score');
const cpsElement = document.getElementById('cps');
const clickBtn = document.getElementById('click-btn');
const upgradesContainer = document.getElementById('upgrades-container');
const clickUpgradesContainer = document.getElementById('click-upgrades-container');
const achievementsContainer = document.getElementById('achievements-container');
const notification = document.getElementById('achievement-notification');
const notificationText = document.getElementById('achievement-text');

// Game Data
const passiveUpgrades = [
    { id: 'localhost', name: 'Localhost', cost: 15, increase: 0.5, count: 0, icon: '💻' },
    { id: 'git_repo', name: 'Git Repository', cost: 100, increase: 4, count: 0, icon: '📂' },
    { id: 'cloud_cluster', name: 'Cloud Cluster', cost: 1100, increase: 12, count: 0, icon: '☁️' },
    { id: 'firewall', name: 'Firewall', cost: 12000, increase: 45, count: 0, icon: '🛡️' },
    { id: 'ai_assistant', name: 'AI Assistant', cost: 130000, increase: 150, count: 0, icon: '🤖' },
    { id: 'data_center', name: 'Data Center', cost: 1400000, increase: 600, count: 0, icon: '🏢' }
];

const clickUpgrades = [
    { id: 'mech_keyboard', name: 'Mech Keyboard', cost: 500, multiplier: 2, purchased: false, icon: '⌨️' },
    { id: 'overclock', name: 'Overclocking', cost: 5000, multiplier: 2, purchased: false, icon: '⚡' },
    { id: 'liquid_cooling', name: 'Liquid Cooling', cost: 50000, multiplier: 2, purchased: false, icon: '💧' }
];

const achievements = [
    { id: 'hello_world', name: 'Hello World', requirement: 100, type: 'score', reward: 50, unlocked: false },
    { id: 'script_kiddie', name: 'Script Kiddie', requirement: 1000, type: 'clicks', reward: 500, unlocked: false },
    { id: 'full_stack', name: 'Full Stack Dev', requirement: 1000000, type: 'score', reward: 50000, unlocked: false },
    { id: 'backup_secure', name: 'Backup Secure', requirement: 0, type: 'manual_save', reward: 100, unlocked: false }
];

const facts = [
    "It works on my machine.",
    "0.0.0.0/0",
    "Have you tried turning it off and on again?",
    "There is no place like 127.0.0.1",
    "sudo rm -rf / (Just kidding)"
];

// Initialize Game
function init() {
    loadGame();
    renderUpgrades();
    renderAchievements();
    updateUI();
    setInterval(gameLoop, 1000);
    setInterval(updateTicker, 15000); // Change fact every 15s
    setInterval(saveGame, 60000); // Auto save every minute
    initFireflies();

    clickBtn.addEventListener('click', handleClick);
}

// Core Mechanics
function handleClick(e) {
    score += clickPower;
    totalClicks++;
    createParticleEffect(e);
    checkAchievementsChannel('clicks', totalClicks);
    updateUI();
}

function gameLoop() {
    score += passiveIncome;
    checkAchievementsChannel('score', score);
    checkMilestones();
    updateUI();
}

// Upgrades
function buyUpgrade(id) {
    const upgrade = passiveUpgrades.find(u => u.id === id);
    if (upgrade && score >= upgrade.cost) {
        score -= upgrade.cost;
        upgrade.count++;
        passiveIncome += upgrade.increase;
        upgrade.cost = Math.ceil(upgrade.cost * 1.15);
        updateUI();
        renderUpgrades(); // Re-render to update cost/count
    }
}

function buyClickUpgrade(id) {
    const upgrade = clickUpgrades.find(u => u.id === id);
    if (upgrade && score >= upgrade.cost && !upgrade.purchased) {
        score -= upgrade.cost;
        upgrade.purchased = true;
        clickPower *= upgrade.multiplier;
        updateUI();
        renderClickUpgrades();
    }
}

// UI Rendering
function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    passiveUpgrades.forEach(u => {
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        item.onclick = () => buyUpgrade(u.id);
        item.innerHTML = `
            <span class="icon">${u.icon}</span>
            <div class="info">
                <h4>${u.name}</h4>
                <p>Cost: ${u.cost} | +${u.increase}/s</p>
            </div>
            <div class="count">${u.count}</div>
        `;
        upgradesContainer.appendChild(item);
    });
    renderClickUpgrades();
}

function renderClickUpgrades() {
    clickUpgradesContainer.innerHTML = '';
    clickUpgrades.forEach(u => {
        if (!u.purchased) {
            const item = document.createElement('div');
            item.className = 'upgrade-item';
            item.onclick = () => buyClickUpgrade(u.id);
            item.innerHTML = `
                <span class="icon">${u.icon}</span>
                <div class="info">
                    <h4>${u.name}</h4>
                    <p>Cost: ${u.cost} | Power x${u.multiplier}</p>
                </div>
            `;
            clickUpgradesContainer.appendChild(item);
        }
    });
}

function renderAchievements() {
    achievementsContainer.innerHTML = '';
    achievements.forEach(a => {
        const item = document.createElement('div');
        item.className = `achievement-item ${a.unlocked ? 'unlocked' : ''}`;
        item.innerHTML = `
            <span class="icon">${a.unlocked ? '🏆' : '🔒'}</span>
            <div class="info">
                <h4>${a.name}</h4>
                <p>${a.unlocked ? 'Unlocked!' : 'Locked'}</p>
            </div>
        `;
        achievementsContainer.appendChild(item);
    });
}

function updateUI() {
    scoreElement.textContent = Math.floor(score).toLocaleString();
    cpsElement.textContent = passiveIncome.toFixed(1);
}

function updateAchievementCard(id) {
    renderAchievements(); // Simple refresh
}

// Notifications
function showNotification(name, reward) {
    notificationText.innerHTML = `${name}<br><span style="font-size: 0.8rem; color: #ffd700;">+${reward} LoC</span>`;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Achievements
function checkAchievementsChannel(type, value) {
    achievements.forEach(ach => {
        if (!ach.unlocked && ach.type === type && value >= ach.requirement) {
            unlockAchievement(ach);
        }
    });
}

function unlockAchievement(ach) {
    ach.unlocked = true;
    score += ach.reward;
    showNotification(ach.name, ach.reward);
    renderAchievements();
}

// Effects
function createParticleEffect(e) {
    const particle = document.createElement('div');
    particle.className = 'click-particle';
    particle.textContent = `+${clickPower}`;
    particle.style.left = `${e.clientX}px`;
    particle.style.top = `${e.clientY}px`;
    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
}

// Ticker
function updateTicker() {
    const ticker = document.getElementById('fact-text');
    if (ticker) {
        ticker.textContent = facts[Math.floor(Math.random() * facts.length)];
    }
}

// Fireflies (Matrix Rain ish)
function initFireflies() {
    const container = document.getElementById('fireflies-container');
    container.innerHTML = ''; // Clear old
    for (let i = 0; i < 20; i++) {
        const f = document.createElement('div');
        f.className = 'firefly';
        f.innerText = '01';
        f.style.left = Math.random() * 100 + '%';
        f.style.top = Math.random() * 100 + '%';
        f.style.animationDelay = Math.random() * 5 + 's';
        f.style.color = '#0f0';
        f.style.fontSize = '10px';
        f.style.opacity = '0.3';
        container.appendChild(f);
    }
}

// Save/Load System
function saveGame() {
    const saveData = {
        score,
        clickPower,
        passiveIncome,
        totalClicks,
        upgrades: passiveUpgrades.map(u => ({ id: u.id, count: u.count, cost: u.cost })),
        clickUpgrades: clickUpgrades.map(u => ({ id: u.id, purchased: u.purchased })),
        achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked }))
    };
    localStorage.setItem('codeClickerSave', JSON.stringify(saveData));
}

function loadGame() {
    // Try legacy save first if new one doesn't exist to migrate? 
    // Or just clean start. Let's do separate save key to avoid conflicts with old structure.
    const saved = JSON.parse(localStorage.getItem('codeClickerSave'));
    if (saved) {
        score = saved.score || 0;
        clickPower = saved.clickPower || 1;
        passiveIncome = saved.passiveIncome || 0;
        totalClicks = saved.totalClicks || 0;

        if (saved.upgrades) {
            saved.upgrades.forEach(savedU => {
                const u = passiveUpgrades.find(p => p.id === savedU.id);
                if (u) {
                    u.count = savedU.count;
                    u.cost = savedU.cost;
                }
            });
        }

        if (saved.clickUpgrades) {
            saved.clickUpgrades.forEach(savedU => {
                const u = clickUpgrades.find(p => p.id === savedU.id);
                if (u) u.purchased = savedU.purchased;
            });
        }

        if (saved.achievements) {
            saved.achievements.forEach(savedA => {
                const a = achievements.find(p => p.id === savedA.id);
                if (a) a.unlocked = savedA.unlocked;
            });
        }
    }
}

// Manual Save & Special Achievements
window.saveGameManual = function () {
    saveGame();
    // Check manual save achievement
    const ach = achievements.find(a => a.id === 'backup_secure');
    if (ach && !ach.unlocked) {
        unlockAchievement(ach);
        saveGame(); // Save again to store the unlocked achievement
    } else {
        const prevText = notificationText.innerHTML;
        notificationText.textContent = "System Backup Complete!";
        notification.classList.remove('hidden');
        setTimeout(() => notification.classList.add('hidden'), 2000);
    }
};

// Global Tabs
window.switchTab = function (tabName) {
    document.querySelectorAll('.panel-content').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`${tabName}-section`).style.display = 'block';
};

// Events / Milestones logic from previous history
const milestones = [
    { score: 1000, reached: false, event: 'data_surge' },
    { score: 10000, reached: false, event: 'system_overdrive' },
    { score: 50000, reached: false, event: 'singularity' }
];

function checkMilestones() {
    milestones.forEach(m => {
        if (!m.reached && score >= m.score) {
            m.reached = true;
            showNotification("Traffic Spike!", "Bonus");
        }
    });
}

function scheduleNextBugBounty() {
    setTimeout(spawnBugBounty, Math.random() * 30000 + 30000); // 30-60s
}

function spawnBugBounty() {
    const bug = document.createElement('div');
    bug.className = 'bug-bounty';
    bug.innerText = '🐛';
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    bug.style.position = 'fixed';
    bug.style.left = `${x}px`;
    bug.style.top = `${y}px`;
    bug.style.fontSize = '2rem';
    bug.style.cursor = 'pointer';
    bug.style.zIndex = '1000';

    bug.onclick = () => {
        const reward = Math.max(500, passiveIncome * 60);
        score += reward;
        showNotification("Bug Fixed!", Math.floor(reward));
        bug.remove();
    };

    document.body.appendChild(bug);
    setTimeout(() => { if (bug.parentElement) bug.remove(); }, 10000);

    scheduleNextBugBounty();
}

// Start
init();
scheduleNextBugBounty();

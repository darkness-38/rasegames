




let score = 0;
let clickPower = 1;
let passiveIncome = 0;
let totalClicks = 0;
let totalEarned = 0;


const scoreElement = document.getElementById('score');
const cpsElement = document.getElementById('cps');
const clickBtn = document.getElementById('click-btn');
const upgradesContainer = document.getElementById('upgrades-container');
const clickUpgradesContainer = document.getElementById('click-upgrades-container');
const achievementsContainer = document.getElementById('achievements-container');
const notification = document.getElementById('achievement-notification');
const notificationText = document.getElementById('achievement-text');





const passiveUpgrades = [
    { id: 'localhost', name: 'Localhost', baseCost: 15, increase: 0.1, count: 0, icon: '💻', desc: 'A humble beginning.' },
    { id: 'git_repo', name: 'Git Repository', baseCost: 100, increase: 1, count: 0, icon: '📂', desc: 'Version control is key.' },
    { id: 'vps', name: 'VPS Server', baseCost: 500, increase: 5, count: 0, icon: '🖥️', desc: 'Your own virtual server.' },
    { id: 'cloud_cluster', name: 'Cloud Cluster', baseCost: 3000, increase: 20, count: 0, icon: '☁️', desc: 'Scale to the clouds.' },
    { id: 'cdn', name: 'CDN Network', baseCost: 10000, increase: 75, count: 0, icon: '🌐', desc: 'Global content delivery.' },
    { id: 'firewall', name: 'Enterprise Firewall', baseCost: 40000, increase: 200, count: 0, icon: '🛡️', desc: 'Maximum security.' },
    { id: 'ai_assistant', name: 'AI Co-Pilot', baseCost: 200000, increase: 800, count: 0, icon: '🤖', desc: 'AI writes code for you.' },
    { id: 'quantum', name: 'Quantum Computer', baseCost: 1000000, increase: 4000, count: 0, icon: '⚛️', desc: 'Beyond classical limits.' },
    { id: 'data_center', name: 'Hyperscale Data Center', baseCost: 5000000, increase: 20000, count: 0, icon: '🏢', desc: 'Infinite compute power.' },
    { id: 'neural_net', name: 'Neural Network Farm', baseCost: 50000000, increase: 100000, count: 0, icon: '🧠', desc: 'Sentient code generation.' }
];

const clickUpgrades = [
    { id: 'mech_keyboard', name: 'Mechanical Keyboard', cost: 100, multiplier: 2, purchased: false, icon: '⌨️', desc: 'Faster typing.' },
    { id: 'dual_monitor', name: 'Dual Monitors', cost: 500, multiplier: 2, purchased: false, icon: '🖥️', desc: 'More screen real estate.' },
    { id: 'overclock', name: 'Overclocked CPU', cost: 5000, multiplier: 2, purchased: false, icon: '⚡', desc: 'Push the limits.' },
    { id: 'ergonomic', name: 'Ergonomic Setup', cost: 25000, multiplier: 2, purchased: false, icon: '🪑', desc: 'Code all day.' },
    { id: 'liquid_cooling', name: 'Liquid Cooling', cost: 100000, multiplier: 2, purchased: false, icon: '💧', desc: 'Stay cool under pressure.' },
    { id: 'caffeine', name: 'IV Caffeine Drip', cost: 500000, multiplier: 3, purchased: false, icon: '☕', desc: 'Never sleep again.' }
];

const achievements = [
    { id: 'hello_world', name: 'Hello World', requirement: 100, type: 'score', reward: 50, unlocked: false, desc: 'Earn 100 LoC' },
    { id: 'script_kiddie', name: 'Script Kiddie', requirement: 100, type: 'clicks', reward: 100, unlocked: false, desc: 'Click 100 times' },
    { id: 'junior_dev', name: 'Junior Developer', requirement: 1000, type: 'score', reward: 500, unlocked: false, desc: 'Earn 1,000 LoC' },
    { id: 'clicker', name: 'Compulsive Clicker', requirement: 500, type: 'clicks', reward: 250, unlocked: false, desc: 'Click 500 times' },
    { id: 'mid_dev', name: 'Mid-Level Developer', requirement: 10000, type: 'score', reward: 2500, unlocked: false, desc: 'Earn 10,000 LoC' },
    { id: 'senior_dev', name: 'Senior Developer', requirement: 100000, type: 'score', reward: 10000, unlocked: false, desc: 'Earn 100,000 LoC' },
    { id: 'full_stack', name: 'Full Stack Developer', requirement: 1000000, type: 'score', reward: 100000, unlocked: false, desc: 'Earn 1,000,000 LoC' },
    { id: 'tech_lead', name: 'Tech Lead', requirement: 10000000, type: 'score', reward: 1000000, unlocked: false, desc: 'Earn 10,000,000 LoC' },
    { id: 'cto', name: 'CTO', requirement: 100000000, type: 'score', reward: 10000000, unlocked: false, desc: 'Earn 100,000,000 LoC' },
    { id: 'backup_secure', name: 'Backup Secured', requirement: 0, type: 'manual_save', reward: 100, unlocked: false, desc: 'Manually save the game' },
    { id: 'first_upgrade', name: 'First Upgrade', requirement: 1, type: 'upgrades', reward: 50, unlocked: false, desc: 'Buy your first upgrade' },
    { id: 'collector', name: 'Collector', requirement: 10, type: 'upgrades', reward: 500, unlocked: false, desc: 'Own 10 upgrades total' },
    { id: 'event_hunter', name: 'Event Hunter', requirement: 5, type: 'events', reward: 1000, unlocked: false, desc: 'Catch 5 random events' }
];

const facts = [
    "// It works on my machine",
    "console.log('debugging')...",
    "git push --force",
    "There's no place like 127.0.0.1",
    "sudo rm -rf / (Don't try this)",
    "while(true) { code(); }",
    "404: Sleep not found",
    "Have you tried turning it off and on again?",
    "Coffee.drink() || die()",
    "Segmentation fault (core dumped)"
];





const randomEvents = [
    { id: 'bug_bounty', name: '🐛 Bug Bounty!', icon: '🐛', reward: () => Math.min(1500, Math.max(100, passiveIncome * 30)), duration: 8000 },
    { id: 'data_packet', name: '📦 Data Packet!', icon: '📦', reward: () => Math.min(1500, Math.max(50, passiveIncome * 15)), duration: 6000 },
    { id: 'coffee', name: '☕ Coffee Break!', icon: '☕', reward: () => Math.min(1500, Math.max(50, clickPower * 50)), duration: 10000 },
    { id: 'sponsor', name: '💰 Sponsor Deal!', icon: '💰', reward: () => Math.min(1500, Math.max(300, passiveIncome * 100)), duration: 4000 }
];

let eventsCollected = 0;

// Buff states
let coffeeActive = false;
let coffeeCooldown = false;
let debugActive = false;
let debugCooldown = false;
let autoClickInterval = null;

const COFFEE_DURATION = 15000; // 15 seconds
const COFFEE_COOLDOWN = 60000; // 60 seconds
const DEBUG_DURATION = 10000; // 10 seconds
const DEBUG_COOLDOWN = 45000; // 45 seconds

function activateCoffeeBreak() {
    if (coffeeActive || coffeeCooldown) return;

    coffeeActive = true;
    const originalClickPower = clickPower;
    clickPower *= 2;

    const coffeeStatus = document.getElementById('coffee-status');
    const coffeeBtn = document.getElementById('coffee-btn');
    coffeeBtn.classList.add('border-orange-500', 'bg-orange-500/10');

    showNotification('☕ Coffee Break!', `Click Power: ${clickPower}!`);

    // Duration countdown
    let remaining = COFFEE_DURATION / 1000;
    coffeeStatus.textContent = `Active: ${remaining}s`;
    const countdownInterval = setInterval(() => {
        remaining--;
        coffeeStatus.textContent = `Active: ${remaining}s`;
        if (remaining <= 0) clearInterval(countdownInterval);
    }, 1000);

    setTimeout(() => {
        coffeeActive = false;
        clickPower = originalClickPower;
        coffeeBtn.classList.remove('border-orange-500', 'bg-orange-500/10');

        // Start cooldown
        coffeeCooldown = true;
        coffeeBtn.classList.add('opacity-50', 'cursor-not-allowed');

        let cooldownRemaining = COFFEE_COOLDOWN / 1000;
        coffeeStatus.textContent = `Cooldown: ${cooldownRemaining}s`;
        const cooldownInterval = setInterval(() => {
            cooldownRemaining--;
            coffeeStatus.textContent = `Cooldown: ${cooldownRemaining}s`;
            if (cooldownRemaining <= 0) {
                clearInterval(cooldownInterval);
                coffeeCooldown = false;
                coffeeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                coffeeStatus.textContent = '2x Speed - 15s';
            }
        }, 1000);
    }, COFFEE_DURATION);
}

function activateDebugMode() {
    if (debugActive || debugCooldown) return;

    debugActive = true;

    const debugStatus = document.getElementById('debug-status');
    const debugBtn = document.getElementById('debug-btn');
    debugBtn.classList.add('border-purple-500', 'bg-purple-500/10');

    showNotification('🐛 Debug Mode!', 'Auto-clicking enabled!');

    // Auto-click every 100ms
    autoClickInterval = setInterval(() => {
        score += clickPower;
        totalClicks++;
        totalEarned += clickPower;
        updateUI();
    }, 100);

    // Duration countdown
    let remaining = DEBUG_DURATION / 1000;
    debugStatus.textContent = `Active: ${remaining}s`;
    const countdownInterval = setInterval(() => {
        remaining--;
        debugStatus.textContent = `Active: ${remaining}s`;
        if (remaining <= 0) clearInterval(countdownInterval);
    }, 1000);

    setTimeout(() => {
        debugActive = false;
        clearInterval(autoClickInterval);
        autoClickInterval = null;
        debugBtn.classList.remove('border-purple-500', 'bg-purple-500/10');

        // Start cooldown
        debugCooldown = true;
        debugBtn.classList.add('opacity-50', 'cursor-not-allowed');

        let cooldownRemaining = DEBUG_COOLDOWN / 1000;
        debugStatus.textContent = `Cooldown: ${cooldownRemaining}s`;
        const cooldownInterval = setInterval(() => {
            cooldownRemaining--;
            debugStatus.textContent = `Cooldown: ${cooldownRemaining}s`;
            if (cooldownRemaining <= 0) {
                clearInterval(cooldownInterval);
                debugCooldown = false;
                debugBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                debugStatus.textContent = 'Auto-click 10s';
            }
        }, 1000);
    }, DEBUG_DURATION);
}



function init() {
    loadGame();
    renderUpgrades();
    renderClickUpgrades();
    renderAchievements();
    updateUI();

    setInterval(gameLoop, 1000);
    setInterval(updateTicker, 10000);
    setInterval(saveGame, 60000); // Save and submit to leaderboard every minute
    initParticles();

    clickBtn.addEventListener('click', handleClick);

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab, btn);
        });
    });

    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveGameManual);
    }

    // Buff buttons
    const coffeeBtn = document.getElementById('coffee-btn');
    if (coffeeBtn) {
        coffeeBtn.addEventListener('click', activateCoffeeBreak);
    }

    const debugBtn = document.getElementById('debug-btn');
    if (debugBtn) {
        debugBtn.addEventListener('click', activateDebugMode);
    }

    scheduleRandomEvent();
    scheduleBitcoinEvent();
}

function handleClick(e) {
    score += clickPower;
    totalClicks++;
    totalEarned += clickPower;
    createClickEffect(e);
    createCodeEffect();
    checkAchievements();
    updateUI();


    if (typeof playSound !== 'undefined') playSound('click');
}

function gameLoop() {
    score += passiveIncome;
    totalEarned += passiveIncome;
    checkAchievements();
    updateUI();
}





function getUpgradeCost(upgrade) {
    return Math.ceil(upgrade.baseCost * Math.pow(1.15, upgrade.count));
}

function buyUpgrade(id) {
    const upgrade = passiveUpgrades.find(u => u.id === id);
    if (!upgrade) return;

    const cost = getUpgradeCost(upgrade);
    if (score >= cost) {
        score -= cost;
        upgrade.count++;
        passiveIncome += upgrade.increase;


        const totalUpgrades = passiveUpgrades.reduce((sum, u) => sum + u.count, 0);
        checkAchievements('upgrades', totalUpgrades);

        updateUI();
        renderUpgrades();


        showNotification(`Purchased ${upgrade.name}!`, upgrade.increase + '/s');


        if (typeof playSound !== 'undefined') playSound('upgrade');
    }
}

function buyClickUpgrade(id) {
    const upgrade = clickUpgrades.find(u => u.id === id);
    if (!upgrade || upgrade.purchased) return;

    if (score >= upgrade.cost) {
        score -= upgrade.cost;
        upgrade.purchased = true;
        clickPower *= upgrade.multiplier;

        updateUI();
        renderClickUpgrades();

        showNotification(`Purchased ${upgrade.name}!`, `Click x${upgrade.multiplier}`);
    }
}





function renderUpgrades() {
    upgradesContainer.innerHTML = '';

    // Icon mapping for upgrades
    const iconMap = {
        'localhost': 'computer',
        'git_repo': 'folder_copy',
        'vps': 'dns',
        'cloud_cluster': 'cloud',
        'cdn': 'public',
        'firewall': 'security',
        'ai_assistant': 'smart_toy',
        'quantum': 'science',
        'data_center': 'domain',
        'neural_net': 'psychology'
    };

    passiveUpgrades.forEach(u => {
        const cost = getUpgradeCost(u);
        const canAfford = score >= cost;
        const icon = iconMap[u.id] || 'terminal';

        const item = document.createElement('div');
        item.className = `group flex flex-col gap-3 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#202633] border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer ${canAfford ? '' : 'opacity-60'}`;
        item.onclick = () => buyUpgrade(u.id);
        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex gap-3">
                    <div class="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined">${icon}</span>
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-bold text-slate-900 dark:text-white text-sm truncate">${u.name}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400">${u.desc}</p>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <div class="text-xs text-slate-500 dark:text-slate-400">Owned</div>
                    <div class="text-sm font-bold text-white font-mono">${u.count}</div>
                </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 bg-[#111318] p-2 rounded">
                <span>+${u.increase} LOC/s</span>
                <span class="text-green-400 font-mono">${formatNumber(cost)} LOC</span>
            </div>
        `;
        upgradesContainer.appendChild(item);
    });
}

function renderClickUpgrades() {
    clickUpgradesContainer.innerHTML = '';

    const iconMap = {
        'mech_keyboard': 'keyboard',
        'dual_monitor': 'monitor',
        'overclock': 'bolt',
        'ergonomic': 'chair',
        'liquid_cooling': 'water_drop',
        'caffeine': 'coffee'
    };

    // Unpurchased first
    clickUpgrades.forEach(u => {
        if (u.purchased) return;
        const canAfford = score >= u.cost;
        const icon = iconMap[u.id] || 'build';

        const item = document.createElement('div');
        item.className = `group flex flex-col gap-3 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#202633] border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer ${canAfford ? '' : 'opacity-60'}`;
        item.onclick = () => buyClickUpgrade(u.id);
        item.innerHTML = `
            <div class="flex gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined">${icon}</span>
                </div>
                <div class="min-w-0">
                    <h4 class="font-bold text-slate-900 dark:text-white text-sm">${u.name}</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${u.desc}</p>
                </div>
            </div>
            <button class="w-full py-2 ${canAfford ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <span>Buy</span>
                <span class="font-mono opacity-80">${formatNumber(u.cost)} LOC</span>
                <span class="text-xs opacity-60">• x${u.multiplier}</span>
            </button>
        `;
        clickUpgradesContainer.appendChild(item);
    });

    // Purchased items
    clickUpgrades.forEach(u => {
        if (!u.purchased) return;
        const icon = iconMap[u.id] || 'build';

        const item = document.createElement('div');
        item.className = 'flex gap-3 p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30';
        item.innerHTML = `
            <div class="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-emerald-400 text-sm">${u.name}</h4>
                <p class="text-xs text-emerald-500/70">✓ Owned • x${u.multiplier} Power</p>
            </div>
        `;
        clickUpgradesContainer.appendChild(item);
    });
}

function renderAchievements() {
    achievementsContainer.innerHTML = '';
    achievements.forEach(a => {
        const item = document.createElement('div');
        item.className = `flex gap-3 p-3 sm:p-4 rounded-xl border ${a.unlocked ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-[#202633] border-slate-200 dark:border-slate-700 opacity-60'}`;
        item.innerHTML = `
            <div class="w-10 h-10 rounded-lg ${a.unlocked ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700 text-slate-500'} flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${a.unlocked ? 'emoji_events' : 'lock'}</span>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold ${a.unlocked ? 'text-amber-400' : 'text-slate-400'} text-sm">${a.name}</h4>
                <p class="text-xs ${a.unlocked ? 'text-amber-500/70' : 'text-slate-500'}">${a.desc}</p>
                ${a.unlocked ? `<p class="text-xs text-green-400 mt-1">+${formatNumber(a.reward)} LoC</p>` : ''}
            </div>
        `;
        achievementsContainer.appendChild(item);
    });
}

function updateUI() {
    scoreElement.textContent = formatNumber(Math.floor(score));
    cpsElement.textContent = formatNumber(passiveIncome.toFixed(1));


    renderUpgrades();
    renderClickUpgrades();
}

function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
}





function checkAchievements(type = null, value = null) {
    achievements.forEach(a => {
        if (a.unlocked) return;

        let shouldUnlock = false;

        switch (a.type) {
            case 'score':
                shouldUnlock = totalEarned >= a.requirement;
                break;
            case 'clicks':
                shouldUnlock = totalClicks >= a.requirement;
                break;
            case 'upgrades':
                if (type === 'upgrades') shouldUnlock = value >= a.requirement;
                break;
            case 'events':
                if (type === 'events') shouldUnlock = value >= a.requirement;
                break;
        }

        if (shouldUnlock) {
            unlockAchievement(a);
        }
    });
}

function unlockAchievement(a) {
    if (a.unlocked) return;
    a.unlocked = true;
    score += a.reward;
    totalEarned += a.reward;

    showNotification(`🏆 ${a.name}`, `+${formatNumber(a.reward)} LoC`);
    renderAchievements();


    if (typeof playSound !== 'undefined') playSound('achievement');
}





function scheduleRandomEvent() {
    const delay = Math.random() * 30000 + 20000;
    setTimeout(spawnRandomEvent, delay);
}

function spawnRandomEvent() {
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];

    const el = document.createElement('div');
    el.className = 'random-event';
    el.innerHTML = `<span>${event.icon}</span>`;


    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    el.onclick = () => {
        const reward = event.reward();
        score += reward;
        totalEarned += reward;
        eventsCollected++;

        checkAchievements('events', eventsCollected);
        showNotification(event.name, `+${formatNumber(reward)} LoC`);


        createBurstEffect(el);
        el.remove();
        updateUI();
    };

    document.body.appendChild(el);


    setTimeout(() => {
        if (el.parentElement) {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 500);
        }
    }, event.duration);


    scheduleRandomEvent();
}



// Code lines for background typing effect
const codeLines = [
    '// Race Clicker Game Engine',
    'import express from "express";',
    'import { Database } from "./db";',
    'import { EventEmitter } from "events";',
    'const app = express();',
    'const PORT = 3000;',
    'const VERSION = "2.1.0";',
    'class Player extends EventEmitter {',
    '  constructor(name, id) {',
    '    super();',
    '    this.name = name;',
    '    this.id = id;',
    '    this.score = 0;',
    '    this.clickPower = 1;',
    '    this.passiveIncome = 0;',
    '    this.upgrades = [];',
    '    this.achievements = [];',
    '    this.lastSave = Date.now();',
    '  }',
    '  click() {',
    '    const earned = this.clickPower;',
    '    this.score += earned;',
    '    this.emit("click", earned);',
    '    return this.score;',
    '  }',
    '  addPassiveIncome(amount) {',
    '    this.passiveIncome += amount;',
    '    this.emit("upgrade", amount);',
    '  }',
    '  upgrade(type, cost) {',
    '    if (this.score < cost) return false;',
    '    this.score -= cost;',
    '    if (type === "power") {',
    '      this.clickPower *= 2;',
    '    } else if (type === "passive") {',
    '      this.passiveIncome += 10;',
    '    }',
    '    this.upgrades.push({ type, cost });',
    '    return true;',
    '  }',
    '  save() {',
    '    return JSON.stringify({',
    '      name: this.name,',
    '      score: this.score,',
    '      clickPower: this.clickPower,',
    '      passiveIncome: this.passiveIncome',
    '    });',
    '  }',
    '  static load(data) {',
    '    const parsed = JSON.parse(data);',
    '    const player = new Player(parsed.name);',
    '    player.score = parsed.score;',
    '    return player;',
    '  }',
    '}',
    'class Upgrade {',
    '  constructor(name, baseCost, effect) {',
    '    this.name = name;',
    '    this.baseCost = baseCost;',
    '    this.effect = effect;',
    '    this.level = 0;',
    '  }',
    '  getCost() {',
    '    return Math.floor(this.baseCost * 1.15 ** this.level);',
    '  }',
    '  apply(player) {',
    '    this.effect(player);',
    '    this.level++;',
    '  }',
    '}',
    'const upgrades = [',
    '  new Upgrade("Keyboard", 100, p => p.clickPower += 1),',
    '  new Upgrade("Monitor", 500, p => p.clickPower += 5),',
    '  new Upgrade("Server", 2000, p => p.passiveIncome += 10),',
    '  new Upgrade("AI Bot", 10000, p => p.passiveIncome += 50),',
    '];',
    'app.use(express.json());',
    'app.use(express.static("public"));',
    'const players = new Map();',
    'app.get("/api/player/:id", (req, res) => {',
    '  const player = players.get(req.params.id);',
    '  if (!player) return res.status(404).json({});',
    '  res.json({ score: player.score });',
    '});',
    'app.post("/api/click", (req, res) => {',
    '  const { playerId } = req.body;',
    '  const player = players.get(playerId);',
    '  const newScore = player.click();',
    '  res.json({ score: newScore });',
    '});',
    'app.post("/api/upgrade", (req, res) => {',
    '  const { playerId, upgradeId } = req.body;',
    '  const player = players.get(playerId);',
    '  const upgrade = upgrades[upgradeId];',
    '  const success = player.upgrade(upgrade);',
    '  res.json({ success, score: player.score });',
    '});',
    'app.post("/api/save", async (req, res) => {',
    '  const { playerId } = req.body;',
    '  const player = players.get(playerId);',
    '  await Database.save(playerId, player.save());',
    '  res.json({ saved: true });',
    '});',
    'setInterval(() => {',
    '  players.forEach(player => {',
    '    player.score += player.passiveIncome;',
    '  });',
    '}, 1000);',
    'app.listen(PORT, () => {',
    '  console.log(`Server v${VERSION} on port ${PORT}`);',
    '});'
];

let codeLineIndex = 0;

// Syntax highlighting function
function highlightCode(code) {
    // Brighter colors for visibility
    const keywords = ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'return', 'import', 'from', 'export', 'this', 'new'];
    const builtins = ['console', 'document', 'window', 'Math', 'JSON', 'app', 'res', 'req'];

    let result = code;

    // Comments (bright green)
    result = result.replace(/(\/\/.*)/g, '<span style="color:#98C379;">$1</span>');

    // Strings (orange/peach)
    result = result.replace(/("[^"]*")/g, '<span style="color:#E5C07B;">$1</span>');

    // Numbers (cyan)
    result = result.replace(/\b(\d+)\b/g, '<span style="color:#56B6C2;">$1</span>');

    // Keywords (magenta/pink)
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'g');
        result = result.replace(regex, '<span style="color:#E06C75;">$1</span>');
    });

    // Builtins (white)
    builtins.forEach(bi => {
        const regex = new RegExp(`\\b(${bi})\\b`, 'g');
        result = result.replace(regex, '<span style="color:#ABB2BF;">$1</span>');
    });

    // Function calls (yellow)
    result = result.replace(/\.(\w+)\(/g, '.<span style="color:#E5C07B;">$1</span>(');

    // Arrow functions (magenta)
    result = result.replace(/(=&gt;|=>)/g, '<span style="color:#E06C75;">$1</span>');

    return result;
}

// Track active code elements by y position
const activeCodeLines = new Map();

function createCodeEffect() {
    const codeEl = document.createElement('div');
    codeEl.className = 'code-typing-effect';

    // Get current line and advance
    const line = codeLines[codeLineIndex % codeLines.length];
    const lineNum = codeLineIndex % codeLines.length;
    codeLineIndex++;

    // Don't skip empty lines - show spacing
    if (!line.trim()) {
        return; // Skip but don't create element
    }

    // Apply syntax highlighting
    codeEl.innerHTML = highlightCode(line);

    // Position at fixed left, stacked vertically by line number
    const gameArea = document.querySelector('main');
    if (!gameArea) return;

    const rect = gameArea.getBoundingClientRect();
    const lineHeight = 22; // pixels per line
    const baseTop = rect.top + 80;
    const baseLeft = rect.left + 30;

    // Stack lines - modulo to keep within visible area
    const visibleLines = Math.floor((rect.height - 150) / lineHeight);
    const slotIndex = lineNum % visibleLines;
    const yOffset = slotIndex * lineHeight;

    // Remove existing element at this slot
    if (activeCodeLines.has(slotIndex)) {
        const oldEl = activeCodeLines.get(slotIndex);
        if (oldEl.parentElement) oldEl.remove();
    }

    codeEl.style.left = baseLeft + 'px';
    codeEl.style.top = (baseTop + yOffset) + 'px';

    // Track this element
    activeCodeLines.set(slotIndex, codeEl);

    document.body.appendChild(codeEl);
    setTimeout(() => {
        codeEl.remove();
        if (activeCodeLines.get(slotIndex) === codeEl) {
            activeCodeLines.delete(slotIndex);
        }
    }, 5000);
}

function scheduleBitcoinEvent() {
    setTimeout(spawnBitcoinEvent, 300000);
}

function spawnBitcoinEvent() {
    const el = document.createElement('div');
    el.className = 'random-event';
    el.innerHTML = `<span>₿</span>`;


    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    el.style.left = x + 'px';
    el.style.top = y + 'px';


    el.style.filter = "drop-shadow(0 0 15px #f7931a)";

    el.onclick = () => {

        const reward = Math.floor(Math.random() * (7000 - 5000 + 1)) + 5000;
        score += reward;
        totalEarned += reward;
        eventsCollected++;

        checkAchievements('events', eventsCollected);
        showNotification("₿ Found Bitcoin!", `+${formatNumber(reward)} LoC`);


        createBurstEffect(el);
        el.remove();
        updateUI();
    };

    document.body.appendChild(el);


    setTimeout(() => {
        if (el.parentElement) {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 500);
        }
    }, 10000);


    scheduleBitcoinEvent();
}

function createBurstEffect(source) {
    const rect = source.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'burst-particle';
        particle.style.left = (rect.left + rect.width / 2) + 'px';
        particle.style.top = (rect.top + rect.height / 2) + 'px';
        particle.style.setProperty('--angle', (i * 36) + 'deg');
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}





function createClickEffect(e) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${clickPower}`;
    effect.style.left = e.clientX + 'px';
    effect.style.top = e.clientY + 'px';
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function initParticles() {
    const container = document.getElementById('fireflies-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'matrix-particle';
        p.textContent = Math.random() > 0.5 ? '0' : '1';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.animationDuration = (Math.random() * 10 + 10) + 's';
        container.appendChild(p);
    }
}

function updateTicker() {
    const ticker = document.getElementById('fact-text');
    if (ticker) ticker.textContent = facts[Math.floor(Math.random() * facts.length)];
}

function showNotification(title, subtitle) {
    notificationText.innerHTML = `${title}<br><span style="font-size: 0.8rem; color: #0f0;">${subtitle}</span>`;
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 3000);
}





function saveGame() {
    const data = {
        score, clickPower, passiveIncome, totalClicks, totalEarned, eventsCollected,
        upgrades: passiveUpgrades.map(u => ({ id: u.id, count: u.count })),
        clickUpgrades: clickUpgrades.map(u => ({ id: u.id, purchased: u.purchased })),
        achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
        savedAt: Date.now()
    };
    localStorage.setItem('codeClickerSave_v2', JSON.stringify(data));


    if (window.Leaderboard && totalEarned > 0) {
        Leaderboard.submit('clicker', Math.floor(totalEarned));
    }
}

function loadGame() {
    const saved = JSON.parse(localStorage.getItem('codeClickerSave_v2'));
    if (!saved) return;

    score = saved.score || 0;
    clickPower = saved.clickPower || 1;
    passiveIncome = saved.passiveIncome || 0;
    totalClicks = saved.totalClicks || 0;
    totalEarned = saved.totalEarned || 0;
    eventsCollected = saved.eventsCollected || 0;

    if (saved.upgrades) {
        saved.upgrades.forEach(s => {
            const u = passiveUpgrades.find(p => p.id === s.id);
            if (u) u.count = s.count;
        });

        passiveIncome = passiveUpgrades.reduce((sum, u) => sum + (u.increase * u.count), 0);
    }

    if (saved.clickUpgrades) {
        saved.clickUpgrades.forEach(s => {
            const u = clickUpgrades.find(p => p.id === s.id);
            if (u) u.purchased = s.purchased;
        });

        clickPower = 1;
        clickUpgrades.forEach(u => { if (u.purchased) clickPower *= u.multiplier; });
    }

    if (saved.achievements) {
        saved.achievements.forEach(s => {
            const a = achievements.find(p => p.id === s.id);
            if (a) a.unlocked = s.unlocked;
        });
    }
}

window.saveGameManual = function () {
    saveGame();
    const a = achievements.find(x => x.id === 'backup_secure');
    if (a && !a.unlocked) {
        unlockAchievement(a);
        saveGame();
    } else {
        showNotification('💾 System Saved!', 'Progress backed up');
    }
};

window.switchTab = function (tabName, btn) {
    document.querySelectorAll('.panel-content').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-white', 'dark:bg-[#282e39]', 'text-slate-900', 'dark:text-white', 'shadow-sm');
        b.classList.add('text-slate-500', 'dark:text-slate-400');
    });
    document.getElementById(`${tabName}-section`).style.display = 'block';
    if (btn) {
        btn.classList.add('bg-white', 'dark:bg-[#282e39]', 'text-slate-900', 'dark:text-white', 'shadow-sm');
        btn.classList.remove('text-slate-500', 'dark:text-slate-400');
    }
};




init();

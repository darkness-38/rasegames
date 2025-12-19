




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





function init() {
    loadGame();
    renderUpgrades();
    renderAchievements();
    updateUI();

    setInterval(gameLoop, 1000);
    setInterval(updateTicker, 10000);
    setInterval(saveGame, 30000);
    initParticles();

    clickBtn.addEventListener('click', handleClick);

    
    
    scheduleRandomEvent();
    scheduleBitcoinEvent();
}

function handleClick(e) {
    score += clickPower;
    totalClicks++;
    totalEarned += clickPower;
    createClickEffect(e);
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
    passiveUpgrades.forEach(u => {
        const cost = getUpgradeCost(u);
        const canAfford = score >= cost;

        const item = document.createElement('div');
        item.className = `upgrade-card ${canAfford ? '' : 'disabled'}`;
        item.onclick = () => buyUpgrade(u.id);
        item.innerHTML = `
            <div class="upgrade-icon">${u.icon}</div>
            <div class="upgrade-info">
                <h3>${u.name}</h3>
                <p class="upgrade-desc">${u.desc}</p>
                <p class="upgrade-cost">${formatNumber(cost)} LoC | +${u.increase}/s</p>
            </div>
            <div class="upgrade-count">${u.count}</div>
        `;
        upgradesContainer.appendChild(item);
    });
}

function renderClickUpgrades() {
    clickUpgradesContainer.innerHTML = '';
    clickUpgrades.forEach(u => {
        if (u.purchased) return;

        const canAfford = score >= u.cost;
        const item = document.createElement('div');
        item.className = `upgrade-card ${canAfford ? '' : 'disabled'}`;
        item.onclick = () => buyClickUpgrade(u.id);
        item.innerHTML = `
            <div class="upgrade-icon">${u.icon}</div>
            <div class="upgrade-info">
                <h3>${u.name}</h3>
                <p class="upgrade-desc">${u.desc}</p>
                <p class="upgrade-cost">${formatNumber(u.cost)} LoC | Power x${u.multiplier}</p>
            </div>
        `;
        clickUpgradesContainer.appendChild(item);
    });

    
    clickUpgrades.forEach(u => {
        if (!u.purchased) return;
        const item = document.createElement('div');
        item.className = 'upgrade-card purchased';
        item.innerHTML = `
            <div class="upgrade-icon">${u.icon}</div>
            <div class="upgrade-info">
                <h3>${u.name}</h3>
                <p class="upgrade-desc">✓ Owned</p>
            </div>
        `;
        clickUpgradesContainer.appendChild(item);
    });
}

function renderAchievements() {
    achievementsContainer.innerHTML = '';
    achievements.forEach(a => {
        const item = document.createElement('div');
        item.className = `achievement-card ${a.unlocked ? 'unlocked' : ''}`;
        item.innerHTML = `
            <div class="achievement-icon">${a.unlocked ? '🏆' : '🔒'}</div>
            <div class="achievement-info">
                <h3>${a.name}</h3>
                <p class="achievement-desc">${a.desc}</p>
                ${a.unlocked ? `<p class="achievement-reward">+${formatNumber(a.reward)} LoC</p>` : ''}
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

window.switchTab = function (tabName) {
    document.querySelectorAll('.panel-content').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tabName}-section`).style.display = 'block';
    event.target.classList.add('active');
};




init();

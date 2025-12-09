// Game Variables
let score = 0;
let clickPower = 1;
let passiveIncome = 0;
let totalClicks = 0;

// DOM Elements
const scoreElement = document.getElementById('score');
const cpsElement = document.getElementById('cps');
const clickBtn = document.getElementById('click-btn');
// Achievement Notifications
function showNotification(name, reward) {
    notificationText.innerHTML = `${name}<br><span style="font-size: 0.8rem; color: #ffd700;">+${reward} Rase</span>`;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// ... (buyUpgrade remains same) ...

// ... (updateUI remains same) ...

// ... (checkUpgradeAvailability remains same) ...

// ... (randomFacts remains same) ...

// ... (updateTicker remains same) ...

// ... (createFireflies remains same) ...

// ... (DB init remains same) ...

// Manual Save Notification
window.saveGameManual = function () {
    saveGame();

    const ach = achievements.find(a => a.id === 'safe_keeper');
    if (ach && !ach.unlocked) {
        ach.unlocked = true;
        score += ach.reward;
        showNotification(ach.name, ach.reward);
        updateAchievementCard(ach.id);
        updateUI();
        saveGame();
    } else {
        showNotification("Game Saved", 0);
    }
};

// ... (loadGame remains same) ...

// ... (initDB remains same) ...

// Random Events (Golden Packet)
function spawnGoldenOnion() {
    // ... (creation logic same) ...
    const onion = document.createElement('div');
    onion.className = 'golden-onion';
    onion.innerText = '🎁';

    // Random Position
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    onion.style.left = `${x}px`;
    onion.style.top = `${y}px`;

    onion.onclick = () => {
        const reward = Math.max(500, passiveIncome * 60);
        score += reward;
        showNotification("Bonus Packet!", Math.floor(reward));
        createParticleEffect({ clientX: x + 20, clientY: y + 20 });
        updateUI();
        onion.remove();
    };

    document.body.appendChild(onion);
    // ... (timeout and schedule logic same) ...
    setTimeout(() => {
        if (document.body.contains(onion)) {
            onion.remove();
        }
    }, 10000);

    scheduleNextGoldenOnion();
}

// ... (scheduleNextGoldenOnion same) ...

// Milestones
const milestones = [
    { score: 1000, reached: false, event: 'data_surge', message: "1,000 Tokens! Data Surge Detected!" },
    { score: 10000, reached: false, event: 'system_overdrive', message: "10,000 Tokens! System Overdrive!" },
    { score: 50000, reached: false, event: 'singularity', message: "50,000 Tokens! Singularity Imminent!" }
];

// ... (checkMilestones same) ...

// ... (triggerEvent same) ...

function triggerOgreRoar() {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);

    // Double click power
    const originalPower = clickPower;
    clickPower *= 2;
    showNotification("Overdrive Active! Click 2x!", 0);

    setTimeout(() => {
        clickPower = originalPower;
        showNotification("Overdrive Ended.", 0);
    }, 30000);
}

function triggerSwampParty() {
    // Confetti
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'falling-onion';
            confetti.innerText = ['✨', '🚀', '💎'][Math.floor(Math.random() * 3)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }, i * 50);
    }

    // Double production
    const originalPassive = passiveIncome;
    const originalClick = clickPower;

    passiveIncome *= 2;
    clickPower *= 2;

    showNotification("Singularity! All 2x!", 0);

    setTimeout(() => {
        passiveIncome = originalPassive;
        clickPower = originalClick;
        showNotification("Singularity Ended.", 0);
    }, 60000);
}

setInterval(checkMilestones, 1000);

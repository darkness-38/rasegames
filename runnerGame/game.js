// ═══════════════════════════════════════════════════════════════════════════════
// CYBER RUNNER - Enhanced Edition
// ═══════════════════════════════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Screens
const mainMenu = document.getElementById('mainMenu');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const shopScreen = document.getElementById('shopScreen');

// HUD Elements
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const highScoreEl = document.getElementById('highScore');
const totalCoinsEl = document.getElementById('totalCoins');
const shopCoinsEl = document.getElementById('shopCoins');
const finalScoreEl = document.getElementById('finalScore');
const earnedCoinsEl = document.getElementById('earnedCoins');

// ═══════════════════════════════════════════════════════════════════════════════
// COOKIE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const GRAVITY = 0.55;
const BASE_JUMP_FORCE = -13;
const BASE_GAME_SPEED = 5;
const GROUND_HEIGHT = 80;

const COLORS = {
    sky1: '#0a0a12',
    sky2: '#1a0a2e',
    ground: '#1a1a3a',
    groundLine: '#00f0ff',
    player: '#00f0ff',
    playerAccent: '#ff00aa',
    obstacle: '#ff00aa',
    obstacleAlt: '#ff6600',
    coin: '#ffff00',
    particle: '#00f0ff'
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════════

let gameRunning = false;
let score = 0;
let coins = 0;
let totalCoins = parseInt(getCookie('crCoins')) || 0;
let highScore = parseInt(getCookie('crHighScore')) || 0;
let gameSpeed = BASE_GAME_SPEED;
let animationId = null;
let frameCount = 0;
let bgMusic = null;

// Player
let player = {
    x: 80,
    y: 0,
    width: 35,
    height: 50,
    vy: 0,
    isJumping: false,
    jumpCount: 0
};

// Game Objects
let obstacles = [];
let coinItems = [];
let particles = [];
let stars = [];
let buildings = [];

// Upgrades
let upgrades = {
    doubleJump: { level: 0, maxLevel: 1, baseCost: 100, name: 'Double Jump', icon: '⬆️', desc: 'Jump again mid-air' },
    magnet: { level: 0, maxLevel: 3, baseCost: 50, name: 'Coin Magnet', icon: '🧲', desc: 'Attract nearby coins' },
    coinBonus: { level: 0, maxLevel: 5, baseCost: 75, name: 'Coin Bonus', icon: '💰', desc: '+50% coins per pickup' },
    jumpHeight: { level: 0, maxLevel: 3, baseCost: 120, name: 'Jump Boost', icon: '🚀', desc: 'Jump 15% higher' }
};

// Load saved upgrades
const savedUpgrades = getCookie('crUpgrades');
if (savedUpgrades) {
    try {
        const parsed = JSON.parse(decodeURIComponent(savedUpgrades));
        Object.keys(parsed).forEach(k => { if (upgrades[k]) upgrades[k].level = parsed[k]; });
    } catch (e) { }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS SETUP
// ═══════════════════════════════════════════════════════════════════════════════

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height - GROUND_HEIGHT - player.height;
    initBackground();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function initBackground() {
    stars = [];
    buildings = [];

    // Stars (fewer for performance)
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - GROUND_HEIGHT - 150),
            size: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.3 + 0.1
        });
    }

    // Buildings
    for (let i = 0; i < 10; i++) {
        buildings.push({
            x: i * 180,
            width: 50 + Math.random() * 60,
            height: 80 + Math.random() * 150,
            speed: 0.8
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function drawBackground() {
    // Sky
    ctx.fillStyle = COLORS.sky1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        if (gameRunning) {
            s.x -= s.speed * gameSpeed;
            if (s.x < 0) s.x = canvas.width;
        }
    });

    // Buildings (simplified)
    buildings.forEach(b => {
        const y = canvas.height - GROUND_HEIGHT - b.height;
        ctx.fillStyle = 'rgba(20,10,35,0.7)';
        ctx.fillRect(b.x, y, b.width, b.height);

        // Windows (simplified grid)
        ctx.fillStyle = 'rgba(0,240,255,0.2)';
        for (let wy = y + 15; wy < canvas.height - GROUND_HEIGHT - 20; wy += 25) {
            for (let wx = b.x + 8; wx < b.x + b.width - 10; wx += 15) {
                ctx.fillRect(wx, wy, 8, 12);
            }
        }

        if (gameRunning) {
            b.x -= b.speed * gameSpeed * 0.4;
            if (b.x + b.width < 0) {
                b.x = canvas.width + 50;
                b.height = 80 + Math.random() * 150;
            }
        }
    });

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // Ground line with glow
    ctx.strokeStyle = COLORS.groundLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - GROUND_HEIGHT);
    ctx.lineTo(canvas.width, canvas.height - GROUND_HEIGHT);
    ctx.stroke();
}

function drawPlayer() {
    const px = player.x;
    const py = player.y;
    const runFrame = Math.floor(frameCount / 5) % 4;

    ctx.save();

    // Glow
    ctx.shadowColor = COLORS.player;
    ctx.shadowBlur = 15;

    // === CYBER NINJA DESIGN ===

    // Head (helmet)
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.roundRect(px + 8, py, 20, 18, 5);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 10, py + 5, 16, 7);
    ctx.fillStyle = COLORS.playerAccent;
    ctx.fillRect(px + 11, py + 6, 14, 5);

    // Body armor
    ctx.fillStyle = '#0a0a15';
    ctx.beginPath();
    ctx.roundRect(px + 5, py + 19, 26, 18, 3);
    ctx.fill();

    // Body highlight
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(px + 7, py + 20, 22, 2);
    ctx.fillRect(px + 15, py + 22, 3, 14);

    // Arms
    ctx.fillStyle = COLORS.player;
    const armSwing = Math.sin(frameCount * 0.3) * 3;
    ctx.fillRect(px + 2, py + 20 + armSwing, 5, 12);
    ctx.fillRect(px + 28, py + 20 - armSwing, 5, 12);

    // Legs (animated)
    ctx.fillStyle = '#0a0a15';
    if (player.isJumping) {
        // Tucked legs when jumping
        ctx.fillRect(px + 8, py + 38, 7, 10);
        ctx.fillRect(px + 20, py + 38, 7, 10);
    } else {
        // Running animation
        const legOffset1 = Math.sin(runFrame * 1.5) * 6;
        const legOffset2 = Math.sin(runFrame * 1.5 + Math.PI) * 6;
        ctx.fillRect(px + 8, py + 38, 7, 10 + legOffset1);
        ctx.fillRect(px + 20, py + 38, 7, 10 + legOffset2);
    }

    // Jetpack
    ctx.fillStyle = '#333';
    ctx.fillRect(px + 10, py + 25, 15, 12);
    ctx.fillStyle = COLORS.playerAccent;
    ctx.fillRect(px + 12, py + 27, 11, 3);

    // Jetpack flame
    if (player.isJumping) {
        const flameH = 10 + Math.random() * 10;
        const gradient = ctx.createLinearGradient(0, py + 37, 0, py + 37 + flameH);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(0.5, '#ffcc00');
        gradient.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(px + 13, py + 37);
        ctx.lineTo(px + 22, py + 37);
        ctx.lineTo(px + 17.5, py + 37 + flameH);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBSTACLE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

const OBSTACLE_TYPES = [
    { name: 'spike', width: 25, height: 40 },
    { name: 'barrier', width: 40, height: 25 },
    { name: 'crate', width: 35, height: 35 },
    { name: 'laser', width: 15, height: 60 },
    { name: 'drone', width: 40, height: 25, flying: true }
];

function spawnObstacle() {
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    const baseY = canvas.height - GROUND_HEIGHT - type.height;

    obstacles.push({
        x: canvas.width + 50,
        y: type.flying ? baseY - 80 - Math.random() * 50 : baseY,
        width: type.width,
        height: type.height,
        type: type.name,
        animOffset: Math.random() * Math.PI * 2
    });
}

function drawObstacles() {
    obstacles.forEach(obs => {
        ctx.save();

        switch (obs.type) {
            case 'spike':
                // Triangle spike
                ctx.fillStyle = COLORS.obstacle;
                ctx.shadowColor = COLORS.obstacle;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.width / 2, obs.y);
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                ctx.lineTo(obs.x, obs.y + obs.height);
                ctx.closePath();
                ctx.fill();
                break;

            case 'barrier':
                // Horizontal barrier
                ctx.fillStyle = COLORS.obstacleAlt;
                ctx.shadowColor = COLORS.obstacleAlt;
                ctx.shadowBlur = 8;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Stripes
                ctx.fillStyle = '#000';
                for (let i = 0; i < obs.width; i += 10) {
                    ctx.fillRect(obs.x + i, obs.y, 5, obs.height);
                }
                break;

            case 'crate':
                // Box crate
                ctx.fillStyle = '#444';
                ctx.strokeStyle = COLORS.obstacle;
                ctx.lineWidth = 2;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
                // X pattern
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y);
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                ctx.moveTo(obs.x + obs.width, obs.y);
                ctx.lineTo(obs.x, obs.y + obs.height);
                ctx.stroke();
                break;

            case 'laser':
                // Vertical laser beam
                const laserPulse = 0.5 + Math.sin(frameCount * 0.2 + obs.animOffset) * 0.5;
                ctx.fillStyle = `rgba(255,0,100,${laserPulse})`;
                ctx.shadowColor = COLORS.obstacle;
                ctx.shadowBlur = 15 * laserPulse;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Core
                ctx.fillStyle = '#fff';
                ctx.fillRect(obs.x + 5, obs.y, 5, obs.height);
                break;

            case 'drone':
                // Flying drone
                const bob = Math.sin(frameCount * 0.1 + obs.animOffset) * 5;
                ctx.fillStyle = '#333';
                ctx.shadowColor = COLORS.playerAccent;
                ctx.shadowBlur = 10;
                ctx.fillRect(obs.x, obs.y + bob, obs.width, obs.height - 10);
                // Propellers
                ctx.fillStyle = COLORS.playerAccent;
                ctx.fillRect(obs.x - 5, obs.y + bob - 3, 15, 4);
                ctx.fillRect(obs.x + obs.width - 10, obs.y + bob - 3, 15, 4);
                // Eye
                ctx.fillStyle = '#f00';
                ctx.beginPath();
                ctx.arc(obs.x + obs.width / 2, obs.y + bob + 8, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    });
}

function updateObstacles() {
    obstacles.forEach(obs => { obs.x -= gameSpeed; });
    obstacles = obstacles.filter(obs => obs.x + obs.width > -50);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COINS
// ═══════════════════════════════════════════════════════════════════════════════

function spawnCoin() {
    const heights = [0, 40, 80, 120];
    coinItems.push({
        x: canvas.width + 50,
        y: canvas.height - GROUND_HEIGHT - 25 - heights[Math.floor(Math.random() * heights.length)],
        size: 18,
        rotation: 0
    });
}

function drawCoins() {
    coinItems.forEach(coin => {
        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.rotate(coin.rotation);

        ctx.fillStyle = COLORS.coin;
        ctx.shadowColor = COLORS.coin;
        ctx.shadowBlur = 12;

        // Diamond
        ctx.beginPath();
        ctx.moveTo(0, -coin.size / 2);
        ctx.lineTo(coin.size / 2, 0);
        ctx.lineTo(0, coin.size / 2);
        ctx.lineTo(-coin.size / 2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

function updateCoins() {
    const magnetRange = 40 + upgrades.magnet.level * 35;
    const coinMult = 1 + upgrades.coinBonus.level * 0.5;

    coinItems.forEach(coin => {
        coin.x -= gameSpeed;
        coin.rotation += 0.08;

        const dx = (player.x + player.width / 2) - coin.x;
        const dy = (player.y + player.height / 2) - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < magnetRange) {
            coin.x += dx * 0.12;
            coin.y += dy * 0.12;
        }

        if (dist < 25) {
            coins += Math.ceil(coinMult);
            coinsEl.textContent = coins;
            coin.collected = true;

            // Play collect sound
            if (typeof playSound !== 'undefined') playSound('collect');

            // Particles
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: coin.x, y: coin.y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    size: 3, life: 15, color: COLORS.coin
                });
            }
        }
    });

    coinItems = coinItems.filter(c => !c.collected && c.x > -30);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLES (optimized)
// ═══════════════════════════════════════════════════════════════════════════════

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 15;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / 15), 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER PHYSICS
// ═══════════════════════════════════════════════════════════════════════════════

function updatePlayer() {
    player.vy += GRAVITY;
    player.y += player.vy;

    const groundY = canvas.height - GROUND_HEIGHT - player.height;
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isJumping = false;
        player.jumpCount = 0;
    }
}

function jump() {
    const maxJumps = 1 + (upgrades.doubleJump.level > 0 ? 1 : 0);
    const jumpBoost = 1 + upgrades.jumpHeight.level * 0.15;

    if (player.jumpCount < maxJumps) {
        player.vy = BASE_JUMP_FORCE * jumpBoost;
        player.isJumping = true;
        player.jumpCount++;

        // Play jump sound
        if (typeof playSound !== 'undefined') playSound('jump');

        // Jump particles
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 2,
                size: 3, life: 15, color: COLORS.particle
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLISION
// ═══════════════════════════════════════════════════════════════════════════════

function checkCollisions() {
    const px = player.x + 5;
    const py = player.y + 5;
    const pw = player.width - 10;
    const ph = player.height - 10;

    for (const obs of obstacles) {
        // Adjust hitbox for spikes (triangular)
        let ox = obs.x, oy = obs.y, ow = obs.width, oh = obs.height;
        if (obs.type === 'spike') {
            ox += 5; ow -= 10;
        }

        if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
            gameOver();
            return;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════════════════════════

let lastObstacleTime = 0;
let lastCoinTime = 0;

function gameLoop(timestamp) {
    if (!gameRunning) return;

    frameCount++;

    updatePlayer();
    updateObstacles();
    updateCoins();
    updateParticles();
    checkCollisions();

    // Spawn
    if (timestamp - lastObstacleTime > 1400 - Math.min(score / 2, 600)) {
        spawnObstacle();
        lastObstacleTime = timestamp;
    }
    if (timestamp - lastCoinTime > 700) {
        if (Math.random() > 0.25) spawnCoin();
        lastCoinTime = timestamp;
    }

    // Difficulty
    if (frameCount % 500 === 0) gameSpeed = Math.min(gameSpeed + 0.3, 12);

    // Score
    score++;
    scoreEl.textContent = Math.floor(score / 10);

    // Draw
    drawBackground();
    drawObstacles();
    drawCoins();
    drawPlayer();
    drawParticles();

    animationId = requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

function startGame() {
    score = 0;
    coins = 0;
    gameSpeed = BASE_GAME_SPEED;
    obstacles = [];
    coinItems = [];
    particles = [];
    frameCount = 0;

    player.y = canvas.height - GROUND_HEIGHT - player.height;
    player.vy = 0;
    player.isJumping = false;
    player.jumpCount = 0;

    scoreEl.textContent = '0';
    coinsEl.textContent = '0';
    highScoreEl.textContent = highScore;

    mainMenu.classList.add('hidden');
    shopScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    gameRunning = true;
    requestAnimationFrame(gameLoop);

    // Play start sound
    if (typeof playSound !== 'undefined') playSound('start');

    // Start background music
    if (!bgMusic) {
        bgMusic = new Audio('/sounds/cyber_background.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
    }
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => { });
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    const finalScore = Math.floor(score / 10);

    if (finalScore > highScore) {
        highScore = finalScore;
        setCookie('crHighScore', highScore);
    }

    totalCoins += coins;
    setCookie('crCoins', totalCoins);

    finalScoreEl.textContent = finalScore;
    earnedCoinsEl.textContent = coins;

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    // Stop background music
    if (bgMusic) {
        bgMusic.pause();
    }

    // Play crash sound
    if (typeof playSound !== 'undefined') playSound('crash');
}

function showMenu() {
    gameOverScreen.classList.add('hidden');
    shopScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    totalCoinsEl.textContent = totalCoins;
}

function showShop() {
    mainMenu.classList.add('hidden');
    shopScreen.classList.remove('hidden');
    shopCoinsEl.textContent = totalCoins;
    renderUpgrades();
}

function renderUpgrades() {
    const list = document.getElementById('upgradesList');
    list.innerHTML = '';

    Object.entries(upgrades).forEach(([key, upg]) => {
        const cost = upg.baseCost * (upg.level + 1);
        const maxed = upg.level >= upg.maxLevel;

        const card = document.createElement('div');
        card.className = `upgrade-card ${maxed ? 'maxed' : ''}`;
        card.innerHTML = `
            <div class="upgrade-icon">${upg.icon}</div>
            <div class="upgrade-info">
                <h4>${upg.name} ${maxed ? '(MAX)' : `Lv.${upg.level + 1}`}</h4>
                <p>${upg.desc}</p>
            </div>
            <div class="upgrade-cost">${maxed ? '✓' : `💎${cost}`}</div>
        `;

        if (!maxed && totalCoins >= cost) {
            card.onclick = () => buyUpgrade(key);
        }

        list.appendChild(card);
    });
}

function buyUpgrade(key) {
    const upg = upgrades[key];
    const cost = upg.baseCost * (upg.level + 1);

    if (totalCoins >= cost && upg.level < upg.maxLevel) {
        totalCoins -= cost;
        upg.level++;

        setCookie('crCoins', totalCoins);
        setCookie('crUpgrades', encodeURIComponent(JSON.stringify(
            Object.fromEntries(Object.entries(upgrades).map(([k, v]) => [k, v.level]))
        )));

        shopCoinsEl.textContent = totalCoins;
        renderUpgrades();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameRunning) jump();
    }
});

// Mobile - touch anywhere on game screen
gameScreen?.addEventListener('touchstart', e => {
    e.preventDefault();
    if (gameRunning) jump();
}, { passive: false });

canvas.addEventListener('click', () => { if (gameRunning) jump(); });

document.getElementById('jumpBtn')?.addEventListener('touchstart', e => {
    e.preventDefault();
    if (gameRunning) jump();
}, { passive: false });

document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('shopBtn').addEventListener('click', showShop);
document.getElementById('retryBtn').addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', showMenu);
document.getElementById('backBtn').addEventListener('click', showMenu);

// Init
totalCoinsEl.textContent = totalCoins;

// ═══════════════════════════════════════════════════════════════════════════════
// CYBER RUNNER - Game Logic
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
// GAME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const GRAVITY = 0.6;
const BASE_JUMP_FORCE = -14;
const BASE_GAME_SPEED = 6;
const GROUND_HEIGHT = 80;

// Colors
const COLORS = {
    sky1: '#0a0a12',
    sky2: '#1a0a2e',
    ground: '#1a1a3a',
    groundLine: '#00f0ff',
    player: '#00f0ff',
    playerGlow: 'rgba(0, 240, 255, 0.5)',
    obstacle: '#ff00aa',
    coin: '#ffff00',
    particle: '#00f0ff'
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════════

let gameRunning = false;
let score = 0;
let coins = 0;
let totalCoins = parseInt(localStorage.getItem('cyberRunnerCoins')) || 0;
let highScore = parseInt(localStorage.getItem('cyberRunnerHighScore')) || 0;
let gameSpeed = BASE_GAME_SPEED;
let animationId = null;

// Player
let player = {
    x: 100,
    y: 0,
    width: 40,
    height: 60,
    vy: 0,
    isJumping: false,
    jumpCount: 0,
    maxJumps: 1
};

// Game Objects
let obstacles = [];
let coinItems = [];
let particles = [];
let bgLayers = [];

// Upgrades
let upgrades = {
    doubleJump: { level: 0, maxLevel: 1, baseCost: 100, name: 'Double Jump', icon: '⬆️', desc: 'Jump again in mid-air' },
    magnet: { level: 0, maxLevel: 3, baseCost: 50, name: 'Coin Magnet', icon: '🧲', desc: 'Attract coins from further away' },
    shield: { level: 0, maxLevel: 3, baseCost: 150, name: 'Shield Duration', icon: '🛡️', desc: 'Longer invincibility after hit' },
    coinBonus: { level: 0, maxLevel: 5, baseCost: 75, name: 'Coin Multiplier', icon: '💰', desc: 'Earn more coins per pickup' },
    jumpHeight: { level: 0, maxLevel: 3, baseCost: 120, name: 'Jump Boost', icon: '🚀', desc: 'Jump higher' }
};

// Load upgrades
const savedUpgrades = localStorage.getItem('cyberRunnerUpgrades');
if (savedUpgrades) {
    const parsed = JSON.parse(savedUpgrades);
    Object.keys(parsed).forEach(key => {
        if (upgrades[key]) upgrades[key].level = parsed[key];
    });
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

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════

function initBackground() {
    bgLayers = [];

    // Stars
    for (let i = 0; i < 100; i++) {
        bgLayers.push({
            type: 'star',
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - GROUND_HEIGHT - 100),
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2,
            brightness: Math.random()
        });
    }

    // City buildings (background)
    for (let i = 0; i < 15; i++) {
        bgLayers.push({
            type: 'building',
            x: i * 150,
            width: 60 + Math.random() * 80,
            height: 100 + Math.random() * 200,
            speed: 1,
            color: `rgba(20, 10, 40, ${0.5 + Math.random() * 0.3})`
        });
    }
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, COLORS.sky1);
    gradient.addColorStop(0.5, COLORS.sky2);
    gradient.addColorStop(1, COLORS.sky1);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw layers
    bgLayers.forEach(layer => {
        if (layer.type === 'star') {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + layer.brightness * 0.7})`;
            ctx.beginPath();
            ctx.arc(layer.x, layer.y, layer.size, 0, Math.PI * 2);
            ctx.fill();

            if (gameRunning) {
                layer.x -= layer.speed * gameSpeed * 0.3;
                if (layer.x < -5) layer.x = canvas.width + 5;
            }
        }

        if (layer.type === 'building') {
            const y = canvas.height - GROUND_HEIGHT - layer.height;

            // Building body
            ctx.fillStyle = layer.color;
            ctx.fillRect(layer.x, y, layer.width, layer.height);

            // Windows
            ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
            for (let wy = y + 20; wy < y + layer.height - 20; wy += 30) {
                for (let wx = layer.x + 10; wx < layer.x + layer.width - 15; wx += 20) {
                    if (Math.random() > 0.3) {
                        ctx.fillRect(wx, wy, 10, 15);
                    }
                }
            }

            if (gameRunning) {
                layer.x -= layer.speed * gameSpeed * 0.5;
                if (layer.x < -layer.width) {
                    layer.x = canvas.width + Math.random() * 100;
                    layer.height = 100 + Math.random() * 200;
                    layer.width = 60 + Math.random() * 80;
                }
            }
        }
    });

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // Ground line
    ctx.strokeStyle = COLORS.groundLine;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.groundLine;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - GROUND_HEIGHT);
    ctx.lineTo(canvas.width, canvas.height - GROUND_HEIGHT);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Grid lines on ground
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height - GROUND_HEIGHT);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER
// ═══════════════════════════════════════════════════════════════════════════════

function drawPlayer() {
    ctx.save();

    // Glow effect
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 20;

    // Body (running robot)
    ctx.fillStyle = COLORS.player;

    // Head
    ctx.fillRect(player.x + 10, player.y, 20, 20);

    // Visor
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 12, player.y + 6, 16, 8);
    ctx.fillStyle = '#ff00aa';
    ctx.fillRect(player.x + 14, player.y + 8, 12, 4);

    // Body
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(player.x + 5, player.y + 22, 30, 25);

    // Legs (animated)
    const legOffset = Math.sin(Date.now() / 50) * 5;
    ctx.fillRect(player.x + 8, player.y + 48, 8, 12 + legOffset);
    ctx.fillRect(player.x + 24, player.y + 48, 8, 12 - legOffset);

    // Jetpack flame (when jumping)
    if (player.isJumping) {
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        const flameHeight = Math.random() * 15 + 10;
        ctx.fillRect(player.x + 15, player.y + 50, 10, flameHeight);
    }

    ctx.restore();
}

function updatePlayer() {
    // Apply gravity
    player.vy += GRAVITY;
    player.y += player.vy;

    // Ground check
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
    const jumpBoost = 1 + (upgrades.jumpHeight.level * 0.15);

    if (player.jumpCount < maxJumps) {
        player.vy = BASE_JUMP_FORCE * jumpBoost;
        player.isJumping = true;
        player.jumpCount++;

        // Jump particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2,
                size: Math.random() * 4 + 2,
                life: 30,
                color: COLORS.particle
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBSTACLES
// ═══════════════════════════════════════════════════════════════════════════════

function spawnObstacle() {
    const types = [
        { width: 30, height: 50 },
        { width: 50, height: 30 },
        { width: 40, height: 70 }
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    obstacles.push({
        x: canvas.width + 50,
        y: canvas.height - GROUND_HEIGHT - type.height,
        width: type.width,
        height: type.height
    });
}

function drawObstacles() {
    obstacles.forEach(obs => {
        ctx.save();
        ctx.fillStyle = COLORS.obstacle;
        ctx.shadowColor = COLORS.obstacle;
        ctx.shadowBlur = 15;

        // Glowing cyberpunk obstacle
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(obs.x, obs.y, obs.width, 5);

        // Warning stripes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        for (let i = 0; i < obs.height; i += 10) {
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + i);
            ctx.lineTo(obs.x + obs.width, obs.y + i + 10);
            ctx.stroke();
        }

        ctx.restore();
    });
}

function updateObstacles() {
    obstacles.forEach(obs => {
        obs.x -= gameSpeed;
    });

    // Remove off-screen
    obstacles = obstacles.filter(obs => obs.x + obs.width > -50);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COINS
// ═══════════════════════════════════════════════════════════════════════════════

function spawnCoin() {
    const heightVariants = [0, 50, 100, 150];
    const baseY = canvas.height - GROUND_HEIGHT - 30;

    coinItems.push({
        x: canvas.width + 50,
        y: baseY - heightVariants[Math.floor(Math.random() * heightVariants.length)],
        size: 20,
        rotation: 0,
        collected: false
    });
}

function drawCoins() {
    coinItems.forEach(coin => {
        if (coin.collected) return;

        ctx.save();
        ctx.translate(coin.x + coin.size / 2, coin.y + coin.size / 2);
        ctx.rotate(coin.rotation);

        // Diamond shape
        ctx.fillStyle = COLORS.coin;
        ctx.shadowColor = COLORS.coin;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(0, -coin.size / 2);
        ctx.lineTo(coin.size / 2, 0);
        ctx.lineTo(0, coin.size / 2);
        ctx.lineTo(-coin.size / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Inner shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(0, -coin.size / 4);
        ctx.lineTo(coin.size / 4, 0);
        ctx.lineTo(0, coin.size / 4);
        ctx.lineTo(-coin.size / 4, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

function updateCoins() {
    const magnetRange = 50 + (upgrades.magnet.level * 40);
    const coinMultiplier = 1 + (upgrades.coinBonus.level * 0.5);

    coinItems.forEach(coin => {
        if (coin.collected) return;

        coin.x -= gameSpeed;
        coin.rotation += 0.1;

        // Magnet effect
        const dx = (player.x + player.width / 2) - coin.x;
        const dy = (player.y + player.height / 2) - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < magnetRange) {
            coin.x += dx * 0.1;
            coin.y += dy * 0.1;
        }

        // Collection check
        if (dist < 30) {
            coin.collected = true;
            coins += Math.ceil(coinMultiplier);
            coinsEl.textContent = coins;

            // Collect particles
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: coin.x,
                    y: coin.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    size: Math.random() * 3 + 2,
                    life: 20,
                    color: COLORS.coin
                });
            }
        }
    });

    // Remove collected/off-screen
    coinItems = coinItems.filter(c => !c.collected && c.x > -50);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════════════════════════════════════════════

function updateParticles() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.size *= 0.95;
    });

    particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLISION
// ═══════════════════════════════════════════════════════════════════════════════

function checkCollisions() {
    for (const obs of obstacles) {
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
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
let difficultyTimer = 0;

function gameLoop(timestamp) {
    if (!gameRunning) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update
    updatePlayer();
    updateObstacles();
    updateCoins();
    updateParticles();
    checkCollisions();

    // Spawn obstacles
    if (timestamp - lastObstacleTime > 1500 - Math.min(score, 500)) {
        spawnObstacle();
        lastObstacleTime = timestamp;
    }

    // Spawn coins
    if (timestamp - lastCoinTime > 800) {
        if (Math.random() > 0.3) spawnCoin();
        lastCoinTime = timestamp;
    }

    // Increase difficulty
    difficultyTimer++;
    if (difficultyTimer % 600 === 0) {
        gameSpeed = Math.min(gameSpeed + 0.5, 15);
    }

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
    // Reset
    score = 0;
    coins = 0;
    gameSpeed = BASE_GAME_SPEED;
    obstacles = [];
    coinItems = [];
    particles = [];
    difficultyTimer = 0;

    player.y = canvas.height - GROUND_HEIGHT - player.height;
    player.vy = 0;
    player.isJumping = false;
    player.jumpCount = 0;

    // Update HUD
    scoreEl.textContent = '0';
    coinsEl.textContent = '0';
    highScoreEl.textContent = highScore;

    // Switch screens
    mainMenu.classList.add('hidden');
    shopScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    const finalScore = Math.floor(score / 10);

    // Update high score
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('cyberRunnerHighScore', highScore);
    }

    // Add coins to total
    totalCoins += coins;
    localStorage.setItem('cyberRunnerCoins', totalCoins);

    // Show game over
    finalScoreEl.textContent = finalScore;
    earnedCoinsEl.textContent = coins;

    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
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
        const isMaxed = upg.level >= upg.maxLevel;
        const canAfford = totalCoins >= cost && !isMaxed;

        const card = document.createElement('div');
        card.className = `upgrade-card ${isMaxed ? 'maxed' : ''}`;
        card.innerHTML = `
            <div class="upgrade-icon">${upg.icon}</div>
            <div class="upgrade-info">
                <h4>${upg.name} ${isMaxed ? '(MAX)' : `Lv.${upg.level + 1}`}</h4>
                <p>${upg.desc}</p>
            </div>
            <div class="upgrade-cost">${isMaxed ? '✓' : `💎 ${cost}`}</div>
        `;

        if (canAfford) {
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

        localStorage.setItem('cyberRunnerCoins', totalCoins);
        localStorage.setItem('cyberRunnerUpgrades', JSON.stringify(
            Object.fromEntries(Object.entries(upgrades).map(([k, v]) => [k, v.level]))
        ));

        shopCoinsEl.textContent = totalCoins;
        renderUpgrades();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// Keyboard
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameRunning) jump();
    }
});

// Touch / Click for mobile
document.getElementById('jumpBtn')?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) jump();
});

document.getElementById('jumpBtn')?.addEventListener('click', () => {
    if (gameRunning) jump();
});

// Canvas click (for desktop)
canvas.addEventListener('click', () => {
    if (gameRunning) jump();
});

// Buttons
document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('shopBtn').addEventListener('click', showShop);
document.getElementById('retryBtn').addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', showMenu);
document.getElementById('backBtn').addEventListener('click', showMenu);

// Init
totalCoinsEl.textContent = totalCoins;

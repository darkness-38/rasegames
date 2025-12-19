// ===================================
// MAIN GAME ENGINE
// Game loop, state management, rendering
// ===================================

// Game State
const gameState = {
    currentScreen: 'main-menu',
    gameMode: 'local', // local, online, training
    isRunning: false,
    isPaused: false,

    // Selection
    p1Character: null,
    p2Character: null,
    selectedArena: 'dojo',

    // Match
    round: 1,
    maxRounds: 3,
    p1Wins: 0,
    p2Wins: 0,
    timer: 99,
    timerInterval: null,

    // Players
    player1: null,
    player2: null,

    // Canvas
    canvas: null,
    ctx: null,

    // Animation
    animationId: null,
    lastFrameTime: 0,

    // Sound
    soundEnabled: true,

    // Online mode
    isOnline: false,
    isHost: false,
    opponentInput: null,
    lastSentInput: null
};

// Arena backgrounds
const arenas = {
    dojo: {
        bgColor: '#0a0a15',
        groundColor: '#1a1a2e',
        accentColor: '#ff6b35',
        elements: 'dojo'
    },
    cyber: {
        bgColor: '#050510',
        groundColor: '#0f0f2a',
        accentColor: '#00f0ff',
        elements: 'cyber'
    },
    volcano: {
        bgColor: '#1a0505',
        groundColor: '#2a0f0f',
        accentColor: '#ff4400',
        elements: 'volcano'
    }
};

// ===================================
// INITIALIZATION
// ===================================

function initGame() {
    gameState.canvas = document.getElementById('game-canvas');
    gameState.ctx = gameState.canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Pause on Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameState.currentScreen === 'game-screen') {
            togglePause();
        }
    });
}

function resizeCanvas() {
    if (!gameState.canvas) return;

    gameState.canvas.width = window.innerWidth;
    gameState.canvas.height = window.innerHeight;

    physics.setStageSize(gameState.canvas.width, gameState.canvas.height);
}

// ===================================
// SCREEN MANAGEMENT
// ===================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
}

function goToMenu() {
    stopGame();
    showScreen('main-menu');
}

function showControls() {
    showScreen('controls-screen');
}

function showOnlineMenu() {
    showScreen('online-menu');
}

function goToCharacterSelect() {
    // Reset selections
    gameState.p1Character = null;
    gameState.p2Character = null;
    updateCharacterSelection();
    showScreen('character-select');
}

// ===================================
// CHARACTER SELECTION
// ===================================

function startLocalGame() {
    gameState.gameMode = 'local';
    goToCharacterSelect();
}

function startTraining() {
    gameState.gameMode = 'training';
    goToCharacterSelect();
}

function selectCharacter(playerNum, charType) {
    if (playerNum === 1) {
        gameState.p1Character = charType;
    } else {
        gameState.p2Character = charType;
    }

    updateCharacterSelection();
}

function selectArena(arenaType) {
    gameState.selectedArena = arenaType;

    document.querySelectorAll('.arena-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.arena === arenaType);
    });
}

function updateCharacterSelection() {
    // Update P1 cards
    document.querySelectorAll('#p1-cards .char-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.char === gameState.p1Character);
    });

    // Update P2 cards
    document.querySelectorAll('#p2-cards .char-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.char === gameState.p2Character);
    });

    // Enable fight button if both selected
    const fightBtn = document.getElementById('fight-btn');
    fightBtn.disabled = !(gameState.p1Character && gameState.p2Character);
}

function createCharacter(type, playerNum) {
    const x = playerNum === 1 ? 300 : gameState.canvas.width - 380;
    const direction = playerNum === 1 ? 1 : -1;

    switch (type) {
        case 'warrior':
            return new Warrior({ x, direction });
        case 'ninja':
            return new Ninja({ x, direction });
        case 'mage':
            return new Mage({ x, direction });
        default:
            return new Character({ x, direction });
    }
}

// ===================================
// GAME START
// ===================================

function startFight() {
    initGame();

    // Create players
    gameState.player1 = createCharacter(gameState.p1Character, 1);
    gameState.player2 = createCharacter(gameState.p2Character, 2);

    // Reset match state
    gameState.round = 1;
    gameState.p1Wins = 0;
    gameState.p2Wins = 0;

    // Update HUD
    updateHUD();

    // Show game screen
    showScreen('game-screen');

    // Start round
    startRound();
}

function startRound() {
    // Reset players
    gameState.player1.reset(300, 1);
    gameState.player2.reset(gameState.canvas.width - 380, -1);

    // Reset combat system
    combatSystem.reset();

    // Reset timer
    gameState.timer = 99;

    // Update round indicator
    document.getElementById('round-indicator').textContent = `ROUND ${gameState.round}`;

    // Announcer
    showAnnouncer('ROUND ' + gameState.round, '#7b2cbf');

    setTimeout(() => {
        showAnnouncer('FIGHT!', '#ff006e');

        setTimeout(() => {
            hideAnnouncer();
            startGameLoop();
            startTimer();
        }, 800);
    }, 1000);
}

// ===================================
// GAME LOOP
// ===================================

function startGameLoop() {
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.lastFrameTime = performance.now();
    gameLoop();
}

function stopGame() {
    gameState.isRunning = false;
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    stopTimer();
}

function gameLoop(currentTime = 0) {
    if (!gameState.isRunning) return;

    gameState.animationId = requestAnimationFrame(gameLoop);

    if (gameState.isPaused) return;

    // Delta time for consistent speed
    const deltaTime = currentTime - gameState.lastFrameTime;
    gameState.lastFrameTime = currentTime;

    // Update
    update();

    // Draw
    draw();

    // Check round end
    checkRoundEnd();
}

function update() {
    // Get input - support mobile controls
    let p1Input;
    let p2Input;

    if (gameState.isOnline) {
        // Online mode
        if (gameState.isHost) {
            // Host controls P1
            p1Input = mobileControls.shouldUseMobileControls() ?
                mobileControls.getInput() : inputHandler.getPlayerInput(1);
            p2Input = gameState.opponentInput || {};

            // Send input to opponent
            if (p1Input) {
                multiplayer.sendInput(p1Input);
            }
        } else {
            // Guest controls P2
            p1Input = gameState.opponentInput || {};
            p2Input = mobileControls.shouldUseMobileControls() ?
                mobileControls.getInput() : inputHandler.getPlayerInput(1);

            // Send input to opponent
            if (p2Input) {
                multiplayer.sendInput(p2Input);
            }
        }
    } else if (gameState.gameMode === 'training') {
        // Training mode - only P1
        p1Input = mobileControls.shouldUseMobileControls() ?
            mobileControls.getInput() : inputHandler.getPlayerInput(1);
        p2Input = {};
    } else {
        // Local mode
        if (mobileControls.shouldUseMobileControls()) {
            // On mobile, P1 uses touch controls, P2 is AI or second touch zone
            p1Input = mobileControls.getInput();
            p2Input = {}; // Simple AI or waiting for second player
        } else {
            p1Input = inputHandler.getPlayerInput(1);
            p2Input = inputHandler.getPlayerInput(2);
        }
    }

    // Update players
    gameState.player1.update(p1Input, gameState.player2);
    gameState.player2.update(p2Input, gameState.player1);

    // Update combat
    combatSystem.update(gameState.player1, gameState.player2);

    // Update HUD
    updateHUD();

    // Sync game state in online mode (host only)
    if (gameState.isOnline && gameState.isHost) {
        syncGameState();
    }
}

function syncGameState() {
    // Send authoritative game state to guest
    multiplayer.sendGameState({
        p1: {
            x: gameState.player1.x,
            y: gameState.player1.y,
            health: gameState.player1.health,
            energy: gameState.player1.energy,
            state: gameState.player1.state
        },
        p2: {
            x: gameState.player2.x,
            y: gameState.player2.y,
            health: gameState.player2.health,
            energy: gameState.player2.energy,
            state: gameState.player2.state
        },
        timer: gameState.timer
    });
}

function draw() {
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw arena background
    drawArena(ctx);

    // Draw players
    gameState.player1.draw(ctx);
    gameState.player2.draw(ctx);

    // Draw combat effects
    combatSystem.draw(ctx);

    // Debug hitboxes (uncomment to debug)
    // drawDebugHitboxes(ctx);
}

function drawArena(ctx) {
    const arena = arenas[gameState.selectedArena];
    const canvas = gameState.canvas;

    // Check if background image is loaded
    const bgImage = getImage('bg_' + gameState.selectedArena);

    if (bgImage) {
        // Draw background image
        // Scale to cover the canvas
        const scale = Math.max(canvas.width / bgImage.width, canvas.height / bgImage.height);
        const x = (canvas.width / 2) - (bgImage.width / 2) * scale;
        const y = (canvas.height / 2) - (bgImage.height / 2) * scale;

        ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);

        // Add overlay for text readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Fallback to gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, arena.bgColor);
        bgGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Arena-specific elements (Overlay effects)
    switch (gameState.selectedArena) {
        case 'dojo':
            drawDojoEffects(ctx, arena);
            break;
        case 'cyber':
            drawCyberEffects(ctx, arena);
            break;
        case 'volcano':
            drawVolcanoEffects(ctx, arena);
            break;
    }

    // Ground visual alignment (invisible collision line debug)
    // ctx.strokeStyle = 'red';
    // ctx.beginPath();
    // ctx.moveTo(0, physics.groundLevel);
    // ctx.lineTo(canvas.width, physics.groundLevel);
    // ctx.stroke();
}

function drawDojoEffects(ctx, arena) {
    const canvas = gameState.canvas;

    // Sakura petals particle effect
    const time = Date.now() / 1000;

    ctx.fillStyle = '#ffb7b2';
    for (let i = 0; i < 30; i++) {
        const x = (i * 123 + time * 50) % canvas.width;
        const y = (i * 87 + time * 30 + Math.sin(time + i) * 20) % canvas.height;
        const size = 3 + Math.sin(time * 2 + i);
        const rot = time + i;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawCyberEffects(ctx, arena) {
    const canvas = gameState.canvas;
    const time = Date.now() / 1000;

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 1);
    }

    // Light rain
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    for (let i = 0; i < 100; i++) {
        const x = (i * 37 + time * 100) % canvas.width;
        const y = (i * 73 + time * 500) % canvas.height;
        const len = 10 + Math.random() * 20;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + len);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function drawVolcanoEffects(ctx, arena) {
    const canvas = gameState.canvas;
    const time = Date.now() / 1000;

    // Heat haze overlay
    // (Simulated by drawing subtle wobbling particles)

    // Ember particles
    ctx.fillStyle = '#ffaa00';
    for (let i = 0; i < 30; i++) {
        const baseX = (i * 89) % canvas.width;
        const baseY = canvas.height - (time * 50 + i * 47) % canvas.height;
        const wobble = Math.sin(time * 3 + i) * 10;

        ctx.globalAlpha = 0.8 - (canvas.height - baseY) / canvas.height;
        ctx.beginPath();
        ctx.arc(baseX + wobble, baseY, 2 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}


function drawDebugHitboxes(ctx) {
    // Player hitboxes
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(gameState.player1.x, gameState.player1.y, gameState.player1.width, gameState.player1.height);
    ctx.strokeRect(gameState.player2.x, gameState.player2.y, gameState.player2.width, gameState.player2.height);

    // Attack hitboxes
    const p1Hitbox = gameState.player1.getHitbox();
    const p2Hitbox = gameState.player2.getHitbox();

    ctx.strokeStyle = '#ff0000';
    if (p1Hitbox) {
        ctx.strokeRect(p1Hitbox.x, p1Hitbox.y, p1Hitbox.width, p1Hitbox.height);
    }
    if (p2Hitbox) {
        ctx.strokeRect(p2Hitbox.x, p2Hitbox.y, p2Hitbox.width, p2Hitbox.height);
    }
}

// ===================================
// HUD
// ===================================

function updateHUD() {
    const p1 = gameState.player1;
    const p2 = gameState.player2;

    if (!p1 || !p2) return;

    // Health bars
    const p1HealthPercent = (p1.health / p1.maxHealth) * 100;
    const p2HealthPercent = (p2.health / p2.maxHealth) * 100;

    document.getElementById('p1-health').style.width = p1HealthPercent + '%';
    document.getElementById('p2-health').style.width = p2HealthPercent + '%';

    // Damage bars (delayed)
    setTimeout(() => {
        document.getElementById('p1-damage').style.width = p1HealthPercent + '%';
        document.getElementById('p2-damage').style.width = p2HealthPercent + '%';
    }, 300);

    // Energy bars
    document.getElementById('p1-energy').style.width = p1.energy + '%';
    document.getElementById('p2-energy').style.width = p2.energy + '%';

    // Combo counters
    const p1Combo = document.getElementById('p1-combo');
    const p2Combo = document.getElementById('p2-combo');

    if (p1.comboCount > 1 && combatSystem.comboTimers.p1 > 0) {
        p1Combo.textContent = p1.comboCount + ' COMBO';
        p1Combo.classList.add('active');
        p1Combo.style.color = '#00f0ff';
    } else {
        p1Combo.classList.remove('active');
    }

    if (p2.comboCount > 1 && combatSystem.comboTimers.p2 > 0) {
        p2Combo.textContent = p2.comboCount + ' COMBO';
        p2Combo.classList.add('active');
        p2Combo.style.color = '#ff006e';
    } else {
        p2Combo.classList.remove('active');
    }

    // Update portraits
    const p1Portrait = document.getElementById('p1-portrait');
    const p2Portrait = document.getElementById('p2-portrait');

    p1Portrait.className = 'player-portrait ' + gameState.p1Character + '-portrait';
    p2Portrait.className = 'player-portrait ' + gameState.p2Character + '-portrait';

    // Player names
    document.getElementById('p1-name').textContent = p1.name;
    document.getElementById('p2-name').textContent = p2.name;
}

// ===================================
// TIMER
// ===================================

function startTimer() {
    stopTimer();
    gameState.timerInterval = setInterval(() => {
        if (gameState.isPaused) return;

        gameState.timer--;
        document.getElementById('game-timer').textContent = gameState.timer;

        // Timer colors
        const timerEl = document.getElementById('game-timer');
        timerEl.classList.remove('warning', 'critical');
        if (gameState.timer <= 10) {
            timerEl.classList.add('critical');
        } else if (gameState.timer <= 30) {
            timerEl.classList.add('warning');
        }

        if (gameState.timer <= 0) {
            stopTimer();
            endRound();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// ===================================
// ROUND END
// ===================================

function checkRoundEnd() {
    const p1 = gameState.player1;
    const p2 = gameState.player2;

    if (p1.health <= 0 || p2.health <= 0) {
        stopTimer();
        gameState.isRunning = false;

        setTimeout(() => {
            endRound();
        }, 1000);
    }
}

function endRound() {
    const p1 = gameState.player1;
    const p2 = gameState.player2;

    // Determine round winner
    let roundWinner = null;
    if (p1.health <= 0) {
        roundWinner = 2;
        gameState.p2Wins++;
    } else if (p2.health <= 0) {
        roundWinner = 1;
        gameState.p1Wins++;
    } else {
        // Time out - winner has more health
        if (p1.health > p2.health) {
            roundWinner = 1;
            gameState.p1Wins++;
        } else if (p2.health > p1.health) {
            roundWinner = 2;
            gameState.p2Wins++;
        } else {
            // Draw - both get a point
            gameState.p1Wins++;
            gameState.p2Wins++;
        }
    }

    // Check match end
    const winsNeeded = Math.ceil(gameState.maxRounds / 2);

    if (gameState.p1Wins >= winsNeeded) {
        endMatch(1);
    } else if (gameState.p2Wins >= winsNeeded) {
        endMatch(2);
    } else {
        // Next round
        showAnnouncer(roundWinner ? `PLAYER ${roundWinner} WINS!` : 'DRAW!', roundWinner === 1 ? '#00f0ff' : '#ff006e');

        setTimeout(() => {
            hideAnnouncer();
            gameState.round++;
            startRound();
        }, 2000);
    }
}

function endMatch(winner) {
    stopGame();

    showAnnouncer(`PLAYER ${winner} WINS!`, winner === 1 ? '#00f0ff' : '#ff006e');

    setTimeout(() => {
        hideAnnouncer();
        showResultScreen(winner);
    }, 2000);
}

// ===================================
// RESULT SCREEN
// ===================================

function showResultScreen(winner) {
    const resultTitle = document.getElementById('result-title');
    resultTitle.textContent = `OYUNCU ${winner} KAZANDI!`;
    resultTitle.style.color = winner === 1 ? '#00f0ff' : '#ff006e';

    // Stats
    document.getElementById('result-p1-stats').textContent = `${gameState.p1Wins} Round`;
    document.getElementById('result-p2-stats').textContent = `${gameState.p2Wins} Round`;

    showScreen('result-screen');
}

function rematch() {
    startFight();
}

// ===================================
// PAUSE
// ===================================

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    document.getElementById('pause-menu').classList.toggle('active', gameState.isPaused);
}

function resumeGame() {
    gameState.isPaused = false;
    document.getElementById('pause-menu').classList.remove('active');
}

function restartMatch() {
    resumeGame();
    stopGame();
    startFight();
}

function exitToMenu() {
    resumeGame();
    goToMenu();
}

// ===================================
// ANNOUNCER
// ===================================

function showAnnouncer(text, color = '#ffffff') {
    const announcer = document.getElementById('announcer');
    announcer.textContent = text;
    announcer.style.color = color;
    announcer.classList.add('show');
}

function hideAnnouncer() {
    document.getElementById('announcer').classList.remove('show');
}

// ===================================
// ONLINE MODE
// ===================================

function createRoom() {
    document.getElementById('connection-status').textContent = 'Sunucuya bağlanılıyor...';
    document.getElementById('connection-status').className = 'connection-status connecting';

    // Setup multiplayer callbacks
    setupMultiplayerCallbacks();

    // Create room
    multiplayer.createRoom();
}

function joinRoom() {
    const code = document.getElementById('join-code').value.toUpperCase();
    if (code.length !== 6) {
        document.getElementById('connection-status').textContent = 'Geçerli bir oda kodu girin (6 karakter)';
        document.getElementById('connection-status').className = 'connection-status error';
        return;
    }

    document.getElementById('connection-status').textContent = 'Odaya bağlanılıyor...';
    document.getElementById('connection-status').className = 'connection-status connecting';

    // Setup multiplayer callbacks
    setupMultiplayerCallbacks();

    // Join room
    multiplayer.joinRoom(code);
}

function setupMultiplayerCallbacks() {
    // Connection status
    multiplayer.onConnectionChange = (connected) => {
        if (!connected && gameState.isOnline) {
            document.getElementById('connection-status').textContent = 'Bağlantı kesildi!';
            document.getElementById('connection-status').className = 'connection-status error';
        }
    };

    // Room created
    multiplayer.onRoomCreated = (code) => {
        const roomCodeEl = document.getElementById('room-code');
        roomCodeEl.classList.remove('hidden');
        // Set the code in the paragraph element inside room-code div
        const codeTextEl = roomCodeEl.querySelector('p:last-child') || roomCodeEl;
        codeTextEl.textContent = code;
        document.getElementById('connection-status').textContent = 'Oda oluşturuldu! Rakip bekleniyor...';
        document.getElementById('connection-status').className = 'text-center text-sm text-primary';
        gameState.isHost = true;
    };

    // Joined room
    multiplayer.onJoinedRoom = (data) => {
        document.getElementById('connection-status').textContent = 'Odaya katıldınız!';
        document.getElementById('connection-status').className = 'connection-status connected';
        gameState.isHost = false;
    };

    // Join error
    multiplayer.onJoinError = (message) => {
        document.getElementById('connection-status').textContent = message;
        document.getElementById('connection-status').className = 'connection-status error';
    };

    // Guest joined (host receives this)
    multiplayer.onGuestJoined = (data) => {
        document.getElementById('connection-status').textContent = 'Rakip bulundu! Karakter seçimine geçiliyor...';
        document.getElementById('connection-status').className = 'connection-status connected';
    };

    // Go to character select
    multiplayer.onGoToCharacterSelect = () => {
        gameState.gameMode = 'online';
        gameState.isOnline = true;

        // Reset selections
        gameState.p1Character = null;
        gameState.p2Character = null;

        // Show only the player's selection based on host/guest
        showOnlineCharacterSelect();
    };

    // Opponent selected character
    multiplayer.onOpponentSelectedCharacter = (character) => {
        if (gameState.isHost) {
            gameState.p2Character = character;
        } else {
            gameState.p1Character = character;
        }
        updateOnlineCharacterSelection();
    };

    // Arena selected
    multiplayer.onArenaSelected = (arena) => {
        gameState.selectedArena = arena;
        document.querySelectorAll('.arena-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.arena === arena);
        });
    };

    // Opponent ready
    multiplayer.onOpponentReady = () => {
        document.getElementById('connection-status').textContent = 'Rakip hazır!';
    };

    // Start game
    multiplayer.onStartGame = (data) => {
        gameState.p1Character = data.hostCharacter;
        gameState.p2Character = data.guestCharacter;
        gameState.selectedArena = data.arena;
        startOnlineFight();
    };

    // Opponent input
    multiplayer.onOpponentInput = (input) => {
        gameState.opponentInput = input;
    };

    // Game state update (guest receives this)
    multiplayer.onGameStateUpdate = (state) => {
        if (!gameState.isHost && gameState.player1 && gameState.player2) {
            // Update positions from host
            gameState.player1.x = state.p1.x;
            gameState.player1.y = state.p1.y;
            gameState.player1.health = state.p1.health;
            gameState.player1.energy = state.p1.energy;

            gameState.player2.x = state.p2.x;
            gameState.player2.y = state.p2.y;
            gameState.player2.health = state.p2.health;
            gameState.player2.energy = state.p2.energy;
        }
    };

    // Guest left
    multiplayer.onGuestLeft = () => {
        if (gameState.currentScreen === 'game-screen') {
            showAnnouncer('RAKİP AYRILDI', '#ff4444');
            setTimeout(() => {
                hideAnnouncer();
                stopGame();
                showOnlineMenu();
            }, 2000);
        } else {
            document.getElementById('connection-status').textContent = 'Rakip ayrıldı. Yeni rakip bekleniyor...';
            document.getElementById('connection-status').className = 'connection-status connecting';
        }
    };

    // Room closed
    multiplayer.onRoomClosed = (reason) => {
        showAnnouncer(reason, '#ff4444');
        setTimeout(() => {
            hideAnnouncer();
            stopGame();
            gameState.isOnline = false;
            goToMenu();
        }, 2000);
    };

    // Rematch events
    multiplayer.onRematchRequested = () => {
        document.getElementById('connection-status').textContent = 'Rakip rövanş istiyor!';
    };

    multiplayer.onStartRematch = () => {
        startOnlineFight();
    };
}

function showOnlineCharacterSelect() {
    showScreen('character-select');

    // Update labels for online mode
    const p1Label = document.querySelector('#p1-select .player-label');
    const p2Label = document.querySelector('#p2-select .player-label');

    if (gameState.isHost) {
        p1Label.innerHTML = 'SEN <span class="key-hint">(Karakter Seç)</span>';
        p2Label.innerHTML = 'RAKİP <span class="key-hint">(Bekleniyor...)</span>';
        document.getElementById('p2-select').style.opacity = '0.5';
        document.getElementById('p2-select').style.pointerEvents = 'none';
    } else {
        p1Label.innerHTML = 'RAKİP <span class="key-hint">(Bekleniyor...)</span>';
        p2Label.innerHTML = 'SEN <span class="key-hint">(Karakter Seç)</span>';
        document.getElementById('p1-select').style.opacity = '0.5';
        document.getElementById('p1-select').style.pointerEvents = 'none';
    }
}

function selectCharacterOnline(charType) {
    if (gameState.isHost) {
        gameState.p1Character = charType;
    } else {
        gameState.p2Character = charType;
    }

    multiplayer.selectCharacter(charType);
    updateOnlineCharacterSelection();
}

function updateOnlineCharacterSelection() {
    // Update visual selection
    const myCards = gameState.isHost ? '#p1-cards .char-card' : '#p2-cards .char-card';
    const myChar = gameState.isHost ? gameState.p1Character : gameState.p2Character;

    document.querySelectorAll(myCards).forEach(card => {
        card.classList.toggle('selected', card.dataset.char === myChar);
    });

    // Show opponent's selection
    const opponentCards = gameState.isHost ? '#p2-cards .char-card' : '#p1-cards .char-card';
    const opponentChar = gameState.isHost ? gameState.p2Character : gameState.p1Character;

    document.querySelectorAll(opponentCards).forEach(card => {
        card.classList.toggle('selected', card.dataset.char === opponentChar);
    });

    // Enable ready button if character selected
    const fightBtn = document.getElementById('fight-btn');
    const myCharSelected = gameState.isHost ? gameState.p1Character : gameState.p2Character;
    fightBtn.disabled = !myCharSelected;
    fightBtn.textContent = myCharSelected ? 'HAZIR!' : 'Karakter Seç';
    fightBtn.onclick = setOnlineReady;
}

function setOnlineReady() {
    multiplayer.setReady();
    document.getElementById('fight-btn').textContent = 'Rakip Bekleniyor...';
    document.getElementById('fight-btn').disabled = true;

    // Select arena if host
    if (gameState.isHost) {
        multiplayer.selectArena(gameState.selectedArena);
    }
}

function startOnlineFight() {
    initGame();

    // Create players
    gameState.player1 = createCharacter(gameState.p1Character, 1);
    gameState.player2 = createCharacter(gameState.p2Character, 2);

    // Reset match state
    gameState.round = 1;
    gameState.p1Wins = 0;
    gameState.p2Wins = 0;

    // Update HUD
    updateHUD();

    // Enable mobile controls
    if (mobileControls.shouldUseMobileControls()) {
        mobileControls.enable();
    }

    // Show game screen
    showScreen('game-screen');

    // Start round
    startRound();
}

// Override selectCharacter for online mode
const originalSelectCharacter = selectCharacter;
selectCharacter = function (playerNum, charType) {
    if (gameState.isOnline) {
        selectCharacterOnline(charType);
    } else {
        originalSelectCharacter(playerNum, charType);
    }
};

// Override startFight for mobile controls
const originalStartFight = startFight;
startFight = function () {
    originalStartFight();

    // Enable mobile controls during game
    if (mobileControls.shouldUseMobileControls()) {
        mobileControls.enable();
    }
};

// Override stopGame to disable mobile controls
const originalStopGame = stopGame;
stopGame = function () {
    originalStopGame();

    // Disable mobile controls
    mobileControls.disable();
};

// ===================================
// BATTLE PREPARATION (WAITING ROOM)
// ===================================

let prepTimer = null;
let prepCountdown = 30;
let playerReady = false;

function showBattlePrep() {
    showScreen('battle-prep');
    playerReady = false;
    prepCountdown = 30;

    // Update player info
    const charNames = {
        'warrior': 'SHADOW WARRIOR',
        'ninja': 'PHANTOM NINJA',
        'mage': 'ARCANE MAGE'
    };

    const charClasses = {
        'warrior': 'Warrior',
        'ninja': 'Assassin',
        'mage': 'Mage'
    };

    // Update Player 1 character
    const p1Char = gameState.isHost ? gameState.p1Character : gameState.p2Character;
    if (p1Char) {
        document.getElementById('prep-p1-char-name').textContent = charNames[p1Char] || p1Char.toUpperCase();
        document.getElementById('prep-p1-char-class').textContent = charClasses[p1Char] || 'Unknown';
    }

    // Update arena info
    const arenaNames = {
        'dojo': 'GOLGE DOJO',
        'cyber': 'CYBER ARENA',
        'volcano': 'VOLKAN TAPINAGI'
    };
    document.getElementById('prep-arena-info').textContent = 'ARENA: ' + (arenaNames[gameState.selectedArena] || 'UNKNOWN');

    // Start countdown timer
    startPrepTimer();

    // Update ready button
    updatePrepReadyButton();
}

function startPrepTimer() {
    stopPrepTimer();
    prepCountdown = 30;
    updatePrepTimerDisplay();

    prepTimer = setInterval(() => {
        prepCountdown--;
        updatePrepTimerDisplay();

        if (prepCountdown <= 0) {
            stopPrepTimer();
            // Auto-start if both ready or time runs out
            if (gameState.isOnline) {
                // Let server handle auto-start
            } else {
                startFight();
            }
        }
    }, 1000);
}

function stopPrepTimer() {
    if (prepTimer) {
        clearInterval(prepTimer);
        prepTimer = null;
    }
}

function updatePrepTimerDisplay() {
    const timerEl = document.getElementById('prep-timer');
    if (timerEl) {
        timerEl.textContent = prepCountdown.toString().padStart(2, '0');
        // Add warning colors
        if (prepCountdown <= 10) {
            timerEl.classList.add('text-red-500');
        } else {
            timerEl.classList.remove('text-red-500');
        }
    }
}

function toggleReady() {
    playerReady = !playerReady;
    updatePrepReadyButton();

    if (gameState.isOnline) {
        multiplayer.setReady();
    } else {
        // In local mode, just start the fight when ready
        if (playerReady) {
            stopPrepTimer();
            startFight();
        }
    }
}

function updatePrepReadyButton() {
    const btn = document.getElementById('prep-ready-btn');
    if (!btn) return;

    if (playerReady) {
        btn.innerHTML = `
            <span>Hazır!</span>
            <span class="material-symbols-outlined">check_circle</span>
        `;
        btn.classList.remove('bg-primary');
        btn.classList.add('bg-green-600');
    } else {
        btn.innerHTML = `
            <span>Hazırım</span>
            <span class="material-symbols-outlined group-hover/btn:scale-110 transition-transform">check_circle</span>
        `;
        btn.classList.add('bg-primary');
        btn.classList.remove('bg-green-600');
    }
}

function updateOpponentStatus(ready, opponentChar) {
    const statusEl = document.getElementById('prep-opponent-status');
    const charNameEl = document.getElementById('prep-p2-char-name');
    const charClassEl = document.getElementById('prep-p2-char-class');

    const charNames = {
        'warrior': 'SHADOW WARRIOR',
        'ninja': 'PHANTOM NINJA',
        'mage': 'ARCANE MAGE'
    };

    const charClasses = {
        'warrior': 'Warrior',
        'ninja': 'Assassin',
        'mage': 'Mage'
    };

    if (opponentChar) {
        charNameEl.textContent = charNames[opponentChar] || opponentChar.toUpperCase();
        charClassEl.textContent = charClasses[opponentChar] || 'Unknown';
    }

    if (statusEl) {
        if (ready) {
            statusEl.innerHTML = `
                <span class="relative flex h-3 w-3">
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span class="text-green-400">Rakip Hazır!</span>
            `;
        } else {
            statusEl.innerHTML = `
                <span class="relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-white/50"></span>
                </span>
                <span>Rakip bekleniyor...</span>
            `;
        }
    }
}

function cancelMatch() {
    stopPrepTimer();
    playerReady = false;

    if (gameState.isOnline) {
        multiplayer.leaveRoom();
        gameState.isOnline = false;
    }

    goToMenu();
}

// ===================================
// INITIALIZATION ON LOAD
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Load assets first
    loadAssets(() => {
        // Pre-initialize canvas for smoother start
        initGame();

        // Check for mobile and show appropriate controls info
        if (mobileControls.isMobile) {
            // Update menu for mobile
            const localBtn = document.querySelector('.menu-btn');
            if (localBtn) {
                localBtn.querySelector('.btn-desc').textContent = 'Dokunmatik Kontroller';
            }
        }

        // Start ping measurement
        startPingMeasurement();
    });
});

// ===================================
// REAL-TIME PING MEASUREMENT
// ===================================

let pingInterval = null;
let currentPing = 0;

function startPingMeasurement() {
    // Initial measurement
    measurePing();

    // Update every second
    pingInterval = setInterval(measurePing, 1000);
}

function measurePing() {
    const startTime = performance.now();

    // Create a small request to measure round-trip time
    const xhr = new XMLHttpRequest();
    xhr.open('GET', window.location.href + '?ping=' + Date.now(), true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            const endTime = performance.now();
            currentPing = Math.round(endTime - startTime);
            updatePingDisplay(currentPing);
        }
    };

    xhr.onerror = function () {
        // Fallback: measure using performance API if available
        if (performance.getEntriesByType) {
            const entries = performance.getEntriesByType('navigation');
            if (entries.length > 0) {
                currentPing = Math.round(entries[0].responseStart - entries[0].requestStart);
                updatePingDisplay(currentPing);
            }
        }
    };

    xhr.send();
}

function updatePingDisplay(ping) {
    // Update all ping displays on the page
    const pingDisplays = document.querySelectorAll('#ping-display, .ping-display');
    const pingIndicators = document.querySelectorAll('#ping-indicator, .ping-indicator');

    pingDisplays.forEach(display => {
        display.textContent = `Ping: ${ping}ms`;
    });

    // Update indicator color based on ping quality
    let indicatorColor = 'bg-green-500'; // Good: < 50ms
    let indicatorClass = 'animate-pulse';

    if (ping > 150) {
        indicatorColor = 'bg-red-500'; // Bad: > 150ms
    } else if (ping > 80) {
        indicatorColor = 'bg-yellow-500'; // Medium: 80-150ms
    }

    pingIndicators.forEach(indicator => {
        // Remove old color classes
        indicator.className = indicator.className
            .replace(/bg-green-500|bg-yellow-500|bg-red-500/g, '')
            .trim();
        // Add new color class
        indicator.classList.add(indicatorColor, 'w-2', 'h-2', 'rounded-full', indicatorClass);
    });
}

function stopPingMeasurement() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

function getPing() {
    return currentPing;
}


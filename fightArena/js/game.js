





const gameState = {
    currentScreen: 'main-menu',
    gameMode: 'local',
    isRunning: false,
    isPaused: false,


    p1Character: null,
    p2Character: null,
    selectedArena: 'dojo',


    round: 1,
    maxRounds: 3,
    p1Wins: 0,
    p2Wins: 0,
    timer: 99,
    timerInterval: null,


    player1: null,
    player2: null,


    canvas: null,
    ctx: null,


    animationId: null,
    lastFrameTime: 0,


    soundEnabled: true,


    isOnline: false,
    isHost: false,
    opponentInput: null,
    lastSentInput: null,
    lastSyncTime: 0,
    syncInterval: 40 // Sync every 40ms (25Hz)
};


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





function initGame() {
    gameState.canvas = document.getElementById('game-canvas');
    gameState.ctx = gameState.canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);


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





function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;

    // Hide navbar during gameplay for immersion
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (screenId === 'game-screen' || screenId === 'result-screen') {
            navbar.style.display = 'none';
        } else {
            navbar.style.display = '';
        }
    }
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
    setupMultiplayerCallbacks(); // Ensure callbacks are ready

    if (!multiplayer.isConnected) {
        const listContainer = document.getElementById('room-list');
        if (listContainer) {
            listContainer.innerHTML = `
            <div class="bg-surface-dark/50 border border-white/10 p-4 rounded-xl text-center text-white/40 text-sm animate-pulse">
                Connecting to lobby...
            </div>`;
        }

        multiplayer.connect();

        // Check for connection to request list
        const checkInterval = setInterval(() => {
            if (multiplayer.isConnected) {
                refreshRoomList();
                clearInterval(checkInterval);
            }
        }, 200);
    } else {
        refreshRoomList();
    }
}

function goToCharacterSelect() {

    gameState.p1Character = null;
    gameState.p2Character = null;
    updateCharacterSelection();
    showScreen('character-select');
}





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
    // Character data for preview
    const characterData = {
        warrior: {
            name: 'Shadow Warrior',
            lore: 'A legendary blade master who trained in the ancient Shadow Dojo. His devastating combos can break through any defense.',
            power: 90, speed: 50, defense: 80,
            ability1: 'Sword Slash', ability2: 'Heavy Strike', special: 'Blade Storm',
            icon: 'swords', gradient: 'from-orange-500 to-orange-800'
        },
        ninja: {
            name: 'Phantom Ninja',
            lore: 'Swift as the wind, deadly as the night. This assassin uses speed and shadow techniques to overwhelm opponents.',
            power: 60, speed: 95, defense: 40,
            ability1: 'Shuriken', ability2: 'Shadow Dash', special: 'Shadow Clone',
            icon: 'visibility_off', gradient: 'from-purple-500 to-purple-900'
        },
        mage: {
            name: 'Arcane Mage',
            lore: 'Master of elemental magic, capable of devastating ranged attacks. Controls the battlefield with powerful spells.',
            power: 75, speed: 65, defense: 55,
            ability1: 'Fireball', ability2: 'Ice Blast', special: 'Arcane Surge',
            icon: 'auto_fix_high', gradient: 'from-blue-500 to-blue-900'
        }
    };

    // Update P1 cards
    document.querySelectorAll('#p1-cards .char-card-mini, #p1-cards .char-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.char === gameState.p1Character);
        if (card.dataset.char === gameState.p1Character) {
            card.classList.add('border-primary', 'shadow-[0_0_30px_rgba(70,236,19,0.4)]');
        } else {
            card.classList.remove('border-primary', 'shadow-[0_0_30px_rgba(70,236,19,0.4)]');
        }
    });

    // Update P2 cards
    document.querySelectorAll('#p2-cards .char-card-mini, #p2-cards .char-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.char === gameState.p2Character);
        if (card.dataset.char === gameState.p2Character) {
            card.classList.add('border-red-500', 'shadow-[0_0_30px_rgba(255,0,110,0.4)]');
        } else {
            card.classList.remove('border-red-500', 'shadow-[0_0_30px_rgba(255,0,110,0.4)]');
        }
    });

    // Update P1 preview
    updatePreviewPanel(1, gameState.p1Character, characterData);
    // Update P2 preview
    updatePreviewPanel(2, gameState.p2Character, characterData);

    // Enable fight button
    const fightBtn = document.getElementById('fight-btn');
    fightBtn.disabled = !(gameState.p1Character && gameState.p2Character);
}

function updatePreviewPanel(playerNum, charType, characterData) {
    const prefix = `p${playerNum}`;
    const charVisual = document.getElementById(`${prefix}-char-visual`);
    const charInfo = document.getElementById(`${prefix}-char-info`);

    if (!charType || !characterData[charType]) {
        if (charInfo) charInfo.style.display = 'none';
        if (charVisual) {
            charVisual.innerHTML = `
                <div class="text-center text-white/30">
                    <span class="material-symbols-outlined text-6xl mb-2">help_outline</span>
                    <p class="text-xs uppercase tracking-wider">Select Fighter</p>
                </div>`;
        }
        return;
    }

    const data = characterData[charType];

    // Update visual
    if (charVisual) {
        charVisual.innerHTML = `
            <div class="flex flex-col items-center justify-center animate-fadeIn">
                <div class="w-24 h-24 rounded-2xl bg-gradient-to-br ${data.gradient} flex items-center justify-center shadow-2xl mb-4 animate-pulse">
                    <span class="material-symbols-outlined text-5xl text-white" style="font-variation-settings: 'FILL' 1;">${data.icon}</span>
                </div>
            </div>`;
    }

    // Show info panel
    if (charInfo) {
        charInfo.style.display = 'block';

        // Update name and lore
        const nameEl = document.getElementById(`${prefix}-char-name`);
        const loreEl = document.getElementById(`${prefix}-char-lore`);
        if (nameEl) nameEl.textContent = data.name;
        if (loreEl) loreEl.textContent = data.lore;

        // Update stats with animation
        setTimeout(() => {
            const powerBar = document.getElementById(`${prefix}-stat-power`);
            const speedBar = document.getElementById(`${prefix}-stat-speed`);
            const defenseBar = document.getElementById(`${prefix}-stat-defense`);
            if (powerBar) powerBar.style.width = `${data.power}%`;
            if (speedBar) speedBar.style.width = `${data.speed}%`;
            if (defenseBar) defenseBar.style.width = `${data.defense}%`;
        }, 50);

        // Update abilities
        const ability1 = document.getElementById(`${prefix}-ability-1`);
        const ability2 = document.getElementById(`${prefix}-ability-2`);
        const abilitySpecial = document.getElementById(`${prefix}-ability-special`);
        if (ability1) ability1.textContent = data.ability1;
        if (ability2) ability2.textContent = data.ability2;
        if (abilitySpecial) abilitySpecial.textContent = data.special;
    }
}

function createCharacter(type, playerNum) {
    const x = playerNum === 1 ? 300 : gameState.canvas.width - 380;
    const direction = playerNum === 1 ? 1 : -1;

    switch (type) {
        case 'warrior':
            return new Warrior({ x, direction, playerNum });
        case 'ninja':
            return new Ninja({ x, direction, playerNum });
        case 'mage':
            return new Mage({ x, direction, playerNum });
        default:
            return new Character({ x, direction, playerNum });
    }
}





function startFight() {
    initGame();


    gameState.player1 = createCharacter(gameState.p1Character, 1);
    gameState.player2 = createCharacter(gameState.p2Character, 2);


    gameState.round = 1;
    gameState.p1Wins = 0;
    gameState.p2Wins = 0;


    updateHUD();


    showScreen('game-screen');


    startRound();
}

function startRound() {

    gameState.player1.reset(300, 1);
    gameState.player2.reset(gameState.canvas.width - 380, -1);


    combatSystem.reset();


    gameState.timer = 99;


    document.getElementById('round-indicator').textContent = `ROUND ${gameState.round}`;


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


    const deltaTime = currentTime - gameState.lastFrameTime;
    gameState.lastFrameTime = currentTime;


    update();


    draw();


    checkRoundEnd();
}

function update() {

    let p1Input;
    let p2Input;

    if (gameState.isOnline) {

        if (gameState.isHost) {

            p1Input = mobileControls.shouldUseMobileControls() ?
                mobileControls.getInput() : inputHandler.getPlayerInput(1);
            p2Input = gameState.opponentInput || {};


            if (p1Input && JSON.stringify(p1Input) !== JSON.stringify(gameState.lastSentInput)) {
                multiplayer.sendInput(p1Input);
                gameState.lastSentInput = { ...p1Input };
            }
        } else {

            p1Input = gameState.opponentInput || {};
            p2Input = mobileControls.shouldUseMobileControls() ?
                mobileControls.getInput() : inputHandler.getPlayerInput(1);


            if (p2Input && JSON.stringify(p2Input) !== JSON.stringify(gameState.lastSentInput)) {
                multiplayer.sendInput(p2Input);
                gameState.lastSentInput = { ...p2Input };
            }
        }
    } else if (gameState.gameMode === 'training') {

        p1Input = mobileControls.shouldUseMobileControls() ?
            mobileControls.getInput() : inputHandler.getPlayerInput(1);
        p2Input = {};
    } else {

        if (mobileControls.shouldUseMobileControls()) {

            p1Input = mobileControls.getInput();
            p2Input = {};
        } else {
            p1Input = inputHandler.getPlayerInput(1);
            p2Input = inputHandler.getPlayerInput(2);
        }
    }


    gameState.player1.update(p1Input, gameState.player2);
    gameState.player2.update(p2Input, gameState.player1);


    combatSystem.update(gameState.player1, gameState.player2);


    updateHUD();


    // Throttle sync to reduce network traffic
    const now = Date.now();
    if (gameState.isOnline) {
        // If a hit occurred, force sync immediately to update knockback positions
        const shouldSyncHost = (now - gameState.lastSyncTime >= gameState.syncInterval) || gameState.forceSync;
        const shouldSyncGuest = (now - (gameState.lastGuestSyncTime || 0) >= gameState.syncInterval) || gameState.forceSync;

        if (gameState.isHost && shouldSyncHost) {
            syncGameState();
            gameState.lastSyncTime = now;
        } else if (!gameState.isHost && shouldSyncGuest) {
            // Guest sends their own position (Client Authority)
            // Plus P1 position if Guest hit Host (Authority Switching)
            multiplayer.sendPosition({
                x: gameState.player2.x,
                y: gameState.player2.y,
                p1: gameState.guestHitHost ? {
                    x: gameState.player1.x,
                    y: gameState.player1.y
                } : null,
                forceP1: gameState.guestHitHost
            });
            gameState.lastGuestSyncTime = now;
            gameState.guestHitHost = false; // Reset flag
        }

        // Reset force flag after syncing
        if (gameState.forceSync) gameState.forceSync = false;
    }
}

function syncGameState() {
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
        timer: gameState.timer,
        forceP2: gameState.hostHitGuest // Host overrides Guest pos if hit
    });
    gameState.hostHitGuest = false; // Reset flag
}

function draw() {
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;


    ctx.clearRect(0, 0, canvas.width, canvas.height);


    drawArena(ctx);


    gameState.player1.draw(ctx);
    gameState.player2.draw(ctx);


    combatSystem.draw(ctx);



}

function drawArena(ctx) {
    const arena = arenas[gameState.selectedArena];
    const canvas = gameState.canvas;


    const bgImage = getImage('bg_' + gameState.selectedArena);

    if (bgImage) {


        const scale = Math.max(canvas.width / bgImage.width, canvas.height / bgImage.height);
        const x = (canvas.width / 2) - (bgImage.width / 2) * scale;
        const y = (canvas.height / 2) - (bgImage.height / 2) * scale;

        ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);


        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {

        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, arena.bgColor);
        bgGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }


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







}

function drawDojoEffects(ctx, arena) {
    const canvas = gameState.canvas;


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


    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 1);
    }


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

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(gameState.player1.x, gameState.player1.y, gameState.player1.width, gameState.player1.height);
    ctx.strokeRect(gameState.player2.x, gameState.player2.y, gameState.player2.width, gameState.player2.height);


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





function updateHUD() {
    const p1 = gameState.player1;
    const p2 = gameState.player2;

    if (!p1 || !p2) return;


    const p1HealthPercent = (p1.health / p1.maxHealth) * 100;
    const p2HealthPercent = (p2.health / p2.maxHealth) * 100;

    document.getElementById('p1-health').style.width = p1HealthPercent + '%';
    document.getElementById('p2-health').style.width = p2HealthPercent + '%';


    setTimeout(() => {
        document.getElementById('p1-damage').style.width = p1HealthPercent + '%';
        document.getElementById('p2-damage').style.width = p2HealthPercent + '%';
    }, 300);


    document.getElementById('p1-energy').style.width = p1.energy + '%';
    document.getElementById('p2-energy').style.width = p2.energy + '%';


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


    const p1Portrait = document.getElementById('p1-portrait');
    const p2Portrait = document.getElementById('p2-portrait');

    p1Portrait.className = 'player-portrait ' + gameState.p1Character + '-portrait';
    p2Portrait.className = 'player-portrait ' + gameState.p2Character + '-portrait';


    document.getElementById('p1-name').textContent = p1.name;
    document.getElementById('p2-name').textContent = p2.name;
}





function startTimer() {
    stopTimer();
    gameState.timerInterval = setInterval(() => {
        if (gameState.isPaused) return;

        gameState.timer--;
        document.getElementById('game-timer').textContent = gameState.timer;


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


    let roundWinner = null;
    if (p1.health <= 0) {
        roundWinner = 2;
        gameState.p2Wins++;
    } else if (p2.health <= 0) {
        roundWinner = 1;
        gameState.p1Wins++;
    } else {

        if (p1.health > p2.health) {
            roundWinner = 1;
            gameState.p1Wins++;
        } else if (p2.health > p1.health) {
            roundWinner = 2;
            gameState.p2Wins++;
        } else {

            gameState.p1Wins++;
            gameState.p2Wins++;
        }
    }


    const winsNeeded = Math.ceil(gameState.maxRounds / 2);

    if (gameState.p1Wins >= winsNeeded) {
        endMatch(1);
    } else if (gameState.p2Wins >= winsNeeded) {
        endMatch(2);
    } else {

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

    // Track for daily challenges
    if (typeof trackChallengeProgress === 'function') {
        trackChallengeProgress('fight-arena', 'matches', 1);
        // Player 1 wins count as a win for the user
        if (winner === 1) {
            trackChallengeProgress('fight-arena', 'wins', 1);
        }
    }

    setTimeout(() => {
        hideAnnouncer();
        showResultScreen(winner);
    }, 2000);
}





function showResultScreen(winner) {
    const resultTitle = document.getElementById('result-title');
    resultTitle.textContent = `OYUNCU ${winner} KAZANDI!`;
    resultTitle.style.color = winner === 1 ? '#00f0ff' : '#ff006e';


    document.getElementById('result-p1-stats').textContent = `${gameState.p1Wins} Round`;
    document.getElementById('result-p2-stats').textContent = `${gameState.p2Wins} Round`;

    showScreen('result-screen');
}

function rematch() {
    startFight();
}





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





function showAnnouncer(text, color = '#ffffff') {
    const announcer = document.getElementById('announcer');
    announcer.textContent = text;
    announcer.style.color = color;
    announcer.classList.add('show');
}

function hideAnnouncer() {
    document.getElementById('announcer').classList.remove('show');
}

function showRoomClosedPopup(reason) {
    // Remove existing popup if any
    const existing = document.getElementById('room-closed-popup');
    if (existing) existing.remove();

    // Create popup
    const popup = document.createElement('div');
    popup.id = 'room-closed-popup';
    popup.innerHTML = `
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fadeIn">
            <div class="bg-gradient-to-b from-surface-dark to-background-dark border-2 border-red-500/50 rounded-2xl p-8 max-w-md mx-4 text-center shadow-[0_0_50px_rgba(255,0,0,0.3)]">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                    <span class="material-symbols-outlined text-4xl text-red-500">door_open</span>
                </div>
                <h2 class="text-2xl font-black text-white uppercase mb-2">Room Closed</h2>
                <p class="text-white/70 mb-6">${reason || 'The room has been closed.'}</p>
                <button onclick="closeRoomClosedPopup()" class="px-8 py-3 bg-gradient-to-r from-primary to-green-400 text-black font-bold uppercase rounded-xl hover:shadow-neon transition-all">
                    Back to Menu
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

function closeRoomClosedPopup() {
    const popup = document.getElementById('room-closed-popup');
    if (popup) popup.remove();
    goToMenu();
}





function createRoom() {
    document.getElementById('connection-status').textContent = 'Sunucuya bağlanılıyor...';
    document.getElementById('connection-status').className = 'connection-status connecting';


    setupMultiplayerCallbacks();


    multiplayer.createRoom();
}



function setupMultiplayerCallbacks() {

    multiplayer.onConnectionChange = (connected) => {
        if (!connected && gameState.isOnline) {
            document.getElementById('connection-status').textContent = 'Bağlantı kesildi!';
            document.getElementById('connection-status').className = 'connection-status error';
        }
    };


    multiplayer.onRoomCreated = (code) => {
        document.getElementById('available-rooms-container').classList.add('hidden');
        const roomCodeEl = document.getElementById('room-code-display');
        roomCodeEl.classList.remove('hidden');

        document.getElementById('current-room-code').textContent = code;
        document.getElementById('connection-status').textContent = 'Oda oluşturuldu! Rakip bekleniyor...';
        document.getElementById('connection-status').className = 'text-center text-sm text-primary';
        gameState.isHost = true;
    };


    multiplayer.onJoinedRoom = (data) => {
        document.getElementById('connection-status').textContent = 'Odaya katıldınız!';
        document.getElementById('connection-status').className = 'connection-status connected';
        gameState.isHost = false;
    };


    multiplayer.onJoinError = (message) => {
        document.getElementById('connection-status').textContent = message;
        document.getElementById('connection-status').className = 'connection-status error';
    };


    multiplayer.onGuestJoined = (data) => {
        document.getElementById('connection-status').textContent = 'Rakip bulundu! Karakter seçimine geçiliyor...';
        document.getElementById('connection-status').className = 'connection-status connected';
    };


    multiplayer.onGoToCharacterSelect = () => {
        gameState.gameMode = 'online';
        gameState.isOnline = true;


        gameState.p1Character = null;
        gameState.p2Character = null;


        showOnlineCharacterSelect();
    };


    multiplayer.onOpponentSelectedCharacter = (character) => {
        if (gameState.isHost) {
            gameState.p2Character = character;
        } else {
            gameState.p1Character = character;
        }
        updateOnlineCharacterSelection();
    };


    multiplayer.onArenaSelected = (arena) => {
        gameState.selectedArena = arena;
        document.querySelectorAll('.arena-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.arena === arena);
        });
    };


    multiplayer.onOpponentReady = () => {
        document.getElementById('connection-status').textContent = 'Rakip hazır!';
    };


    multiplayer.onStartGame = (data) => {
        gameState.p1Character = data.hostCharacter;
        gameState.p2Character = data.guestCharacter;
        gameState.selectedArena = data.arena;
        startOnlineFight();
    };


    multiplayer.onOpponentInput = (input) => {
        gameState.opponentInput = input;
    };

    multiplayer.onOpponentPosition = (pos) => {
        // If we are Host, we receive P2's position from Guest (Client Authority)
        if (gameState.isHost && gameState.player2) {
            gameState.player2.x = pos.x;
            gameState.player2.y = pos.y;

            // Authority Switching: If Guest hit us (Host/P1), we accept their position for P1
            if (pos.forceP1 && pos.p1 && gameState.player1) {
                gameState.player1.x = pos.p1.x;
                gameState.player1.y = pos.p1.y;
            }
        }
    };


    multiplayer.onGameStateUpdate = (state) => {
        if (!gameState.isHost && gameState.player1 && gameState.player2) {

            // Update opponent (Host/P1) completely
            gameState.player1.x = state.p1.x;
            gameState.player1.y = state.p1.y;
            gameState.player1.health = state.p1.health;
            gameState.player1.energy = state.p1.energy;

            // Update self (Guest/P2) ONLY stats, NOT position usually
            // but if Host hit us (forceP2), we accept their position (Authority Switching)
            if (state.forceP2) {
                gameState.player2.x = state.p2.x;
                gameState.player2.y = state.p2.y;
            }
            // gameState.player2.x = state.p2.x; // DON'T OVERWRITE LOCAL POS NORMALLY
            // gameState.player2.y = state.p2.y; // DON'T OVERWRITE LOCAL POS NORMALLY
            gameState.player2.health = state.p2.health;
            gameState.player2.energy = state.p2.energy;
        }
    };


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


    multiplayer.onRoomClosed = (reason) => {
        document.getElementById('available-rooms-container').classList.remove('hidden');
        document.getElementById('room-code-display').classList.add('hidden');
        showRoomClosedPopup(reason);
        stopGame();
        gameState.isOnline = false;
    };


    multiplayer.onRematchRequested = () => {
        document.getElementById('connection-status').textContent = 'Rakip rövanş istiyor!';
    };

    multiplayer.onStartRematch = () => {
        startOnlineFight();
    };


    multiplayer.onRoomListUpdate = (rooms) => {
        renderRoomList(rooms);
    };
}

function renderRoomList(rooms) {
    const listContainer = document.getElementById('room-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (rooms.length === 0) {
        listContainer.innerHTML = `
            <div class="bg-surface-dark/50 border border-white/10 p-4 rounded-xl text-center text-white/40 text-sm">
                No rooms found. Create one!
            </div>`;
        return;
    }

    rooms.forEach(room => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-surface-dark border border-white/10 p-3 rounded-xl hover:border-primary/50 transition-colors group';
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-mono font-bold">
                    ${room.playerCount}/2
                </div>
                <div class="flex flex-col">
                    <span class="text-white font-bold tracking-wider text-sm">ROOM ${room.code}</span>
                    <span class="text-[10px] text-white/40 uppercase tracking-widest">Waiting for opponent</span>
                </div>
            </div>
            <button onclick="joinRoomByCode('${room.code}')" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary hover:text-surface-dark text-white/60 text-xs font-bold uppercase tracking-wider transition-all">
                JOIN
            </button>
        `;
        listContainer.appendChild(item);
    });
}

function joinRoomByCode(code) {
    if (!code) return;

    document.getElementById('connection-status').textContent = 'Odaya katılınıyor...';
    document.getElementById('connection-status').className = 'connection-status connecting';

    setupMultiplayerCallbacks();
    multiplayer.joinRoom(code);
}

function leaveRoom() {
    multiplayer.leaveRoom();
    document.getElementById('available-rooms-container').classList.remove('hidden');
    document.getElementById('room-code-display').classList.add('hidden');
    document.getElementById('connection-status').textContent = '';
}

function refreshRoomList() {
    const listContainer = document.getElementById('room-list');
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="bg-surface-dark/50 border border-white/10 p-4 rounded-xl text-center text-white/40 text-sm animate-pulse">
                Scanning...
            </div>`;
    }
    multiplayer.requestRoomList();
}

function showOnlineCharacterSelect() {
    showScreen('character-select');

    // Wait for screen transition and ensure DOM is ready
    setTimeout(() => {
        try {
            // Use h3 selector as .player-label class was missing
            const p1Label = document.querySelector('#p1-select h3');
            const p2Label = document.querySelector('#p2-select h3');
            const p1Select = document.getElementById('p1-select');
            const p2Select = document.getElementById('p2-select');

            console.log('[UI] Setup Character Select:', {
                isHost: gameState.isHost,
                p1LabelFound: !!p1Label,
                p2LabelFound: !!p2Label
            });

            if (!p1Label || !p2Label) {
                console.warn('[UI WARNING] Player labels not found, UI might look static.');
            }

            if (gameState.isHost) {
                if (p1Label) p1Label.innerHTML = 'SEN <span class="key-hint">(Karakter Seç)</span>';
                if (p2Label) p2Label.innerHTML = 'RAKİP <span class="key-hint">(Bekleniyor...)</span>';

                if (p2Select) {
                    p2Select.style.opacity = '0.5';
                    p2Select.style.pointerEvents = 'none';
                }
            } else {
                if (p1Label) p1Label.innerHTML = 'RAKİP <span class="key-hint">(Bekleniyor...)</span>';
                if (p2Label) p2Label.innerHTML = 'SEN <span class="key-hint">(Karakter Seç)</span>';

                if (p1Select) {
                    p1Select.style.opacity = '0.5';
                    p1Select.style.pointerEvents = 'none';
                }
            }
        } catch (e) {
            console.error('[UI CRASH PREVENTED]', e);
        }
    }, 100);
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

    const myCards = gameState.isHost ? '#p1-cards .char-card' : '#p2-cards .char-card';
    const myChar = gameState.isHost ? gameState.p1Character : gameState.p2Character;

    document.querySelectorAll(myCards).forEach(card => {
        card.classList.toggle('selected', card.dataset.char === myChar);
    });


    const opponentCards = gameState.isHost ? '#p2-cards .char-card' : '#p1-cards .char-card';
    const opponentChar = gameState.isHost ? gameState.p2Character : gameState.p1Character;

    document.querySelectorAll(opponentCards).forEach(card => {
        card.classList.toggle('selected', card.dataset.char === opponentChar);
    });


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


    if (gameState.isHost) {
        multiplayer.selectArena(gameState.selectedArena);
    }
}

function startOnlineFight() {
    initGame();


    gameState.player1 = createCharacter(gameState.p1Character, 1);
    gameState.player2 = createCharacter(gameState.p2Character, 2);


    gameState.round = 1;
    gameState.p1Wins = 0;
    gameState.p2Wins = 0;


    updateHUD();


    if (mobileControls.shouldUseMobileControls()) {
        mobileControls.enable();
    }


    showScreen('game-screen');


    startRound();
}


const originalSelectCharacter = selectCharacter;
selectCharacter = function (playerNum, charType) {
    if (gameState.isOnline) {
        selectCharacterOnline(charType);
    } else {
        originalSelectCharacter(playerNum, charType);
    }
};


const originalStartFight = startFight;
startFight = function () {
    originalStartFight();


    if (mobileControls.shouldUseMobileControls()) {
        mobileControls.enable();
    }
};


const originalStopGame = stopGame;
stopGame = function () {
    originalStopGame();


    mobileControls.disable();
};





let prepTimer = null;
let prepCountdown = 30;
let playerReady = false;

function showBattlePrep() {
    showScreen('battle-prep');
    playerReady = false;
    prepCountdown = 30;


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


    const p1Char = gameState.isHost ? gameState.p1Character : gameState.p2Character;
    if (p1Char) {
        document.getElementById('prep-p1-char-name').textContent = charNames[p1Char] || p1Char.toUpperCase();
        document.getElementById('prep-p1-char-class').textContent = charClasses[p1Char] || 'Unknown';
    }


    const arenaNames = {
        'dojo': 'GOLGE DOJO',
        'cyber': 'CYBER ARENA',
        'volcano': 'VOLKAN TAPINAGI'
    };
    document.getElementById('prep-arena-info').textContent = 'ARENA: ' + (arenaNames[gameState.selectedArena] || 'UNKNOWN');


    startPrepTimer();


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

            if (gameState.isOnline) {

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





document.addEventListener('DOMContentLoaded', () => {

    loadAssets(() => {

        initGame();

        // Hook combat system hits to networking sync to prevent teleportation
        if (typeof combatSystem !== 'undefined') {
            combatSystem.onHit = (attacker, defender) => {
                if (gameState.isOnline) {
                    gameState.forceSync = true;

                    // Identify who attacked whom to enforce position (Authority Switching)
                    if (gameState.isHost && attacker === gameState.player1) {
                        gameState.hostHitGuest = true;
                    } else if (!gameState.isHost && attacker === gameState.player2) {
                        gameState.guestHitHost = true;
                    }
                }
            };
        }


        if (mobileControls.isMobile) {

            const localBtn = document.querySelector('.menu-btn');
            if (localBtn) {
                localBtn.querySelector('.btn-desc').textContent = 'Dokunmatik Kontroller';
            }
        }


        startPingMeasurement();
    });
});





let pingInterval = null;
let currentPing = 0;

function startPingMeasurement() {

    measurePing();


    pingInterval = setInterval(measurePing, 1000);
}

function measurePing() {
    const startTime = performance.now();


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

    const pingDisplays = document.querySelectorAll('#ping-display, .ping-display');
    const pingIndicators = document.querySelectorAll('#ping-indicator, .ping-indicator');

    pingDisplays.forEach(display => {
        display.textContent = `Ping: ${ping}ms`;
    });


    let indicatorColor = 'bg-green-500';
    let indicatorClass = 'animate-pulse';

    if (ping > 150) {
        indicatorColor = 'bg-red-500';
    } else if (ping > 80) {
        indicatorColor = 'bg-yellow-500';
    }

    pingIndicators.forEach(indicator => {

        indicator.className = indicator.className
            .replace(/bg-green-500|bg-yellow-500|bg-red-500/g, '')
            .trim();

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


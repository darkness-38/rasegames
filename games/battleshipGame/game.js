/**
 * Battleship Online - Game Logic
 * Real-time multiplayer naval warfare game
 */

class BattleshipGame {
    constructor() {
        // Socket connection
        this.socket = null;
        this.roomCode = null;
        this.isHost = false;
        this.playerId = null;
        this.mode = 'online'; // 'online' or 'cpu'

        // Game state
        this.currentScreen = 'lobby';
        this.gamePhase = 'lobby'; // lobby, placement, battle, gameover
        this.isMyTurn = false;
        this.opponentReady = false;

        // Ship configuration
        this.ships = [
            { id: 'carrier', name: 'Carrier', size: 5, placed: false, cells: [] },
            { id: 'battleship', name: 'Battleship', size: 4, placed: false, cells: [] },
            { id: 'cruiser', name: 'Cruiser', size: 3, placed: false, cells: [] },
            { id: 'submarine', name: 'Submarine', size: 3, placed: false, cells: [] },
            { id: 'destroyer', name: 'Destroyer', size: 2, placed: false, cells: [] }
        ];

        // Grid state (10x10)
        this.myGrid = this.createEmptyGrid();
        this.opponentGrid = this.createEmptyGrid();
        this.selectedShip = null;
        this.shipOrientation = 'horizontal'; // horizontal or vertical

        // Battle stats
        this.shotsFired = 0;
        this.hitsLanded = 0;
        this.myShipsRemaining = 5;
        this.enemyShipsRemaining = 5;
        this.mySunkShips = [];
        this.enemySunkShips = [];



        // Chat
        this.isChatOpen = false;

        this.cpu = {
            targetMode: null, // null, 'assist'
            lastHit: null, // [row, col]
            potentialTargets: [] // Array of [row, col]
        };

        this.init();
    }

    createEmptyGrid() {
        return Array(10).fill(null).map(() => Array(10).fill({ type: 'empty', shipId: null }));
    }

    // Translation helper
    t(key) {
        if (window.i18n && window.i18n.t) {
            return window.i18n.t(key);
        }
        return null;
    }

    init() {
        // Only connect socket if we intend to play online, but for now we connect on load
        // We might want to delay this until "Multiplayer" is clicked in a future refactor
        this.connectSocket();

        this.setupEventListeners();
        this.setupChat();
        this.renderPlacementGrid();
        this.renderShipsToPlace();
        this.showScreen('lobby');
    }

    connectSocket() {
        // Connect to Socket.io server
        const serverUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : window.location.origin;

        this.socket = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
            this.playerId = this.socket.id;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.showError('Connection lost. Please refresh the page.');
        });

        // Battleship events
        this.socket.on('battleship:roomCreated', (data) => {
            this.roomCode = data.code;
            this.isHost = true;
            document.getElementById('display-room-code').textContent = data.code;
            this.showScreen('waiting');
        });

        this.socket.on('battleship:joinError', (data) => {
            this.showError(data.message);
        });



        this.socket.on('battleship:chatMessage', (data) => {
            this.addChatMessage('Opponent', data.message, 'enemy');
            if (!this.isChatOpen) {
                const btn = document.getElementById('chat-toggle-btn');
                if (btn) {
                    btn.classList.add('animate-pulse');
                    setTimeout(() => btn.classList.remove('animate-pulse'), 2000);
                }
            }
        });

        this.socket.on('battleship:gameStart', (data) => {
            this.isMyTurn = data.firstTurn === this.playerId;
            this.showScreen('placement');
            this.gamePhase = 'placement';
        });

        this.socket.on('battleship:opponentReady', () => {
            this.opponentReady = true;
            this.updateOpponentStatus(true);
            this.checkBothReady();
        });

        this.socket.on('battleship:battleStart', (data) => {
            this.gamePhase = 'battle';
            this.isMyTurn = data.firstTurn === this.playerId;
            this.showScreen('battle');

            // Update room code in battle header
            const roomCodeEl = document.getElementById('battle-room-code');
            if (roomCodeEl && this.roomCode) {
                roomCodeEl.textContent = this.roomCode;
            }

            this.renderBattleGrids();
            this.updateTurnIndicator();
        });

        this.socket.on('battleship:attackResult', (data) => {
            this.handleAttackResult(data);
        });

        this.socket.on('battleship:opponentAttack', (data) => {
            this.handleOpponentAttack(data);
        });

        this.socket.on('battleship:gameOver', (data) => {
            this.handleGameOver(data);
        });

        this.socket.on('battleship:opponentLeft', () => {
            this.showError('Opponent left the game.');
            setTimeout(() => this.showScreen('lobby'), 2000);
        });

        this.socket.on('battleship:roomList', (rooms) => {
            this.renderRoomList(rooms);
        });

        this.socket.on('battleship:rematchAccepted', () => {
            this.resetGame();
            this.showScreen('placement');
        });

        // Request room list
        this.socket.emit('battleship:getRooms');
    }

    setupEventListeners() {
        // Lobby buttons
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.socket.emit('battleship:createRoom');
        });

        // CPU Button
        const cpuBtn = document.getElementById('play-cpu-btn');
        if (cpuBtn) {
            cpuBtn.addEventListener('click', () => {
                this.startCpuGame();
            });
        }

        document.getElementById('join-room-btn').addEventListener('click', () => {
            const code = document.getElementById('room-code-input').value.toUpperCase().trim();
            if (code.length === 6) {
                this.socket.emit('battleship:joinRoom', code);
                this.roomCode = code;
            } else {
                this.showError('Please enter a valid 6-character room code.');
            }
        });

        document.getElementById('room-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('join-room-btn').click();
            }
        });

        document.getElementById('cancel-waiting-btn').addEventListener('click', () => {
            this.socket.emit('battleship:leaveRoom');
            this.showScreen('lobby');
        });

        // Placement buttons
        document.getElementById('random-placement-btn').addEventListener('click', () => {
            this.randomizePlacement();
        });

        document.getElementById('ready-btn').addEventListener('click', () => {
            if (this.ships.every(s => s.placed)) {
                if (this.mode === 'cpu') {
                    this.startCpuBattle();
                } else {
                    this.socket.emit('battleship:ready', { grid: this.myGrid, ships: this.ships });
                    document.getElementById('ready-btn').disabled = true;
                    const waitingText = this.t('battleship.waitingForOpponent') || 'Waiting...';
                    document.getElementById('ready-btn').innerHTML = `<span class="material-symbols-outlined animate-spin">sync</span> ${waitingText}`;
                }
            }
        });

        // Keyboard for rotation
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r' && this.gamePhase === 'placement') {
                this.shipOrientation = this.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
                this.updateShipPreview();
            }
        });

        // Game over buttons
        document.getElementById('rematch-btn').addEventListener('click', () => {
            this.socket.emit('battleship:requestRematch');
        });

        document.getElementById('exit-btn').addEventListener('click', () => {
            if (this.mode === 'online' && this.socket) {
                this.socket.emit('battleship:leaveRoom');
            }
            this.resetGame();
            this.resetGame();
            this.showScreen('lobby');
        });

        const surrenderBtn = document.getElementById('surrender-btn');
        if (surrenderBtn) {
            surrenderBtn.addEventListener('click', () => {
                if (confirm(this.t('battleship.surrenderConfirm') || 'Are you sure you want to surrender?')) {
                    if (this.mode === 'online') {
                        this.socket.emit('battleship:surrender');
                    } else {
                        // Immediate loss in CPU mode
                        this.handleGameOver({ winner: 'cpu', stats: {} });
                    }
                }
            });
        }
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.currentScreen = screenName;
    }

    showError(message) {
        const errorEl = document.getElementById('lobby-error');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 5000);
    }

    // Ship Placement
    renderShipsToPlace() {
        const container = document.getElementById('ships-to-place');
        container.innerHTML = '';

        this.ships.forEach(ship => {
            const shipEl = document.createElement('div');
            shipEl.className = `ship-item ${ship.placed ? 'placed' : ''} ${this.selectedShip?.id === ship.id ? 'selected' : ''}`;
            shipEl.dataset.shipId = ship.id;

            const visual = document.createElement('div');
            visual.className = 'ship-visual';
            for (let i = 0; i < ship.size; i++) {
                const cell = document.createElement('div');
                cell.className = 'ship-visual-cell';
                visual.appendChild(cell);
            }

            const info = document.createElement('div');
            info.className = 'flex-1';
            info.innerHTML = `
                <p class="ship-name font-medium">${this.getShipDisplayName(ship.id)}</p>
                <p class="text-xs text-gray-500">${ship.size} cells</p>
            `;

            const status = document.createElement('span');
            status.className = 'material-symbols-outlined text-lg';
            status.textContent = ship.placed ? 'check_circle' : 'radio_button_unchecked';
            status.style.color = ship.placed ? '#22c55e' : '#6b7280';

            shipEl.appendChild(visual);
            shipEl.appendChild(info);
            shipEl.appendChild(status);

            if (!ship.placed) {
                shipEl.addEventListener('click', () => this.selectShip(ship));
            }

            container.appendChild(shipEl);
        });
    }

    getShipDisplayName(shipId) {
        // Use i18n if available, otherwise fallback to English
        if (window.i18n && window.i18n.t) {
            return window.i18n.t(`battleship.ships.${shipId}`) || shipId;
        }
        const names = {
            carrier: 'Carrier',
            battleship: 'Battleship',
            cruiser: 'Cruiser',
            submarine: 'Submarine',
            destroyer: 'Destroyer'
        };
        return names[shipId] || shipId;
    }

    selectShip(ship) {
        this.selectedShip = ship;
        this.renderShipsToPlace();
    }

    renderPlacementGrid() {
        const grid = document.getElementById('placement-grid');
        grid.innerHTML = '';

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Show placed ships
                if (this.myGrid[row][col].type === 'ship') {
                    cell.classList.add('ship');
                }

                cell.addEventListener('click', () => this.handlePlacementClick(row, col));
                cell.addEventListener('mouseenter', () => this.showShipPreview(row, col));
                cell.addEventListener('mouseleave', () => this.clearShipPreview());

                grid.appendChild(cell);
            }
        }
    }

    showShipPreview(row, col) {
        if (!this.selectedShip || this.selectedShip.placed) return;

        this.clearShipPreview();

        const cells = this.getShipCells(row, col, this.selectedShip.size, this.shipOrientation);
        const isValid = this.isValidPlacement(cells);

        cells.forEach(([r, c]) => {
            if (r >= 0 && r < 10 && c >= 0 && c < 10) {
                const cellEl = document.querySelector(`#placement-grid [data-row="${r}"][data-col="${c}"]`);
                if (cellEl) {
                    cellEl.classList.add('ship-preview');
                    if (!isValid) cellEl.classList.add('invalid');
                }
            }
        });
    }

    clearShipPreview() {
        document.querySelectorAll('.ship-preview').forEach(cell => {
            cell.classList.remove('ship-preview', 'invalid');
        });
    }

    updateShipPreview() {
        // Re-trigger preview with current mouse position
        const hovered = document.querySelector('#placement-grid .grid-cell:hover');
        if (hovered) {
            const row = parseInt(hovered.dataset.row);
            const col = parseInt(hovered.dataset.col);
            this.showShipPreview(row, col);
        }
    }

    getShipCells(startRow, startCol, size, orientation) {
        const cells = [];
        for (let i = 0; i < size; i++) {
            if (orientation === 'horizontal') {
                cells.push([startRow, startCol + i]);
            } else {
                cells.push([startRow + i, startCol]);
            }
        }
        return cells;
    }

    isValidPlacement(cells) {
        for (const [row, col] of cells) {
            // Out of bounds
            if (row < 0 || row >= 10 || col < 0 || col >= 10) return false;
            // Already occupied
            if (this.myGrid[row][col].type === 'ship') return false;
        }
        return true;
    }

    handlePlacementClick(row, col) {
        if (!this.selectedShip || this.selectedShip.placed) return;

        const cells = this.getShipCells(row, col, this.selectedShip.size, this.shipOrientation);

        if (!this.isValidPlacement(cells)) return;

        // Place the ship
        cells.forEach(([r, c]) => {
            this.myGrid[r][c] = { type: 'ship', shipId: this.selectedShip.id };
        });

        this.selectedShip.placed = true;
        this.selectedShip.cells = cells;
        this.selectedShip = null;

        this.renderPlacementGrid();
        this.renderShipsToPlace();
        this.updateReadyButton();
    }

    updateReadyButton() {
        const allPlaced = this.ships.every(s => s.placed);
        document.getElementById('ready-btn').disabled = !allPlaced;
    }

    randomizePlacement() {
        // Reset grid and ships
        this.myGrid = this.createEmptyGrid();
        this.ships.forEach(ship => {
            ship.placed = false;
            ship.cells = [];
        });

        // Place each ship randomly
        for (const ship of this.ships) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                const cells = this.getShipCells(row, col, ship.size, orientation);

                if (this.isValidPlacement(cells)) {
                    cells.forEach(([r, c]) => {
                        this.myGrid[r][c] = { type: 'ship', shipId: ship.id };
                    });
                    ship.placed = true;
                    ship.cells = cells;
                    placed = true;
                }
                attempts++;
            }
        }

        this.selectedShip = null;
        this.renderPlacementGrid();
        this.renderShipsToPlace();
        this.updateReadyButton();
    }

    updateOpponentStatus(ready) {
        const statusEl = document.getElementById('opponent-status');
        if (ready) {
            const readyText = this.t('battleship.ready') || 'Ready!';
            statusEl.innerHTML = `
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>${readyText}</span>
                </div>
            `;
        }
    }

    checkBothReady() {
        // Server handles this, but we can show feedback
    }

    /* --- CPU MODE LOGIC --- */

    startCpuGame() {
        this.mode = 'cpu';
        this.roomCode = null;
        this.isHost = true;
        this.playerId = 'player';

        // Reset Game State
        this.resetGame();

        // UI Updates
        document.getElementById('online-indicator').classList.remove('bg-green-500', 'animate-pulse');
        document.getElementById('online-indicator').classList.add('bg-purple-500');
        document.getElementById('online-text').textContent = 'VS CPU';
        document.getElementById('battle-room-code').textContent = 'LOCAL';

        this.showScreen('placement');
        this.gamePhase = 'placement';

        // Generate CPU Ships immediately (hidden)
        this.placeCpuShips();
    }

    placeCpuShips() {
        // Create duplicate ship array for CPU
        const cpuShips = JSON.parse(JSON.stringify(this.ships));
        // Reset their placement
        cpuShips.forEach(s => { s.placed = false; s.cells = []; });

        this.opponentGrid = this.createEmptyGrid();

        // Reuse randomize logic but for opponentGrid
        for (const ship of cpuShips) {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';

                // Get cells
                const cells = [];
                for (let i = 0; i < ship.size; i++) {
                    if (orientation === 'horizontal') cells.push([row, col + i]);
                    else cells.push([row + i, col]);
                }

                // Check valid
                const valid = cells.every(([r, c]) =>
                    r >= 0 && r < 10 && c >= 0 && c < 10 &&
                    this.opponentGrid[r][c].type === 'empty'
                );

                if (valid) {
                    cells.forEach(([r, c]) => {
                        this.opponentGrid[r][c] = { type: 'hidden-ship', shipId: ship.id };
                    });
                    placed = true;
                }
                attempts++;
            }
        }
    }

    startCpuBattle() {
        this.gamePhase = 'battle';
        this.isMyTurn = true; // Player always starts? Or random? Let's say Player starts for easier UX
        this.showScreen('battle');
        this.renderBattleGrids();
        this.updateTurnIndicator();
        this.addBattleLog('info', 'Battle started against Computer!');
    }

    cpuTurn() {
        if (this.gamePhase !== 'battle') return;

        // Simulate thinking time
        setTimeout(() => {
            if (this.gamePhase !== 'battle') return;

            let row, col;

            // AI Logic:
            // 1. If we have potential targets (from a previous hit), try them
            if (this.cpu.potentialTargets.length > 0) {
                const target = this.cpu.potentialTargets.pop();
                row = target[0];
                col = target[1];
            } else {
                // 2. Random mode
                let valid = false;
                while (!valid) {
                    row = Math.floor(Math.random() * 10);
                    col = Math.floor(Math.random() * 10);
                    // Don't shoot where we already shot
                    if (!this.myGrid[row][col].hit && !this.myGrid[row][col].miss) {
                        valid = true;
                    }
                }
            }

            // Execute Attack
            this.processCpuAttack(row, col);

        }, 1000 + Math.random() * 1000);
    }

    processCpuAttack(row, col) {
        const cell = this.myGrid[row][col];
        let result = 'miss';
        let shipId = null;
        let sunk = false;

        // Check Hit
        if (cell.type === 'ship') {
            result = 'hit';
            shipId = cell.shipId;
            cell.hit = true;

            // Check Sunk
            const ship = this.ships.find(s => s.id === shipId);
            const hits = ship.cells.filter(([r, c]) => this.myGrid[r][c].hit).length;
            if (hits === ship.size) {
                sunk = true;
                // Mark sunk in grid
                ship.cells.forEach(([r, c]) => this.myGrid[r][c].sunk = true);
            }

            // AI Intelligence: Add neighbors to potential targets
            if (!sunk) {
                const neighbors = [
                    [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]
                ];
                neighbors.forEach(([r, c]) => {
                    if (r >= 0 && r < 10 && c >= 0 && c < 10 && !this.myGrid[r][c].hit && !this.myGrid[r][c].miss) {
                        // Prioritize specific directions if we have multiple hits? For now just stack em
                        this.cpu.potentialTargets.push([r, c]);
                    }
                });
            } else {
                // Ship sunk, maybe clear targets related to this ship if we could track them, 
                // but simple mode: just keep popping stack
            }

        } else {
            // Miss
            this.myGrid[row][col].miss = true;
        }

        // Update UI
        this.renderDefenseGrid();

        // Log & Turn Switch
        if (result === 'hit') {
            const shipName = this.getShipDisplayName(shipId);
            this.addBattleLog('hit', `Computer hit your ${shipName}!`);
            if (sunk) {
                this.addBattleLog('sunk', `Computer sunk your ${shipName}!`);
                this.myShipsRemaining--;
                this.mySunkShips.push(shipId);
                this.renderFleetStatus();

                if (this.myShipsRemaining === 0) {
                    this.handleGameOver({ winner: 'cpu', stats: {} });
                    return;
                }
            }
            // CPU gets another turn on hit? Standard rules say NO usually, alternating turns.
            // We will stick to alternating turns for simplicity and fairness
            this.isMyTurn = true;
        } else {
            this.addBattleLog('miss', `Computer missed at ${String.fromCharCode(65 + col)}${row + 1}`);
            this.isMyTurn = true;
        }

        this.updateTurnIndicator();
    }

    processPlayerAttackLocal(row, col) {
        const cell = this.opponentGrid[row][col];
        let result = 'miss';
        let shipId = null;
        let sunk = false;

        if (cell.type === 'hidden-ship' || cell.type === 'ship') {
            result = 'hit';
            shipId = cell.shipId;
            cell.type = 'hit'; // Reveal

            // Check sunk logic for hidden ships... 
            // We need to track damage on specific hidden ships. 
            // Simplest way: Check all cells of that ID in opponentGrid
            let hitCount = 0;
            let size = 0;
            // Scan grid to find ship size and hits (inefficient but 10x10 is tiny)
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    if (this.opponentGrid[r][c].shipId === shipId) {
                        size++;
                        if (this.opponentGrid[r][c].type === 'hit') hitCount++;
                    }
                }
            }

            if (hitCount === size) {
                sunk = true;
                // Mark sunk
                for (let r = 0; r < 10; r++) {
                    for (let c = 0; c < 10; c++) {
                        if (this.opponentGrid[r][c].shipId === shipId) {
                            this.opponentGrid[r][c].type = 'sunk';
                        }
                    }
                }
                this.enemyShipsRemaining--;
                this.enemySunkShips.push(shipId);
            }

        } else {
            cell.type = 'miss';
        }

        // Visuals
        this.renderAttackGrid();

        if (result === 'hit') {
            const hitText = this.t('battleship.log.hit') || 'HIT!';
            this.showAnimation('hit', hitText);
            const shipName = this.getShipDisplayName(shipId);
            this.addBattleLog('hit', `You hit Enemy ${shipName}!`);

            if (sunk) {
                const sunkText = this.t('battleship.log.sunk') || 'SUNK!';
                setTimeout(() => this.showAnimation('sunk', sunkText), 500);
                this.addBattleLog('sunk', `You sunk Enemy ${shipName}!`);
                this.renderFleetStatus();

                if (this.enemyShipsRemaining === 0) {
                    this.handleGameOver({ winner: 'player', stats: {} });
                    return;
                }
            }
        } else {
            const missText = this.t('battleship.log.miss') || 'MISS';
            this.showAnimation('miss', missText);
            this.addBattleLog('miss', `You missed.`);
        }

        this.isMyTurn = false;
        this.updateTurnIndicator();
        this.cpuTurn();
    }

    // Battle Phase
    renderBattleGrids() {
        this.renderAttackGrid();
        this.renderDefenseGrid();
        this.renderFleetStatus();
    }

    renderAttackGrid() {
        const grid = document.getElementById('attack-grid');
        grid.innerHTML = '';

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const state = this.opponentGrid[row][col];
                if (state.type === 'hit') cell.classList.add('hit');
                if (state.type === 'miss') cell.classList.add('miss');
                if (state.type === 'sunk') cell.classList.add('sunk');

                if (state.type === 'empty' && this.isMyTurn) {
                    cell.addEventListener('click', () => this.handleAttack(row, col));
                }

                grid.appendChild(cell);
            }
        }
    }

    renderDefenseGrid() {
        const grid = document.getElementById('defense-grid');
        grid.innerHTML = '';

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const state = this.myGrid[row][col];
                if (state.type === 'ship') cell.classList.add('ship');
                if (state.hit) {
                    cell.classList.remove('ship');
                    cell.classList.add(state.sunk ? 'sunk' : 'hit');
                }

                grid.appendChild(cell);
            }
        }
    }

    renderFleetStatus() {
        // Fleet Status Cards (New Command Center Style)
        const cardsContainer = document.getElementById('fleet-status-cards');
        if (cardsContainer) {
            cardsContainer.innerHTML = this.ships.map(ship => {
                const isSunk = this.mySunkShips.includes(ship.id);
                const hitsOnShip = ship.cells.filter(([r, c]) => this.myGrid[r][c].hit).length;

                let borderClass = 'border-gray-700';
                let bgClass = 'bg-surface-dark';
                let statusHtml = '';

                if (isSunk) {
                    borderClass = 'border-red-500/40';
                    bgClass = 'bg-red-500/10';
                    statusHtml = `<p class="text-red-400 text-xs font-bold uppercase">${this.t('battleship.sunk') || 'SUNK'}</p>`;
                } else {
                    // Generate health bars
                    const bars = [];
                    for (let i = 0; i < ship.size; i++) {
                        const isHit = i < hitsOnShip;
                        bars.push(`<div class="${isHit ? 'bg-red-500' : 'bg-green-500'} w-full rounded-full"></div>`);
                    }
                    statusHtml = `<div class="flex gap-1 h-2 mt-1">${bars.join('')}</div>`;
                }

                return `
                    <div class="flex flex-col gap-1 rounded-lg p-3 border ${borderClass} ${bgClass}">
                        <p class="text-gray-400 text-xs font-medium uppercase tracking-wider">${this.getShipDisplayName(ship.id)} (${ship.size})</p>
                        ${statusHtml}
                    </div>
                `;
            }).join('');
        }

        // Update enemy health bar
        const healthBar = document.getElementById('enemy-health-bar');
        if (healthBar) {
            const remainingPercent = (this.enemyShipsRemaining / 5) * 100;
            healthBar.style.width = `${remainingPercent}%`;
        }

        // Update enemy ships remaining text
        const shipsRemainingEl = document.getElementById('enemy-ships-remaining');
        if (shipsRemainingEl) {
            const shipsText = this.t('battleship.shipsRemaining') || 'Ships Remaining';
            shipsRemainingEl.innerHTML = `${this.enemyShipsRemaining} ${shipsText}`;
        }
    }

    handleAttack(row, col) {
        if (!this.isMyTurn) return;

        if (this.mode === 'online') {
            if (this.opponentGrid[row][col].type !== 'empty') return;
            this.socket.emit('battleship:attack', { row, col });
        } else {
            // Local / CPU Mode
            // Check if already shot
            const type = this.opponentGrid[row][col].type;
            if (type === 'hit' || type === 'miss' || type === 'sunk') return;

            this.processPlayerAttackLocal(row, col);
        }
        this.shotsFired++;
    }

    handleAttackResult(data) {
        const { row, col, result, shipId, sunk } = data;

        if (result === 'hit') {
            this.opponentGrid[row][col] = { type: 'hit', shipId };
            this.hitsLanded++;
            const hitText = this.t('battleship.log.hit') || 'HIT!';
            this.showAnimation('hit', hitText);

            const shipName = this.getShipDisplayName(shipId);
            const youHitMsg = (this.t('battleship.log.youHitTheir') || 'You hit their {ship}!').replace('{ship}', shipName);
            this.addBattleLog('hit', youHitMsg);

            if (sunk) {
                this.enemySunkShips.push(shipId);
                this.enemyShipsRemaining--;
                this.markShipSunk(shipId, 'attack');
                const sunkText = this.t('battleship.log.sunk') || 'SUNK!';
                setTimeout(() => this.showAnimation('sunk', sunkText), 500);
                const youSunkMsg = (this.t('battleship.log.youSunkTheir') || 'You sunk their {ship}!').replace('{ship}', shipName);
                this.addBattleLog('sunk', youSunkMsg);
            }
        } else {
            this.opponentGrid[row][col] = { type: 'miss' };
            const missText = this.t('battleship.log.miss') || 'MISS';
            this.showAnimation('miss', missText);
            const coord = `${String.fromCharCode(65 + col)}${row + 1}`;
            const missMsg = (this.t('battleship.log.shotMissedAt') || 'Shot missed at {coord}').replace('{coord}', coord);
            this.addBattleLog('miss', missMsg);
        }

        this.isMyTurn = false;
        this.renderBattleGrids();
        this.updateTurnIndicator();
    }

    handleOpponentAttack(data) {
        const { row, col, result, shipId, sunk } = data;

        if (result === 'hit') {
            this.myGrid[row][col].hit = true;
            const shipName = this.getShipDisplayName(shipId);
            const theyHitMsg = (this.t('battleship.log.theyHitYour') || 'They hit your {ship}!').replace('{ship}', shipName);
            this.addBattleLog('hit', theyHitMsg);

            if (sunk) {
                this.mySunkShips.push(shipId);
                this.myShipsRemaining--;
                this.ships.find(s => s.id === shipId).cells.forEach(([r, c]) => {
                    this.myGrid[r][c].sunk = true;
                });
                const theySunkMsg = (this.t('battleship.log.theySunkYour') || 'They sunk your {ship}!').replace('{ship}', shipName);
                this.addBattleLog('sunk', theySunkMsg);
            }
        } else {
            const coord = `${String.fromCharCode(65 + col)}${row + 1}`;
            const theirMissMsg = (this.t('battleship.log.theirShotMissed') || 'Their shot missed at {coord}').replace('{coord}', coord);
            this.addBattleLog('miss', theirMissMsg);
        }

        this.isMyTurn = true;
        this.renderBattleGrids();
        this.updateTurnIndicator();
    }

    markShipSunk(shipId, gridType) {
        // Find all cells of the sunk ship and mark them
        if (gridType === 'attack') {
            // We don't know exact positions, server tells us
        }
    }

    updateTurnIndicator() {
        const text = document.getElementById('turn-text');
        const badge = document.getElementById('turn-badge');
        const scanIndicator = document.getElementById('scanning-indicator');

        if (this.isMyTurn) {
            text.textContent = this.t('battleship.yourTurn') || 'YOUR TURN';
            text.className = 'font-bold text-green-400';
            if (badge) badge.classList.add('border-green-500/50');
            if (scanIndicator) scanIndicator.textContent = this.t('battleship.fireWhenReady') || 'Fire when ready';
        } else {
            text.textContent = this.t('battleship.opponentTurn') || "OPPONENT'S TURN";
            text.className = 'font-bold text-red-400';
            if (badge) badge.classList.remove('border-green-500/50');
            if (scanIndicator) scanIndicator.textContent = this.t('battleship.scanning') || 'Scanning...';
        }
    }

    showAnimation(type, text) {
        const overlay = document.getElementById('animation-overlay');
        const textEl = document.getElementById('animation-text');

        overlay.className = `fixed inset-0 pointer-events-none z-50 flex items-center justify-center ${type}-animation`;
        textEl.textContent = text;
        overlay.classList.remove('hidden');

        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 800);
    }

    addBattleLog(type, message) {
        const log = document.getElementById('battle-log');

        // Get icon and colors based on type
        let icon = 'waves';
        let bgClass = 'bg-[#282e39]';

        if (type === 'hit') {
            icon = 'rocket';
            bgClass = 'bg-primary/20';
        } else if (type === 'sunk') {
            icon = 'warning';
            bgClass = 'bg-red-500';
        }

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const entry = document.createElement('div');
        entry.className = 'flex gap-4 p-4 border-b border-gray-800 hover:bg-[#1a2230]/50 transition-colors';
        entry.innerHTML = `
            <div class="text-white flex items-center justify-center rounded-lg ${bgClass} shrink-0 size-10">
                <span class="material-symbols-outlined text-lg">${icon}</span>
            </div>
            <div class="flex flex-col gap-1 flex-1">
                <p class="text-white text-sm font-medium leading-tight">${message}</p>
            </div>
            <div class="text-xs text-gray-500 font-mono">${timeStr}</div>
        `;

        log.insertBefore(entry, log.firstChild);

        // Keep only last 20 entries
        while (log.children.length > 10) {
            log.removeChild(log.lastChild);
        }
    }

    handleGameOver(data) {
        const { winner, stats } = data;
        const isWinner = winner === this.playerId;

        this.gamePhase = 'gameover';
        this.showScreen('gameover');

        const screen = document.getElementById('gameover-screen');
        const icon = document.getElementById('result-icon');
        const title = document.getElementById('result-title');
        const subtitle = document.getElementById('result-subtitle');

        if (isWinner) {
            screen.classList.add('victory');
            screen.classList.remove('defeat');
            icon.textContent = '🏆';
            title.textContent = this.t('battleship.victory') || 'VICTORY!';
            subtitle.textContent = this.t('battleship.victoryMessage') || 'You destroyed the enemy fleet!';

            // Calculate and submit score
            if (window.Leaderboard && window.Leaderboard.submit) {
                // Base score 1000
                // + 100 per remaining ship
                // + Accuracy bonus (max 500)
                // - 10 per shot fired
                const accuracy = this.shotsFired > 0 ? (this.hitsLanded / this.shotsFired) : 0;
                const score = Math.max(0, 1000 + (this.myShipsRemaining * 100) + Math.round(accuracy * 500) - (this.shotsFired * 10));

                window.Leaderboard.submit('battleship', score).then(success => {
                    if (success) console.log('Score submitted:', score);
                });
            }
        } else {
            screen.classList.add('defeat');
            screen.classList.remove('victory');
            icon.textContent = '💀';
            title.textContent = this.t('battleship.defeat') || 'DEFEAT';
            subtitle.textContent = this.t('battleship.defeatMessage') || 'Your fleet has been destroyed.';
        }

        document.getElementById('shots-fired').textContent = this.shotsFired;
        const accuracy = this.shotsFired > 0 ? Math.round((this.hitsLanded / this.shotsFired) * 100) : 0;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
    }

    renderRoomList(rooms) {
        const container = document.getElementById('rooms-list');

        if (rooms.length === 0) {
            container.innerHTML = '<p class="text-gray-600 text-sm text-center py-4">No rooms available</p>';
            return;
        }

        container.innerHTML = rooms.map(room => `
            <div class="room-item">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-ocean-accent">tag</span>
                    <span class="font-mono font-bold">${room.code}</span>
                </div>
                <button onclick="game.joinRoom('${room.code}')" class="px-4 py-2 rounded-lg bg-ocean-accent/20 hover:bg-ocean-accent/30 text-ocean-accent text-sm font-medium transition-all">
                    Join
                </button>
            </div>
        `).join('');
    }

    joinRoom(code) {
        document.getElementById('room-code-input').value = code;
        document.getElementById('join-room-btn').click();
    }

    resetGame() {
        this.myGrid = this.createEmptyGrid();
        this.opponentGrid = this.createEmptyGrid();
        this.ships.forEach(ship => {
            ship.placed = false;
            ship.cells = [];
        });
        this.selectedShip = null;
        this.shipOrientation = 'horizontal';
        this.shotsFired = 0;
        this.hitsLanded = 0;
        this.myShipsRemaining = 5;
        this.enemyShipsRemaining = 5;
        this.mySunkShips = [];
        this.enemySunkShips = [];
        this.opponentReady = false;
        this.isMyTurn = false;
        this.gamePhase = 'placement';

        this.renderPlacementGrid();
        this.renderShipsToPlace();
        document.getElementById('ready-btn').disabled = true;
        document.getElementById('ready-btn').innerHTML = '<span class="material-symbols-outlined">check_circle</span> Ready';
        document.getElementById('battle-log').innerHTML = '<p class="text-gray-600">Battle begins!</p>';
        this.updateOpponentStatus(false);
    }

    // Chat Methods
    setupChat() {
        const sendBtn = document.getElementById('chat-send-btn');
        const input = document.getElementById('chat-input');
        const toggleBtn = document.getElementById('chat-toggle-btn');
        const closeBtn = document.getElementById('chat-close-btn');

        if (sendBtn) sendBtn.onclick = () => this.sendChatMessage();
        if (toggleBtn) toggleBtn.onclick = () => this.toggleChat();
        if (closeBtn) closeBtn.onclick = () => this.toggleChat();

        if (input) {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
                e.stopPropagation();
            };
        }
    }

    toggleChat() {
        const overlay = document.getElementById('chat-overlay');
        const toggleBtn = document.getElementById('chat-toggle-btn');
        const input = document.getElementById('chat-input');

        this.isChatOpen = !this.isChatOpen;

        if (this.isChatOpen) {
            overlay.classList.remove('hidden');
            toggleBtn.classList.add('hidden');
            if (input) setTimeout(() => input.focus(), 50);
        } else {
            overlay.classList.add('hidden');
            toggleBtn.classList.remove('hidden');
        }
    }

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        if (!input || !this.socket) return;

        const message = input.value.trim();
        if (message) {
            this.socket.emit('battleship:chatMessage', message);
            this.addChatMessage('You', message, 'self');
            input.value = '';
        }
    }

    addChatMessage(author, message, type) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `chat-msg ${type}`;

        // Escape HTML
        const safeMsg = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        div.innerHTML = `
            <span class="author">${author}</span>
            <div class="content">${safeMsg}</div>
        `;

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BattleshipGame();
});

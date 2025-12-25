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

        this.init();
    }

    createEmptyGrid() {
        return Array(10).fill(null).map(() => Array(10).fill({ type: 'empty', shipId: null }));
    }

    init() {
        this.connectSocket();
        this.setupEventListeners();
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
                this.socket.emit('battleship:ready', { grid: this.myGrid, ships: this.ships });
                document.getElementById('ready-btn').disabled = true;
                document.getElementById('ready-btn').innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Waiting...';
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
            this.socket.emit('battleship:leaveRoom');
            this.resetGame();
            this.showScreen('lobby');
        });
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
            statusEl.innerHTML = `
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>Ready!</span>
                </div>
            `;
        }
    }

    checkBothReady() {
        // Server handles this, but we can show feedback
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
        // Enemy fleet status
        const enemyStatus = document.getElementById('enemy-fleet-status');
        enemyStatus.innerHTML = this.ships.map(ship => `
            <span class="fleet-ship-status ${this.enemySunkShips.includes(ship.id) ? 'sunk' : ''}">
                ${this.getShipDisplayName(ship.id)} (${ship.size})
            </span>
        `).join('');

        // Your fleet status
        const yourStatus = document.getElementById('your-fleet-status');
        yourStatus.innerHTML = this.ships.map(ship => `
            <span class="fleet-ship-status ${this.mySunkShips.includes(ship.id) ? 'sunk' : ''}">
                ${this.getShipDisplayName(ship.id)} (${ship.size})
            </span>
        `).join('');
    }

    handleAttack(row, col) {
        if (!this.isMyTurn) return;
        if (this.opponentGrid[row][col].type !== 'empty') return;

        this.socket.emit('battleship:attack', { row, col });
        this.shotsFired++;
    }

    handleAttackResult(data) {
        const { row, col, result, shipId, sunk } = data;

        if (result === 'hit') {
            this.opponentGrid[row][col] = { type: 'hit', shipId };
            this.hitsLanded++;
            this.showAnimation('hit', 'HIT!');
            this.addBattleLog('hit', `You hit their ${this.getShipDisplayName(shipId)}!`);

            if (sunk) {
                this.enemySunkShips.push(shipId);
                this.enemyShipsRemaining--;
                this.markShipSunk(shipId, 'attack');
                setTimeout(() => this.showAnimation('sunk', 'SUNK!'), 500);
                this.addBattleLog('sunk', `You sunk their ${this.getShipDisplayName(shipId)}!`);
            }
        } else {
            this.opponentGrid[row][col] = { type: 'miss' };
            this.showAnimation('miss', 'MISS');
            this.addBattleLog('miss', `Shot missed at ${String.fromCharCode(65 + col)}${row + 1}`);
        }

        this.isMyTurn = false;
        this.renderBattleGrids();
        this.updateTurnIndicator();
    }

    handleOpponentAttack(data) {
        const { row, col, result, shipId, sunk } = data;

        if (result === 'hit') {
            this.myGrid[row][col].hit = true;
            this.addBattleLog('hit', `They hit your ${this.getShipDisplayName(shipId)}!`);

            if (sunk) {
                this.mySunkShips.push(shipId);
                this.myShipsRemaining--;
                this.ships.find(s => s.id === shipId).cells.forEach(([r, c]) => {
                    this.myGrid[r][c].sunk = true;
                });
                this.addBattleLog('sunk', `They sunk your ${this.getShipDisplayName(shipId)}!`);
            }
        } else {
            this.addBattleLog('miss', `Their shot missed at ${String.fromCharCode(65 + col)}${row + 1}`);
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
        const badge = document.getElementById('turn-badge');
        const text = document.getElementById('turn-text');

        if (this.isMyTurn) {
            badge.className = 'inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold your-turn';
            text.textContent = 'Your Turn';
            badge.querySelector('.material-symbols-outlined').textContent = 'gps_fixed';
        } else {
            badge.className = 'inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold opponent-turn';
            text.textContent = "Opponent's Turn";
            badge.querySelector('.material-symbols-outlined').textContent = 'hourglass_top';
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
        const entry = document.createElement('p');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        log.insertBefore(entry, log.firstChild);

        // Keep only last 10 entries
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
            title.textContent = 'VICTORY!';
            subtitle.textContent = 'You destroyed the enemy fleet!';
        } else {
            screen.classList.add('defeat');
            screen.classList.remove('victory');
            icon.textContent = '💀';
            title.textContent = 'DEFEAT';
            subtitle.textContent = 'Your fleet has been destroyed.';
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
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BattleshipGame();
});

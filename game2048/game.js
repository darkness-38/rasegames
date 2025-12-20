/**
 * Power 2048 - Game Logic
 * Premium 2048 with sliding animations and endless gameplay
 */

class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.tileElements = new Map(); // Track DOM elements by tile ID for animations
        this.tileId = 0;
        this.maxTile = 0;
        this.bestTile = parseInt(localStorage.getItem('best2048Tile') || '0');
        this.gameOver = false;

        // Tile colors based on value
        this.tileStyles = {
            2: 'bg-white text-slate-900',
            4: 'bg-[#ede0c8] text-slate-800',
            8: 'bg-[#f2b179] text-white',
            16: 'bg-[#f59563] text-white',
            32: 'bg-[#f67c5f] text-white',
            64: 'bg-[#f65e3b] text-white',
            128: 'bg-[#edcf72] text-white ring-2 ring-yellow-400/50',
            256: 'bg-[#edcc61] text-white ring-2 ring-yellow-400/50',
            512: 'bg-[#edc850] text-white ring-2 ring-yellow-400/50',
            1024: 'bg-primary text-white ring-2 ring-primary/50 shadow-lg shadow-primary/40',
            2048: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/40',
            4096: 'bg-gradient-to-br from-red-500 to-pink-600 text-white ring-2 ring-red-400 shadow-lg shadow-red-500/40',
            8192: 'bg-gradient-to-br from-purple-500 to-violet-600 text-white ring-2 ring-purple-400 shadow-lg shadow-purple-500/40',
            16384: 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/40',
            32768: 'bg-gradient-to-br from-green-400 to-emerald-600 text-white ring-2 ring-green-400 shadow-lg shadow-green-500/40',
            65536: 'bg-gradient-to-br from-amber-400 to-orange-600 text-white ring-2 ring-amber-400 shadow-lg shadow-amber-500/40',
            131072: 'bg-gradient-to-br from-rose-400 to-red-600 text-white ring-2 ring-rose-400 shadow-lg shadow-rose-500/40'
        };

        this.cellSize = 0;
        this.gap = 12;

        this.init();
    }

    init() {
        this.setupBoard();
        this.setupEventListeners();
        this.updateDisplay();
        this.newGame();
    }

    setupBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        board.className = 'grid grid-cols-4 gap-3 aspect-square relative';

        // Create background cells
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'bg-cell-empty rounded-lg aspect-square';
            board.appendChild(cell);
        }

        // Create tile container (absolute positioned overlay)
        this.tileContainer = document.createElement('div');
        this.tileContainer.className = 'absolute inset-0';
        board.appendChild(this.tileContainer);

        // Calculate sizes
        setTimeout(() => {
            this.cellSize = (board.offsetWidth - this.gap * 3) / 4;
        }, 10);
    }

    setupEventListeners() {
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('gameOverRestartBtn')?.addEventListener('click', () => this.newGame());

        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Touch support
        let touchStartX, touchStartY;
        const board = document.getElementById('gameBoard');

        board.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        board.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) this.move(dx > 0 ? 'right' : 'left');
            } else {
                if (Math.abs(dy) > 30) this.move(dy > 0 ? 'down' : 'up');
            }
            touchStartX = touchStartY = null;
        });

        window.addEventListener('resize', () => {
            const board = document.getElementById('gameBoard');
            this.cellSize = (board.offsetWidth - this.gap * 3) / 4;
            this.updatePositions();
        });
    }

    handleKeydown(e) {
        if (this.gameOver) return;

        const keyMap = {
            'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
            'w': 'up', 'W': 'up', 's': 'down', 'S': 'down',
            'a': 'left', 'A': 'left', 'd': 'right', 'D': 'right'
        };

        if (keyMap[e.key]) {
            e.preventDefault();
            this.move(keyMap[e.key]);
        }
    }

    newGame() {
        // Clear existing tiles
        this.tileContainer.innerHTML = '';
        this.tileElements.clear();

        this.grid = [];
        for (let r = 0; r < this.size; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.size; c++) {
                this.grid[r][c] = null;
            }
        }

        this.tileId = 0;
        this.maxTile = 0;
        this.gameOver = false;

        this.hideOverlays();

        // Recalculate cell size
        const board = document.getElementById('gameBoard');
        this.cellSize = (board.offsetWidth - this.gap * 3) / 4;

        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.grid[r][c]) emptyCells.push({ r, c });
            }
        }

        if (emptyCells.length === 0) return null;

        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];

        // Progressive spawn
        let minSpawn = 2;
        if (this.maxTile >= 256) minSpawn = 16;
        else if (this.maxTile >= 128) minSpawn = 8;
        else if (this.maxTile >= 64) minSpawn = 4;

        const value = Math.random() < 0.9 ? minSpawn : minSpawn * 2;

        const tile = {
            id: this.tileId++,
            r, c, value,
            el: null
        };

        this.grid[r][c] = tile;
        this.createTileElement(tile, true);

        if (value > this.maxTile) {
            this.maxTile = value;
        }

        return tile;
    }

    createTileElement(tile, isNew = false) {
        const el = document.createElement('div');
        el.className = 'absolute rounded-lg flex items-center justify-center font-bold';
        el.style.transition = 'left 0.12s ease-out, top 0.12s ease-out, transform 0.12s ease-out';

        this.updateTileAppearance(el, tile.value);
        this.positionTile(el, tile.r, tile.c);

        if (isNew) {
            el.style.transform = 'scale(0)';
            requestAnimationFrame(() => {
                el.style.transform = 'scale(1)';
            });
        }

        tile.el = el;
        this.tileElements.set(tile.id, el);
        this.tileContainer.appendChild(el);
    }

    updateTileAppearance(el, value) {
        const style = this.tileStyles[value] || 'bg-gradient-to-br from-purple-500 to-pink-500 text-white ring-2 ring-purple-400';

        // Reset classes
        el.className = `absolute rounded-lg flex items-center justify-center font-bold ${style}`;

        // Font size based on value
        if (value >= 10000) {
            el.classList.add('text-sm', 'sm:text-base', 'md:text-lg');
        } else if (value >= 1000) {
            el.classList.add('text-lg', 'sm:text-xl', 'md:text-2xl');
        } else if (value >= 100) {
            el.classList.add('text-xl', 'sm:text-2xl', 'md:text-3xl');
        } else {
            el.classList.add('text-2xl', 'sm:text-3xl', 'md:text-4xl');
        }

        el.textContent = value;
    }

    positionTile(el, r, c) {
        const left = c * (this.cellSize + this.gap);
        const top = r * (this.cellSize + this.gap);
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.width = `${this.cellSize}px`;
        el.style.height = `${this.cellSize}px`;
    }

    updatePositions() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const tile = this.grid[r][c];
                if (tile && tile.el) {
                    this.positionTile(tile.el, r, c);
                }
            }
        }
    }

    move(direction) {
        if (this.gameOver) return;

        const vectors = {
            'up': { r: -1, c: 0 },
            'down': { r: 1, c: 0 },
            'left': { r: 0, c: -1 },
            'right': { r: 0, c: 1 }
        };

        const vector = vectors[direction];
        let moved = false;
        const tilesToRemove = [];

        const traversals = this.buildTraversals(vector);

        for (const r of traversals.r) {
            for (const c of traversals.c) {
                const tile = this.grid[r][c];
                if (!tile) continue;

                const { newR, newC, mergeTarget } = this.findFarthestPosition(r, c, vector);

                if (mergeTarget) {
                    // Merge
                    const newValue = tile.value * 2;

                    // Track max tile
                    if (newValue > this.maxTile) {
                        this.maxTile = newValue;
                    }

                    // Move tile to merge position
                    this.positionTile(tile.el, mergeTarget.r, mergeTarget.c);
                    tilesToRemove.push(tile);

                    // Update merge target
                    mergeTarget.value = newValue;
                    this.updateTileAppearance(mergeTarget.el, newValue);
                    mergeTarget.merged = true;

                    // Pulse animation
                    mergeTarget.el.style.transform = 'scale(1.15)';
                    setTimeout(() => {
                        if (mergeTarget.el) mergeTarget.el.style.transform = 'scale(1)';
                    }, 100);

                    // Clear old position
                    this.grid[r][c] = null;
                    moved = true;
                } else if (newR !== r || newC !== c) {
                    // Just move
                    this.grid[r][c] = null;
                    this.grid[newR][newC] = tile;
                    tile.r = newR;
                    tile.c = newC;
                    this.positionTile(tile.el, newR, newC);
                    moved = true;
                }
            }
        }

        if (moved) {
            // Remove merged tiles after animation
            setTimeout(() => {
                tilesToRemove.forEach(t => {
                    if (t.el && t.el.parentNode) {
                        t.el.remove();
                    }
                    this.tileElements.delete(t.id);
                });

                // Reset merge flags
                for (let r = 0; r < this.size; r++) {
                    for (let c = 0; c < this.size; c++) {
                        if (this.grid[r][c]) this.grid[r][c].merged = false;
                    }
                }

                // Add new tile
                this.addRandomTile();
                this.updateDisplay();

                if (this.isGameOver()) {
                    this.showGameOver();
                }
            }, 130);
        }
    }

    buildTraversals(vector) {
        const traversals = { r: [], c: [] };
        for (let i = 0; i < this.size; i++) {
            traversals.r.push(i);
            traversals.c.push(i);
        }
        if (vector.r === 1) traversals.r.reverse();
        if (vector.c === 1) traversals.c.reverse();
        return traversals;
    }

    findFarthestPosition(startR, startC, vector) {
        let r = startR, c = startC;
        let nextR = r + vector.r;
        let nextC = c + vector.c;

        while (this.isWithinBounds(nextR, nextC) && !this.grid[nextR][nextC]) {
            r = nextR;
            c = nextC;
            nextR += vector.r;
            nextC += vector.c;
        }

        // Check for merge
        if (this.isWithinBounds(nextR, nextC)) {
            const target = this.grid[nextR][nextC];
            const current = this.grid[startR][startC];
            if (target && !target.merged && target.value === current.value) {
                return { newR: r, newC: c, mergeTarget: target };
            }
        }

        return { newR: r, newC: c, mergeTarget: null };
    }

    isWithinBounds(r, c) {
        return r >= 0 && r < this.size && c >= 0 && c < this.size;
    }

    isGameOver() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.grid[r][c]) return false;
                const val = this.grid[r][c].value;
                if (r < this.size - 1 && this.grid[r + 1][c]?.value === val) return false;
                if (c < this.size - 1 && this.grid[r][c + 1]?.value === val) return false;
            }
        }
        this.gameOver = true;
        return true;
    }

    updateDisplay() {
        document.getElementById('currentTile').textContent = this.maxTile.toLocaleString();

        if (this.maxTile > this.bestTile) {
            this.bestTile = this.maxTile;
            localStorage.setItem('best2048Tile', this.bestTile);
        }
        document.getElementById('bestTile').textContent = this.bestTile.toLocaleString();
    }

    showGameOver() {
        document.getElementById('finalScore').textContent = this.maxTile.toLocaleString();
        document.getElementById('gameOverScreen').classList.remove('hidden');

        if (typeof Leaderboard !== 'undefined' && this.maxTile > 0) {
            Leaderboard.submit('game2048', this.maxTile);
        }
    }

    hideOverlays() {
        document.getElementById('gameOverScreen')?.classList.add('hidden');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});

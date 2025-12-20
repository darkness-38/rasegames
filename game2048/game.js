/**
 * Power 2048 - Game Logic
 * Premium 2048 with Tailwind UI integration and sliding animations
 */

class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.tiles = []; // Track tiles with IDs for animation
        this.tileId = 0;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('best2048') || '0');
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.maxTile = 0; // Track highest tile reached

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

        this.init();
    }

    init() {
        this.setupBoard();
        this.setupEventListeners();
        this.updateBestScore();
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

        // Create tile container
        this.tileContainer = document.createElement('div');
        this.tileContainer.className = 'absolute inset-0 p-0';
        this.tileContainer.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;';
        board.appendChild(this.tileContainer);
    }

    setupEventListeners() {
        // Restart buttons
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('winRestartBtn')?.addEventListener('click', () => this.newGame());
        document.getElementById('gameOverRestartBtn')?.addEventListener('click', () => this.newGame());
        document.getElementById('continueBtn')?.addEventListener('click', () => this.continueGame());

        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Touch
        let touchStartX, touchStartY;
        const board = document.getElementById('gameBoard');

        board.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        board.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) {
                    this.move(dx > 0 ? 'right' : 'left');
                }
            } else {
                if (Math.abs(dy) > 30) {
                    this.move(dy > 0 ? 'down' : 'up');
                }
            }

            touchStartX = null;
            touchStartY = null;
        });
    }

    handleKeydown(e) {
        if (this.gameOver && !this.keepPlaying) return;

        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            'W': 'up',
            's': 'down',
            'S': 'down',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right'
        };

        if (keyMap[e.key]) {
            e.preventDefault();
            this.move(keyMap[e.key]);
        }
    }

    newGame() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.tiles = [];
        this.tileId = 0;
        this.score = 0;
        this.maxTile = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;

        this.setupBoard();
        this.updateScore();
        this.hideOverlays();

        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();
        this.renderTiles();
    }

    continueGame() {
        this.keepPlaying = true;
        this.hideOverlays();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];

            // Progressive spawn based on max tile reached
            // 64 → spawn 4 only, 128 → spawn 8 only, 256 → spawn 16 only, etc.
            let minSpawn = 2;
            if (this.maxTile >= 256) minSpawn = 16;
            else if (this.maxTile >= 128) minSpawn = 8;
            else if (this.maxTile >= 64) minSpawn = 4;

            // 90% chance for minSpawn, 10% chance for minSpawn*2
            const value = Math.random() < 0.9 ? minSpawn : minSpawn * 2;

            this.grid[r][c] = value;
            this.tiles.push({ id: this.tileId++, r, c, value, isNew: true, merged: false });
            return { r, c, value };
        }
        return null;
    }

    move(direction) {
        if (this.gameOver && !this.keepPlaying) return;

        const vectors = {
            'up': { r: -1, c: 0 },
            'down': { r: 1, c: 0 },
            'left': { r: 0, c: -1 },
            'right': { r: 0, c: 1 }
        };

        const vector = vectors[direction];
        let moved = false;

        // Build traversal order
        const traversals = this.buildTraversals(vector);

        // Reset merge flags
        this.tiles.forEach(t => t.merged = false);

        // Process each position
        for (const r of traversals.r) {
            for (const c of traversals.c) {
                const tile = this.tiles.find(t => t.r === r && t.c === c);
                if (!tile) continue;

                const { newR, newC, mergeWith } = this.findFarthestPosition(tile, vector);

                if (mergeWith) {
                    // Merge tiles
                    const newValue = tile.value * 2;
                    this.score += newValue;

                    // Track highest tile
                    if (newValue > this.maxTile) {
                        this.maxTile = newValue;
                    }

                    // Remove old tiles from grid
                    this.grid[tile.r][tile.c] = 0;
                    this.grid[mergeWith.r][mergeWith.c] = 0;

                    // Update merged tile
                    mergeWith.value = newValue;
                    mergeWith.merged = true;
                    this.grid[mergeWith.r][mergeWith.c] = newValue;

                    // Animate moving tile to merge position then remove
                    tile.r = mergeWith.r;
                    tile.c = mergeWith.c;
                    tile.toRemove = true;



                    moved = true;
                } else if (newR !== tile.r || newC !== tile.c) {
                    // Move tile
                    this.grid[tile.r][tile.c] = 0;
                    tile.r = newR;
                    tile.c = newC;
                    this.grid[newR][newC] = tile.value;
                    moved = true;
                }
            }
        }

        if (moved) {
            // Animate tiles
            this.renderTiles();

            // After animation, clean up and add new tile
            setTimeout(() => {
                this.tiles = this.tiles.filter(t => !t.toRemove);
                this.tiles.forEach(t => t.isNew = false);
                this.addRandomTile();
                this.renderTiles();
                this.updateScore();

                if (this.isGameOver()) {
                    this.showGameOver();
                }
            }, 120);
        }
    }

    buildTraversals(vector) {
        const traversals = { r: [], c: [] };

        for (let i = 0; i < this.size; i++) {
            traversals.r.push(i);
            traversals.c.push(i);
        }

        // Reverse order if moving towards larger indices
        if (vector.r === 1) traversals.r.reverse();
        if (vector.c === 1) traversals.c.reverse();

        return traversals;
    }

    findFarthestPosition(tile, vector) {
        let prevR = tile.r;
        let prevC = tile.c;
        let nextR = tile.r + vector.r;
        let nextC = tile.c + vector.c;

        while (this.isWithinBounds(nextR, nextC) && this.grid[nextR][nextC] === 0) {
            prevR = nextR;
            prevC = nextC;
            nextR += vector.r;
            nextC += vector.c;
        }

        // Check for merge
        if (this.isWithinBounds(nextR, nextC)) {
            const targetTile = this.tiles.find(t => t.r === nextR && t.c === nextC && !t.merged && !t.toRemove);
            if (targetTile && targetTile.value === tile.value) {
                return { newR: prevR, newC: prevC, mergeWith: targetTile };
            }
        }

        return { newR: prevR, newC: prevC, mergeWith: null };
    }

    isWithinBounds(r, c) {
        return r >= 0 && r < this.size && c >= 0 && c < this.size;
    }

    isGameOver() {
        // Check for empty cells
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }

        // Check for possible merges
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const val = this.grid[r][c];
                if (r < this.size - 1 && this.grid[r + 1][c] === val) return false;
                if (c < this.size - 1 && this.grid[r][c + 1] === val) return false;
            }
        }

        this.gameOver = true;
        return true;
    }

    renderTiles() {
        this.tileContainer.innerHTML = '';

        // Create a grid of empty divs for positioning
        for (let i = 0; i < 16; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'aspect-square';
            this.tileContainer.appendChild(placeholder);
        }

        // Add tiles at their positions (overlapping the grid)
        for (const tile of this.tiles) {
            const el = document.createElement('div');
            const style = this.tileStyles[tile.value] || 'bg-gradient-to-br from-purple-500 to-pink-500 text-white ring-2 ring-purple-400';

            el.className = `absolute rounded-lg flex items-center justify-center font-bold transition-all duration-[120ms] ease-out ${style}`;

            // Calculate position and size
            const gap = 12; // 0.75rem = 12px
            const cellSize = (this.tileContainer.offsetWidth - gap * 3) / 4;
            const left = tile.c * (cellSize + gap);
            const top = tile.r * (cellSize + gap);

            el.style.cssText = `left: ${left}px; top: ${top}px; width: ${cellSize}px; height: ${cellSize}px;`;

            // Font size
            if (tile.value >= 1000) {
                el.classList.add('text-lg', 'sm:text-xl', 'md:text-2xl');
            } else if (tile.value >= 100) {
                el.classList.add('text-xl', 'sm:text-2xl', 'md:text-3xl');
            } else {
                el.classList.add('text-2xl', 'sm:text-3xl', 'md:text-4xl');
            }

            el.textContent = tile.value;

            // Animation classes
            if (tile.isNew) {
                el.classList.add('tile-new');
            }
            if (tile.merged) {
                el.classList.add('tile-merged');
            }

            this.tileContainer.appendChild(el);
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score.toLocaleString();

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('best2048', this.bestScore);
            this.updateBestScore();
        }
    }

    updateBestScore() {
        document.getElementById('bestScore').textContent = this.bestScore.toLocaleString();
    }



    showGameOver() {
        document.getElementById('finalScore').textContent = this.maxTile.toLocaleString();
        document.getElementById('gameOverScreen').classList.remove('hidden');

        // Submit maxTile to leaderboard (highest tile reached)
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

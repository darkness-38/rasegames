/**
 * Sudoku Game Logic
 * Includes efficient board generation (backtracking) and game state management.
 */

class SudokuGame {
    constructor() {
        this.board = []; // 9x9 Solution
        this.displayBoard = []; // 9x9 User State { val: number|null, fixed: boolean, notes: [], error: boolean }
        this.selectedCell = null; // {r, c}
        this.noteMode = false;
        this.history = []; // For Undo
        this.difficulty = 'easy';
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.isPlaying = false;

        this.init();
    }

    init() {
        // UI Bindings
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());

        // Difficulty Buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficulty = e.target.dataset.diff;
                this.newGame();
            });
        });

        document.getElementById('note-btn').addEventListener('click', () => this.toggleNoteMode());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('erase-btn').addEventListener('click', () => this.erase());
        document.getElementById('hint-btn').addEventListener('click', () => this.hint());

        // Numpad
        document.querySelectorAll('.numpad-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleInput(parseInt(btn.dataset.num)));
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;

            if (e.key >= '1' && e.key <= '9') {
                this.handleInput(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.erase();
            } else if (e.key === 'ArrowUp') this.moveSelection(-1, 0);
            else if (e.key === 'ArrowDown') this.moveSelection(1, 0);
            else if (e.key === 'ArrowLeft') this.moveSelection(0, -1);
            else if (e.key === 'ArrowRight') this.moveSelection(0, 1);
            else if (e.key.toLowerCase() === 'n') this.toggleNoteMode();
            else if (e.key.toLowerCase() === 'h') this.hint();
        });

        // Initial difficulty button state
        this.updateDifficultyUI();
        this.newGame();
    }

    updateDifficultyUI() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            if (btn.dataset.diff === this.difficulty) {
                btn.classList.add('bg-primary', 'text-white', 'font-bold', 'shadow-sm');
                btn.classList.remove('text-slate-500', 'hover:text-slate-700', 'hover:bg-slate-100');
            } else {
                btn.classList.remove('bg-primary', 'text-white', 'font-bold', 'shadow-sm');
                btn.classList.add('text-slate-500', 'hover:text-slate-700', 'hover:bg-slate-100');
            }
        });
    }

    newGame() {
        this.isPlaying = true;
        this.mistakes = 0;
        this.timer = 0;
        this.history = [];
        this.selectedCell = null;
        this.updateStats();
        this.updateDifficultyUI(); // Ensure UI reflects current difficulty

        // Generate Board
        this.generateBoard();

        // Render
        this.renderBoard();
        this.startTimer();
    }

    generateBoard() {
        // 1. Create Empty
        this.board = Array(9).fill().map(() => Array(9).fill(0));

        // 2. Fill Diagonal 3x3 matrices (independent)
        this.fillDiagonal();

        // 3. Fill remaining using backtracking
        this.solve(this.board);

        // 4. Create Display Board (Clone solution, then remove digits)
        this.displayBoard = this.board.map(row => row.map(val => ({
            val: val,
            fixed: true,
            notes: [],
            error: false
        })));

        // Remove digits based on difficulty
        let attempts = 30; // Easy
        if (this.difficulty === 'medium') attempts = 40;
        if (this.difficulty === 'hard') attempts = 50;
        if (this.difficulty === 'expert') attempts = 60;

        while (attempts > 0) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);

            if (this.displayBoard[row][col].val !== null) {
                this.displayBoard[row][col].val = null;
                this.displayBoard[row][col].fixed = false;
                attempts--;
            }
        }
    }

    fillDiagonal() {
        for (let i = 0; i < 9; i = i + 3) {
            this.fillBox(i, i);
        }
    }

    fillBox(row, col) {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!this.isSafeBox(row, col, num));
                this.board[row + i][col + j] = num;
            }
        }
    }

    isSafeBox(rowStart, colStart, num) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[rowStart + i][colStart + j] === num) return false;
            }
        }
        return true;
    }

    checkIfSafe(i, j, num) {
        return (
            this.isSafeRow(i, num) &&
            this.isSafeCol(j, num) &&
            this.isSafeBox(i - (i % 3), j - (j % 3), num)
        );
    }

    isSafeRow(i, num) {
        for (let j = 0; j < 9; j++) {
            if (this.board[i][j] === num) return false;
        }
        return true;
    }

    isSafeCol(j, num) {
        for (let i = 0; i < 9; i++) {
            if (this.board[i][j] === num) return false;
        }
        return true;
    }

    solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.checkIfSafe(row, col, num)) {
                            board[row][col] = num;
                            if (this.solve(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    renderBoard() {
        const grid = document.getElementById('game-board');
        grid.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cellData = this.displayBoard[i][j];
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';

                // Add bottom border for rows 2 and 5 (0-indexed -> 2, 5) to visualize 3x3 blocks
                if (i === 2 || i === 5) {
                    cell.classList.add('bottom-border');
                }

                cell.dataset.row = i;
                cell.dataset.col = j;

                if (cellData.fixed) {
                    cell.classList.add('initial');
                    cell.textContent = cellData.val;
                } else if (cellData.val) {
                    cell.textContent = cellData.val;
                    if (cellData.error) cell.classList.add('error');
                    else cell.classList.add('text-primary', 'font-bold'); // User entered correct
                } else {
                    // Notes
                    if (cellData.notes.length > 0) {
                        const noteGrid = document.createElement('div');
                        noteGrid.className = 'note-grid';
                        for (let n = 1; n <= 9; n++) {
                            const noteNum = document.createElement('div');
                            noteNum.className = 'note-num';
                            if (cellData.notes.includes(n)) noteNum.textContent = n;
                            noteGrid.appendChild(noteNum);
                        }
                        cell.appendChild(noteGrid);
                    }
                }

                if (this.selectedCell && this.selectedCell.r === i && this.selectedCell.c === j) {
                    cell.classList.add('selected');
                } else if (this.selectedCell) {
                    // Highlight same numbers
                    const selectedVal = this.displayBoard[this.selectedCell.r][this.selectedCell.c].val;
                    if (selectedVal && (cellData.val === selectedVal)) {
                        cell.classList.add('same-number');
                    }
                    // Highlight row/col/box related
                    // Box check
                    const cr = this.selectedCell.r;
                    const cc = this.selectedCell.c;
                    const isSameBox = Math.floor(i / 3) === Math.floor(cr / 3) && Math.floor(j / 3) === Math.floor(cc / 3);

                    if (i === cr || j === cc || isSameBox) {
                        cell.classList.add('highlight');
                    }
                }

                cell.addEventListener('mousedown', () => this.selectCell(i, j));
                grid.appendChild(cell);
            }
        }
    }

    selectCell(r, c) {
        this.selectedCell = { r, c };
        this.renderBoard();
    }

    moveSelection(dr, dc) {
        if (!this.selectedCell) {
            this.selectedCell = { r: 0, c: 0 };
        } else {
            let nr = this.selectedCell.r + dr;
            let nc = this.selectedCell.c + dc;
            if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                this.selectedCell = { r: nr, c: nc };
            }
        }
        this.renderBoard();
    }

    handleInput(num) {
        if (!this.selectedCell || !this.isPlaying) return;
        const { r, c } = this.selectedCell;
        const cell = this.displayBoard[r][c];

        if (cell.fixed) return;

        // History Snapshot
        this.saveState();

        if (this.noteMode) {
            if (cell.notes.includes(num)) {
                cell.notes = cell.notes.filter(n => n !== num);
            } else {
                cell.notes.push(num);
                cell.notes.sort();
            }
        } else {
            // Check correctness immediately
            if (num === this.board[r][c]) {
                cell.val = num;
                cell.error = false;
                cell.notes = []; // Clear notes on correct input
                // Check Win
                if (this.checkWin()) this.gameOver(true);
            } else {
                cell.val = num;
                cell.error = true;
                this.mistakes++;
                this.updateStats();
                if (this.mistakes >= this.maxMistakes) {
                    // Fail? Or just keep going? Keeping going is friendlier, maybe just alert
                }
            }
        }
        this.renderBoard();
    }

    erase() {
        if (!this.selectedCell || !this.isPlaying) return;
        const { r, c } = this.selectedCell;
        if (this.displayBoard[r][c].fixed) return;

        this.saveState();
        this.displayBoard[r][c].val = null;
        this.displayBoard[r][c].error = false;
        // Don't clear notes? Or do? Usually erase both
        // this.displayBoard[r][c].notes = []; 
        this.renderBoard();
    }

    toggleNoteMode() {
        this.noteMode = !this.noteMode;
        const btn = document.getElementById('note-btn');
        const indicator = document.getElementById('note-indicator');

        if (this.noteMode) {
            btn.classList.add('text-primary');
            indicator.classList.remove('hidden');
        } else {
            btn.classList.remove('text-primary');
            indicator.classList.add('hidden');
        }
    }

    saveState() {
        // Simple deep copy for history (optimization possible but not needed for Sudoku)
        if (this.history.length > 20) this.history.shift();
        this.history.push(JSON.parse(JSON.stringify({
            board: this.displayBoard,
            mistakes: this.mistakes
        })));
    }

    undo() {
        if (this.history.length === 0 || !this.isPlaying) return;
        const state = this.history.pop();
        this.displayBoard = state.board;
        this.mistakes = state.mistakes;
        this.updateStats();
        this.renderBoard();
    }

    hint() {
        if (!this.isPlaying) return;

        // Find an empty cell
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.displayBoard[i][j].val === null) {
                    emptyCells.push({ r: i, c: j });
                }
            }
        }

        if (emptyCells.length === 0) return;

        // If a cell is selected and empty, fill that one. Otherwise random.
        let target;
        if (this.selectedCell && this.displayBoard[this.selectedCell.r][this.selectedCell.c].val === null) {
            target = this.selectedCell;
        } else {
            target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }

        const { r, c } = target;
        this.saveState();
        this.displayBoard[r][c].val = this.board[r][c];
        this.displayBoard[r][c].notes = [];
        this.displayBoard[r][c].error = false;

        this.selectCell(r, c); // Highlight the hint
    }

    updateStats() {
        const mistakesCount = document.getElementById('mistakes-count');
        const mistakesBar = document.getElementById('mistakes-bar');

        mistakesCount.textContent = this.mistakes;

        // Update bar width (0, 1, 2, 3 -> 0%, 33%, 66%, 100%)
        const percentage = Math.min((this.mistakes / this.maxMistakes) * 100, 100);
        mistakesBar.style.width = `${percentage}%`;

        if (this.mistakes >= this.maxMistakes) {
            mistakesCount.classList.add('font-black');
            // Maybe color the bar redder or flash it
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer++;
            const min = Math.floor(this.timer / 60).toString().padStart(2, '0');
            const sec = (this.timer % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = `${min}:${sec}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    checkWin() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.displayBoard[i][j].val !== this.board[i][j]) return false;
            }
        }
        return true;
    }

    gameOver(win) {
        this.isPlaying = false;
        this.stopTimer();
        if (win) {
            const modal = document.getElementById('win-modal');
            const timeStr = document.getElementById('timer').textContent;
            document.getElementById('final-time').textContent = timeStr;
            modal.classList.remove('hidden');

            // Submit Score (Time in seconds, lower is better, but leaderboard usually expects higher score
            // So we inverse it: 10000 - time * difficulty_multiplier
            if (window.Leaderboard && window.Leaderboard.submit) {
                let multiplier = 1;
                if (this.difficulty === 'medium') multiplier = 1.5;
                if (this.difficulty === 'hard') multiplier = 2;
                if (this.difficulty === 'expert') multiplier = 3;

                const score = Math.max(0, Math.floor((3000 - this.timer) * multiplier));
                window.Leaderboard.submit('sudoku', score);
            }
        }
    }
}

const game = new SudokuGame();

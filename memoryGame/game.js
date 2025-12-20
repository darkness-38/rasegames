/**
 * Mind Match - Memory Game Logic
 * Premium memory game with 3D flip animations and leaderboard integration
 */

class MindMatch {
    constructor() {
        this.symbols = ['🚀', '🎮', '🎯', '💎', '🔥', '⚡', '🌟', '🎨'];
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 8;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isLocked = false;
        this.bestScore = parseInt(localStorage.getItem('bestMemory') || '0');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBestScore();
        this.newGame();
    }

    setupEventListeners() {
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.newGame());
    }

    newGame() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.isLocked = false;

        this.stopTimer();
        this.updateMoves();
        this.updatePairs();
        this.updateTimer();
        this.hideOverlay();

        this.createCards();
        this.renderBoard();
    }

    createCards() {
        // Create pairs
        const cardPairs = [...this.symbols, ...this.symbols];

        // Fisher-Yates shuffle
        for (let i = cardPairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
        }

        this.cards = cardPairs.map((symbol, index) => ({
            id: index,
            symbol,
            isFlipped: false,
            isMatched: false
        }));
    }

    renderBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';

        this.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.id = card.id;

            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <span class="card-symbol">${card.symbol}</span>
                    </div>
                    <div class="card-back"></div>
                </div>
            `;

            cardElement.addEventListener('click', () => this.flipCard(card.id));
            board.appendChild(cardElement);
        });
    }

    flipCard(id) {
        if (this.isLocked) return;

        const card = this.cards[id];
        if (card.isFlipped || card.isMatched) return;

        // Start timer on first flip
        if (this.moves === 0 && this.flippedCards.length === 0) {
            this.startTimer();
        }

        card.isFlipped = true;
        this.flippedCards.push(card);

        const cardElement = document.querySelector(`[data-id="${id}"]`);
        cardElement.classList.add('flipped');

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateMoves();
            this.checkMatch();
        }
    }

    checkMatch() {
        this.isLocked = true;
        const [card1, card2] = this.flippedCards;

        if (card1.symbol === card2.symbol) {
            // Match!
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;
            this.updatePairs();

            const el1 = document.querySelector(`[data-id="${card1.id}"]`);
            const el2 = document.querySelector(`[data-id="${card2.id}"]`);
            el1.classList.add('matched');
            el2.classList.add('matched');

            this.flippedCards = [];
            this.isLocked = false;

            if (this.matchedPairs === this.totalPairs) {
                this.gameWon();
            }
        } else {
            // No match
            const el1 = document.querySelector(`[data-id="${card1.id}"]`);
            const el2 = document.querySelector(`[data-id="${card2.id}"]`);
            el1.classList.add('wrong');
            el2.classList.add('wrong');

            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;

                el1.classList.remove('flipped', 'wrong');
                el2.classList.remove('flipped', 'wrong');

                this.flippedCards = [];
                this.isLocked = false;
            }, 800);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateMoves() {
        document.getElementById('moves').textContent = this.moves;
    }

    updatePairs() {
        document.getElementById('pairs').textContent = `${this.matchedPairs}/${this.totalPairs}`;
    }

    updateTimer() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('timer').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updateBestScore() {
        const bestEl = document.getElementById('bestScore');
        if (this.bestScore > 0) {
            bestEl.textContent = this.bestScore;
        } else {
            bestEl.textContent = '--';
        }
    }

    calculateScore() {
        // Higher score = better performance
        // Base: 10000, minus time penalty, minus moves penalty
        const baseScore = 10000;
        const timePenalty = this.timer * 5;
        const movesPenalty = this.moves * 10;

        return Math.max(0, baseScore - timePenalty - movesPenalty);
    }

    gameWon() {
        this.stopTimer();

        const score = this.calculateScore();

        // Update best score
        if (score > this.bestScore) {
            this.bestScore = score;
            localStorage.setItem('bestMemory', this.bestScore);
            this.updateBestScore();
        }

        // Update overlay
        document.getElementById('finalMoves').textContent = this.moves;
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('finalTime').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('finalScore').textContent = score;

        // Show overlay after a short delay
        setTimeout(() => {
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }, 500);

        // Submit to leaderboard
        if (typeof Leaderboard !== 'undefined' && score > 0) {
            Leaderboard.submit('memory', score);
        }
    }

    hideOverlay() {
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new MindMatch();
});

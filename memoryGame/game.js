// Memory Game - Rase Games
const gameBoard = document.getElementById('gameBoard');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const timerEl = document.getElementById('timer');
const bestScoreEl = document.getElementById('bestScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalMovesEl = document.getElementById('finalMoves');
const finalTimeEl = document.getElementById('finalTime');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

const EMOJIS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎵', '🎹'];
const TOTAL_PAIRS = 8;

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let isLocked = false;

let bestScore = parseInt(localStorage.getItem('memoryBest')) || null;
if (bestScore) bestScoreEl.textContent = bestScore;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createCards() {
    const cardValues = [...EMOJIS, ...EMOJIS];
    shuffle(cardValues);

    cards = cardValues.map((emoji, index) => ({
        id: index,
        emoji: emoji,
        isFlipped: false,
        isMatched: false
    }));
}

function renderBoard() {
    gameBoard.innerHTML = '';

    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        if (card.isFlipped || card.isMatched) cardEl.classList.add('flipped');
        if (card.isMatched) cardEl.classList.add('matched');

        cardEl.innerHTML = `
            <div class="back">?</div>
            <div class="front">${card.emoji}</div>
        `;

        cardEl.addEventListener('click', () => handleCardClick(index));
        gameBoard.appendChild(cardEl);
    });
}

function handleCardClick(index) {
    const card = cards[index];

    if (isLocked || card.isFlipped || card.isMatched) return;

    // Start timer on first click
    if (moves === 0 && flippedCards.length === 0 && !timerInterval) {
        startTimer();
    }

    card.isFlipped = true;
    flippedCards.push(index);
    renderBoard();

    if (flippedCards.length === 2) {
        moves++;
        movesEl.textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [first, second] = flippedCards;
    const card1 = cards[first];
    const card2 = cards[second];

    isLocked = true;

    if (card1.emoji === card2.emoji) {
        // Match!
        card1.isMatched = true;
        card2.isMatched = true;
        matchedPairs++;
        pairsEl.textContent = `${matchedPairs}/${TOTAL_PAIRS}`;

        flippedCards = [];
        isLocked = false;
        renderBoard();

        if (matchedPairs === TOTAL_PAIRS) {
            gameOver();
        }
    } else {
        // No match
        setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            flippedCards = [];
            isLocked = false;
            renderBoard();
        }, 1000);
    }
}

function startTimer() {
    timer = 0;
    timerInterval = setInterval(() => {
        timer++;
        timerEl.textContent = timer;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function calculateScore() {
    // Score formula: base score - penalty for moves and time
    const baseScore = 1000;
    const movePenalty = moves * 5;
    const timePenalty = timer * 2;
    return Math.max(0, baseScore - movePenalty - timePenalty);
}

function gameOver() {
    stopTimer();

    const score = calculateScore();

    finalMovesEl.textContent = moves;
    finalTimeEl.textContent = timer;
    finalScoreEl.textContent = score;

    if (!bestScore || score > bestScore) {
        bestScore = score;
        bestScoreEl.textContent = score;
        localStorage.setItem('memoryBest', score);
    }

    if (window.Leaderboard && score > 0) {
        Leaderboard.submit('memory', score);
    }

    gameOverScreen.classList.remove('hidden');
}

function initGame() {
    stopTimer();

    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    timer = 0;
    isLocked = false;

    movesEl.textContent = 0;
    pairsEl.textContent = `0/${TOTAL_PAIRS}`;
    timerEl.textContent = 0;

    createCards();
    renderBoard();
    gameOverScreen.classList.add('hidden');
}

restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

// Start game
initGame();

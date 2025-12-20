




class InputHandler {
    constructor() {
        this.keys = {};
        this.keyBuffer = {
            p1: [],
            p2: []
        };
        this.bufferTimeout = 500; // Increased for combos


        this.p1Controls = {
            left: 'KeyA',
            right: 'KeyD',
            jump: 'KeyW',
            crouch: 'KeyS',
            lightAttack: 'KeyF',
            heavyAttack: 'KeyG',
            special: 'KeyH',
            block: 'Space'
        };


        this.p2Controls = {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'ArrowUp',
            crouch: 'ArrowDown',
            lightAttack: 'KeyJ',
            heavyAttack: 'KeyK',
            special: 'KeyL',
            block: 'Enter'
        };

        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        // Don't capture keys when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        // Only track keys when game screen is active
        const gameScreen = document.getElementById('game-screen');
        const isGameActive = gameScreen && gameScreen.classList.contains('active');

        if (!this.keys[e.code]) {
            this.keys[e.code] = true;
            if (isGameActive) {
                this.addToBuffer(e.code);
            }
        }

        // Only prevent default during active gameplay
        if (isGameActive && this.isGameKey(e.code)) {
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    isGameKey(code) {
        const allControls = [...Object.values(this.p1Controls), ...Object.values(this.p2Controls)];
        return allControls.includes(code);
    }

    addToBuffer(code) {
        const timestamp = Date.now();


        if (Object.values(this.p1Controls).includes(code)) {
            this.keyBuffer.p1.push({ code, timestamp });
            this.cleanBuffer('p1');
        }

        if (Object.values(this.p2Controls).includes(code)) {
            this.keyBuffer.p2.push({ code, timestamp });
            this.cleanBuffer('p2');
        }
    }

    cleanBuffer(player) {
        const now = Date.now();
        this.keyBuffer[player] = this.keyBuffer[player].filter(
            entry => now - entry.timestamp < this.bufferTimeout
        );


        if (this.keyBuffer[player].length > 8) {
            this.keyBuffer[player] = this.keyBuffer[player].slice(-8);
        }
    }

    getPlayerInput(playerNum) {
        const controls = playerNum === 1 ? this.p1Controls : this.p2Controls;

        return {
            left: this.keys[controls.left] || false,
            right: this.keys[controls.right] || false,
            jump: this.keys[controls.jump] || false,
            crouch: this.keys[controls.crouch] || false,
            lightAttack: this.keys[controls.lightAttack] || false,
            heavyAttack: this.keys[controls.heavyAttack] || false,
            special: this.keys[controls.special] || false,
            block: this.keys[controls.block] || false
        };
    }

    getBuffer(playerNum) {
        const player = playerNum === 1 ? 'p1' : 'p2';
        this.cleanBuffer(player);
        return this.keyBuffer[player];
    }

    clearBuffer(playerNum) {
        const player = playerNum === 1 ? 'p1' : 'p2';
        this.keyBuffer[player] = [];
    }

    isKeyDown(code) {
        return this.keys[code] || false;
    }

    reset() {
        this.keys = {};
        this.keyBuffer = { p1: [], p2: [] };
    }

    // Convert key code to action name for combo matching
    getActionName(code, playerNum) {
        const controls = playerNum === 1 ? this.p1Controls : this.p2Controls;
        for (const [action, keyCode] of Object.entries(controls)) {
            if (keyCode === code) return action;
        }
        return null;
    }

    // Check if buffer matches a combo pattern
    // Pattern is array of action names like ['lightAttack', 'lightAttack', 'heavyAttack']
    checkCombo(playerNum, pattern) {
        const player = playerNum === 1 ? 'p1' : 'p2';
        this.cleanBuffer(player);

        const buffer = this.keyBuffer[player];
        if (buffer.length < pattern.length) return false;

        // Get recent actions from buffer
        const recentActions = buffer.slice(-pattern.length).map(
            entry => this.getActionName(entry.code, playerNum)
        );

        // Check if pattern matches
        for (let i = 0; i < pattern.length; i++) {
            if (recentActions[i] !== pattern[i]) return false;
        }

        return true;
    }
}


const inputHandler = new InputHandler();

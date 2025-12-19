// ===================================
// INPUT HANDLER
// Keyboard input management with buffer
// ===================================

class InputHandler {
    constructor() {
        this.keys = {};
        this.keyBuffer = {
            p1: [],
            p2: []
        };
        this.bufferTimeout = 300; // ms for combo detection
        
        // Player 1 controls
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
        
        // Player 2 controls
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
        if (!this.keys[e.code]) {
            this.keys[e.code] = true;
            this.addToBuffer(e.code);
        }
        
        // Prevent default for game keys
        if (this.isGameKey(e.code)) {
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
        
        // Check which player this key belongs to
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
        
        // Keep only last 5 inputs
        if (this.keyBuffer[player].length > 5) {
            this.keyBuffer[player] = this.keyBuffer[player].slice(-5);
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
}

// Global input handler instance
const inputHandler = new InputHandler();

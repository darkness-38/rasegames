




class MobileControls {
    constructor() {
        this.isEnabled = false;
        this.isMobile = this.detectMobile();

        
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 }
        };

        
        this.buttons = {
            lightAttack: false,
            heavyAttack: false,
            special: false,
            block: false,
            jump: false
        };

        
        this.touches = new Map();

        
        this.container = null;
        this.joystickBase = null;
        this.joystickKnob = null;

        if (this.isMobile) {
            this.createControls();
        }
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 1024 && 'ontouchstart' in window);
    }

    createControls() {
        
        this.container = document.createElement('div');
        this.container.id = 'mobile-controls';
        this.container.innerHTML = `
            <div class="mobile-controls-left">
                <div class="joystick-container" id="joystick-container">
                    <div class="joystick-base" id="joystick-base">
                        <div class="joystick-knob" id="joystick-knob"></div>
                    </div>
                </div>
                <button class="mobile-btn jump-btn" id="mobile-jump">↑</button>
            </div>
            <div class="mobile-controls-right">
                <div class="attack-buttons">
                    <button class="mobile-btn attack-btn light-attack" id="mobile-light">👊</button>
                    <button class="mobile-btn attack-btn heavy-attack" id="mobile-heavy">💪</button>
                </div>
                <div class="action-buttons">
                    <button class="mobile-btn action-btn special-btn" id="mobile-special">⚡</button>
                    <button class="mobile-btn action-btn block-btn" id="mobile-block">🛡️</button>
                </div>
            </div>
        `;

        
        this.addStyles();

        
        document.body.appendChild(this.container);

        
        this.joystickBase = document.getElementById('joystick-base');
        this.joystickKnob = document.getElementById('joystick-knob');

        
        this.setupEventListeners();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #mobile-controls {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 200px;
                z-index: 1000;
                pointer-events: none;
                padding: 10px 20px;
            }
            
            #mobile-controls.active {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            
            .mobile-controls-left,
            .mobile-controls-right {
                pointer-events: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .mobile-controls-left {
                align-items: flex-start;
            }
            
            .mobile-controls-right {
                align-items: flex-end;
            }
            
            .joystick-container {
                position: relative;
                width: 140px;
                height: 140px;
            }
            
            .joystick-base {
                width: 140px;
                height: 140px;
                background: rgba(255, 255, 255, 0.1);
                border: 3px solid rgba(0, 240, 255, 0.5);
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
            }
            
            .joystick-knob {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #00f0ff, #7b2cbf);
                border-radius: 50%;
                box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
                transition: transform 0.05s ease-out;
            }
            
            .mobile-btn {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                border: 3px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 1.8rem;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                user-select: none;
            }
            
            .mobile-btn:active,
            .mobile-btn.pressed {
                background: rgba(0, 240, 255, 0.4);
                border-color: #00f0ff;
                transform: scale(0.95);
            }
            
            .jump-btn {
                width: 60px;
                height: 60px;
                font-size: 1.5rem;
                margin-left: 80px;
                margin-bottom: 10px;
            }
            
            .attack-buttons {
                display: flex;
                gap: 15px;
            }
            
            .light-attack {
                border-color: rgba(0, 240, 255, 0.5);
            }
            
            .heavy-attack {
                border-color: rgba(255, 0, 110, 0.5);
                width: 80px;
                height: 80px;
            }
            
            .action-buttons {
                display: flex;
                gap: 15px;
                margin-top: 5px;
            }
            
            .special-btn {
                border-color: rgba(255, 170, 0, 0.5);
                width: 60px;
                height: 60px;
                font-size: 1.5rem;
            }
            
            .block-btn {
                border-color: rgba(0, 255, 136, 0.5);
                width: 60px;
                height: 60px;
                font-size: 1.5rem;
            }
            
            /* Landscape adjustments */
            @media (orientation: landscape) and (max-height: 500px) {
                #mobile-controls {
                    height: 150px;
                }
                
                .joystick-container,
                .joystick-base {
                    width: 100px;
                    height: 100px;
                }
                
                .joystick-knob {
                    width: 45px;
                    height: 45px;
                }
                
                .mobile-btn {
                    width: 55px;
                    height: 55px;
                    font-size: 1.4rem;
                }
                
                .heavy-attack {
                    width: 65px;
                    height: 65px;
                }
                
                .jump-btn,
                .special-btn,
                .block-btn {
                    width: 50px;
                    height: 50px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        
        const joystickContainer = document.getElementById('joystick-container');

        joystickContainer.addEventListener('touchstart', (e) => this.onJoystickStart(e), { passive: false });
        joystickContainer.addEventListener('touchmove', (e) => this.onJoystickMove(e), { passive: false });
        joystickContainer.addEventListener('touchend', (e) => this.onJoystickEnd(e), { passive: false });
        joystickContainer.addEventListener('touchcancel', (e) => this.onJoystickEnd(e), { passive: false });

        
        this.setupButton('mobile-light', 'lightAttack');
        this.setupButton('mobile-heavy', 'heavyAttack');
        this.setupButton('mobile-special', 'special');
        this.setupButton('mobile-block', 'block');
        this.setupButton('mobile-jump', 'jump');

        
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupButton(elementId, buttonName) {
        const btn = document.getElementById(elementId);

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.buttons[buttonName] = true;
            btn.classList.add('pressed');
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.buttons[buttonName] = false;
            btn.classList.remove('pressed');
        }, { passive: false });

        btn.addEventListener('touchcancel', (e) => {
            this.buttons[buttonName] = false;
            btn.classList.remove('pressed');
        }, { passive: false });
    }

    onJoystickStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.joystickBase.getBoundingClientRect();

        this.joystick.active = true;
        this.joystick.startX = rect.left + rect.width / 2;
        this.joystick.startY = rect.top + rect.height / 2;

        this.updateJoystick(touch.clientX, touch.clientY);
    }

    onJoystickMove(e) {
        e.preventDefault();
        if (!this.joystick.active) return;

        const touch = e.touches[0];
        this.updateJoystick(touch.clientX, touch.clientY);
    }

    onJoystickEnd(e) {
        e.preventDefault();
        this.joystick.active = false;
        this.joystick.direction = { x: 0, y: 0 };
        this.joystickKnob.style.transform = 'translate(0, 0)';
    }

    updateJoystick(touchX, touchY) {
        const maxDistance = 40;

        let deltaX = touchX - this.joystick.startX;
        let deltaY = touchY - this.joystick.startY;

        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        
        if (distance > maxDistance) {
            deltaX = (deltaX / distance) * maxDistance;
            deltaY = (deltaY / distance) * maxDistance;
        }

        
        this.joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        
        this.joystick.direction = {
            x: deltaX / maxDistance,
            y: deltaY / maxDistance
        };
    }

    enable() {
        this.isEnabled = true;
        if (this.container) {
            this.container.classList.add('active');
        }
    }

    disable() {
        this.isEnabled = false;
        if (this.container) {
            this.container.classList.remove('active');
        }
        
        this.joystick.direction = { x: 0, y: 0 };
        Object.keys(this.buttons).forEach(key => this.buttons[key] = false);
    }

    getInput() {
        if (!this.isEnabled) {
            return null;
        }

        const deadzone = 0.3;

        return {
            left: this.joystick.direction.x < -deadzone,
            right: this.joystick.direction.x > deadzone,
            jump: this.joystick.direction.y < -deadzone || this.buttons.jump,
            crouch: this.joystick.direction.y > 0.5,
            lightAttack: this.buttons.lightAttack,
            heavyAttack: this.buttons.heavyAttack,
            special: this.buttons.special,
            block: this.buttons.block
        };
    }

    
    shouldUseMobileControls() {
        return this.isMobile || (window.innerWidth <= 1024 && 'ontouchstart' in window);
    }

    
    vibrate(duration = 50) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }
}


const mobileControls = new MobileControls();

/**
 * States of Matter Simulation
 * Visualizes molecular behavior in solid, liquid, and gas states
 */

class StatesOfMatterSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // High DPI support
        this.dpr = window.devicePixelRatio || 1;
        this.resize();

        // Simulation state
        this.temperature = 100; // Kelvin
        this.moleculeType = 'neon';
        this.particles = [];
        this.numParticles = 60;

        // Transition tracking
        this.currentState = 'solid';
        this.transitionProgress = 1; // 0-1, 1 = complete
        this.transitionSpeed = 0.02; // How fast transitions happen

        // Molecule properties
        this.moleculeProps = {
            neon: { color: '#60a5fa', radius: 8, meltingPoint: 25, boilingPoint: 27 },
            argon: { color: '#a78bfa', radius: 10, meltingPoint: 84, boilingPoint: 87 },
            oxygen: { color: '#f87171', radius: 9, meltingPoint: 54, boilingPoint: 90 },
            water: { color: '#22d3ee', radius: 9, meltingPoint: 273, boilingPoint: 373 }
        };

        this.init();
        this.bindEvents();
        this.animate();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    init() {
        this.particles = [];
        const props = this.moleculeProps[this.moleculeType];
        const state = this.getState();

        if (state === 'solid') {
            // Grid arrangement for solid
            const cols = Math.ceil(Math.sqrt(this.numParticles));
            const spacing = Math.min(this.width, this.height) / (cols + 2);
            const startX = (this.width - cols * spacing) / 2 + spacing / 2;
            const startY = this.height - spacing;

            for (let i = 0; i < this.numParticles; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                this.particles.push({
                    x: startX + col * spacing,
                    y: startY - row * spacing,
                    baseX: startX + col * spacing,
                    baseY: startY - row * spacing,
                    vx: 0,
                    vy: 0,
                    radius: props.radius
                });
            }
        } else {
            // Random positions for liquid/gas
            for (let i = 0; i < this.numParticles; i++) {
                this.particles.push({
                    x: Math.random() * (this.width - 40) + 20,
                    y: Math.random() * (this.height - 40) + 20,
                    baseX: 0,
                    baseY: 0,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    radius: props.radius
                });
            }
        }
    }

    getState() {
        const props = this.moleculeProps[this.moleculeType];
        if (this.temperature < props.meltingPoint) return 'solid';
        if (this.temperature < props.boilingPoint) return 'liquid';
        return 'gas';
    }

    bindEvents() {
        // Temperature slider
        const tempSlider = document.getElementById('temp-slider');
        const tempDisplay = document.getElementById('temp-display');

        tempSlider.addEventListener('input', (e) => {
            this.temperature = parseInt(e.target.value);
            tempDisplay.textContent = `${this.temperature} K`;
            this.updateUI();
        });

        // Heat/Cool buttons
        document.getElementById('heat-btn').addEventListener('click', () => {
            this.temperature = Math.min(400, this.temperature + 20);
            tempSlider.value = this.temperature;
            tempDisplay.textContent = `${this.temperature} K`;
            this.updateUI();
        });

        document.getElementById('cool-btn').addEventListener('click', () => {
            this.temperature = Math.max(0, this.temperature - 20);
            tempSlider.value = this.temperature;
            tempDisplay.textContent = `${this.temperature} K`;
            this.updateUI();
        });

        // Molecule buttons
        document.querySelectorAll('.molecule-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.molecule-btn').forEach(b => {
                    b.classList.remove('active', 'bg-purple-500/20', 'border-purple-500/50');
                    b.classList.add('bg-[#282e39]', 'border-[#3f4756]');
                });
                btn.classList.add('active', 'bg-purple-500/20', 'border-purple-500/50');
                btn.classList.remove('bg-[#282e39]', 'border-[#3f4756]');
                this.moleculeType = btn.dataset.molecule;
                this.init();
                this.updateUI();
            });
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.temperature = 100;
            tempSlider.value = 100;
            tempDisplay.textContent = '100 K';
            this.init();
            this.updateUI();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });

        this.updateUI();
    }

    updateUI() {
        const state = this.getState();
        const stateDisplay = document.getElementById('state-display');
        const kineticBar = document.getElementById('kinetic-bar');
        const potentialBar = document.getElementById('potential-bar');

        const stateInfo = {
            solid: { text: 'SOLID', color: 'text-blue-400', desc: 'Molecules vibrate in fixed positions' },
            liquid: { text: 'LIQUID', color: 'text-cyan-400', desc: 'Molecules slide past each other' },
            gas: { text: 'GAS', color: 'text-red-400', desc: 'Molecules move freely and rapidly' }
        };

        const info = stateInfo[state];
        stateDisplay.innerHTML = `
            <div class="text-4xl font-black ${info.color} mb-2">${info.text}</div>
            <p class="text-[#9da6b9] text-sm">${info.desc}</p>
        `;

        // Energy bars
        const kineticPercent = (this.temperature / 400) * 100;
        const potentialPercent = 100 - kineticPercent;
        kineticBar.style.width = `${kineticPercent}%`;
        potentialBar.style.width = `${potentialPercent}%`;
    }

    update() {
        const targetState = this.getState();
        const props = this.moleculeProps[this.moleculeType];
        const speedFactor = this.temperature / 100;

        // Detect state change
        if (targetState !== this.currentState) {
            this.currentState = targetState;
            this.transitionProgress = 0;

            // Calculate target positions for solid state
            if (targetState === 'solid') {
                const cols = Math.ceil(Math.sqrt(this.numParticles));
                const spacing = Math.min(this.width, this.height) / (cols + 2);
                const startX = (this.width - cols * spacing) / 2 + spacing / 2;
                const startY = this.height - spacing;

                this.particles.forEach((p, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    p.targetX = startX + col * spacing;
                    p.targetY = startY - row * spacing;
                });
            }
        }

        // Update transition progress
        if (this.transitionProgress < 1) {
            this.transitionProgress = Math.min(1, this.transitionProgress + this.transitionSpeed);
        }

        // Lerp function for smooth transitions
        const lerp = (start, end, t) => start + (end - start) * t;
        const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        this.particles.forEach(p => {
            if (this.currentState === 'solid') {
                // Smoothly move towards target position
                if (this.transitionProgress < 1 && p.targetX !== undefined) {
                    const easedProgress = easeInOut(this.transitionProgress);
                    const targetX = p.targetX;
                    const targetY = p.targetY;

                    // Move towards target
                    p.x = lerp(p.x, targetX, 0.05);
                    p.y = lerp(p.y, targetY, 0.05);

                    // Slow down velocity
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                } else {
                    // Vibrate around base position
                    const vibration = speedFactor * 2;
                    const baseX = p.targetX || p.x;
                    const baseY = p.targetY || p.y;
                    p.x = baseX + (Math.random() - 0.5) * vibration;
                    p.y = baseY + (Math.random() - 0.5) * vibration;
                }
            } else if (this.currentState === 'liquid') {
                // Add continuous random motion (Brownian motion)
                p.vx += (Math.random() - 0.5) * 0.3;
                p.vy += (Math.random() - 0.5) * 0.3;

                // Small gravity effect
                p.vy += 0.02;

                // Move freely
                p.x += p.vx * speedFactor * 0.4;
                p.y += p.vy * speedFactor * 0.4;

                // Bounce off walls with energy
                if (p.x < p.radius) {
                    p.vx = Math.abs(p.vx) * 0.9;
                    p.x = p.radius;
                } else if (p.x > this.width - p.radius) {
                    p.vx = -Math.abs(p.vx) * 0.9;
                    p.x = this.width - p.radius;
                }

                // Bounce off bottom - molecules should pool but still move
                if (p.y > this.height - p.radius) {
                    p.vy = -Math.abs(p.vy) * 0.7 - Math.random() * 0.5; // Bounce up with some randomness
                    p.y = this.height - p.radius;
                } else if (p.y < p.radius) {
                    p.vy = Math.abs(p.vy) * 0.9;
                    p.y = p.radius;
                }

                // Limit speed for liquid (slower than gas)
                const liquidSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (liquidSpeed > 3) {
                    p.vx = (p.vx / liquidSpeed) * 3;
                    p.vy = (p.vy / liquidSpeed) * 3;
                }
            } else {
                // Gas state
                p.x += p.vx * speedFactor;
                p.y += p.vy * speedFactor;

                // Bounce off walls
                if (p.x < p.radius || p.x > this.width - p.radius) {
                    p.vx *= -0.9;
                    p.x = Math.max(p.radius, Math.min(this.width - p.radius, p.x));
                }
                if (p.y < p.radius || p.y > this.height - p.radius) {
                    p.vy *= -0.9;
                    p.y = Math.max(p.radius, Math.min(this.height - p.radius, p.y));
                }

                // Random motion for gas - increases over transition
                const gasIntensity = this.transitionProgress < 1 ? this.transitionProgress : 1;
                p.vx += (Math.random() - 0.5) * 0.5 * gasIntensity;
                p.vy += (Math.random() - 0.5) * 0.5 * gasIntensity;

                // Limit speed
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > 5) {
                    p.vx = (p.vx / speed) * 5;
                    p.vy = (p.vy / speed) * 5;
                }
            }
        });
    }

    draw() {
        const props = this.moleculeProps[this.moleculeType];

        // Clear canvas
        this.ctx.fillStyle = '#1e2330';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw container
        this.ctx.strokeStyle = '#3f4756';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(5, 5, this.width - 10, this.height - 10);

        // Draw particles
        this.particles.forEach(p => {
            // Glow effect
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
            gradient.addColorStop(0, props.color);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Core
            this.ctx.fillStyle = props.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize simulation
document.addEventListener('DOMContentLoaded', () => {
    new StatesOfMatterSimulation('simulation-canvas');
});

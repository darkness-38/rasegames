/**
 * Acid-Base Solutions Simulation
 * Visualizes dissociation of acids and bases in water
 */

const solutions = {
    'strong-acid': [
        { name: 'Hydrochloric Acid (HCl)', formula: 'HCl', equation: 'HCl → H⁺ + Cl⁻', ka: Infinity },
        { name: 'Nitric Acid (HNO₃)', formula: 'HNO3', equation: 'HNO₃ → H⁺ + NO₃⁻', ka: Infinity },
        { name: 'Sulfuric Acid (H₂SO₄)', formula: 'H2SO4', equation: 'H₂SO₄ → 2H⁺ + SO₄²⁻', ka: Infinity }
    ],
    'weak-acid': [
        { name: 'Acetic Acid (CH₃COOH)', formula: 'CH3COOH', equation: 'CH₃COOH ⇌ H⁺ + CH₃COO⁻', ka: 1.8e-5 },
        { name: 'Carbonic Acid (H₂CO₃)', formula: 'H2CO3', equation: 'H₂CO₃ ⇌ H⁺ + HCO₃⁻', ka: 4.3e-7 },
        { name: 'Hydrofluoric Acid (HF)', formula: 'HF', equation: 'HF ⇌ H⁺ + F⁻', ka: 6.8e-4 }
    ],
    'strong-base': [
        { name: 'Sodium Hydroxide (NaOH)', formula: 'NaOH', equation: 'NaOH → Na⁺ + OH⁻', kb: Infinity },
        { name: 'Potassium Hydroxide (KOH)', formula: 'KOH', equation: 'KOH → K⁺ + OH⁻', kb: Infinity },
        { name: 'Calcium Hydroxide (Ca(OH)₂)', formula: 'CaOH2', equation: 'Ca(OH)₂ → Ca²⁺ + 2OH⁻', kb: Infinity }
    ],
    'weak-base': [
        { name: 'Ammonia (NH₃)', formula: 'NH3', equation: 'NH₃ + H₂O ⇌ NH₄⁺ + OH⁻', kb: 1.8e-5 },
        { name: 'Methylamine (CH₃NH₂)', formula: 'CH3NH2', equation: 'CH₃NH₂ + H₂O ⇌ CH₃NH₃⁺ + OH⁻', kb: 4.4e-4 },
        { name: 'Pyridine (C₅H₅N)', formula: 'C5H5N', equation: 'C₅H₅N + H₂O ⇌ C₅H₅NH⁺ + OH⁻', kb: 1.7e-9 }
    ]
};

class AcidBaseSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.dpr = window.devicePixelRatio || 1;
        this.resize();

        this.solutionType = 'strong-acid';
        this.currentSolution = solutions['strong-acid'][0];
        this.concentration = 0.1;
        this.particles = [];

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
        this.populateSolutionSelect();
        this.generateParticles();
        this.updateUI();
    }

    populateSolutionSelect() {
        const select = document.getElementById('solution-select');
        select.innerHTML = solutions[this.solutionType].map((sol, i) =>
            `<option value="${i}">${sol.name}</option>`
        ).join('');
        this.currentSolution = solutions[this.solutionType][0];
    }

    generateParticles() {
        this.particles = [];
        const numParticles = Math.floor(50 * this.concentration * 10);

        // Calculate dissociation percentage
        let dissociationPercent = 1;
        if (this.solutionType === 'weak-acid' && this.currentSolution.ka) {
            dissociationPercent = Math.min(0.3, Math.sqrt(this.currentSolution.ka / this.concentration));
        } else if (this.solutionType === 'weak-base' && this.currentSolution.kb) {
            dissociationPercent = Math.min(0.3, Math.sqrt(this.currentSolution.kb / this.concentration));
        }

        const numDissociated = Math.floor(numParticles * dissociationPercent);
        const numUndissociated = numParticles - numDissociated;

        const isAcid = this.solutionType.includes('acid');

        // Add dissociated ions
        for (let i = 0; i < numDissociated; i++) {
            // H+ or OH-
            this.particles.push({
                x: Math.random() * (this.width - 40) + 20,
                y: Math.random() * (this.height - 40) + 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                type: isAcid ? 'H+' : 'OH-',
                radius: 6
            });

            // Counter ion
            this.particles.push({
                x: Math.random() * (this.width - 40) + 20,
                y: Math.random() * (this.height - 40) + 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                type: 'anion',
                radius: 8
            });
        }

        // Add undissociated molecules
        for (let i = 0; i < numUndissociated; i++) {
            this.particles.push({
                x: Math.random() * (this.width - 40) + 20,
                y: Math.random() * (this.height - 40) + 20,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                type: 'molecule',
                radius: 10
            });
        }

        // Add some water molecules
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * (this.width - 40) + 20,
                y: Math.random() * (this.height - 40) + 20,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                type: 'water',
                radius: 5
            });
        }
    }

    updateUI() {
        // Calculate pH
        let pH;
        const isAcid = this.solutionType.includes('acid');
        const isStrong = this.solutionType.includes('strong');

        if (isStrong) {
            if (isAcid) {
                pH = -Math.log10(this.concentration);
            } else {
                const pOH = -Math.log10(this.concentration);
                pH = 14 - pOH;
            }
        } else {
            if (isAcid) {
                const ka = this.currentSolution.ka || 1e-5;
                const hConc = Math.sqrt(ka * this.concentration);
                pH = -Math.log10(hConc);
            } else {
                const kb = this.currentSolution.kb || 1e-5;
                const ohConc = Math.sqrt(kb * this.concentration);
                const pOH = -Math.log10(ohConc);
                pH = 14 - pOH;
            }
        }

        pH = Math.max(0, Math.min(14, pH));

        // Update displays
        document.getElementById('ph-display').textContent = pH.toFixed(1);
        document.getElementById('ph-marker-bar').style.marginLeft = `${(pH / 14) * 100}%`;

        document.getElementById('concentration-display').textContent = `${this.concentration.toFixed(3)} M`;

        // Conductivity
        const conductivity = isStrong ? 'High' : 'Medium';
        const conductivityPercent = isStrong ? 90 : 40;
        document.getElementById('conductivity-display').textContent = conductivity;
        document.getElementById('conductivity-bar').style.width = `${conductivityPercent}%`;

        // Equation
        document.getElementById('equation-display').textContent = this.currentSolution.equation;

        // Dissociation info
        let dissociationInfo;
        if (isStrong) {
            dissociationInfo = '100% dissociated (complete)';
        } else {
            const percent = isAcid
                ? Math.min(100, Math.sqrt((this.currentSolution.ka || 1e-5) / this.concentration) * 100)
                : Math.min(100, Math.sqrt((this.currentSolution.kb || 1e-5) / this.concentration) * 100);
            dissociationInfo = `~${percent.toFixed(1)}% dissociated (equilibrium)`;
        }
        document.getElementById('dissociation-info').textContent = dissociationInfo;
    }

    bindEvents() {
        // Type buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => {
                    b.classList.remove('active');
                    b.classList.add('bg-[#282e39]');
                });
                btn.classList.add('active');
                btn.classList.remove('bg-[#282e39]');

                this.solutionType = btn.dataset.type;
                this.populateSolutionSelect();
                this.generateParticles();
                this.updateUI();
            });
        });

        // Solution select
        document.getElementById('solution-select').addEventListener('change', (e) => {
            this.currentSolution = solutions[this.solutionType][parseInt(e.target.value)];
            this.generateParticles();
            this.updateUI();
        });

        // Concentration slider
        document.getElementById('concentration-slider').addEventListener('input', (e) => {
            this.concentration = parseFloat(e.target.value);
            this.generateParticles();
            this.updateUI();
        });

        // Resize
        window.addEventListener('resize', () => {
            this.resize();
            this.generateParticles();
        });
    }

    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off walls
            if (p.x < p.radius || p.x > this.width - p.radius) {
                p.vx *= -1;
                p.x = Math.max(p.radius, Math.min(this.width - p.radius, p.x));
            }
            if (p.y < p.radius || p.y > this.height - p.radius) {
                p.vy *= -1;
                p.y = Math.max(p.radius, Math.min(this.height - p.radius, p.y));
            }

            // Random motion
            p.vx += (Math.random() - 0.5) * 0.2;
            p.vy += (Math.random() - 0.5) * 0.2;

            // Limit speed
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 2) {
                p.vx = (p.vx / speed) * 2;
                p.vy = (p.vy / speed) * 2;
            }
        });
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1e2330';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw beaker outline
        this.ctx.strokeStyle = '#3f4756';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(5, 5, this.width - 10, this.height - 10);

        // Draw particles
        this.particles.forEach(p => {
            let color;
            switch (p.type) {
                case 'H+': color = '#ef4444'; break;
                case 'OH-': color = '#3b82f6'; break;
                case 'anion': color = '#22c55e'; break;
                case 'molecule': color = '#a855f7'; break;
                case 'water': color = 'rgba(34, 211, 238, 0.3)'; break;
            }

            // Glow effect for ions
            if (p.type !== 'water') {
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Core
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Label
            if (p.type === 'H+' || p.type === 'OH-') {
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 8px Space Grotesk';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(p.type === 'H+' ? '+' : '−', p.x, p.y);
            }
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
    new AcidBaseSimulation('simulation-canvas');
});

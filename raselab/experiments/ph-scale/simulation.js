/**
 * pH Scale Simulation with Mixing
 * Visualizes pH values and allows mixing solutions
 */

const solutions = [
    { name: 'Battery Acid', ph: 0.5, color: '#ef4444', info: 'Extremely corrosive sulfuric acid found in car batteries.' },
    { name: 'Lemon Juice', ph: 2.0, color: '#f97316', info: 'Citric acid gives lemons their sour taste.' },
    { name: 'Vinegar', ph: 2.9, color: '#fb923c', info: 'Acetic acid used in cooking and cleaning.' },
    { name: 'Orange Juice', ph: 3.5, color: '#fbbf24', info: 'Contains citric acid, less acidic than lemons.' },
    { name: 'Tomato', ph: 4.2, color: '#facc15', info: 'Mildly acidic, good for cooking.' },
    { name: 'Coffee', ph: 5.0, color: '#a16207', info: 'Slightly acidic beverage from roasted beans.' },
    { name: 'Milk', ph: 6.5, color: '#fef3c7', info: 'Slightly acidic due to lactic acid.' },
    { name: 'Pure Water', ph: 7.0, color: '#22c55e', info: 'Neutral solution with equal H⁺ and OH⁻ concentrations.' },
    { name: 'Blood', ph: 7.4, color: '#dc2626', info: 'Slightly basic, tightly regulated by the body.' },
    { name: 'Sea Water', ph: 8.0, color: '#06b6d4', info: 'Slightly basic due to dissolved minerals.' },
    { name: 'Baking Soda', ph: 8.5, color: '#14b8a6', info: 'Sodium bicarbonate, used in baking and cleaning.' },
    { name: 'Milk of Magnesia', ph: 10.5, color: '#8b5cf6', info: 'Magnesium hydroxide, antacid medication.' },
    { name: 'Ammonia', ph: 11.5, color: '#a855f7', info: 'Common household cleaner, irritating to skin.' },
    { name: 'Bleach', ph: 12.5, color: '#d946ef', info: 'Sodium hypochlorite, strong disinfectant.' },
    { name: 'Drain Cleaner', ph: 14.0, color: '#c026d3', info: 'Sodium hydroxide (lye), extremely caustic.' }
];

class PHScaleSimulation {
    constructor() {
        this.beakerSolutions = []; // Solutions in beaker with amounts
        this.currentPH = 7.0;
        this.currentColor = '#22c55e';
        this.init();
        this.bindEvents();
    }

    init() {
        this.renderSolutionButtons();
        this.updateDisplay();
    }

    renderSolutionButtons() {
        const container = document.getElementById('solution-buttons');
        container.innerHTML = '';

        solutions.forEach(solution => {
            const btn = document.createElement('button');
            btn.className = `solution-btn p-3 rounded-xl bg-[#282e39] border border-[#3f4756] text-white font-medium text-left hover:border-teal-400 transition-all flex items-center gap-3`;
            btn.innerHTML = `
                <div class="w-4 h-4 rounded-full flex-shrink-0" style="background: ${solution.color}"></div>
                <span class="flex-1">${solution.name}</span>
                <span class="text-sm text-[#9da6b9]">${solution.ph}</span>
            `;
            btn.addEventListener('click', () => this.addSolution(solution));
            container.appendChild(btn);
        });
    }

    addSolution(solution) {
        // Add to beaker
        const existing = this.beakerSolutions.find(s => s.name === solution.name);
        if (existing) {
            existing.amount += 1;
        } else {
            this.beakerSolutions.push({ ...solution, amount: 1 });
        }

        // Calculate mixed pH
        this.calculateMixedPH();
        this.updateDisplay();
        this.showMixAnimation();
    }

    calculateMixedPH() {
        if (this.beakerSolutions.length === 0) {
            this.currentPH = 7.0;
            this.currentColor = '#22c55e';
            return;
        }

        // Simple arithmetic average: (pH1*drops1 + pH2*drops2) / totalDrops
        let totalPH = 0;
        let totalDrops = 0;

        this.beakerSolutions.forEach(sol => {
            totalPH += sol.ph * sol.amount;
            totalDrops += sol.amount;
        });

        this.currentPH = totalPH / totalDrops;

        // Clamp
        this.currentPH = Math.max(0, Math.min(14, this.currentPH));

        // Mix colors
        this.currentColor = this.mixColors();
    }

    mixColors() {
        if (this.beakerSolutions.length === 0) return '#22c55e';
        if (this.beakerSolutions.length === 1) return this.beakerSolutions[0].color;

        // Simple color averaging
        let r = 0, g = 0, b = 0, total = 0;

        this.beakerSolutions.forEach(sol => {
            const hex = sol.color.replace('#', '');
            r += parseInt(hex.substr(0, 2), 16) * sol.amount;
            g += parseInt(hex.substr(2, 2), 16) * sol.amount;
            b += parseInt(hex.substr(4, 2), 16) * sol.amount;
            total += sol.amount;
        });

        r = Math.round(r / total);
        g = Math.round(g / total);
        b = Math.round(b / total);

        return `rgb(${r}, ${g}, ${b})`;
    }

    darkenColor(color) {
        // Darken color for gradient bottom
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            let r = parseInt(hex.substr(0, 2), 16);
            let g = parseInt(hex.substr(2, 2), 16);
            let b = parseInt(hex.substr(4, 2), 16);
            r = Math.max(0, r - 40);
            g = Math.max(0, g - 40);
            b = Math.max(0, b - 40);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (color.startsWith('rgb')) {
            const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                let r = Math.max(0, parseInt(match[1]) - 40);
                let g = Math.max(0, parseInt(match[2]) - 40);
                let b = Math.max(0, parseInt(match[3]) - 40);
                return `rgb(${r}, ${g}, ${b})`;
            }
        }
        return color;
    }

    showMixAnimation() {
        const liquid = document.getElementById('beaker-liquid');
        liquid.style.transition = 'fill 0.5s ease';

        // Bubble burst effect
        this.createBubbles(10);
    }

    clearBeaker() {
        this.beakerSolutions = [];
        this.currentPH = 7.0;
        this.currentColor = '#22c55e';
        this.updateDisplay();
    }

    updateDisplay() {
        // Update liquid gradient
        const stop1 = document.getElementById('liquid-stop-1');
        const stop2 = document.getElementById('liquid-stop-2');
        if (stop1 && stop2) {
            stop1.style.stopColor = this.currentColor;
            stop2.style.stopColor = this.darkenColor(this.currentColor);
        }

        // Update beaker glow
        const beakerContainer = document.getElementById('beaker-container');
        if (beakerContainer) {
            beakerContainer.style.setProperty('--glow-color', this.currentColor.replace(')', ', 0.4)').replace('rgb', 'rgba'));
        }

        // Update pH meter glow
        const phMeter = document.getElementById('ph-meter');
        if (phMeter) {
            const glowColor = this.currentColor.includes('rgb')
                ? this.currentColor.replace(')', ', 0.3)').replace('rgb', 'rgba')
                : this.currentColor + '4d';
            phMeter.style.setProperty('--glow-color', glowColor);
        }

        // Update pH value
        const phValue = document.getElementById('ph-value');
        phValue.textContent = this.currentPH.toFixed(1);
        phValue.style.color = this.currentColor;

        // Update pH indicator position
        const indicator = document.getElementById('ph-indicator');
        const percentage = (this.currentPH / 14) * 100;
        indicator.style.top = `${percentage}%`;

        // Update pH marker on scale
        const marker = document.getElementById('ph-marker');
        marker.style.left = `${(this.currentPH / 14) * 100}%`;


        // Update solution info - show mixture
        const infoDiv = document.getElementById('solution-info');
        if (this.beakerSolutions.length === 0) {
            infoDiv.innerHTML = `
                <p class="font-bold text-white text-lg mb-2">Empty Beaker</p>
                <p class="text-sm leading-relaxed">Click solutions to add them to the beaker!</p>
            `;
        } else if (this.beakerSolutions.length === 1) {
            const sol = this.beakerSolutions[0];
            infoDiv.innerHTML = `
                <p class="font-bold text-white text-lg mb-2">${sol.name} (${sol.amount}x)</p>
                <p class="text-sm leading-relaxed">${sol.info}</p>
            `;
        } else {
            const mixList = this.beakerSolutions.map(s => `${s.name} (${s.amount}x)`).join(', ');
            infoDiv.innerHTML = `
                <p class="font-bold text-white text-lg mb-2">Mixture</p>
                <p class="text-sm leading-relaxed mb-2">${mixList}</p>
                <p class="text-xs text-[#637588]">Combined pH: ${this.currentPH.toFixed(2)}</p>
            `;
        }

        // Update type display
        const typeDisplay = document.getElementById('type-display');
        let type, typeColor, typeDesc;

        if (this.currentPH < 7) {
            type = 'ACIDIC';
            typeColor = 'text-red-400';
            typeDesc = 'More H⁺ ions than OH⁻';
        } else if (this.currentPH > 7) {
            type = 'BASIC';
            typeColor = 'text-purple-400';
            typeDesc = 'More OH⁻ ions than H⁺';
        } else {
            type = 'NEUTRAL';
            typeColor = 'text-green-400';
            typeDesc = 'Equal H⁺ and OH⁻ ions';
        }

        typeDisplay.innerHTML = `
            <div class="text-3xl font-black ${typeColor} mb-2">${type}</div>
            <p class="text-[#9da6b9] text-sm">${typeDesc}</p>
        `;

        // Update beaker contents list
        this.updateBeakerContents();
    }

    updateBeakerContents() {
        const container = document.getElementById('beaker-contents');
        if (!container) return;

        if (this.beakerSolutions.length === 0) {
            container.innerHTML = '<p class="text-[#637588] text-sm text-center">Beaker is empty</p>';
        } else {
            container.innerHTML = this.beakerSolutions.map(sol => `
                <div class="flex items-center justify-between p-2 rounded-lg bg-[#282e39]">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full" style="background: ${sol.color}"></div>
                        <span class="text-sm">${sol.name}</span>
                    </div>
                    <span class="text-xs text-[#9da6b9]">${sol.amount}x</span>
                </div>
            `).join('');
        }
    }

    createBubbles(count = 5) {
        const container = document.getElementById('bubbles-container');

        for (let i = 0; i < count; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'absolute rounded-full bg-white/30';
            const size = Math.random() * 8 + 4;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${40 + Math.random() * 120}px`;
            bubble.style.bottom = `${20 + Math.random() * 50}px`;
            bubble.style.animation = `rise ${2 + Math.random() * 2}s ease-out forwards`;
            container.appendChild(bubble);

            // Remove after animation
            setTimeout(() => bubble.remove(), 4000);
        }

        // Add keyframes if not exists
        if (!document.getElementById('bubble-style')) {
            const style = document.createElement('style');
            style.id = 'bubble-style';
            style.textContent = `
                @keyframes rise {
                    0% { transform: translateY(0); opacity: 0.7; }
                    100% { transform: translateY(-150px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    bindEvents() {
        // Clear button
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearBeaker());
        }
    }
}

// Initialize simulation
document.addEventListener('DOMContentLoaded', () => {
    new PHScaleSimulation();
});

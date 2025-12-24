/**
 * pH Scale Simulation
 * Visualizes pH values and ion concentrations for various solutions
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
        this.currentSolution = solutions.find(s => s.name === 'Pure Water');
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
            if (solution.name === this.currentSolution.name) {
                btn.classList.add('active');
            }
            btn.innerHTML = `
                <div class="w-4 h-4 rounded-full" style="background: ${solution.color}"></div>
                <span>${solution.name}</span>
                <span class="ml-auto text-sm text-[#9da6b9]">${solution.ph}</span>
            `;
            btn.addEventListener('click', () => this.selectSolution(solution));
            container.appendChild(btn);
        });
    }

    selectSolution(solution) {
        this.currentSolution = solution;

        // Update button states
        document.querySelectorAll('.solution-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        this.updateDisplay();
    }

    updateDisplay() {
        const solution = this.currentSolution;

        // Update liquid color
        document.getElementById('beaker-liquid').setAttribute('fill', solution.color);

        // Update pH value
        const phValue = document.getElementById('ph-value');
        phValue.textContent = solution.ph.toFixed(1);
        phValue.style.color = solution.color;

        // Update pH indicator position (0-14 scale, inverted for top-to-bottom)
        const indicator = document.getElementById('ph-indicator');
        const percentage = (solution.ph / 14) * 100;
        indicator.style.top = `${percentage}%`;

        // Update pH marker on scale
        const marker = document.getElementById('ph-marker');
        marker.style.left = `${(solution.ph / 14) * 100}%`;

        // Update ion counts
        const hConcentration = Math.pow(10, -solution.ph);
        const ohConcentration = Math.pow(10, -(14 - solution.ph));

        document.getElementById('h-count').textContent = `10⁻${solution.ph.toFixed(0)} M`;
        document.getElementById('oh-count').textContent = `10⁻${(14 - solution.ph).toFixed(0)} M`;

        // Update solution info
        document.getElementById('solution-info').innerHTML = `
            <p class="font-bold text-white text-lg mb-2">${solution.name}</p>
            <p class="text-sm leading-relaxed">${solution.info}</p>
        `;

        // Update type display
        const typeDisplay = document.getElementById('type-display');
        let type, typeColor, typeDesc;

        if (solution.ph < 7) {
            type = 'ACIDIC';
            typeColor = 'text-red-400';
            typeDesc = 'More H⁺ ions than OH⁻';
        } else if (solution.ph > 7) {
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

        // Create bubbles effect
        this.createBubbles();
    }

    createBubbles() {
        const container = document.getElementById('bubbles-container');
        container.innerHTML = '';

        const numBubbles = Math.floor(Math.random() * 5) + 3;

        for (let i = 0; i < numBubbles; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'absolute rounded-full bg-white/30';
            const size = Math.random() * 8 + 4;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${40 + Math.random() * 120}px`;
            bubble.style.bottom = `${20 + Math.random() * 50}px`;
            bubble.style.animation = `rise ${2 + Math.random() * 2}s ease-out forwards`;
            container.appendChild(bubble);
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
        // Solution buttons are bound during render
    }
}

// Initialize simulation
document.addEventListener('DOMContentLoaded', () => {
    new PHScaleSimulation();
});

/**
 * RaseLab - Gas Laws Interactive Simulation
 * Particle simulation with real-time physics and graph visualization
 */

// State variables
let currentLaw = 'boyle';
let pressure = 1;      // atm
let volume = 10;       // L
let temperature = 300; // K
let moles = 1;         // mol
const R = 0.0821;      // Gas constant L·atm/(mol·K)

// Particle system
let particles = [];
const particleCount = 30;
let gasChamber, graphCanvas, graphCtx;
let animationId;

// Graph data
let graphData = [];
const maxGraphPoints = 50;

// Law configurations
const lawConfig = {
    boyle: {
        title: "Boyle's Law",
        formula: 'P₁V₁ = P₂V₂',
        description: 'At constant temperature, pressure and volume are inversely proportional.',
        graphTitle: 'P-V Graph (Boyle)',
        graphX: 'V (L)',
        graphY: 'P (atm)',
        controls: {
            pressure: true,
            volume: false,
            temperature: false,
            moles: false
        },
        info: `<p class="mb-3"><strong class="text-white">Boyle's Law (1662):</strong> Discovered by Robert Boyle.</p>
               <p class="mb-3">At constant temperature, pressure and volume of an ideal gas are inversely proportional. As pressure increases, volume decreases.</p>
               <p><strong class="text-teal-400">Example:</strong> When you compress air in a syringe, volume decreases and pressure increases.</p>`
    },
    charles: {
        title: "Charles's Law",
        formula: 'V₁/T₁ = V₂/T₂',
        description: 'At constant pressure, volume is directly proportional to temperature.',
        graphTitle: 'V-T Graph (Charles)',
        graphX: 'T (K)',
        graphY: 'V (L)',
        controls: {
            pressure: false,
            volume: false,
            temperature: true,
            moles: false
        },
        info: `<p class="mb-3"><strong class="text-white">Charles's Law (1787):</strong> Discovered by Jacques Charles.</p>
               <p class="mb-3">At constant pressure, volume of an ideal gas is directly proportional to absolute temperature.</p>
               <p><strong class="text-teal-400">Example:</strong> A hot air balloon expands and rises as the air heats up.</p>`
    },
    'gay-lussac': {
        title: "Gay-Lussac's Law",
        formula: 'P₁/T₁ = P₂/T₂',
        description: 'At constant volume, pressure is directly proportional to temperature.',
        graphTitle: 'P-T Graph (Gay-Lussac)',
        graphX: 'T (K)',
        graphY: 'P (atm)',
        controls: {
            pressure: false,
            volume: false,
            temperature: true,
            moles: false
        },
        info: `<p class="mb-3"><strong class="text-white">Gay-Lussac's Law (1809):</strong> Discovered by Joseph Louis Gay-Lussac.</p>
               <p class="mb-3">At constant volume, pressure of an ideal gas is directly proportional to absolute temperature.</p>
               <p><strong class="text-teal-400">Example:</strong> Pressure inside a tire increases as the air heats up.</p>`
    },
    ideal: {
        title: 'Ideal Gas Law',
        formula: 'PV = nRT',
        description: 'Describes the relationship between pressure, volume, moles, and temperature.',
        graphTitle: 'PV vs nRT Graph',
        graphX: 'nRT',
        graphY: 'PV',
        controls: {
            pressure: true,
            volume: true,
            temperature: true,
            moles: true
        },
        info: `<p class="mb-3"><strong class="text-white">Ideal Gas Law:</strong> A general equation combining all gas laws.</p>
               <p class="mb-3">PV = nRT, where R = 0.0821 L·atm/(mol·K) is the universal gas constant.</p>
               <p class="mb-3"><strong class="text-purple-400">P:</strong> Pressure (atm), <strong class="text-blue-400">V:</strong> Volume (L), <strong class="text-green-400">n:</strong> Moles, <strong class="text-orange-400">T:</strong> Temperature (K)</p>
               <p><strong class="text-teal-400">Note:</strong> Real gases behave close to ideal at low pressure and high temperature.</p>`
    }
};

document.addEventListener('DOMContentLoaded', () => {
    gasChamber = document.getElementById('gas-chamber');
    graphCanvas = document.getElementById('graph-canvas');
    graphCtx = graphCanvas.getContext('2d');

    // Set canvas size
    graphCanvas.width = graphCanvas.offsetWidth;
    graphCanvas.height = 200;

    initParticles();
    initControls();
    initLawTabs();
    updateSimulation();
    animate();
});

function initParticles() {
    particles = [];
    const chamberRect = gasChamber.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * 180 + 10,
            y: Math.random() * 200 + 10,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: 6,
            color: getRandomColor()
        });
    }
}

function getRandomColor() {
    const colors = [
        '#14b8a6', '#06b6d4', '#22d3ee', '#67e8f9',
        '#2dd4bf', '#5eead4', '#a7f3d0', '#6ee7b7'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function initControls() {
    const pressureSlider = document.getElementById('pressure-slider');
    const volumeSlider = document.getElementById('volume-slider');
    const temperatureSlider = document.getElementById('temperature-slider');
    const molesSlider = document.getElementById('moles-slider');

    pressureSlider.addEventListener('input', (e) => {
        pressure = parseFloat(e.target.value);
        document.getElementById('pressure-value').textContent = `${pressure.toFixed(2)} atm`;

        if (currentLaw === 'boyle') {
            // Calculate new volume based on Boyle's law (P1V1 = P2V2)
            const initialPV = 10; // Initial P*V constant
            volume = initialPV / pressure;
            document.getElementById('volume-slider').value = volume;
            document.getElementById('volume-value').textContent = `${volume.toFixed(2)} L`;
        }

        updateSimulation();
    });

    volumeSlider.addEventListener('input', (e) => {
        volume = parseFloat(e.target.value);
        document.getElementById('volume-value').textContent = `${volume.toFixed(2)} L`;

        if (currentLaw === 'ideal') {
            // For ideal gas, we can calculate pressure
            pressure = (moles * R * temperature) / volume;
            document.getElementById('pressure-slider').value = Math.min(3, Math.max(0.5, pressure));
            document.getElementById('pressure-value').textContent = `${pressure.toFixed(2)} atm`;
        }

        updateSimulation();
    });

    temperatureSlider.addEventListener('input', (e) => {
        temperature = parseFloat(e.target.value);
        document.getElementById('temperature-value').textContent = `${temperature.toFixed(0)} K`;

        if (currentLaw === 'charles') {
            // Calculate new volume based on Charles's law (V1/T1 = V2/T2)
            const initialVT = 10 / 300; // Initial V/T constant
            volume = initialVT * temperature;
            document.getElementById('volume-value').textContent = `${volume.toFixed(2)} L`;
        } else if (currentLaw === 'gay-lussac') {
            // Calculate new pressure based on Gay-Lussac's law (P1/T1 = P2/T2)
            const initialPT = 1 / 300; // Initial P/T constant
            pressure = initialPT * temperature;
            document.getElementById('pressure-value').textContent = `${pressure.toFixed(2)} atm`;
        }

        updateSimulation();
    });

    molesSlider.addEventListener('input', (e) => {
        moles = parseFloat(e.target.value);
        document.getElementById('moles-value').textContent = `${moles.toFixed(2)} mol`;
        updateSimulation();
    });
}

function initLawTabs() {
    document.querySelectorAll('.law-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.law-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentLaw = tab.dataset.law;

            // Reset values
            pressure = 1;
            volume = 10;
            temperature = 300;
            moles = 1;
            graphData = [];

            // Update sliders
            document.getElementById('pressure-slider').value = pressure;
            document.getElementById('volume-slider').value = volume;
            document.getElementById('temperature-slider').value = temperature;
            document.getElementById('moles-slider').value = moles;
            document.getElementById('pressure-value').textContent = `${pressure.toFixed(2)} atm`;
            document.getElementById('volume-value').textContent = `${volume.toFixed(2)} L`;
            document.getElementById('temperature-value').textContent = `${temperature.toFixed(0)} K`;
            document.getElementById('moles-value').textContent = `${moles.toFixed(2)} mol`;

            updateLawUI();
            updateSimulation();
        });
    });
}

function updateLawUI() {
    const config = lawConfig[currentLaw];

    // Update formula display
    document.getElementById('formula-display').textContent = config.formula;
    document.getElementById('formula-description').textContent = config.description;

    // Update graph title
    document.getElementById('graph-title').textContent = config.graphTitle;

    // Update law info
    document.getElementById('law-info').innerHTML = config.info;

    // Update control visibility
    const controls = config.controls;

    document.getElementById('pressure-control').style.opacity = controls.pressure ? '1' : '0.5';
    document.getElementById('pressure-slider').disabled = !controls.pressure;

    document.getElementById('volume-control').style.opacity = controls.volume || currentLaw === 'boyle' || currentLaw === 'charles' ? '1' : '0.5';
    document.getElementById('volume-slider').disabled = currentLaw !== 'ideal';

    document.getElementById('temperature-control').style.opacity = controls.temperature ? '1' : '0.5';
    document.getElementById('temperature-slider').disabled = !controls.temperature;

    if (controls.moles) {
        document.getElementById('moles-control').classList.remove('hidden');
    } else {
        document.getElementById('moles-control').classList.add('hidden');
    }
}

function updateSimulation() {
    // Update piston position based on volume
    const piston = document.getElementById('piston');
    const maxHeight = 260;
    const minHeight = 50;
    const volumeRatio = (volume - 3) / (20 - 3);
    const chamberHeight = minHeight + volumeRatio * (maxHeight - minHeight);

    piston.style.top = `${300 - chamberHeight - 32}px`;
    gasChamber.style.height = `${chamberHeight}px`;

    // Update labels
    document.getElementById('volume-label').textContent = `V = ${volume.toFixed(1)} L`;
    document.getElementById('pressure-label').textContent = `P = ${pressure.toFixed(2)} atm`;

    // Update calculation result
    updateCalculation();

    // Add point to graph
    addGraphPoint();
    drawGraph();
}

function updateCalculation() {
    const calc = document.getElementById('calculation-result');

    switch (currentLaw) {
        case 'boyle':
            const pv = pressure * volume;
            calc.textContent = `P × V = ${pressure.toFixed(2)} × ${volume.toFixed(2)} = ${pv.toFixed(2)} L·atm = constant`;
            break;
        case 'charles':
            const vt = volume / temperature;
            calc.textContent = `V / T = ${volume.toFixed(2)} / ${temperature.toFixed(0)} = ${vt.toFixed(4)} L/K = constant`;
            break;
        case 'gay-lussac':
            const pt = pressure / temperature;
            calc.textContent = `P / T = ${pressure.toFixed(2)} / ${temperature.toFixed(0)} = ${pt.toFixed(5)} atm/K = constant`;
            break;
        case 'ideal':
            const pvLeft = pressure * volume;
            const nrtRight = moles * R * temperature;
            calc.innerHTML = `PV = ${pvLeft.toFixed(2)} L·atm<br>nRT = ${moles.toFixed(2)} × 0.0821 × ${temperature.toFixed(0)} = ${nrtRight.toFixed(2)} L·atm`;
            break;
    }
}

function addGraphPoint() {
    let x, y;

    switch (currentLaw) {
        case 'boyle':
            x = volume;
            y = pressure;
            break;
        case 'charles':
            x = temperature;
            y = volume;
            break;
        case 'gay-lussac':
            x = temperature;
            y = pressure;
            break;
        case 'ideal':
            x = moles * R * temperature;
            y = pressure * volume;
            break;
    }

    graphData.push({ x, y });
    if (graphData.length > maxGraphPoints) {
        graphData.shift();
    }
}

function drawGraph() {
    const ctx = graphCtx;
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    const padding = 40;

    // Clear canvas
    ctx.fillStyle = '#282e39';
    ctx.fillRect(0, 0, width, height);

    if (graphData.length < 2) return;

    // Find data range
    const xValues = graphData.map(p => p.x);
    const yValues = graphData.map(p => p.y);
    const xMin = Math.min(...xValues) * 0.9;
    const xMax = Math.max(...xValues) * 1.1;
    const yMin = Math.min(...yValues) * 0.9;
    const yMax = Math.max(...yValues) * 1.1;

    // Draw axes
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw axis labels
    const config = lawConfig[currentLaw];
    ctx.fillStyle = '#9da6b9';
    ctx.font = '12px Space Grotesk';
    ctx.fillText(config.graphX, width - padding + 5, height - padding + 5);
    ctx.fillText(config.graphY, padding - 30, padding - 10);

    // Draw grid lines
    ctx.strokeStyle = '#3f4756';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 5; i++) {
        const y = padding + (height - 2 * padding) * i / 5;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // Draw data points and line
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    graphData.forEach((point, i) => {
        const x = padding + (point.x - xMin) / (xMax - xMin) * (width - 2 * padding);
        const y = height - padding - (point.y - yMin) / (yMax - yMin) * (height - 2 * padding);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#14b8a6';
    graphData.forEach(point => {
        const x = padding + (point.x - xMin) / (xMax - xMin) * (width - 2 * padding);
        const y = height - padding - (point.y - yMin) / (yMax - yMin) * (height - 2 * padding);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Highlight last point
    if (graphData.length > 0) {
        const last = graphData[graphData.length - 1];
        const x = padding + (last.x - xMin) / (xMax - xMin) * (width - 2 * padding);
        const y = height - padding - (last.y - yMin) / (yMax - yMin) * (height - 2 * padding);

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 184, 166, 0.3)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#14b8a6';
        ctx.fill();
    }
}

function animate() {
    const chamberRect = gasChamber.getBoundingClientRect();
    const chamberWidth = gasChamber.offsetWidth;
    const chamberHeight = gasChamber.offsetHeight;

    // Speed based on temperature
    const speedMultiplier = temperature / 300;

    // Update particles
    particles.forEach(p => {
        // Update position
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Bounce off walls
        if (p.x - p.radius < 0) {
            p.x = p.radius;
            p.vx = Math.abs(p.vx);
        } else if (p.x + p.radius > chamberWidth) {
            p.x = chamberWidth - p.radius;
            p.vx = -Math.abs(p.vx);
        }

        if (p.y - p.radius < 0) {
            p.y = p.radius;
            p.vy = Math.abs(p.vy);
        } else if (p.y + p.radius > chamberHeight) {
            p.y = chamberHeight - p.radius;
            p.vy = -Math.abs(p.vy);
        }

        // Add some randomness to simulate molecular motion
        p.vx += (Math.random() - 0.5) * 0.2;
        p.vy += (Math.random() - 0.5) * 0.2;

        // Limit velocity
        const maxVel = 6 * speedMultiplier;
        const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (vel > maxVel) {
            p.vx = (p.vx / vel) * maxVel;
            p.vy = (p.vy / vel) * maxVel;
        }
    });

    // Render particles
    renderParticles();

    animationId = requestAnimationFrame(animate);
}

function renderParticles() {
    // Clear existing particles
    const existingParticles = gasChamber.querySelectorAll('.particle');
    existingParticles.forEach(p => p.remove());

    // Draw new particles
    particles.forEach(p => {
        const div = document.createElement('div');
        div.className = 'particle';
        div.style.left = `${p.x - p.radius}px`;
        div.style.top = `${p.y - p.radius}px`;
        div.style.width = `${p.radius * 2}px`;
        div.style.height = `${p.radius * 2}px`;
        div.style.backgroundColor = p.color;
        div.style.boxShadow = `0 0 ${10 * (temperature / 300)}px ${p.color}`;
        gasChamber.appendChild(div);
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    graphCanvas.width = graphCanvas.offsetWidth;
    drawGraph();
});

// Initialize law UI on load
updateLawUI();

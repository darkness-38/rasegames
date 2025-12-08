// Oyun Değişkenleri
let score = 0;
let clickPower = 1;
let passiveIncome = 0;
let totalClicks = 0;

// DOM Elementleri
const scoreElement = document.getElementById('score');
const cpsElement = document.getElementById('cps');
const clickBtn = document.getElementById('click-btn');
const upgradesContainer = document.getElementById('upgrades-container');
const clickUpgradesContainer = document.getElementById('click-upgrades-container');
const achievementsContainer = document.getElementById('achievements-container');
const notification = document.getElementById('achievement-notification');
const notificationText = document.getElementById('achievement-text');

// Yükseltme Verileri (Rase Tech Theme)
const upgrades = [
    { id: 'script', name: 'Script', type: 'cps', baseCost: 25, currentCost: 25, power: 0.2, count: 0, icon: '📜' },
    { id: 'mouse_fix', name: 'Mouse Fix', type: 'click', baseCost: 100, currentCost: 100, power: 0.5, count: 0, icon: '🖱️' },
    { id: 'server', name: 'Server Node', type: 'cps', baseCost: 250, currentCost: 250, power: 1.5, count: 0, icon: '💻' },
    { id: 'cpu_boost', name: 'CPU Boost', type: 'click', baseCost: 500, currentCost: 500, power: 1.5, count: 0, icon: '⚡' },
    { id: 'bot', name: 'AI Bot', type: 'cps', baseCost: 750, currentCost: 750, power: 4, count: 0, icon: '🤖' },
    { id: 'data_center', name: 'Data Center', type: 'cps', baseCost: 2500, currentCost: 2500, power: 10, count: 0, icon: '🏢' },
    { id: 'gpu_rig', name: 'GPU Rig', type: 'click', baseCost: 3500, currentCost: 3500, power: 5, count: 0, icon: '📼' },
    { id: 'blockchain', name: 'Blockchain', type: 'cps', baseCost: 10000, currentCost: 10000, power: 30, count: 0, icon: '🔗' },
    { id: 'quantum', name: 'Quantum PC', type: 'cps', baseCost: 40000, currentCost: 40000, power: 100, count: 0, icon: '⚛️' },
    { id: 'metaverse', name: 'Metaverse', type: 'cps', baseCost: 200000, currentCost: 200000, power: 250, count: 0, icon: '🌐' },

    // Pasif Yükseltmeler (High Tier)
    { id: 'satellite', name: 'Uydu Ağı', type: 'cps', baseCost: 50000, currentCost: 50000, power: 150, count: 0, icon: '🛰️' },
    { id: 'dysonsphere', name: 'Dyson Küresi', type: 'cps', baseCost: 150000, currentCost: 150000, power: 400, count: 0, icon: '🌞' },
    { id: 'agi', name: 'Yapay Süper Zeka', type: 'cps', baseCost: 500000, currentCost: 500000, power: 1200, count: 0, icon: '🧠' },
    { id: 'galactic_hub', name: 'Galaktik Merkez', type: 'cps', baseCost: 2000000, currentCost: 2000000, power: 5000, count: 0, icon: '🌌' },

    // Tıklama Güçlendirmeleri
    { id: 'energy_drink', name: 'Enerji İçeceği', type: 'click', baseCost: 7500, currentCost: 7500, power: 20, count: 0, icon: '🥤' },
    { id: 'mechanical_kb', name: 'Mekanik Klavye', type: 'click', baseCost: 25000, currentCost: 25000, power: 50, count: 0, icon: '⌨️' },
    { id: 'fiber_optic', name: 'Fiber Optik', type: 'click', baseCost: 100000, currentCost: 100000, power: 200, count: 0, icon: '🚥' },
    { id: 'neural_link', name: 'Neural Link', type: 'click', baseCost: 1000000, currentCost: 1000000, power: 1000, count: 0, icon: '🔗' }
];

// Başarım Verileri
const achievements = [
    { id: 'first_click', name: 'Hello World', desc: 'İlk tokenini kazan.', reward: 10, condition: () => totalClicks >= 1, unlocked: false, icon: '👋' },
    { id: 'beginner_coder', name: 'Acemi Kodcu', desc: '100 token biriktir.', reward: 100, condition: () => score >= 100, unlocked: false, icon: '🤓' },
    { id: 'server_admin', name: 'Server Admin', desc: 'Bir Server Node satın al.', reward: 200, condition: () => upgrades.find(u => u.id === 'server').count >= 1, unlocked: false, icon: '👨‍💻' },
    { id: 'click_master', name: 'Tıklama Ustası', desc: '1000 kez tıkla.', reward: 500, condition: () => totalClicks >= 1000, unlocked: false, icon: '🖱️' },
    { id: 'rich_dev', name: 'Zengin Dev', desc: '10,000 token biriktir.', reward: 1000, condition: () => score >= 10000, unlocked: false, icon: '💰' },
    { id: 'tech_mogul', name: 'Teknoloji Devi', desc: 'Saniyede 100 token kazan.', reward: 2000, condition: () => passiveIncome >= 100, unlocked: false, icon: '👑' },
    { id: 'power_user', name: 'Power User', desc: 'Tıklama gücünü 10 yap.', reward: 1500, condition: () => clickPower >= 10, unlocked: false, icon: '💪' },
    { id: 'safe_keeper', name: 'Yedekleme Uzmanı', desc: 'Oyunu ilk kez manuel kaydet.', reward: 5, condition: () => false, unlocked: false, icon: '💾' }
];

// Başlangıç
function init() {
    renderUpgrades();
    renderAchievements();
    updateUI();
    createFireflies();

    // Oyun Döngüsü
    setInterval(() => {
        score += passiveIncome;
        updateUI();
        checkAchievements();
    }, 1000);

    // UI Güncellemesi
    setInterval(() => {
        checkUpgradeAvailability();
    }, 100);
}

// Tıklama Olayı
clickBtn.addEventListener('click', (e) => {
    score += clickPower;
    totalClicks++;
    createClickEffect(e);
    updateUI();
    checkAchievements();
});

// Tab Değiştirme
window.switchTab = function (tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.panel-content').forEach(panel => panel.style.display = 'none');

    if (tabName === 'upgrades') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('upgrades-section').style.display = 'block';
    } else if (tabName === 'click-upgrades') {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('click-upgrades-section').style.display = 'block';
    } else {
        document.querySelector('.tab-btn:nth-child(3)').classList.add('active');
        document.getElementById('achievements-section').style.display = 'block';
    }
};

// Tıklama Efekti (Parçacıklar ve +Puan)
function createClickEffect(e) {
    // 1. Standart "+1" yazısı
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.innerText = `+${clickPower}`;

    const rect = clickBtn.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top + rect.height / 2);
    const randomX = (Math.random() - 0.5) * 60;

    effect.style.left = `${x + randomX}px`;
    effect.style.top = `${y - 40}px`;

    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 800);

    // 2. Parçacık Efekti
    createParticleEffect(e);
}

function createParticleEffect(e) {
    const particleCount = 5 + Math.floor(Math.random() * 5);
    const icons = ['💎', '✨', '🚀', '⚡'];

    const rect = clickBtn.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top + rect.height / 2);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.innerText = icons[Math.floor(Math.random() * icons.length)];

        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

// Yükseltmeleri Listele
function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    clickUpgradesContainer.innerHTML = '';

    upgrades.forEach((upgrade, index) => {
        const card = document.createElement('div');
        card.className = `upgrade-card disabled ${upgrade.type}-upgrade`;
        card.id = `upgrade-${index}`;
        card.onclick = () => buyUpgrade(index);

        const powerText = upgrade.type === 'cps' ? `+${upgrade.power}/sn` : `+${upgrade.power} Tık`;
        const typeColor = upgrade.type === 'cps' ? '#8ab4f8' : '#e8eaed';

        card.innerHTML = `
            <div class="upgrade-icon" style="font-size: 2.5rem; margin-right: 15px;">${upgrade.icon}</div>
            <div class="upgrade-info" style="flex: 1;">
                <h3>${upgrade.name}</h3>
                <p class="upgrade-cost">${Math.floor(upgrade.currentCost)} 💎</p>
                <p style="font-size: 0.8rem; color: ${typeColor}; font-weight: bold;">${powerText}</p>
            </div>
            <div class="upgrade-count" id="count-${index}">${upgrade.count}</div>
        `;

        if (upgrade.type === 'cps') {
            upgradesContainer.appendChild(card);
        } else {
            clickUpgradesContainer.appendChild(card);
        }
    });
}

// Başarımları Listele (İlerleme Çubuklu)
function renderAchievements() {
    achievementsContainer.innerHTML = '';
    achievements.forEach(ach => {
        const card = document.createElement('div');
        card.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
        card.id = `ach-${ach.id}`;

        let progress = ach.unlocked ? 100 : 0;
        if (!ach.unlocked) {
            if (ach.id === 'first_click') progress = (totalClicks / 1) * 100;
            if (ach.id === 'click_master') progress = (totalClicks / 1000) * 100;
            if (ach.id === 'beginner_coder') progress = (score / 100) * 100;
            if (ach.id === 'rich_dev') progress = (score / 10000) * 100;
        }
        progress = Math.min(100, Math.max(0, progress));

        card.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-info" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>${ach.name}</h3>
                    <span style="font-size: 0.7rem; color: #888;">${Math.floor(progress)}%</span>
                </div>
                <p class="achievement-desc">${ach.desc}</p>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                </div>
                <p style="font-size: 0.8rem; color: #ff9800; font-weight: bold; margin-top: 5px;">Ödül: ${ach.reward} 💎</p>
            </div>
        `;
        achievementsContainer.appendChild(card);
    });
}

// Başarım Kontrolü
function checkAchievements() {
    let newUnlock = false;
    achievements.forEach(ach => {
        if (!ach.unlocked && ach.condition()) {
            ach.unlocked = true;
            score += ach.reward;
            showNotification(ach.name, ach.reward);
            updateAchievementCard(ach.id);
            updateUI();
            newUnlock = true;
        }
    });
}

function updateAchievementCard(id) {
    renderAchievements();
}

function showNotification(name, reward) {
    notificationText.innerHTML = `${name}<br><span style="font-size: 0.8rem; color: #ffd700;">+${reward} Rase</span>`;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Yükseltme Satın Alma
function buyUpgrade(index) {
    const upgrade = upgrades[index];
    if (score >= upgrade.currentCost) {
        score -= upgrade.currentCost;
        upgrade.count++;

        if (upgrade.type === 'cps') {
            passiveIncome += upgrade.power;
        } else if (upgrade.type === 'click') {
            clickPower += upgrade.power;
        }

        upgrade.currentCost = Math.ceil(upgrade.currentCost * 1.15);

        updateUI();
        renderUpgrades();
        checkAchievements();
    }
}

// UI Güncelleme
function updateUI() {
    scoreElement.innerText = Math.floor(score);
    cpsElement.innerText = passiveIncome.toFixed(1);
    document.title = `${Math.floor(score)} Rase - Rase Clicker`;
}

// Yükseltme Erişilebilirliği Kontrolü
function checkUpgradeAvailability() {
    upgrades.forEach((upgrade, index) => {
        const card = document.getElementById(`upgrade-${index}`);
        if (card) {
            if (score >= upgrade.currentCost) {
                card.classList.remove('disabled');
            } else {
                card.classList.add('disabled');
            }
        }
    });
}

// Rastgele Gerçekler
const randomFacts = [
    "İlk bilgisayar faresi ahşaptan yapılmıştı. 🪵",
    "Kodlama hatalarına 'bug' denmesinin sebebi gerçek bir böcektir. 🪲",
    "İnternetin %90'ı Deep Web'dedir. 🌐",
    "İlk alan adı symbolics.com'dur. 🏷️",
    "Google'ın ilk adı 'BackRub' idi. 🔍",
    "Her ay 5000'den fazla yeni bilgisayar virüsü yazılıyor. 🦠",
    "Rase Games en iyi oyunları yapar! 🚀",
    "NASA'nın interneti saniyede 91 GB hızındadır. 🚀",
    "QWERTY klavye daktilo sıkışmalarını önlemek için tasarlandı. ⌨️",
    "İlk web kamerası bir kahve makinesini izlemek için kuruldu. ☕"
];

function updateTicker() {
    const tickerText = document.getElementById('fact-text');
    const randomFact = randomFacts[Math.floor(Math.random() * randomFacts.length)];
    tickerText.innerText = randomFact;
}

// Ateş Böcekleri (Data Packetleri?)
function createFireflies() {
    const container = document.getElementById('fireflies-container');
    if (!container) return;
    const fireflyCount = 20;

    for (let i = 0; i < fireflyCount; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';

        const startY = Math.random() * 100;
        const delay = Math.random() * 20;
        const duration = 15 + Math.random() * 10;

        firefly.style.top = `${startY}vh`;
        firefly.style.left = `-${Math.random() * 10}vw`;
        firefly.style.animationDuration = `${duration}s`;
        firefly.style.animationDelay = `${delay}s`;

        container.appendChild(firefly);
    }
}

// Oyunu Başlat
init();
updateTicker();
setInterval(updateTicker, 15000);

// --- Kayıt Sistemi (IndexedDB) ---

let db;
const DB_NAME = 'RaseClickerDB'; // DB Adı değişti
const DB_VERSION = 1;
const STORE_NAME = 'gameState';

// Veritabanını Başlat
function initDB() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
        console.error("Veritabanı hatası:", event.target.errorCode);
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log("Veritabanı başarıyla açıldı.");
        loadGame(); // Oyun açılınca verileri yükle
    };
}

// Oyunu Kaydet
function saveGame() {
    if (!db) return;

    const gameState = {
        id: 'player1',
        score: score,
        clickPower: clickPower,
        passiveIncome: passiveIncome,
        totalClicks: totalClicks,
        upgrades: upgrades,
        achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
        milestones: milestones.map(m => ({ score: m.score, reached: m.reached }))
    };

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(gameState);

    request.onsuccess = () => {
        console.log("Oyun otomatik kaydedildi.");
    };
}

// Manuel Kayıt Butonu İçin
window.saveGameManual = function () {
    saveGame();

    const ach = achievements.find(a => a.id === 'safe_keeper');
    if (ach && !ach.unlocked) {
        ach.unlocked = true;
        score += ach.reward;
        showNotification(ach.name, ach.reward);
        updateAchievementCard(ach.id);
        updateUI();
        saveGame();
    } else {
        showNotification("Oyun Kaydedildi", 0);
    }
};

// Oyunu Yükle
function loadGame() {
    if (!db) return;

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('player1');

    request.onsuccess = (event) => {
        const data = event.target.result;
        if (data) {
            score = data.score || 0;
            clickPower = data.clickPower || 1;
            passiveIncome = data.passiveIncome || 0;
            totalClicks = data.totalClicks || 0;

            // Yükseltmeleri Geri Yükle
            if (data.upgrades) {
                data.upgrades.forEach((savedUpgrade, index) => {
                    if (upgrades[index]) {
                        upgrades[index].count = savedUpgrade.count;
                        upgrades[index].currentCost = savedUpgrade.currentCost;
                    }
                });
            }

            // Başarımları Geri Yükle
            if (data.achievements) {
                data.achievements.forEach(savedAch => {
                    const ach = achievements.find(a => a.id === savedAch.id);
                    if (ach) {
                        ach.unlocked = savedAch.unlocked;
                    }
                });
            }

            // Milestone'ları Geri Yükle
            if (data.milestones) {
                data.milestones.forEach(savedMs => {
                    const ms = milestones.find(m => m.score === savedMs.score);
                    if (ms) {
                        ms.reached = savedMs.reached;
                    }
                });
            }

            updateUI();
            renderUpgrades();
            renderAchievements();
            console.log("Oyun verileri yüklendi.");
        }
    };
}

initDB();
setInterval(saveGame, 30000);

// --- Rastgele Olaylar (Golden Packet) ---

function spawnGoldenOnion() {
    const onion = document.createElement('div');
    onion.className = 'golden-onion';
    onion.innerText = '🎁'; // Hediye Kutusu

    // Rastgele Konum
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    onion.style.left = `${x}px`;
    onion.style.top = `${y}px`;

    onion.onclick = () => {
        const reward = Math.max(500, passiveIncome * 60);
        score += reward;
        showNotification("Bonus Paket!", Math.floor(reward));
        createParticleEffect({ clientX: x + 20, clientY: y + 20 });
        updateUI();
        onion.remove();
    };

    document.body.appendChild(onion);

    setTimeout(() => {
        if (document.body.contains(onion)) {
            onion.remove();
        }
    }, 10000);

    scheduleNextGoldenOnion();
}

function scheduleNextGoldenOnion() {
    const minTime = 60000;
    const maxTime = 180000;
    const randomTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    setTimeout(spawnGoldenOnion, randomTime);
}

scheduleNextGoldenOnion();

// --- Dönüm Noktası Olayları ---

const milestones = [
    { score: 1000, reached: false, event: 'data_surge', message: "1,000 Token! Veri Akışı Hızlandı!" },
    { score: 10000, reached: false, event: 'system_overdrive', message: "10,000 Token! Sistem Overdrive!" },
    { score: 50000, reached: false, event: 'singularity', message: "50,000 Token! Tekillik Başlıyor!" }
];

function checkMilestones() {
    milestones.forEach(ms => {
        if (!ms.reached && score >= ms.score) {
            ms.reached = true;
            showNotification(ms.message, 0);
            triggerEvent(ms.event);
            saveGame();
        }
    });
}

function triggerEvent(eventName) {
    if (eventName === 'data_surge') {
        triggerOnionRain(); // Efekt aynı kalabilir ama ikon 1/0 olabilir
    } else if (eventName === 'system_overdrive') {
        triggerOgreRoar(); // Shake efekti
    } else if (eventName === 'singularity') {
        triggerSwampParty(); // Konfeti
    }
}

function triggerOnionRain() {
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const onion = document.createElement('div');
            onion.className = 'falling-onion';
            onion.innerText = Math.random() > 0.5 ? '1' : '0'; // Matrix tarzı
            onion.style.color = '#0f0';
            onion.style.left = Math.random() * 100 + 'vw';
            onion.style.animationDuration = (Math.random() * 2 + 2) + 's';
            document.body.appendChild(onion);
            setTimeout(() => onion.remove(), 4000);
        }, i * 100);
    }
}

function triggerOgreRoar() {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);

    // Tıklama gücünü 2 katına çıkar
    const originalPower = clickPower;
    clickPower *= 2;
    showNotification("Overdrive Aktif! Tıklama 2x!", 0);

    setTimeout(() => {
        clickPower = originalPower;
        showNotification("Overdrive Bitti.", 0);
    }, 30000);
}

function triggerSwampParty() {
    // Konfeti
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'falling-onion';
            confetti.innerText = ['✨', '🚀', '💎'][Math.floor(Math.random() * 3)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }, i * 50);
    }

    // Üretimi 2 katına çıkar
    const originalPassive = passiveIncome;
    const originalClick = clickPower;

    passiveIncome *= 2;
    clickPower *= 2;

    showNotification("Tekillik! Her Şey 2x!", 0);

    setTimeout(() => {
        passiveIncome = originalPassive;
        clickPower = originalClick;
        showNotification("Tekillik Sona Erdi.", 0);
    }, 60000);
}

setInterval(checkMilestones, 1000);

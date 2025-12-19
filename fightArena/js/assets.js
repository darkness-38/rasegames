// ===================================
// ASSET MANAGER
// Loads and manages game images and sprites
// ===================================

const assets = {
    images: {},
    loaded: 0,
    total: 0,
    onValid: null
};

// Image paths
const imagePaths = {
    // Backgrounds
    'bg_dojo': 'assets/backgrounds/dojo.png',
    'bg_cyber': 'assets/backgrounds/cyber.png',
    'bg_volcano': 'assets/backgrounds/volcano.png'
};

function loadAssets(callback) {
    assets.onValid = callback;
    const paths = Object.keys(imagePaths);
    assets.total = paths.length;

    if (assets.total === 0) {
        if (assets.onValid) assets.onValid();
        return;
    }

    paths.forEach(key => {
        const img = new Image();
        img.src = imagePaths[key];

        img.onload = () => {
            assets.images[key] = img;
            assets.loaded++;
            console.log(`Loaded asset: ${key}`);
            checkAllLoaded();
        };

        img.onerror = () => {
            console.error(`Failed to load asset: ${key}`);
            assets.loaded++; // Count as loaded to avoid hanging
            checkAllLoaded();
        };
    });
}

function checkAllLoaded() {
    if (assets.loaded >= assets.total) {
        console.log('All assets loaded!');
        if (assets.onValid) assets.onValid();
    }
}

function getImage(key) {
    return assets.images[key];
}

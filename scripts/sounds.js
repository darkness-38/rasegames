










const SoundSystem = (function () {
    let audioContext = null;
    let isMuted = false;
    const loadedSounds = {};
    const masterVolume = 0.5;


    const SOUND_FILES = {

        click: '/assets/sounds/click.mp3',
        start: '/assets/sounds/start.mp3',
        gameover: '/assets/sounds/gameover.mp3',


        eat: '/assets/sounds/eat.mp3',


        upgrade: '/assets/sounds/upgrade.mp3',
        achievement: '/assets/sounds/achievement.mp3',
        coin: '/assets/sounds/collect.mp3',


        jump: '/assets/sounds/jump.mp3',
        collect: '/assets/sounds/collect.mp3',
        crash: '/assets/sounds/crash.mp3',


        cyber_background: '/assets/sounds/cyber_background.mp3'
    };


    function init() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        preloadSounds();
    }


    async function preloadSounds() {
        for (const [name, path] of Object.entries(SOUND_FILES)) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    loadedSounds[name] = await audioContext.decodeAudioData(arrayBuffer);
                }
            } catch (e) {

            }
        }
    }


    function playBuffer(buffer, volume = 1) {
        if (!audioContext || isMuted) return;
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        source.buffer = buffer;
        gain.gain.value = volume * masterVolume;
        source.connect(gain);
        gain.connect(audioContext.destination);
        source.start(0);
    }





    function synthBeep(freq = 440, duration = 0.1, type = 'square', volume = 0.3) {
        if (!audioContext || isMuted) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume * masterVolume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + duration);
    }

    function synthNoise(duration = 0.1, volume = 0.2) {
        if (!audioContext || isMuted) return;
        const bufferSize = audioContext.sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        source.buffer = buffer;
        gain.gain.setValueAtTime(volume * masterVolume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        source.connect(gain);
        gain.connect(audioContext.destination);
        source.start();
    }





    function play(name) {
        init();


        if (loadedSounds[name]) {
            playBuffer(loadedSounds[name]);
            return;
        }


        switch (name) {
            case 'click':
                synthBeep(800, 0.05, 'square', 0.2);
                break;
            case 'start':
                synthBeep(440, 0.1, 'sine', 0.3);
                setTimeout(() => synthBeep(660, 0.1, 'sine', 0.3), 100);
                setTimeout(() => synthBeep(880, 0.15, 'sine', 0.3), 200);
                break;
            case 'eat':
                synthBeep(600, 0.08, 'sine', 0.25);
                break;
            case 'upgrade':
                synthBeep(400, 0.1, 'sine', 0.25);
                setTimeout(() => synthBeep(600, 0.1, 'sine', 0.25), 80);
                setTimeout(() => synthBeep(800, 0.15, 'sine', 0.25), 160);
                break;
            case 'achievement':
                synthBeep(523, 0.1, 'sine', 0.3);
                setTimeout(() => synthBeep(659, 0.1, 'sine', 0.3), 100);
                setTimeout(() => synthBeep(784, 0.1, 'sine', 0.3), 200);
                setTimeout(() => synthBeep(1047, 0.2, 'sine', 0.3), 300);
                break;
            case 'coin':
                synthBeep(1200, 0.08, 'sine', 0.2);
                synthBeep(1600, 0.06, 'sine', 0.15);
                break;
            case 'jump':
                synthBeep(200, 0.15, 'sawtooth', 0.15);
                break;
            case 'collect':
                synthBeep(880, 0.06, 'sine', 0.2);
                setTimeout(() => synthBeep(1100, 0.06, 'sine', 0.2), 50);
                break;
            case 'crash':
                synthNoise(0.3, 0.4);
                synthBeep(100, 0.3, 'sawtooth', 0.3);
                break;
            case 'gameover':
                synthBeep(400, 0.15, 'square', 0.25);
                setTimeout(() => synthBeep(300, 0.15, 'square', 0.25), 150);
                setTimeout(() => synthBeep(200, 0.3, 'square', 0.25), 300);
                break;
            default:
                synthBeep(440, 0.1, 'sine', 0.2);
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        return isMuted;
    }

    function setMute(muted) {
        isMuted = muted;
    }


    document.addEventListener('click', init, { once: true });
    document.addEventListener('keydown', init, { once: true });
    document.addEventListener('touchstart', init, { once: true });

    return {
        play,
        toggleMute,
        setMute,
        get isMuted() { return isMuted; }
    };
})();


const playSound = SoundSystem.play;

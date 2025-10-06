// Audio Manager using Web Audio API
const AudioManager = {
    audioContext: null,
    masterVolume: 0.3,

    // Initialize audio context (must be triggered by user interaction)
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    // Create an oscillator node with frequency and duration
    createOscillator(frequency, duration, type = 'sine', volume = 1) {
        if (!this.audioContext) this.init();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.value = this.masterVolume * volume;

        return { oscillator, gainNode, duration };
    },

    // Play a sequence of notes
    playSequence(notes) {
        if (!this.audioContext) this.init();

        let startTime = this.audioContext.currentTime;

        notes.forEach(note => {
            const { oscillator, gainNode, duration } = this.createOscillator(
                note.frequency,
                note.duration,
                note.type || 'sine',
                note.volume || 1
            );

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);

            // Fade out to prevent clicks
            gainNode.gain.setValueAtTime(this.masterVolume * (note.volume || 1), startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            startTime += duration;
        });
    },

    // Sound: Correct answer (cheerful ascending notes)
    playCorrectSound(speed = 'medium') {
        const speeds = {
            fast: [
                { frequency: 523.25, duration: 0.08, type: 'sine', volume: 0.8 },  // C5
                { frequency: 659.25, duration: 0.08, type: 'sine', volume: 0.8 },  // E5
                { frequency: 783.99, duration: 0.08, type: 'sine', volume: 0.8 },  // G5
                { frequency: 1046.50, duration: 0.15, type: 'sine', volume: 1.0 }  // C6
            ],
            medium: [
                { frequency: 523.25, duration: 0.1, type: 'sine', volume: 0.7 },   // C5
                { frequency: 659.25, duration: 0.1, type: 'sine', volume: 0.7 },   // E5
                { frequency: 783.99, duration: 0.2, type: 'sine', volume: 0.8 }    // G5
            ],
            slow: [
                { frequency: 440.00, duration: 0.15, type: 'sine', volume: 0.6 },  // A4
                { frequency: 523.25, duration: 0.2, type: 'sine', volume: 0.7 }    // C5
            ]
        };

        this.playSequence(speeds[speed] || speeds.medium);
    },

    // Sound: Wrong answer (descending error sound)
    playWrongSound() {
        this.playSequence([
            { frequency: 392.00, duration: 0.15, type: 'square', volume: 0.5 },  // G4
            { frequency: 329.63, duration: 0.15, type: 'square', volume: 0.5 },  // E4
            { frequency: 261.63, duration: 0.25, type: 'square', volume: 0.6 }   // C4
        ]);
    },

    // Sound: Zombie movement (low ominous tone)
    playZombieMove() {
        this.playSequence([
            { frequency: 110.00, duration: 0.2, type: 'sawtooth', volume: 0.4 },  // A2
            { frequency: 98.00, duration: 0.15, type: 'sawtooth', volume: 0.3 }   // G2
        ]);
    },

    // Sound: Zombie attack (dramatic harsh sound)
    playZombieAttack() {
        this.playSequence([
            { frequency: 82.41, duration: 0.1, type: 'sawtooth', volume: 0.6 },   // E2
            { frequency: 65.41, duration: 0.15, type: 'sawtooth', volume: 0.7 },  // C2
            { frequency: 55.00, duration: 0.3, type: 'sawtooth', volume: 0.8 },   // A1
            { frequency: 41.20, duration: 0.4, type: 'sawtooth', volume: 0.9 }    // E1
        ]);
    },

    // Sound: Zombie eating (gross squelching/crunching sounds)
    playZombieEating() {
        console.log('playZombieEating called!');

        if (!this.audioContext) {
            console.log('Audio context missing, initializing...');
            this.init();
        }

        if (!this.audioContext) {
            console.error('Failed to initialize audio context!');
            return;
        }

        console.log('Playing zombie eating sound! Audio context state:', this.audioContext.state);

        // Resume if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('Audio context resumed');
            });
        }

        const startTime = this.audioContext.currentTime;
        console.log('Start time:', startTime);

        try {
            // Create multiple layers of gross sounds
            // Layer 1: Low wet squelching (using filtered noise)
            this.createSquelchSound(startTime, 0.7);
            this.createSquelchSound(startTime + 0.2, 0.8);
            this.createSquelchSound(startTime + 0.4, 0.7);

            // Layer 2: Crunching bones (using harsh sawtooth bursts)
            this.createCrunchSound(startTime + 0.15, 0.6);
            this.createCrunchSound(startTime + 0.35, 0.7);
            this.createCrunchSound(startTime + 0.55, 0.6);

            // Layer 3: Gross slurping/tearing sounds
            this.createTearSound(startTime + 0.25, 0.65);
            this.createTearSound(startTime + 0.5, 0.7);

            console.log('All eating sounds scheduled successfully');
        } catch (error) {
            console.error('Error creating eating sounds:', error);
        }
    },

    // Helper: Create squelching sound using noise
    createSquelchSound(startTime, volume) {
        if (!this.audioContext) {
            console.error('createSquelchSound: no audio context');
            return;
        }

        console.log('Creating squelch sound at', startTime, 'volume', volume);
        const bufferSize = this.audioContext.sampleRate * 0.15;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate filtered noise for wet sound
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400 + Math.random() * 200;
        filter.Q.value = 5;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(this.masterVolume * volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noise.start(startTime);
        noise.stop(startTime + 0.15);
    },

    // Helper: Create bone crunching sound
    createCrunchSound(startTime, volume) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, startTime + 0.08);

        gainNode.gain.setValueAtTime(this.masterVolume * volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.08);
    },

    // Helper: Create tearing/slurping sound
    createTearSound(startTime, volume) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200 + Math.random() * 100, startTime);
        oscillator.frequency.linearRampToValueAtTime(100, startTime + 0.12);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * volume, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.12);
    },

    // Sound: Game victory (triumphant fanfare)
    playVictorySound() {
        this.playSequence([
            { frequency: 523.25, duration: 0.15, type: 'sine', volume: 0.8 },    // C5
            { frequency: 659.25, duration: 0.15, type: 'sine', volume: 0.8 },    // E5
            { frequency: 783.99, duration: 0.15, type: 'sine', volume: 0.8 },    // G5
            { frequency: 1046.50, duration: 0.2, type: 'sine', volume: 0.9 },    // C6
            { frequency: 1318.51, duration: 0.3, type: 'sine', volume: 1.0 }     // E6
        ]);
    },

    // Sound: Button click (subtle UI feedback)
    playClickSound() {
        this.playSequence([
            { frequency: 800, duration: 0.05, type: 'sine', volume: 0.3 }
        ]);
    },

    // Sound: Number pad input
    playNumberSound() {
        this.playSequence([
            { frequency: 600, duration: 0.04, type: 'sine', volume: 0.25 }
        ]);
    },

    // Background music control
    backgroundMusic: {
        isPlaying: false,
        loopTimeout: null
    },

    // Start zombie-themed background music (creepy melody loop)
    startBackgroundMusic() {
        if (this.backgroundMusic.isPlaying) return;
        if (!this.audioContext) this.init();

        this.backgroundMusic.isPlaying = true;
        this.playZombieMelodyLoop();
    },

    // Play a creepy zombie-themed melody that loops
    playZombieMelodyLoop() {
        if (!this.backgroundMusic.isPlaying) return;

        // Spooky minor melody with zombie shuffle rhythm
        const melody = [
            // Phrase 1 - creeping closer
            { frequency: 220.00, duration: 0.4, type: 'triangle', volume: 0.25 },  // A3
            { frequency: 246.94, duration: 0.4, type: 'triangle', volume: 0.22 },  // B3
            { frequency: 261.63, duration: 0.6, type: 'triangle', volume: 0.28 },  // C4
            { frequency: 246.94, duration: 0.4, type: 'triangle', volume: 0.22 },  // B3

            // Phrase 2 - tension
            { frequency: 220.00, duration: 0.8, type: 'triangle', volume: 0.25 },  // A3
            { frequency: 196.00, duration: 0.4, type: 'triangle', volume: 0.23 },  // G3
            { frequency: 174.61, duration: 0.8, type: 'triangle', volume: 0.26 },  // F3

            // Phrase 3 - building dread
            { frequency: 220.00, duration: 0.4, type: 'triangle', volume: 0.25 },  // A3
            { frequency: 246.94, duration: 0.4, type: 'triangle', volume: 0.22 },  // B3
            { frequency: 293.66, duration: 0.6, type: 'triangle', volume: 0.24 },  // D4
            { frequency: 261.63, duration: 0.4, type: 'triangle', volume: 0.23 },  // C4

            // Phrase 4 - resolve to minor
            { frequency: 220.00, duration: 1.2, type: 'triangle', volume: 0.28 },  // A3 (long note)
        ];

        // Add low drone bass note for atmosphere
        const bassDrone = { frequency: 110.00, duration: 7.0, type: 'sine', volume: 0.15 }; // A2

        // Play bass drone
        this.playBackgroundNote(bassDrone, 0);

        // Play melody
        this.playSequence(melody);

        // Loop after melody completes (approximately 7 seconds)
        this.backgroundMusic.loopTimeout = setTimeout(() => {
            this.playZombieMelodyLoop();
        }, 7200);
    },

    // Play a single background note (helper for drone)
    playBackgroundNote(note, startOffset = 0) {
        if (!this.audioContext) return;

        const { oscillator, gainNode } = this.createOscillator(
            note.frequency,
            note.duration,
            note.type || 'sine',
            note.volume || 0.5
        );

        const startTime = this.audioContext.currentTime + startOffset;
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);

        gainNode.gain.setValueAtTime(this.masterVolume * note.volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
    },

    // Stop background music
    stopBackgroundMusic() {
        if (!this.backgroundMusic.isPlaying) return;

        this.backgroundMusic.isPlaying = false;

        // Clear the loop timeout
        if (this.backgroundMusic.loopTimeout) {
            clearTimeout(this.backgroundMusic.loopTimeout);
            this.backgroundMusic.loopTimeout = null;
        }
    },

    // Set master volume (0.0 to 1.0)
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
};

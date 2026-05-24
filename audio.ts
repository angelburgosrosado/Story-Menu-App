/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Global AudioContext holder to prevent multi-instancing
let globalAudioCtx: AudioContext | null = null;

// Ambient Soundtrack Ref
let soundtrackInterval: NodeJS.Timeout | null = null;
let soundtrackSynth: { oscs: any[]; filter: any; gain: any } | null = null;
let currentPlaylist: number[][] = [];
let noteIndex = 0;

// Speech Node holder
let activeSpeechSource: AudioBufferSourceNode | null = null;
let speechCallbackTimer: NodeJS.Timeout | null = null;

function getAudioCtx(): AudioContext {
    if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume();
    }
    return globalAudioCtx;
}

/**
 * Procedural SFX Syntheses
 */
export const playLaserSFX = () => {
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.3);
    } catch (e) {
        console.warn("SFX failed", e);
    }
};

export const playPunchSFX = () => {
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
    } catch (e) {
         console.warn("SFX failed", e);
    }
};

export const playSparkleSFX = () => {
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.linearRampToValueAtTime(1600, now + 0.25);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1205, now);
        osc2.frequency.linearRampToValueAtTime(1595, now + 0.25);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
    } catch (e) {
        console.warn("SFX failed", e);
    }
};

export const playExplosionSFX = () => {
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        
        // Generate noise buffer
        const bufferSize = ctx.sampleRate * 0.8; // 0.8 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(5, now);
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(10, now + 0.7);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.75);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.8);
    } catch (e) {
        console.warn("SFX failed", e);
    }
};

export const playPageTurnSFX = () => {
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        
        // Soft white noise swipe
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.25);
    } catch (e) {
        console.warn("SFX failed", e);
    }
};

/**
 * Procedural Endless Soundtrack Synth
 */
export const startProceduralSoundtrack = (genre: string) => {
    try {
        stopProceduralSoundtrack();
        
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        
        // 1. Establish Chord Progressions based on Genre
        let chords = [
            [130.81, 155.56, 196.00, 246.94], // C Minor 7 (Spooky / Drama)
            [146.83, 174.61, 220.00, 277.18], // D Minor Major 7
            [116.54, 138.59, 174.61, 220.00]  // A# Minor (Dark Sci-Fi / Apocalypse)
        ];
        
        const isAction = genre.includes("Action") || genre.includes("Sci-Fi") || genre.includes("Apocalypse") || genre.includes("Noir");
        const isLight = genre.includes("Comedy") || genre.includes("Slice") || genre.includes("Teen") || genre.includes("Fantasy");
        
        if (isLight) {
            chords = [
                [130.81, 164.81, 196.00, 261.63], // C Major 7 (Wholesome)
                [146.83, 185.00, 220.00, 293.66], // D Major 7
                [174.61, 220.00, 261.63, 349.23], // F Major 7
                [196.00, 246.94, 293.66, 392.00]  // G Major 7
            ];
        } else if (isAction) {
            chords = [
                [73.42, 87.31, 110.00, 146.83], // D Minor Heavy Bass
                [82.41, 98.00, 123.47, 164.81], // E Minor Heavy
                [65.41, 77.78, 98.00, 130.81]   // C Major Bass
            ];
        }
        
        currentPlaylist = chords;
        noteIndex = 0;
        
        // 2. Setup Synth Route
        const oscs: any[] = [];
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();
        
        filter.type = isAction ? 'sawtooth' as BiquadFilterType : 'lowpass';
        if (isAction) {
            filter.type = 'lowpass';
            filter.frequency.value = 800;
        } else if (isLight) {
            filter.frequency.value = 1200;
        } else {
             // Dark Drone Lowpass
             filter.frequency.value = 400;
        }
        
        gainNode.gain.setValueAtTime(0.04, now); // Quiet ambient volume
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        soundtrackSynth = { oscs, filter, gain: gainNode };
        
        // 3. Clock loop (Step arpeggio)
        const tempo = isAction ? 200 : 350; // faster for action, slow pads for horror/drama
        
        const playStep = () => {
            const ctxState = getAudioCtx();
            const tick = ctxState.currentTime;
            
            // Clear dead oscillators
            soundtrackSynth?.oscs.forEach((osc, i) => {
                if (osc.stopTime && tick > osc.stopTime) {
                     soundtrackSynth?.oscs.splice(i, 1);
                }
            });
            
            const currentChord = currentPlaylist[Math.floor(noteIndex / 8) % currentPlaylist.length];
            const baseNote = currentChord[noteIndex % currentChord.length];
            
            // Add a sub-bass root node + melody lead
            const nodes = [baseNote];
            if (noteIndex % 4 === 0) {
                 nodes.push(baseNote / 2); // oct down
            }
            if (isAction && noteIndex % 2 === 1) {
                 nodes.push(baseNote * 1.5); // fifth harmony
            }
            
            nodes.forEach(freq => {
                const stepOsc = ctxState.createOscillator();
                const stepGain = ctxState.createGain();
                
                stepOsc.type = isLight ? 'sine' : 'triangle';
                if (isAction && Math.random() > 0.5) stepOsc.type = 'sawtooth';
                
                stepOsc.frequency.setValueAtTime(freq, tick);
                
                // Dynamic Filter resonant sweep
                if (noteIndex % 8 === 0) {
                     soundtrackSynth?.filter.frequency.exponentialRampToValueAtTime(isAction ? 1400 : 600, tick + 0.3);
                } else if (noteIndex % 8 === 4) {
                     soundtrackSynth?.filter.frequency.exponentialRampToValueAtTime(isLight ? 800 : 250, tick + 0.3);
                }
                
                stepGain.gain.setValueAtTime(0.02, tick);
                stepGain.gain.linearRampToValueAtTime(0.001, tick + (tempo / 1000) * 1.5);
                
                stepOsc.connect(stepGain);
                stepGain.connect(soundtrackSynth?.filter!);
                
                stepOsc.start(tick);
                const stopTime = tick + (tempo / 1000) * 1.5;
                stepOsc.stop(stopTime);
                
                // Track stop
                (stepOsc as any).stopTime = stopTime;
                soundtrackSynth?.oscs.push(stepOsc);
            });
            
            noteIndex++;
        };
        
        // Trigger initial
        playStep();
        soundtrackInterval = setInterval(playStep, tempo);
    } catch (e) {
        console.warn("Soundtrack initialization failed", e);
    }
};

export const stopProceduralSoundtrack = () => {
    if (soundtrackInterval) {
        clearInterval(soundtrackInterval);
        soundtrackInterval = null;
    }
    if (soundtrackSynth) {
        try {
            soundtrackSynth.gain.gain.linearRampToValueAtTime(0, getAudioCtx().currentTime + 0.2);
            setTimeout(() => {
                soundtrackSynth?.oscs.forEach(o => { try { o.stop(); } catch(e){} });
                soundtrackSynth = null;
            }, 250);
        } catch (e) {
            soundtrackSynth = null;
        }
    }
};

/**
 * 16-Bit Linear PCM Neural TTS Playback
 */
export const playNarratorTTS = async (
    base64PCM: string, 
    sampleRate: number = 24000, 
    onEnd: () => void,
    onVisualizerData?: (level: number) => void
) => {
    stopNarratorTTS();
    
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        
        // Decode base64 to flat bytes
        const binaryString = window.atob(base64PCM);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Convert to Float32 sampling
        const int16Array = new Int16Array(bytes.buffer);
        const audioBuffer = ctx.createBuffer(1, int16Array.length, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < int16Array.length; i++) {
            channelData[i] = int16Array[i] / 32768; // Float range -1.0 to 1.0
        }
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        
        // Add low-pass warm filter for classic radio / comic storytelling vibe
        const warmFilter = ctx.createBiquadFilter();
        warmFilter.type = 'peaking';
        warmFilter.frequency.value = 1000;
        warmFilter.Q.value = 1;
        warmFilter.gain.value = 2; // subtle boost
        
        const speechGain = ctx.createGain();
        speechGain.gain.setValueAtTime(0.8, now);
        
        source.connect(warmFilter);
        warmFilter.connect(speechGain);
        speechGain.connect(ctx.destination);
        
        activeSpeechSource = source;
        source.start(now);
        
        // Duration of audio
        const durationMs = (audioBuffer.length / sampleRate) * 1000;
        
        // Set up callback
        speechCallbackTimer = setTimeout(() => {
            onEnd();
            activeSpeechSource = null;
        }, durationMs + 200);

        // Simulation level visualizer for responsive speech level waves
        if (onVisualizerData) {
             let sliceIdx = 0;
             const interval = setInterval(() => {
                 if (!activeSpeechSource) {
                     clearInterval(interval);
                     return;
                 }
                 const chunkAmount = Math.floor(sampleRate * 0.1); // 100ms
                 let sum = 0;
                 let count = 0;
                 for (let k = 0; k < chunkAmount && (sliceIdx + k) < channelData.length; k++) {
                     sum += Math.abs(channelData[sliceIdx + k]);
                     count++;
                 }
                 sliceIdx += chunkAmount;
                 const avg = count > 0 ? (sum / count) * 100 : 0;
                 onVisualizerData(Math.min(100, Math.max(5, avg * 3.5)));
                 
                 if (sliceIdx >= channelData.length) {
                      clearInterval(interval);
                      onVisualizerData(0);
                 }
             }, 100);
        }
        
    } catch (e) {
        console.error("Narrator play failed", e);
        onEnd();
    }
};

export const stopNarratorTTS = () => {
    if (speechCallbackTimer) {
        clearTimeout(speechCallbackTimer);
        speechCallbackTimer = null;
    }
    if (activeSpeechSource) {
        try {
            activeSpeechSource.stop();
        } catch (e) {}
        activeSpeechSource = null;
    }
};

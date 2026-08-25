// Servicio Global de Efectos de Sonido
const audioCache: Record<string, HTMLAudioElement> = {};

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

// 1. Sonido rítmico y dinámico de radar / ruleta de avatares en 1v1
export const playSearchTickSound = (frequency: number = 720) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.6, ctx.currentTime + 0.045);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.045);
  } catch (e) {
    // Ignorar si falla
  }
};

// 2. Sonido de festejo / fanfarria breve para respuestas correctas (Acorde mayor brillante Do-Mi-Sol-Do)
export const playCelebrationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);

      gain.gain.setValueAtTime(0.001, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.065 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.065 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.41);
    });
  } catch (e) {
    // Ignorar si falla
  }
};

const soundFiles = {
  select: '/sounds/select.mp3',
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  intro: '/sounds/ntro-sound-1.mp3',
  projection: '/sounds/projection.mp3',
};

export const playGameSound = (type: keyof typeof soundFiles) => {
  try {
    const src = soundFiles[type];
    if (!src) return;

    if (!audioCache[type]) {
      audioCache[type] = new Audio(src);
      audioCache[type].volume = 0.7;
    }

    const audio = audioCache[type];
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback sintético inmediato si el audio del archivo está bloqueado o carga lento
        if (type === 'select') {
          playSearchTickSound(580);
        }
      });
    }
  } catch (e) {
    if (type === 'select') {
      playSearchTickSound(580);
    }
  }
};

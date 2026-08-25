import { getRankTier, RankTier, getOrCreateUserId } from './userProfile';
import { supabase } from '../supabaseClient';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  playerAvatar: string;
  playerCountry?: string;
  playerCountryFlag?: string;
  mode: string; // 'TRIVIA' | 'TABLERO_SOLO' | 'TABLERO_DUEL' | 'ONLINE'
  score: number; // Solo score o puntos
  rating: number; // Rating de habilidad ELO (1000 inicial)
  rankTitle: string; // Título de la categoría (ej: Guerrero de la Fe)
  rankIcon: string;
  accuracy: number;
  totalQuestions: number;
  correctQuestions: number;
  timeSeconds: number;
  turns?: number;
  difficulty?: string;
  timeCategory?: '5_MIN' | '10_MIN' | '15_MIN' | '20_MIN' | 'INFINITO' | string;
  tilesReached?: number;
  date: string;
}

export interface SoloScoreResult {
  baseScore: number;
  progressBonus: number;
  timeBonus: number;
  accuracyBonus: number;
  errorPenalty: number;
  turnsBonus: number;
  totalSoloScore: number;
  ratingDelta: number;
  newRating: number;
  rankTier: RankTier;
}

const LEADERBOARD_KEY = 'biblos_leaderboard_data';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'demo_1',
    playerName: 'Rey Salomón',
    playerAvatar: '/avatars/salomon.jpg',
    playerCountry: 'DO',
    playerCountryFlag: '🇩🇴',
    mode: 'TABLERO_SOLO',
    score: 4850,
    rating: 3150,
    rankTitle: 'Maestro de la Biblia',
    rankIcon: '👑',
    accuracy: 96,
    totalQuestions: 25,
    correctQuestions: 24,
    timeSeconds: 140,
    turns: 13,
    difficulty: 'AVANZADO',
    date: 'Ayer',
  },
  {
    id: 'demo_2',
    playerName: 'Profeta Daniel',
    playerAvatar: '/avatars/daniel.jpg',
    playerCountry: 'MX',
    playerCountryFlag: '🇲🇽',
    mode: 'TRIVIA',
    score: 4320,
    rating: 2820,
    rankTitle: 'Sabio de la Escritura',
    rankIcon: '🔥',
    accuracy: 94,
    totalQuestions: 30,
    correctQuestions: 28,
    timeSeconds: 165,
    difficulty: 'AVANZADO',
    date: 'Hoy',
  },
  {
    id: 'demo_3',
    playerName: 'Apóstol Pablo',
    playerAvatar: '/avatars/pablo.jpg',
    playerCountry: 'ES',
    playerCountryFlag: '🇪🇸',
    mode: 'ONLINE',
    score: 3950,
    rating: 2680,
    rankTitle: 'Sabio de la Escritura',
    rankIcon: '🔥',
    accuracy: 90,
    totalQuestions: 20,
    correctQuestions: 18,
    timeSeconds: 120,
    difficulty: 'INTERMEDIO',
    date: 'Hoy',
  },
  {
    id: 'demo_4',
    playerName: 'Reina Ester',
    playerAvatar: '/avatars/esther.jpg',
    playerCountry: 'CO',
    playerCountryFlag: '🇨🇴',
    mode: 'TABLERO_SOLO',
    score: 3600,
    rating: 2350,
    rankTitle: 'Siervo de la Verdad',
    rankIcon: '🏛️',
    accuracy: 88,
    totalQuestions: 16,
    correctQuestions: 14,
    timeSeconds: 150,
    turns: 15,
    difficulty: 'INTERMEDIO',
    date: 'Hace 2 días',
  },
  {
    id: 'demo_5',
    playerName: 'Débora la Jueza',
    playerAvatar: '/avatars/debora.jpg',
    playerCountry: 'AR',
    playerCountryFlag: '🇦🇷',
    mode: 'TRIVIA',
    score: 3200,
    rating: 1950,
    rankTitle: 'Guerrero de la Palabra',
    rankIcon: '⚔️',
    accuracy: 85,
    totalQuestions: 20,
    correctQuestions: 17,
    timeSeconds: 180,
    difficulty: 'INTERMEDIO',
    date: 'Hace 3 días',
  },
  {
    id: 'demo_6',
    playerName: 'Pedro el Pescador',
    playerAvatar: '/avatars/pedro.jpg',
    playerCountry: 'GT',
    playerCountryFlag: '🇬🇹',
    mode: 'TABLERO_SOLO',
    score: 2750,
    rating: 1620,
    rankTitle: 'Discípulo de la Fe',
    rankIcon: '🕊️',
    accuracy: 80,
    totalQuestions: 15,
    correctQuestions: 12,
    timeSeconds: 190,
    turns: 18,
    difficulty: 'PRINCIPIANTE',
    date: 'Hace 4 días',
  },
  {
    id: 'demo_7',
    playerName: 'Rey David',
    playerAvatar: '/avatars/david.jpg',
    playerCountry: 'DO',
    playerCountryFlag: '🇩🇴',
    mode: 'TABLERO_SOLO',
    score: 4100,
    rating: 2750,
    rankTitle: 'Sabio de la Escritura',
    rankIcon: '🔥',
    accuracy: 92,
    totalQuestions: 22,
    correctQuestions: 20,
    timeSeconds: 135,
    turns: 14,
    difficulty: 'AVANZADO',
    date: 'Hace 1 día',
  },
  {
    id: 'demo_8',
    playerName: 'Moisés el Libertador',
    playerAvatar: '/avatars/moises.jpg',
    playerCountry: 'PR',
    playerCountryFlag: '🇵🇷',
    mode: 'TRIVIA',
    score: 4500,
    rating: 2980,
    rankTitle: 'Sabio de la Escritura',
    rankIcon: '🔥',
    accuracy: 95,
    totalQuestions: 25,
    correctQuestions: 24,
    timeSeconds: 145,
    difficulty: 'AVANZADO',
    date: 'Hoy',
  },
  {
    id: 'demo_9',
    playerName: 'María Magdalena',
    playerAvatar: '/avatars/maria.jpg',
    playerCountry: 'US',
    playerCountryFlag: '🇺🇸',
    mode: 'ONLINE',
    score: 3400,
    rating: 2180,
    rankTitle: 'Guerrero de la Palabra',
    rankIcon: '⚔️',
    accuracy: 87,
    totalQuestions: 18,
    correctQuestions: 15,
    timeSeconds: 160,
    difficulty: 'INTERMEDIO',
    date: 'Ayer',
  },
  {
    id: 'demo_10',
    playerName: 'José de Egipto',
    playerAvatar: '/avatars/jose.jpg',
    playerCountry: 'CL',
    playerCountryFlag: '🇨🇱',
    mode: 'TABLERO_SOLO',
    score: 3800,
    rating: 2450,
    rankTitle: 'Siervo de la Verdad',
    rankIcon: '🏛️',
    accuracy: 91,
    totalQuestions: 20,
    correctQuestions: 18,
    timeSeconds: 130,
    turns: 12,
    difficulty: 'INTERMEDIO',
    date: 'Hace 2 días',
  },
  {
    id: 'demo_11',
    playerName: 'Josué el Conquistador',
    playerAvatar: '/avatars/josue.jpg',
    playerCountry: 'PE',
    playerCountryFlag: '🇵🇪',
    mode: 'TRIVIA',
    score: 3100,
    rating: 1880,
    rankTitle: 'Guerrero de la Palabra',
    rankIcon: '⚔️',
    accuracy: 84,
    totalQuestions: 20,
    correctQuestions: 16,
    timeSeconds: 175,
    difficulty: 'INTERMEDIO',
    date: 'Hace 3 días',
  },
  {
    id: 'demo_12',
    playerName: 'Rut la Fiel',
    playerAvatar: '/avatars/rut.jpg',
    playerCountry: 'VE',
    playerCountryFlag: '🇻🇪',
    mode: 'TABLERO_SOLO',
    score: 2900,
    rating: 1740,
    rankTitle: 'Discípulo de la Fe',
    rankIcon: '🕊️',
    accuracy: 82,
    totalQuestions: 16,
    correctQuestions: 13,
    timeSeconds: 185,
    turns: 16,
    difficulty: 'PRINCIPIANTE',
    date: 'Hace 3 días',
  },
  {
    id: 'demo_13',
    playerName: 'Nehemías el Edificador',
    playerAvatar: '/avatars/nehemias.jpg',
    playerCountry: 'EC',
    playerCountryFlag: '🇪🇨',
    mode: 'ONLINE',
    score: 3350,
    rating: 2120,
    rankTitle: 'Guerrero de la Palabra',
    rankIcon: '⚔️',
    accuracy: 86,
    totalQuestions: 19,
    correctQuestions: 16,
    timeSeconds: 155,
    difficulty: 'INTERMEDIO',
    date: 'Hace 4 días',
  },
  {
    id: 'demo_14',
    playerName: 'Elías el Profeta',
    playerAvatar: '/avatars/elias.jpg',
    playerCountry: 'CR',
    playerCountryFlag: '🇨🇷',
    mode: 'TRIVIA',
    score: 4200,
    rating: 2710,
    rankTitle: 'Sabio de la Escritura',
    rankIcon: '🔥',
    accuracy: 93,
    totalQuestions: 24,
    correctQuestions: 22,
    timeSeconds: 140,
    difficulty: 'AVANZADO',
    date: 'Ayer',
  },
  {
    id: 'demo_15',
    playerName: 'Sara de la Promesa',
    playerAvatar: '/avatars/sara.jpg',
    playerCountry: 'PA',
    playerCountryFlag: '🇵🇦',
    mode: 'TABLERO_SOLO',
    score: 2600,
    rating: 1580,
    rankTitle: 'Discípulo de la Fe',
    rankIcon: '🕊️',
    accuracy: 79,
    totalQuestions: 14,
    correctQuestions: 11,
    timeSeconds: 195,
    turns: 17,
    difficulty: 'PRINCIPIANTE',
    date: 'Hace 5 días',
  },
  {
    id: 'demo_16',
    playerName: 'Timoteo el Joven',
    playerAvatar: '/avatars/timoteo.jpg',
    playerCountry: 'HN',
    playerCountryFlag: '🇭🇳',
    mode: 'ONLINE',
    score: 2450,
    rating: 1480,
    rankTitle: 'Explorador Bíblico',
    rankIcon: '📖',
    accuracy: 77,
    totalQuestions: 15,
    correctQuestions: 11,
    timeSeconds: 200,
    difficulty: 'PRINCIPIANTE',
    date: 'Hace 5 días',
  },
  {
    id: 'demo_17',
    playerName: 'Lidia de Filipos',
    playerAvatar: '/avatars/lidia.jpg',
    playerCountry: 'SV',
    playerCountryFlag: '🇸🇻',
    mode: 'TRIVIA',
    score: 2300,
    rating: 1390,
    rankTitle: 'Explorador Bíblico',
    rankIcon: '📖',
    accuracy: 75,
    totalQuestions: 16,
    correctQuestions: 12,
    timeSeconds: 205,
    difficulty: 'PRINCIPIANTE',
    date: 'Hace 6 días',
  },
  {
    id: 'demo_18',
    playerName: 'Bernabé el Consolador',
    playerAvatar: '/avatars/bernabe.jpg',
    playerCountry: 'NI',
    playerCountryFlag: '🇳🇮',
    mode: 'TABLERO_SOLO',
    score: 2150,
    rating: 1290,
    rankTitle: 'Explorador Bíblico',
    rankIcon: '📖',
    accuracy: 73,
    totalQuestions: 14,
    correctQuestions: 10,
    timeSeconds: 210,
    turns: 19,
    difficulty: 'PRINCIPIANTE',
    date: 'Hace 6 días',
  },
  {
    id: 'demo_19',
    playerName: 'Priscila la Maestra',
    playerAvatar: '/avatars/priscila.jpg',
    playerCountry: 'BO',
    playerCountryFlag: '🇧🇴',
    mode: 'ONLINE',
    score: 3050,
    rating: 1820,
    rankTitle: 'Guerrero de la Palabra',
    rankIcon: '⚔️',
    accuracy: 83,
    totalQuestions: 18,
    correctQuestions: 14,
    timeSeconds: 170,
    difficulty: 'INTERMEDIO',
    date: 'Hace 4 días',
  },
  {
    id: 'demo_20',
    playerName: 'Aquila el Obrero',
    playerAvatar: '/avatars/aquila.jpg',
    playerCountry: 'PY',
    playerCountryFlag: '🇵🇾',
    mode: 'TRIVIA',
    score: 2850,
    rating: 1690,
    rankTitle: 'Discípulo de la Fe',
    rankIcon: '🕊️',
    accuracy: 81,
    totalQuestions: 17,
    correctQuestions: 13,
    timeSeconds: 180,
    difficulty: 'INTERMEDIO',
    date: 'Hace 5 días',
  },
  {
    id: 'demo_21',
    playerName: 'Lucas el Médico',
    playerAvatar: '/avatars/lucas.jpg',
    playerCountry: 'UY',
    playerCountryFlag: '🇺🇾',
    mode: 'TABLERO_SOLO',
    score: 3500,
    rating: 2280,
    rankTitle: 'Siervo de la Verdad',
    rankIcon: '🏛️',
    accuracy: 89,
    totalQuestions: 19,
    correctQuestions: 16,
    timeSeconds: 145,
    turns: 13,
    difficulty: 'INTERMEDIO',
    date: 'Ayer',
  },
  {
    id: 'demo_22',
    playerName: 'Marcos el Evangelista',
    playerAvatar: '/avatars/marcos.jpg',
    playerCountry: 'BR',
    playerCountryFlag: '🇧🇷',
    mode: 'ONLINE',
    score: 2700,
    rating: 1590,
    rankTitle: 'Discípulo de la Fe',
    rankIcon: '🕊️',
    accuracy: 78,
    totalQuestions: 15,
    correctQuestions: 11,
    timeSeconds: 190,
    difficulty: 'PRINCIPIANTE',
    date: 'Hace 3 días',
  },
  {
    id: 'demo_23',
    playerName: 'Esteban el Mártir',
    playerAvatar: '/avatars/esteban.jpg',
    playerCountry: 'CA',
    playerCountryFlag: '🇨🇦',
    mode: 'TRIVIA',
    score: 3700,
    rating: 2410,
    rankTitle: 'Siervo de la Verdad',
    rankIcon: '🏛️',
    accuracy: 90,
    totalQuestions: 20,
    correctQuestions: 17,
    timeSeconds: 135,
    difficulty: 'INTERMEDIO',
    date: 'Hace 2 días',
  },
  {
    id: 'demo_24',
    playerName: 'Felipe el Evangelista',
    playerAvatar: '/avatars/felipe.jpg',
    playerCountry: 'CU',
    playerCountryFlag: '🇨🇺',
    mode: 'TABLERO_SOLO',
    score: 2550,
    rating: 1530,
    rankTitle: 'Discípulo de la Fe',
    rankIcon: '🕊️',
    accuracy: 76,
    totalQuestions: 14,
    correctQuestions: 10,
    timeSeconds: 200,
    turns: 18,
    difficulty: 'PRINCIPIANTE',
    date: 'Hace 4 días',
  },
  {
    id: 'demo_25',
    playerName: 'Juan el Amado',
    playerAvatar: '/avatars/juan.jpg',
    playerCountry: 'IL',
    playerCountryFlag: '🇮🇱',
    mode: 'TRIVIA',
    score: 4700,
    rating: 3050,
    rankTitle: 'Maestro de la Biblia',
    rankIcon: '👑',
    accuracy: 95,
    totalQuestions: 26,
    correctQuestions: 25,
    timeSeconds: 140,
    difficulty: 'AVANZADO',
    date: 'Hoy',
  },
];

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (data) {
      const parsed: LeaderboardEntry[] = JSON.parse(data);
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading leaderboard', e);
  }
  return DEFAULT_LEADERBOARD;
};

export const fetchGlobalLeaderboardFromCloud = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return getLeaderboard();
    }

    const cloudEntries: LeaderboardEntry[] = data.map((row: any) => {
      const tier = getRankTier(row.rating || 1000);
      return {
        id: row.id,
        playerName: row.player_name,
        playerAvatar: row.player_avatar || '/avatars/david.jpg',
        playerCountry: row.player_country || 'DO',
        playerCountryFlag: row.player_country_flag || '🇩🇴',
        mode: row.mode || 'TABLERO_SOLO',
        score: row.score || 0,
        rating: row.rating || 1000,
        rankTitle: tier.title,
        rankIcon: tier.icon,
        accuracy: row.accuracy || 0,
        totalQuestions: 0,
        correctQuestions: 0,
        timeSeconds: row.time_seconds || 0,
        difficulty: row.difficulty || 'INTERMEDIO',
        date: new Date(row.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      };
    });

    // Guardar en caché local
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(cloudEntries));
    } catch (e) {}

    return cloudEntries;
  } catch (err) {
    console.warn('[SUPABASE] Usando leaderboard local offline:', err);
    return getLeaderboard();
  }
};

export const saveLeaderboardEntry = (
  entry: Omit<LeaderboardEntry, 'id' | 'date' | 'rankTitle' | 'rankIcon'> & Partial<Pick<LeaderboardEntry, 'rankTitle' | 'rankIcon'>>
): LeaderboardEntry[] => {
  const current = getLeaderboard();
  const rankTier = getRankTier(entry.rating || 1000);

  const newEntry: LeaderboardEntry = {
    ...entry,
    rating: entry.rating || 1000,
    rankTitle: rankTier.title,
    rankIcon: rankTier.icon,
    id: 'score_' + Date.now(),
    date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
  };

  const updated = [...current, newEntry].slice(0, 50); // Mantener top 50

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving leaderboard', e);
  }

  // Guardar en Supabase en segundo plano sin ralentizar el juego (Cloud Sync)
  setTimeout(async () => {
    try {
      const userId = getOrCreateUserId();
      await supabase.from('leaderboard').insert({
        user_id: userId,
        player_name: entry.playerName || 'Jugador Bíblico',
        player_avatar: entry.playerAvatar || '/avatars/david.jpg',
        player_country: entry.playerCountry || 'DO',
        player_country_flag: entry.playerCountryFlag || '🇩🇴',
        mode: entry.mode || 'TABLERO_SOLO',
        score: entry.score || 0,
        rating: entry.rating || 1000,
        accuracy: entry.accuracy || 0,
        difficulty: entry.difficulty || 'INTERMEDIO',
        time_seconds: entry.timeSeconds || 0,
      });
    } catch (e) {
      console.warn('[SUPABASE] Guardado en la nube pendiente (offline):', e);
    }
  }, 500);

  return updated;
};


/**
 * CÁLCULO CIENTÍFICO DE SOLO SCORE & CALIBRACIÓN DE RATING
 * Mide "Qué tan bueno es el jugador" evaluando Dificultad, Velocidad, Precisión, Aciertos y Errores.
 */
export const calculateSoloScore = (params: {
  correct: number;
  errors: number;
  difficulty: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | string;
  timeSeconds: number;
  turns?: number;
  tilesAdvanced?: number;
  completed: boolean;
  currentRating: number;
}): SoloScoreResult => {
  const { correct, errors, difficulty, timeSeconds, turns, tilesAdvanced = 0, completed, currentRating } = params;
  const total = correct + errors;

  // 1. VALOR POR DIFICULTAD
  let difficultyValue = 180;
  let difficultyMultiplier = 1.35;
  if (difficulty === 'PRINCIPIANTE') {
    difficultyValue = 100;
    difficultyMultiplier = 1.0;
  } else if (difficulty === 'INTERMEDIO') {
    difficultyValue = 180;
    difficultyMultiplier = 1.35;
  } else if (difficulty === 'AVANZADO') {
    difficultyValue = 280;
    difficultyMultiplier = 1.75;
  } else if (difficulty === 'MIXTO') {
    // MIXTO: Desafío equilibrado y representativo de todo el catálogo bíblico
    difficultyValue = 200;
    difficultyMultiplier = 1.45;
  }

  // 2. PUNTOS BASE = respuestas_correctas × valor_dificultad
  const baseScore = correct * difficultyValue;

  // 3. BONUS DE AVANCE EN EL TABLERO (ProgressBonus: Hasta +800 pts por llegar a la meta 75)
  const effectiveTiles = Math.min(75, Math.max(0, tilesAdvanced));
  const progressBonus = Math.round((effectiveTiles / 75) * 800 * difficultyMultiplier);

  // 4. BONUS DE PRECISIÓN (AccuracyBonus)
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  let accuracyBonus = 0;
  if (total >= 4) {
    if (accuracy === 100) accuracyBonus = 500;
    else if (accuracy >= 85) accuracyBonus = 300;
    else if (accuracy >= 70) accuracyBonus = 150;
    else if (accuracy >= 50) accuracyBonus = 50;
  }

  // 5. BONUS DE TIEMPO (TimeBonus - Menos tiempo = más puntos, requiere al menos 3 preguntas)
  let timeBonus = 0;
  if (total >= 3) {
    const avgTimePerQuestion = timeSeconds / total;
    // Si responde en promedio en menos de 15s
    if (avgTimePerQuestion < 15) {
      timeBonus = Math.round((15 - avgTimePerQuestion) * 15 * correct);
    }
  }

  // 6. PENALIZACIÓN POR ERRORES (ErrorPenalty)
  const errorPenalty = errors * 75;

  // 7. BONUS POR MENOR CANTIDAD DE TURNOS (en Tablero al completar)
  let turnsBonus = 0;
  if (completed && turns && turns > 0) {
    if (turns <= 14) turnsBonus = 500;
    else if (turns <= 18) turnsBonus = 300;
    else if (turns <= 24) turnsBonus = 150;
  }

  // PUNTUACIÓN FINAL DE SOLITARIO
  const totalSoloScore = Math.max(
    0,
    Math.round(baseScore + progressBonus + timeBonus + accuracyBonus + turnsBonus - errorPenalty)
  );

  // 8. CALIBRACIÓN DE RATING ELO DE HABILIDAD (Sube o baja según calidad real y avance)
  let ratingDelta = 0;
  if (completed || effectiveTiles >= 50) {
    if (accuracy >= 90) ratingDelta += Math.round(25 * difficultyMultiplier);
    else if (accuracy >= 75) ratingDelta += Math.round(18 * difficultyMultiplier);
    else if (accuracy >= 55) ratingDelta += Math.round(8 * difficultyMultiplier);
    else ratingDelta -= 8; // Rendimiento bajo
  } else {
    // Si no completó o tuvo bajo rendimiento
    if (accuracy < 50) ratingDelta -= 15;
    else ratingDelta -= 5;
  }

  // Bonus extra de rating si logró una partida impecable en Avanzado
  if (accuracy === 100 && difficulty === 'AVANZADO' && total >= 5) {
    ratingDelta += 15;
  }

  const newRating = Math.max(500, Math.round(currentRating + ratingDelta));
  const rankTier = getRankTier(newRating);

  return {
    baseScore,
    progressBonus,
    timeBonus,
    accuracyBonus,
    errorPenalty,
    turnsBonus,
    totalSoloScore,
    ratingDelta,
    newRating,
    rankTier,
  };
};

export const calculateFinalScore = (
  correct: number,
  total: number,
  accuracy: number,
  timeSeconds: number
): number => {
  const result = calculateSoloScore({
    correct,
    errors: Math.max(0, total - correct),
    difficulty: 'INTERMEDIO',
    timeSeconds,
    completed: true,
    currentRating: 1000,
  });
  return result.totalSoloScore;
};

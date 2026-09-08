import { Question, Period } from "../types";
import { getAllGameQuestions } from "./questionsService";
import { addTalents } from "./economyService";
import { getUserProfile, updateUserRating, recordAnswer, saveUserProfile, UserProfile, getRankTier } from "./userProfile";
import { saveLeaderboardEntry } from "./leaderboardService";

export interface DailyStreakRewardInfo {
  milestoneDays: number;
  bonusTalents: number;
  bonusRankingPoints: number;
  educationalTitle: string;
  biblicalMessage: string;
}

export const DAILY_STREAK_MILESTONES: Record<number, DailyStreakRewardInfo> = {
  3: {
    milestoneDays: 3,
    bonusTalents: 3,
    bonusRankingPoints: 5,
    educationalTitle: "Perseverancia de la Fe",
    biblicalMessage: "Has estudiado la Biblia durante 3 días consecutivos. ¡Tu mente se llena de Su sabiduría!",
  },
  7: {
    milestoneDays: 7,
    bonusTalents: 7,
    bonusRankingPoints: 12,
    educationalTitle: "Sembrador de la Verdad",
    biblicalMessage: "¡Una semana completa meditando en la Palabra! Has fortalecido tu espíritu 7 días seguidos.",
  },
  14: {
    milestoneDays: 14,
    bonusTalents: 14,
    bonusRankingPoints: 25,
    educationalTitle: "Discípulo Consagrado",
    biblicalMessage: "Has estudiado la Biblia durante 14 días consecutivos. La constancia produce fruto eterno.",
  },
  30: {
    milestoneDays: 30,
    bonusTalents: 30,
    bonusRankingPoints: 60,
    educationalTitle: "Columna de Sabiduría Bíblica",
    biblicalMessage: "¡30 días seguidos de fidelidad en las Escrituras! Has alcanzado un hito maestro en tu vida espiritual.",
  },
};

export interface DailyChallengeStreakState {
  currentStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  claimedMilestones: number[]; // [3, 7, 14, 30]
}

export interface DailyChallengeState {
  date: string; // YYYY-MM-DD
  title: string;
  themeType: "PERIOD" | "VERSICULOS" | "PERSONAJES" | "BOOK" | "THEMATIC" | "GEOGRAFIA" | "DIOS" | "HISTORIA" | "MANDAMIENTOS" | "SALVACION";
  themeName: string;
  description: string;
  icon: string;
  period?: Period;
  questions: Question[];
  currentQuestionIndex: number;
  correctAnswersCount: number;
  completed: boolean;
  rewardClaimed: boolean;
  rankingPointsAwarded: number;
  shareBonusClaimed: boolean;
  streakMilestoneUnlocked?: DailyStreakRewardInfo | null;
  userAnswers: {
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
  }[];
}

const DAILY_CHALLENGE_STORAGE_KEY = "biblos_daily_challenge_v3";
const DAILY_STREAK_STORAGE_KEY = "biblos_daily_streak_v1";

function matchesKeyword(text: string | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

function isMode(q: Question, targetMode: string): boolean {
  return Array.isArray(q.mode) ? (q.mode as string[]).includes(targetMode) : q.mode === targetMode;
}

const GEO_KEYWORDS = [
  "monte", "río", "rio ", "rio,", "ciudad", "lugar", "tierra prometida", "desierto", 
  "egipto", "jerusalén", "jerusalen", "belén", "belen", "nazaret", "samaria", "galilea", 
  "jericó", "jerico", "jordán", "jordan", "babilonia", "nínive", "ninive", "antioquía", "antioquia",
  "damasco", "roma", "corinto", "éfeso", "efeso", "filipos", "colosas", "sodoma", "gomorra",
  "ararat", "sinaí", "sinai", "horeb", "carmelo", "olivos", "hebrón", "hebron", "betel",
  "patmos", "ur de los", "caná", "cana de", "canaán", "canaan", "nilo", "mar rojo", "mar de galilea",
  "estanque", "getsemaní", "getsemani", "gólgota", "golgota", "calvario"
];

const DIOS_KEYWORDS = [
  "trinidad", "espíritu santo", "espiritu santo", "omnipotente", "omnisciente", "omnipresente", 
  "jehová", "jehova", "yahvé", "yahve", "creador", "elohim", "el shaddai", "soberanía", "soberania", 
  "nombre de dios", "voluntad de dios", "trono de dios", "gloria de dios", "atributos de dios", "santidad de dios"
];

const HEROES_KEYWORDS = [
  "abraham", "moisés", "moises", "david", "daniel", "josué", "josue", "elías", "elias", "eliseo", "noé", "noe", 
  "josé", "jose", "pedro", "pablo", "juan", "ester", "rut", "ruth", "samuel", "salomón", "salomon", 
  "gedeón", "gedeon", "sansón", "sanson", "enoc", "isaac", "jacob", "esteban", "bernabé", "bernabe",
  "timoteo", "nehemías", "nehemias", "esdras", "jonás", "jonas", "maría", "maria", "débora", "debora"
];

const VILLAINS_EXCLUSIONS = [
  "bestia", "falso profeta", "satanás", "satanas", "diablo", "demonio", "dragón", "dragon", "apolión", 
  "apolion", "jezabel", "faraón", "faraon", "judas iscariote", "herodes", "goliat", "abismo"
];

const MILAGROS_KEYWORDS = [
  "mar rojo", "maná", "mana", "agua de la peña", "plagas", "jericó", "jerico", "fuego del cielo", 
  "horno de fuego", "foso de los leones", "resurrección", "resurreccion", "resucitó", "resucito", 
  "sanó", "sano", "ciego", "leproso", "caminar sobre el agua", "tempestad", "multiplicación", "multiplicacion",
  "peces", "panes", "lázaro", "lazaro", "vino de caná", "milagro", "maravilla", "sol se detuvo", "lepra"
];

const MUJERES_KEYWORDS = [
  "ester", "rut", "ruth", "maría", "maria", "débora", "debora", "sara", "sarai", "rebeca", "raquel", "lea", 
  "ana", "rahab", "marta", "elisabet", "elizabeth", "priscila", "dorcas", "lidia", "mujer", "reina de sabá", "madre", "viuda"
];

export interface DailyThemeConfig {
  id: string;
  title: string;
  themeType: "PERIOD" | "VERSICULOS" | "PERSONAJES" | "BOOK" | "THEMATIC" | "GEOGRAFIA" | "DIOS" | "HISTORIA" | "MANDAMIENTOS" | "SALVACION";
  themeName: string;
  description: string;
  icon: string;
  period?: Period;
  filter: (q: Question) => boolean;
}

export const DAILY_THEMES_ROTATION: DailyThemeConfig[] = [
  {
    id: "PERIODOS_PRINCIPIO",
    title: "Períodos Bíblicos: El Principio",
    themeType: "PERIOD",
    themeName: "El Principio",
    description: "10 preguntas sobre la Creación, Adán y Eva, el Arca de Noé y los patriarcas en Génesis.",
    icon: "🌱",
    period: Period.PRINCIPIO,
    filter: (q: Question) => q.period === Period.PRINCIPIO,
  },
  {
    id: "MODO_DIOS",
    title: "La Grandeza y Atributos de Dios",
    themeType: "DIOS",
    themeName: "Modo Dios",
    description: "10 preguntas sobre los atributos, la soberanía, la Trinidad y los nombres sagrados de Dios.",
    icon: "👑",
    filter: (q: Question) => {
      const txt = (q.question + " " + q.options.join(" ")).toLowerCase();
      return (isMode(q, "DIOS") || matchesKeyword(txt, DIOS_KEYWORDS)) && q.period !== Period.TIEMPOS_FINALES;
    },
  },
  {
    id: "GEOGRAFIA_BIBLICA",
    title: "Geografía y Lugares Sagrados",
    themeType: "GEOGRAFIA",
    themeName: "Geografía Bíblica",
    description: "10 preguntas sobre montes, ríos, ciudades, mares y regiones históricas de la Biblia.",
    icon: "🗺️",
    filter: (q: Question) => {
      const txt = (q.question + " " + q.options.join(" ") + " " + (q.reference || "")).toLowerCase();
      return (isMode(q, "GEOGRAFIA") || matchesKeyword(txt, GEO_KEYWORDS)) && q.period !== Period.TIEMPOS_FINALES;
    },
  },
  {
    id: "PERSONAJES_FE",
    title: "Héroes y Siervos de la Fe",
    themeType: "PERSONAJES",
    themeName: "Personajes Bíblicos",
    description: "10 preguntas sobre las vidas, hazañas de fe y testimonios de los siervos de Dios.",
    icon: "🛡️",
    filter: (q: Question) => {
      const hasHero = matchesKeyword(q.question, HEROES_KEYWORDS) || matchesKeyword(q.options.join(" "), HEROES_KEYWORDS);
      const isVillain = matchesKeyword(q.question, VILLAINS_EXCLUSIONS);
      return (isMode(q, "PERSONAJES") || hasHero) && !isVillain && q.period !== Period.TIEMPOS_FINALES;
    },
  },
  {
    id: "PERIODOS_LEY",
    title: "Períodos Bíblicos: La Ley y el Éxodo",
    themeType: "PERIOD",
    themeName: "El Pueblo de Dios y la Ley",
    description: "10 preguntas sobre Moisés, la liberación de Egipto, el desierto y los mandamientos.",
    icon: "📜",
    period: Period.LEY,
    filter: (q: Question) => q.period === Period.LEY,
  },
  {
    id: "MANDAMIENTOS_SABIDURIA",
    title: "Mandamientos y Sabiduría Divina",
    themeType: "MANDAMIENTOS",
    themeName: "Mandamientos y Sabiduría",
    description: "10 preguntas sobre los mandamientos de Dios, Proverbios y consejos de sabiduría.",
    icon: "🧭",
    filter: (q: Question) => {
      const isWisdom = !!(q.reference && (q.reference.startsWith("Proverbios") || q.reference.startsWith("Eclesiastés") || q.reference.startsWith("Santiago")));
      return (isMode(q, "MANDAMIENTOS") || isWisdom) && q.period !== Period.TIEMPOS_FINALES;
    },
  },
  {
    id: "JESUCRISTO_EVANGELIOS",
    title: "Jesucristo: Vida y Enseñanzas",
    themeType: "PERIOD",
    themeName: "Jesús y la Redención",
    description: "10 preguntas sobre el ministerio, parábolas, milagros y enseñanzas de Jesús.",
    icon: "✝️",
    period: Period.REDENCION,
    filter: (q: Question) => q.period === Period.REDENCION,
  },
  {
    id: "HISTORIA_BIBLICA",
    title: "Historia y Acontecimientos Bíblicos",
    themeType: "HISTORIA",
    themeName: "Historia Bíblica",
    description: "10 desafíos sobre los eventos históricos más impactantes del pueblo de Dios.",
    icon: "🏛️",
    filter: (q: Question) => isMode(q, "HISTORIA") && q.period !== Period.TIEMPOS_FINALES,
  },
  {
    id: "PERIODOS_REYES_PROFETAS",
    title: "Períodos Bíblicos: Reyes, Salmos y Profetas",
    themeType: "PERIOD",
    themeName: "Reyes, Profetas y Poetas",
    description: "10 preguntas sobre David, Salomón, los profetas y la alabanza en Israel.",
    icon: "⚔️",
    period: Period.REYES_PROFETAS,
    filter: (q: Question) => q.period === Period.REYES_PROFETAS,
  },
  {
    id: "VERSICULOS_MEMORIZACION",
    title: "Versículos y Citas Clave",
    themeType: "VERSICULOS",
    themeName: "Memorización y Citas",
    description: "10 preguntas para completar versículos memorables y reconocer citas de la Escritura.",
    icon: "📖",
    filter: (q: Question) => {
      const txt = (q.question + " " + (q.reference || "")).toLowerCase();
      const hasVersePattern = 
        txt.includes("completa el versículo") || 
        txt.includes("completa el versiculo") || 
        txt.includes("completa:") || 
        txt.includes("según ") || 
        txt.includes("segun ") ||
        txt.includes("dice:") ||
        txt.includes("dice el versículo") ||
        txt.includes("cómo termina") ||
        txt.includes("como termina") ||
        txt.includes("¿dónde dice") ||
        txt.includes("¿donde dice") ||
        txt.includes("¿qué libro dice") ||
        txt.includes("¿que libro dice") ||
        txt.includes("está escrito") ||
        txt.includes("cita bíblica");
      return (isMode(q, "VERSICULOS") || hasVersePattern) && q.period !== Period.TIEMPOS_FINALES;
    },
  },
  {
    id: "MILAGROS_PRODIGIOS",
    title: "Milagros y Grandes Prodigios",
    themeType: "THEMATIC",
    themeName: "Poder y Maravillas",
    description: "10 preguntas sobre las intervenciones sobrenaturales y milagros de Dios en la Biblia.",
    icon: "⚡",
    filter: (q: Question) => {
      const txt = q.question + " " + q.options.join(" ");
      return matchesKeyword(txt, MILAGROS_KEYWORDS) && q.period !== Period.TIEMPOS_FINALES;
    },
  },
  {
    id: "MUJERES_VALIENTES",
    title: "Mujeres Ejemplares de la Fe",
    themeType: "PERSONAJES",
    themeName: "Mujeres de la Biblia",
    description: "10 preguntas dedicadas a las mujeres de fe, reinas, profetisas y madres en la Biblia.",
    icon: "🌸",
    filter: (q: Question) => {
      const isNotVillain = !matchesKeyword(q.question, ["jezabel", "herodías", "atalía"]);
      return matchesKeyword(q.question, MUJERES_KEYWORDS) && isNotVillain && q.period !== Period.TIEMPOS_FINALES;
    },
  },
  {
    id: "PERIODOS_IGLESIA",
    title: "Períodos Bíblicos: La Iglesia Apostólica",
    themeType: "PERIOD",
    themeName: "La Iglesia Cristiana",
    description: "10 desafíos sobre Pentecostés, los viajes de Pablo y las cartas a las iglesias.",
    icon: "🕊️",
    period: Period.IGLESIA,
    filter: (q: Question) => q.period === Period.IGLESIA,
  },
  {
    id: "SALVACION_GRACIA",
    title: "El Plan de Salvación y la Gracia",
    themeType: "SALVACION",
    themeName: "Salvación y Redención",
    description: "10 preguntas sobre el perdón de pecados, el sacrificio en la cruz y la vida eterna.",
    icon: "💖",
    filter: (q: Question) => isMode(q, "SALVACION") && q.period !== Period.TIEMPOS_FINALES,
  },
  {
    id: "PROFECIAS_PROMESAS",
    title: "Profecías Bíblicas y Promesas Eternas",
    themeType: "PERIOD",
    themeName: "Tiempos Finales y Promesas",
    description: "10 revelaciones proféticas sobre las promesas del Señor y la gloria venidera.",
    icon: "🌟",
    period: Period.TIEMPOS_FINALES,
    filter: (q: Question) => q.period === Period.TIEMPOS_FINALES,
  },
];

export function getDayNumber(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const epoch = new Date(Date.UTC(2025, 0, 1));
  const diffTime = date.getTime() - epoch.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function mulberry32(a: number): () => number {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getSeedFromString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleWithSeed<T>(array: T[], seedStr: string): T[] {
  const rng = mulberry32(getSeedFromString(seedStr));
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyStreakState(): DailyChallengeStreakState {
  const raw = localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
  if (!raw) {
    return { currentStreak: 0, lastCompletedDate: null, claimedMilestones: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      currentStreak: typeof parsed.currentStreak === "number" ? parsed.currentStreak : 0,
      lastCompletedDate: parsed.lastCompletedDate || null,
      claimedMilestones: Array.isArray(parsed.claimedMilestones) ? parsed.claimedMilestones : [],
    };
  } catch {
    return { currentStreak: 0, lastCompletedDate: null, claimedMilestones: [] };
  }
}

export function saveDailyStreakState(state: DailyChallengeStreakState): void {
  localStorage.setItem(DAILY_STREAK_STORAGE_KEY, JSON.stringify(state));
}

export function getDailyChallenge(): DailyChallengeState {
  const todayStr = getTodayDateString();
  const rawStored = localStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);

  // Limpiar almacenamiento legado de versión anterior si existe
  try {
    localStorage.removeItem("biblos_daily_challenge_v2");
  } catch {}

  if (rawStored) {
    try {
      const parsed: DailyChallengeState = JSON.parse(rawStored);
      const questionsValid =
        Array.isArray(parsed.questions) &&
        parsed.questions.length === 10 &&
        parsed.questions.every(q => q && q.id && Array.isArray(q.options) && q.options.length >= 2);

      if (parsed.date === todayStr && questionsValid) {
        return parsed;
      }
      // Si el desafío guardado es de otro día o está corrupto, limpiarlo
      localStorage.removeItem(DAILY_CHALLENGE_STORAGE_KEY);
    } catch (e) {
      console.warn("Error al leer DailyChallenge de localStorage:", e);
      localStorage.removeItem(DAILY_CHALLENGE_STORAGE_KEY);
    }
  }

  const dayNum = getDayNumber(todayStr);
  // Rotación consecutiva de temas día a día (offset +1 para sincronización armónica de temas principales)
  const themeIndex = ((dayNum + 1) % DAILY_THEMES_ROTATION.length + DAILY_THEMES_ROTATION.length) % DAILY_THEMES_ROTATION.length;
  const themeConfig = DAILY_THEMES_ROTATION[themeIndex];

  const allQuestions = getAllGameQuestions();
  let pool = allQuestions.filter(themeConfig.filter);

  // Si la temática tuviese menos de 10 preguntas por catálogo custom, usar preguntas sin Tiempos Finales como respaldo
  if (pool.length < 10) {
    pool = allQuestions.filter(q => q.period !== Period.TIEMPOS_FINALES);
  }

  // Barajado pseudo-aleatorio completamente uniforme y determinista (Fisher-Yates con Mulberry32)
  const shuffled = shuffleWithSeed(pool, todayStr);
  const selected10Questions = shuffled.slice(0, 10);

  const newChallenge: DailyChallengeState = {
    date: todayStr,
    title: themeConfig.title,
    themeType: themeConfig.themeType,
    themeName: themeConfig.themeName,
    description: themeConfig.description,
    icon: themeConfig.icon,
    period: themeConfig.period,
    questions: selected10Questions,
    currentQuestionIndex: 0,
    correctAnswersCount: 0,
    completed: false,
    rewardClaimed: false,
    rankingPointsAwarded: 0,
    shareBonusClaimed: false,
    streakMilestoneUnlocked: null,
    userAnswers: []
  };

  localStorage.setItem(DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(newChallenge));
  return newChallenge;
}

export function saveDailyChallengeProgress(state: DailyChallengeState): void {
  localStorage.setItem(DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(state));
}

export function answerDailyQuestion(
  optionIndex: number
): {
  isCorrect: boolean;
  isFinished: boolean;
  newState: DailyChallengeState;
  rewardEarned: boolean;
  rankingPointsEarned: number;
  streakInfo?: { streak: number; milestoneReward?: DailyStreakRewardInfo | null };
} {
  const current = getDailyChallenge();
  if (current.completed || current.currentQuestionIndex >= current.questions.length) {
    return { isCorrect: false, isFinished: true, newState: current, rewardEarned: false, rankingPointsEarned: 0 };
  }

  const currentQ = current.questions[current.currentQuestionIndex];
  const isCorrect = optionIndex === currentQ.correctAnswer;

  recordAnswer(isCorrect);

  let rankingPointsEarned = 0;
  if (isCorrect) {
    rankingPointsEarned = 1;
    updateUserRating(1);
  }

  const updatedAnswers = [
    ...current.userAnswers,
    {
      questionId: currentQ.id,
      selectedOption: optionIndex,
      isCorrect
    }
  ];

  const updatedCorrectCount = current.correctAnswersCount + (isCorrect ? 1 : 0);
  const updatedRankingPoints = (current.rankingPointsAwarded || 0) + rankingPointsEarned;
  const nextIdx = current.currentQuestionIndex + 1;
  const isFinished = nextIdx >= 10;
  let rewardEarned = false;
  let milestoneReward: DailyStreakRewardInfo | null = null;
  let finalStreak = 0;

  const updatedState: DailyChallengeState = {
    ...current,
    currentQuestionIndex: nextIdx,
    correctAnswersCount: updatedCorrectCount,
    rankingPointsAwarded: updatedRankingPoints,
    userAnswers: updatedAnswers,
    completed: isFinished
  };

  if (isFinished && !current.rewardClaimed) {
    // 1. Recompensa base diaria: +1 Talento
    addTalents(1, `Desafío Bíblico de Hoy: ${current.title}`, "EVENT_WIN");
    updatedState.rewardClaimed = true;
    rewardEarned = true;

    // 2. Actualizar y calcular Racha Consecutiva de Estudio Bíblico
    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();
    const streakState = getDailyStreakState();

    if (streakState.lastCompletedDate === todayStr) {
      finalStreak = streakState.currentStreak;
    } else if (streakState.lastCompletedDate === yesterdayStr) {
      finalStreak = streakState.currentStreak + 1;
    } else {
      finalStreak = 1; // Inicia nueva racha
    }

    // Verificar si desbloqueó un Hito Educativo de Racha (3, 7, 14, 30 días)
    const milestoneConfig = DAILY_STREAK_MILESTONES[finalStreak];
    if (milestoneConfig && !streakState.claimedMilestones.includes(finalStreak)) {
      milestoneReward = milestoneConfig;
      updatedState.streakMilestoneUnlocked = milestoneConfig;
      // Otorgar talentos del hito
      addTalents(milestoneConfig.bonusTalents, `Hito de Racha Bíblica (${milestoneConfig.milestoneDays} días): ${milestoneConfig.educationalTitle}`, "EVENT_WIN");
      // Otorgar puntos de ranking ELO educativos para subir de nivel
      updateUserRating(milestoneConfig.bonusRankingPoints);
      streakState.claimedMilestones.push(finalStreak);
    }

    streakState.currentStreak = finalStreak;
    streakState.lastCompletedDate = todayStr;
    saveDailyStreakState(streakState);

    // 3. Registrar en Leaderboard
    const profile = getUserProfile();
    saveLeaderboardEntry({
      playerName: profile.name,
      playerAvatar: profile.avatar,
      playerCountry: profile.country || "DO",
      playerCountryFlag: profile.countryFlag || "🇩🇴",
      mode: "DESAFIO_DIARIO",
      score: updatedCorrectCount * 100,
      rating: profile.rating || 1000,
      accuracy: Math.round((updatedCorrectCount / 10) * 100),
      totalQuestions: 10,
      correctQuestions: updatedCorrectCount,
      timeSeconds: 60,
      difficulty: `Racha ${finalStreak}d`
    });
  }

  saveDailyChallengeProgress(updatedState);
  return {
    isCorrect,
    isFinished,
    newState: updatedState,
    rewardEarned,
    rankingPointsEarned,
    streakInfo: { streak: finalStreak, milestoneReward }
  };
}

export function claimDailyChallengeSharePoint(): { success: boolean; newState: DailyChallengeState } {
  const current = getDailyChallenge();
  if (current.shareBonusClaimed) {
    return { success: false, newState: current };
  }

  updateUserRating(1);
  const updated: DailyChallengeState = {
    ...current,
    shareBonusClaimed: true,
    rankingPointsAwarded: (current.rankingPointsAwarded || 0) + 1
  };

  saveDailyChallengeProgress(updated);
  return { success: true, newState: updated };
}

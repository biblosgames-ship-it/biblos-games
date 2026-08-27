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
  themeType: "PERIOD" | "VERSICULOS" | "PERSONAJES" | "BOOK" | "THEMATIC";
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

const DAILY_CHALLENGE_STORAGE_KEY = "biblos_daily_challenge_v2";
const DAILY_STREAK_STORAGE_KEY = "biblos_daily_streak_v1";

function matchesKeyword(text: string | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

const HEROES_KEYWORDS = [
  "abraham", "moisés", "moises", "david", "daniel", "josué", "josue", "elías", "elias", "eliseo", "noé", "noe", 
  "josé", "jose", "pedro", "pablo", "juan", "ester", "rut", "ruth", "samuel", "salomón", "salomon", 
  "gedeón", "gedeon", "sansón", "sanson", "enoc", "isaac", "jacob", "esteban", "bernabé", "bernabe",
  "timoteo", "nehemías", "nehemias", "esdras", "jonás", "jonas", "maría", "maria", "débora", "debora",
  "fe", "héroe", "siervo", "profeta", "apóstol", "patriarca"
];

const VILLAINS_EXCLUSIONS = [
  "bestia", "falso profeta", "satanás", "satanas", "diablo", "demonio", "dragón", "dragon", "apolión", 
  "apolion", "jezabel", "faraón", "faraon", "judas iscariote", "herodes", "goliat", "abismo"
];

export interface DailyThemeConfig {
  id: string;
  title: string;
  themeType: "PERIOD" | "VERSICULOS" | "PERSONAJES" | "BOOK" | "THEMATIC";
  themeName: string;
  description: string;
  icon: string;
  period?: Period;
  filter: (q: Question) => boolean;
}

export const DAILY_THEMES_ROTATION: DailyThemeConfig[] = [
  {
    id: "GENESIS",
    title: "Génesis y Los Orígenes",
    themeType: "PERIOD",
    themeName: "El Principio",
    description: "10 preguntas sobre la Creación, Adán y Eva, el Arca de Noé y los patriarcas en Génesis.",
    icon: "🌱",
    period: Period.PRINCIPIO,
    filter: (q: Question) => q.period === Period.PRINCIPIO,
  },
  {
    id: "EXODO_LEY",
    title: "El Éxodo y la Ley Divina",
    themeType: "PERIOD",
    themeName: "El Pueblo de Dios y la Ley",
    description: "10 preguntas sobre Moisés, la liberación de Egipto, el desierto y los mandamientos.",
    icon: "📜",
    period: Period.LEY,
    filter: (q: Question) => q.period === Period.LEY,
  },
  {
    id: "REYES_PROFETAS",
    title: "Reyes, Salmos y Profetas",
    themeType: "PERIOD",
    themeName: "Reyes, Profetas y Poetas",
    description: "10 preguntas sobre David, Salomón, los profetas del Antiguo Testamento y las alabanzas.",
    icon: "👑",
    period: Period.REYES_PROFETAS,
    filter: (q: Question) => q.period === Period.REYES_PROFETAS,
  },
  {
    id: "JESUCRISTO",
    title: "Jesucristo: Vida y Evangelios",
    themeType: "PERIOD",
    themeName: "Jesús y la Redención",
    description: "10 preguntas sobre las enseñanzas, milagros, ministerio, muerte y resurrección de Jesús.",
    icon: "✝️",
    period: Period.REDENCION,
    filter: (q: Question) => q.period === Period.REDENCION,
  },
  {
    id: "HECHOS_CARTAS",
    title: "Hechos y la Iglesia Apostólica",
    themeType: "PERIOD",
    themeName: "La Iglesia Cristiana",
    description: "10 desafíos sobre Pentecostés, los viajes misioneros de Pablo y las cartas de la iglesia.",
    icon: "🕊️",
    period: Period.IGLESIA,
    filter: (q: Question) => q.period === Period.IGLESIA,
  },
  {
    id: "PROFECIAS_FINALES",
    title: "Profecías y Tiempos Finales",
    themeType: "PERIOD",
    themeName: "Tiempos Finales",
    description: "10 revelaciones proféticas sobre el regreso del Señor, las promesas y la gloria venidera.",
    icon: "🌟",
    period: Period.TIEMPOS_FINALES,
    filter: (q: Question) => q.period === Period.TIEMPOS_FINALES,
  },
  {
    id: "HEROES_FE",
    title: "Grandes Héroes y Siervos de la Fe",
    themeType: "PERSONAJES",
    themeName: "Hombres y Mujeres de Dios",
    description: "10 preguntas sobre las vidas, hazañas de fe y testimonios de los siervos de Dios.",
    icon: "🛡️",
    filter: (q: Question) => {
      const isModePersonaje = Array.isArray(q.mode) ? q.mode.includes("PERSONAJES") : q.mode === "PERSONAJES";
      const hasHero = matchesKeyword(q.question, HEROES_KEYWORDS) || matchesKeyword(q.options.join(" "), HEROES_KEYWORDS);
      const isVillain = matchesKeyword(q.question, VILLAINS_EXCLUSIONS);
      return (isModePersonaje || hasHero) && !isVillain && q.period !== Period.TIEMPOS_FINALES;
    },
  },
  {
    id: "VERSICULOS_CITAS",
    title: "Especial de Versículos y Citas Clave",
    themeType: "VERSICULOS",
    themeName: "Memorización y Citas Bíblicas",
    description: "10 preguntas para completar versículos memorables y reconocer citas de la Escritura.",
    icon: "📖",
    filter: (q: Question) => {
      const isModeVersiculo = Array.isArray(q.mode) ? q.mode.includes("VERSICULOS") : q.mode === "VERSICULOS";
      const txt = (q.question + " " + q.reference).toLowerCase();
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
      return isModeVersiculo || hasVersePattern;
    },
  },
  {
    id: "MILAGROS_SENALES",
    title: "Milagros y Grandes Prodigios",
    themeType: "THEMATIC",
    themeName: "El Poder de Dios en Acción",
    description: "10 preguntas sobre las intervenciones sobrenaturales y milagros de Dios en la Biblia.",
    icon: "⚡",
    filter: (q: Question) => {
      const keywords = [
        "mar rojo", "maná", "mana", "agua de la peña", "plagas", "jericó", "jerico", "fuego del cielo", 
        "horno de fuego", "foso de los leones", "resurrección", "resurreccion", "resucitó", "resucito", 
        "sanó", "sano", "ciego", "leproso", "caminar sobre el agua", "tempestad", "multiplicación", "multiplicacion",
        "peces", "panes", "lázaro", "lazaro", "vino de caná", "milagro", "maravilla", "sol se detuvo", "lepra"
      ];
      return matchesKeyword(q.question, keywords) || matchesKeyword(q.options.join(" "), keywords);
    },
  },
  {
    id: "MANDAMIENTOS_SABIDURIA",
    title: "Mandamientos y Sabiduría Bíblica",
    themeType: "THEMATIC",
    themeName: "Enseñanzas Morales y Espirituales",
    description: "10 preguntas sobre los mandamientos de Dios, Proverbios y consejos de sabiduría.",
    icon: "🧭",
    filter: (q: Question) => {
      const isModeMandamientos = Array.isArray(q.mode) ? q.mode.includes("MANDAMIENTOS") : q.mode === "MANDAMIENTOS";
      const isWisdom = q.reference && (q.reference.startsWith("Proverbios") || q.reference.startsWith("Eclesiastés") || q.reference.startsWith("Santiago"));
      return isModeMandamientos || isWisdom;
    },
  },
  {
    id: "MUJERES_VALIENTES",
    title: "Mujeres Ejemplares de la Biblia",
    themeType: "THEMATIC",
    themeName: "Mujeres de Fe y Valentía",
    description: "10 preguntas dedicadas a las mujeres de fe, reinas, profetisas y madres en la Biblia.",
    icon: "👑",
    filter: (q: Question) => {
      const mujeresKeywords = [
        "ester", "rut", "ruth", "maría", "maria", "débora", "debora", "sara", "sarai", "rebeca", "raquel", "lea", 
        "ana", "rahab", "marta", "elisabet", "elizabeth", "priscila", "dorcas", "lidia", "mujer", "reina de sabá", "madre", "viuda"
      ];
      const isNotVillain = !matchesKeyword(q.question, ["jezabel", "herodías", "atalía"]);
      return matchesKeyword(q.question, mujeresKeywords) && isNotVillain;
    },
  },
  {
    id: "SALVACION_GRACIA",
    title: "El Plan de Salvación y la Gracia",
    themeType: "THEMATIC",
    themeName: "Amor, Redención y Perdón",
    description: "10 preguntas sobre el perdón de pecados, el sacrificio en la cruz y la vida eterna.",
    icon: "💖",
    filter: (q: Question) => {
      return Array.isArray(q.mode) ? q.mode.includes("SALVACION") : q.mode === "SALVACION";
    },
  },
];

function getDaySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
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

  const seed = getDaySeed(todayStr);
  const themeIndex = seed % DAILY_THEMES_ROTATION.length;
  const themeConfig = DAILY_THEMES_ROTATION[themeIndex];

  const allQuestions = getAllGameQuestions();
  let pool = allQuestions.filter(themeConfig.filter);

  if (pool.length < 10) {
    pool = allQuestions;
  }

  const shuffled = [...pool].sort((a, b) => {
    const seedA = getDaySeed(todayStr + a.id);
    const seedB = getDaySeed(todayStr + b.id);
    return seedA - seedB;
  });

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

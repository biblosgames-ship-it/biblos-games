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
  themeType: "PERIOD" | "VERSICULOS" | "PERSONAJES" | "BOOK";
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

const DAILY_CHALLENGE_STORAGE_KEY = "biblos_daily_challenge_v1";
const DAILY_STREAK_STORAGE_KEY = "biblos_daily_streak_v1";

export const DAILY_THEMES_ROTATION: {
  title: string;
  themeType: "PERIOD" | "VERSICULOS" | "PERSONAJES" | "BOOK";
  themeName: string;
  description: string;
  icon: string;
  period?: Period;
}[] = [
  {
    title: "Génesis y La Creación",
    themeType: "PERIOD",
    themeName: "El Principio",
    description: "10 hitos recorriendo los orígenes, los patriarcas y las promesas eternas.",
    icon: "🌱",
    period: Period.PRINCIPIO,
  },
  {
    title: "El Éxodo y la Ley Divina",
    themeType: "PERIOD",
    themeName: "El Pueblo de Dios y la Ley",
    description: "10 preguntas sobre el tabernáculo, Moisés y la travesía del desierto.",
    icon: "📜",
    period: Period.LEY,
  },
  {
    title: "Reyes, Salmos y Profecías",
    themeType: "PERIOD",
    themeName: "Reyes, Profetas y Poetas",
    description: "10 hitos sobre David, Salomón, los profetas y la alabanza a Dios.",
    icon: "👑",
    period: Period.REYES_PROFETAS,
  },
  {
    title: "Jesucristo: Vida y Redención",
    themeType: "PERIOD",
    themeName: "Jesús y la Redención",
    description: "10 desafíos sobre el Salvador, sus parábolas, milagros y la resurrección.",
    icon: "✝️",
    period: Period.REDENCION,
  },
  {
    title: "Hechos y Cartas Apostólicas",
    themeType: "PERIOD",
    themeName: "La Iglesia Cristiana",
    description: "10 preguntas sobre el fuego de Pentecostés, el evangelio y las cartas de Pablo.",
    icon: "🕊️",
    period: Period.IGLESIA,
  },
  {
    title: "Apocalipsis y Tiempos Finales",
    themeType: "PERIOD",
    themeName: "Tiempos Finales",
    description: "10 revelaciones proféticas sobre el regreso de Cristo y la Nueva Jerusalén.",
    icon: "🌟",
    period: Period.TIEMPOS_FINALES,
  },
  {
    title: "Especial de Versículos y Citas Clave",
    themeType: "VERSICULOS",
    themeName: "Promesas y Citas Bíblicas",
    description: "10 versículos memorables de la Escritura para ejercitar tu memoria espiritual.",
    icon: "📖",
  },
  {
    title: "Grandes Héroes y Heroínas de la Fe",
    themeType: "PERSONAJES",
    themeName: "Hombres y Mujeres de Dios",
    description: "10 preguntas enfocadas en las vidas y lecciones de fe de grandes personajes bíblicos.",
    icon: "🛡️",
  }
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
  let pool: Question[] = [];

  if (themeConfig.period) {
    pool = allQuestions.filter(q => q.period === themeConfig.period);
  } else if (themeConfig.themeType === "VERSICULOS") {
    pool = allQuestions.filter(q => q.mode === "VERSICULOS" || (q.reference && q.reference.length > 0));
  } else if (themeConfig.themeType === "PERSONAJES") {
    pool = allQuestions.filter(q => q.mode === "PERSONAJES");
  }

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

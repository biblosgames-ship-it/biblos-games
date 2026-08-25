export interface RankTier {
  level: number;
  title: string;
  icon: string;
  minRating: number;
  maxRating: number;
  color: string;
  rewardTalents: number; // Recompensa de talentos al alcanzar este nivel
}

export const RANK_TIERS: RankTier[] = [
  { level: 1, title: 'Novato de la Palabra', icon: '📜', minRating: 0, maxRating: 1199, color: 'text-stone-300', rewardTalents: 0 },
  { level: 2, title: 'Explorador Bíblico', icon: '📖', minRating: 1200, maxRating: 1499, color: 'text-emerald-400', rewardTalents: 30 },
  { level: 3, title: 'Discípulo de la Fe', icon: '🕊️', minRating: 1500, maxRating: 1799, color: 'text-teal-400', rewardTalents: 40 },
  { level: 4, title: 'Guerrero de la Palabra', icon: '⚔️', minRating: 1800, maxRating: 2199, color: 'text-blue-400', rewardTalents: 50 },
  { level: 5, title: 'Siervo de la Verdad', icon: '🏛️', minRating: 2200, maxRating: 2599, color: 'text-indigo-400', rewardTalents: 60 },
  { level: 6, title: 'Sabio de la Escritura', icon: '🔥', minRating: 2600, maxRating: 2999, color: 'text-amber-400', rewardTalents: 70 },
  { level: 7, title: 'Maestro de la Biblia', icon: '👑', minRating: 3000, maxRating: 99999, color: 'text-yellow-300', rewardTalents: 80 },
];


export const getRankTier = (rating: number): RankTier => {
  const currentRating = Math.max(0, rating || 1000);
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (currentRating >= RANK_TIERS[i].minRating) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
};

export const getNextRankTierInfo = (rating: number): {
  currentTier: RankTier;
  nextTier: RankTier | null;
  pointsNeeded: number;
  progressPercent: number;
} => {
  const currentRating = Math.max(0, rating || 1000);
  const currentTier = getRankTier(currentRating);
  const currentIndex = RANK_TIERS.findIndex(t => t.level === currentTier.level);
  
  if (currentIndex === -1 || currentIndex >= RANK_TIERS.length - 1) {
    return {
      currentTier,
      nextTier: null,
      pointsNeeded: 0,
      progressPercent: 100,
    };
  }

  const nextTier = RANK_TIERS[currentIndex + 1];
  const pointsNeeded = Math.max(0, nextTier.minRating - currentRating);
  const tierSpan = nextTier.minRating - currentTier.minRating;
  const currentProgressInTier = Math.max(0, currentRating - currentTier.minRating);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentProgressInTier / tierSpan) * 100)));

  return {
    currentTier,
    nextTier,
    pointsNeeded,
    progressPercent,
  };
};

/**
 * Reglas de Desbloqueo de Dificultades según Rating ELO:
 * - 0 a 1,499 pts: Solo PRINCIPIANTE (Básico).
 * - 1,500 a 2,199 pts: Se desbloquea INTERMEDIO (Medio) y el modo MIXTO.
 * - 2,200 pts en adelante: Se desbloquea AVANZADO (Pro/Erudito).
 */
export const getAvailableDifficulties = (rating: number = 1000): {
  canBasic: boolean;
  canIntermediate: boolean;
  canAdvanced: boolean;
  canMixto: boolean;
  defaultDifficulty: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | 'MIXTO';
} => {
  const r = Math.max(0, rating);
  const canBasic = true; // Siempre disponible
  const canIntermediate = r >= 1500;
  const canAdvanced = r >= 2200;
  // MIXTO se desbloquea cuando tiene al menos los 2 primeros modos activos (>= 1500 pts)
  const canMixto = canIntermediate;

  // Para novatos (< 1500 pts) la dificultad por defecto es PRINCIPIANTE
  // Para jugadores con >= 1500 pts, la preconfigurada recomendada es MIXTO
  const defaultDifficulty = canMixto ? 'MIXTO' : 'PRINCIPIANTE';

  return {
    canBasic,
    canIntermediate,
    canAdvanced,
    canMixto,
    defaultDifficulty,
  };
};

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'OTRO', name: 'Internacional / Otro', flag: '🌐' },
];

export const detectUserCountry = (): { code: string; flag: string; name: string } => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Santo_Domingo')) return { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' };
    if (tz.includes('Puerto_Rico')) return { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' };
    if (tz.includes('Mexico')) return { code: 'MX', name: 'México', flag: '🇲🇽' };
    if (tz.includes('Bogota')) return { code: 'CO', name: 'Colombia', flag: '🇨🇴' };
    if (tz.includes('Buenos_Aires') || tz.includes('Argentina')) return { code: 'AR', name: 'Argentina', flag: '🇦🇷' };
    if (tz.includes('Madrid')) return { code: 'ES', name: 'España', flag: '🇪🇸' };
    if (tz.includes('Guatemala')) return { code: 'GT', name: 'Guatemala', flag: '🇬🇹' };
    if (tz.includes('Caracas')) return { code: 'VE', name: 'Venezuela', flag: '🇻🇪' };
    if (tz.includes('Lima')) return { code: 'PE', name: 'Perú', flag: '🇵🇪' };
    if (tz.includes('Santiago')) return { code: 'CL', name: 'Chile', flag: '🇨🇱' };
    if (tz.includes('Guayaquil')) return { code: 'EC', name: 'Ecuador', flag: '🇪🇨' };
    if (tz.includes('Havana')) return { code: 'CU', name: 'Cuba', flag: '🇨🇺' };
    if (tz.includes('El_Salvador')) return { code: 'SV', name: 'El Salvador', flag: '🇸🇻' };
    if (tz.includes('Tegucigalpa')) return { code: 'HN', name: 'Honduras', flag: '🇭🇳' };
    if (tz.includes('Managua')) return { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' };
    if (tz.includes('Costa_Rica')) return { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' };
    if (tz.includes('Panama')) return { code: 'PA', name: 'Panamá', flag: '🇵🇦' };
    if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago') || tz.includes('Denver')) {
      return { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' };
    }
  } catch (e) {}

  return { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' };
};

export interface CopaBiblosAchievement {
  id: string;
  tournamentDate: string;
  trophy: 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTICIPANT';
  trophyName: string;
  finalRank: number;
  totalPoints: number;
  accuracy: number;
  rewardTalents: number;
  titleEarned: string;
}

import { supabase } from '../supabaseClient';

export interface UserProfile {
  id?: string;
  name: string;
  avatar: string;
  country?: string;
  countryFlag?: string;
  totalAnswered: number;
  correctAnswers: number;
  accuracy: number; // Porcentaje 0 - 100
  gamesPlayed: number;
  createdAt: string;
  streak: number; // Días seguidos jugando o racha de aciertos
  rating: number; // RATING INICIAL = 1000 (Mide habilidad real, no partidas jugadas)
  bestSoloScore: number; // Récord de Solo Score
  talents?: number; // Saldo de Talentos Bíblicos (inicial 12)
  isPremium?: boolean; // Versión Full / Premium desbloqueada
  premiumUnlockedAt?: string | null;
  claimedLevelRewards?: number[]; // Niveles (1, 2, 3...) cuya recompensa ya fue cobrada
  authProvider?: 'google' | 'facebook' | 'guest' | null;
  email?: string;
  isGuest?: boolean;
  copaBiblosTrophies?: CopaBiblosAchievement[];
  copaBiblosTitles?: string[];
  copaBiblosBestRank?: number;
  copaBiblosNotificationEnabled?: boolean;
  copaBiblosRegistered?: boolean;
  matchmakingBanUntil?: string | null; // Bloqueo temporal de Matchmaking si abandonó partida voluntariamente
  abandonCount?: number; // Contador histórico de abandonos
  lastAbandonDate?: string | null;
}

export interface AbandonSanctionResult {
  isVoluntary: boolean;
  ratingLost: number;
  newRating: number;
  banMinutes: number;
  banUntil: string;
  abandonCount: number;
}

export interface BibleAvatar {
  id: string;
  name: string;
  icon: string;
  imagePath: string;
  title: string;
  isPremium?: boolean;
}

export const BIBLE_AVATARS: BibleAvatar[] = [
  // 🆓 6 AVATARES DISPONIBLES EN PLAN GRATUITO (FREE)
  { id: 'david', name: 'David', icon: '👑', imagePath: '/avatars/david.jpg', title: 'El Gran Rey', isPremium: false },
  { id: 'esther', name: 'Reina Ester', icon: '👸', imagePath: '/avatars/esther.jpg', title: 'La Valentía', isPremium: false },
  { id: 'moises', name: 'Moisés', icon: '📜', imagePath: '/avatars/moises.jpg', title: 'El Libertador', isPremium: false },
  { id: 'debora', name: 'Débora', icon: '⚖️', imagePath: '/avatars/debora.jpg', title: 'La Jueza y Profetisa', isPremium: false },
  { id: 'pedro', name: 'Pedro', icon: '⛵', imagePath: '/avatars/pedro.jpg', title: 'El Pescador de Hombres', isPremium: false },
  { id: 'maria', name: 'María', icon: '🕊️', imagePath: '/avatars/maria.jpg', title: 'La Sierva del Señor', isPremium: false },

  // 👑 8 AVATARES EXCLUSIVOS PLAN PREMIUM VIP
  { id: 'pablo', name: 'Pablo', icon: '📖', imagePath: '/avatars/pablo.jpg', title: 'El Apóstol Misionero', isPremium: true },
  { id: 'sarah', name: 'Sara', icon: '⭐', imagePath: '/avatars/sarah.jpg', title: 'Madre de Naciones', isPremium: true },
  { id: 'daniel', name: 'Daniel', icon: '🦁', imagePath: '/avatars/daniel.jpg', title: 'El Profeta Fiel', isPremium: true },
  { id: 'rut', name: 'Rut', icon: '🌾', imagePath: '/avatars/rut.jpg', title: 'La Leal y Fiel', isPremium: true },
  { id: 'elias', name: 'Elías', icon: '🔥', imagePath: '/avatars/elias.jpg', title: 'El Profeta de Fuego', isPremium: true },
  { id: 'salomon', name: 'Salomón', icon: '🏛️', imagePath: '/avatars/salomon.jpg', title: 'El Sabio', isPremium: true },
  { id: 'noe', name: 'Noé', icon: '🌈', imagePath: '/avatars/noe.jpg', title: 'El Hombre Justo', isPremium: true },
  { id: 'jose', name: 'José', icon: '🎨', imagePath: '/avatars/jose.jpg', title: 'El Soñador Victorioso', isPremium: true },
];

export const isAvatarAvailableForUser = (avatar: BibleAvatar, isUserVip: boolean = false): boolean => {
  if (!avatar.isPremium) return true;
  return isUserVip;
};


export const getOrCreateUserId = (): string => {
  const storedId = localStorage.getItem('biblos_user_unique_id');
  if (storedId) return storedId;
  const newId = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  try {
    localStorage.setItem('biblos_user_unique_id', newId);
  } catch (e) {}
  return newId;
};

export const getDefaultProfile = (): UserProfile => {
  const autoCountry = detectUserCountry();
  return {
    id: getOrCreateUserId(),
    name: 'Jugador Bíblico',
    avatar: '/avatars/david.jpg',
    country: autoCountry.code,
    countryFlag: autoCountry.flag,
    totalAnswered: 0,
    correctAnswers: 0,
    accuracy: 0,
    gamesPlayed: 0,
    createdAt: new Date().toISOString(),
    streak: 0,
    rating: 1000, // RATING INICIAL = 1000
    bestSoloScore: 0,
    claimedLevelRewards: [1], // Nivel 1 inicial ya considerado como base de inicio
    authProvider: null,
    isGuest: true,
  };
};

export const PROFILE_KEY = 'biblos_user_profile_v2';

export const getUserProfile = (): UserProfile => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const autoCountry = detectUserCountry();
      const userId = parsed.id || getOrCreateUserId();
      // Garantizar migración transparente de rating y bestSoloScore
      return {
        ...getDefaultProfile(),
        ...parsed,
        id: userId,
        isPremium: Boolean(parsed.isPremium),
        premiumUnlockedAt: parsed.premiumUnlockedAt || null,
        country: parsed.country || autoCountry.code,
        countryFlag: parsed.countryFlag || autoCountry.flag,
        rating: typeof parsed.rating === 'number' ? parsed.rating : 1000,
        bestSoloScore: typeof parsed.bestSoloScore === 'number' ? parsed.bestSoloScore : 0,
        claimedLevelRewards: Array.isArray(parsed.claimedLevelRewards) ? parsed.claimedLevelRewards : [1],
      };
    }
  } catch (e) {
    console.error('Error reading profile', e);
  }
  return getDefaultProfile();
};

let syncTimeout: any = null;

export const syncProfileToCloud = async (profile: UserProfile): Promise<void> => {
  try {
    const userId = profile.id || getOrCreateUserId();
    await supabase.from('profiles').upsert({
      id: userId,
      user_name: profile.name || 'Jugador Bíblico',
      avatar: profile.avatar || '/avatars/david.jpg',
      country_code: profile.country || 'DO',
      country_flag: profile.countryFlag || '🇩🇴',
      elo_rating: profile.rating || 1000,
      coins: profile.talents || 12,
      is_vip: Boolean(profile.isPremium),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    // Si no hay internet o falla, no bloquea el juego (offline-first)
    console.warn('[SUPABASE] Sincronización offline en espera:', err);
  }
};

export const saveUserProfile = (profile: UserProfile): void => {
  try {
    const profileWithId = {
      ...profile,
      id: profile.id || getOrCreateUserId(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileWithId));

    // Sincronización diferida y silenciosa en segundo plano (debounce 1.5s)
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      syncProfileToCloud(profileWithId);
    }, 1500);
  } catch (e) {
    console.error('Error saving profile', e);
  }
};


export const checkAndClaimLevelRewards = (
  currentRating: number
): { rewardedLevels: { level: number; title: string; reward: number }[]; totalReward: number } => {
  const profile = getUserProfile();
  const currentTier = getRankTier(currentRating);
  const claimed = Array.isArray(profile.claimedLevelRewards) ? [...profile.claimedLevelRewards] : [1];
  if (!claimed.includes(1)) claimed.push(1); // Nivel 1 siempre considerado base inicial
  const newlyRewarded: { level: number; title: string; reward: number }[] = [];

  const LEVEL_REWARDS_MAP: Record<number, number> = {
    1: 0,  // Nivel 1 no da recompensa de subida de nivel
    2: 30,
    3: 40,
    4: 50,
    5: 60,
    6: 70,
    7: 80,
  };

  // Otorgar recompensa ÚNICA exclusivamente para los niveles alcanzados superiores al nivel 1 que NUNCA hayan sido cobrados
  for (let lvl = 2; lvl <= currentTier.level; lvl++) {
    if (!claimed.includes(lvl)) {
      const tierObj = RANK_TIERS.find(t => t.level === lvl);
      const reward = LEVEL_REWARDS_MAP[lvl] || (lvl * 10 + 10);
      if (reward > 0) {
        newlyRewarded.push({
          level: lvl,
          title: tierObj?.title || `Nivel ${lvl}`,
          reward,
        });
      }
      claimed.push(lvl);
    }
  }

  if (newlyRewarded.length > 0) {
    const totalReward = newlyRewarded.reduce((sum, item) => sum + item.reward, 0);
    const updated: UserProfile = {
      ...profile,
      claimedLevelRewards: claimed,
    };
    saveUserProfile(updated);
    return { rewardedLevels: newlyRewarded, totalReward };
  }

  return { rewardedLevels: [], totalReward: 0 };
};


export const updateUserRating = (
  delta: number
): {
  profile: UserProfile;
  oldRating: number;
  newRating: number;
  levelUpReward?: { level: number; title: string; reward: number; totalReward: number };
} => {
  const profile = getUserProfile();
  const oldRating = profile.rating || 1000;
  const oldTier = getRankTier(oldRating);
  // El rating no puede caer por debajo de 500 para proteger la experiencia
  const newRating = Math.max(500, Math.round(oldRating + delta));
  const newTier = getRankTier(newRating);

  const updated: UserProfile = {
    ...profile,
    rating: newRating,
  };
  saveUserProfile(updated);

  // Verificar si subió de nivel
  let levelUpReward: { level: number; title: string; reward: number; totalReward: number } | undefined;
  if (newTier.level > oldTier.level) {
    const claimResult = checkAndClaimLevelRewards(newRating);
    if (claimResult.rewardedLevels.length > 0) {
      const highest = claimResult.rewardedLevels[claimResult.rewardedLevels.length - 1];
      levelUpReward = {
        level: highest.level,
        title: highest.title,
        reward: highest.reward,
        totalReward: claimResult.totalReward,
      };
    }
  }

  return { profile: getUserProfile(), oldRating, newRating, levelUpReward };
};

export const updateUserSoloScore = (score: number): { profile: UserProfile; isNewRecord: boolean } => {
  const profile = getUserProfile();
  const currentBest = profile.bestSoloScore || 0;
  const isNewRecord = score > currentBest;

  const updated: UserProfile = {
    ...profile,
    bestSoloScore: Math.max(currentBest, Math.round(score)),
  };
  saveUserProfile(updated);
  return { profile: updated, isNewRecord };
};

export const recordAnswer = (isCorrect: boolean): UserProfile => {
  const profile = getUserProfile();
  const total = profile.totalAnswered + 1;
  const correct = profile.correctAnswers + (isCorrect ? 1 : 0);
  const accuracy = Math.round((correct / total) * 100);
  const streak = isCorrect ? profile.streak + 1 : 0;

  const updated: UserProfile = {
    ...profile,
    totalAnswered: total,
    correctAnswers: correct,
    accuracy,
    streak,
  };

  saveUserProfile(updated);
  return updated;
};

export const recordGameCompleted = (): UserProfile => {
  const profile = getUserProfile();
  const updated: UserProfile = {
    ...profile,
    gamesPlayed: profile.gamesPlayed + 1,
  };
  saveUserProfile(updated);
  return updated;
};

export const recordCopaBiblosAchievement = (
  achievement: Omit<CopaBiblosAchievement, 'id'>
): UserProfile => {
  const profile = getUserProfile();
  const newId = 'copa_' + Date.now();
  const fullAchievement: CopaBiblosAchievement = { ...achievement, id: newId };

  const currentTrophies = profile.copaBiblosTrophies || [];
  const currentTitles = profile.copaBiblosTitles || [];

  const updatedTitles = achievement.titleEarned && !currentTitles.includes(achievement.titleEarned)
    ? [...currentTitles, achievement.titleEarned]
    : currentTitles;

  const currentBestRank = profile.copaBiblosBestRank || 999;
  const newBestRank = Math.min(currentBestRank, achievement.finalRank);

  const updated: UserProfile = {
    ...profile,
    copaBiblosTrophies: [fullAchievement, ...currentTrophies],
    copaBiblosTitles: updatedTitles,
    copaBiblosBestRank: newBestRank
  };

  saveUserProfile(updated);
  return updated;
};

export const isUserPremium = (): boolean => {
  const profile = getUserProfile();
  return Boolean(profile.isPremium);
};

export const unlockPremiumVersion = (): UserProfile => {
  const profile = getUserProfile();
  const updated: UserProfile = {
    ...profile,
    isPremium: true,
    premiumUnlockedAt: new Date().toISOString(),
  };
  saveUserProfile(updated);
  return updated;
};

export const FREE_AVAILABLE_THEMES = ['PERIODOS'];

export const isThemeAvailable = (themeId: string, isPremiumUser: boolean = false): boolean => {
  if (isPremiumUser) return true;
  return FREE_AVAILABLE_THEMES.includes(themeId.toUpperCase());
};

/**
 * SISTEMA DE PENALIZACIÓN POR ABANDONO
 * Distingue abandono voluntario de desconexión fortuita y aplica:
 * 1. Pérdida de Rating (-35 a -75 pts)
 * 2. Bloqueo temporal de Matchmaking (5 min, 15 min, 30 min escalonado)
 */
export const applyAbandonSanction = (isVoluntary: boolean = true): AbandonSanctionResult => {
  const profile = getUserProfile();
  const currentCount = (profile.abandonCount || 0) + 1;
  
  // Escala de bloqueo temporal según reincidencia:
  // 1er abandono: 5 minutos
  // 2do abandono: 15 minutos
  // 3er abandono o más: 30 minutos
  const banMinutes = isVoluntary ? (currentCount === 1 ? 5 : currentCount === 2 ? 15 : 30) : 0;
  const banUntilDate = new Date(Date.now() + banMinutes * 60 * 1000).toISOString();

  // Pérdida de Rating ELO (Mayor penalización si es abandono voluntario)
  const ratingLost = isVoluntary ? Math.min(50 + (currentCount - 1) * 15, 95) : 30;
  const newRating = Math.max(100, (profile.rating || 1000) - ratingLost);

  const updated: UserProfile = {
    ...profile,
    rating: newRating,
    abandonCount: currentCount,
    lastAbandonDate: new Date().toISOString(),
    matchmakingBanUntil: isVoluntary ? banUntilDate : profile.matchmakingBanUntil
  };

  saveUserProfile(updated);

  return {
    isVoluntary,
    ratingLost,
    newRating,
    banMinutes,
    banUntil: banUntilDate,
    abandonCount: currentCount
  };
};

/**
 * Verifica si el jugador tiene un bloqueo temporal activo para buscar partidas
 */
export const checkMatchmakingBanStatus = (): { isBanned: boolean; minutesRemaining: number; secondsRemaining: number } => {
  const profile = getUserProfile();
  if (!profile.matchmakingBanUntil) {
    return { isBanned: false, minutesRemaining: 0, secondsRemaining: 0 };
  }

  const banTime = new Date(profile.matchmakingBanUntil).getTime();
  const diffMs = banTime - Date.now();

  if (diffMs <= 0) {
    // El bloqueo ya expiró, limpiar
    const updated: UserProfile = {
      ...profile,
      matchmakingBanUntil: null
    };
    saveUserProfile(updated);
    return { isBanned: false, minutesRemaining: 0, secondsRemaining: 0 };
  }

  const totalSeconds = Math.ceil(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    isBanned: true,
    minutesRemaining: minutes,
    secondsRemaining: seconds
  };
};

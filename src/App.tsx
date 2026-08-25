/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initAdMob, showInterstitialAd, showRewardedAd, canWatchRewardedAd, markRewardedAdWatched, getTimeUntilNextRewardedAd, onQuestionAnswered, resetAdCounter } from './services/adService';
import {
  BookOpen,
  RotateCcw,
  ChevronLeft,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  LayoutGrid,
  Baby,
  Users,
  User,
  Globe,
  Crown,
  Cross,
  ScrollText,
  MapPin,
  Landmark,
  MessageCircle,
  Facebook,
  Share2,
  Copy,
  Check,
  Trophy,
  Home,
  Swords,
  UserPlus,
  Calendar,
  Flame,
  ShieldAlert,
  Download,
  Clock,
  Trash2,
  Send,
  Lock,
  KeyRound,
  Play,
  Radio,
  Zap,
  Bot,
  Maximize2,
  Minimize2,
  Settings,
  Database,
  Bell,
  BellRing,
  PlusCircle,
  Save,
  FileText,
  UploadCloud,
  Menu,
  AlertTriangle
} from "lucide-react";
import confetti from 'canvas-confetti';
import { Period, Question, PERIOD_COLORS, PERIOD_ICONS, Difficulty } from './types';
import questionsData from './data/questions.json';
import { 
  getAllGameQuestions, 
  getQuestionsForUser,
  getBaseQuestions, 
  getCustomQuestions, 
  saveCustomQuestions, 
  resetCustomQuestions, 
  downloadFullQuestionsJSON,
  filterQuestionsForCustomStudy,
  getAvailablePeriodsForCustomStudy,
  CustomStudyFilter,
  OLD_TESTAMENT_BOOKS,
  NEW_TESTAMENT_BOOKS,
  ALL_BIBLE_BOOKS,
  BASE_QUESTIONS_COUNT
} from './services/questionsService';
import {
  getSavedFriends,
  saveFriends,
  addFriend,
  removeFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  blockUser,
  reportUser,
  isUserBlocked,
  generateFriendInviteUrl,
  shareInviteToSocial,
  Friend
} from './services/friendsService';
import { getWeeklyEventConfig, saveWeeklyEventConfig, loadRemoteEventQuestions, WeeklyEvent, getCopaBiblosChampions, CopaBiblosChampion } from './services/eventsService';
import { RoomChatWidget } from './components/RoomChatModal';
import { GoldCoinIcon } from './components/GoldCoinIcon';

function getActiveQuestionsPool(): Question[] {
  const isPrem = isUserPremium();
  return getQuestionsForUser(isPrem).questions;
}

let ALL_QUESTIONS = getActiveQuestionsPool();

// Función para barajar aleatoriamente las 4 opciones de respuesta garantizando distribución uniforme (25% en cada posición) sin dañar la respuesta correcta
function shuffleQuestionOptions(q: Question): Question {
  if (!q || !q.options || q.options.length <= 1) return q;
  const correctText = q.options[q.correctAnswer];
  
  // Barajar usando el algoritmo Fisher-Yates
  const shuffledOptions = [...q.options];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  
  const newCorrectIndex = shuffledOptions.indexOf(correctText);
  return {
    ...q,
    options: shuffledOptions,
    correctAnswer: newCorrectIndex !== -1 ? newCorrectIndex : 0
  };
}


import boardData from './data/boardData.json';
import boardCoordinates from './data/boardCoordinates.json';
import { supabase } from './supabaseClient';
import { triggerHaptic } from './services/nativeHaptics';
import { onlineService, OnlineRoom } from './services/onlineMultiplayer';
import { calculateFinalScore, calculateSoloScore, SoloScoreResult, getLeaderboard, fetchGlobalLeaderboardFromCloud, saveLeaderboardEntry, LeaderboardEntry } from './services/leaderboardService';
import { downloadGameResultsImage, downloadUserProfileImage, shareGameResults, shareUserProfile, shareFriendInviteCard, downloadFriendInviteCard } from './services/shareService';
import { BIBLE_AVATARS, isAvatarAvailableForUser, getUserProfile, getRankTier, getNextRankTierInfo, getAvailableDifficulties, checkAndClaimLevelRewards, RANK_TIERS, RankTier, recordAnswer, recordGameCompleted, saveUserProfile, updateUserRating, updateUserSoloScore, UserProfile, COUNTRIES, CountryOption, isUserPremium, unlockPremiumVersion, isThemeAvailable, FREE_AVAILABLE_THEMES, applyAbandonSanction, checkMatchmakingBanStatus } from './services/userProfile';
import { GameOverCeremonyModal } from './GameOverCeremonyModal';
import { CopaBiblosTournamentMode } from './components/CopaBiblosTournamentMode';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { InteractiveTutorialGuide } from './components/InteractiveTutorialGuide';
import { GuidedSimulatorTutorial } from './components/GuidedSimulatorTutorial';
import { LiveInteractivePointerTour, LiveTourStep } from './components/LiveInteractivePointerTour';
import { AdminExecutiveDashboardModal } from './components/AdminExecutiveDashboardModal';
import { LegalPoliciesModal } from './components/LegalPoliciesModal';
import { BiblosCoachWidget } from './components/BiblosCoachWidget';
import { recordQuestionMastery } from './services/spiritualCoachService';
import { recordAnalyticsSessionHeartbeat } from './services/analyticsService';
import { isTutorialCompleted } from './services/tutorialService';
import { getDailyChallenge, getDailyStreakState } from './services/dailyChallengeService';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermissionStatus,
  checkAndTriggerSmartNotifications,
  NotificationSettings,
} from './services/notificationService';
import {
  getTalentsBalance,
  canAffordTalents,
  addTalents,
  spendTalents,
  checkAndApplyDailyRefill,
  getTimeUntilNextRefill,
  claimSocialShareBonus,
  claimReferralBonus,
  FEES,
  getEconomyState,
  TalentTransaction
} from './services/economyService';

import { playGameSound, playSearchTickSound, playCelebrationSound } from './services/soundService';

const TRIVIA_CONSEQUENCES: Record<number, { bien: number; mal: number }> = {
  4: { bien: 4, mal: -2 },
  8: { bien: 3, mal: -3 },
  12: { bien: 4, mal: -4 },
  14: { bien: 4, mal: -3 },
  17: { bien: 2, mal: -3 },
  20: { bien: 3, mal: -4 },
  24: { bien: 4, mal: -3 },
  27: { bien: 3, mal: -3 },
  32: { bien: 4, mal: -4 },
  34: { bien: 4, mal: -4 },
  37: { bien: 4, mal: -3 },
  42: { bien: 4, mal: -4 },
  45: { bien: 4, mal: -4 },
  48: { bien: 4, mal: -4 },
  51: { bien: 2, mal: -4 },
  55: { bien: 3, mal: -3 },
  58: { bien: 4, mal: -2 },
  61: { bien: 2, mal: -3 },
  65: { bien: 2, mal: -4 },
  68: { bien: 2, mal: -2 },
  72: { bien: 1, mal: -5 },
  74: { bien: 0, mal: -4 }
};

// Comparador canónico estricto de Periodos Bíblicos
function matchPeriodName(periodA?: string, periodB?: string): boolean {
  if (!periodA || !periodB) return false;
  const a = periodA.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const b = periodB.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (a === b) return true;
  if (a.includes("principio") && b.includes("principio")) return true;
  if ((a.includes("pueblo") || a.includes("ley")) && (b.includes("pueblo") || b.includes("ley"))) return true;
  if ((a.includes("reyes") || a.includes("poeta")) && (b.includes("reyes") || b.includes("poeta"))) return true;
  if ((a.includes("jesus") || a.includes("redencion")) && (b.includes("jesus") || b.includes("redencion"))) return true;
  if (a.includes("iglesia") && b.includes("iglesia")) return true;
  if ((a.includes("final") || a.includes("apocalipsis")) && (b.includes("final") || b.includes("apocalipsis"))) return true;
  return false;
}

function getQuestionsForPeriod(periodName: string, theme?: string, difficulty?: string, customStudyFilter?: CustomStudyFilter | null): Question[] {
  let allPool = getActiveQuestionsPool();
  const targetPeriod = (!periodName || periodName === 'Inicio') ? 'El Principio' : periodName;

  // CASO ESPECIAL: ESTUDIO BÍBLICO PERSONALIZADO (Filtrado estricto por Libro/Testamento/Tema)
  if (customStudyFilter) {
    const studyQuestions = filterQuestionsForCustomStudy(allPool, customStudyFilter);
    if (studyQuestions.length > 0) {
      return studyQuestions;
    }
  }

  // CASO A: EL USUARIO ELIGIÓ UNA TEMÁTICA O MODO ESPECÍFICO (ej: PRINCIPIANTE, PERSONAJES, HISTORIA, MANDAMIENTOS, SALVACIÓN)
  if (theme && theme !== 'PERIODOS' && theme !== 'MIXTO') {
    let themePool = allPool;
    if (theme === 'PRINCIPIANTE' || theme === 'KIDS') {
      themePool = allPool.filter(q => String(q.difficulty || '').toUpperCase() === 'BASIC' || (q.difficulty as any) === 'PRINCIPIANTE');
    } else {
      themePool = allPool.filter(q => Array.isArray(q.mode) ? q.mode.includes(theme as any) : q.mode === theme);
    }

    if (themePool.length === 0) {
      themePool = allPool;
    }

    // 1. Intentar priorizar preguntas de esa temática que pertenezcan al Periodo Bíblico de la casilla
    const periodInTheme = themePool.filter(q => matchPeriodName(q.period, targetPeriod));
    let baseThemed = periodInTheme.length >= 2 ? periodInTheme : themePool;

    // 2. Filtrar por Dificultad dentro de la temática
    if (difficulty && difficulty !== 'MIXTO') {
      const dUpper = difficulty.toUpperCase();
      if (dUpper === 'PRINCIPIANTE' || dUpper === 'BASIC') {
        const exact = baseThemed.filter(q => String(q.difficulty || '').toUpperCase() === 'BASIC' || (q.difficulty as any) === 'PRINCIPIANTE');
        if (exact.length > 0) return exact;
      } else if (dUpper === 'INTERMEDIO' || dUpper === 'INTERMEDIATE') {
        const exact = baseThemed.filter(q => String(q.difficulty || '').toUpperCase() === 'INTERMEDIATE' || (q.difficulty as any) === 'INTERMEDIO');
        if (exact.length > 0) return exact;
      } else if (dUpper === 'AVANZADO' || dUpper === 'ADVANCED') {
        const exact = baseThemed.filter(q => String(q.difficulty || '').toUpperCase() === 'ADVANCED' || (q.difficulty as any) === 'AVANZADO');
        if (exact.length > 0) return exact;
      }
    }

    return baseThemed;
  }

  // CASO B: MODO ESTÁNDAR POR PERIODOS BÍBLICOS (PERIODOS / MIXTO)
  // 1. Filtrar primero y estrictamente por el Periodo Bíblico de la Casilla
  let periodQuestions = allPool.filter(q => matchPeriodName(q.period, targetPeriod));
  if (periodQuestions.length === 0) {
    periodQuestions = allPool;
  }

  // 2. Filtrar por Dificultad dentro del Periodo
  if (difficulty && difficulty !== 'MIXTO') {
    const dUpper = difficulty.toUpperCase();
    if (dUpper === 'PRINCIPIANTE' || dUpper === 'BASIC') {
      const exact = periodQuestions.filter(q => {
        const d = String(q.difficulty || '').toUpperCase();
        return d === 'BASIC' || d === 'PRINCIPIANTE';
      });
      if (exact.length > 0) return exact;
    } else if (dUpper === 'INTERMEDIO' || dUpper === 'INTERMEDIATE') {
      const exact = periodQuestions.filter(q => {
        const d = String(q.difficulty || '').toUpperCase();
        return d === 'INTERMEDIATE' || d === 'INTERMEDIO';
      });
      if (exact.length >= 3) return exact;
      return periodQuestions.filter(q => {
        const d = String(q.difficulty || '').toUpperCase();
        return d === 'BASIC' || d === 'INTERMEDIATE' || d === 'INTERMEDIO';
      });
    } else if (dUpper === 'AVANZADO' || dUpper === 'ADVANCED') {
      const exact = periodQuestions.filter(q => {
        const d = String(q.difficulty || '').toUpperCase();
        return d === 'ADVANCED' || d === 'AVANZADO';
      });
      if (exact.length >= 3) return exact;
      return periodQuestions.filter(q => {
        const d = String(q.difficulty || '').toUpperCase();
        return d === 'INTERMEDIATE' || d === 'ADVANCED' || d === 'AVANZADO';
      });
    }
  }

  return periodQuestions;
}

const BOARD_SEEN_QUESTIONS_KEY = 'biblos_persistent_seen_questions_v3';

function getBoardSeenQuestionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(BOARD_SEEN_QUESTIONS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function recordBoardSeenQuestion(id: string): void {
  try {
    const seen = getBoardSeenQuestionIds();
    seen.add(id);
    localStorage.setItem(BOARD_SEEN_QUESTIONS_KEY, JSON.stringify(Array.from(seen)));
  } catch (err) {
    console.error('Error guardando pregunta vista:', err);
  }
}

/**
 * Libera las preguntas vistas de una categoría/período específico SOLO cuando el usuario
 * ya ha visto el 100% de las preguntas disponibles en esa categoría.
 */
function resetSeenQuestionsForPool(poolIds: string[]): void {
  try {
    const seen = getBoardSeenQuestionIds();
    poolIds.forEach(id => seen.delete(id));
    localStorage.setItem(BOARD_SEEN_QUESTIONS_KEY, JSON.stringify(Array.from(seen)));
  } catch (err) {
    console.error('Error reseteando preguntas agotadas:', err);
  }
}

/**
 * Algoritmo de Mazo Inteligente: Selecciona preguntas no vistas para el periodo y nivel
 * garantizando que NUNCA se repitan preguntas dentro de la misma partida grupal
 * y que el usuario explore el 100% REAL de la base de preguntas antes de repetir alguna.
 */
function pickSmartQuestionForPeriod(
  periodName: string, 
  theme?: string, 
  difficulty?: string, 
  customStudyFilter?: CustomStudyFilter | null,
  matchSeenIds?: Set<string>
): Question | null {
  const allMatching = getQuestionsForPeriod(periodName, theme, difficulty, customStudyFilter);
  if (!allMatching || allMatching.length === 0) return null;

  const persistentSeenIds = getBoardSeenQuestionIds();
  
  // 1. Filtrar preguntas que NO se hayan visto en la partida actual
  let matchAvailable = allMatching.filter(q => !matchSeenIds || !matchSeenIds.has(q.id));
  if (matchAvailable.length === 0) {
    // Si en esta partida ya se agotó el grupo, permitir cualquiera del grupo
    matchAvailable = allMatching;
  }

  // 2. Filtrar preguntas que NO se hayan visto históricamente
  const unseenGlobally = matchAvailable.filter(q => !persistentSeenIds.has(q.id));

  let chosen: Question;
  if (unseenGlobally.length > 0) {
    // Tomar aleatoriamente entre las preguntas que NUNCA ha visto
    chosen = unseenGlobally[Math.floor(Math.random() * unseenGlobally.length)];
  } else {
    // ¡Ha completado el 100% de las preguntas de este grupo! Reiniciar ciclo para este grupo específico
    resetSeenQuestionsForPool(allMatching.map(q => q.id));
    chosen = matchAvailable[Math.floor(Math.random() * matchAvailable.length)];
  }

  // Registrar en el histórico global
  recordBoardSeenQuestion(chosen.id);

  // Si hay un set de la partida actual, registrarla inmediatamente para que ningún otro jugador la vea
  if (matchSeenIds) {
    matchSeenIds.add(chosen.id);
  }

  return shuffleQuestionOptions(chosen);
}

// Función de Clamping Matemático para evitar que el tablero se desplace fuera de la pantalla (pantalla negra)
const calculateClampedCameraTransform = (cam: { x: number; y: number; zoom: number }) => {
  const zoom = Math.max(1, cam.zoom);
  if (zoom === 1) {
    return { translateX: 0, translateY: 0, zoom: 1 };
  }
  const minTrans = 100 * (1 - zoom);
  const maxTrans = 0;

  const rawTransX = 50 - cam.x * zoom;
  const rawTransY = 50 - cam.y * zoom;

  const translateX = Math.max(minTrans, Math.min(maxTrans, rawTransX));
  const translateY = Math.max(minTrans, Math.min(maxTrans, rawTransY));

  return { translateX, translateY, zoom };
};

async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  
  // 1. Intentar con Clipboard API moderna
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn("navigator.clipboard fallo, probando fallback:", e);
    }
  }

  // 2. Fallback universal compatible con móviles, HTTP y navegadores antiguos
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    textArea.style.top = (window.pageYOffset || document.documentElement.scrollTop) + "px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Error en fallback execCommand:", err);
    return false;
  }
}

function getShuffledBibleAvatars(count: number, preferredAvatar?: string): string[] {
  const allImages = BIBLE_AVATARS.map(a => a.imagePath);
  const shuffled = [...allImages].sort(() => Math.random() - 0.5);
  if (preferredAvatar) {
    const filtered = shuffled.filter(img => img !== preferredAvatar);
    return [preferredAvatar, ...filtered].slice(0, count);
  }
  return shuffled.slice(0, count);
}

function TurnTimerAvatarRing({
  avatar,
  name,
  isActive,
  timeLeft,
  timeLimit,
  size = 'md',
  onClick
}: {
  avatar?: string;
  name: string;
  isActive: boolean;
  timeLeft: number;
  timeLimit: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const dimension = size === 'sm' ? 34 : size === 'lg' ? 46 : 40;
  const strokeWidth = size === 'sm' ? 2.5 : 3.5;
  const radius = (dimension / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLimit >= 99999 ? 1 : Math.max(0, Math.min(1, timeLeft / timeLimit));
  const strokeDashoffset = circumference * (1 - progress);

  let strokeColor = '#10B981'; // Verde Esmeralda
  if (progress <= 0.2) strokeColor = '#EF4444'; // Rojo Peligro
  else if (progress <= 0.5) strokeColor = '#F59E0B'; // Ámbar Alerta

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width: dimension, height: dimension }}
    >
      {/* Anillo de fondo SVG */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
        />
        {isActive && (
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.85s linear, stroke 0.3s ease',
              filter: `drop-shadow(0 0 4px ${strokeColor})`
            }}
          />
        )}
      </svg>

      {/* Imagen del Avatar */}
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center bg-stone-900 border transition ${
          isActive ? 'scale-95 ring-1 ring-white/30' : 'border-stone-800'
        }`}
        style={{ width: dimension - strokeWidth * 2 - 4, height: dimension - strokeWidth * 2 - 4 }}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-black text-amber-200 text-xs">{name.charAt(0)}</span>
        )}
      </div>
    </div>
  );
}

function DiceFace({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const dotPositions: Record<number, string[]> = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'mid-left', 'mid-right', 'bottom-left', 'bottom-right'],
  };

  const dots = dotPositions[value] || ['center'];
  const isSm = size === 'sm';

  return (
    <div
      className={`relative ${
        isSm ? 'w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-1.5' : 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2.5'
      } bg-gradient-to-br from-white via-amber-50 to-amber-200 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.9)] border-2 border-amber-300 flex items-center justify-center shrink-0`}
    >
      <div className="relative w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 sm:gap-1">
        {dots.map((pos, i) => {
          let colClass = "col-start-2 row-start-2";
          if (pos === 'top-left') colClass = "col-start-1 row-start-1";
          if (pos === 'top-right') colClass = "col-start-3 row-start-1";
          if (pos === 'mid-left') colClass = "col-start-1 row-start-2";
          if (pos === 'mid-right') colClass = "col-start-3 row-start-2";
          if (pos === 'bottom-left') colClass = "col-start-1 row-start-3";
          if (pos === 'bottom-right') colClass = "col-start-3 row-start-3";

          return (
            <div
              key={i}
              className={`${
                isSm ? 'w-2 h-2 sm:w-2.5 sm:h-2.5' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'
              } rounded-full bg-gradient-to-br from-rose-600 via-rose-700 to-rose-950 shadow-inner justify-self-center self-center ${colClass}`}
            />
          );
        })}
      </div>
    </div>
  );
}

interface Player {
  id: string | number;
  name: string;
  avatar?: string;
  country?: string;
  countryFlag?: string;
  color: string;
  position: number;
  skipNextTurn: boolean;
  score?: number;
  isBot?: boolean;
  consecutiveSixes?: number;
  tile9Count?: number;
}

function BoardGameMode({
  onExit,
  isOnline = false,
  onlineRoom = null,
  userProfile = null,
  userTalents: propUserTalents,
  onUpdateTalents,
  initialTimeLimit = 15,
  initialSubMode = 'SOLO',
  initialCustomStudyFilter = null,
  onOpenNewRoom,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenAbout,
  onOpenPremiumModal,
  isSoundOn = true,
  onToggleSound,
  onInsufficientTalents,
}: {
  onExit: () => void;
  isOnline?: boolean;
  onlineRoom?: OnlineRoom | null;
  userProfile?: UserProfile | null;
  userTalents?: number;
  onUpdateTalents?: (newBalance: number) => void;
  initialTimeLimit?: number;
  initialSubMode?: 'SOLO' | 'GRUPO_LOCAL' | 'VS_BOTS';
  initialCustomStudyFilter?: CustomStudyFilter | null;
  onOpenNewRoom?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenProfile?: () => void;
  onOpenAbout?: () => void;
  onOpenPremiumModal?: () => void;
  isSoundOn?: boolean;
  onToggleSound?: () => void;
  onInsufficientTalents?: (info: { show: boolean; required: number; modeName: string }) => void;
}) {
  const [customStudyFilter] = useState<CustomStudyFilter | null>(initialCustomStudyFilter);
  const [gameSubMode, setGameSubMode] = useState<'SOLO' | 'GRUPO_LOCAL' | 'VS_BOTS'>(initialSubMode);
  const [friendInviteNotification, setFriendInviteNotification] = useState<string | null>(null);
  const [selectedGroupPlayers, setSelectedGroupPlayers] = useState<number>(2);
  const [selectedBotOpponents, setSelectedBotOpponents] = useState<number>(1);
  const [numPlayers, setNumPlayers] = useState<number>(() => (isOnline && onlineRoom ? onlineRoom.players.length : (initialSubMode === 'SOLO' ? 1 : initialSubMode === 'VS_BOTS' ? 2 : 2)));
  const [gameStarted, setGameStarted] = useState<boolean>(() => Boolean(isOnline && onlineRoom));
  const [players, setPlayers] = useState<Player[]>(() => {
    const colors = [
      'bg-amber-500 text-black border-amber-300',
      'bg-blue-500 text-white border-blue-300',
      'bg-emerald-500 text-white border-emerald-300',
      'bg-purple-500 text-white border-purple-300',
      'bg-rose-500 text-white border-rose-300',
      'bg-cyan-500 text-black border-cyan-300',
      'bg-orange-500 text-white border-orange-300',
      'bg-teal-500 text-white border-teal-300'
    ];
    if (isOnline && onlineRoom && Array.isArray(onlineRoom.players) && onlineRoom.players.length > 0) {
      const assignedAvatars = getShuffledBibleAvatars(onlineRoom.players.length);
      return onlineRoom.players.map((p, i) => ({
        id: p.id,
        name: p.name || `Jugador ${i + 1}`,
        avatar: p.avatar || assignedAvatars[i % assignedAvatars.length],
        country: p.country || (i === 0 ? userProfile?.country || 'DO' : 'DO'),
        countryFlag: p.countryFlag || (i === 0 ? userProfile?.countryFlag || '🇩🇴' : '🇩🇴'),
        color: colors[i % colors.length],
        position: p.position || 0,
        skipNextTurn: false,
        score: p.score || 0,
        isBot: Boolean(p.isBot),
      }));
    }
    const initialAvatars = getShuffledBibleAvatars(2, userProfile?.avatar);
    return [
      { id: userProfile?.id || 1, name: userProfile?.name || "Jugador 1", avatar: initialAvatars[0], country: userProfile?.country || 'DO', countryFlag: userProfile?.countryFlag || '🇩🇴', color: colors[0], position: 0, skipNextTurn: false },
      { id: 2, name: "Jugador 2", avatar: initialAvatars[1], country: 'DO', countryFlag: '🇩🇴', color: colors[1], position: 0, skipNextTurn: false },
    ];
  });

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const isSolo = players.length === 1;
  const [dice, setDice] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isTurnProcessing, setIsTurnProcessing] = useState<boolean>(false);
  const [hasExtraRoll, setHasExtraRoll] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [camera, setCamera] = useState<{ x: number; y: number; zoom: number }>({ x: 50, y: 50, zoom: 1 });
  const [isAutoZoomEnabled, setIsAutoZoomEnabled] = useState<boolean>(true);
  const [logMessage, setLogMessage] = useState<string>(() =>
    isOnline
      ? "🎮 ¡Partida en Línea Iniciada! Turno del Jugador 1."
      : "¡Elige la cantidad de jugadores para iniciar!"
  );
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeQuestionTile, setActiveQuestionTile] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [localInsufficientTalentsModal, setLocalInsufficientTalentsModal] = useState<{ show: boolean; required: number; modeName: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [matchSeenQuestionIds, setMatchSeenQuestionIds] = useState<Set<string>>(() => new Set());

  // Estadísticas de la Sesión para Ranking y Solo Score
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [sessionTotalQuestions, setSessionTotalQuestions] = useState<number>(0);
  const [sessionTurnsCount, setSessionTurnsCount] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [sessionSoloScoreResult, setSessionSoloScoreResult] = useState<SoloScoreResult | null>(null);
  const [sessionTalentsEarned, setSessionTalentsEarned] = useState<number | undefined>(undefined);
  const [userTalents, setUserTalentsState] = useState<number>(() => propUserTalents !== undefined ? propUserTalents : getTalentsBalance());
  const [showHeaderMenu, setShowHeaderMenu] = useState<boolean>(false);
  const [groupPlayerCustomizations, setGroupPlayerCustomizations] = useState<Array<{ name: string; avatar: string }>>(() => {
    const defaultAvatars = BIBLE_AVATARS.map(a => a.imagePath);
    return Array.from({ length: 8 }, (_, i) => ({
      name: i === 0 && userProfile?.name ? userProfile.name : BIBLE_AVATARS[i % BIBLE_AVATARS.length]?.name || `Jugador ${i + 1}`,
      avatar: i === 0 && userProfile?.avatar ? userProfile.avatar : defaultAvatars[i % defaultAvatars.length]
    }));
  });

  const setUserTalents = (newVal: number) => {
    setUserTalentsState(newVal);
    if (onUpdateTalents) {
      onUpdateTalents(newVal);
    }
  };

  useEffect(() => {
    if (propUserTalents !== undefined) {
      setUserTalentsState(propUserTalents);
    }
  }, [propUserTalents]);

  // Sincronizar dinámicamente los jugadores de la sala online
  useEffect(() => {
    if (isOnline && onlineRoom && Array.isArray(onlineRoom.players) && onlineRoom.players.length > 0) {
      const colors = [
        'bg-amber-500 text-black border-amber-300',
        'bg-blue-500 text-white border-blue-300',
        'bg-emerald-500 text-white border-emerald-300',
        'bg-purple-500 text-white border-purple-300',
        'bg-rose-500 text-white border-rose-300',
        'bg-cyan-500 text-black border-cyan-300',
        'bg-orange-500 text-white border-orange-300',
        'bg-teal-500 text-white border-teal-300'
      ];
      const assignedAvatars = getShuffledBibleAvatars(onlineRoom.players.length);
      setPlayers(prev => {
        return onlineRoom.players.map((p, i) => {
          const existing = prev.find(ep => String(ep.id) === String(p.id));
          return {
            id: p.id,
            name: p.name || `Jugador ${i + 1}`,
            avatar: p.avatar || assignedAvatars[i % assignedAvatars.length],
            country: p.country || (i === 0 ? userProfile?.country || 'DO' : 'DO'),
            countryFlag: p.countryFlag || (i === 0 ? userProfile?.countryFlag || '🇩🇴' : '🇩🇴'),
            color: colors[i % colors.length],
            position: existing ? existing.position : (p.position || 0),
            skipNextTurn: existing ? existing.skipNextTurn : false,
            score: p.score || 0,
            isBot: Boolean(p.isBot),
          };
        });
      });
      setNumPlayers(onlineRoom.players.length);
    }
  }, [isOnline, onlineRoom?.players]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [questionTimeLimit, setQuestionTimeLimit] = useState<number>(initialTimeLimit || 15);
  const [boardTimeLeft, setBoardTimeLeft] = useState<number>(15);
  const [isBoardTimerRunning, setIsBoardTimerRunning] = useState<boolean>(false);

  // Temporizador de Turno del Jugador (Inactividad / Límite de tiro) - 60s por defecto (1 minuto)
  const [turnTimeLimit, setTurnTimeLimit] = useState<number>(60);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(60);
  const [avatarPickerPlayerIndex, setAvatarPickerPlayerIndex] = useState<number | null>(null);
  const [isMovingStepByStep, setIsMovingStepByStep] = useState<boolean>(false);
  const [diceInputMode, setDiceInputMode] = useState<'DIGITAL' | 'FISICO'>('DIGITAL');

  // Estado para revertir/deshacer última tirada o movimiento si hubo error
  const [lastTurnSnapshot, setLastTurnSnapshot] = useState<{
    players: Player[];
    activePlayerIndex: number;
    dice: number | null;
    logMessage: string;
  } | null>(null);

  // Duración de la Carrera en Solitario (300s = 5m, 600s = 10m, 900s = 15m, 1200s = 20m, 99999 = Infinito)
  const [soloMatchDuration, setSoloMatchDuration] = useState<number>(600);
  const [soloMatchTimeLeft, setSoloMatchTimeLeft] = useState<number>(600);
  const [soloTimeElapsed, setSoloTimeElapsed] = useState<number>(0);
  const [showSoloLeaderboardModal, setShowSoloLeaderboardModal] = useState<boolean>(false);
  const [soloLeaderboardFilter, setSoloLeaderboardFilter] = useState<string>('TODOS');

  // Modo de Preguntas y Complejidad para Tablero Local (Adaptado dinámicamente según Nivel y Rating)
  const [localTheme, setLocalTheme] = useState<string>('PERIODOS');
  const [localDifficulty, setLocalDifficulty] = useState<'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | 'MIXTO'>(() => {
    const diffInfo = getAvailableDifficulties(userProfile?.rating || 1000);
    return diffInfo.defaultDifficulty;
  });

  // Estado de Rendición / Abandono de Duelo
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState<boolean>(false);
  const [surrenderInfo, setSurrenderInfo] = useState<{ surrenderedName: string; isMeSurrendered: boolean } | null>(null);

  // Toast y feedback animado de talentos (+/-)
  const [talentToast, setTalentToast] = useState<{ show: boolean; text: string; type: 'gain' | 'loss' } | null>(null);

  const showTalentAnimationToast = (text: string, type: 'gain' | 'loss') => {
    setTalentToast({ show: true, text, type });
    setTimeout(() => {
      setTalentToast(null);
    }, 3200);
  };

  // Función para abandonar voluntariamente el duelo
  const handleSurrenderMatch = () => {
    setShowSurrenderConfirm(false);
    playGameSound('wrong');
    triggerHaptic('error');

    const me = currentPlayer || players[0];
    const opponent = players.find(p => p.id !== me.id) || players[1] || players[0];

    setSurrenderInfo({
      surrenderedName: me.name,
      isMeSurrendered: true
    });

    if (isOnline) {
      onlineService.sendGameAction('PLAYER_SURRENDER', {
        surrenderedPlayerId: me.id,
        surrenderedPlayerName: me.name,
        winnerId: opponent.id,
        winnerName: opponent.name
      });
    }

    // Al abandonar, el oponente es declarado ganador
    handleGameVictory(opponent, false);
  };

  // Función robusta para finalizar partida y registrar puntuación
  const handleGameVictory = (winner?: Player, completedGoal = true) => {
    setActiveQuestion(null);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsBoardTimerRunning(false);
    setIsTurnProcessing(false);
    setIsRolling(false);

    const actualWinner: Player = winner || players[activePlayerIndex] || players[0] || currentPlayer || {
      id: 1,
      name: userProfile?.name || 'Jugador Bíblico',
      avatar: userProfile?.avatar || '/avatars/david.jpg',
      color: 'bg-amber-500 text-black border-amber-300',
      position: 0,
      skipNextTurn: false
    };

    setGameWinner(actualWinner);
    setIsGameOver(true);
    playGameSound(completedGoal ? 'projection' : 'correct');
    triggerHaptic('success');
    confetti({ particleCount: 160, spread: 100, origin: { y: 0.4 } });

    const currentTilePos = typeof actualWinner.position === 'number' ? actualWinner.position : 0;
    const isSolo = players.length === 1;

    if (completedGoal) {
      setLogMessage(`🏆 ¡¡${actualWinner.name} HA ALCANZADO LA META BÍBLICA (Casilla 75)!! 🏆`);
    } else {
      setLogMessage(`🏁 Carrera Finalizada: ${actualWinner.name} alcanzó la casilla ${currentTilePos}/75 con gran rendimiento.`);
    }

    const elapsedSeconds = isSolo
      ? (soloMatchDuration >= 99999 ? soloTimeElapsed : Math.max(1, soloMatchDuration - soloMatchTimeLeft))
      : Math.floor((Date.now() - sessionStartTime) / 1000);

    // Calcular puntuación competitiva y rating ELO bíblico
    const soloResult = calculateSoloScore({
      correct: sessionCorrectCount,
      errors: Math.max(0, sessionTotalQuestions - sessionCorrectCount),
      difficulty: localDifficulty,
      timeSeconds: elapsedSeconds,
      turns: Math.max(1, sessionTurnsCount),
      tilesAdvanced: currentTilePos,
      completed: currentTilePos >= 75,
      currentRating: userProfile?.rating || 1000,
    });

    setSessionSoloScoreResult(soloResult);

    // Actualizar perfil y estadísticas
    updateUserRating(soloResult.ratingDelta);
    updateUserSoloScore(soloResult.totalSoloScore);
    recordGameCompleted();

    const timeCategory = soloMatchDuration === 300 ? '5_MIN'
      : soloMatchDuration === 600 ? '10_MIN'
      : soloMatchDuration === 900 ? '15_MIN'
      : soloMatchDuration === 1200 ? '20_MIN'
      : 'INFINITO';

    // Guardar en el Salón de la Fama
    saveLeaderboardEntry({
      playerName: userProfile?.name || actualWinner.name || 'Jugador Bíblico',
      playerAvatar: userProfile?.avatar || actualWinner.avatar || '/avatars/david.jpg',
      playerCountry: userProfile?.country || actualWinner.country || 'DO',
      playerCountryFlag: userProfile?.countryFlag || actualWinner.countryFlag || '🇩🇴',
      mode: isSolo ? 'TABLERO_SOLO' : isOnline ? 'ONLINE' : 'TABLERO_DUEL',
      score: soloResult.totalSoloScore,
      rating: soloResult.newRating,
      rankTitle: soloResult.rankTier.title,
      rankIcon: soloResult.rankTier.icon,
      accuracy: sessionTotalQuestions > 0 ? Math.round((sessionCorrectCount / sessionTotalQuestions) * 100) : 100,
      totalQuestions: sessionTotalQuestions,
      correctQuestions: sessionCorrectCount,
      timeSeconds: elapsedSeconds,
      turns: Math.max(1, sessionTurnsCount),
      difficulty: localDifficulty,
      timeCategory,
      tilesReached: currentTilePos,
    });

    if (isOnline) {
      onlineService.sendGameAction('GAME_OVER', { winnerId: actualWinner.id, winnerName: actualWinner.name });
    }

    // CALCULAR Y APLICAR RECOMPENSA DE TALENTOS BÍBLICOS
    let earnedTalents = 0;
    const isPlayerWinner = actualWinner.id === currentPlayer?.id || actualWinner.name === (userProfile?.name || 'Jugador Bíblico');

    if (isOnline) {
      const isFriendRoom = onlineRoom?.code?.startsWith('AMIGOS-') || onlineRoom?.isPrivate;

      if (isFriendRoom) {
        // Partidas con Amigos: No cuesta nada entrar y siempre premia a los 3 primeros con talentos del sistema
        const sorted = [...players].sort((a, b) => (b.position || 0) - (a.position || 0));
        const myRank = sorted.findIndex(p => p.id === currentPlayer?.id || p.name === (userProfile?.name || 'Jugador Bíblico')) + 1;
        
        if (myRank === 1) {
          earnedTalents = 3;
          addTalents(3, '🥇 1º Lugar en Partida con Amigos (+3 🪙)', 'FRIENDS_MATCH_REWARD');
          showTalentAnimationToast('🪙 ¡+3 Talentos por 1º Lugar!', 'gain');
        } else if (myRank === 2) {
          earnedTalents = 2;
          addTalents(2, '🥈 2º Lugar en Partida con Amigos (+2 🪙)', 'FRIENDS_MATCH_REWARD');
          showTalentAnimationToast('🪙 ¡+2 Talentos por 2º Lugar!', 'gain');
        } else if (myRank === 3) {
          earnedTalents = 1;
          addTalents(1, '🥉 3º Lugar en Partida con Amigos (+1 🪙)', 'FRIENDS_MATCH_REWARD');
          showTalentAnimationToast('🪙 ¡+1 Talento por 3º Lugar!', 'gain');
        } else {
          earnedTalents = 0;
          showTalentAnimationToast('🕊️ ¡Gran partida con amigos!', 'gain');
        }
      } else if (players.length === 2) {
        // Duelo 1 vs 1: si gana, recibe +2 talentos (recupera su 1 y gana 1 del rival)
        if (isPlayerWinner) {
          earnedTalents = FEES.MATCH_1V1_WIN;
          addTalents(FEES.MATCH_1V1_WIN, 'Victoria en Duelo 1 vs 1 (+2 🪙)', 'MATCH_1V1_WIN');
          showTalentAnimationToast('🪙 ¡+2 Talentos ganados por tu victoria!', 'gain');
        } else {
          earnedTalents = -FEES.MATCH_1V1;
          showTalentAnimationToast('🪙 Has perdido 1 talento en esta partida', 'loss');
        }
      } else if (players.length >= 3) {
        // Todos Vs Todos (3 a 8 jugadores):
        const sorted = [...players].sort((a, b) => (b.position || 0) - (a.position || 0));
        const myRank = sorted.findIndex(p => p.id === currentPlayer?.id || p.name === (userProfile?.name || 'Jugador Bíblico')) + 1;
        if (myRank === 1) {
          earnedTalents = 3;
          addTalents(3, '🥇 1º Lugar en Todos Vs Todos (+3 🪙)', 'GROUP_MATCH_WIN');
          showTalentAnimationToast('🪙 ¡+3 Talentos por 1º Lugar!', 'gain');
        } else if (myRank === 2) {
          earnedTalents = 2;
          addTalents(2, '🥈 2º Lugar en Todos Vs Todos (+2 🪙)', 'GROUP_MATCH_WIN');
          showTalentAnimationToast('🪙 ¡+2 Talentos por 2º Lugar!', 'gain');
        } else if (myRank === 3) {
          earnedTalents = 1;
          addTalents(1, '🥉 3º Lugar en Todos Vs Todos (+1 🪙)', 'GROUP_MATCH_WIN');
          showTalentAnimationToast('🪙 ¡+1 Talento recuperado por 3º Lugar!', 'gain');
        } else {
          earnedTalents = -FEES.GROUP_MATCH;
          showTalentAnimationToast('🪙 Has perdido 1 talento en esta partida', 'loss');
        }
      }
    } else if (isSolo) {
      // En Solitario: Si completa la meta o logra desempeño destacado (score >= 400), gana +2 talentos
      if (completedGoal || soloResult.totalSoloScore >= 400) {
        earnedTalents = FEES.SOLO_MATCH_WIN;
        addTalents(FEES.SOLO_MATCH_WIN, 'Victoria en Carrera Solitario (+2 🪙)', 'SOLO_MATCH_WIN');
        showTalentAnimationToast('🪙 ¡+2 Talentos ganados por superar el desafío!', 'gain');
      } else {
        earnedTalents = -FEES.SOLO_MATCH;
        showTalentAnimationToast('🪙 Has consumido 1 talento en la carrera', 'loss');
      }
    } else {
      // Modo Grupal Local (2 a 8 en el mismo dispositivo): Solo consumo recreativo de 1 talento (sin recompensa de talentos)
      earnedTalents = -FEES.LOCAL_GROUP;
      showTalentAnimationToast(`🏁 ¡Partida grupal finalizada! Gran victoria de ${actualWinner.name}`, 'gain');
    }

    setSessionTalentsEarned(earnedTalents);
    setUserTalents(getTalentsBalance());
  };

  // Animación del Dado 3D y paso a paso
  const [diceAnimState, setDiceAnimState] = useState<{
    visible: boolean;
    displayValue: number;
    finalValue: number;
    isSpinning: boolean;
  }>({
    visible: false,
    displayValue: 1,
    finalValue: 1,
    isSpinning: false
  });

  // Fanfarria Orquestal Épica de Victoria y Triunfo Bíblico (5 a 6 segundos)
  const playVictoryFanfare = (isWinner: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (isWinner) {
        // Melodía triunfal épica de trompetas doradas y acordes de gloria
        const fanfareNotes: Array<{ freq: number; time: number; dur: number }> = [
          // Clarines de llamada inicial
          { freq: 523.25, time: 0.0, dur: 0.22 },  // Do5
          { freq: 523.25, time: 0.24, dur: 0.12 }, // Do5
          { freq: 523.25, time: 0.38, dur: 0.12 }, // Do5
          { freq: 659.25, time: 0.52, dur: 0.35 }, // Mi5
          { freq: 783.99, time: 0.90, dur: 0.50 }, // Sol5

          // Frase 2: Ascenso triunfal
          { freq: 659.25, time: 1.45, dur: 0.18 }, // Mi5
          { freq: 783.99, time: 1.65, dur: 0.18 }, // Sol5
          { freq: 1046.50, time: 1.85, dur: 0.70 }, // Do6 (Alta)

          // Frase 3: Clímax de fanfarria
          { freq: 880.00, time: 2.60, dur: 0.25 },  // La5
          { freq: 987.77, time: 2.88, dur: 0.25 },  // Si5
          { freq: 1046.50, time: 3.15, dur: 0.35 }, // Do6
          { freq: 1318.51, time: 3.55, dur: 0.40 }, // Mi6

          // Gran acorde final triunfal sostenido y glorioso
          { freq: 1046.50, time: 4.00, dur: 2.00 }, // Do6
          { freq: 1318.51, time: 4.00, dur: 2.00 }, // Mi6
          { freq: 1567.98, time: 4.00, dur: 2.00 }, // Sol6
          { freq: 523.25, time: 4.00, dur: 2.00 },  // Do5
        ];

        fanfareNotes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.exponentialRampToValueAtTime(0.28, now + time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);
        });
      } else {
        // Melodía solemne y respetuosa de finalización
        const defeatNotes = [
          { freq: 440.00, time: 0.0, dur: 0.45 },
          { freq: 392.00, time: 0.48, dur: 0.45 },
          { freq: 349.23, time: 0.95, dur: 0.55 },
          { freq: 329.63, time: 1.55, dur: 1.60 },
        ];
        defeatNotes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);
          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.exponentialRampToValueAtTime(0.22, now + time + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const myPlayerIndex = useMemo(() => {
    if (!isOnline || !onlineRoom || !Array.isArray(onlineRoom.players)) return 0;
    const currentSocketId = onlineService.getSocketId();
    // 1. Buscar por socket.id
    if (currentSocketId) {
      const idxBySocket = onlineRoom.players.findIndex(p => String(p.id) === String(currentSocketId));
      if (idxBySocket !== -1) return idxBySocket;
    }
    // 2. Buscar por userId
    if (userProfile?.id) {
      const idxByUserId = onlineRoom.players.findIndex(p => String((p as any).userId || p.id) === String(userProfile.id));
      if (idxByUserId !== -1) return idxByUserId;
    }
    // 3. Buscar por name
    if (userProfile?.name) {
      const idxByName = onlineRoom.players.findIndex(p => p.name.trim().toLowerCase() === userProfile.name.trim().toLowerCase());
      if (idxByName !== -1) return idxByName;
    }
    return 0;
  }, [isOnline, onlineRoom, userProfile]);

  const isThisPlayerMe = (player: Player | null | undefined, idx?: number): boolean => {
    if (!isOnline) return true;
    if (typeof idx === 'number') return idx === myPlayerIndex;
    if (!player) return false;
    const pIdx = players.findIndex(p => p.id === player.id);
    if (pIdx !== -1) return pIdx === myPlayerIndex;
    return false;
  };

  const defaultPlayer: Player = {
    id: 1,
    name: userProfile?.name || "Jugador 1",
    avatar: userProfile?.avatar || "/avatars/david.jpg",
    color: "bg-amber-500 text-black border-amber-300",
    position: 0,
    skipNextTurn: false
  };
  const currentPlayer = players[activePlayerIndex] || players[0] || defaultPlayer;
  const isMyTurn = !isOnline || activePlayerIndex === myPlayerIndex;

  // Automatización de turnos para Rivales Bíblicos / Bots en 1v1
  useEffect(() => {
    if (!gameStarted || isGameOver) return;
    const currentP = players[activePlayerIndex];
    if (!currentP || !currentP.isBot) return;

    if (currentP.skipNextTurn) {
      const skipTimer = setTimeout(() => {
        passTurnSanction();
      }, 1500);
      return () => clearTimeout(skipTimer);
    }

    if (activeQuestion) {
      const ansTimer = setTimeout(() => {
        if (!showAnswer) {
          const willAnswerCorrect = Math.random() < 0.75;
          const chosenOpt = willAnswerCorrect
            ? activeQuestion.correctAnswer
            : (activeQuestion.correctAnswer + 1) % activeQuestion.options.length;
          handleQuestionAnswer(chosenOpt);
        }
      }, 2000);
      return () => clearTimeout(ansTimer);
    }

    if (!isRolling && !isTurnProcessing && !activeQuestion) {
      const rollTimer = setTimeout(() => {
        rollDice();
      }, 1400);
      return () => clearTimeout(rollTimer);
    }
  }, [activePlayerIndex, isRolling, isTurnProcessing, Boolean(activeQuestion), showAnswer, gameStarted, isGameOver, players]);

  // Desbloqueo automático y seguro del dado
  useEffect(() => {
    setIsRolling(false);
    setIsTurnProcessing(false);
  }, [activePlayerIndex, hasExtraRoll, Boolean(activeQuestion)]);

  // Sincronización de acciones en tiempo real para modo online
  useEffect(() => {
    if (!isOnline) return;

    const unsubscribe = onlineService.subscribeGameAction(({ action, payload, senderId }) => {
      // Ignorar eventos enviados por uno mismo para evitar doble ejecución y desincronización
      const currentSocketId = onlineService.getSocketId();
      if (senderId && currentSocketId && senderId === currentSocketId) return;

      if (action === 'SET_TIME_LIMIT') {
        setQuestionTimeLimit(payload.timeLimit);
      } else if (action === 'ROLL_DICE') {
        playGameSound('select');
        setDice(payload.roll);
        setIsRolling(true);
        triggerHaptic('medium');

        setTimeout(() => {
          setIsRolling(false);
          setPlayers(prev =>
            prev.map((p, idx) =>
              idx === payload.playerIndex
                ? { ...p, position: payload.newPos, skipNextTurn: payload.skipNextTurn || false }
                : p
            )
          );
          setLogMessage(payload.logMessage);

          if (payload.rollAgain) {
            setHasExtraRoll(true);
          } else {
            setHasExtraRoll(false);
          }

          // Cámara hace zoom hacia la casilla donde cayó el jugador
          const targetCoords = (boardCoordinates as Array<{ x: number; y: number }>)[payload.newPos] || { x: 50, y: 50 };
          if (isAutoZoomEnabled) {
            setCamera({ x: targetCoords.x, y: targetCoords.y, zoom: 1.85 });
          }

          if (payload.newPos >= 75) {
            setGameWinner(players[payload.playerIndex] || currentPlayer);
            setIsGameOver(true);
            playGameSound('projection');
            triggerHaptic('success');
            confetti({ particleCount: 160, spread: 100, origin: { y: 0.4 } });
            return;
          }

          if (payload.question) {
            setActiveQuestion(payload.question);
            setActiveQuestionTile(payload.newPos);
            setShowAnswer(false);
            setSelectedOption(null);
            setBoardTimeLeft(payload.timeLimit || questionTimeLimit);
            setIsBoardTimerRunning(true);
          } else if (payload.nextIndex !== undefined && !payload.rollAgain) {
            if (payload.skippedPlayerIdx !== undefined && payload.skippedPlayerIdx !== null) {
              setPlayers(prev =>
                prev.map((p, idx) =>
                  idx === payload.skippedPlayerIdx ? { ...p, skipNextTurn: false } : p
                )
              );
            }
            setTimeout(() => {
              setActivePlayerIndex(payload.nextIndex);
              setTurnTimeLeft(turnTimeLimit);
              setCamera({ x: 50, y: 50, zoom: 1 });
            }, 600);
          }
        }, 400);
      } else if (action === 'ANSWER_QUESTION') {
        setSelectedOption(payload.optionIdx);
        setShowAnswer(true);
        setIsBoardTimerRunning(false);

        if (payload.isCorrect) {
          playGameSound('correct');
          triggerHaptic('success');
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } else {
          playGameSound('wrong');
          triggerHaptic('error');
        }
        setLogMessage(payload.logMessage);

        setTimeout(() => {
          setActiveQuestion(null);
          setShowAnswer(false);
          setSelectedOption(null);

          if (payload.newFinalPos !== undefined && payload.playerIndex !== undefined) {
            setPlayers(prev =>
              prev.map((p, idx) =>
                idx === payload.playerIndex ? { ...p, position: payload.newFinalPos } : p
              )
            );
            const finalCoord = (boardCoordinates as Array<{ x: number; y: number }>)[payload.newFinalPos] || { x: 50, y: 50 };
            if (isAutoZoomEnabled) {
              setCamera({ x: finalCoord.x, y: finalCoord.y, zoom: 1.85 });
            }

            if (payload.newFinalPos >= 75) {
              setGameWinner(players[payload.playerIndex] || currentPlayer);
              setIsGameOver(true);
              playGameSound('projection');
              triggerHaptic('success');
              confetti({ particleCount: 160, spread: 100, origin: { y: 0.4 } });
              return;
            }
          }

          if (payload.skippedPlayerIdx !== undefined && payload.skippedPlayerIdx !== null) {
            setPlayers(prev =>
              prev.map((p, idx) =>
                idx === payload.skippedPlayerIdx ? { ...p, skipNextTurn: false } : p
              )
            );
          }

          if (payload.shouldAdvanceTurn && payload.nextIndex !== undefined) {
            setActivePlayerIndex(payload.nextIndex);
            setTurnTimeLeft(turnTimeLimit);
            setTimeout(() => setCamera({ x: 50, y: 50, zoom: 1 }), 600);
          }
        }, 700);
      } else if (action === 'PASS_SANCTION') {
        setPlayers(prev =>
          prev.map((p, idx) =>
            idx === payload.clearedPlayerIdx ? { ...p, skipNextTurn: false } : p
          )
        );
        setActivePlayerIndex(payload.nextIndex);
        setTurnTimeLeft(turnTimeLimit);
        setLogMessage(payload.logMessage);
      } else if (action === 'PLAYER_SURRENDER') {
        const winner = players.find(p => String(p.id) === String(payload.winnerId)) || players[0];
        setSurrenderInfo({
          surrenderedName: payload.surrenderedPlayerName || 'El rival',
          isMeSurrendered: false
        });
        setGameWinner(winner);
        setIsGameOver(true);
        playGameSound('projection');
        triggerHaptic('success');
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.4 } });

        // Si soy el ganador porque el rival se rindió, acreditar los talentos de victoria
        if (winner.id === currentPlayer?.id || winner.name === (userProfile?.name || 'Jugador Bíblico')) {
          addTalents(FEES.MATCH_1V1_WIN, 'Victoria por Abandono del Rival (+2 🪙)', 'MATCH_1V1_WIN');
          setSessionTalentsEarned(FEES.MATCH_1V1_WIN);
          setUserTalents(getTalentsBalance());
        }
      } else if (action === 'GAME_OVER') {
        const winner = players.find(p => String(p.id) === String(payload.winnerId)) || players[0];
        setGameWinner(winner);
        setIsGameOver(true);
        playGameSound('projection');
        triggerHaptic('success');
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.4 } });
      } else if (action === 'RESTART_GAME') {
        playGameSound('select');
        setPlayers(prev => prev.map(p => ({ ...p, position: 0, skipNextTurn: false })));
        setActivePlayerIndex(0);
        setDice(null);
        setHasExtraRoll(false);
        setIsGameOver(false);
        setGameWinner(null);
        setActiveQuestion(null);
        setShowAnswer(false);
        setCamera({ x: 50, y: 50, zoom: 1 });
        setLogMessage("🔄 La partida ha sido reiniciada por el anfitrión.");
      } else if (action === 'TURN_TIMEOUT') {
        playGameSound('wrong');
        triggerHaptic('warning');
        setLogMessage(payload.logMessage || "⏰ ¡Tiempo agotado! Pasa el turno.");
        if (payload.nextIndex !== undefined) {
          setActivePlayerIndex(payload.nextIndex);
        }
        setTurnTimeLeft(turnTimeLimit);
      } else if (action === 'CHANGE_AVATAR') {
        setPlayers(prev =>
          prev.map((p, idx) =>
            idx === payload.playerIndex ? { ...p, avatar: payload.avatar } : p
          )
        );
      }
    });

    return () => unsubscribe();
  }, [isOnline, players, currentPlayer, turnTimeLimit]);

  const startNewGame = (count: number, isBotMatch: boolean = false) => {
    // Validar y descontar 1 Talento por entrada de partida
    const fee = count === 1 ? FEES.SOLO_MATCH : (isBotMatch ? FEES.MATCH_1V1 : FEES.LOCAL_GROUP);
    const modeName = count === 1 ? 'Carrera en Solitario' : (isBotMatch ? `Tablero contra BiblosBot (${count - 1} Bot${count > 2 ? 's' : ''})` : `Partida Grupal (${count} Jugadores)`);

    if (!canAffordTalents(fee)) {
      const info = {
        show: true,
        required: fee,
        modeName
      };
      setLocalInsufficientTalentsModal(info);
      if (onInsufficientTalents) {
        onInsufficientTalents(info);
      }
      return;
    }

    // Descontar talento y mostrar animación
    spendTalents(fee, `Entrada a ${modeName}`, count === 1 ? 'SOLO_MATCH_FEE' : (isBotMatch ? 'MATCH_1V1_FEE' : 'LOCAL_GROUP_FEE'));
    setUserTalents(getTalentsBalance());
    showTalentAnimationToast(`🪙 -1 Talento descontado para iniciar partida`, 'loss');

    playGameSound('intro');
    const colors = [
      'bg-amber-500 text-black border-amber-300',
      'bg-blue-500 text-white border-blue-300',
      'bg-emerald-500 text-white border-emerald-300',
      'bg-purple-500 text-white border-purple-300',
      'bg-rose-500 text-white border-rose-300',
      'bg-cyan-500 text-black border-cyan-300',
      'bg-orange-500 text-white border-orange-300',
      'bg-teal-500 text-white border-teal-300'
    ];
    const assignedAvatars = getShuffledBibleAvatars(count, userProfile?.avatar);
    setNumPlayers(count);
    setHasExtraRoll(false);
    setIsGameOver(false);
    setGameWinner(null);
    setMatchSeenQuestionIds(new Set());

    if (isBotMatch) {
      // Configurar jugador humano + bots bíblicos
      const BOT_NAMES = ['BiblosBot (David)', 'BiblosBot (Salomón)', 'BiblosBot (Daniel)', 'BiblosBot (Ester)'];
      const BOT_AVATARS = ['/avatars/david.jpg', '/avatars/salomon.jpg', '/avatars/daniel.jpg', '/avatars/esther.jpg'];

      const initialPlayersList: Player[] = [
        {
          id: 1,
          name: userProfile?.name || 'Jugador',
          avatar: userProfile?.avatar || assignedAvatars[0],
          color: colors[0],
          position: 0,
          skipNextTurn: false,
          isBot: false
        },
        ...Array.from({ length: count - 1 }, (_, bIdx) => ({
          id: bIdx + 2,
          name: BOT_NAMES[bIdx % BOT_NAMES.length],
          avatar: BOT_AVATARS[bIdx % BOT_AVATARS.length],
          color: colors[(bIdx + 1) % colors.length],
          position: 0,
          skipNextTurn: false,
          isBot: true
        }))
      ];
      setPlayers(initialPlayersList);
    } else {
      setPlayers(
        Array.from({ length: count }, (_, i) => {
          const custom = groupPlayerCustomizations[i] || { name: `Jugador ${i + 1}`, avatar: assignedAvatars[i % assignedAvatars.length] };
          return {
            id: i + 1,
            name: count === 1 ? (userProfile?.name || "Jugador Solitario") : (custom.name.trim() || `Jugador ${i + 1}`),
            avatar: count === 1 ? (userProfile?.avatar || assignedAvatars[0]) : custom.avatar,
            color: colors[i % colors.length],
            position: 0,
            skipNextTurn: false,
            isBot: false
          };
        })
      );
    }

    setActivePlayerIndex(0);
    setDice(null);
    setIsRolling(false);
    setIsTurnProcessing(false);
    setActiveQuestion(null);
    setShowAnswer(false);
    setSelectedOption(null);
    setTurnTimeLeft(turnTimeLimit);

    // Reiniciar estadísticas de la sesión para el Ranking y Solo Score
    setSessionStartTime(Date.now());
    setSessionCorrectCount(0);
    setSessionTotalQuestions(0);
    setSessionTurnsCount(0);
    setSessionSoloScoreResult(null);
    setSoloMatchTimeLeft(soloMatchDuration);
    setSoloTimeElapsed(0);

    if (count === 1) {
      setCountdown(3);
      setLogMessage("⚡ ¡PREPÁRATE! El juego en Solitario Contrarreloj está por iniciar...");
    } else if (isBotMatch) {
      setCountdown(3);
      setLogMessage(`🤖 ¡PARTIDA CONTRA BIBLOSBOT! Prepárate para lanzar el dado...`);
    } else {
      setLogMessage(`¡Juego iniciado con ${count} jugadores! Turno de Jugador 1.`);
    }
    setGameStarted(true);
  };

  // Cuenta regresiva 3, 2, 1 al empezar solitario
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      playGameSound('select');
      triggerHaptic('medium');
      const timer = setTimeout(() => setCountdown(countdown - 1), 900);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      playGameSound('correct');
      triggerHaptic('success');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
      const timer = setTimeout(() => {
        setCountdown(null);
        setLogMessage("🔥 ¡COMIENZA EL DESAFÍO! Lanza el dado.");
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Helper para determinar el tiempo límite dinámico según el grado de complejidad
  const getDynamicQuestionTimeLimit = (q?: Question | null, baseSetting: number = 15): number => {
    if (baseSetting >= 99999) return 99999;
    if (!q) return baseSetting;
    const d = String(q.difficulty || '').toUpperCase();
    if (d === 'BASIC' || d === 'PRINCIPIANTE') return 25;
    if (d === 'INTERMEDIATE' || d === 'INTERMEDIO') return 20;
    if (d === 'ADVANCED' || d === 'AVANZADO') return 15;
    return baseSetting;
  };

  // Cronómetro gigante para preguntas en el tablero (Basic 25s, Intermediate 20s, Advanced 15s o Infinito)
  useEffect(() => {
    if (!activeQuestion || !isBoardTimerRunning || showAnswer) return;

    const dynamicLimit = getDynamicQuestionTimeLimit(activeQuestion, questionTimeLimit);
    if (dynamicLimit >= 99999) {
      // Modo Infinito: No hay cuenta regresiva ni timeout
      setBoardTimeLeft(99999);
      return;
    }

    setBoardTimeLeft(dynamicLimit);

    const interval = setInterval(() => {
      setBoardTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          playGameSound('wrong');
          triggerHaptic('error');
          setShowAnswer(true);
          setIsBoardTimerRunning(false);
          
          if (isMyTurn) {
            const playerAtTurn = players[activePlayerIndex] || currentPlayer;
            const basePos = activeQuestionTile || playerAtTurn.position;
            const consequences = TRIVIA_CONSEQUENCES[basePos] || { bien: 3, mal: -2 };
            const penaltyCasillas = Math.abs(consequences.mal);
            const newFinalPos = Math.max(0, basePos - penaltyCasillas);
            const msg = `⏰ ¡TIEMPO AGOTADO! ${playerAtTurn.name} retrocede ${penaltyCasillas} casillas (baja a casilla ${newFinalPos}).`;
            setLogMessage(msg);

            const destTile = newFinalPos < 75 ? boardData.find(b => b.id === newFinalPos) : null;
            const shouldAdvanceTurn = !isSolo && destTile?.effect !== 'ROLL_AGAIN' && newFinalPos < 75;
            const nextIdx = (activePlayerIndex + 1) % players.length;

            if (isOnline) {
              onlineService.sendGameAction('ANSWER_QUESTION', {
                optionIdx: -1,
                isCorrect: false,
                playerIndex: activePlayerIndex,
                newFinalPos,
                nextIndex: nextIdx,
                shouldAdvanceTurn,
                logMessage: msg,
              });
            }

            // Cerrar modal y aplicar retroceso paso a paso
            setTimeout(() => {
              setActiveQuestion(null);
              setShowAnswer(false);
              setSelectedOption(null);

              movePlayerSteps(activePlayerIndex, basePos, newFinalPos, () => {
                if (newFinalPos < 75 && destTile && destTile.effect === 'ROLL_AGAIN') {
                  setHasExtraRoll(true);
                  playGameSound('correct');
                  triggerHaptic('success');
                  setLogMessage(`🌟 ¡Gran Bendición en casilla ${newFinalPos}! ${playerAtTurn.name} vuelve a tirar el dado.`);
                  return;
                }

                if (shouldAdvanceTurn) {
                  setTimeout(() => {
                    advanceTurn();
                  }, 300);
                }
              });
            }, 400);
          }
          return 0;
        }
        if (prev <= 5) {
          triggerHaptic('light');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [activeQuestion, isBoardTimerRunning, showAnswer]);

  const advanceTurn = () => {
    const nextIdx = (activePlayerIndex + 1) % players.length;
    setActivePlayerIndex(nextIdx);
    setTurnTimeLeft(turnTimeLimit);
    setTimeout(() => setCamera({ x: 50, y: 50, zoom: 1 }), 600);
    return nextIdx;
  };

  const passTurnSanction = () => {
    // 1. Limpiar sanción del jugador actual
    setPlayers(prev =>
      prev.map((p, idx) =>
        idx === activePlayerIndex ? { ...p, skipNextTurn: false } : p
      )
    );

    // 2. Avanzar el turno limpiamente al siguiente jugador
    const nextIdx = (activePlayerIndex + 1) % players.length;
    setActivePlayerIndex(nextIdx);
    setTurnTimeLeft(turnTimeLimit);
    const msg = `⏳ ${currentPlayer.name} cumplió su turno de sanción. Turno de ${players[nextIdx]?.name || 'siguiente jugador'}.`;
    setLogMessage(msg);
    playGameSound('select');
    triggerHaptic('medium');

    // 3. Sincronizar por socket
    if (isOnline) {
      onlineService.sendGameAction('PASS_SANCTION', {
        clearedPlayerIdx: activePlayerIndex,
        nextIndex: nextIdx,
        logMessage: msg,
      });
    }
  };

  // Reiniciar tiempo de turno cada vez que cambia de jugador activo
  useEffect(() => {
    setTurnTimeLeft(turnTimeLimit);
  }, [activePlayerIndex, turnTimeLimit]);

  // Celebración de Victoria, Fanfarria y Confeti Continuo
  useEffect(() => {
    if (!isGameOver) return;

    const iAmWinner = Boolean(!isOnline || (gameWinner && isThisPlayerMe(gameWinner)));
    playVictoryFanfare(iAmWinner);
    playGameSound('projection');
    triggerHaptic('success');

    // Ráfaga continua de fuegos artificiales de confeti
    const duration = 4000;
    const end = Date.now() + duration;

    const confettiInterval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(confettiInterval);
        return;
      }
      confetti({
        particleCount: iAmWinner ? 75 : 35,
        spread: 100,
        origin: { y: 0.35, x: Math.random() * 0.8 + 0.1 },
        colors: iAmWinner ? ['#10B981', '#F59E0B', '#FBBF24', '#FFFFFF', '#34D399'] : ['#EF4444', '#F59E0B', '#FFFFFF']
      });
    }, 300);

    return () => clearInterval(confettiInterval);
  }, [isGameOver, gameWinner]);

  // Cronómetro del turno (Inactividad del jugador para lanzar el dado)
  useEffect(() => {
    if (!gameStarted || isGameOver || activeQuestion || isRolling || isTurnProcessing || turnTimeLimit >= 99999) {
      return;
    }

    const interval = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (isMyTurn && !activeQuestion && !isRolling && !isTurnProcessing) {
            playGameSound('wrong');
            triggerHaptic('error');
            setLogMessage(`⏰ ¡Tiempo agotado! Turno del siguiente jugador.`);
            const nextIdx = (activePlayerIndex + 1) % players.length;
            if (isOnline) {
              onlineService.sendGameAction('TURN_TIMEOUT', { playerIndex: activePlayerIndex, nextIndex: nextIdx });
            }
            advanceTurn();
          }
          return turnTimeLimit;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activePlayerIndex, gameStarted, isGameOver, Boolean(activeQuestion), isRolling, isTurnProcessing, isMyTurn, turnTimeLimit, players.length]);

  // Cronómetro Global de Carrera en Solitario (5 min, 10 min, 15 min, 20 min o Infinito)
  useEffect(() => {
    if (!gameStarted || isGameOver || players.length !== 1 || countdown !== null) {
      return;
    }

    const interval = setInterval(() => {
      setSoloTimeElapsed(prev => prev + 1);

      if (soloMatchDuration < 99999) {
        setSoloMatchTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            playGameSound('wrong');
            triggerHaptic('error');
            const winner = players[0] || currentPlayer;
            handleGameVictory(winner, false);
            return 0;
          }
          if (prev <= 10) {
            triggerHaptic('light');
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, isGameOver, players.length, countdown, soloMatchDuration, players, currentPlayer]);

  // Motor de Movimiento Realista Casilla a Casilla (Paso a Paso con Sonidos y Enfoque de Cámara)
  const movePlayerSteps = (
    playerIndex: number,
    startPos: number,
    targetPos: number,
    onComplete: () => void
  ) => {
    if (startPos === targetPos) {
      onComplete();
      return;
    }

    setIsMovingStepByStep(true);
    const isForward = targetPos > startPos;
    const totalSteps = Math.abs(targetPos - startPos);
    let currentStep = 0;

    const stepInterval = setInterval(() => {
      currentStep++;
      const nextPos = isForward ? startPos + currentStep : startPos - currentStep;

      // 1. Mover la ficha casilla por casilla
      setPlayers(prev =>
        prev.map((p, idx) =>
          idx === playerIndex ? { ...p, position: nextPos } : p
        )
      );

      // 2. Sonido y háptico de paso en el tablero
      const pitch = isForward ? 600 + (currentStep % 6) * 35 : 750 - (currentStep % 6) * 35;
      playSearchTickSound(pitch);
      triggerHaptic('light');

      // 3. Enfocar cámara en vivo sobre la casilla actual
      const stepCoord = (boardCoordinates as Array<{ x: number; y: number }>)[nextPos] || { x: 50, y: 50 };
      if (isAutoZoomEnabled) {
        setCamera({ x: stepCoord.x, y: stepCoord.y, zoom: 1.85 });
      }

      if (currentStep >= totalSteps) {
        clearInterval(stepInterval);
        setIsMovingStepByStep(false);
        playGameSound(isForward ? 'correct' : 'wrong');
        triggerHaptic(isForward ? 'medium' : 'error');
        setTimeout(() => {
          onComplete();
        }, 280);
      }
    }, 270);
  };

  const undoLastTurn = () => {
    if (!lastTurnSnapshot || isRolling || isTurnProcessing) return;
    playGameSound('select');
    triggerHaptic('warning');
    setPlayers(lastTurnSnapshot.players);
    setActivePlayerIndex(lastTurnSnapshot.activePlayerIndex);
    setDice(lastTurnSnapshot.dice);
    setLogMessage(`↩️ Jugada revertida. Vuelve a tirar el dado.`);
    setActiveQuestion(null);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsBoardTimerRunning(false);
    setHasExtraRoll(false);
    setLastTurnSnapshot(null);
  };

  const rollDice = (customRoll?: number) => {
    if ((!isMyTurn && !players[activePlayerIndex]?.isBot) || isRolling || isTurnProcessing || activeQuestion) return;

    // Guardar snapshot de estado antes de ejecutar este tiro para permitir revertir
    if (!isOnline) {
      setLastTurnSnapshot({
        players: JSON.parse(JSON.stringify(players)),
        activePlayerIndex,
        dice,
        logMessage
      });
    }

    const isSolo = players.length === 1;
    const roll = typeof customRoll === 'number'
      ? customRoll
      : (isSolo ? 1 : (Math.floor(Math.random() * 6) + 1));
    playGameSound('select');
    triggerHaptic('medium');
    setIsRolling(true);
    setIsTurnProcessing(true);
    setHasExtraRoll(false);
    setDice(roll);
    setSessionTurnsCount(prev => prev + 1);

    // 1. Mostrar animación de dado
    setDiceAnimState({
      visible: true,
      displayValue: roll,
      finalValue: roll,
      isSpinning: typeof customRoll !== 'number'
    });

    const spinInterval = setInterval(() => {
      setDiceAnimState(prev => ({
        ...prev,
        displayValue: isSolo ? 1 : (Math.floor(Math.random() * 6) + 1)
      }));
    }, 50);

    // 2. A los 300ms fijar el resultado y mover la ficha
    setTimeout(() => {
      clearInterval(spinInterval);
      setDiceAnimState({
        visible: true,
        displayValue: roll,
        finalValue: roll,
        isSpinning: false
      });
      playGameSound('correct');
      triggerHaptic('medium');

      const currentP = players[activePlayerIndex] || currentPlayer;
      const startPos = typeof currentP.position === 'number' ? currentP.position : 0;
      const isSolo = players.length === 1;

      // 🏁 REGLAS DE FINAL DE PARTIDA (Casillas 70 a 74: a 1-5 pasos de la Meta 75)
      const isNearFinish = !isSolo && startPos >= 70 && startPos < 75;
      const neededSteps = 75 - startPos;

      let targetPos = startPos;
      let newConsecutiveSixes = currentP.consecutiveSixes || 0;
      let newTile9Count = currentP.tile9Count || 0;
      let isSkipTurn = false;
      let rollAgain = false;
      let extraLog = "";
      let isMoveInvalid = false;

      if (isNearFinish) {
        if (roll === 6) {
          newConsecutiveSixes += 1;
          if (newConsecutiveSixes >= 3) {
            // Penalización: Tres veces 6 seguidas cerca de la meta -> Vuelve a casilla 50
            targetPos = 50;
            newConsecutiveSixes = 0;
            rollAgain = false;
            extraLog = ` ⚠️ ¡TRES VECES 6 SEGUIDAS CERCA DE LA META! Penalización: vuelve a la Casilla 50 (Pentecostés). Pasa el turno.`;
            playGameSound('wrong');
            triggerHaptic('error');
          } else {
            // El 6 vale doble acción: ¡VUELVE A TIRAR EL DADO!
            targetPos = startPos;
            rollAgain = true;
            setHasExtraRoll(true);
            extraLog = ` 🎲 ¡Sacó un 6 cerca de la meta! (Tiro ${newConsecutiveSixes}/3). No entra a la meta (necesita ${neededSteps} exacto), ¡pero VUELVE A TIRAR! (Tiro extra).`;
            playGameSound('correct');
            triggerHaptic('success');
          }
        } else {
          // Tiró de 1 a 5 -> reinicia contador de 6 seguidos
          newConsecutiveSixes = 0;
          if (roll === neededSteps) {
            // Tirada exacta requerida -> ¡Victoria!
            targetPos = 75;
            extraLog = ` 🏆 ¡Tirada exacta de ${roll}! ¡Llegó a la Meta!`;
          } else if (roll < neededSteps) {
            // Avanza normalmente hacia la meta
            targetPos = startPos + roll;
          } else {
            // roll > neededSteps -> No vale, se queda en su casilla
            targetPos = startPos;
            extraLog = ` 🚫 ¡Tiro no válido! Sacó ${roll} pero necesitaba ${neededSteps} exacto para ganar. No vale, tira el siguiente jugador.`;
            isMoveInvalid = true;
          }
        }
      } else {
        // Movimiento normal en el resto del tablero
        newConsecutiveSixes = 0;
        targetPos = Math.min(startPos + roll, 75);
      }

      const tile = boardData.find(b => b.id === targetPos);

      if (!isSolo && tile && !isMoveInvalid && targetPos !== startPos && targetPos < 75) {
        if (tile.effect === 'SKIP_TURN') {
          isSkipTurn = true;
          extraLog = ` ⚠️ Casilla "${tile.description}": Pierde su Próximo Turno.`;
        } else if (tile.effect === 'ROLL_AGAIN') {
          rollAgain = true;
          setHasExtraRoll(true);
          extraLog = ` 🌟 Casilla "${tile.description}": ¡GRAN BENDICIÓN! Vuelve a tirar el dado.`;
        } else if (tile.effect === 'GOTO_0' || targetPos === 9) {
          if (newTile9Count >= 2) {
            // Regla de Gracia Divina: Máximo 2 caídas por partida en casilla 9
            targetPos = 10;
            const tile10 = boardData.find(b => b.id === 10);
            extraLog = ` 🕊️ ¡GRACIA Y MISERICORDIA! Ya caíste 2 veces en la Casilla 9 ("${tile.description}"). Por perdón divino avanzas a la Casilla 10 (${tile10?.description || 'Noé'}) en lugar de volver a la salida.`;
            playCelebrationSound();
            triggerHaptic('success');
          } else {
            newTile9Count += 1;
            targetPos = 0;
            extraLog = ` 💥 Casilla "${tile.description}": Vuelve a la Salida (Caída ${newTile9Count}/2 en esta partida).`;
          }
        } else if (tile.effect === 'GOTO_42') {
          targetPos = 42;
          extraLog = ` ⚠️ Casilla "${tile.description}": Retrocede a la casilla 42 (Isaías).`;
        } else if (tile.effect === 'GOTO_65') {
          targetPos = 65;
          extraLog = ` 🚀 Casilla "${tile.description}": Se traslada a la casilla 65 (Jesús asciende).`;
        } else if (tile.effect === 'MOVE_2') {
          targetPos = Math.min(targetPos + 2, 75);
          extraLog = ` 🚀 Casilla "${tile.description}": Avanza 2 casillas extra.`;
        } else if (tile.effect === 'MOVE_3') {
          targetPos = Math.min(targetPos + 3, 75);
          extraLog = ` 🚀 Casilla "${tile.description}": Avanza 3 casillas extra.`;
        } else if (tile.effect === 'MOVE_5') {
          targetPos = Math.min(targetPos + 5, 75);
          extraLog = ` 🚀 Casilla "${tile.description}": Avanza 5 casillas extra.`;
        } else {
          extraLog = ` en "${tile.description}".`;
        }
      } else if (isSolo && tile) {
        if (targetPos === 9) {
          if (newTile9Count >= 2) {
            targetPos = 10;
            const tile10 = boardData.find(b => b.id === 10);
            extraLog = ` 🕊️ ¡GRACIA Y MISERICORDIA! Ya caíste 2 veces en la Casilla 9 ("${tile.description}"). Avanzas a la Casilla 10 (${tile10?.period}: "${tile10?.description}"). Responde la pregunta para superar este hito.`;
            playCelebrationSound();
            triggerHaptic('success');
          } else {
            newTile9Count += 1;
            extraLog = ` (${tile.period}: "${tile.description}" - Caída ${newTile9Count}/2). Responde la pregunta para superar este hito.`;
          }
        } else {
          extraLog = ` (${tile.period}: "${tile.description}"). Responde la pregunta para superar este hito.`;
        }
      }

      // Guardar estados de turno
      setPlayers(prev =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? { ...p, skipNextTurn: isSkipTurn, consecutiveSixes: newConsecutiveSixes, tile9Count: newTile9Count }
            : p
        )
      );

      const msg = isSolo
        ? `📖 ${currentP.name} avanza a la casilla ${targetPos}/75${extraLog}`
        : (isMoveInvalid
            ? `🎲 ${currentP.name} sacó un ${roll}.${extraLog}`
            : `🎲 ${currentP.name} sacó un ${roll} y avanzó a la casilla ${targetPos}${extraLog}`);
      setLogMessage(msg);

      // Ocultar dado tras 250ms
      setTimeout(() => {
        setDiceAnimState(prev => ({ ...prev, visible: false }));
        setIsRolling(false);
      }, 250);

      // 3. Ejecutar movimiento paso a paso
      movePlayerSteps(activePlayerIndex, startPos, targetPos, () => {
        // Verificar Victoria
        if (targetPos >= 75 && (!isSolo || startPos >= 74)) {
          handleGameVictory(currentP);
          return;
        }

        // Evaluar si se dispara pregunta (si el tiro fue inválido, no se dispara pregunta y pasa turno)
        const destTile = boardData.find(b => b.id === targetPos);
        let questionToTrigger: Question | null = null;
        if (!isMoveInvalid && (isSolo || (destTile && destTile.effect === 'QUESTION'))) {
          const periodToQuery = destTile?.period || 'El Principio';
          questionToTrigger = pickSmartQuestionForPeriod(periodToQuery, localTheme, localDifficulty, customStudyFilter, matchSeenQuestionIds);
        }

        const nextIdx = (activePlayerIndex + 1) % players.length;

        if (!isMoveInvalid && (isSolo || (destTile && destTile.effect === 'QUESTION')) && questionToTrigger) {
          setTimeout(() => {
            setActiveQuestion(questionToTrigger);
            setActiveQuestionTile(targetPos);
            setShowAnswer(false);
            setSelectedOption(null);
            setBoardTimeLeft(questionTimeLimit);
            setIsBoardTimerRunning(questionTimeLimit < 99999);
            setIsTurnProcessing(false);
          }, 200);
        } else if (rollAgain) {
          triggerHaptic('success');
          setIsTurnProcessing(false);
        } else {
          setTimeout(() => {
            advanceTurn();
            setIsTurnProcessing(false);
          }, 300);
        }

        if (isOnline) {
          onlineService.sendGameAction('ROLL_DICE', {
            roll,
            newPos: targetPos,
            playerIndex: activePlayerIndex,
            skipNextTurn: isSkipTurn,
            rollAgain,
            question: questionToTrigger,
            timeLimit: questionTimeLimit,
            nextIndex: (destTile?.effect === 'QUESTION' || rollAgain) ? activePlayerIndex : nextIdx,
            logMessage: msg,
          });
        }
      });
    }, 300);
  };

  const handleQuestionAnswer = (optionIdx: number) => {
    if (!activeQuestion || showAnswer || (!isMyTurn && !players[activePlayerIndex]?.isBot)) return;

    setSelectedOption(optionIdx);
    setShowAnswer(true);
    setIsBoardTimerRunning(false);
    const isSolo = players.length === 1;
    const isCorrect = optionIdx === activeQuestion.correctAnswer;
    
    const playerAtTurn = players[activePlayerIndex] || currentPlayer;
    const basePos = activeQuestionTile || playerAtTurn.position;
    const consequences = TRIVIA_CONSEQUENCES[basePos] || { bien: 3, mal: -2 };

    let newFinalPos = basePos;
    let msg = "";

    if (isSolo) {
      if (isCorrect) {
        playCelebrationSound();
        playGameSound('correct');
        triggerHaptic('success');
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.55 }
        });
        setSessionCorrectCount(prev => prev + 1);
        setSessionTotalQuestions(prev => prev + 1);
        recordAnswer(true);
        newFinalPos = basePos;
        const currentTileData = boardData.find(b => b.id === basePos);
        msg = `✅ ¡Respuesta Correcta! Superaste el hito ${basePos}/75 (${currentTileData?.description || ''}). ¡Avanza a la siguiente casilla!`;
      } else {
        playGameSound('wrong');
        triggerHaptic('error');
        setSessionTotalQuestions(prev => prev + 1);
        recordAnswer(false);
        newFinalPos = Math.max(0, basePos - 1);
        msg = `❌ ¡Respuesta Incorrecta! Retrocedes a la casilla ${newFinalPos}. (Correcta: ${activeQuestion.options[activeQuestion.correctAnswer]})`;
      }
    } else {
      const isMyTurnPlayer = !isOnline || isThisPlayerMe(playerAtTurn);
      if (isCorrect) {
        playCelebrationSound();
        playGameSound('correct');
        triggerHaptic('success');
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.55 }
        });
        setSessionCorrectCount(prev => prev + 1);
        setSessionTotalQuestions(prev => prev + 1);
        if (isMyTurnPlayer) recordAnswer(true);
        newFinalPos = Math.min(75, basePos + consequences.bien);
        msg = consequences.bien === 0
          ? `✅ ¡Respuesta Correcta! ${playerAtTurn.name} se salva de devolverse y permanece en la casilla ${newFinalPos}.`
          : `✅ ¡Respuesta Correcta! ${playerAtTurn.name} avanza +${consequences.bien} ${consequences.bien === 1 ? 'casilla' : 'casillas'} (llega a casilla ${newFinalPos}).`;
      } else {
        playGameSound('wrong');
        triggerHaptic('error');
        setSessionTotalQuestions(prev => prev + 1);
        if (isMyTurnPlayer) recordAnswer(false);
        const penaltyCasillas = Math.abs(consequences.mal);
        newFinalPos = Math.max(0, basePos - penaltyCasillas);
        msg = `❌ ¡Respuesta Incorrecta! ${playerAtTurn.name} retrocede ${penaltyCasillas} casillas (baja a casilla ${newFinalPos}). (Correcta: ${activeQuestion.options[activeQuestion.correctAnswer]})`;
      }
    }
    setLogMessage(msg);

    // Si con esta respuesta llega o supera la meta 75 -> ¡VICTORIA INMEDIATA!
    if (newFinalPos >= 75) {
      setTimeout(() => {
        handleGameVictory(playerAtTurn);
      }, 700);
      return;
    }

    const destTile = newFinalPos < 75 ? boardData.find(b => b.id === newFinalPos) : null;
    // La pregunta encadenada SOLO ocurre si ACERTÓ (isCorrect === true), avanzó hacia adelante a una NUEVA casilla y esa nueva casilla tiene efecto de QUESTION
    const isChainedQuestion = !isSolo && isCorrect && Boolean(destTile && destTile.effect === 'QUESTION' && newFinalPos > basePos && newFinalPos < 75);
    const shouldAdvanceTurn = !isSolo && !isChainedQuestion && destTile?.effect !== 'ROLL_AGAIN' && newFinalPos < 75;
    const nextIdx = (activePlayerIndex + 1) % players.length;

    if (isOnline) {
      onlineService.sendGameAction('ANSWER_QUESTION', {
        optionIdx,
        isCorrect,
        playerIndex: activePlayerIndex,
        newFinalPos,
        nextIndex: nextIdx,
        shouldAdvanceTurn,
        logMessage: msg,
      });
    }

    // 1. Cerrar el modal y aplicar movimiento paso a paso
    setTimeout(() => {
      setActiveQuestion(null);
      setShowAnswer(false);
      setSelectedOption(null);

      // 2. Mover la ficha paso a paso con sonido y enfoque de cámara
      movePlayerSteps(activePlayerIndex, basePos, newFinalPos, () => {
        // 3. Evaluar si la nueva casilla de destino tiene otra PREGUNTA o efecto especial
        if (newFinalPos < 75) {
          if (isChainedQuestion && destTile) {
            // Encadenar nueva pregunta al MISMO jugador
            const chainedQuestion = pickSmartQuestionForPeriod(destTile.period, localTheme, localDifficulty, customStudyFilter, matchSeenQuestionIds);

            setActiveQuestion(chainedQuestion);
            setActiveQuestionTile(newFinalPos);
            setShowAnswer(false);
            setSelectedOption(null);
            setBoardTimeLeft(questionTimeLimit);
            setIsBoardTimerRunning(questionTimeLimit < 99999);
            setLogMessage(`⚠️ ¡Avanzaste a la casilla ${newFinalPos} de Trivia (${destTile.period})! ${playerAtTurn.name} debe responder otra vez.`);

            if (isOnline) {
              onlineService.sendGameAction('ROLL_DICE', {
                roll: 0,
                newPos: newFinalPos,
                playerIndex: activePlayerIndex,
                question: chainedQuestion,
                nextIndex: activePlayerIndex,
                timeLimit: questionTimeLimit,
                logMessage: `⚠️ ${playerAtTurn.name} cayó en la casilla ${newFinalPos} de Trivia (${destTile.period}). Debe responder.`,
              });
            }
            return;
          } else if (destTile && destTile.effect === 'ROLL_AGAIN') {
            setHasExtraRoll(true);
            playGameSound('correct');
            triggerHaptic('success');
            setLogMessage(`🌟 ¡Gran Bendición en casilla ${newFinalPos}! ${playerAtTurn.name} vuelve a tirar el dado.`);
            return;
          } else if (destTile && destTile.effect === 'SKIP_TURN') {
            setPlayers(prev =>
              prev.map((p, idx) =>
                idx === activePlayerIndex ? { ...p, skipNextTurn: true } : p
              )
            );
          }
        }

        // 4. Si la nueva casilla no es otra pregunta ni tiro extra, pasar al siguiente turno limpiamente
        if (shouldAdvanceTurn) {
          setTimeout(() => {
            advanceTurn();
          }, 300);
        }
      });
    }, 400);
  };

  const activeConsequence = TRIVIA_CONSEQUENCES[activeQuestionTile] || { bien: 3, mal: -2 };

  return (
    <div className="fixed inset-0 z-50 bg-[#1B1A17] flex flex-col items-center overflow-y-auto pb-8">
      {/* Encabezado Superior Limpio y Ultra-Optimizado para Móviles */}
      <header className="w-full relative bg-[#2A2621]/95 backdrop-blur-md border-b border-[#3A342C] px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between sticky top-0 z-[90] shadow-lg">
        {/* Left: Botón Inicio + Logo Oficial */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (gameStarted && !isGameOver) {
                if (window.confirm("¿Seguro que deseas abandonar la partida actual y volver al menú principal?")) {
                  onExit();
                }
              } else {
                onExit();
              }
            }}
            className="px-2.5 sm:px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl font-bold flex items-center gap-1 shadow transition text-xs active:scale-95 cursor-pointer"
            title="Ir al Inicio (Menú Principal)"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400 pointer-events-none" />
            <Home className="w-3.5 h-3.5 text-amber-300 pointer-events-none" />
            <span className="hidden sm:inline font-bold pointer-events-none">Inicio</span>
          </button>

          <img
            src="/logo-header.png"
            alt="Biblos Games"
            className="h-9 sm:h-12 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Center: Subtítulo Sutil en Pantallas Grandes */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-white/80 text-[10px] tracking-[0.3em] uppercase font-light">
            {isOnline ? `Online (Sala #${onlineRoom?.code || 'PIN'})` : gameSubMode === 'SOLO' ? "Solitario Contrarreloj" : "Grupo Local (2-8)"}
          </p>
        </div>

        {/* Right: Saldo de Talentos + Botón Menú Contenedor */}
        <div className="flex items-center gap-2 relative">
          {/* 🪙 Saldo de Talentos */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-400/50 rounded-xl text-amber-300 shadow"
            title="Tus Talentos Bíblicos disponibles"
          >
            <GoldCoinIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-mono font-black">{userTalents}</span>
          </div>

          {/* ⚙️ BOTÓN MENÚ INTEGRADO (Contiene Perfil, Ranking, Sonido, Acerca de y Reiniciar) */}
          <button
            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 hover:border-amber-500/50 rounded-xl text-xs font-bold transition shadow active:scale-95 cursor-pointer"
            title="Menú de opciones"
          >
            <Menu size={16} />
            <span className="hidden xs:inline">Menú</span>
          </button>

          {/* 📋 MENÚ DESPLEGABLE CON TODAS LAS OPCIONES ORGANIZADAS */}
          <AnimatePresence>
            {showHeaderMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
                  onClick={() => setShowHeaderMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 z-50 w-64 bg-[#231E18] border-2 border-amber-500/70 rounded-2xl shadow-2xl overflow-hidden p-2 text-stone-200 space-y-1 ring-4 ring-black/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Tarjeta de Perfil en el Menú */}
                  {userProfile && (
                    <button
                      onClick={() => {
                        setShowHeaderMenu(false);
                        if (onOpenProfile) onOpenProfile();
                      }}
                      className="w-full p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                    >
                      {userProfile.avatar?.startsWith('/') ? (
                        <img src={userProfile.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-amber-400" />
                      ) : (
                        <span className="text-xl">{userProfile.avatar}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-amber-300 truncate">
                          <span className="mr-1">{userProfile.countryFlag || '🇩🇴'}</span>
                          {userProfile.name}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-bold">
                          {userProfile.accuracy}% Precisión · {userProfile.rating || 1000} ELO
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Ranking / Salón de la Fama */}
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      if (onOpenLeaderboard) onOpenLeaderboard();
                    }}
                    className="w-full px-3 py-2 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-200 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-amber-300">
                      <Trophy size={15} /> 🏆 Salón de la Fama
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-mono">
                      Niv. {getRankTier(userProfile?.rating || 1000).level}
                    </span>
                  </button>

                  {/* Sonido On/Off */}
                  {onToggleSound && (
                    <button
                      onClick={() => {
                        onToggleSound();
                      }}
                      className="w-full px-3 py-2 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-200 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-amber-200">
                        {isSoundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                        <span>Sonido del Juego</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSoundOn ? 'bg-emerald-950 text-emerald-300' : 'bg-stone-900 text-stone-400'}`}>
                        {isSoundOn ? 'Activado' : 'Mute'}
                      </span>
                    </button>
                  )}

                  {/* Acerca De */}
                  {onOpenAbout && (
                    <button
                      onClick={() => {
                        setShowHeaderMenu(false);
                        onOpenAbout();
                      }}
                      className="w-full px-3 py-2 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-300 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Info size={15} className="text-amber-300" />
                      <span>Acerca de Biblos Games</span>
                    </button>
                  )}

                  <div className="border-t border-stone-800 my-1" />

                  {/* Reiniciar Partida */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      if (isOnline) {
                        onlineService.sendGameAction('RESTART_GAME');
                      }
                      setPlayers(prev => prev.map(p => ({ ...p, position: 0, skipNextTurn: false })));
                      setActivePlayerIndex(0);
                      setDice(null);
                      setCamera({ x: 50, y: 50, zoom: 1 });
                      setGameStarted(!isOnline ? false : true);
                    }}
                    className="w-full px-3 py-2 bg-stone-900 hover:bg-rose-950 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Reiniciar Partida</span>
                  </button>

                  {/* Salir al Menú Principal */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      if (gameStarted && !isGameOver) {
                        if (window.confirm("¿Seguro que deseas abandonar la partida actual y volver al menú principal?")) {
                          onExit();
                        }
                      } else {
                        onExit();
                      }
                    }}
                    className="w-full px-3 py-2 bg-stone-900/60 hover:bg-amber-950/80 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <Home size={14} />
                    <span>Volver a Inicio</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {!gameStarted && !isOnline ? (
        <div className="my-auto p-5 sm:p-6 max-w-xl w-11/12 bg-[#2A2621] border border-amber-800/40 rounded-3xl text-center shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto custom-scrollbar">
          {/* SELECTOR DE MODO EN LA CABECERA DEL SETUP */}
          <div className="grid grid-cols-3 bg-stone-900 p-1 rounded-2xl border border-stone-800 gap-1">
            <button
              type="button"
              onClick={() => {
                setGameSubMode('SOLO');
                playGameSound('select');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                gameSubMode === 'SOLO'
                  ? 'bg-amber-500 text-amber-950 shadow-md ring-1 ring-amber-300'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <User size={14} />
              <span>⚡ Solitario</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGameSubMode('VS_BOTS');
                playGameSound('select');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                gameSubMode === 'VS_BOTS'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-1 ring-blue-400'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bot size={14} />
              <span>🤖 vs BiblosBot</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGameSubMode('GRUPO_LOCAL');
                playGameSound('select');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                gameSubMode === 'GRUPO_LOCAL'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md ring-1 ring-amber-400'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users size={14} />
              <span>👥 Grupal (2-8)</span>
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-amber-100 font-serif">
              {gameSubMode === 'SOLO'
                ? '⚡ Desafío Solitario Contrarreloj'
                : gameSubMode === 'VS_BOTS'
                ? '🤖 Tablero Contra BiblosBot'
                : '👥 Tablero Grupal (2 a 8 Jugadores)'}
            </h3>
            <p className="text-xs text-stone-300">
              {gameSubMode === 'SOLO'
                ? 'Avanza casilla a casilla respondiendo preguntas, supera tu tiempo y escala en el Salón de la Fama.'
                : gameSubMode === 'VS_BOTS'
                ? 'Compite en el tablero tradicional por turnos contra rivales bíblicos inteligentes.'
                : 'Juega en familia o amigos en el mismo dispositivo por turnos con dados y preguntas bíblicas.'}
            </p>
          </div>

          {/* 1. SELECCIÓN DE TEMÁTICA */}
          <div className="bg-stone-900/90 p-3 rounded-2xl border border-stone-800 space-y-2 text-left">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                📖 1. Temática:
              </label>
              <div className="flex items-center gap-1.5">
                {!(userProfile?.isPremium) && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                    <Lock size={9} /> Versión Gratis
                  </span>
                )}
                <span className="text-[10px] text-amber-400 font-black">
                  {localTheme === 'PERIODOS' ? 'Periodos Bíblicos' : localTheme}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'PERIODOS', label: 'Periodos Bíblicos', icon: LayoutGrid, isFree: true },
                { id: 'PRINCIPIANTE', label: 'Principiante', icon: Sparkles, isFree: false },
                { id: 'VERSICULOS', label: 'Versículos', icon: BookOpen, isFree: false },
                { id: 'PERSONAJES', label: 'Personajes', icon: Users, isFree: false },
                { id: 'DIOS', label: 'Modo Dios', icon: Crown, isFree: false },
                { id: 'SALVACION', label: 'Salvación', icon: Cross, isFree: false },
                { id: 'MANDAMIENTOS', label: 'Mandamientos', icon: ScrollText, isFree: false },
                { id: 'HISTORIA', label: 'Historia', icon: Landmark, isFree: false },
                { id: 'GEOGRAFIA', label: 'Geografía', icon: MapPin, isFree: false }
              ].map(t => {
                const IconComp = t.icon;
                const isSelected = localTheme === t.id;
                const isLocked = !t.isFree && !(userProfile?.isPremium);

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        playGameSound('select');
                        triggerHaptic('warning');
                        if (onOpenPremiumModal) {
                          onOpenPremiumModal();
                        }
                        return;
                      }
                      setLocalTheme(t.id);
                      playGameSound('select');
                      triggerHaptic('light');
                    }}
                    className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition border relative overflow-hidden ${
                      isLocked
                        ? 'bg-stone-950/70 border-stone-800/80 text-stone-500 hover:border-amber-500/50 hover:bg-stone-900 cursor-pointer'
                        : isSelected
                        ? 'bg-amber-500 text-amber-950 border-amber-300 shadow ring-2 ring-amber-400 font-black cursor-pointer'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-amber-400/40 font-bold cursor-pointer'
                    }`}
                  >
                    {isLocked && (
                      <span className="absolute top-1 right-1 text-[8px] bg-amber-500/90 text-amber-950 p-0.5 rounded-full font-black shadow z-10 flex items-center justify-center">
                        <Lock size={9} />
                      </span>
                    )}
                    <IconComp size={16} className={isLocked ? 'text-stone-500' : isSelected ? 'text-amber-950' : 'text-amber-400'} />
                    <span className="text-[10px] leading-tight truncate w-full flex items-center justify-center gap-0.5">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELECCIÓN DE DIFICULTAD / COMPLEJIDAD (DESBLOQUEO PROGRESIVO SEGÚN NIVEL) */}
          {(() => {
            const currentRating = userProfile?.rating || 1000;
            const diffInfo = getAvailableDifficulties(currentRating);

            const difficultyOptions = [
              {
                id: 'PRINCIPIANTE' as const,
                label: '🟢 Básico',
                levelLabel: 'Nivel 1 y 2',
                isUnlocked: diffInfo.canBasic,
                unlockReq: 'Nivel 1 (0 pts)',
              },
              {
                id: 'INTERMEDIO' as const,
                label: '🟡 Medio',
                levelLabel: 'Nivel 3 y 4',
                isUnlocked: diffInfo.canIntermediate,
                unlockReq: 'Nivel 3 (1,500 pts)',
              },
              {
                id: 'AVANZADO' as const,
                label: '🔴 Pro',
                levelLabel: 'Nivel 5 a 7',
                isUnlocked: diffInfo.canAdvanced,
                unlockReq: 'Nivel 5 (2,200 pts)',
              },
              {
                id: 'MIXTO' as const,
                label: '🎲 Mixto',
                levelLabel: 'Nivel 3+',
                isUnlocked: diffInfo.canMixto,
                unlockReq: 'Nivel 3 (1,500 pts)',
              },
            ];

            return (
              <div className="bg-stone-900/90 p-3 rounded-2xl border border-stone-800 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                    ⭐ 2. Grado de Complejidad:
                  </label>
                  <span className="text-[10px] text-blue-400 font-black">
                    {localDifficulty === 'MIXTO' ? '🎲 Mixto (Todas)' : localDifficulty}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                  {difficultyOptions.map(d => {
                    const isSelected = localDifficulty === d.id;
                    const isLocked = !d.isUnlocked;

                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          if (isLocked) {
                            playGameSound('wrong');
                            triggerHaptic('warning');
                            showTalentAnimationToast(`🔒 ${d.label} se desbloquea en ${d.levelLabel} (${d.unlockReq})`, 'loss');
                            return;
                          }
                          setLocalDifficulty(d.id);
                          playGameSound('select');
                          triggerHaptic('light');
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition border relative flex flex-col items-center justify-center gap-0.5 ${
                          isLocked
                            ? 'bg-stone-950/70 border-stone-800/80 text-stone-600 hover:border-blue-500/40 cursor-pointer'
                            : isSelected
                            ? 'bg-blue-600 text-white border-blue-300 shadow ring-2 ring-blue-400 font-black cursor-pointer'
                            : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-blue-400/40 cursor-pointer'
                        }`}
                      >
                        {isLocked && (
                          <span className="absolute top-1 right-1 text-[8px] bg-stone-900 text-stone-400 p-0.5 rounded-full border border-stone-700">
                            <Lock size={8} />
                          </span>
                        )}
                        <span className="truncate w-full text-center leading-tight">{d.label}</span>
                        <span className={`text-[8px] leading-none font-medium truncate w-full text-center ${
                          isLocked ? 'text-stone-500' : isSelected ? 'text-blue-100' : 'text-stone-400'
                        }`}>
                          {d.levelLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 3. CONFIGURACIÓN SEGÚN SUBMODO SELECCIONADO */}
          {gameSubMode === 'SOLO' && (
            /* CONFIGURACIÓN EXCLUSIVA DE SOLITARIO: DURACIÓN DE CARRERA */
            <div className="bg-gradient-to-r from-amber-950/70 via-stone-900 to-amber-950/70 p-3 rounded-2xl border border-amber-500/40 space-y-2 text-left shadow-inner">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <span>⏱️ 3. Modalidad de Tiempo (Solitario):</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono font-black">
                  {soloMatchDuration === 300 ? '5 Min' : soloMatchDuration === 600 ? '10 Min' : soloMatchDuration === 900 ? '15 Min' : soloMatchDuration === 1200 ? '20 Min' : 'Infinito (Meta 75)'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: '⚡ 5m', val: 300, desc: 'Sprint' },
                  { label: '⭐ 10m', val: 600, desc: 'Medio' },
                  { label: '⏳ 15m', val: 900, desc: 'Largo' },
                  { label: '🏃 20m', val: 1200, desc: 'Maratón' },
                  { label: '♾️ Meta', val: 99999, desc: 'Hasta 75' },
                ].map(t => {
                  const isSelected = soloMatchDuration === t.val;
                  return (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => {
                        setSoloMatchDuration(t.val);
                        setSoloMatchTimeLeft(t.val);
                        playGameSound('select');
                        triggerHaptic('light');
                      }}
                      className={`py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition border flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 text-amber-950 border-amber-300 shadow ring-2 ring-amber-400 font-black'
                          : 'bg-stone-800/90 text-stone-300 border-stone-700 hover:border-amber-400/40'
                      }`}
                    >
                      <span>{t.label}</span>
                      <span className={`text-[8px] leading-tight ${isSelected ? 'text-amber-950' : 'text-stone-400'}`}>{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {gameSubMode === 'VS_BOTS' && (
            /* CONFIGURACIÓN EXCLUSIVA DE TABLERO CONTRA BIBLOSBOT */
            <div className="bg-stone-900/90 p-3 rounded-2xl border border-blue-500/40 space-y-2 text-left">
              <label className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                🤖 3. Rivales BiblosBot a Enfrentar:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { bots: 1, label: '1 Bot (1vs1)', desc: 'Tú vs BiblosBot (David)' },
                  { bots: 2, label: '2 Bots', desc: 'Tú + David + Salomón' },
                  { bots: 3, label: '3 Bots (Mesa Llena)', desc: 'Tú + 3 Rivales Bíblicos' },
                ].map(({ bots, label, desc }) => (
                  <button
                    key={bots}
                    type="button"
                    onClick={() => {
                      setSelectedBotOpponents(bots);
                      playGameSound('select');
                      triggerHaptic('light');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition border flex flex-col items-center justify-center text-center cursor-pointer ${
                      selectedBotOpponents === bots
                        ? 'bg-blue-600 text-white border-blue-300 shadow ring-2 ring-blue-400 font-black'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-blue-400/40'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[9px] opacity-75 mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameSubMode === 'GRUPO_LOCAL' && (
            /* CONFIGURACIÓN EXCLUSIVA DE GRUPO LOCAL: TIEMPO POR TURNO Y SELECCIÓN DE 2 A 8 JUGADORES */
            <div className="space-y-3">
              {/* Límite por Turno de amigos */}
              <div className="bg-stone-900/90 p-2.5 rounded-2xl border border-stone-800 space-y-1 text-left">
                <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                  🎲 3. Tiempo por Turno (Lanzar dado):
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '30s', val: 30 },
                    { label: '⭐ 60s', val: 60 },
                    { label: '90s', val: 90 },
                    { label: '♾️ Inf.', val: 99999 }
                  ].map(t => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => {
                        setTurnTimeLimit(t.val);
                        setTurnTimeLeft(t.val);
                      }}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition border ${
                        turnTimeLimit === t.val
                          ? 'bg-amber-500 text-amber-950 border-amber-300 shadow'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de 2 a 8 Jugadores */}
              <div className="bg-stone-900/90 p-3 rounded-2xl border border-stone-800 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                    👥 4. Cantidad de Jugadores:
                  </label>
                  <span className="text-[10px] text-amber-400 font-black">
                    {selectedGroupPlayers} Jugadores en Turno
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setSelectedGroupPlayers(num);
                        playGameSound('select');
                        triggerHaptic('light');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition border flex flex-col items-center justify-center ${
                        selectedGroupPlayers === num
                          ? 'bg-amber-500 text-amber-950 border-amber-300 shadow ring-2 ring-amber-400 font-black'
                          : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-amber-400/40'
                      }`}
                    >
                      <span>{num}</span>
                      <span className="text-[8px] opacity-75">jug</span>
                    </button>
                  ))}
                </div>

                {/* 📝 LISTA PERSONALIZABLE DE JUGADORES (NOMBRE O SELECCIÓN BÍBLICA) */}
                <div className="pt-2 border-t border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      ✏️ Personalizar Jugadores ({selectedGroupPlayers}):
                    </span>
                    <span className="text-[9px] text-stone-400 font-medium">Escribe o elige un personaje</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
                    {Array.from({ length: selectedGroupPlayers }).map((_, pIdx) => {
                      const currentCustom = groupPlayerCustomizations[pIdx] || { name: `Jugador ${pIdx + 1}`, avatar: BIBLE_AVATARS[pIdx % BIBLE_AVATARS.length].imagePath };

                      return (
                        <div 
                          key={pIdx}
                          className="flex items-center gap-2 p-1.5 bg-black/40 border border-stone-800 rounded-xl"
                        >
                          {/* Avatar Bíblico con selector rápido */}
                          <div className="relative shrink-0">
                            <img 
                              src={currentCustom.avatar} 
                              alt="Avatar" 
                              className="w-8 h-8 rounded-full object-cover border-2 border-amber-400/60 shadow" 
                            />
                            <span className="absolute -bottom-1 -right-1 text-[8px] bg-amber-500 text-amber-950 px-1 rounded-full font-bold">
                              #{pIdx + 1}
                            </span>
                          </div>

                          {/* Campo de Texto para Escribir Nombre Propio */}
                          <input
                            type="text"
                            value={currentCustom.name}
                            placeholder={`Jugador ${pIdx + 1}`}
                            maxLength={20}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setGroupPlayerCustomizations(prev => {
                                const next = [...prev];
                                next[pIdx] = { ...next[pIdx], name: newName };
                                return next;
                              });
                            }}
                            className="flex-1 min-w-0 bg-stone-900 border border-stone-700 focus:border-amber-400 px-2.5 py-1 text-xs text-amber-100 font-bold rounded-lg focus:outline-none transition shadow-inner placeholder-stone-600"
                          />

                          {/* Selector Desplegable con Nombres y Avatares Bíblicos Famosos */}
                          <select
                            value={currentCustom.name}
                            onChange={(e) => {
                              const selectedBiblical = BIBLE_AVATARS.find(b => b.name === e.target.value);
                              setGroupPlayerCustomizations(prev => {
                                const next = [...prev];
                                next[pIdx] = {
                                  name: e.target.value,
                                  avatar: selectedBiblical ? selectedBiblical.imagePath : next[pIdx].avatar
                                };
                                return next;
                              });
                              playGameSound('select');
                              triggerHaptic('light');
                            }}
                            className="bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                            title="Seleccionar Personaje Bíblico"
                          >
                            <option value="" disabled>📜 Bíblico...</option>
                            {BIBLE_AVATARS.map(b => (
                              <option key={b.id} value={b.name} disabled={b.isPremium && !isUserPremium()}>
                                {b.name} {b.isPremium ? (isUserPremium() ? '👑 VIP' : '🔒 (Exclusivo VIP)') : '🆓'}
                              </option>
                            ))}
                          </select>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. TIEMPO PARA RESPONDER PREGUNTAS */}
          <div className="bg-stone-900/90 p-2.5 rounded-2xl border border-stone-800 space-y-1 text-left">
            <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              ⏱️ {gameSubMode === 'SOLO' ? '4' : '4'}. Tiempo Límite por Pregunta:
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: '⚡ 15s', val: 15 },
                { label: '20s', val: 20 },
                { label: '30s', val: 30 },
                { label: '♾️ Inf.', val: 99999 }
              ].map(t => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setQuestionTimeLimit(t.val)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition border ${
                    questionTimeLimit === t.val
                      ? 'bg-amber-500 text-amber-950 border-amber-300 shadow'
                      : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* BOTÓN PRINCIPAL DE INICIO SEGÚN MODO CON INDICADOR DE TALENTOS */}
          <div className="pt-2 space-y-1.5">
            <div className="flex items-center justify-between px-1 text-[11px] font-bold">
              <span className="text-stone-300 flex items-center gap-1">
                <span>Costo de Partida:</span>
                <span className="text-rose-400 font-extrabold flex items-center gap-0.5"><GoldCoinIcon className="w-3.5 h-3.5 inline" /> -1 Talento</span>
              </span>
              {gameSubMode === 'SOLO' || gameSubMode === 'VS_BOTS' ? (
                <span className="text-amber-300 flex items-center gap-1">
                  <span>Recompensa Victoria:</span>
                  <span className="text-amber-400 font-extrabold flex items-center gap-0.5"><GoldCoinIcon className="w-3.5 h-3.5 inline" /> +2 Talentos</span>
                </span>
              ) : (
                <span className="text-stone-400 flex items-center gap-1 font-semibold">
                  <span>Modo Recreativo Local</span>
                </span>
              )}
            </div>

            {gameSubMode === 'SOLO' ? (
              <button
                type="button"
                onClick={() => startNewGame(1)}
                className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black text-sm sm:text-base rounded-2xl shadow-2xl transition transform active:scale-95 flex items-center justify-center gap-2 border-2 border-amber-200 ring-4 ring-amber-400/40 cursor-pointer"
              >
                <User className="w-5 h-5" />
                <span className="flex items-center gap-1.5">⚡ Iniciar Carrera Solitario (-1 <GoldCoinIcon className="w-4 h-4 inline" />)</span>
              </button>
            ) : gameSubMode === 'VS_BOTS' ? (
              <button
                type="button"
                onClick={() => startNewGame(selectedBotOpponents + 1, true)}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-2xl transition transform active:scale-95 flex items-center justify-center gap-2 border-2 border-blue-300 ring-4 ring-blue-500/40 cursor-pointer"
              >
                <Bot className="w-5 h-5" />
                <span className="flex items-center gap-1.5">🤖 Iniciar Tablero Contra BiblosBot (-1 <GoldCoinIcon className="w-4 h-4 inline" />)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startNewGame(selectedGroupPlayers)}
                className="w-full py-4 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-2xl transition transform active:scale-95 flex items-center justify-center gap-2 border-2 border-amber-300 ring-4 ring-amber-500/40 cursor-pointer"
              >
                <Users className="w-5 h-5" />
                <span className="flex items-center gap-1.5">👥 Iniciar Partida Grupal (-1 <GoldCoinIcon className="w-4 h-4 inline" />)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onExit()}
              className="w-full py-2.5 bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-200 border border-stone-800 hover:border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
            >
              <Home size={14} />
              <span>Volver al Menú Principal</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Overlay de cuenta regresiva en Solitario */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center"
              >
                <p className="text-amber-400 text-sm font-bold tracking-[0.3em] uppercase mb-4">Modo Solitario Contrarreloj</p>
                <div className="text-8xl font-black text-amber-300 font-serif drop-shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-pulse">
                  {countdown === 0 ? "¡¡DESAFÍO!!" : countdown}
                </div>
                <p className="text-stone-300 text-sm mt-6 max-w-xs font-medium">
                  {countdown === 0 ? "Lanza el dado y responde antes de que el tiempo se agote." : "Prepárate para responder lo más rápido posible..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONTENEDOR PRINCIPAL RESPONSIVO */}
          <div className="w-full flex-1 max-w-7xl px-2 sm:px-4 py-1 sm:py-2 flex flex-col lg:flex-row items-center lg:items-center justify-between lg:justify-center gap-2 lg:gap-6 overflow-hidden">
            
            {/* COLUMNA 1: TABLERO + DADO INMEDIATO (CENTRO EN MÓVIL / IZQUIERDA EN PC) */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md sm:max-w-lg lg:max-w-[min(calc(100vh-115px),650px)] gap-2">
              
              {/* DETALLES SUPERIORES EN MÓVIL (Turno actual, fichas y log comprimido arriba) */}
              <div className="w-full lg:hidden flex flex-col gap-1.5 px-1">
                {/* Cintillo de Estado */}
                <div className="py-1.5 px-3 bg-[#2A2621]/90 border border-amber-900/40 rounded-xl text-center shadow-inner flex items-center justify-between gap-2">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    Ronda:
                  </span>
                  <p className="text-xs font-semibold text-amber-100 truncate flex-1 text-left">{logMessage}</p>
                </div>

                {/* Mini-avatares de jugadores en horizontal con Aro SVG Dinámico que se consume */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                  {players.map((p, idx) => {
                    const isActive = idx === activePlayerIndex;
                    const isThisMe = isThisPlayerMe(p);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (!isOnline || isThisMe) {
                            setAvatarPickerPlayerIndex(idx);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border shrink-0 text-xs transition cursor-pointer ${
                          isActive
                            ? 'bg-amber-950 border-amber-400 text-amber-200 ring-1 ring-amber-400 font-bold shadow'
                            : 'bg-black/40 border-stone-800 text-stone-400 hover:border-stone-600'
                        }`}
                        title="Toca para cambiar personaje bíblico"
                      >
                        <div className="relative">
                          <TurnTimerAvatarRing
                            avatar={p.avatar}
                            name={p.name}
                            isActive={isActive}
                            timeLeft={turnTimeLeft}
                            timeLimit={turnTimeLimit}
                            size="sm"
                          />
                          {isActive && turnTimeLimit < 99999 && (
                            <span className="absolute -bottom-1 -right-1 text-[8px] font-black px-1 py-0.2 bg-black/90 text-amber-300 rounded-full border border-amber-400 shadow">
                              {turnTimeLeft}s
                            </span>
                          )}
                        </div>

                        <span className="truncate max-w-[70px]">{p.name} {isThisPlayerMe ? '(Tú)' : ''}</span>
                        {p.skipNextTurn ? (
                          <span className="text-[9px] px-1 bg-red-900 text-red-200 rounded">⏳</span>
                        ) : (
                          <span className="text-[10px] px-1 bg-black/60 rounded text-amber-300">C.{p.position}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TABLERO INTERACTIVO */}
              <div className="relative w-full aspect-square max-h-[46vh] sm:max-h-[52vh] lg:max-h-none bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-900/60">
                
                {/* 🎛️ CONTROLES SUPERIORES DERECHOS (LUPITA ZOOM + BOTÓN RENDIRSE) */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                  {/* 🔍 BOTÓN FLOTANTE TIPO LUPITA MÁS COMPACTO */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isAutoZoomEnabled || camera.zoom > 1) {
                        setIsAutoZoomEnabled(false);
                        setCamera({ x: 50, y: 50, zoom: 1 });
                      } else {
                        setIsAutoZoomEnabled(true);
                        const c = (boardCoordinates as Array<{ x: number; y: number }>)[currentPlayer?.position || 0] || { x: 50, y: 50 };
                        setCamera({ x: c.x, y: c.y, zoom: 1.85 });
                      }
                      playGameSound("select");
                    }}
                    className={`p-1.5 rounded-xl backdrop-blur-md border shadow-lg transition transform active:scale-95 flex items-center justify-center cursor-pointer ${
                      isAutoZoomEnabled || camera.zoom > 1
                        ? 'bg-amber-500/90 text-amber-950 border-amber-200 ring-2 ring-amber-400/50 shadow-amber-500/20'
                        : 'bg-black/80 hover:bg-black/95 text-amber-300 border-amber-500/50 hover:border-amber-400'
                    }`}
                    title={isAutoZoomEnabled || camera.zoom > 1 ? "Cambiar a Vista Completa del Tablero" : "Hacer Zoom en la Ficha"}
                  >
                    {isAutoZoomEnabled || camera.zoom > 1 ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* 🏳️ BOTÓN DE ABANDONAR DUELO EN MULTIJUGADOR (1 vs 1 / GRUPO) */}
                  {players.length > 1 && !isGameOver && (
                    <button
                      onClick={() => setShowSurrenderConfirm(true)}
                      className="px-2 py-1 bg-black/80 hover:bg-rose-950/90 text-rose-300 hover:text-rose-200 text-[10px] font-bold rounded-xl border border-rose-500/50 hover:border-rose-400 shadow-lg transition active:scale-95 flex items-center gap-1 backdrop-blur-md cursor-pointer"
                      title="Abandonar partida y conceder la victoria al oponente"
                    >
                      <span>🏳️</span>
                      <span>Rendirse</span>
                    </button>
                  )}
                </div>

                {/* VISTA DE CÁMARA DINÁMICA CINEMÁTICA CON CLAMPING MATEMÁTICO */}
                {(() => {
                  const clampedCam = calculateClampedCameraTransform(camera);
                  return (
                    <div
                      className="relative w-full h-full will-change-transform"
                      style={{
                        transform: `translate(${clampedCam.translateX}%, ${clampedCam.translateY}%) scale(${clampedCam.zoom})`,
                        transformOrigin: '0 0',
                        transition: 'transform 1.3s cubic-bezier(0.25, 1, 0.5, 1)'
                      }}
                    >
                      <img
                        src="/Tablero.jpg"
                        alt="Tablero Bíblico"
                        className="w-full h-full object-fill select-none"
                      />

                  {/* FICHAS DE LOS JUGADORES RENDERIZADAS SOBRE EL TABLERO */}
                  {players.map((p, idx) => {
                    const coords = (boardCoordinates as Array<{ x: number; y: number }>)[p.position] || { x: 29.88, y: 89.45 };
                    const isActive = idx === activePlayerIndex;

                    return (
                      <div
                        key={`token-${p.id || idx}`}
                        className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-[left,top] transition-transform duration-200 ${
                          isActive && isMovingStepByStep ? 'scale-125 -translate-y-2 drop-shadow-[0_12px_14px_rgba(245,158,11,0.7)]' : ''
                        }`}
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          transition: 'left 0.26s cubic-bezier(0.25, 1, 0.5, 1), top 0.26s cubic-bezier(0.25, 1, 0.5, 1)'
                        }}
                      >
                        <div className="relative flex flex-col items-center">
                          {/* Etiqueta de Nombre Flotante */}
                          <span className="text-[9px] font-black px-1.5 py-0.2 bg-black/80 text-amber-200 rounded-md border border-white/30 whitespace-nowrap mb-0.5 shadow">
                            {p.name.slice(0, 10)}
                          </span>

                          {/* Ficha Visual con Aro SVG Dinámico que se consume */}
                          <TurnTimerAvatarRing
                            avatar={p.avatar}
                            name={p.name}
                            isActive={isActive}
                            timeLeft={turnTimeLeft}
                            timeLimit={turnTimeLimit}
                            size={isActive ? 'md' : 'sm'}
                          />

                          {/* Badge Flotante de Temporizador en el Tablero */}
                          {isActive && turnTimeLimit < 99999 && (
                            <span className="mt-0.5 text-[8px] font-black px-1.5 py-0.2 bg-black/90 text-amber-300 rounded-full border border-amber-400/80 shadow animate-pulse">
                              ⏱️ {turnTimeLeft}s
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  );
                })()}
              </div>

              {/* BOTÓN DE DADO EN MÓVIL: JUSTO DEBAJO DEL TABLERO */}
              <div className="w-full lg:hidden px-1">
                {currentPlayer && currentPlayer.position < 75 && !activeQuestion && (
                  <div>
                    {currentPlayer.skipNextTurn ? (
                      <div className="p-3 bg-red-950/90 border-2 border-red-500/90 rounded-2xl text-center space-y-2 shadow-xl">
                        <div className="flex items-center justify-center gap-1.5 text-red-200 font-black text-sm">
                          <span className="text-base">⏳</span>
                          <span>{isMyTurn ? "Pierdes este turno (Sanción)" : `Turno sancionado de ${currentPlayer.name}`}</span>
                        </div>
                        {isMyTurn ? (
                          <button
                            onClick={passTurnSanction}
                            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition transform active:scale-95 border border-red-400"
                          >
                            ✓ Cumplir Sanción y Ceder Turno
                          </button>
                        ) : (
                          <p className="text-[11px] text-red-300/80 font-medium">Esperando que cumpla su sanción...</p>
                        )}
                      </div>
                    ) : isMyTurn ? (
                      <div className="space-y-2">
                        {/* SELECTOR DE TIPO DE DADO (DIGITAL VS FÍSICO) */}
                        {!isOnline && (
                          <div className="flex items-center justify-between bg-black/40 p-1 rounded-xl border border-stone-800 text-[10px] font-bold">
                            <span className="text-stone-400 pl-1">Tipo de Dado:</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  playGameSound('select');
                                  setDiceInputMode('DIGITAL');
                                }}
                                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                                  diceInputMode === 'DIGITAL'
                                    ? 'bg-amber-500 text-amber-950 font-black shadow'
                                    : 'text-stone-400 hover:text-stone-200'
                                }`}
                              >
                                🎲 Digital
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  playGameSound('select');
                                  setDiceInputMode('FISICO');
                                }}
                                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                                  diceInputMode === 'FISICO'
                                    ? 'bg-emerald-500 text-emerald-950 font-black shadow'
                                    : 'text-stone-400 hover:text-stone-200'
                                }`}
                              >
                                🎲 Físico Real
                              </button>
                            </div>
                          </div>
                        )}

                        {diceInputMode === 'DIGITAL' || isOnline ? (
                          <button
                            disabled={isRolling || isTurnProcessing}
                            onClick={() => rollDice()}
                            className={`w-full py-3 sm:py-3.5 px-4 font-black text-base sm:text-lg rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-3 border-2 ${
                              hasExtraRoll
                                ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-amber-500 text-amber-950 border-white ring-4 ring-amber-300 animate-bounce'
                                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-amber-950 border-amber-300 ring-2 ring-amber-400/50'
                            } ${(isRolling || isTurnProcessing) ? 'opacity-90 cursor-not-allowed' : ''}`}
                          >
                            <div className="shrink-0">
                              <motion.div
                                animate={
                                  diceAnimState.isSpinning
                                    ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 0.95, 1.1, 1] }
                                    : diceAnimState.visible
                                    ? { rotate: [0, -10, 10, 0], scale: [1.2, 1] }
                                    : {}
                                }
                                transition={
                                  diceAnimState.isSpinning
                                    ? { repeat: Infinity, duration: 0.25, ease: "linear" }
                                    : { duration: 0.3 }
                                }
                              >
                                <DiceFace value={diceAnimState.visible ? diceAnimState.displayValue : (dice || 6)} size="sm" />
                              </motion.div>
                            </div>
                            <div className="text-left leading-tight">
                              <p className="text-base font-black text-amber-950">
                                {(isRolling || isTurnProcessing)
                                  ? (diceAnimState.isSpinning ? '🎲 Rodando dado...' : `¡Salió un ${diceAnimState.finalValue}!`)
                                  : hasExtraRoll
                                  ? '✨ ¡TIRO EXTRA! Lanzar'
                                  : `🎲 ¡Tirar Dado! (${currentPlayer.name})`}
                              </p>
                            </div>
                          </button>
                        ) : (
                          /* SELECTOR DE DADO FÍSICO (BOTONES 1 A 6) */
                          <div className="bg-emerald-950/40 border-2 border-emerald-500/50 p-2.5 rounded-2xl text-center space-y-2 shadow-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wide">
                                🎲 Tira tu Dado Físico y Selecciona:
                              </span>
                              <span className="text-[10px] text-stone-400 font-bold">
                                {currentPlayer.name}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-6 gap-1.5">
                              {[1, 2, 3, 4, 5, 6].map((num) => (
                                <button
                                  key={num}
                                  disabled={isRolling || isTurnProcessing}
                                  onClick={() => rollDice(num)}
                                  className="py-2.5 rounded-xl bg-stone-900/90 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-300 text-white font-black text-base shadow transition transform active:scale-90 flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
                                  title={`Seleccionar ${num}`}
                                >
                                  <span className="text-xs group-hover:scale-110 transition-transform">🎲</span>
                                  <span className="text-sm font-black group-hover:text-black">{num}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BOTÓN REVERTIR JUGADA / DESHACER TIRO */}
                        {lastTurnSnapshot && !isOnline && !isRolling && !isTurnProcessing && (
                          <button
                            type="button"
                            onClick={undoLastTurn}
                            className="w-full py-1.5 px-3 bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
                          >
                            <RotateCcw size={13} className="text-amber-400" />
                            <span>↩️ ¿Te equivocaste de número? Revertir y volver a tirar</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full py-2.5 px-3 bg-black/40 border border-stone-800 rounded-xl text-center text-stone-400 font-bold text-xs flex items-center justify-center gap-2 shadow">
                        <span className="animate-spin text-amber-400">⏳</span>
                        <span>Esperando a <strong>{currentPlayer.name}</strong>...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* COLUMNA 2: PANEL LATERAL DE CONTROL PARA COMPUTADORAS (PC / DESKTOP) */}
            <div className="hidden lg:flex w-96 flex-col gap-3 bg-[#2A2621]/90 border border-amber-900/40 rounded-3xl p-4 shadow-xl max-h-[min(calc(100vh-115px),650px)] overflow-y-auto">
              
              {/* 1. CUADRO DE LANZAR DADO EN PC (ARRIBA DEL ESTADO DE LA RONDA, CON DADO INTEGRADO) */}
              {currentPlayer && currentPlayer.position < 75 && !activeQuestion && (
                <div className="pb-1">
                  {currentPlayer.skipNextTurn ? (
                    <div className="p-3.5 bg-red-950/90 border-2 border-red-500/90 rounded-2xl text-center space-y-2.5 shadow-xl">
                      <div className="flex items-center justify-center gap-2 text-red-200 font-black text-sm">
                        <span className="text-lg">⏳</span>
                        <span>{isMyTurn ? "Pierdes este turno (Sanción)" : `Turno sancionado de ${currentPlayer.name}`}</span>
                      </div>
                      <p className="text-[11px] text-red-300/90 leading-tight">
                        {isMyTurn ? "Cumples tu turno de castigo y el juego continúa normalmente." : `Esperando que ${currentPlayer.name} cumpla su sanción.`}
                      </p>
                      {isMyTurn && (
                        <button
                          onClick={passTurnSanction}
                          className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition transform active:scale-95 border border-red-400"
                        >
                          ✓ Cumplir Sanción y Ceder Turno
                        </button>
                      )}
                    </div>
                  ) : isMyTurn ? (
                    <div className="space-y-2">
                      {/* SELECTOR DE TIPO DE DADO EN PC */}
                      {!isOnline && (
                        <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-xl border border-stone-800 text-[10px] font-bold">
                          <span className="text-stone-400 pl-1">Modalidad de Dado:</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                playGameSound('select');
                                setDiceInputMode('DIGITAL');
                              }}
                              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                diceInputMode === 'DIGITAL'
                                  ? 'bg-amber-500 text-amber-950 font-black shadow'
                                  : 'text-stone-400 hover:text-stone-200'
                              }`}
                            >
                              🎲 Digital
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playGameSound('select');
                                setDiceInputMode('FISICO');
                              }}
                              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                diceInputMode === 'FISICO'
                                  ? 'bg-emerald-500 text-emerald-950 font-black shadow'
                                  : 'text-stone-400 hover:text-stone-200'
                              }`}
                            >
                              🎲 Físico Real
                            </button>
                          </div>
                        </div>
                      )}

                      {diceInputMode === 'DIGITAL' || isOnline ? (
                        <button
                          disabled={isRolling || isTurnProcessing}
                          onClick={() => rollDice()}
                          className={`w-full py-3.5 px-4 font-black rounded-2xl shadow-2xl transition transform active:scale-95 flex items-center justify-center gap-3.5 border-2 ${
                            hasExtraRoll
                              ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-amber-500 text-amber-950 border-white ring-4 ring-amber-300 animate-bounce'
                              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-amber-950 border-amber-300 ring-2 ring-amber-400/50'
                          } ${(isRolling || isTurnProcessing) ? 'opacity-95 cursor-not-allowed' : ''}`}
                        >
                          {/* Cara del dado integrada dentro del botón */}
                          <div className="shrink-0">
                            <motion.div
                              animate={
                                diceAnimState.isSpinning
                                  ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 0.9, 1.15, 1] }
                                  : diceAnimState.visible
                                  ? { rotate: [0, -12, 12, 0], scale: [1.25, 1] }
                                  : {}
                              }
                              transition={
                                diceAnimState.isSpinning
                                  ? { repeat: Infinity, duration: 0.25, ease: "linear" }
                                  : { duration: 0.35, type: "spring", stiffness: 400 }
                              }
                            >
                              <DiceFace value={diceAnimState.visible ? diceAnimState.displayValue : (dice || 6)} size="sm" />
                            </motion.div>
                          </div>

                          <div className="text-left leading-tight">
                            {players.length === 1 ? (
                              isRolling || isTurnProcessing ? (
                                <div>
                                  <p className="text-sm sm:text-base font-black text-amber-950">
                                    📖 Generando Desafío...
                                  </p>
                                  <p className="text-[10px] font-bold text-amber-900/80">Avanzando a Casilla {Math.min(75, (currentPlayer.position || 0) + 1)}/75</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-1.5">
                                    <span>⚡ Siguiente Desafío Bíblico</span>
                                    <span className="bg-amber-950 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold">+1 Paso</span>
                                  </p>
                                  <p className="text-[10px] font-bold text-amber-900/90 truncate">
                                    Casilla {Math.min(75, (currentPlayer.position || 0) + 1)}/75 · {boardData.find(b => b.id === Math.min(75, (currentPlayer.position || 0) + 1))?.period || 'El Principio'}
                                  </p>
                                </div>
                              )
                            ) : isRolling || isTurnProcessing ? (
                              <div>
                                <p className="text-base font-black text-amber-950">
                                  {diceAnimState.isSpinning ? '🎲 Rodando dado...' : `¡Salió un ${diceAnimState.finalValue}!`}
                                </p>
                                <p className="text-[10px] font-bold text-amber-900/80">Avanzando en el tablero...</p>
                              </div>
                            ) : hasExtraRoll ? (
                              <div>
                                <p className="text-base font-black text-amber-950">✨ ¡TIRO EXTRA!</p>
                                <p className="text-[10px] font-bold text-amber-900/80">Lanzar de nuevo</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-base font-black text-amber-950">🎲 ¡Tirar Dado!</p>
                                <p className="text-[10px] font-bold text-amber-900/80">Turno de {currentPlayer.name}</p>
                              </div>
                            )}
                          </div>
                        </button>
                      ) : (
                        /* SELECTOR DE DADO FÍSICO EN PC (BOTONES 1 A 6) */
                        <div className="bg-emerald-950/40 border-2 border-emerald-500/50 p-3 rounded-2xl text-center space-y-2.5 shadow-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                              🎲 Tira tu Dado Físico y Selecciona:
                            </span>
                            <span className="text-[11px] text-stone-400 font-bold">
                              {currentPlayer.name}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-6 gap-2">
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <button
                                key={num}
                                disabled={isRolling || isTurnProcessing}
                                onClick={() => rollDice(num)}
                                className="py-3 rounded-xl bg-stone-900/90 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-300 text-white font-black text-base shadow-md transition transform active:scale-90 flex flex-col items-center justify-center gap-1 cursor-pointer group"
                                title={`Seleccionar resultado ${num}`}
                              >
                                <span className="text-xs group-hover:scale-110 transition-transform">🎲</span>
                                <span className="text-sm font-black group-hover:text-black">{num}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* BOTÓN REVERTIR JUGADA / DESHACER TIRO EN PC */}
                      {lastTurnSnapshot && !isOnline && !isRolling && !isTurnProcessing && (
                        <button
                          type="button"
                          onClick={undoLastTurn}
                          className="w-full py-2 px-3 bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow cursor-pointer"
                        >
                          <RotateCcw size={14} className="text-amber-400" />
                          <span>↩️ ¿Error de número? Revertir y volver a tirar</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full py-3 px-4 bg-black/40 border border-stone-800 rounded-2xl flex items-center justify-center gap-3 text-stone-400 font-bold text-xs shadow">
                      {diceAnimState.visible && (
                        <motion.div
                          animate={
                            diceAnimState.isSpinning
                              ? { rotate: [0, 90, 180, 270, 360] }
                              : { scale: [1.2, 1] }
                          }
                          transition={{ repeat: diceAnimState.isSpinning ? Infinity : 0, duration: 0.25 }}
                          className="shrink-0"
                        >
                          <DiceFace value={diceAnimState.displayValue} size="sm" />
                        </motion.div>
                      )}
                      <div>
                        <p className="text-stone-300 font-black text-sm">
                          {diceAnimState.visible
                            ? (diceAnimState.isSpinning ? '🎲 Rodando dado...' : `¡${currentPlayer.name} sacó un ${diceAnimState.finalValue}!`)
                            : `Esperando a ${currentPlayer.name}...`}
                        </p>
                        <p className="text-[10px] text-stone-500 font-medium">Turno del rival en curso</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {/* 2. Consola de Mensajes y Log en Vivo */}
                <div className="p-3 bg-black/40 border border-amber-800/30 rounded-2xl text-center shadow-inner">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-0.5">Estado de la Ronda</span>
                  <p className="text-xs sm:text-sm font-medium text-amber-100 leading-snug">{logMessage}</p>
                </div>

                {/* 3. Lista de Tarjetas de Jugadores */}
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1.5 px-1">
                    Jugadores en Partida ({players.length})
                  </span>
                  <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-0.5">
                    {players.map((p, idx) => {
                      const isActive = idx === activePlayerIndex;

                      return (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                            isActive
                              ? 'bg-amber-950 border-amber-400 shadow-md ring-2 ring-amber-400/60'
                              : 'bg-black/30 border-stone-800 opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="relative group">
                              <TurnTimerAvatarRing
                                avatar={p.avatar}
                                name={p.name}
                                isActive={isActive}
                                timeLeft={turnTimeLeft}
                                timeLimit={turnTimeLimit}
                                size="lg"
                                onClick={() => {
                                  if (!isOnline || isThisPlayerMe(p)) {
                                    setAvatarPickerPlayerIndex(idx);
                                  }
                                }}
                              />
                              <span className="absolute -bottom-1 -right-1 text-[8px] bg-amber-500 text-black px-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition">
                                ✏️
                              </span>
                            </div>

                            <div className="overflow-hidden">
                              <p className="text-xs font-black text-amber-200 truncate leading-tight">
                                {p.name} {isOnline && isThisPlayerMe(p) ? '(Tú)' : ''}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[10px] text-stone-400">
                                  {isActive ? '🎲 En Turno' : `Casilla ${p.position}`}
                                </p>
                                {isActive && turnTimeLimit < 99999 && (
                                  <span className="text-[10px] font-black px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded-md border border-amber-500/60">
                                    ⏱️ {turnTimeLeft}s
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            {p.skipNextTurn ? (
                              <span className="text-[9px] bg-red-900/90 text-red-200 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                                ⏳ Sanción
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-amber-300 px-1.5 py-0.5 bg-black/50 rounded-lg border border-amber-900/40">
                                C.{p.position}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* MODAL DE PREGUNTA BÍBLICA SI CAE EN CASILLA QUESTION */}
      {activeQuestion && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="bg-[#2A2621] border-2 border-amber-500 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-amber-100 space-y-4 relative overflow-hidden">
            {/* BARRA DE CRONÓMETRO REGRESIVO */}
            <div className="w-full bg-stone-800 h-3 rounded-full overflow-hidden mb-1 border border-stone-700">
              <div
                className={`h-full transition-all duration-1000 ${
                  questionTimeLimit >= 99999
                    ? 'bg-emerald-500 w-full'
                    : boardTimeLeft > getDynamicQuestionTimeLimit(activeQuestion, questionTimeLimit) * 0.5
                    ? 'bg-emerald-500'
                    : boardTimeLeft > 5
                    ? 'bg-amber-500'
                    : 'bg-red-600'
                }`}
                style={{
                  width: questionTimeLimit >= 99999 ? '100%' : `${Math.max(0, Math.min(100, (boardTimeLeft / getDynamicQuestionTimeLimit(activeQuestion, questionTimeLimit)) * 100))}%`
                }}
              />
            </div>

            {/* Encabezado de Pregunta */}
            <div className="flex justify-between items-center border-b border-amber-900/50 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {activeQuestion.period || 'Trivia Bíblica'}
                </span>
                <p className="text-[10px] text-stone-400 leading-none mt-0.5">Cita: {activeQuestion.reference || 'Biblia'}</p>
              </div>

              <div
                className={`px-3 sm:px-4 py-1.5 rounded-2xl font-mono font-black text-lg sm:text-xl shadow-xl flex items-center gap-1.5 ${
                  questionTimeLimit >= 99999
                    ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500'
                    : boardTimeLeft <= 5
                    ? 'bg-red-600 text-white animate-bounce ring-4 ring-red-400/50'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 ring-2 ring-amber-300'
                }`}
              >
                {questionTimeLimit >= 99999 ? (
                  <span>⏱️ ♾️ Sin límite</span>
                ) : (
                  <span>⏱️ 00:{boardTimeLeft < 10 ? `0${boardTimeLeft}` : boardTimeLeft}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 bg-stone-900/90 rounded-xl border border-stone-800 text-[11px] font-bold shadow">
              <div className="flex items-center gap-1 text-emerald-400">
                <span>🎯 Acierto:</span>
                <span className="bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-700/60 font-black text-xs">
                  {activeConsequence.bien === 0 ? 'No se devuelve (+0)' : `+${activeConsequence.bien} ${activeConsequence.bien === 1 ? 'casilla' : 'casillas'}`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-rose-400">
                <span>⚠️ Fallo:</span>
                <span className="bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-700/60 font-black text-xs">
                  -{Math.abs(activeConsequence.mal)} {Math.abs(activeConsequence.mal) === 1 ? 'casilla' : 'casillas'}
                </span>
              </div>
            </div>

            {showAnswer ? (
              <div className={`p-3 rounded-2xl border text-center animate-bounce shadow-xl ${
                selectedOption === activeQuestion.correctAnswer
                  ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50'
                  : 'bg-rose-950/95 border-rose-500 text-rose-200'
              }`}>
                <p className="text-sm font-black flex items-center justify-center gap-1.5">
                  {selectedOption === activeQuestion.correctAnswer ? (
                    <>
                      <span className="text-base">🎉</span>
                      <span className="tracking-wide">¡¡RESPUESTA CORRECTA!! ✨ ¡Excelente!</span>
                      <span className="text-base">🎊</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">❌</span>
                      <span className="tracking-wide">¡Respuesta Incorrecta!</span>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className={`p-2.5 rounded-xl border text-center ${
                isMyTurn ? 'bg-amber-950/70 border-amber-400 shadow-md' : 'bg-black/50 border-stone-700'
              }`}>
                <p className="text-xs font-black text-amber-200">
                  {isMyTurn ? "👉 ¡TU TURNO! Selecciona la respuesta correcta:" : `⏳ Responde: ${currentPlayer.name} (Observando partida)`}
                </p>
              </div>
            )}

            <h4 className="text-base sm:text-lg font-bold text-amber-200 leading-snug">{activeQuestion.question}</h4>

            <div className="space-y-2 pt-1">
              {Array.isArray(activeQuestion.options) && activeQuestion.options.map((option, idx) => {
                let btnColor = "bg-stone-800 text-amber-100 border-stone-700";
                if (showAnswer) {
                  if (idx === activeQuestion.correctAnswer) {
                    btnColor = "bg-emerald-700 text-white border-emerald-400 shadow-lg font-bold";
                  } else if (idx === selectedOption) {
                    btnColor = "bg-red-800 text-white border-red-500";
                  } else {
                    btnColor = "bg-stone-900 text-stone-500 border-stone-800 opacity-60";
                  }
                } else if (isMyTurn) {
                  btnColor = "bg-stone-800 hover:bg-amber-900/70 text-amber-100 border-stone-600 hover:border-amber-400 active:scale-[0.98] cursor-pointer";
                } else {
                  btnColor = "bg-stone-900/90 text-stone-300 border-stone-800 cursor-default opacity-80";
                }

                return (
                  <button
                    key={idx}
                    disabled={showAnswer || !isMyTurn}
                    onClick={() => handleQuestionAnswer(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-sm font-medium transition ${btnColor}`}
                  >
                    <span className="font-bold mr-2 text-amber-400">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}



      {/* PANTALLA COMPLETA TOTAL DE CIERRE DE PARTIDA: CEREMONIA DE RANKING Y PUNTOS */}
      <GameOverCeremonyModal
        isOpen={isGameOver}
        isSolo={players.length === 1}
        isOnline={isOnline}
        gameWinner={gameWinner}
        currentPlayer={currentPlayer}
        players={players}
        soloScoreResult={sessionSoloScoreResult}
        soloMatchDuration={soloMatchDuration}
        correctCount={sessionCorrectCount}
        totalQuestions={sessionTotalQuestions}
        timeElapsedSeconds={soloTimeElapsed}
        difficulty={localDifficulty}
        userRating={userProfile?.rating || 1000}
        talentsEarned={sessionTalentsEarned}
        surrenderInfo={surrenderInfo}
        onOpenLeaderboard={() => {
          if (onOpenLeaderboard) onOpenLeaderboard();
          else setShowSoloLeaderboardModal(true);
        }}
        onRestart={() => {
          if (isOnline) {
            onlineService.sendGameAction('RESTART_GAME');
          }
          setPlayers(prev => prev.map(p => ({ ...p, position: 0, skipNextTurn: false, tile9Count: 0, consecutiveSixes: 0 })));
          setActivePlayerIndex(0);
          setDice(null);
          setHasExtraRoll(false);
          setIsGameOver(false);
          setGameWinner(null);
          setSurrenderInfo(null);
          setActiveQuestion(null);
          setShowAnswer(false);
          setCamera({ x: 50, y: 50, zoom: 1 });
          setLogMessage("🔄 ¡Revancha iniciada! Turno del Jugador 1.");
        }}
        onExit={() => onExit()}
        onOpenNewRoom={onOpenNewRoom}
      />

      {/* 🚪 MODAL DE CONFIRMACIÓN PARA SALIR / ABANDONAR PARTIDA */}
      <AnimatePresence>
        {showExitConfirmModal && (
          <motion.div
            key="board-exit-confirm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-black/85 backdrop-blur-md p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#24201A] border-2 border-amber-500/60 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto border border-amber-400/40">
                <span className="text-2xl">⚠️</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-amber-200">
                  ¿Abandonar la Partida?
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Hay una partida en curso. Si sales ahora perderás tu progreso actual en el tablero. ¿Seguro que deseas salir al menú principal?
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    onExit();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Sí, Salir de la Partida
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(false)}
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Continuar Jugando
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🏳️ MODAL DE CONFIRMACIÓN DE ABANDONAR / RENDIRSE */}
      <AnimatePresence>
        {showSurrenderConfirm && (
          <div className="fixed inset-0 z-[11000] bg-black/85 backdrop-blur-md p-4 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#24201A] border-2 border-rose-600/70 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto border border-rose-400/40">
                <span className="text-2xl">🏳️</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-rose-200">
                  ¿Deseas abandonar el duelo?
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Si te rindes, la partida finalizará de inmediato y se otorgará la victoria y los <strong className="text-amber-300">+2 🪙 Talentos</strong> a tu rival.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSurrenderMatch}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Sí, Abandonar Partida
                </button>
                <button
                  onClick={() => setShowSurrenderConfirm(false)}
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Continuar Jugando
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL SELECTOR DE PERSONAJE BÍBLICO (AVATAR) */}
      <AnimatePresence>
        {avatarPickerPlayerIndex !== null && players[avatarPickerPlayerIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#2A2621] border border-amber-800/60 rounded-3xl p-5 max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
                <div>
                  <h3 className="text-lg font-black text-amber-200 font-serif">
                    Elige Personaje Bíblico
                  </h3>
                  <p className="text-xs text-stone-400">
                    Asignando a: <strong className="text-amber-300">{players[avatarPickerPlayerIndex].name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setAvatarPickerPlayerIndex(null)}
                  className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {BIBLE_AVATARS.map(avatar => {
                  const isVip = isUserPremium();
                  const isLocked = avatar.isPremium && !isVip;
                  const isSelected = players[avatarPickerPlayerIndex].avatar === avatar.imagePath;

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          playGameSound('wrong');
                          triggerHaptic('warning');
                          setFriendInviteNotification('👑 Este personaje bíblico es exclusivo para usuarios Premium VIP. ¡Pásate a Premium para jugar con todos los personajes!');
                          return;
                        }
                        const targetIdx = avatarPickerPlayerIndex;
                        setPlayers(prev =>
                          prev.map((p, i) =>
                            i === targetIdx ? { ...p, avatar: avatar.imagePath } : p
                          )
                        );
                        if (isOnline) {
                          onlineService.sendGameAction('CHANGE_AVATAR', {
                            playerIndex: targetIdx,
                            avatar: avatar.imagePath,
                          });
                        }
                        playGameSound('select');
                        triggerHaptic('light');
                        setAvatarPickerPlayerIndex(null);
                      }}
                      className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 text-center relative ${
                        isLocked
                          ? 'bg-stone-950/80 border-stone-800 opacity-60 hover:opacity-90 cursor-pointer'
                          : isSelected
                          ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400 shadow-lg scale-105 cursor-pointer'
                          : 'bg-stone-900/80 border-stone-800 hover:border-amber-500/50 hover:bg-stone-800 cursor-pointer'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={avatar.imagePath}
                          alt={avatar.name}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-400/60 shadow ${isLocked ? 'grayscale-[40%]' : ''}`}
                        />
                        <span className="absolute -top-1 -right-1 text-sm bg-black/80 px-1 rounded-full border border-white/20">
                          {avatar.icon}
                        </span>
                        {avatar.isPremium && (
                          <span className={`absolute -bottom-1 -left-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border shadow ${
                            isLocked ? 'bg-stone-900 text-amber-400 border-amber-500/60' : 'bg-amber-500 text-amber-950 border-amber-300'
                          }`}>
                            {isLocked ? '🔒 VIP' : '👑 VIP'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-200">{avatar.name}</p>
                        <p className="text-[10px] text-stone-400 leading-tight">
                          {isLocked ? 'Exclusivo VIP' : avatar.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>


              <div className="pt-2 text-center">
                <button
                  onClick={() => setAvatarPickerPlayerIndex(null)}
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🪙 TOAST FLOTANTE ANIMADO DE TALENTOS (+/-) */}
      <AnimatePresence>
        {talentToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-[12000] px-4 py-2.5 rounded-2xl border-2 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-black ${
              talentToast.type === 'gain'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 ring-4 ring-emerald-400/30'
                : 'bg-rose-950/95 border-rose-500 text-rose-100 ring-4 ring-rose-500/30'
            }`}
          >
            <GoldCoinIcon className="w-5 h-5 animate-bounce shrink-0" />
            <span>{talentToast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 🧭 GUÍA EN VIVO CON PUNTERO DINÁMICO EN LA PANTALLA REAL (TABLERO) */}
      <LiveInteractivePointerTour
        mode="TABLERO"
        isActive={!isTutorialCompleted("TABLERO")}
        onFinish={() => {}}
        playSound={playGameSound}
        triggerHaptic={triggerHaptic}
        steps={[
          {
            title: "1. Elige tu Modo de Juego",
            instruction: "Selecciona 'Solitario' para una carrera contrarreloj o 'Grupo Local' para jugar de 2 a 8 personas en este dispositivo.",
            position: "top",
            handEmoji: "👇"
          },
          {
            title: "2. Selecciona la Temática y Dificultad",
            instruction: "Filtra por Períodos Bíblicos, Versículos o Personajes, y escoge el nivel adecuado para los jugadores.",
            position: "top",
            handEmoji: "👇"
          },
          {
            title: "3. Tiempo por Turno y Pregunta",
            instruction: "Configura el cronómetro para responder y lanzar los dados con agilidad.",
            position: "top",
            handEmoji: "⏱️"
          },
          {
            title: "4. Inicia la Carrera Bíblica",
            instruction: "Toca el botón principal para entrar al tablero, tirar los dados y avanzar hacia la meta final (Casilla 66).",
            position: "bottom",
            handEmoji: "🚀"
          }
        ]}
      />
      {/* ⚠️ MODAL LOCAL DE SALDO INSUFICIENTE DE TALENTOS */}
      {localInsufficientTalentsModal && (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setLocalInsufficientTalentsModal(null)}
        >
          <div
            className="bg-gradient-to-b from-[#2B1B17] via-[#1E1411] to-[#120B0A] border-2 border-amber-500/80 rounded-3xl max-w-md w-full p-5 sm:p-6 text-center space-y-4 shadow-2xl relative overflow-hidden text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1.5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto border border-amber-400/40 shadow-inner">
                <GoldCoinIcon className="w-9 h-9 animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-400/40 inline-block">
                Aviso de Talentos
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight">
                ¡Te has quedado sin talentos!
              </h3>
              <p className="text-xs text-stone-300">
                Necesitas al menos 1 talento para jugar en <strong className="text-amber-300">{localInsufficientTalentsModal.modeName}</strong>. Tu saldo actual es de <strong className="text-rose-400">0 Talentos</strong>.
              </p>
            </div>

            <div className="p-3 bg-stone-900/90 rounded-2xl border border-stone-800 text-left text-xs space-y-2 relative z-10">
              <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1">
                <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                  <span>🕊️</span> Recarga Diaria de Bendición
                </span>
                <p className="text-[11px] text-stone-300 leading-snug">
                  Mañana recibirás <strong className="text-emerald-300 font-black">+6 Nuevos Talentos</strong> de bendición diaria (tiempo restante: <span className="text-amber-300 font-mono font-bold">{getTimeUntilNextRefill().formatted}</span>).
                </p>
              </div>

              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide pt-1">
                ¿Quieres seguir jugando ahora mismo?
              </p>
            </div>

            <div className="space-y-2 pt-1 relative z-10">
              <button
                type="button"
                onClick={async () => {
                  playGameSound("select");
                  const myCode = `BIBLOS-${(userProfile?.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfile?.rating || 1000) % 9000)}`;
                  const inviteUrl = generateFriendInviteUrl({
                    name: userProfile?.name || 'Jugador Bíblico',
                    code: myCode,
                    avatar: userProfile?.avatar || '/avatars/david.jpg',
                    country: userProfile?.country || 'DO',
                    countryFlag: userProfile?.countryFlag || '🇩🇴'
                  });

                  const bonus = claimSocialShareBonus();
                  if (bonus.success) {
                    setUserTalents(bonus.newBalance);
                    confetti({ particleCount: 60, spread: 70 });
                    playCelebrationSound();
                    triggerHaptic("success");
                    setLocalInsufficientTalentsModal(null);
                  } else {
                    alert(bonus.message);
                  }

                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Biblos Games - El Juego de la Biblia',
                        text: `🎲🕊️ ¡Estoy jugando Biblos Games! Únete conmigo a responder trivias bíblicas y avanzar en el tablero.\n${inviteUrl}`,
                        url: inviteUrl
                      });
                    } catch (e) {
                      console.log('Share canceled', e);
                    }
                  } else {
                    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`;
                    window.open(fbUrl, '_blank', 'width=600,height=500');
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 border border-blue-400/40"
              >
                <Share2 size={16} className="text-amber-300" />
                <span>Compartir en Facebook (+3 <GoldCoinIcon className="w-3.5 h-3.5 inline" />)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocalInsufficientTalentsModal(null);
                  onExit();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Users size={16} className="text-amber-300" />
                <span>Pedir Talentos a Amigos (+3 <GoldCoinIcon className="w-3.5 h-3.5 inline" />)</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalInsufficientTalentsModal(null)}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 font-bold rounded-xl text-[11px] uppercase tracking-wider transition cursor-pointer"
              >
                Entendido, Regresar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [userProfileState, setUserProfileState] = useState<UserProfile>(() => getUserProfile());
  const [showCopaBiblosMode, setShowCopaBiblosMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<string>('RATING');
  const [soloTimeFilter, setSoloTimeFilter] = useState<string>('TODOS');
  const [ratingRegionFilter, setRatingRegionFilter] = useState<string>('TODAS');
  const [ratingCountryFilter, setRatingCountryFilter] = useState<string>('TODOS');
  const [screen, setScreen] = useState<'WELCOME' | 'TRIVIA' | 'TABLERO'>('WELCOME');
  const [isSoundOn, setIsSoundOn] = useState(true);

  // --- ADMINISTRADOR EXCLUSIVO DE PREGUNTAS GENERALES Y AJUSTES DE APP ---
  const [showGlobalAdminPinModal, setShowGlobalAdminPinModal] = useState(false);
  const [globalAdminEnteredPin, setGlobalAdminEnteredPin] = useState('');
  const [globalAdminPinError, setGlobalAdminPinError] = useState('');
  const [showQuestionsManagerModal, setShowQuestionsManagerModal] = useState(false);
  const [customQuestionsCount, setCustomQuestionsCount] = useState<number>(() => getCustomQuestions().length);
  const [jsonQuestionsInput, setJsonQuestionsInput] = useState('');
  const [questionsManagerFeedback, setQuestionsManagerFeedback] = useState('');
  const [questionsAdminTab, setQuestionsAdminTab] = useState<'JSON' | 'FORM'>('JSON');

  // Estado del Formulario Rápido de 1 Pregunta
  const [formQQuestion, setFormQQuestion] = useState('');
  const [formQOptions, setFormQOptions] = useState<string[]>(['', '', '', '']);
  const [formQCorrect, setFormQCorrect] = useState<number>(0);
  const [formQDifficulty, setFormQDifficulty] = useState<'BASIC' | 'INTERMEDIATE' | 'ADVANCED'>('BASIC');
  const [formQPeriod, setFormQPeriod] = useState<Period>(Period.PRINCIPIO);
  const [formQReference, setFormQReference] = useState('');

  const reloadAllGameQuestions = () => {
    ALL_QUESTIONS = getAllGameQuestions();
    setCustomQuestionsCount(getCustomQuestions().length);
  };

  const handleVerifyGlobalAdminPin = () => {
    if (globalAdminEnteredPin === '7777' || globalAdminEnteredPin === '1234') {
      setShowGlobalAdminPinModal(false);
      setShowQuestionsManagerModal(true);
      setGlobalAdminEnteredPin('');
      setGlobalAdminPinError('');
      setJsonQuestionsInput(JSON.stringify(getCustomQuestions().length > 0 ? getCustomQuestions() : [
        {
          id: `q_custom_${Date.now()}`,
          mode: "HISTORIA",
          period: "El Principio",
          difficulty: "BASIC",
          question: "¿Quién construyó el arca por mandato de Dios?",
          options: ["Moisés", "Noé", "David", "Abraham"],
          correctAnswer: 1,
          reference: "Génesis 6:14"
        }
      ], null, 2));
      if (isSoundOn) playSound('select');
    } else {
      setGlobalAdminPinError('❌ PIN de Administrador incorrecto.');
    }
  };

  const handleSaveQuestionsFromJson = () => {
    try {
      const parsed = JSON.parse(jsonQuestionsInput);
      const listToSave: Question[] = Array.isArray(parsed) ? parsed : (parsed.customQuestions || [parsed]);
      
      if (listToSave.length === 0 || !listToSave[0].question) {
        setQuestionsManagerFeedback('⚠️ El JSON debe ser un array de preguntas con "question" y "options".');
        return;
      }

      const res = saveCustomQuestions(listToSave);
      if (res.success) {
        reloadAllGameQuestions();
        setQuestionsManagerFeedback(`✅ ¡Éxito! ${listToSave.length} preguntas guardadas. Total activas: ${BASE_QUESTIONS_COUNT + res.count}`);
        if (isSoundOn) playSound('win');
      } else {
        setQuestionsManagerFeedback(`❌ Error al guardar: ${res.error}`);
      }
    } catch (e: any) {
      setQuestionsManagerFeedback(`❌ Error de sintaxis JSON: ${e.message}`);
    }
  };

  const handleSaveSingleFormQuestion = () => {
    if (!formQQuestion.trim()) {
      setQuestionsManagerFeedback('⚠️ Por favor escribe el texto de la pregunta.');
      return;
    }
    if (formQOptions.some(opt => !opt.trim())) {
      setQuestionsManagerFeedback('⚠️ Las 4 opciones de respuesta deben estar completas.');
      return;
    }

    const singleQ: Question = {
      id: `q_user_${Date.now()}`,
      mode: 'HISTORIA',
      period: formQPeriod,
      difficulty: formQDifficulty as any,
      question: formQQuestion.trim(),
      options: formQOptions.map(o => o.trim()),
      correctAnswer: formQCorrect,
      reference: formQReference.trim() || 'Biblia'
    };

    const res = saveCustomQuestions([singleQ]);
    if (res.success) {
      reloadAllGameQuestions();
      setFormQQuestion('');
      setFormQOptions(['', '', '', '']);
      setFormQReference('');
      setQuestionsManagerFeedback(`✅ ¡Pregunta añadida con éxito! Total activas: ${BASE_QUESTIONS_COUNT + res.count}`);
      if (isSoundOn) playSound('correct');
    } else {
      setQuestionsManagerFeedback(`❌ Error al guardar: ${res.error}`);
    }
  };

  const playSound = (type: string) => {
    if (!isSoundOn) return;
    try {
      playGameSound(type as any);
    } catch (e) {
      // Safe fallback
    }
  };
  
  // --- ESTADOS MULTIJUGADOR EN LÍNEA & SUBMODALIDADES ---
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineSubTab, setOnlineSubTab] = useState<'MENU' | 'PRIVATE' | 'DUEL_1V1' | 'TODOS_VS_TODOS' | 'FRIENDS' | 'EVENTS'>('MENU');
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoom | null>(null);
  const [inputPinCode, setInputPinCode] = useState('');
  const [votingTimer, setVotingTimer] = useState<number>(8);
  const [questionTimeLimit, setQuestionTimeLimit] = useState<number>(15);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [onlineCountdown, setOnlineCountdown] = useState<number | null>(null);

  // 1 vs 1 Matchmaking
  const [isSearchingDuel, setIsSearchingDuel] = useState(false);
  const [duelSearchTime, setDuelSearchTime] = useState(0);
  const [searchAvatarIndex, setSearchAvatarIndex] = useState(0);
  const [duelMatchedPlayer, setDuelMatchedPlayer] = useState<{ name: string; avatar: string; country?: string; countryFlag?: string; rating: number } | null>(null);
  const [duelNoOpponent, setDuelNoOpponent] = useState(false);

  // Todos vs Todos (Matchmaking Grupal 3 a 8 jugadores - 1 minuto / 60 segundos)
  const [isSearchingGroup, setIsSearchingGroup] = useState(false);
  const [groupTimeRemaining, setGroupTimeRemaining] = useState(60);
  const [groupLobbyPlayers, setGroupLobbyPlayers] = useState<any[]>([]);
  const [groupLobbyCode, setGroupLobbyCode] = useState('');
  const [groupMatchStarting, setGroupMatchStarting] = useState(false);

  // Efecto para ciclar avatares bíblicos rápidamente durante la búsqueda 1v1 con sonido dinámico
  useEffect(() => {
    initAdMob();
  }, []);

  useEffect(() => {
    if (!isSearchingDuel) return;
    const avatarInterval = setInterval(() => {
      setSearchAvatarIndex(prev => {
        const next = (prev + 1) % BIBLE_AVATARS.length;
        if (isSoundOn) {
          const pitch = 620 + (next % 6) * 45;
          playSearchTickSound(pitch);
        }
        return next;
      });
    }, 120);
    const timerInterval = setInterval(() => {
      setDuelSearchTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(avatarInterval);
      clearInterval(timerInterval);
    };
  }, [isSearchingDuel, isSoundOn]);

  // Efecto de sonido de radar para Todos vs Todos durante los 30 segundos
  useEffect(() => {
    if (!isSearchingGroup) return;
    const interval = setInterval(() => {
      if (isSoundOn) {
        playSearchTickSound(680);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSearchingGroup, isSoundOn]);

  // Amigos (Lista Real & Invitaciones por Redes Sociales)
  const [friendsList, setFriendsList] = useState<Friend[]>(() => getSavedFriends());
  const [selectedFriendsToInvite, setSelectedFriendsToInvite] = useState<string[]>([]);
  const [showInviteFlyerSection, setShowInviteFlyerSection] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [reportingFriend, setReportingFriend] = useState<Friend | null>(null);
  const [reportReason, setReportReason] = useState<'CONDUCTA_INAPROPIADA' | 'NOMBRE_OFENSIVO' | 'TRAMPA' | 'OTRO'>('CONDUCTA_INAPROPIADA');
  const [reportDetails, setReportDetails] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendCode, setNewFriendCode] = useState('');
  const [copiedFriendLink, setCopiedFriendLink] = useState(false);
  const [friendInviteNotification, setFriendInviteNotification] = useState<string | null>(null);
  const [welcomeInviteData, setWelcomeInviteData] = useState<{ name: string; code: string; avatar: string; country: string; countryFlag: string } | null>(null);

  // Red de Amigos: Sala en Vivo & Notificaciones en Tiempo Real
  const [friendsLobbyCode, setFriendsLobbyCode] = useState<string | null>(null);
  const [friendsLobbyPlayers, setFriendsLobbyPlayers] = useState<any[]>([]);
  const [isSearchingFriendsInNetwork, setIsSearchingFriendsInNetwork] = useState(false);
  const [activeFriendLobbies, setActiveFriendLobbies] = useState<any[]>([]);
  const [incomingFriendInvitation, setIncomingFriendInvitation] = useState<{
    roomCode: string;
    hostName: string;
    hostAvatar: string;
    hostCountryFlag: string;
    hostFriendCode: string;
    hostRating: number;
  } | null>(null);

  // Reacciones de Emojis Flotantes en Vivo
  const [floatingEmojiBursts, setFloatingEmojiBursts] = useState<Array<{ id: string; emoji: string; senderName: string }>>([]);

  const triggerEmojiBurst = (emoji: string, senderName: string) => {
    const burstId = 'burst_' + Date.now() + '_' + Math.random();
    setFloatingEmojiBursts(prev => [...prev, { id: burstId, emoji, senderName }]);
    setTimeout(() => {
      setFloatingEmojiBursts(prev => prev.filter(b => b.id !== burstId));
    }, 2800);
  };

  // Escuchar salas activas de amigos en la red
  useEffect(() => {
    const unsubLobbies = onlineService.onActiveFriendLobbiesUpdate((lobbies) => {
      setActiveFriendLobbies(lobbies || []);
    });
    return () => unsubLobbies();
  }, []);

  // Escuchar invitaciones en vivo de amigos en la red
  useEffect(() => {
    const unsub = onlineService.onFriendRoomInvitation((inv) => {
      const myCode = `BIBLOS-${(userProfileState?.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfileState?.rating || 1000) % 9000)}`;
      if (inv.hostFriendCode === myCode || inv.hostName === userProfileState?.name) return;

      setIncomingFriendInvitation(inv);
      if (isSoundOn) {
        playGameSound("correct");
      }
      triggerHaptic("success");
    });
    return () => unsub();
  }, [userProfileState?.name, userProfileState?.rating, isSoundOn]);

  // Economía Bíblica: Talentos (Créditos, Apuestas, Recarga Diaria)
  const [userTalents, setUserTalents] = useState<number>(() => getTalentsBalance());
  const [showTalentsModal, setShowTalentsModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [insufficientTalentsModal, setInsufficientTalentsModal] = useState<{ show: boolean; required: number; modeName: string } | null>(null);
  const [talentRefillInfo, setTalentRefillInfo] = useState(() => getTimeUntilNextRefill());
  const [sessionTalentsEarned, setSessionTalentsEarned] = useState<number | undefined>(undefined);
  const [rewardedAdCooldown, setRewardedAdCooldown] = useState(() => getTimeUntilNextRewardedAd());
  const [watchingRewardedAd, setWatchingRewardedAd] = useState(false);

  // Comprobar recarga diaria y actualizar cuenta regresiva cada segundo
  useEffect(() => {
    // 1. Aplicar recarga diaria al cargar si han pasado 24h
    const refillResult = checkAndApplyDailyRefill();
    if (refillResult.applied) {
      setUserTalents(refillResult.newBalance);
      setFriendInviteNotification(`🕊️ ¡Recarga Diaria Aplicada! Has recibido +${refillResult.added} Talentos Bíblicos.`);
    }

    // 2. Comprobar recompensas por hitos de nivel alcanzados
    const levelClaimResult = checkAndClaimLevelRewards(userProfileState?.rating || 1000);
    if (levelClaimResult.totalReward > 0) {
      const addedTalentsResult = addTalents(
        levelClaimResult.totalReward,
        `Recompensa por subir a ${levelClaimResult.rewardedLevels.map(l => l.title).join(', ')}`,
        'LEVEL_UP_REWARD'
      );
      setUserTalents(addedTalentsResult.newBalance);
      setUserProfileState(getUserProfile());
      setFriendInviteNotification(`🎉 ¡Felicidades! Has reclamado +${levelClaimResult.totalReward} 🪙 Talentos por tu rango bíblico.`);
    }

    // 3. Intervalo de 1 segundo para el reloj de recarga
    const interval = setInterval(() => {
      const info = getTimeUntilNextRefill();
      setTalentRefillInfo(info);
      if (info.canClaim) {
        const checkAgain = checkAndApplyDailyRefill();
        if (checkAgain.applied) {
          setUserTalents(checkAgain.newBalance);
        }
      }
      setRewardedAdCooldown(getTimeUntilNextRewardedAd());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Detección automática de invitación por enlace de amigo desde redes sociales al entrar
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviterCode = params.get('inviteFriendCode');
      const inviterName = params.get('friendName');
      const inviterAvatar = params.get('friendAvatar') || '/avatars/david.jpg';
      const inviterCountry = params.get('friendCountry') || 'DO';
      const inviterFlag = params.get('friendFlag') || '🇩🇴';

      if (inviterCode && inviterName) {
        addFriend(inviterName, inviterCode, inviterAvatar, inviterCountry, inviterFlag, 'link');
        setFriendsList(getSavedFriends());
        
        // Recompensa por referido (+2 Talentos para el invitado)
        const refReward = claimReferralBonus(false, inviterName);
        setUserTalents(refReward.newBalance);

        setFriendInviteNotification(`🎉 ¡Te has conectado con ${inviterName}! Ahora son amigos y recibes +${refReward.added} Talentos.`);
        setWelcomeInviteData({
          name: inviterName,
          code: inviterCode,
          avatar: inviterAvatar,
          country: inviterCountry,
          countryFlag: inviterFlag
        });
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });

        // Limpiar parámetros de la URL sin recargar la página
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        setTimeout(() => {
          setFriendInviteNotification(null);
        }, 8000);
      }
    } catch (e) {
      console.error('Error procesando invitación de amigo:', e);
    }
  }, []);

  // 🛡️ Escucha de eventos de abandono, desconexión involuntaria y sanciones
  useEffect(() => {
    // 1. Si tu oponente se desconecta involuntariamente -> Mostrar ventana de gracia (45s)
    const unsubGrace = onlineService.onOpponentGracePeriod((data) => {
      setFriendInviteNotification(`⚠️ ${data.message}`);
      playSound("select");
    });

    // 2. Si el oponente se reconecta a tiempo
    const unsubReconnected = onlineService.onPlayerReconnected((data) => {
      setFriendInviteNotification(`🕊️ ¡${data.playerName} se ha reconectado! La partida continúa.`);
      playSound("correct");
      triggerHaptic("success");
      setTimeout(() => setFriendInviteNotification(null), 5000);
    });

    // 3. Si el oponente abandona definitivamente (voluntario o por timeout) -> Victoria para el jugador
    const unsubAbandoned = onlineService.onOpponentAbandoned((data) => {
      // Recompensar al jugador que se quedó
      addTalents(2, 'Victoria por abandono de oponente', 'MATCH_1V1_WIN');
      updateUserRating(35); // Ganancia de Rating por victoria
      setUserTalents(getTalentsBalance());
      setUserProfileState(getUserProfile());
      
      confetti({ particleCount: 100, spread: 90 });
      playSound("win");
      triggerHaptic("success");
      setFriendInviteNotification(`🏆 ${data.message} Has ganado +2 Talentos 🪙 y +35 pts de Rating.`);
      
      setTimeout(() => {
        onlineService.leaveRoom();
        setOnlineRoom(null);
        setScreen('WELCOME');
      }, 5000);
    });

    // 4. Si el propio jugador fue sancionado por abandono voluntario
    const unsubSanction = onlineService.onSanctionApplied((data) => {
      const sanction = applyAbandonSanction(data.isVoluntary);
      setUserProfileState(getUserProfile());
      playSound("wrong");
      triggerHaptic("warning");
      setFriendInviteNotification(`⚠️ Penalización por abandono: Has perdido -${sanction.ratingLost} pts de Rating y tienes bloqueo temporal de ${sanction.banMinutes} min para Matchmaking.`);
    });

    return () => {
      unsubGrace();
      unsubReconnected();
      unsubAbandoned();
      unsubSanction();
    };
  }, []);

  // Eventos Semanales & Feeder
  const [weeklyEvent, setWeeklyEvent] = useState<WeeklyEvent>(() => getWeeklyEventConfig());
  const [eventCountdownStr, setEventCountdownStr] = useState('');
  const [showEventFeederModal, setShowEventFeederModal] = useState(false);
  const [eventFeederUrl, setEventFeederUrl] = useState('');
  const [isEventLoading, setIsEventLoading] = useState(false);

  // Actualizador en vivo del contador regresivo del Evento Semanal
  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(weeklyEvent.nextEventDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setEventCountdownStr(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [weeklyEvent.nextEventDate]);

  // Matchmaking 1 vs 1 (Búsqueda Real de 20s + Notificación si no hay jugadores)
  const start1v1Matchmaking = () => {
    playSound("select");

    // Verificar si el jugador tiene un bloqueo temporal por abandono
    const banStatus = checkMatchmakingBanStatus();
    if (banStatus.isBanned) {
      setFriendInviteNotification(`⏳ Bloqueo temporal por abandono previo: Espera ${banStatus.minutesRemaining}m ${banStatus.secondsRemaining}s para volver a buscar partidas.`);
      playSound("wrong");
      triggerHaptic("warning");
      return;
    }

    // Validar saldo de Talentos (Cuesta 1 Talento)
    if (!canAffordTalents(FEES.MATCH_1V1)) {
      setInsufficientTalentsModal({
        show: true,
        required: FEES.MATCH_1V1,
        modeName: 'Uno contra Uno (1 vs 1)'
      });
      return;
    }

    spendTalents(FEES.MATCH_1V1, 'Entrada a Duelo 1 vs 1', 'MATCH_1V1_FEE');
    setUserTalents(getTalentsBalance());

    setIsSearchingDuel(true);
    setDuelSearchTime(0);
    setDuelMatchedPlayer(null);
    setDuelNoOpponent(false);
    setOnlineSubTab('DUEL_1V1');

    const pName = userProfileState?.name || 'Jugador Bíblico';
    const pAvatar = userProfileState?.avatar || '/avatars/david.jpg';
    const pRating = userProfileState?.rating || 1000;

    let isMatched = false;

    // 1. Escuchar emparejamiento con otro jugador humano conectado
    onlineService.startMatchmaking(
      { name: pName, avatar: pAvatar, rating: pRating },
      (matchData) => {
        isMatched = true;
        setDuelMatchedPlayer(matchData.opponent);
        playSound("correct");
        triggerHaptic("success");

        setTimeout(() => {
          setIsSearchingDuel(false);
          setOnlineRoom(matchData.room);
          setShowOnlineModal(false);
          setShowWelcome(false);
          setScreen('TABLERO');
        }, 1800);
      }
    );

    // 2. Si transcurren los 20 segundos sin emparejamiento, detener y notificar
    setTimeout(() => {
      if (!isMatched) {
        onlineService.cancelMatchmaking();
        setIsSearchingDuel(false);
        setDuelNoOpponent(true);
        playSound("select");
      }
    }, 20000);
  };

  const cancel1v1Matchmaking = () => {
    onlineService.cancelMatchmaking();
    setIsSearchingDuel(false);
    setDuelSearchTime(0);
    setDuelMatchedPlayer(null);
    setDuelNoOpponent(false);
    // Reembolsar talento por cancelación
    addTalents(FEES.MATCH_1V1, 'Reembolso por Duelo 1 vs 1 cancelado', 'MATCH_1V1_FEE');
    setUserTalents(getTalentsBalance());
    playSound("select");
  };

  // Matchmaking Grupal: "Todos Vs Todos" (3 a 8 jugadores, 1 minuto / 60 segundos)
  const startTodosVsTodosMatchmaking = () => {
    playSound("select");

    // Validar saldo de Talentos (Cuesta 2 Talentos)
    if (!canAffordTalents(FEES.GROUP_MATCH)) {
      setInsufficientTalentsModal({
        show: true,
        required: FEES.GROUP_MATCH,
        modeName: 'Todos Vs Todos (3 a 8 Jugadores)'
      });
      return;
    }

    spendTalents(FEES.GROUP_MATCH, 'Entrada a Todos Vs Todos', 'GROUP_MATCH_FEE');
    setUserTalents(getTalentsBalance());

    setIsSearchingGroup(true);
    setGroupTimeRemaining(60);
    setGroupMatchStarting(false);
    setGroupLobbyPlayers([]);
    setOnlineSubTab('TODOS_VS_TODOS');

    const pName = userProfileState?.name || 'Jugador Bíblico';
    const pAvatar = userProfileState?.avatar || '/avatars/david.jpg';
    const pCountry = userProfileState?.country || 'DO';
    const pCountryFlag = userProfileState?.countryFlag || '🇩🇴';
    const pRating = userProfileState?.rating || 1000;

    onlineService.startGroupMatchmaking(
      { name: pName, avatar: pAvatar, country: pCountry, countryFlag: pCountryFlag, rating: pRating },
      (data) => {
        setGroupLobbyCode(data.code);
        setGroupTimeRemaining(data.timeRemaining);
        setGroupLobbyPlayers(data.players || []);
      },
      (matchData) => {
        setGroupMatchStarting(true);
        playSound("correct");
        triggerHaptic("success");

        setTimeout(() => {
          setIsSearchingGroup(false);
          setGroupMatchStarting(false);
          setOnlineRoom(matchData.room);
          setShowOnlineModal(false);
          setShowWelcome(false);
          setScreen('TABLERO');
        }, 1800);
      }
    );
  };

  const cancelTodosVsTodosMatchmaking = () => {
    onlineService.cancelGroupMatchmaking();
    setIsSearchingGroup(false);
    setGroupTimeRemaining(60);
    setGroupLobbyPlayers([]);
    setGroupMatchStarting(false);
    // Reembolsar talentos por cancelación
    addTalents(FEES.GROUP_MATCH, 'Reembolso por Todos Vs Todos cancelado', 'GROUP_MATCH_FEE');
    setUserTalents(getTalentsBalance());
    playSound("select");
  };

  // Iniciar partida contra BiblosBot
  const startBiblosBotMatch = () => {
    playSound("correct");
    triggerHaptic("success");
    setDuelNoOpponent(false);
    setIsSearchingDuel(false);

    const pName = userProfileState?.name || 'Jugador Bíblico';
    const pAvatar = userProfileState?.avatar || '/avatars/david.jpg';

    const availableAvatars = BIBLE_AVATARS.filter(a => a.imagePath !== pAvatar);
    const bot = availableAvatars[Math.floor(Math.random() * availableAvatars.length)] || BIBLE_AVATARS[0];

    const simulatedRoom: OnlineRoom = {
      code: 'DUEL-BOT',
      isPrivate: false,
      status: 'PLAYING',
      players: [
        {
          id: userProfileState?.id || 'player_me',
          name: pName,
          avatar: pAvatar,
          isHost: true,
          position: 0,
          score: 0,
          ready: true
        },
        {
          id: 'biblos_bot',
          name: `${bot.name} (BiblosBot)`,
          avatar: bot.imagePath,
          isHost: false,
          position: 0,
          score: 0,
          ready: true,
          isBot: true
        }
      ],
      currentQuestionIndex: 0
    };

    setOnlineRoom(simulatedRoom);
    setShowOnlineModal(false);
    setShowWelcome(false);
    setScreen('TABLERO');
  };

  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [gameLevel, setGameLevel] = useState<'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | null>(null);
  const [triviaMatchDuration, setTriviaMatchDuration] = useState<'3_MIN' | '5_MIN' | '10_MIN' | '15_MIN' | 'INFINITO'>('5_MIN');
  const [triviaTimeRemaining, setTriviaTimeRemaining] = useState<number>(300); // Segundos restantes de la partida
  const [isTriviaMatchRunning, setIsTriviaMatchRunning] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<
  | 'MIXTO'
  | 'PERIODOS'
  | 'PRINCIPIANTE'
  | 'KIDS'
  | 'VERSICULOS'
  | 'PERSONAJES'
  | 'DIOS'
  | 'SALVACION'
  | 'MANDAMIENTOS'
  | 'HISTORIA'
  | 'GEOGRAFIA'
  | null
>(null);
  const [activeCustomStudyFilter, setActiveCustomStudyFilter] = useState<CustomStudyFilter | null>(null);
  const [showCustomStudyModal, setShowCustomStudyModal] = useState<boolean>(false);
  const [studyTestament, setStudyTestament] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [studyBook, setStudyBook] = useState<string>('ALL');
  const [studyTheme, setStudyTheme] = useState<string>('ALL');
  const [studyGameExperience, setStudyGameExperience] = useState<'TRIVIA' | 'TABLERO'>('TRIVIA');

  const [isProjectionMode, setIsProjectionMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Estados para Modal de Edición Rápida de Perfil (Nombre + Avatar) desde Inicio
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [editName, setEditName] = useState(userProfileState.name);
  const [editAvatar, setEditAvatar] = useState(userProfileState.avatar || '/avatars/david.jpg');

  const handleOpenProfileEdit = () => {
    setEditName(userProfileState.name);
    setEditAvatar(userProfileState.avatar || '/avatars/david.jpg');
    setShowProfileEditModal(true);
    playSound('select');
    triggerHaptic('light');
  };

  const handleSaveProfileEdit = () => {
    const updated: UserProfile = {
      ...userProfileState,
      name: editName.trim() || 'Jugador Bíblico',
      avatar: editAvatar,
    };
    setUserProfileState(updated);
    saveUserProfile(updated);
    setShowProfileEditModal(false);
    playSound('select');
    triggerHaptic('success');
  };

  // Manejo de Inicio de Sesión Real con Supabase (Google / Invitado)
  const handleLoginProvider = async (provider: 'google' | 'facebook' | 'guest') => {
    playSound('select');
    triggerHaptic('medium');
    if (provider === 'google') {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          console.error('Error al iniciar sesión con Google:', error);
          alert('Error al conectar con Google: ' + error.message);
        }
      } catch (err: any) {
        console.error('Error Google OAuth:', err);
      }
    } else if (provider === 'facebook') {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          alert('Error al conectar con Facebook: ' + error.message);
        }
      } catch (err: any) {
        console.error('Error Facebook OAuth:', err);
      }
    } else {
      const updated: UserProfile = {
        ...userProfileState,
        authProvider: 'guest',
        isGuest: true,
      };
      setUserProfileState(updated);
      saveUserProfile(updated);
    }
  };

  const [showTriviaExitConfirm, setShowTriviaExitConfirm] = useState<boolean>(false);
  
  const handleLogout = async () => {
    playSound('select');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    const updated: UserProfile = {
      ...userProfileState,
      authProvider: null,
      isGuest: true,
    };
    setUserProfileState(updated);
    saveUserProfile(updated);
  };


  const handleShareFacebook = () => {
    playSound('select');
    triggerHaptic('success');
    const url = encodeURIComponent(window.location.href);
    const quote = encodeURIComponent("¡Ven a jugar Biblos Games - El Juego de la Biblia! Pon a prueba tu conocimiento bíblico.");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank', 'width=600,height=400');
  };

  // Suscripción al estado de la Sala En Línea en tiempo real
  useEffect(() => {
    const unsubscribe = onlineService.subscribe((room) => {
      setOnlineRoom(room);
      if (room && room.status === 'COUNTDOWN' && screen !== 'TABLERO') {
        setOnlineCountdown(3);
      }
    });
    return () => unsubscribe();
  }, [screen]);

  // Cuenta regresiva 3, 2, 1 sincronizada para entrar al Tablero En Línea
  useEffect(() => {
    if (onlineCountdown === null) return;
    if (onlineCountdown > 0) {
      triggerHaptic('medium');
      const timer = setTimeout(() => setOnlineCountdown(onlineCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (onlineCountdown === 0) {
      triggerHaptic('success');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      const timer = setTimeout(() => {
        setOnlineCountdown(null);
        setShowOnlineModal(false);
        setShowWelcome(false);
        setScreen('TABLERO');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [onlineCountdown]);

  // --- MODO CONTRARRELOJ / SOLITARIO CEREBRAL ---
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(true); // Activar/Desactivar cronómetro
  const [soloTimeLimit, setSoloTimeLimit] = useState<number>(15); // 15 segundos por pregunta
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [soloScore, setSoloScore] = useState<number>(0);
  const [soloStreak, setSoloStreak] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // --- Versión mejorada y segura ---
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('biblos_used_questions');
      // Si hay algo guardado, lo convertimos en un Conjunto (Set), si no, empezamos vacío
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      // Si algo falla al leer, empezamos vacío para que no se rompa la App
      return new Set();
    }
  });

  useEffect(() => {
    // Guardamos la lista de IDs en la memoria del navegador
    localStorage.setItem('biblos_used_questions', JSON.stringify(Array.from(usedQuestionIds)));
  }, [usedQuestionIds]);

  // --- CRONÓMETRO CONTRARRELOJ ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerEnabled && isTimerRunning && timeLeft > 0 && !showAnswer) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            triggerHaptic('error');
            playSound('wrong');
            setShowAnswer(true);
            setIsTimerRunning(false);
            setSoloStreak(0);

            // Registrar fallo por tiempo agotado en estadísticas del perfil
            const updatedProfile = recordAnswer(false);
            setUserProfileState(updatedProfile);

            if (currentQuestion) {
              setSessionIncorrectQuestions(prev => {
                if (prev.some(q => q.id === currentQuestion.id)) return prev;
                return [...prev, currentQuestion];
              });
              setGameStats(prevStats => ({
                ...prevStats,
                [currentQuestion.period]: {
                  total: prevStats[currentQuestion.period].total + 1,
                  correct: prevStats[currentQuestion.period].correct
                }
              }));
            }

            return 0;
          }
          if (prev <= 5) {
            triggerHaptic('light'); // Pulso hápctico de presión en los últimos 5 segundos
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerEnabled, isTimerRunning, timeLeft, showAnswer, currentQuestion]);

  const showWelcome = screen === 'WELCOME';
  const setShowWelcome = (val: boolean) => {
    if (val) setScreen('WELCOME');
    else if (screen === 'WELCOME') setScreen('TRIVIA');
  };
  const [boardSubMode, setBoardSubMode] = useState<'SOLO' | 'GRUPO_LOCAL' | 'VS_BOTS'>('SOLO');
  const [showSoloSubmodeModal, setShowSoloSubmodeModal] = useState(false);
  const [showDailyChallengeModal, setShowDailyChallengeModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);
  const [adminTapGestureCount, setAdminTapGestureCount] = useState<number>(0);
  const [showTriviaHeaderMenu, setShowTriviaHeaderMenu] = useState<boolean>(false);
  const [showLegalPoliciesModal, setShowLegalPoliciesModal] = useState<boolean>(false);
  const [legalPolicyInitialDoc, setLegalPolicyInitialDoc] = useState<"PRIVACY" | "TERMS" | "PURCHASES" | "COMMUNITY" | "DELETE_ACCOUNT" | "MINORS_POLICY">("PRIVACY");
  const [showGuidedSimulator, setShowGuidedSimulator] = useState<boolean>(false);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const [notificationSettingsState, setNotificationSettingsState] = useState<NotificationSettings>(() => getNotificationSettings());

  // Registrar sesión y sincronizar perfil y ranking con Supabase
  useEffect(() => {
    recordAnalyticsSessionHeartbeat();
    fetchGlobalLeaderboardFromCloud();

    // Escuchar inicio de sesión de Google con Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = session.user;
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Jugador Google';
        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        // Consultar si ya existe un perfil en la nube para este UUID de Google
        try {
          const { data: cloudProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

          let merged: UserProfile;
          if (cloudProfile) {
            merged = {
              ...getUserProfile(),
              id: user.id,
              name: cloudProfile.user_name || googleName,
              avatar: cloudProfile.avatar || googleAvatar || '/avatars/david.jpg',
              country: cloudProfile.country_code || 'DO',
              countryFlag: cloudProfile.country_flag || '🇩🇴',
              rating: cloudProfile.elo_rating || 1000,
              talents: cloudProfile.coins || 12,
              isPremium: Boolean(cloudProfile.is_vip),
              authProvider: 'google',
              email: user.email,
              isGuest: false,
            };
          } else {
            const current = getUserProfile();
            merged = {
              ...current,
              id: user.id,
              name: current.name === 'Jugador Bíblico' ? googleName : current.name,
              avatar: current.avatar || googleAvatar || '/avatars/david.jpg',
              authProvider: 'google',
              email: user.email,
              isGuest: false,
            };
            await supabase.from('profiles').upsert({
              id: user.id,
              user_name: merged.name,
              avatar: merged.avatar,
              country_code: merged.country || 'DO',
              country_flag: merged.countryFlag || '🇩🇴',
              elo_rating: merged.rating || 1000,
              coins: merged.talents || 12,
              is_vip: Boolean(merged.isPremium),
              updated_at: new Date().toISOString(),
            });
          }

          setUserProfileState(merged);
          saveUserProfile(merged);
        } catch (err) {
          console.warn('[SUPABASE AUTH] Error cargando perfil:', err);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);


  // Actualizar ranking desde Supabase al abrir el modal de clasificación
  useEffect(() => {
    if (showLeaderboardModal) {
      fetchGlobalLeaderboardFromCloud();
    }
  }, [showLeaderboardModal]);


  // Revisar y disparar notificaciones inteligentes periódicamente si están activas
  useEffect(() => {
    checkAndTriggerSmartNotifications();
    const notifInterval = setInterval(() => {
      checkAndTriggerSmartNotifications();
    }, 60000 * 15); // Cada 15 minutos
    return () => clearInterval(notifInterval);
  }, [notificationSettingsState]);
  const [gameStats, setGameStats] = useState<Record<string, { total: number; correct: number }>>({});
  const [sessionIncorrectQuestions, setSessionIncorrectQuestions] = useState<Question[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [globalAverage, setGlobalAverage] = useState<number | null>(null);

  // Temporizador Global de la Partida de Trivia (3m, 5m, 10m, 15m)
  useEffect(() => {
    let matchInterval: NodeJS.Timeout | null = null;
    if (screen === 'TRIVIA' && isTriviaMatchRunning && triviaMatchDuration !== 'INFINITO' && !showFinalSummary) {
      matchInterval = setInterval(() => {
        setTriviaTimeRemaining((prev) => {
          if (prev <= 1) {
            if (matchInterval) clearInterval(matchInterval);
            setIsTriviaMatchRunning(false);
            setEndTime(Date.now());
            setShowFinalSummary(true);

            // Verificar si el jugador realmente participó o no hizo nada
            const currentStats = getTotalStats();
            if (currentStats.total > 0 && currentStats.correct > 0) {
              playSound("win");
              confetti({ particleCount: 80, spread: 70 });
            } else {
              playSound("wrong");
              triggerHaptic("warning");
            }
            return 0;
          }
          if (prev <= 10) {
            triggerHaptic('light');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (matchInterval) clearInterval(matchInterval);
    };
  }, [screen, isTriviaMatchRunning, triviaMatchDuration, showFinalSummary]);
useEffect(() => {
  const initialStats: Record<string, { total: number; correct: number }> = {};

  Object.values(Period).forEach(period => {
    initialStats[period] = { total: 0, correct: 0 };
  });

  setGameStats(initialStats);
}, []);
const getTotalStats = () => {
  let total = 0;
  let correct = 0;

  Object.values(gameStats).forEach((stat: any) => {
    total += stat.total;
    correct += stat.correct;
  });

  return { total, correct };
};

const getAccuracy = () => {
  const { total, correct } = getTotalStats();
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};

const getDuration = () => {
  if (!startTime || !endTime) return 0;
  return Math.floor((endTime - startTime) / 1000);
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getColor = (accuracy: number) => {
  if (accuracy >= 80) return "text-green-600";
  if (accuracy >= 60) return "text-yellow-500";
  return "text-red-600";
};
  const getRandomQuestion = (period: Period | 'SURPRISE', levelOverride?: typeof gameLevel) => {
    const activeLevel = levelOverride || gameLevel;
    
    let available = ALL_QUESTIONS.filter(q => !usedQuestionIds.has(q.id));

    // CASO ESPECIAL: ESTUDIO BÍBLICO PERSONALIZADO (Filtro por libro/testamento/tema)
    if (activeCustomStudyFilter) {
      const customPool = filterQuestionsForCustomStudy(available, activeCustomStudyFilter);
      if (customPool.length > 0) {
        available = customPool;
      }
    } else {
      // 1. FILTRADO POR MODO DE JUEGO (Si es MIXTO o PERIODOS, pasan todas las categorías)
      if (gameMode && gameMode !== 'PERIODOS' && gameMode !== 'MIXTO') {
        if (gameMode === 'PRINCIPIANTE' || gameMode === 'KIDS') {
          available = available.filter(q => q.difficulty === Difficulty.BASIC);
        } else {
          available = available.filter(q => Array.isArray(q.mode) ? q.mode.includes(gameMode) : q.mode === gameMode);
        }
      }
    }

    // 2. FILTRADO POR NIVEL (DIFICULTAD) - MODIFICADO PARA "MIXTO"
    if (activeLevel === 'PRINCIPIANTE') {
      available = available.filter(q => q.difficulty === Difficulty.BASIC);
    } else if (activeLevel === 'INTERMEDIO') {
      available = available.filter(q => q.difficulty === Difficulty.BASIC || q.difficulty === Difficulty.INTERMEDIATE);
    } else if (activeLevel === 'AVANZADO') {
      available = available.filter(q => q.difficulty === Difficulty.INTERMEDIATE || q.difficulty === Difficulty.ADVANCED);
    } 
    // Si activeLevel es 'MIXTO', no aplicamos filtro aquí, pasan todas.

    // 3. FILTRADO POR PERIODO BÍBLICO
    if (period !== 'SURPRISE') {
      available = available.filter(q => q.period === period);
    }

    // --- REINICIO DE PREGUNTAS SI SE ACABAN ---
    if (available.length === 0) {
      let resetSet = ALL_QUESTIONS.filter(q => {
        const matchesPeriod = period === 'SURPRISE' ? true : q.period === period;
        const matchesMode = (gameMode === 'PERIODOS' || !gameMode) ? true : 
                            (gameMode === 'PRINCIPIANTE' || gameMode === 'KIDS' ? q.difficulty === Difficulty.BASIC : q.mode.includes(gameMode));
        return matchesPeriod && matchesMode;
      });
      
      // FILTRADO DE REINICIO - MODIFICADO PARA "MIXTO"
      if (activeLevel === 'PRINCIPIANTE') {
        resetSet = resetSet.filter(q => q.difficulty === Difficulty.BASIC);
      } else if (activeLevel === 'INTERMEDIO') {
        resetSet = resetSet.filter(q => q.difficulty === Difficulty.BASIC || q.difficulty === Difficulty.INTERMEDIATE);
      } else if (activeLevel === 'AVANZADO') {
        resetSet = resetSet.filter(q => q.difficulty === Difficulty.INTERMEDIATE || q.difficulty === Difficulty.ADVANCED);
      }
      // Si es 'MIXTO', el resetSet se queda con todas las dificultades.

      const newUsed = new Set(usedQuestionIds);
      resetSet.forEach(q => newUsed.delete(q.id));
      setUsedQuestionIds(newUsed);
      available = resetSet;
    }
    // ... (El resto de la selección aleatoria con mezcla se queda igual)
    if (available.length === 0) return;

    // 4. SELECCIÓN ALEATORIA CON MEZCLA
    if (available.length === 0) return;

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffleQuestionOptions(shuffled[0]);
    
    setCurrentQuestion(selected);
    setTimeLeft(soloTimeLimit || 20);
    setIsTimerRunning(true);
    setIsTriviaMatchRunning(true);
    if (!startTime) {
      setStartTime(Date.now());
    }

    setUsedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.size > 1000) next.clear(); 
      next.add(selected.id);
      return next;
    });

    setShowAnswer(false);
  }; // <--- Aquí termina getRandomQuestion

  const handleSelectPeriod = (period: Period) => {
    setCurrentPeriod(period);
    getRandomQuestion(period);
  };

  const handleSurprise = () => {
    setCurrentPeriod(null);
    getRandomQuestion('SURPRISE');
  };

  const resetGame = () => {
    // Conservamos usedQuestionIds para no repetir preguntas entre partidas
    setCurrentPeriod(null);
    setCurrentQuestion(null);
    setGameLevel(null);
    setGameMode(null);
    setIsTriviaMatchRunning(false);
    setShowTriviaExitConfirm(false);
    setShowAnswer(false);
    setSessionIncorrectQuestions([]);
  };

  const toggleProjection = () => {
    setIsProjectionMode(!isProjectionMode);
  };

const handleAnswerClick = (index: number) => {
  if (showAnswer || !currentQuestion) return;

  setIsTimerRunning(false);
  if (!startTime) setStartTime(Date.now());

  const isCorrect = index === currentQuestion.correctAnswer;

  if (isCorrect) {
    setSoloScore(prev => prev + 100 + (timeLeft * 10)); // Bonus por tiempo restante
    setSoloStreak(prev => prev + 1);
  } else {
    setSoloStreak(0);
  }

  // Registrar precisión en el Perfil de Usuario Local
  const updatedProfile = recordAnswer(isCorrect);
  setUserProfileState(updatedProfile);

  setGameStats(prev => ({
    ...prev,
    [currentQuestion.period]: {
      total: prev[currentQuestion.period].total + 1,
      correct: prev[currentQuestion.period].correct + (isCorrect ? 1 : 0)
    }
  }));

  if (isCorrect) {
    triggerHaptic('success');
    playSound("correct");
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  } else {
    triggerHaptic('error');
    playSound("wrong");
    setSessionIncorrectQuestions(prev => {
      if (prev.some(q => q.id === currentQuestion.id)) return prev;
      return [...prev, currentQuestion];
    });
  }

  setShowAnswer(true);
  onQuestionAnswered(triviaMatchDuration);
};
  // Registrar automáticamente la entrada en el Ranking cuando termina la partida (Solo en partidas competitivas estándar, no en estudio personalizado)
  useEffect(() => {
    if (showFinalSummary) {
      showInterstitialAd();
      const { total, correct } = getTotalStats();
      if (total > 0 && !activeCustomStudyFilter) {
        const acc = getAccuracy();
        const dur = getDuration();
        const soloResult = calculateSoloScore({
          correct,
          errors: total - correct,
          difficulty: gameLevel || 'MIXTO',
          timeSeconds: dur,
          completed: true,
          currentRating: userProfileState.rating || 1000
        });

        saveLeaderboardEntry({
          playerName: userProfileState.name,
          playerAvatar: userProfileState.avatar,
          playerCountry: userProfileState.country || 'DO',
          playerCountryFlag: userProfileState.countryFlag || '🇩🇴',
          mode: 'TRIVIA',
          score: soloResult.totalSoloScore,
          rating: soloResult.newRating,
          timeCategory: triviaMatchDuration,
          accuracy: acc,
          totalQuestions: total,
          correctQuestions: correct,
          timeSeconds: dur,
          difficulty: gameLevel || 'MIXTO'
        });
        updateUserRating(soloResult.ratingDelta);
        recordGameCompleted();
      }
    }
  }, [showFinalSummary]);

  return (
    <>
      {/* 🏆 MODAL / PANTALLA DE RESUMEN FINAL DE TRIVIA */}
      {showFinalSummary && (() => {
        const { total, correct } = getTotalStats();
        const accuracy = getAccuracy();
        const duration = getDuration();
        const calculatedPoints = calculateFinalScore(correct, total, accuracy, duration);

        const getMedal = (acc: number, tot: number) => {
          if (tot === 0) return { icon: "⏳", label: "Tiempo Agotado sin Respuestas", color: "text-stone-400" };
          if (tot >= 10 && acc >= 90) return { icon: "🏆", label: "Maestro de la Palabra", color: "text-amber-400" };
          if (tot >= 5 && acc >= 75) return { icon: "🥈", label: "Erudito Bíblico", color: "text-stone-300" };
          if (tot >= 3 && acc >= 60) return { icon: "🥉", label: "Discípulo en Camino", color: "text-orange-500" };
          if (tot > 0) return { icon: "📖", label: "Estudiante de la Biblia", color: "text-amber-200" };
          return { icon: "🕊️", label: "Sembrador de Conocimiento", color: "text-stone-400" };
        };

        const medal = getMedal(accuracy, total);

        return (
          <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              id="final-summary-card"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="max-w-md w-full bg-[#2A2621] rounded-[2.5rem] border-2 border-amber-900/40 overflow-hidden shadow-2xl p-2 my-auto"
            >
              {/* ENCABEZADO CON LOGO, AVATAR DEL JUGADOR Y MEDALLA */}
              <div className="bg-[#1B1A17] p-6 text-center border-b border-amber-900/20 relative">
                <img 
                  src="/logo-biblos.png"
                  alt="Biblos Games" 
                  className="w-44 mx-auto mb-4 object-contain drop-shadow-xl" 
                />

                {/* JUGADOR Y AVATAR */}
                <div className="flex items-center justify-center gap-3 bg-[#2A2621]/80 p-2.5 rounded-2xl border border-amber-800/40 w-fit mx-auto mb-4 shadow">
                  {userProfileState.avatar.startsWith('/') ? (
                    <img src={userProfileState.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md" />
                  ) : (
                    <span className="text-3xl">{userProfileState.avatar}</span>
                  )}
                  <div className="text-left">
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Jugador</p>
                    <p className="text-base font-black text-amber-200 leading-tight">{userProfileState.name}</p>
                  </div>
                </div>

                <div className="text-5xl mb-1">{medal.icon}</div>
                <h1 className={`text-xl font-serif font-black tracking-tight uppercase ${medal.color}`}>
                  {medal.label}
                </h1>

                {/* BANNER HAS GANADO / HAS PERDIDO EN TRIVIA */}
                {total > 0 && (
                  <div className="pt-2 pb-1">
                    {accuracy >= 60 ? (
                      <div className="inline-block px-5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-950 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.7)]">
                        <span className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-widest text-emerald-300 drop-shadow-[0_0_15px_rgba(52,211,153,1)]">
                          ¡HAS GANADO!
                        </span>
                      </div>
                    ) : (
                      <div className="inline-block px-5 py-1.5 rounded-xl bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.7)]">
                        <span className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-widest text-rose-300 drop-shadow-[0_0_15px_rgba(251,113,133,1)]">
                          ¡HAS PERDIDO!
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                {/* PUNTUACIÓN TOTAL Y ESTADÍSTICAS */}
                <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-800/40 text-center shadow-inner relative overflow-hidden">
                  {activeCustomStudyFilter ? (
                    <div className="mb-1 inline-flex items-center gap-1 bg-purple-950/80 border border-purple-500/50 text-purple-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      <span>📖 Modo Estudio (Sin afectación al Ranking)</span>
                    </div>
                  ) : (
                    <div className="mb-1 inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      <span>🏆 Partida Competitiva · Suma al Ranking</span>
                    </div>
                  )}
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-1">Puntuación de la Sesión</p>
                  <p className="text-3xl font-black text-amber-200 mt-0.5">⭐ {calculatedPoints} Pts</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#1B1A17]/50 p-3 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-stone-500 uppercase mb-1">Aciertos</p>
                    <p className="text-lg font-black text-emerald-400">{correct}/{total}</p>
                  </div>
                  <div className="bg-[#1B1A17]/50 p-3 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-stone-500 uppercase mb-1">Precisión</p>
                    <p className="text-lg font-black text-amber-400">{accuracy}%</p>
                  </div>
                  <div className="bg-[#1B1A17]/50 p-3 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-stone-500 uppercase mb-1">Tiempo</p>
                    <p className="text-lg font-black text-blue-400">{formatTime(duration)}</p>
                  </div>
                </div>

                {/* 📖 REPASO DE ESTUDIO: PREGUNTAS PARA REFORZAR (ERRORES Y REFERENCIAS) */}
                {sessionIncorrectQuestions.length > 0 ? (
                  <div className="space-y-2.5 bg-stone-900/90 p-3.5 rounded-2xl border border-amber-900/40">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                        <BookOpen size={15} className="text-amber-400" />
                        <span>📖 Repaso de Estudio ({sessionIncorrectQuestions.length} por repasar)</span>
                      </div>
                      <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-full font-bold">
                        Aprende de la Palabra
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {sessionIncorrectQuestions.map((q, idx) => (
                        <div key={q.id || idx} className="bg-[#1B1A17] p-2.5 rounded-xl border border-stone-800 text-left space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-stone-200 leading-snug">
                              <span className="text-amber-400 mr-1">#{idx + 1}</span>
                              {q.question}
                            </p>
                          </div>
                          
                          <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-lg flex items-center justify-between gap-2">
                            <div className="text-[11px] text-emerald-300 leading-tight">
                              <span className="text-[9px] uppercase font-bold text-emerald-400 block">Respuesta Correcta:</span>
                              <span className="font-semibold">{q.options[q.correctAnswer]}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] uppercase font-bold text-amber-400 block">Cita Bíblica:</span>
                              <span className="text-[11px] font-serif font-bold text-amber-200">{q.reference}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-2xl text-center">
                    <p className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1.5">
                      <span>✨ ¡Excelente Memoria y Estudio!</span>
                    </p>
                    <p className="text-[10px] text-emerald-200/80 mt-0.5">
                      No tuviste errores en esta sesión de preguntas.
                    </p>
                  </div>
                )}

                {/* BOTONES SOCIALES NATIVOS Y DESCARGA */}
                <div className="space-y-2">
                  <p className="text-center text-[10px] text-stone-500 font-bold uppercase tracking-widest">Guarda y Comparte tus Resultados</p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => downloadGameResultsImage()}
                      className="py-3.5 bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-700/40 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all uppercase text-[11px] tracking-wider cursor-pointer"
                    >
                      📥 Descargar Imagen
                    </button>

                    <button
                      onClick={() => shareGameResults(userProfileState, accuracy, correct, total)}
                      className="py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 rounded-xl font-black flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all uppercase text-[11px] tracking-wider cursor-pointer"
                    >
                      <Share2 size={16} /> Compartir
                    </button>
                  </div>
                </div>

                {/* BOTÓN REINICIAR */}
                <button
                  onClick={() => { setShowFinalSummary(false); resetGame(); setScreen('TRIVIA'); }}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-[#1B1A17] font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <RotateCcw size={18} /> Nueva Partida
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
      {/* Toast Notificación de Vinculación de Amigo con Logo de Biblos */}
      {friendInviteNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] bg-gradient-to-r from-emerald-700 via-teal-800 to-stone-900 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-3 animate-bounce">
          <img
            src="/logo-biblos.png"
            alt="Biblos Games"
            className="w-10 sm:w-12 h-auto drop-shadow-md shrink-0 pointer-events-none"
          />
          <div className="flex-1 text-left">
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest block">
              Biblos Games
            </span>
            <p className="text-xs sm:text-sm font-bold leading-tight text-white">
              {friendInviteNotification}
            </p>
          </div>
          <button 
            onClick={() => setFriendInviteNotification(null)}
            className="p-1 hover:bg-black/30 rounded-full transition text-stone-300 hover:text-white cursor-pointer"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* 🔔 MODAL FLOTANTE INTERACTIVO DE INVITACIÓN DE AMIGO EN LA RED */}
      {incomingFriendInvitation && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] p-3.5 bg-gradient-to-r from-emerald-950 via-stone-900 to-amber-950 border-2 border-emerald-400 rounded-3xl shadow-2xl animate-fade-in flex flex-col gap-2.5 text-stone-100 ring-4 ring-emerald-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={incomingFriendInvitation.hostAvatar}
                  alt={incomingFriendInvitation.hostName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow ring-2 ring-emerald-400/40"
                />
                <span className="absolute -bottom-1 -right-1 text-xs">
                  {incomingFriendInvitation.hostCountryFlag || '🇩🇴'}
                </span>
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                  🔔 ¡Invitación de Amigo!
                </span>
                <p className="text-xs sm:text-sm font-black text-white leading-tight">
                  <strong className="text-amber-300">{incomingFriendInvitation.hostName}</strong> inició una sala para amigos
                </p>
                <span className="text-[10px] text-stone-400 font-mono">
                  Rating: {incomingFriendInvitation.hostRating || 1000} · Sala: {incomingFriendInvitation.roomCode}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIncomingFriendInvitation(null)}
              className="text-stone-400 hover:text-white p-1 cursor-pointer"
            >
              <XCircle size={20} />
            </button>
          </div>

          <div className="flex gap-2 pt-0.5">
            <button
              onClick={() => {
                const invite = incomingFriendInvitation;
                setIncomingFriendInvitation(null);
                playSound("correct");
                triggerHaptic("success");
                setShowOnlineModal(true);
                setOnlineSubTab('FRIENDS');

                const myCode = `BIBLOS-${(userProfileState?.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfileState?.rating || 1000) % 9000)}`;
                const pData = {
                  name: userProfileState?.name || 'Amigo Bíblico',
                  avatar: userProfileState?.avatar || '/avatars/david.jpg',
                  country: userProfileState?.country || 'DO',
                  countryFlag: userProfileState?.countryFlag || '🇩🇴',
                  rating: userProfileState?.rating || 1000,
                  friendCode: myCode
                };

                onlineService.joinFriendsLobby(
                  invite.roomCode,
                  pData,
                  (lobbyData) => {
                    setFriendsLobbyCode(lobbyData.code);
                    setFriendsLobbyPlayers(lobbyData.players || []);
                  },
                  (matchData) => {
                    playSound("correct");
                    triggerHaptic("success");
                    setShowOnlineModal(false);
                    setShowWelcome(false);
                    setOnlineRoom(matchData.room);
                    setScreen('TABLERO');
                  }
                );
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-emerald-950 font-black rounded-xl text-xs uppercase tracking-wider shadow active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              ✓ Unirme a la Sala
            </button>

            <button
              onClick={() => setIncomingFriendInvitation(null)}
              className="py-2.5 px-3.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white font-bold rounded-xl text-xs uppercase transition cursor-pointer border border-stone-700"
            >
              Rechazar
            </button>
          </div>
        </div>
      )}

      {/* 💌 MODAL DE BIENVENIDA POR INVITACIÓN DE AMIGO (LOGO DE BIBLOS Y MENSAJE OFICIAL) */}
      {welcomeInviteData && (
        <div 
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setWelcomeInviteData(null)}
        >
          <div 
            className="bg-gradient-to-b from-[#2B2317] via-[#1E1911] to-[#120F0A] border-2 border-amber-500/70 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative overflow-hidden text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Destello de fondo */}
            <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />

            <button 
              onClick={() => setWelcomeInviteData(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white cursor-pointer z-10"
            >
              <XCircle size={22} />
            </button>

            {/* Logo Oficial de Biblos Games */}
            <img 
              src="/logo-biblos.png" 
              alt="Biblos Games" 
              className="w-48 sm:w-56 mx-auto drop-shadow-2xl pointer-events-none" 
            />

            {/* Título y Mensaje de Invitación */}
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-400/40 inline-block">
                💌 Invitación de Amigo
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight">
                ¡Juguemos una partida bíblica en Biblos Games!
              </h3>
            </div>

            {/* Ficha del Amigo que te invitó */}
            <div className="p-3.5 bg-stone-900/90 rounded-2xl border border-emerald-500/50 flex items-center justify-between shadow-lg relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={welcomeInviteData.avatar}
                    alt={welcomeInviteData.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md ring-2 ring-emerald-400/30"
                  />
                  <span className="absolute -bottom-1 -right-1 text-sm">
                    {welcomeInviteData.countryFlag || '🇩🇴'}
                  </span>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-emerald-300 leading-tight">
                    {welcomeInviteData.name}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-mono">
                    Código: {welcomeInviteData.code}
                  </p>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    ✓ Amigo Vinculado
                  </span>
                </div>
              </div>
              <div className="text-2xl">🕊️</div>
            </div>

            <p className="text-xs text-stone-300 relative z-10 leading-relaxed">
              Ya están vinculados como amigos en <strong className="text-amber-300">Biblos Games</strong>. ¡Compite en el tablero, desafía tus conocimientos de las Escrituras y jueguen juntos en vivo!
            </p>

            {/* Botones de Acción */}
            <div className="space-y-2 pt-1 relative z-10">
              <button
                onClick={() => {
                  playSound("select");
                  setWelcomeInviteData(null);
                  setShowOnlineModal(true);
                  setOnlineSubTab('FRIENDS');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Users size={16} /> Jugar con {welcomeInviteData.name}
              </button>

              <button
                onClick={() => setWelcomeInviteData(null)}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold rounded-xl text-[11px] uppercase tracking-wider transition cursor-pointer"
              >
                Entrar al Juego
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🪙 MODAL PRINCIPAL: BANCO DE TALENTOS BÍBLICOS */}
      {showTalentsModal && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setShowTalentsModal(false)}
        >
          <div
            className="bg-gradient-to-b from-[#241A0E] via-[#1A140B] to-[#0E0B06] border-2 border-amber-500/80 rounded-3xl max-w-md w-full p-5 text-center space-y-4 shadow-2xl relative overflow-hidden text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Destello de fondo */}
            <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />

            <button
              onClick={() => setShowTalentsModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white cursor-pointer z-10"
            >
              <XCircle size={22} />
            </button>

            {/* Cabecera con Moneda de Oro */}
            <div className="space-y-1 relative z-10">
              <GoldCoinIcon className="w-12 h-12 inline-block animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-400/40 inline-block">
                Economía de Mateo 25
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight">
                Banco de Talentos Bíblicos
              </h3>
            </div>

            {/* Saldo Gigante */}
            <div className="p-4 bg-gradient-to-r from-stone-900 via-amber-950/60 to-stone-900 rounded-2xl border-2 border-amber-400/80 shadow-xl relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Tu Saldo Actual
              </span>
              <p className="text-3xl sm:text-4xl font-black text-amber-300 font-mono flex items-center justify-center gap-2">
                <GoldCoinIcon className="w-9 h-9" /> {userTalents} <span className="text-sm font-sans text-amber-400 font-bold">Talentos</span>
              </p>
            </div>

            {/* Caja de Recarga Diaria cada 24 Horas con Tope de 30 */}
            <div className="p-3 bg-stone-900/90 rounded-2xl border border-emerald-500/50 flex items-center justify-between text-left relative z-10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">
                    🕊️ Recarga Diaria (+6 🪙)
                  </span>
                  <span className="text-[8px] bg-stone-800 text-stone-300 font-bold px-1.5 py-0.2 rounded border border-stone-700">
                    Tope diario: 30 🪙
                  </span>
                </div>
                <p className="text-xs font-bold text-white">
                  {talentRefillInfo.isCapped
                    ? '¡Tope de 30 alcanzado! Juega o compite para ganar más.'
                    : talentRefillInfo.canClaim 
                    ? '¡Tu bendición diaria está lista!' 
                    : `Próxima recarga en: ${talentRefillInfo.formatted}`}
                </p>
              </div>
              <button
                disabled={!talentRefillInfo.canClaim || talentRefillInfo.isCapped}
                onClick={() => {
                  const res = checkAndApplyDailyRefill();
                  if (res.applied) {
                    playSound("correct");
                    triggerHaptic("success");
                    setUserTalents(res.newBalance);
                    confetti({ particleCount: 50, spread: 60 });
                  }
                }}
                className={`px-3 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition ${
                  talentRefillInfo.canClaim && !talentRefillInfo.isCapped
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-emerald-950 shadow-lg cursor-pointer animate-pulse'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                }`}
              >
                {talentRefillInfo.isCapped ? 'Tope Lleno' : talentRefillInfo.canClaim ? '¡Reclamar +6!' : 'En Espera'}
              </button>
            </div>

            {/* Cómo Ganar Más Talentos */}
            <div className="space-y-2 relative z-10 text-left">
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">
                ⚡ Formas de Ganar Más Talentos:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    setShowTalentsModal(false);
                    setShowOnlineModal(true);
                    setOnlineSubTab('FRIENDS');
                  }}
                  className="p-2.5 bg-stone-900/80 hover:bg-stone-800 rounded-xl border border-amber-500/40 text-left space-y-0.5 cursor-pointer transition"
                >
                  <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                    <Users size={13} /> Invitar Amigos (+3 <GoldCoinIcon className="w-3 h-3 inline" />)
                  </span>
                  <p className="text-[10px] text-stone-400 leading-tight">
                    Recibe 3 talentos por cada amigo que entre con tu enlace.
                  </p>
                </button>

                <button
                  onClick={async () => {
                    playSound("select");
                    const myCode = `BIBLOS-${(userProfileState.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfileState.rating || 1000) % 9000)}`;
                    const inviteUrl = generateFriendInviteUrl({
                      name: userProfileState.name || 'Jugador Bíblico',
                      code: myCode,
                      avatar: userProfileState.avatar || '/avatars/david.jpg',
                      country: userProfileState.country || 'DO',
                      countryFlag: userProfileState.countryFlag || '🇩🇴'
                    });
                    const bonus = claimSocialShareBonus();
                    if (bonus.success) {
                      setUserTalents(bonus.newBalance);
                      confetti({ particleCount: 50, spread: 60 });
                    }
                    await shareFriendInviteCard(userProfileState.name || 'Jugador Bíblico', inviteUrl);
                  }}
                  className="p-2.5 bg-stone-900/80 hover:bg-stone-800 rounded-xl border border-amber-500/40 text-left space-y-0.5 cursor-pointer transition"
                >
                  <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1">
                    <Share2 size={13} /> Compartir Tarjeta (+2 <GoldCoinIcon className="w-3 h-3 inline" />)
                  </span>
                  <p className="text-[10px] text-stone-400 leading-tight">
                    Publica tu tarjeta en WhatsApp o Facebook 1 vez al día.
                  </p>
                </button>

                <button
                  disabled={watchingRewardedAd || !canWatchRewardedAd()}
                  onClick={async () => {
                    setWatchingRewardedAd(true);
                    playSound("select");
                    try {
                      const watched = await showRewardedAd();
                      if (watched) {
                        markRewardedAdWatched();
                        const result = addTalents(3, 'Anuncio de vídeo bonificado', 'REWARDED_AD');
                        setUserTalents(result.newBalance);
                        confetti({ particleCount: 80, spread: 70 });
                        playSound("correct");
                        triggerHaptic("success");
                      }
                    } catch (e) {
                      console.warn('Rewarded ad error:', e);
                    }
                    setWatchingRewardedAd(false);
                    setRewardedAdCooldown(getTimeUntilNextRewardedAd());
                  }}
                  className={`p-2.5 rounded-xl border text-left space-y-0.5 cursor-pointer transition ${
                    canWatchRewardedAd() && !watchingRewardedAd
                      ? 'bg-stone-900/80 hover:bg-stone-800 border-violet-500/40'
                      : 'bg-stone-900/30 border-stone-700/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[11px] font-black text-violet-300 flex items-center gap-1">
                    <Play size={13} /> {watchingRewardedAd ? 'Cargando...' : 'Ver Anuncio (+3 \uD83E\uDE99)'}
                  </span>
                  <p className="text-[10px] text-stone-400 leading-tight">
                    {canWatchRewardedAd()
                      ? 'Mira un vídeo corto y recibe talentos gratis.'
                      : `Disponible en ${Math.ceil(rewardedAdCooldown / 1000)}s`
                    }
                  </p>
                </button>
              </div>
            </div>

            {/* Costos de Modos */}
            <div className="p-2.5 bg-black/40 rounded-xl border border-stone-800 text-[10px] text-stone-400 text-left space-y-1 relative z-10">
              <div className="flex justify-between items-center">
                <span>⚔️ Uno contra Uno (1v1):</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  Cuesta 1 <GoldCoinIcon className="w-3 h-3 inline" /> (Gana +2 <GoldCoinIcon className="w-3 h-3 inline" />)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>👥 Todos Vs Todos (3-8):</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  Cuesta 1 <GoldCoinIcon className="w-3 h-3 inline" /> (Podio: +3 / +2 / +1 <GoldCoinIcon className="w-3 h-3 inline" />)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>🏆 Carrera en Solitario / Grupal:</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  Cuesta 1 <GoldCoinIcon className="w-3 h-3 inline" /> (Gana +2 <GoldCoinIcon className="w-3 h-3 inline" />)
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowTalentsModal(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer relative z-10"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL DE SALDO INSUFICIENTE DE TALENTOS / TE HAS QUEDADO SIN TALENTO */}
      {insufficientTalentsModal && (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setInsufficientTalentsModal(null)}
        >
          <div
            className="bg-gradient-to-b from-[#2B1B17] via-[#1E1411] to-[#120B0A] border-2 border-amber-500/80 rounded-3xl max-w-md w-full p-5 sm:p-6 text-center space-y-4 shadow-2xl relative overflow-hidden text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Destello de fondo */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1.5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto border border-amber-400/40 shadow-inner">
                <GoldCoinIcon className="w-9 h-9 animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-400/40 inline-block">
                Aviso de Talentos
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight">
                ¡Te has quedado sin talentos!
              </h3>
              <p className="text-xs text-stone-300">
                Necesitas al menos 1 talento para jugar en <strong className="text-amber-300">{insufficientTalentsModal.modeName}</strong>. Tu saldo actual es de <strong className="text-rose-400">0 Talentos</strong>.
              </p>
            </div>

            {/* Aviso de Recarga Mañana + Opciones de Obtención */}
            <div className="p-3 bg-stone-900/90 rounded-2xl border border-stone-800 text-left text-xs space-y-2 relative z-10">
              <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1">
                <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                  <span>🕊️</span> Recarga Diaria de Bendición
                </span>
                <p className="text-[11px] text-stone-300 leading-snug">
                  Mañana recibirás <strong className="text-emerald-300 font-black">+6 Nuevos Talentos</strong> de bendición diaria (tiempo restante: <span className="text-amber-300 font-mono font-bold">{talentRefillInfo.formatted}</span>).
                </p>
              </div>

              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide pt-1">
                ¿Quieres seguir jugando ahora mismo?
              </p>
            </div>

            {/* Botones de Acción Inmediata: Compartir en Facebook & Pedir a Amigos */}
            <div className="space-y-2 pt-1 relative z-10">
              {/* Botón 1: Compartir en Facebook / Redes para ganar +3 Talentos */}
              <button
                type="button"
                onClick={async () => {
                  playSound("select");
                  const myCode = `BIBLOS-${(userProfileState.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfileState.rating || 1000) % 9000)}`;
                  const inviteUrl = generateFriendInviteUrl({
                    name: userProfileState.name || 'Jugador Bíblico',
                    code: myCode,
                    avatar: userProfileState.avatar || '/avatars/david.jpg',
                    country: userProfileState.country || 'DO',
                    countryFlag: userProfileState.countryFlag || '🇩🇴'
                  });

                  const bonus = claimSocialShareBonus();
                  if (bonus.success) {
                    setUserTalents(bonus.newBalance);
                    confetti({ particleCount: 60, spread: 70 });
                    playSound("correct");
                    triggerHaptic("success");
                    setInsufficientTalentsModal(null);
                  } else {
                    alert(bonus.message);
                  }

                  // Abrir compartir nativo o compartir directo de Facebook / WhatsApp
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Biblos Games - El Juego de la Biblia',
                        text: `🎲🕊️ ¡Estoy jugando Biblos Games! Únete conmigo a responder trivias bíblicas y avanzar en el tablero.\n${inviteUrl}`,
                        url: inviteUrl
                      });
                    } catch (e) {
                      console.log('Share canceled', e);
                    }
                  } else {
                    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`;
                    window.open(fbUrl, '_blank', 'width=600,height=500');
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 border border-blue-400/40"
              >
                <Share2 size={16} className="text-amber-300" />
                <span>Compartir en Facebook (+3 <GoldCoinIcon className="w-3.5 h-3.5 inline" />)</span>
              </button>

              {/* Botón 2: Pedir a Amigos / Invitar Amigos */}
              <button
                type="button"
                onClick={() => {
                  setInsufficientTalentsModal(null);
                  setShowOnlineModal(true);
                  setOnlineSubTab('FRIENDS');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Users size={16} className="text-amber-300" />
                <span>Pedir Talentos a Amigos (+3 <GoldCoinIcon className="w-3.5 h-3.5 inline" />)</span>
              </button>

              <button
                type="button"
                onClick={() => setInsufficientTalentsModal(null)}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 font-bold rounded-xl text-[11px] uppercase tracking-wider transition cursor-pointer"
              >
                Entendido, Regresar
              </button>

              {/* Opción de Anuncio Bonificado */}
              {canWatchRewardedAd() && (
                <button
                  type="button"
                  disabled={watchingRewardedAd}
                  onClick={async () => {
                    setWatchingRewardedAd(true);
                    playSound("select");
                    try {
                      const watched = await showRewardedAd();
                      if (watched) {
                        markRewardedAdWatched();
                        const result = addTalents(3, 'Anuncio de vídeo bonificado', 'REWARDED_AD');
                        setUserTalents(result.newBalance);
                        confetti({ particleCount: 80, spread: 70 });
                        playSound("correct");
                        triggerHaptic("success");
                        setInsufficientTalentsModal(null);
                      }
                    } catch (e) {
                      console.warn('Rewarded ad error:', e);
                    }
                    setWatchingRewardedAd(false);
                    setRewardedAdCooldown(getTimeUntilNextRewardedAd());
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play size={16} className="text-amber-300" />
                  <span>{watchingRewardedAd ? 'Cargando Anuncio...' : 'Ver Anuncio (+3 \uD83E\uDE99)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 👑 MODAL DE COMPRA / DESBLOQUEO DE BIBLOS FULL (PREMIUM) */}
      {showPremiumModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setShowPremiumModal(false)}
        >
          <div
            className="bg-gradient-to-b from-[#2B2317] via-[#1F1910] to-[#120E08] border-2 border-amber-500/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-center space-y-4 shadow-2xl relative overflow-hidden text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Halo ambiental dorado */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1.5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-amber-950 flex items-center justify-center mx-auto shadow-xl border-2 border-amber-200 animate-bounce">
                <Crown size={32} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-400/50 inline-block font-mono">
                👑 BIBLOS GAMES FULL · ACCESO TOTAL
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-amber-100 leading-tight">
                ¡Desbloquea Todas las Temáticas Bíblicas!
              </h3>
              <p className="text-xs text-stone-300 max-w-sm mx-auto">
                Accede sin límites a todas las modalidades de juego, preguntas VIP exclusivas y disfruta de una experiencia 100% libre de anuncios.
              </p>
            </div>

            {/* Beneficios Exclusivos de Biblos Full */}
            <div className="p-3.5 bg-stone-900/90 rounded-2xl border border-amber-500/40 text-left text-xs space-y-2.5 relative z-10">
              <p className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                ✨ Beneficios incluidos en la Versión Full:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-300">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>9 Temáticas completas</strong> desbloqueadas de por vida.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>100% del Banco Bíblico</strong> (Acceso total vs 60% en versión Free).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Cero Anuncios</strong> para una experiencia pura e ininterrumpida.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Insignia Dorada VIP</strong> en tu perfil y ranking mundial.</span>
                </div>
              </div>
            </div>

            {/* Opciones de Compra / Prueba */}
            <div className="space-y-2 pt-1 relative z-10">
              <button
                onClick={() => {
                  playSound("correct");
                  triggerHaptic("success");
                  const current = getUserProfile();
                  const updated = {
                    ...current,
                    isPremium: true,
                    premiumUnlockedAt: new Date().toISOString()
                  };
                  saveUserProfile(updated);
                  setUserProfileState(updated);
                  ALL_QUESTIONS = getQuestionsForUser(true).questions;
                  setShowPremiumModal(false);
                  confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
                  setFriendInviteNotification('👑 ¡Plan Premium VIP Activado! Todas las temáticas y Estudio Bíblico están desbloqueados.');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-2xl transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-2 border-amber-200"
              >
                <Crown size={18} />
                <span>Desbloquear Versión Full (Acceso Total)</span>
              </button>

              <button
                onClick={() => setShowPremiumModal(false)}
                className="w-full py-2 bg-stone-900/80 hover:bg-stone-800 text-stone-400 font-bold rounded-xl text-xs uppercase tracking-wider border border-stone-800 transition cursor-pointer"
              >
                Continuar con Versión Gratis (Solo Periodos Bíblicos)
              </button>
            </div>
          </div>
        </div>
      )}

      {isProjectionMode && currentQuestion ? (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-8 transition-all duration-500">
          <button 
            onClick={toggleProjection}
            className="absolute top-8 left-8 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="absolute bottom-8 right-8 flex flex-col items-end opacity-30">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-red-600 font-serif">β</span>
              <span className="text-lg font-bold tracking-tight">Biblos Games</span>
            </div>
            <p className="text-xs font-serif italic">El Juego de la Biblia</p>
          </div>

          <div className="max-w-6xl w-full space-y-12 text-center">
            <div className="space-y-4">
              <span className="text-bible-gold font-serif italic text-2xl tracking-widest uppercase">
                {currentQuestion.period}
              </span>
              <h1 className="text-6xl md:text-8xl font-serif font-bold leading-tight">
                {currentQuestion.question}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = idx === currentQuestion.correctAnswer;
                return (
                  <button 
                    key={idx}
                    disabled={showAnswer}
                    onClick={() => handleAnswerClick(idx)}
                    className={`
                      p-8 rounded-2xl border-2 text-3xl font-medium transition-all duration-500 text-left
                      ${showAnswer 
                        ? isCorrect 
                          ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105' 
                          : 'bg-white/5 border-white/10 opacity-40'
                        : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40 active:scale-95'
                      }
                    `}
                  >
                    <span className="mr-4 opacity-50">{String.fromCharCode(65 + idx)})</span>
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="pt-8 flex flex-col items-center gap-6">
              {!showAnswer ? (
                <button 
                  onClick={() => setShowAnswer(true)}
                  className="group relative px-12 py-4 bg-bible-gold text-white rounded-full text-2xl font-bold overflow-hidden transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  REVELAR RESPUESTA
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-bible-gold text-3xl font-serif italic">
                    Referencia: {currentQuestion.reference}
                  </p>
                  <button 
                    onClick={() => getRandomQuestion(currentPeriod || 'SURPRISE')}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-xl transition-colors"
                  >
                    Siguiente Pregunta
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      ) : screen === 'TABLERO' ? (
        <BoardGameMode
          initialSubMode={boardSubMode}
          initialCustomStudyFilter={activeCustomStudyFilter}
          onExit={() => {
            if (onlineRoom) {
              onlineService.leaveRoom();
              setOnlineRoom(null);
            }
            setActiveCustomStudyFilter(null);
            setScreen('WELCOME');
          }}
          onOpenNewRoom={() => {
            if (onlineRoom) {
              onlineService.leaveRoom();
              setOnlineRoom(null);
            }
            setShowOnlineModal(true);
          }}
          isOnline={Boolean(onlineRoom)}
          onlineRoom={onlineRoom}
          userProfile={userProfileState}
          userTalents={userTalents}
          onUpdateTalents={(newBal) => setUserTalents(newBal)}
          initialTimeLimit={questionTimeLimit}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenProfile={() => {
            setUserProfileState(getUserProfile());
            setShowProfileModal(true);
          }}
          onOpenAbout={() => {
            setShowAbout(true);
            setShowInstructions(false);
          }}
          onOpenPremiumModal={() => setShowPremiumModal(true)}
          isSoundOn={isSoundOn}
          onToggleSound={() => setIsSoundOn(!isSoundOn)}
          onInsufficientTalents={(info) => setInsufficientTalentsModal(info)}
        />
      ) : showWelcome ? (
        <div 
          className="min-h-screen w-full bg-[#1B1A17] flex flex-col items-center justify-center p-4 sm:p-6 relative bg-cover bg-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(27,26,23,0.85), rgba(27,26,23,0.85)), url(/fondo-biblos.jpg)'
          }}
        >
          <div className="w-full max-w-lg flex flex-col items-center justify-center text-center space-y-4 py-4">
            <div
              onClick={() => {
                const next = adminTapGestureCount + 1;
                setAdminTapGestureCount(next);
                if (next >= 5) {
                  setShowAdminDashboard(true);
                  setAdminTapGestureCount(0);
                  playSound("correct");
                  triggerHaptic("success");
                }
              }}
              className="cursor-pointer active:scale-98 transition-transform"
              title="Biblos Games"
            >
              <img
                src="/logo-biblos.png"
                alt="Biblos Games"
                className="w-56 sm:w-72 md:w-80 max-w-full drop-shadow-2xl mb-2 shrink-0 select-none"
              />
            </div>

            <div className="w-full space-y-3.5">
              {/* CUADRÍCULA DE LOS 3 MODOS PRINCIPALES DE JUEGO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                {/* 1. ONLINE MULTIJUGADOR (AZUL ZAFIRO) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOnlineModal(true);
                    playSound("select");
                  }}
                  className="p-3.5 bg-gradient-to-br from-blue-700 via-indigo-850 to-slate-950 hover:from-blue-600 hover:to-indigo-900 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 border border-blue-400/50 ring-2 ring-blue-500/30 cursor-pointer"
                >
                  <Globe className="w-6 h-6 text-amber-300 pointer-events-none" />
                  <span className="text-xs sm:text-sm uppercase tracking-wider font-black pointer-events-none">Online</span>
                  <span className="text-[9px] text-blue-200/90 font-medium pointer-events-none">Salas Privadas & En Vivo</span>
                </button>

                {/* 2. GRUPO LOCAL (PÚRPURA / CARMESÍ REAL) */}
                <button
                  type="button"
                  onClick={() => {
                    setBoardSubMode('GRUPO_LOCAL');
                    setScreen('TABLERO');
                    playSound("select");
                  }}
                  className="p-3.5 bg-gradient-to-br from-purple-800 via-purple-950 to-stone-950 hover:from-purple-700 hover:to-stone-900 text-purple-100 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 border border-purple-400/50 ring-2 ring-purple-500/30 cursor-pointer"
                >
                  <Users className="w-6 h-6 text-amber-300 pointer-events-none" />
                  <span className="text-xs sm:text-sm uppercase tracking-wider font-black pointer-events-none">Grupal</span>
                  <span className="text-[9px] text-purple-200/90 font-medium pointer-events-none">Grupo Local (2-8 Jug.)</span>
                </button>

                {/* 3. SOLITARIO (VERDE ESMERALDA - TRIVIA Y TABLERO) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSoloSubmodeModal(true);
                    playSound("select");
                  }}
                  className="p-3.5 bg-gradient-to-br from-emerald-700 via-teal-850 to-stone-950 hover:from-emerald-600 hover:to-stone-900 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 border border-emerald-400/50 ring-2 ring-emerald-500/30 cursor-pointer"
                >
                  <User className="w-6 h-6 text-amber-300 pointer-events-none" />
                  <span className="text-xs sm:text-sm uppercase tracking-wider font-black pointer-events-none">Solitario</span>
                  <span className="text-[9px] text-emerald-200/90 font-medium pointer-events-none">Trivia & Tablero</span>
                </button>
              </div>

              {/* 🌟 TARJETA COMPACTA: DESAFÍO BÍBLICO DE HOY (ABAJO DE LOS 3 MODOS, ARRIBA DEL RANKING) */}
              {(() => {
                const dailyData = getDailyChallenge();
                const streakData = getDailyStreakState();
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDailyChallengeModal(true);
                      playSound("select");
                    }}
                    className="w-full py-2.5 px-3.5 bg-gradient-to-r from-[#331C08] via-[#241506] to-[#1A1005] hover:from-[#42240B] hover:to-[#2B1B0E] text-white rounded-2xl border border-amber-400/80 shadow-lg transition-all active:scale-[0.98] flex items-center justify-between gap-2.5 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/25 border border-amber-400/50 text-stone-950 font-black flex items-center justify-center text-base shadow group-hover:scale-105 transition-transform shrink-0">
                        <span>{dailyData.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                            Desafío Bíblico de Hoy
                          </span>
                          {streakData.currentStreak > 0 && (
                            <span className="text-[8px] bg-orange-950 text-orange-300 border border-orange-500/50 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                              <span>🔥</span> {streakData.currentStreak}d
                            </span>
                          )}
                          {dailyData.completed ? (
                            <span className="text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded-full font-bold">
                              ✓ Hecho
                            </span>
                          ) : (
                            <span className="text-[8px] bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded-full font-black animate-pulse">
                              ¡Jugar!
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-200 font-bold truncate leading-tight">
                          {dailyData.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-md font-black flex items-center gap-0.5 shadow">
                        <GoldCoinIcon className="w-2.5 h-2.5" /> +1
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold bg-black/40 px-2 py-0.5 rounded-md border border-stone-800">
                        {dailyData.completed ? `${dailyData.correctAnswersCount}/10` : `${dailyData.currentQuestionIndex}/10`}
                      </span>
                    </div>
                  </button>
                );
              })()}

              {/* BOTÓN SALÓN DE LA FAMA & RANKING */}
              <button
                type="button"
                onClick={() => {
                  setShowLeaderboardModal(true);
                  playSound("select");
                }}
                className="w-full py-2.5 px-3.5 bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-950/90 hover:from-amber-900 hover:to-stone-800 text-amber-200 font-black rounded-2xl border border-amber-500/50 shadow-xl transition-all active:scale-95 flex items-center justify-between text-xs sm:text-sm cursor-pointer"
              >
                <div className="flex items-center gap-2 pointer-events-none">
                  <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>🏆 Ranking & Salón de la Fama</span>
                </div>
                <div className="flex items-center gap-1 pointer-events-none">
                  <span className="text-[9px] bg-amber-500/40 text-amber-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Niv. {getRankTier(userProfileState.rating || 1000).level}
                  </span>
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                    {userProfileState.rating || 1000} pts
                  </span>
                </div>
              </button>

              {/* FICHA INTEGRADA DEL USUARIO EN EL HOME */}
              <button
                type="button"
                onClick={() => {
                  try { setUserProfileState(getUserProfile()); } catch (e) {}
                  setShowProfileModal(true);
                  playSound("select");
                }}
                className="w-full bg-black/80 hover:bg-stone-900/90 backdrop-blur-md border border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 shadow-2xl text-left transition-all group active:scale-[0.98] ring-1 ring-amber-500/20 hover:ring-amber-400/50 cursor-pointer block"
                title="Toca para ver tu perfil y Banco de Fe"
              >
                <div className="flex items-center justify-between gap-3 pointer-events-none">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={userProfileState.avatar || '/avatars/david.jpg'}
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute -bottom-1 -right-1 text-sm bg-stone-900 rounded-full p-0.5 border border-amber-400/50">
                        {getRankTier(userProfileState.rating || 1000).icon}
                      </span>
                    </div>

                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-amber-200 truncate group-hover:text-amber-300 transition-colors">
                          <span className="mr-1">{userProfileState.countryFlag || '🇩🇴'}</span>
                          {userProfileState.name}
                        </span>
                        {userProfileState.authProvider ? (
                          <span className={`px-1.5 py-0.2 text-[8px] font-bold rounded-full border ${
                            userProfileState.authProvider === 'google'
                              ? 'bg-red-950/90 text-red-300 border-red-500/60'
                              : userProfileState.authProvider === 'facebook'
                              ? 'bg-blue-950/90 text-blue-300 border-blue-500/60'
                              : 'bg-stone-800 text-stone-300 border-stone-600'
                          }`}>
                            {userProfileState.authProvider === 'google' ? 'Google' : 'Facebook'}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[8px] font-bold rounded-full border bg-stone-800 text-stone-300 border-stone-600">
                            Invitado
                          </span>
                        )}
                      </div>
                      {(() => {
                        const rankInfo = getNextRankTierInfo(userProfileState.rating || 1000);
                        return (
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] font-black text-amber-300">
                                Nivel {rankInfo.currentTier.level}: {rankInfo.currentTier.title}
                              </p>
                              {rankInfo.nextTier && (
                                <span className="text-[9px] text-amber-400/80 font-mono font-medium">
                                  (Faltan {rankInfo.pointsNeeded} pts para Nivel {rankInfo.nextTier.level})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-stone-300 mt-0.5">
                              <span className="text-emerald-400 font-black">
                                🎯 {userProfileState.accuracy}% Prec.
                              </span>
                              <span className="text-yellow-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1">
                                <GoldCoinIcon className="w-3.5 h-3.5" /> {userTalents}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-500/15 group-hover:bg-amber-500 text-amber-300 group-hover:text-amber-950 border border-amber-500/30 group-hover:border-amber-300 transition-all shrink-0">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <span>✏️</span>
                      <span className="hidden sm:inline">Ver / Editar</span>
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`min-h-screen flex flex-col transition-all duration-500 ${
            isProjectionMode
              ? "bg-black text-white"
              : "bg-[#1B1A17]"
          }`}
        >

      {/* Header Limpio y Ultra-Optimizado para Móviles */}
      <header className="relative bg-[#2A2621]/95 backdrop-blur-md border-b border-[#3A342C] px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        {/* Left: Botón Inicio / Salir al Home + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentQuestion || isTriviaMatchRunning || gameLevel) {
                if (window.confirm("¿Seguro que deseas abandonar la partida de Trivia y volver al menú principal?")) {
                  playSound("select");
                  resetGame();
                  setScreen('WELCOME');
                }
              } else {
                playSound("select");
                resetGame();
                setScreen('WELCOME');
              }
            }}
            className="px-2.5 sm:px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl font-bold flex items-center gap-1 shadow transition text-xs active:scale-95 cursor-pointer"
            title="Ir al Inicio (Menú Principal)"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400 pointer-events-none" />
            <Home className="w-3.5 h-3.5 text-amber-300 pointer-events-none" />
            <span className="hidden sm:inline font-bold pointer-events-none">Inicio</span>
          </button>

          <img
            src="/logo-header.png"
            alt="Biblos Games"
            className="h-9 sm:h-12 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Center: Subtítulo en PC */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-white/80 text-[10px] tracking-[0.3em] uppercase font-light">
            Modo Solitario · Trivia Bíblica
          </p>
        </div>

        {/* Right: Talents + Menú Dropdown */}
        <div className="flex items-center gap-2 relative">
          {/* 🪙 Saldo de Talentos */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-400/50 rounded-xl text-amber-300 shadow"
            title="Tus Talentos Bíblicos disponibles"
          >
            <GoldCoinIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-mono font-black">{userTalents}</span>
          </div>

          {/* ⚙️ BOTÓN MENÚ INTEGRADO */}
          <button
            onClick={() => setShowTriviaHeaderMenu(!showTriviaHeaderMenu)}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 hover:border-amber-500/50 rounded-xl text-xs font-bold transition shadow active:scale-95 cursor-pointer"
            title="Menú de opciones"
          >
            <Menu size={16} />
            <span className="hidden xs:inline">Menú</span>
          </button>

          {/* 📋 MENÚ DESPLEGABLE TRIVIA */}
          <AnimatePresence>
            {showTriviaHeaderMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
                  onClick={() => setShowTriviaHeaderMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 z-50 w-64 bg-[#231E18] border-2 border-amber-500/70 rounded-2xl shadow-2xl overflow-hidden p-2 text-stone-200 space-y-1 ring-4 ring-black/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Perfil del Usuario */}
                  <button
                    onClick={() => {
                      setShowTriviaHeaderMenu(false);
                      setUserProfileState(getUserProfile());
                      setShowProfileModal(true);
                    }}
                    className="w-full p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                  >
                    {userProfileState.avatar.startsWith('/') ? (
                      <img src={userProfileState.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-amber-400" />
                    ) : (
                      <span className="text-xl">{userProfileState.avatar}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-amber-300 truncate">
                        <span className="mr-1">{userProfileState.countryFlag || '🇩🇴'}</span>
                        {userProfileState.name}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-bold">
                        {userProfileState.accuracy}% Precisión · {userProfileState.rating || 1000} ELO
                      </p>
                    </div>
                  </button>

                  {/* Ranking */}
                  <button
                    onClick={() => {
                      setShowTriviaHeaderMenu(false);
                      setShowLeaderboardModal(true);
                    }}
                    className="w-full px-3 py-2 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-200 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-amber-300">
                      <Trophy size={15} /> 🏆 Salón de la Fama
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-mono">
                      Niv. {getRankTier(userProfileState.rating || 1000).level}
                    </span>
                  </button>

                  {/* Sonido On/Off */}
                  <button
                    onClick={() => setIsSoundOn(!isSoundOn)}
                    className="w-full px-3 py-2 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-200 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-amber-200">
                      {isSoundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                      <span>Sonido del Juego</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSoundOn ? 'bg-emerald-950 text-emerald-300' : 'bg-stone-900 text-stone-400'}`}>
                      {isSoundOn ? 'Activado' : 'Mute'}
                    </span>
                  </button>

                  {/* Instrucciones */}
                  <button
                    onClick={() => {
                      setShowTriviaHeaderMenu(false);
                      setShowInstructions(true);
                      setShowAbout(false);
                    }}
                    className="w-full px-3 py-2 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-300 flex items-center gap-2 transition cursor-pointer"
                  >
                    <BookOpen size={15} className="text-amber-300" />
                    <span>Instrucciones de Juego</span>
                  </button>

                  {/* Acerca De */}
                  <button
                    onClick={() => {
                      setShowTriviaHeaderMenu(false);
                      setShowAbout(true);
                      setShowInstructions(false);
                    }}
                    className="w-full px-3 py-2 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-300 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Info size={15} className="text-amber-300" />
                    <span>Acerca de Biblos Games</span>
                  </button>

                  <div className="border-t border-stone-800 my-1" />

                  {/* Reiniciar Partida */}
                  <button
                    onClick={() => {
                      setShowTriviaHeaderMenu(false);
                      resetGame();
                    }}
                    className="w-full px-3 py-2 bg-stone-900 hover:bg-rose-950 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Reiniciar Preguntas</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* BARRA SUPERIOR DE ACCESO A LOS 3 MODOS PRINCIPALES */}
      <div className="w-full bg-[#24201A] border-b border-[#3A342C] px-3 sm:px-4 py-2 flex justify-center sticky top-[65px] z-20 shadow-md">
        <div className="grid grid-cols-3 gap-2 max-w-md w-full">
          <button
            onClick={() => {
              playSound("select");
              setShowOnlineModal(true);
            }}
            className="py-2 px-2 bg-stone-800/90 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-stone-700 hover:border-blue-500/50 shadow"
          >
            <Globe size={15} className="text-amber-300 shrink-0" />
            <span>Online</span>
          </button>

          <button
            onClick={() => {
              playSound("select");
              setBoardSubMode('GRUPO_LOCAL');
              setScreen('TABLERO');
            }}
            className="py-2 px-2 bg-stone-800/90 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-stone-700 hover:border-purple-500/50 shadow"
          >
            <Users size={15} className="text-amber-300 shrink-0" />
            <span>Grupal</span>
          </button>

          <button
            onClick={() => {
              playSound("select");
              setShowSoloSubmodeModal(true);
            }}
            className="py-2 px-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-emerald-500/40 hover:border-emerald-400 shadow ring-1 ring-emerald-500/20"
          >
            <User size={15} className="text-amber-300 shrink-0" />
            <span>Solitario</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 bg-[#1B1A17] text-[#D6D0C4]">
        {/* BANNER DE ESTUDIO BÍBLICO ACTIVO (SOLO EN MENÚS / SELECCIÓN) */}
        {activeCustomStudyFilter && !currentQuestion && (
          <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-stone-900 border-2 border-purple-500/50 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-400/40">
                <ScrollText size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                    Estudio Bíblico:
                  </span>
                  <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-bold">
                    {activeCustomStudyFilter.testament === 'ALL' ? 'Toda la Biblia' : activeCustomStudyFilter.testament === 'OT' ? 'Antiguo Test.' : 'Nuevo Test.'}
                  </span>
                  {activeCustomStudyFilter.book !== 'ALL' && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      {activeCustomStudyFilter.book}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                playSound("select");
                setActiveCustomStudyFilter(null);
              }}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-[10px] font-bold transition border border-stone-700 cursor-pointer"
            >
              Restablecer
            </button>
          </div>
        )}

{!gameMode ? (

  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-10 py-6"
  >
    <div className="text-center space-y-3">
      <h2 className="text-base font-sans font-medium">
        Selecciona el modo de juego
      </h2>
      <p className="text-stone-400 text-sm italic">
        Escoge la tematica biblica que deseas jugar
      </p>
    </div>
    {/* Botón destacado, compacto y centrado para MODO MIXTO */}
    <div className="flex justify-center">
      {(() => {
        const isMixtoLocked = !userProfileState?.isPremium;
        return (
          <button
            onClick={() => {
              if (isMixtoLocked) {
                playSound("select");
                triggerHaptic("warning");
                setShowPremiumModal(true);
                return;
              }
              playSound("select");
              setGameMode('MIXTO');
            }}
            className={`group relative overflow-hidden px-6 py-2.5 rounded-full font-bold shadow-lg transition-all transform active:scale-95 flex items-center gap-2 border cursor-pointer ${
              isMixtoLocked
                ? 'bg-stone-900/90 border-stone-700 text-stone-400 hover:border-amber-500/50 hover:bg-stone-800'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-amber-950 shadow-amber-500/20 hover:shadow-amber-500/30 border-amber-300/40'
            }`}
          >
            {isMixtoLocked ? (
              <Lock size={15} className="text-amber-400 shrink-0" />
            ) : (
              <Sparkles size={16} className="animate-spin-slow text-amber-950 shrink-0" />
            )}
            <span className="text-xs uppercase tracking-wider font-black">
              🎲 Modo Mixto (Todas las Categorías)
            </span>
            {isMixtoLocked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center gap-1 shadow">
                <Lock size={11} className="text-amber-400" />
                <span>👑</span>
              </span>
            )}
          </button>
        );
      })()}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { id: 'PERIODOS', label: 'Períodos Bíblicos', desc: 'Sigue la ruta del tablero físico', icon: LayoutGrid, isFree: true },
        { id: 'PRINCIPIANTE', label: 'Principiante', desc: 'Preguntas fundamentales para nuevos estudiantes', icon: Sparkles, isFree: false },
        { id: 'VERSICULOS', label: 'Versículos', desc: 'Completa y memoriza la Palabra', icon: BookOpen, isFree: false },
        { id: 'PERSONAJES', label: 'Personajes', desc: '¿Quién es quién en la Biblia?', icon: Users, isFree: false },
        { id: 'DIOS', label: 'Modo Dios', desc: 'Desafíos sobre Su poder y atributos', icon: Crown, isFree: false },
        { id: 'SALVACION', label: 'Salvación', desc: 'El plan de redención paso a paso', icon: Cross, isFree: false },
        { id: 'MANDAMIENTOS', label: 'Mandamientos', desc: 'La ley y preceptos divinos', icon: ScrollText, isFree: false },
        { id: 'HISTORIA', label: 'Historia', desc: 'Línea de tiempo del pueblo de Dios', icon: Landmark, isFree: false },
        { id: 'GEOGRAFIA', label: 'Geografía', desc: 'Montes, ríos y ciudades Bíblicas', icon: MapPin, isFree: false },
      ].map((mode) => {
        const isLocked = !mode.isFree && !userProfileState?.isPremium;
        const IconComp = mode.icon;

        return (
          <button
            key={mode.id}
            onClick={() => {
              if (isLocked) {
                playSound("select");
                triggerHaptic("warning");
                setShowPremiumModal(true);
                return;
              }
              playSound("select");
              setGameMode(mode.id as any);
            }}
            className={`relative group overflow-hidden p-4 rounded-2xl border transition-all active:scale-95 text-left cursor-pointer ${
              isLocked
                ? 'bg-[#1e1c19]/90 border-stone-800 text-stone-500 hover:border-amber-500/50 hover:bg-[#25221d]'
                : 'bg-[#2A2621] border-white/5 hover:border-amber-500/50 text-[#D6D0C4]'
            }`}
          >
            {isLocked && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-950/80 border border-amber-500/50 rounded-full text-xs flex items-center gap-1 shadow">
                <Lock size={11} className="text-amber-400" />
                <span>👑</span>
              </span>
            )}

            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg transition-colors ${
                isLocked
                  ? 'bg-stone-800 text-stone-500 group-hover:text-amber-400'
                  : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black'
              }`}>
                <IconComp size={20} />
              </div>
              <div className="pr-8">
                <h3 className={`text-sm font-bold uppercase tracking-tight flex items-center gap-1.5 ${
                  isLocked ? 'text-stone-400 group-hover:text-stone-200' : 'text-stone-200'
                }`}>
                  <span>{mode.label}</span>
                </h3>
                <p className="text-[10px] text-stone-500 leading-tight mt-1 group-hover:text-stone-300 transition-colors">
                  {mode.desc}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>

    {/* BOTÓN INFERIOR DE RETROCESO A SOLITARIO / INICIO */}
    <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => {
          playSound("select");
          setShowSoloSubmodeModal(true);
        }}
        className="px-6 py-3 rounded-2xl bg-[#2A2621] border-2 border-emerald-500/40 hover:border-emerald-400 hover:bg-[#332E27] transition-all shadow-md text-emerald-300 hover:text-emerald-200 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <ChevronLeft size={18} />
        <span>Volver a Menú Solitario</span>
      </button>

      <button
        type="button"
        onClick={() => {
          playSound("select");
          resetGame();
          setScreen('WELCOME');
        }}
        className="px-6 py-3 rounded-2xl bg-[#2A2621] border-2 border-stone-700 hover:border-amber-400 hover:bg-[#332E27] transition-all shadow-md text-stone-400 hover:text-amber-200 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <Home size={16} />
        <span>Ir al Menú Principal</span>
      </button>
    </div>
  </motion.div>

) : !gameLevel ? (

  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6 py-4"
  >
    <div className="flex items-center justify-between border-b border-stone-800 pb-3">
      <button 
        onClick={() => setGameMode(null)}
        className="flex items-center gap-1.5 text-stone-400 hover:text-amber-300 transition-colors font-bold text-xs"
      >
        <ChevronLeft size={16} />
        Volver a Temáticas
      </button>
      <span className="text-xs font-black text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/50">
        Temática: {gameMode === 'MIXTO' ? 'Modo Mixto' : gameMode}
      </span>
    </div>

    {/* ⏱️ SELECTOR DE DURACIÓN DE LA PARTIDA (3 min, 5 min, 10 min, 15 min) */}
    <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-stone-800 space-y-2 text-center">
      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
        ⏱️ Duración de la Partida (Límite para Conclusión y Ranking Preciso)
      </span>
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: '3_MIN', label: '⚡ 3 Min', seconds: 180 },
          { id: '5_MIN', label: '⏱️ 5 Min', seconds: 300 },
          { id: '10_MIN', label: '⏳ 10 Min', seconds: 600 },
          { id: '15_MIN', label: '🏃 15 Min', seconds: 900 },
        ].map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              playSound("select");
              setTriviaMatchDuration(d.id as any);
              setTriviaTimeRemaining(d.seconds);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
              triviaMatchDuration === d.id
                ? 'bg-amber-500 text-amber-950 border-amber-300 font-black shadow ring-1 ring-amber-400'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>

    <div className="text-center space-y-1">
      <p className="text-stone-200 text-sm italic">
        Selecciona el Nivel de Complejidad para Iniciar
      </p>
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-400 bg-black/40 py-1 px-3 rounded-full w-fit mx-auto border border-rose-500/30">
        <span>Costo de Entrada:</span>
        <span className="flex items-center gap-0.5 font-black text-rose-300 font-mono">-1 <GoldCoinIcon className="w-3.5 h-3.5 inline" /></span>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {(() => {
        const diffInfo = getAvailableDifficulties(userProfileState?.rating || 1000);
        return [
          { id: 'PRINCIPIANTE', label: 'Principiante', sub: 'Primeros Pasos en la Palabra', levelReq: 'Nivel 1 y 2', isUnlocked: diffInfo.canBasic, seconds: 30, color: 'border-emerald-500/40 hover:border-emerald-400 bg-gradient-to-br from-[#2A2621] to-[#1e2f23]' },
          { id: 'INTERMEDIO', label: 'Intermedio', sub: 'Fortaleciendo el Conocimiento', levelReq: 'Nivel 3 y 4', isUnlocked: diffInfo.canIntermediate, seconds: 20, color: 'border-blue-500/40 hover:border-blue-400 bg-gradient-to-br from-[#2A2621] to-[#1e2638]' },
          { id: 'AVANZADO', label: 'Avanzado (Experto)', sub: 'Sabiduría de los Maestros', levelReq: 'Nivel 5 a 7', isUnlocked: diffInfo.canAdvanced, seconds: 15, color: 'border-amber-500/40 hover:border-amber-400 bg-gradient-to-br from-[#2A2621] to-[#3a2c1e]' },
          { id: 'MIXTO', label: 'Mixto (Todas)', sub: 'Desafío Combinado', levelReq: 'Nivel 3+', isUnlocked: diffInfo.canMixto, seconds: 21, color: 'border-purple-500/40 hover:border-purple-400 bg-gradient-to-br from-[#2A2621] to-[#3a203a]' },
        ].map((level) => {
          const isUnlocked = level.isUnlocked;

          return (
            <button
              key={level.id}
              onClick={() => {
                if (!isUnlocked) {
                  playSound("select");
                  triggerHaptic("warning");
                  setFriendInviteNotification(`🔒 Dificultad bloqueada: Requiere mayor Nivel / Rating ELO (${level.levelReq}).`);
                  return;
                }

                // Validar saldo de Talentos (Cuesta 1 Talento iniciar la partida)
                if (!canAffordTalents(FEES.SOLO_MATCH)) {
                  setInsufficientTalentsModal({
                    show: true,
                    required: FEES.SOLO_MATCH,
                    modeName: 'Modo Trivia en Solitario'
                  });
                  playSound("wrong");
                  triggerHaptic("warning");
                  return;
                }

                // Descontar 1 Talento oficial
                spendTalents(FEES.SOLO_MATCH, `Entrada a Modo Trivia (${level.label})`, 'SOLO_MATCH_FEE');
                setUserTalents(getTalentsBalance());

                playSound("select");
                const timeLimit = level.seconds;
                setSoloTimeLimit(timeLimit);
                setTimeLeft(timeLimit);
                setIsTimerEnabled(true);
                setIsTimerRunning(false);
                setGameLevel(level.id as any);
                setStartTime(null);
                setShowFinalSummary(false);

                // Inicializar duración total de partida según selector
                const matchDurationSecs = triviaMatchDuration === '3_MIN' ? 180
                  : triviaMatchDuration === '5_MIN' ? 300
                  : triviaMatchDuration === '10_MIN' ? 600
                  : triviaMatchDuration === '15_MIN' ? 900
                  : 99999;

                setTriviaTimeRemaining(matchDurationSecs);
                setIsTriviaMatchRunning(false);
                setSessionIncorrectQuestions([]);

                // Resetear estadísticas de sesión
                const freshStats: Record<string, { total: number; correct: number }> = {};
                Object.values(Period).forEach(p => {
                  freshStats[p] = { total: 0, correct: 0 };
                });
                setGameStats(freshStats);
              }}
              className={`
                text-left rounded-2xl p-5 relative overflow-hidden
                transition-all shadow-xl border-2 active:scale-95 group cursor-pointer
                ${!isUnlocked ? 'bg-[#181613] border-stone-800/80 text-stone-500 opacity-60' : level.color}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isUnlocked && <Lock size={16} className="text-amber-500 shrink-0" />}
                  <h3 className={`text-lg font-black uppercase tracking-wider leading-none ${
                    !isUnlocked ? 'text-stone-400' : 'text-stone-100'
                  }`}>
                    {level.label}
                  </h3>
                </div>
                <span className="text-[10px] bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-full font-mono font-black border border-amber-500/30">
                  ⏱️ {level.seconds}s
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-stone-400 font-medium group-hover:text-stone-200 transition-colors">
                  {level.sub}
                </p>
                <span className="text-[9px] bg-black/50 text-amber-300/90 font-mono px-2 py-0.5 rounded-md border border-white/5">
                  {level.levelReq}
                </span>
              </div>
            </button>
          );
        });
      })()}
    </div>

            <div className="pt-8 flex justify-center">
  <button
    onClick={() => {
      setGameLevel(null);
      setGameMode(null);
    }}
    className="flex items-center gap-2
                px-6 py-3
                rounded-2xl
                bg-[#2A2621]
                border-2 border-[#3A342C]
                hover:border-amber-400
                hover:bg-[#332E27]
                transition-all
                shadow-md
                text-stone-300 hover:text-amber-200"
  >
    <ChevronLeft size={18} />
    Volver a modos de juego
  </button>
</div>

          </motion.div>

        ) : !currentQuestion ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setGameLevel(null)}
                className="flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors font-medium text-sm"
              >
                <ChevronLeft size={16} />
                Cambiar Nivel
              </button>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                gameLevel === 'PRINCIPIANTE' ? 'bg-emerald-100 text-emerald-700' :
                gameLevel === 'INTERMEDIO' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                Modo {gameLevel}
              </div>
            </div>

            <div className="text-center space-y-0.5 mb-2">
              <h2 className="text-base font-serif font-black tracking-wide text-amber-200 uppercase">
                Selecciona un Período Bíblico
              </h2>
              <p className="text-stone-400 text-xs">
                Toca cualquier período o juega con todos los periodos combinados
              </p>
            </div>

            {/* BOTÓN DESTACADO DE PRIMERO Y CENTRALIZADO: TODOS LOS PERIODOS */}
            <div className="pb-2"> 
              <button
                onClick={handleSurprise}
                className="
                  w-full
                  relative
                  overflow-hidden
                  rounded-2xl
                  border-2 border-amber-400/70
                  bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950
                  hover:border-amber-300
                  hover:from-amber-900
                  hover:to-stone-850
                  transition-all duration-300
                  shadow-xl hover:shadow-2xl hover:-translate-y-0.5
                  flex flex-col items-center justify-center
                  px-4 py-3.5
                  group
                  cursor-pointer
                  text-center
                "
              >
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <Sparkles 
                    className="text-amber-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" 
                    size={22} 
                  />
                  <span className="font-serif font-black text-base sm:text-lg tracking-wider text-amber-300 group-hover:text-amber-200 uppercase">
                    🎲 TODOS LOS PERIODOS
                  </span>
                  <Sparkles 
                    className="text-amber-400 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" 
                    size={22} 
                  />
                </div>
                
                <span className="text-xs sm:text-sm font-semibold text-stone-300 group-hover:text-white transition-colors">
                  Preguntas de todos los periodos. Toca para jugar
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {(() => {
                const availablePeriods = activeCustomStudyFilter
                  ? getAvailablePeriodsForCustomStudy(ALL_QUESTIONS, activeCustomStudyFilter)
                  : Object.values(Period);

                return availablePeriods.map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      playSound("select");
                      handleSelectPeriod(period);
                    }}
                    className={`
                      relative overflow-hidden min-h-[75px] rounded-2xl py-2 px-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl border border-white/10
                      ${PERIOD_COLORS[period]} text-white group cursor-pointer
                    `}
                  >
                    <div className="absolute -right-4 -bottom-4 opacity-15 group-hover:scale-110 transition-transform duration-500">
                      <img
                        src={PERIOD_ICONS[period]}
                        alt={period}
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    <div className="relative z-10 flex items-center gap-3">
                      <img
                        src={PERIOD_ICONS[period]}
                        alt=""
                        className="w-10 h-10 object-contain drop-shadow"
                      />

                      <div>
                        <h3 className="font-serif font-bold text-sm leading-tight text-white">
                          {period}
                        </h3>
                        <p className="text-[9px] text-white/80 uppercase tracking-wider font-semibold">
                          Toca para jugar
                        </p>
                      </div>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 sm:space-y-4 max-w-lg mx-auto w-full"
          >
            {/* RECUADRO UNIFICADO DE ESTADO (ESTUDIO BÍBLICO, CRONÓMETRO Y NIVEL) */}
            <div className="bg-[#24201A] border border-[#3A342C] p-2 rounded-xl flex items-center justify-between gap-2 shadow-md">
              <button 
                onClick={() => setCurrentQuestion(null)}
                className="flex items-center gap-1 text-stone-400 hover:text-amber-300 transition-colors font-bold text-xs shrink-0 cursor-pointer"
                title="Cambiar Período"
              >
                <ChevronLeft size={15} />
                <span className="hidden xs:inline">Periodo</span>
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
                {/* 📖 Filtro de Estudio Activo */}
                {activeCustomStudyFilter && (
                  <div className="flex items-center gap-1 bg-purple-950/70 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0">
                    <ScrollText size={12} className="text-purple-300 shrink-0" />
                    <span>
                      {activeCustomStudyFilter.book !== 'ALL' 
                        ? activeCustomStudyFilter.book 
                        : activeCustomStudyFilter.testament === 'OT' 
                        ? 'Antiguo T.' 
                        : activeCustomStudyFilter.testament === 'NT' 
                        ? 'Nuevo T.' 
                        : 'Biblia'}
                    </span>
                  </div>
                )}

                {/* ⏱️ Cronómetro de Partida */}
                {isTriviaMatchRunning && (
                  <div className={`px-2 py-0.5 rounded-lg font-mono font-black text-[10px] sm:text-[11px] flex items-center gap-1 border shadow-inner shrink-0 ${
                    triviaTimeRemaining <= 30
                      ? 'bg-red-950/80 border-red-500/80 text-red-300 animate-pulse'
                      : 'bg-stone-900 border-stone-700 text-amber-300'
                  }`}>
                    <span>⏱️</span>
                    <span>
                      {Math.floor(triviaTimeRemaining / 60)}:{(triviaTimeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}

                {/* 🎯 Nivel / Dificultad */}
                <div className="px-2 py-0.5 bg-stone-900 border border-stone-700 rounded-lg text-[10px] font-black text-amber-300 uppercase tracking-wider shrink-0">
                  {currentQuestion.difficulty === 'BASIC' ? 'Principiante' : currentQuestion.difficulty === 'INTERMEDIATE' ? 'Intermedio' : currentQuestion.difficulty === 'ADVANCED' ? 'Avanzado' : currentQuestion.difficulty}
                </div>
              </div>
            </div>

            <div className="bg-[#F1E6CF] text-[#2B2B2B] rounded-2xl overflow-hidden border border-[#C2B280] shadow-2xl relative">
              
              {/* BARRA DE CRONÓMETRO REGRESIVO (Opcional según isTimerEnabled) */}
              {isTimerEnabled && (
                <div className="w-full bg-stone-300 h-2 md:h-2.5 relative overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timeLeft > 8 ? 'bg-emerald-500' : timeLeft > 3 ? 'bg-amber-500 animate-pulse' : 'bg-red-600 animate-ping'
                    }`}
                    style={{ width: `${(timeLeft / 15) * 100}%` }}
                  />
                </div>
              )}

              <div className={`px-4 py-2.5 sm:px-5 sm:py-3 text-white flex justify-between items-center ${PERIOD_COLORS[currentQuestion.period]}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={PERIOD_ICONS[currentQuestion.period]}
                    alt=""
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                  <span className="font-serif font-bold text-xs sm:text-sm tracking-tight">{currentQuestion.period}</span>
                </div>

                {/* TEMPORIZADOR Y MARCADOR */}
                <div className="flex items-center gap-2">
                  {isTimerEnabled ? (
                    <div className={`flex items-center gap-1 font-mono font-black text-xs px-2.5 py-0.5 rounded-lg shadow ${
                      timeLeft <= 5 ? 'bg-red-600 text-white animate-bounce ring-2 ring-red-300' : 'bg-black/40 text-amber-300'
                    }`}>
                      ⏱️ 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                    </div>
                  ) : (
                    <div className="bg-stone-800/60 text-stone-300 text-[10px] px-2 py-0.5 rounded-lg border border-stone-700">
                      ☕ Sin tiempo
                    </div>
                  )}
                  {soloStreak > 1 && (
                    <div className="bg-amber-500 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-lg shadow flex items-center gap-0.5">
                      🔥 x{soloStreak}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 sm:p-5 md:p-6 space-y-3">
                <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold leading-snug text-slate-900 text-balance">
                  {currentQuestion.question}
                </h2>

                <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                  {currentQuestion.options.map((option, idx) => {
                    const isCorrect = idx === currentQuestion.correctAnswer;
                    return (
                      <button
                        key={idx}
                        disabled={showAnswer}
                        onClick={() => handleAnswerClick(idx)}
                        className={`
                          w-full py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer
                          ${showAnswer 
                            ? isCorrect 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-400' 
                              : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                            : 'bg-white border-stone-200 hover:border-bible-gold hover:bg-amber-50/40 active:scale-[0.99] text-stone-800'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <span className={`
                            w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold border shrink-0
                            ${showAnswer 
                              ? isCorrect ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-stone-100 border-stone-200 text-stone-400'
                              : 'bg-stone-100 border-stone-300 text-stone-600 group-hover:border-bible-gold group-hover:bg-amber-500 group-hover:text-black'
                            }
                          `}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-xs sm:text-sm font-medium leading-snug">{option}</span>
                        </div>
                        {showAnswer && isCorrect && <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />}
                        {showAnswer && !isCorrect && <XCircle className="text-stone-300 shrink-0" size={18} />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {showAnswer && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-3 border-t border-stone-200/80 space-y-3"
                    >
                      <div className="bg-white/80 p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 text-amber-700">
                            <BookOpen size={18} />
                          </div>
                          <div>
                            {timeLeft === 0 && (
                              <p className="text-[10px] font-black text-red-600 uppercase tracking-wide">
                                ⏰ ¡Tiempo agotado!
                              </p>
                            )}
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider leading-none">Referencia Bíblica</p>
                            <p className="text-sm font-serif font-bold italic text-stone-900 leading-tight mt-0.5">{currentQuestion.reference}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-400 italic shrink-0">RVR1960</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => getRandomQuestion(currentPeriod || 'SURPRISE')}
                          className="flex-1 py-3 px-4 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-amber-500/30"
                        >
                          <span>Siguiente Pregunta</span>
                          <Sparkles size={16} className="text-amber-400" />
                        </button>
                        <button 
                          onClick={() => setCurrentQuestion(null)}
                          className="px-3.5 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center justify-center cursor-pointer border border-stone-200"
                          title="Cambiar de Periodo"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showAnswer && (
                  <button 
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-3 bg-bible-gold text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    <Eye size={18} />
                    <span>Revelar Respuesta</span>
                  </button>
                )}
                {Object.values(gameStats).some((stat: any) => stat.total > 0) && (
                  <button
                    onClick={() => {
                      setEndTime(Date.now());
                      setShowFinalSummary(true);
                    }}
                    className="w-full mt-2 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 font-bold rounded-xl text-xs border border-red-800/40 transition cursor-pointer"
                  >
                    Finalizar Partida y Ver Resultados
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer / Stats (Subtle) */}
      <footer className="p-6 text-center text-stone-400 text-xs uppercase tracking-[0.2em] font-medium">
        Total de Preguntas: {ALL_QUESTIONS.length}
      </footer>

      {/* 🧭 GUÍA EN VIVO CON PUNTERO DINÁMICO EN LA PANTALLA REAL (TRIVIA) */}
      <LiveInteractivePointerTour
        mode="TRIVIA"
        isActive={!isTutorialCompleted("TRIVIA")}
        onFinish={() => {}}
        playSound={playSound}
        triggerHaptic={triggerHaptic}
        steps={[
          {
            title: "1. Selecciona tu Período o Tema Bíblico",
            instruction: "Toca una de las tarjetas de períodos bíblicos (El Principio, La Ley, Reyes, Jesús, etc.) para cargar sus preguntas.",
            position: "top",
            handEmoji: "👇"
          },
          {
            title: "2. Lee la Pregunta y Elige tu Respuesta",
            instruction: "Selecciona una de las 4 opciones antes de que se agote el tiempo (si está activo).",
            position: "top",
            handEmoji: "📖"
          },
          {
            title: "3. Aprende de las Citas y Multiplica tu Racha",
            instruction: "Cada respuesta correcta suma puntos a tu ranking ELO y racha. Si fallas, lee la cita bíblica para memorizarla.",
            position: "bottom",
            handEmoji: "🔥"
          }
        ]}
      />
    </div>
      )}

      {/* MODALES GLOBALES (ACCESIBLES EN HOME, TABLERO Y TRIVIA) */}

      {/* 📖 Instructions Modal */}
      {showInstructions && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setShowInstructions(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto parchment-shadow border border-stone-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-md p-6 border-b border-stone-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <BookOpen className="text-bible-gold" size={24} />
                <h2 className="text-2xl font-sans font-bold text-stone-900">Instrucciones del Juego</h2>
              </div>
              <button 
                onClick={() => setShowInstructions(false)}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <XCircle size={24} className="text-stone-400" />
              </button>
            </div>
            <div className="p-8 space-y-8 font-sans text-stone-700 leading-relaxed">
              <section className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Introducción</h3>
                <p>
                  Bienvenido/a a la aventura más fascinante y trascendente de toda la humanidad. En este recorrido por las seis etapas de la historia bíblica, avanzarás destacando los momentos más importantes del trato de Dios con su pueblo.
                </p>
                <p>
                  Tu objetivo es llegar a la <strong>META</strong> más rápido que tus compañeros, respondiendo preguntas de la Biblos App y utilizando las capacidades especiales de los personajes contenidos en las <strong>Biblos Card</strong>.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Preparación y Comienzo</h3>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Coloca el tablero sobre una superficie plana y las fichas en la salida.</li>
                  <li>Reparte <strong>seis (6) Biblos Card</strong> a cada jugador. Deben mantenerse en secreto.</li>
                  <li>Escoge el modo de juego en la App: Principiante, Intermedio o Avanzado.</li>
                  <li>Se tira un dado para determinar quién inicia (la cantidad más alta). El juego continúa en dirección a las agujas del reloj.</li>
                </ol>
              </section>

              <section className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Mecánica de Juego</h3>
                <p>Al caer en una casilla, el jugador debe realizar la acción indicada:</p>
                <div className="space-y-4 pl-2">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 shrink-0 mt-1" />
                    <div>
                      <strong>Puntos Azules:</strong> Se debe responder una pregunta de la Biblos App del período correspondiente. Si aciertas, avanzas los pasos indicados; si fallas, retrocedes la misma cantidad.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 shrink-0 mt-1 flex items-center justify-center text-[10px] text-white font-bold">!</div>
                    <div>
                      <strong>Un turno sin jugar:</strong> El jugador pierde su siguiente turno, a menos que use una Biblos Card que evite el castigo.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 shrink-0 mt-1 flex items-center justify-center text-[10px] text-white font-bold">↔</div>
                    <div>
                      <strong>Adelanta o Retrocede:</strong> El jugador debe mover su ficha los pasos que la casilla indique.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 shrink-0 mt-1 flex items-center justify-center text-[10px] text-white font-bold">🎲</div>
                    <div>
                      <strong>Lanza de nuevo:</strong> El jugador tira el dado otra vez y avanza, con el riesgo de caer en una nueva casilla de acción o pregunta.
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Uso de las Biblos Card</h3>
                <ul className="list-disc pl-5 space-y-3">
                  <li>Se pueden usar para aplicar castigos (⚔), defenderse (🛡), aplicar misericordia (❤) o ganar beneficios propios.</li>
                  <li>Solo se puede usar <strong>una (1) carta por ronda</strong> durante tu turno, excepto para defenderte de un ataque.</li>
                  <li>Al pasar de un período bíblico a otro, recibes una nueva carta del mazo (solo la primera vez, máximo 5 adicionales en el juego).</li>
                  <li>Al usar una carta, esta se pierde y se coloca boca arriba al lado del mazo.</li>
                  <li>Algunas cartas están limitadas a una época específica (identificadas con un punto del color de la carta al lado del nombre).</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900 border-b border-stone-100 pb-2">Reglas de la Meta</h3>
                <ul className="list-disc pl-5 space-y-3">
                  <li>Al estar a <strong>5 pasos de la meta</strong>, sacar un 6 equivale a doble y se debe volver a tirar.</li>
                  <li>Si sacas tres dobles seguidos (<strong>666</strong>), debes volver al Principio del Nuevo Testamento (Casilla 50).</li>
                  <li>El primer jugador en llegar a la META gana. Los demás pueden seguir jugando por el segundo y tercer lugar.</li>
                  <li>El ganador debe entregar sus cartas sobrantes al jugador más cercano a la meta.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ℹ️ About Modal */}
      {showAbout && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setShowAbout(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full parchment-shadow border border-stone-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-cyan-800 p-8 text-white text-center space-y-4 relative">
              <button 
                onClick={() => setShowAbout(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <XCircle size={24} />
              </button>
              <div className="w-20 h-20 bg-cyan-800 rounded-3xl mx-auto flex items-center justify-center shadow-xl">
                <img
                  src="/logo.png"
                  alt="Biblos Logo"
                  className="w-23 h-23 object-contain"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold font-['Helvetica_Neue'] uppercase tracking-tight">Biblos Games</h2>
                <p className="text-sm font-serif italic opacity-90">El Juego de la Biblia</p>
              </div>
            </div>
            <div className="p-8 space-y-6 text-center">
              <p className="font-serif text-stone-600 leading-relaxed italic">
                "Una herramienta educativa ideal para divertir, aprender y compartir de una manera dinámica mientras se utiliza la Palabra de Dios."
              </p>
              
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <p className="text-stone-400 uppercase tracking-widest text-[10px] font-bold">Diseño</p>
                    <p className="text-stone-700 font-medium">Alexander Palacio Espiritusanto</p>
                  </div>
                  <div className="text-left">
                    <p className="text-stone-400 uppercase tracking-widest text-[10px] font-bold">Versión</p>
                    <p className="text-stone-700 font-medium">Beta 2026</p>
                  </div>
                </div>
                
                <div className="text-left pt-2">
                  <p className="text-stone-400 uppercase tracking-widest text-[10px] font-bold">Producción</p>
                  <p className="text-stone-700 font-medium">Biblos Papelería y Librería Cristiana SRL</p>
                  <p className="text-stone-500 text-xs">Higüey, República Dominicana</p>
                  <a
                    href="mailto:biblosgames@gmail.com"
                    className="text-stone-500 text-xs hover:text-bible-gold transition-colors"
                  >
                    Mail: biblosgames@gmail.com
                  </a>
                </div>

                {/* 📜 ATRIBUCIÓN LEGAL DE DERECHOS DE TEXTO BÍBLICO (REINA-VALERA 1960) */}
                <div className="text-left pt-3 border-t border-stone-150 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <p className="text-stone-500 uppercase tracking-widest text-[9px] font-bold">
                    Aviso Legal de Texto Bíblico
                  </p>
                  <p className="text-[11px] text-stone-600 leading-relaxed mt-1">
                    Las citas y referencias bíblicas contenidas en este juego corresponden a la versión <strong>Reina-Valera 1960 (RVR1960)</strong> © Sociedades Bíblicas Unidas, utilizadas con propósitos educativos y de estudio espiritual conforme a las pautas de uso de citas bíblicas. Todos los derechos reservados.
                  </p>
                </div>

                {/* 🛡️ CENTRO LEGAL, PRIVACIDAD Y DERECHOS DE USUARIO */}
                <div className="pt-2 grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setLegalPolicyInitialDoc("PRIVACY");
                      setShowLegalPoliciesModal(true);
                      playSound("select");
                    }}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer border border-stone-300"
                  >
                    🛡️ Privacidad
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalPolicyInitialDoc("TERMS");
                      setShowLegalPoliciesModal(true);
                      playSound("select");
                    }}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer border border-stone-300"
                  >
                    📜 Términos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalPolicyInitialDoc("MINORS_POLICY");
                      setShowLegalPoliciesModal(true);
                      playSound("select");
                    }}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer border border-stone-300"
                  >
                    👶 Menores
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-stone-400 pt-2">Biblos Games · Todos los derechos reservados © 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* 👤 User Profile Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            id="user-profile-card"
            className="bg-[#2A2621] border-2 border-amber-600/50 rounded-3xl max-w-md w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
              {/* Header con Avatar y Edición de Nombre */}
              <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 p-4 sm:p-5 text-center relative border-b border-amber-900/40 shrink-0">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white cursor-pointer z-10"
                  title="Cerrar"
                >
                  <XCircle size={24} />
                </button>
                
                {/* Avatar con botón de cambio */}
                <div className="flex flex-col items-center mb-2">
                  <div className="relative group cursor-pointer" onClick={() => setShowAvatarSelector(!showAvatarSelector)}>
                    {userProfileState.avatar.startsWith('/') ? (
                      <img src={userProfileState.avatar} alt="Avatar" className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-amber-400 shadow-xl group-hover:brightness-110 transition" />
                    ) : (
                      <div className="text-4xl sm:text-5xl">{userProfileState.avatar}</div>
                    )}
                    <span className="absolute bottom-0 right-0 bg-amber-500 text-amber-950 p-1 rounded-full text-[9px] shadow border border-amber-300 font-bold">✏️</span>
                  </div>
                  <button
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    className="mt-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                  >
                    {showAvatarSelector ? "Ocultar Galería ▲" : "Cambiar Personaje Bíblico ▼"}
                  </button>
                </div>

                <div className="flex flex-col items-center gap-1.5 w-full">
                  <div className="flex items-center justify-center gap-2 w-full max-w-xs">
                    <span className="text-2xl shrink-0 select-none">{userProfileState.countryFlag || '🇩🇴'}</span>
                    <input
                      type="text"
                      value={userProfileState.name}
                      onChange={(e) => {
                        const updated = { ...userProfileState, name: e.target.value };
                        setUserProfileState(updated);
                        saveUserProfile(updated);
                      }}
                      className="bg-black/40 border border-amber-700/50 rounded-xl px-3 py-1 text-center font-bold text-base sm:text-lg text-amber-200 focus:outline-none focus:border-amber-400 flex-1 shadow-inner"
                      placeholder="Tu Nombre"
                    />
                  </div>

                  {/* Selector de País de Origen */}
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">País:</span>
                    <select
                      value={userProfileState.country || 'DO'}
                      onChange={(e) => {
                        const selected = COUNTRIES.find(c => c.code === e.target.value);
                        if (selected) {
                          const updated = {
                            ...userProfileState,
                            country: selected.code,
                            countryFlag: selected.flag
                          };
                          setUserProfileState(updated);
                          saveUserProfile(updated);
                        }
                      }}
                      className="bg-black/60 border border-amber-600/50 rounded-lg px-2 py-0.5 text-xs font-bold text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                    >
                      {COUNTRIES.map(country => (
                        <option key={country.code} value={country.code} className="bg-[#2A2621] text-amber-100">
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1">Toca para editar tu nombre y país</p>

                {/* Selección de Avatar de Personajes Bíblicos Ilustrados (Colapsable) */}
                <AnimatePresence>
                  {showAvatarSelector && (
                    <motion.div
                      key="avatar-selector"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden border-t border-amber-900/40 pt-2.5 max-h-48 overflow-y-auto custom-scrollbar"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Elige tu Personaje Bíblico</p>
                        <span className="text-[8px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded border border-stone-700">
                          {isUserPremium() ? '👑 14 Disponibles' : '🆓 6 Free · 8 VIP 🔒'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {BIBLE_AVATARS.map(avatar => {
                          const isVipUser = isUserPremium();
                          const isLocked = avatar.isPremium && !isVipUser;
                          const isSelected = userProfileState.avatar === avatar.imagePath;

                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => {
                                if (isLocked) {
                                  playSound('loss');
                                  triggerHaptic('warning');
                                  setFriendInviteNotification('👑 Este personaje es exclusivo del Plan Premium VIP. ¡Activa VIP para desbloquear todos los avatares bíblicos!');
                                  return;
                                }
                                playSound('select');
                                triggerHaptic('light');
                                const updated = { 
                                  ...userProfileState, 
                                  avatar: avatar.imagePath, 
                                  name: userProfileState.name === 'Jugador Bíblico' ? avatar.name : userProfileState.name 
                                };
                                setUserProfileState(updated);
                                saveUserProfile(updated);
                                setShowAvatarSelector(false);
                              }}
                              className={`p-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center relative ${
                                isLocked
                                  ? 'bg-black/40 border-stone-800 opacity-60 hover:opacity-80 cursor-pointer'
                                  : isSelected
                                  ? 'bg-amber-500/30 border-amber-400 scale-105 shadow-md shadow-amber-500/20 ring-2 ring-amber-400 cursor-pointer'
                                  : 'bg-black/20 border-stone-800 hover:bg-white/5 hover:border-stone-700 cursor-pointer'
                              }`}
                            >
                              <div className="relative">
                                <img src={avatar.imagePath} alt={avatar.name} className={`w-9 h-9 rounded-full object-cover shadow ${isLocked ? 'grayscale-[40%]' : ''}`} />
                                {avatar.isPremium && (
                                  <span className={`absolute -top-1 -right-1 text-[8px] font-black px-1 py-0.2 rounded-full border shadow-sm ${
                                    isLocked
                                      ? 'bg-stone-900 text-amber-400 border-amber-500/50'
                                      : 'bg-amber-500 text-amber-950 border-amber-300'
                                  }`}>
                                    {isLocked ? '🔒' : '👑'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-amber-200 mt-1 leading-tight">{avatar.name}</span>
                              <span className="text-[7px] text-stone-400 leading-none">
                                {isLocked ? 'Plan VIP' : avatar.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Cuerpo Desplazable: Estadísticas, Rango y Login */}
              <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
                {/* 🛡️ ESTADO DEL PLAN: NIVEL DE ACCESO Y DISPONIBILIDAD DE PREGUNTAS */}
                {(() => {
                  const isPrem = isUserPremium();
                  const totalQuestions = BASE_QUESTIONS_COUNT + customQuestionsCount;
                  const availableCount = isPrem ? totalQuestions : Math.round(totalQuestions * 0.60);
                  const percentage = isPrem ? 100 : 60;

                  return (
                    <div className={`p-3.5 rounded-2xl border-2 transition shadow-xl relative overflow-hidden text-left ${
                      isPrem
                        ? 'bg-gradient-to-r from-amber-950/80 via-yellow-950/60 to-amber-900/80 border-amber-400/80'
                        : 'bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border-stone-700/80'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 mb-2.5 border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{isPrem ? '👑' : '📜'}</span>
                          <div>
                            <span className="text-[9px] uppercase font-black tracking-widest block text-stone-400">
                              Membresía del Jugador
                            </span>
                            <h4 className={`text-sm font-black uppercase tracking-wide flex items-center gap-1.5 ${
                              isPrem ? 'text-amber-300' : 'text-stone-200'
                            }`}>
                              <span>{isPrem ? 'Plan Premium VIP' : 'Plan Free (Gratis)'}</span>
                            </h4>
                          </div>
                        </div>

                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                          isPrem
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 ring-1 ring-amber-400/30'
                            : 'bg-stone-800 text-stone-300 border-stone-600'
                        }`}>
                          {isPrem ? 'Acceso Total' : 'Acceso Limitado'}
                        </span>
                      </div>

                      {/* Métricas del Plan */}
                      <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold block">Disponibilidad</span>
                          <span className={`text-sm font-black font-mono flex items-center gap-1 ${
                            isPrem ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            <span>{percentage}% del Catálogo</span>
                          </span>
                          <span className="text-[9px] text-stone-400 block font-mono">
                            {availableCount} de {totalQuestions} preguntas
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-stone-400 uppercase font-bold block">Temáticas</span>
                          <span className={`text-xs font-black block mt-0.5 ${
                            isPrem ? 'text-emerald-300' : 'text-stone-300'
                          }`}>
                            {isPrem ? 'Todas Desbloqueadas' : 'Periodos Bíblicos'}
                          </span>
                          <span className="text-[8px] text-stone-400 block">
                            {isPrem ? '100% Modos Libres' : 'Demás temas con candado 🔒'}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progreso de Preguntas */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-stone-400">
                          <span>Banco de Preguntas Activo:</span>
                          <span className="font-bold text-amber-300">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700/80">
                          <div
                            className={`h-full transition-all duration-700 rounded-full ${
                              isPrem
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Botón Alternar Plan Free / Premium VIP para Pruebas */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playSound('select');
                            const current = getUserProfile();
                            const updated = {
                              ...current,
                              isPremium: true,
                              premiumUnlockedAt: new Date().toISOString()
                            };
                            saveUserProfile(updated);
                            setUserProfileState(updated);
                            ALL_QUESTIONS = getQuestionsForUser(true).questions;
                            confetti({ particleCount: 80, spread: 80 });
                            setFriendInviteNotification('👑 ¡Plan Premium VIP Activado! (100% Preguntas, Todas las Temáticas y Estudio Bíblico Desbloqueado).');
                          }}
                          className={`py-2 px-2 text-[11px] font-black uppercase tracking-wider rounded-xl shadow transition transform active:scale-95 flex items-center justify-center gap-1 border cursor-pointer ${
                            isPrem
                              ? 'bg-amber-500 text-amber-950 border-amber-300 ring-2 ring-amber-400'
                              : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
                          }`}
                        >
                          <Crown size={13} />
                          <span>Activar VIP (100%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playSound('select');
                            const prof = getUserProfile();
                            const updated = { ...prof, isPremium: false };
                            saveUserProfile(updated);
                            setUserProfileState(updated);
                            ALL_QUESTIONS = getQuestionsForUser(false).questions;
                            setFriendInviteNotification('🔒 Cambiado a Plan Free (60% Preguntas y Acceso Limitado).');
                          }}
                          className={`py-2 px-2 text-[11px] font-black uppercase tracking-wider rounded-xl shadow transition transform active:scale-95 flex items-center justify-center gap-1 border cursor-pointer ${
                            !isPrem
                              ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400'
                              : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500'
                          }`}
                        >
                          <Lock size={12} />
                          <span>Probar Modo Free</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* RANGO BÍBLICO Y RATING ELO */}
                {(() => {
                  const rankInfo = getNextRankTierInfo(userProfileState.rating || 1000);
                  return (
                    <div className="bg-gradient-to-r from-amber-950/70 via-stone-900 to-amber-950/70 p-3.5 rounded-2xl border border-amber-500/40 text-center space-y-2 shadow-lg">
                      <span className="text-[9px] uppercase tracking-widest text-amber-400 font-black block">
                        Rango Bíblico Actual
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">{rankInfo.currentTier.icon}</span>
                        <h3 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wide">
                          Nivel {rankInfo.currentTier.level}: {rankInfo.currentTier.title}
                        </h3>
                      </div>

                      {/* Barra y detalle sutil de puntos que faltan para el siguiente nivel */}
                      {rankInfo.nextTier ? (
                        <div className="bg-black/40 p-2 rounded-xl border border-amber-500/20 space-y-1 text-left">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-stone-300 font-bold flex items-center gap-1">
                              <span>Próximo:</span>
                              <strong className="text-amber-300">{rankInfo.nextTier.icon} {rankInfo.nextTier.title}</strong>
                            </span>
                            <span className="text-amber-400 font-mono font-bold">
                              Faltan {rankInfo.pointsNeeded} pts
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${rankInfo.progressPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono">
                            <span>{userProfileState.rating || 1000} pts</span>
                            <span>Meta: {rankInfo.nextTier.minRating} pts</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-1 px-2 bg-amber-500/10 rounded-lg border border-amber-500/30 text-[10px] text-amber-300 font-bold">
                          👑 ¡Has alcanzado el rango máximo de Maestro de la Biblia!
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-4 text-xs pt-1 border-t border-stone-800">
                        <span className="text-stone-300 font-bold">
                          🏆 Rating ELO: <strong className="text-amber-400 font-mono">{userProfileState.rating || 1000} pts</strong>
                        </span>
                        <span className="text-stone-300 font-bold">
                          ⚡ Récord Carrera: <strong className="text-emerald-400 font-mono">{userProfileState.bestSoloScore || 0} pts</strong>
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* 🧠 WIDGET BIBLOS COACH INTEGRADO EN EL PERFIL ("Biblos te conoce") */}
                <BiblosCoachWidget
                  userName={userProfileState?.name || 'Jugador Bíblico'}
                />

                {/* 🏆 ESCALA DE RANGOS BÍBLICOS & RECOMPENSAS POR NIVEL */}
                <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-stone-800 space-y-2.5 text-left shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
                      🏆 Escala de Rangos Bíblicos & Recompensas
                    </span>
                    <span className="text-[9px] text-amber-300 font-bold flex items-center gap-1">
                      <span>🎁</span> Recompensas de Nivel
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {RANK_TIERS.map(tier => {
                      const userRating = userProfileState?.rating || 1000;
                      const userTier = getRankTier(userRating);
                      const isCurrent = userTier.level === tier.level;
                      const isUnlocked = userTier.level >= tier.level;

                      return (
                        <div
                          key={tier.level}
                          className={`p-2 rounded-xl border flex items-center justify-between transition ${
                            isCurrent
                              ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                              : isUnlocked
                              ? 'bg-stone-950/60 border-amber-500/30 text-stone-300'
                              : 'bg-stone-950/30 border-stone-800/80 text-stone-500 opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{tier.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-black truncate ${isCurrent ? 'text-amber-200' : isUnlocked ? 'text-stone-200' : 'text-stone-400'}`}>
                                  Nivel {tier.level}: {tier.title}
                                </span>
                                {isCurrent && (
                                  <span className="text-[8px] bg-amber-500 text-amber-950 px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider shrink-0">
                                    Tu Rango
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-stone-400 font-mono block">
                                {tier.minRating} {tier.maxRating < 99999 ? `- ${tier.maxRating} pts` : 'pts en adelante'}
                              </span>
                            </div>
                          </div>

                          {/* 🎁 Icono de regalo con la cantidad de talentos que ganará al llegar a ese nivel */}
                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <div className={`px-2 py-1 rounded-lg border flex items-center gap-1 font-mono font-black text-[10px] ${
                              isUnlocked
                                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-sm'
                            }`}>
                              <span className="text-xs">🎁</span>
                              <span>+{tier.rewardTalents}</span>
                              <GoldCoinIcon className="w-3.5 h-3.5 inline" />
                            </div>
                            <span className="text-xs">
                              {isUnlocked ? '✅' : '🔒'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 🪙 BANCO DE FE: SALDO DE TALENTOS & RECARGA DIARIA (DENTRO DEL PERFIL) */}
                <div className="bg-gradient-to-b from-[#251B0F] via-[#1B140B] to-[#120E07] p-3.5 rounded-2xl border-2 border-amber-500/70 text-center space-y-2.5 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 font-serif">
                      🪙 Banco de Fe
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/40 font-mono">
                      Mateo 25
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 rounded-xl border border-amber-500/50 shadow-inner">
                    <div className="text-left">
                      <span className="text-[9px] text-amber-400 uppercase font-black tracking-wider block">Talentos Disponibles</span>
                      <p className="text-2xl sm:text-3xl font-black text-amber-300 font-mono leading-none mt-0.5 flex items-center gap-1.5">
                        <GoldCoinIcon className="w-7 h-7" /> <span className="text-amber-200">{userTalents}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-emerald-400 font-bold uppercase block">Recarga Diaria (+6 🪙)</span>
                      <span className="text-xs font-mono font-bold text-stone-300 block mt-0.5">
                        {talentRefillInfo.canClaim ? '¡Lista!' : talentRefillInfo.formatted}
                      </span>
                    </div>
                  </div>

                  {/* Botón Reclamar Recarga Diaria si está lista y no ha llegado al tope */}
                  {talentRefillInfo.canClaim && !talentRefillInfo.isCapped && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = checkAndApplyDailyRefill();
                        if (res.applied) {
                          playSound("correct");
                          triggerHaptic("success");
                          setUserTalents(res.newBalance);
                          confetti({ particleCount: 50, spread: 60 });
                        }
                      }}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-emerald-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg animate-pulse transition cursor-pointer"
                    >
                      🕊️ ¡Reclamar Bendición Diaria (+6 Talentos)!
                    </button>
                  )}
                  {talentRefillInfo.isCapped && (
                    <div className="p-2 bg-stone-900 rounded-xl border border-stone-800 text-center text-[10px] text-stone-400 font-bold">
                      <span>🔒 Tope diario de 30 talentos alcanzado. ¡Juega y compite para seguir ganando más!</span>
                    </div>
                  )}

                  {/* Acciones para ganar más talentos */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileModal(false);
                        setShowOnlineModal(true);
                        setOnlineSubTab('FRIENDS');
                      }}
                      className="p-2 bg-stone-900 hover:bg-stone-800 rounded-xl border border-amber-500/40 text-left cursor-pointer transition flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-[10px] font-black text-amber-300 group-hover:text-amber-200 block">Invitar Amigos</span>
                        <span className="text-[8px] text-stone-400 font-bold">+3 Talentos</span>
                      </div>
                      <Users size={14} className="text-amber-400 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        playSound("select");
                        const myCode = `BIBLOS-${(userProfileState.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfileState.rating || 1000) % 9000)}`;
                        const inviteUrl = generateFriendInviteUrl({
                          name: userProfileState.name || 'Jugador Bíblico',
                          code: myCode,
                          avatar: userProfileState.avatar || '/avatars/david.jpg',
                          country: userProfileState.country || 'DO',
                          countryFlag: userProfileState.countryFlag || '🇩🇴'
                        });
                        const bonus = claimSocialShareBonus();
                        if (bonus.success) {
                          setUserTalents(bonus.newBalance);
                          confetti({ particleCount: 50, spread: 60 });
                        }
                        await shareFriendInviteCard(userProfileState.name || 'Jugador Bíblico', inviteUrl);
                      }}
                      className="p-2 bg-stone-900 hover:bg-stone-800 rounded-xl border border-amber-500/40 text-left cursor-pointer transition flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-[10px] font-black text-emerald-300 group-hover:text-emerald-200 block">Compartir Tarjeta</span>
                        <span className="text-[8px] text-stone-400 font-bold">+2 Talentos</span>
                      </div>
                      <Share2 size={14} className="text-emerald-400 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Precisión */}
                <div className="text-center bg-amber-950/40 p-3 rounded-2xl border border-amber-900/30">
                  <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Nivel de Precisión Total</p>
                  <p className="text-3xl font-black text-emerald-400 mt-0.5">{userProfileState.accuracy}%</p>
                  <div className="w-full bg-stone-800 h-2 rounded-full mt-2 overflow-hidden border border-stone-700">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-700 rounded-full"
                      style={{ width: `${userProfileState.accuracy}%` }}
                    />
                  </div>
                </div>

                {/* Estadísticas de Respuestas */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
                    <p className="text-[9px] text-stone-400 uppercase font-bold">Respuestas Correctas</p>
                    <p className="text-lg font-bold text-amber-200 mt-0.5">{userProfileState.correctAnswers}</p>
                  </div>
                  <div className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
                    <p className="text-[9px] text-stone-400 uppercase font-bold">Total Respondidas</p>
                    <p className="text-lg font-bold text-amber-200 mt-0.5">{userProfileState.totalAnswered}</p>
                  </div>
                </div>

                {/* 🏆 TROFEOS Y LOGROS ALCANZADOS EN LA COPA BIBLOS */}
                <div className="bg-gradient-to-b from-[#2A2012] via-[#1D160D] to-[#120E08] p-3.5 rounded-2xl border-2 border-amber-500/60 text-center space-y-2.5 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 font-serif">
                      🏆 Logros Copa Biblos
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/40 font-mono">
                      Torneo de Campeones
                    </span>
                  </div>

                  {/* Resumen de Copas Ganadas */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-stone-950/80 rounded-xl border border-amber-400/50 text-center">
                      <span className="text-xl">🏆</span>
                      <p className="text-[9px] font-bold text-amber-300 mt-0.5 flex items-center justify-center gap-0.5">
                        Copa de Oro
                      </p>
                      <p className="text-sm font-mono font-black text-amber-200">
                        {userProfileState.copaBiblosTrophies?.filter(t => t.trophy === 'GOLD').length || 0}
                      </p>
                      <span className="text-[8px] text-amber-400 font-mono font-semibold">+50 🪙</span>
                    </div>
                    <div className="p-2 bg-stone-950/80 rounded-xl border border-amber-400/30 text-center">
                      <span className="text-xl">🏆</span>
                      <p className="text-[9px] font-bold text-slate-300 mt-0.5 flex items-center justify-center gap-0.5">
                        Copa de Plata
                      </p>
                      <p className="text-sm font-mono font-black text-slate-200">
                        {userProfileState.copaBiblosTrophies?.filter(t => t.trophy === 'SILVER').length || 0}
                      </p>
                      <span className="text-[8px] text-slate-400 font-mono font-semibold">+25 🪙</span>
                    </div>
                    <div className="p-2 bg-stone-950/80 rounded-xl border border-amber-400/30 text-center">
                      <span className="text-xl">🏆</span>
                      <p className="text-[9px] font-bold text-amber-600 mt-0.5 flex items-center justify-center gap-0.5">
                        Copa de Bronce
                      </p>
                      <p className="text-sm font-mono font-black text-amber-600">
                        {userProfileState.copaBiblosTrophies?.filter(t => t.trophy === 'BRONZE').length || 0}
                      </p>
                      <span className="text-[8px] text-amber-600/90 font-mono font-semibold">+15 🪙</span>
                    </div>
                  </div>

                  {/* Títulos y Mejor Rango Histórico */}
                  {userProfileState.copaBiblosBestRank && userProfileState.copaBiblosBestRank < 999 && (
                    <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30 text-left text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                        <span>Mejor Posición Histórica: #{userProfileState.copaBiblosBestRank}</span>
                        <span>{userProfileState.copaBiblosTitles?.length || 0} Títulos</span>
                      </div>
                      {userProfileState.copaBiblosTitles && userProfileState.copaBiblosTitles.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {userProfileState.copaBiblosTitles.map((title, idx) => (
                            <span key={idx} className="text-[9px] bg-stone-900 text-amber-200 px-2 py-0.5 rounded-md border border-amber-500/40 font-semibold">
                              {title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lista de Ediciones Jugadas */}
                  {userProfileState.copaBiblosTrophies && userProfileState.copaBiblosTrophies.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pt-1 text-left">
                      {userProfileState.copaBiblosTrophies.map((ach) => (
                        <div key={ach.id} className="p-2 bg-stone-950/70 rounded-xl border border-stone-800 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏆</span>
                            <div>
                              <p className="font-bold text-amber-200 leading-tight">{ach.trophyName}</p>
                              <p className="text-[9px] text-stone-400">
                                {ach.tournamentDate} · Precisión: <strong className="text-emerald-400">{ach.accuracy}%</strong>
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-amber-400 text-xs shrink-0 flex items-center gap-1">
                            +{ach.rewardTalents} <GoldCoinIcon className="w-3.5 h-3.5 inline" />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-stone-400 italic text-center py-1">
                      Aún no has participado en una edición dominical de La Copa Biblos.
                    </p>
                  )}
                </div>

                {/* ⚙️ SECCIÓN DE AJUSTES RÁPIDOS Y BOTÓN EXCLUSIVO DE ADMINISTRADOR */}
                <div className="bg-stone-900/90 p-3 rounded-2xl border border-amber-500/30 text-left space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Settings size={14} /> Ajustes y Preferencias
                    </span>
                    <span className="text-[10px] text-stone-400">Configuración</span>
                  </div>

                  {/* Interruptores de Audio y Notificaciones */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isSoundOn;
                        setIsSoundOn(next);
                        if (next) playSound('select');
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        isSoundOn ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-stone-800 border-stone-700 text-stone-400'
                      }`}
                    >
                      <span className="flex items-center gap-1 font-bold text-[11px]">
                        {isSoundOn ? <Volume2 size={14} className="text-amber-400" /> : <VolumeX size={14} />} Sonido
                      </span>
                      <span className="text-[9px] font-black uppercase">{isSoundOn ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !userProfileState.copaBiblosNotificationEnabled;
                        const updated = {
                          ...userProfileState,
                          copaBiblosNotificationEnabled: next,
                          copaBiblosRegistered: next ? true : userProfileState.copaBiblosRegistered
                        };
                        setUserProfileState(updated);
                        saveUserProfile(updated);
                        if (isSoundOn) playSound('select');
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        userProfileState.copaBiblosNotificationEnabled
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                          : 'bg-stone-800 border-stone-700 text-stone-400'
                      }`}
                    >
                      <span className="flex items-center gap-1 font-bold text-[11px]">
                        {userProfileState.copaBiblosNotificationEnabled ? <BellRing size={14} className="text-emerald-400" /> : <Bell size={14} />} Avisos
                      </span>
                      <span className="text-[9px] font-black uppercase">{userProfileState.copaBiblosNotificationEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* BOTÓN EXCLUSIVO DE ADMINISTRADOR DE PREGUNTAS */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGlobalAdminPinModal(true);
                        setGlobalAdminEnteredPin('');
                        setGlobalAdminPinError('');
                        if (isSoundOn) playSound('select');
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 hover:from-amber-900 hover:to-stone-800 text-amber-300 text-[11px] font-bold rounded-xl border border-amber-500/40 transition flex items-center justify-between shadow-sm cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Database size={14} className="text-amber-400" />
                        <span>Base de Datos de Preguntas (Admin)</span>
                      </span>
                      <span className="text-[9px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-amber-200 border border-amber-500/30">
                        {BASE_QUESTIONS_COUNT + customQuestionsCount} preguntas
                      </span>
                    </button>
                  </div>
                </div>

                {/* 🔔 PANEL DE NOTIFICACIONES INTELIGENTES DE BIBLOS */}
                <div className="bg-stone-900/90 p-3 rounded-2xl border border-amber-500/40 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🔔</span>
                      <span>Notificaciones Inteligentes</span>
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        playSound("select");
                        if (!notificationSettingsState.enabled) {
                          const granted = await requestNotificationPermission();
                          const updated = { ...notificationSettingsState, enabled: granted };
                          setNotificationSettingsState(updated);
                          saveNotificationSettings(updated);
                          if (granted) checkAndTriggerSmartNotifications();
                        } else {
                          const updated = { ...notificationSettingsState, enabled: false };
                          setNotificationSettingsState(updated);
                          saveNotificationSettings(updated);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow cursor-pointer ${
                        notificationSettingsState.enabled
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {notificationSettingsState.enabled ? '✓ Activadas' : 'Activar'}
                    </button>
                  </div>

                  <p className="text-[10px] text-stone-400 leading-tight">
                    Recibe avisos clave sin saturarte (Copa Biblos, Desafío del día y avance de nivel):
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px] text-stone-300 font-medium">
                    <label className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettingsState.dailyChallengeReminder}
                        onChange={(e) => {
                          const updated = { ...notificationSettingsState, dailyChallengeReminder: e.target.checked };
                          setNotificationSettingsState(updated);
                          saveNotificationSettings(updated);
                        }}
                        className="rounded accent-amber-500"
                      />
                      <span>📖 Desafío Diario</span>
                    </label>

                    <label className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettingsState.copaBiblosReminder}
                        onChange={(e) => {
                          const updated = { ...notificationSettingsState, copaBiblosReminder: e.target.checked };
                          setNotificationSettingsState(updated);
                          saveNotificationSettings(updated);
                        }}
                        className="rounded accent-amber-500"
                      />
                      <span>🏆 Copa Biblos</span>
                    </label>

                    <label className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettingsState.levelProgressReminder}
                        onChange={(e) => {
                          const updated = { ...notificationSettingsState, levelProgressReminder: e.target.checked };
                          setNotificationSettingsState(updated);
                          saveNotificationSettings(updated);
                        }}
                        className="rounded accent-amber-500"
                      />
                      <span>⭐ Próximo Nivel</span>
                    </label>

                    <label className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettingsState.rankingReminder}
                        onChange={(e) => {
                          const updated = { ...notificationSettingsState, rankingReminder: e.target.checked };
                          setNotificationSettingsState(updated);
                          saveNotificationSettings(updated);
                        }}
                        className="rounded accent-amber-500"
                      />
                      <span>⚔️ Retos Ranking</span>
                    </label>
                  </div>
                </div>

                {/* ESTADO DE CUENTA Y VINCULACIÓN EN LA NUBE (GOOGLE / FACEBOOK / INVITADO) */}
                <div className="bg-stone-900/90 p-3 rounded-2xl border border-amber-500/30 text-center space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${userProfileState.authProvider ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                      {userProfileState.authProvider ? (
                        <span>Cuenta: <strong>{userProfileState.authProvider === 'google' ? 'Google' : 'Facebook'}</strong></span>
                      ) : (
                        <span>Jugando como <strong>Invitado</strong></span>
                      )}
                    </span>
                    <span className="text-[9px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md border border-stone-700 font-medium">
                      {userProfileState.authProvider ? 'Nube ☁️' : 'Local'}
                    </span>
                  </div>

                  {!userProfileState.authProvider ? (
                    <div className="space-y-1.5 pt-0.5">
                      <p className="text-[10px] text-stone-400 leading-tight">
                        Inicia sesión para guardar tu rating y récord en la nube:
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleLoginProvider('google')}
                          className="py-2 px-2.5 bg-white hover:bg-stone-100 text-stone-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition transform active:scale-95 border border-stone-300 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span>Google</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLoginProvider('facebook')}
                          className="py-2 px-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition transform active:scale-95 cursor-pointer"
                        >
                          <Facebook className="w-3.5 h-3.5 fill-current" />
                          <span>Facebook</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-xs">
                      <span className="text-stone-400 text-[10px] truncate max-w-[190px]">
                        Conectado: <strong>{userProfileState.name}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-semibold rounded-lg border border-stone-700 transition cursor-pointer"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Acciones Fija Inferior (Siempre Visible) */}
              <div className="p-3 bg-[#1E1B17] border-t border-amber-900/40 grid grid-cols-3 gap-2 shrink-0">
                <button
                  onClick={() => shareUserProfile(userProfileState)}
                  className="py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Share2 size={13} /> Compartir
                </button>
                <button
                  onClick={() => downloadUserProfileImage()}
                  className="py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-700/30 font-bold rounded-xl text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  📥 Descargar
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-md cursor-pointer"
                >
                  Guardar / Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* 🔒 Modal de PIN de Administrador para Base de Datos de Preguntas */}
      {showGlobalAdminPinModal && (
        <div className="fixed inset-0 z-[12000] bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in">
          <div className="bg-[#2A2621] border-2 border-amber-500 rounded-3xl p-5 max-w-xs w-full shadow-2xl text-stone-200 space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <Database size={24} />
            </div>

            <div>
              <h4 className="text-sm font-serif font-black text-amber-300 uppercase">
                Base de Datos de Preguntas
              </h4>
              <p className="text-[11px] text-stone-400 mt-1">
                Acceso exclusivo de creador. Ingresa tu PIN maestro:
              </p>
            </div>

            <input
              type="password"
              maxLength={8}
              value={globalAdminEnteredPin}
              onChange={e => setGlobalAdminEnteredPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerifyGlobalAdminPin()}
              placeholder="PIN (ej: 7777)"
              className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-center font-mono text-base font-bold text-amber-300 tracking-widest focus:outline-none focus:border-amber-400"
              autoFocus
            />

            {globalAdminPinError && (
              <p className="text-xs font-bold text-rose-400">{globalAdminPinError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleVerifyGlobalAdminPin}
                className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setShowGlobalAdminPinModal(false)}
                className="py-2 px-3 bg-stone-800 text-stone-300 font-bold text-xs rounded-xl border border-stone-700 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📚 Modal Maestro: Gestor y Alimentador de Preguntas del Juego */}
      {showQuestionsManagerModal && (
        <div className="fixed inset-0 z-[12000] bg-black/90 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center animate-fade-in">
          <div className="bg-[#2A2621] border-2 border-amber-500 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-stone-200">
            
            {/* Header del Gestor */}
            <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 p-3.5 sm:p-4 border-b border-amber-500/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-serif font-black text-amber-300 uppercase leading-tight">
                    Alimentador de Preguntas del Juego
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Añade preguntas al banco general sin actualizar en Play Store
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuestionsManagerModal(false)}
                className="p-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Contador de preguntas en vivo */}
            <div className="p-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400">Base: <strong className="text-stone-200">{BASE_QUESTIONS_COUNT}</strong></span>
                <span className="text-stone-600">•</span>
                <span className="text-[10px] text-amber-400">Agregadas: <strong>+{customQuestionsCount}</strong></span>
              </div>
              <div className="bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-300 font-mono font-bold text-xs">
                Total: {BASE_QUESTIONS_COUNT + customQuestionsCount} preguntas activas
              </div>
            </div>

            {/* Selector de Pestañas: JSON Masivo vs Formulario Rápido */}
            <div className="px-4 pt-3 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setQuestionsAdminTab('JSON')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  questionsAdminTab === 'JSON'
                    ? 'bg-amber-500 text-amber-950 font-black shadow'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                <FileText size={13} />
                <span>Pegar JSON Masivo</span>
              </button>
              <button
                type="button"
                onClick={() => setQuestionsAdminTab('FORM')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  questionsAdminTab === 'FORM'
                    ? 'bg-amber-500 text-amber-950 font-black shadow'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                <PlusCircle size={13} />
                <span>Formulario Rápido</span>
              </button>
            </div>

            {/* Contenido según pestaña */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
              {questionsAdminTab === 'JSON' ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-stone-300 leading-snug">
                    Pega aquí un array JSON con una o cientos de preguntas en el formato oficial de <em>questions.json</em>:
                  </p>
                  <textarea
                    value={jsonQuestionsInput}
                    onChange={e => setJsonQuestionsInput(e.target.value)}
                    rows={10}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl font-mono text-[11px] text-amber-200 focus:outline-none focus:border-amber-400 custom-scrollbar"
                    placeholder='[\n  {\n    "id": "q_nueva_1",\n    "mode": "HISTORIA",\n    "period": "El Principio",\n    "difficulty": "BASIC",\n    "question": "¿Quién construyó el arca?",\n    "options": ["Moisés", "Noé", "David", "Abraham"],\n    "correctAnswer": 1,\n    "reference": "Génesis 6:14"\n  }\n]'
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveQuestionsFromJson}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-amber-950 font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save size={15} />
                      <span>Guardar y Sumar Preguntas</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
                  <div>
                    <label className="text-[10px] font-bold text-amber-400 uppercase block mb-1">
                      Pregunta Bíblica:
                    </label>
                    <input
                      type="text"
                      value={formQQuestion}
                      onChange={e => setFormQQuestion(e.target.value)}
                      placeholder="Ej: ¿Quién fue el primer rey de Israel?"
                      className="w-full p-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-amber-400 uppercase block mb-1">
                      4 Opciones de Respuesta:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {formQOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            formQCorrect === idx ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const copy = [...formQOptions];
                              copy[idx] = e.target.value;
                              setFormQOptions(copy);
                            }}
                            placeholder={`Opción ${idx + 1}`}
                            className={`flex-1 p-1.5 bg-stone-950 border rounded-lg text-xs ${
                              formQCorrect === idx ? 'border-emerald-500' : 'border-stone-800'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">
                        Opción Correcta:
                      </label>
                      <select
                        value={formQCorrect}
                        onChange={e => setFormQCorrect(Number(e.target.value))}
                        className="w-full p-1.5 bg-stone-950 border border-stone-800 rounded-lg text-emerald-300 font-bold"
                      >
                        <option value={0}>Opción 1</option>
                        <option value={1}>Opción 2</option>
                        <option value={2}>Opción 3</option>
                        <option value={3}>Opción 4</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">
                        Dificultad:
                      </label>
                      <select
                        value={formQDifficulty}
                        onChange={e => setFormQDifficulty(e.target.value as any)}
                        className="w-full p-1.5 bg-stone-950 border border-stone-800 rounded-lg text-amber-300 font-bold"
                      >
                        <option value="BASIC">BASIC (25s)</option>
                        <option value="INTERMEDIATE">INTERMEDIO (20s)</option>
                        <option value="ADVANCED">AVANZADO (15s)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">
                        Periodo:
                      </label>
                      <select
                        value={formQPeriod}
                        onChange={e => setFormQPeriod(e.target.value as any)}
                        className="w-full p-1.5 bg-stone-950 border border-stone-800 rounded-lg text-stone-300 text-[11px]"
                      >
                        <option value={Period.PRINCIPIO}>El Principio</option>
                        <option value={Period.LEY}>La Ley</option>
                        <option value={Period.REYES_PROFETAS}>Reyes y Profetas</option>
                        <option value={Period.REDENCION}>Jesús / Redención</option>
                        <option value={Period.IGLESIA}>La Iglesia</option>
                        <option value={Period.TIEMPOS_FINALES}>Tiempos Finales</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">
                      Cita Bíblica de Referencia:
                    </label>
                    <input
                      type="text"
                      value={formQReference}
                      onChange={e => setFormQReference(e.target.value)}
                      placeholder="Ej: 1 Samuel 10:1"
                      className="w-full p-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSingleFormQuestion}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <PlusCircle size={15} />
                    <span>Añadir Pregunta a la Base de Datos</span>
                  </button>
                </div>
              )}

              {questionsManagerFeedback && (
                <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 text-center font-bold">
                  {questionsManagerFeedback}
                </div>
              )}
            </div>

            {/* Footer con Exportación y Reset */}
            <div className="p-3 bg-[#1E1B17] border-t border-amber-900/40 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  downloadFullQuestionsJSON();
                  if (isSoundOn) playSound('select');
                }}
                className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-xl border border-stone-700 flex items-center gap-1.5 cursor-pointer text-xs"
                title="Descargar el JSON completo con todas las preguntas para respaldo o subirlo a Supabase/GitHub"
              >
                <Download size={14} />
                <span>Descargar JSON Completo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Estás seguro de restablecer al banco original de 664 preguntas eliminando las agregadas manualmente?")) {
                    resetCustomQuestions();
                    reloadAllGameQuestions();
                    setQuestionsManagerFeedback("🔄 Se ha restablecido al banco original de 664 preguntas.");
                    if (isSoundOn) playSound('wrong');
                  }
                }}
                className="py-2 px-3 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold rounded-xl border border-rose-800/40 flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Trash2 size={14} />
                <span>Restablecer</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🏆 Leaderboard / Salón de la Fama Modal */}
      {showLeaderboardModal && (
        <div 
          className="fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowLeaderboardModal(false)}
        >
          <div 
            className="bg-[#2A2621] border-2 border-amber-600/50 rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 p-5 text-center relative border-b border-amber-900/40 shrink-0">
                <button 
                  onClick={() => setShowLeaderboardModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Crown className="text-amber-400" size={28} />
                  <h2 className="text-2xl font-bold text-amber-200 font-serif">Ranking & Salón de la Fama</h2>
                </div>
                <p className="text-xs text-stone-400">Sistema de Rating ELO y Récords de Solitario</p>

                {/* MODALIDAD DE RANKING: RATING COMPETITIVO VS AMIGOS VS CAMPEONES COPA BIBLOS VS SOLITARIO VS RANGOS */}
                <div className="flex justify-center gap-1.5 mt-4 overflow-x-auto pb-1 custom-scrollbar">
                  {[
                    { id: 'RATING', label: '👑 Mundial' },
                    { id: 'FRIENDS', label: '👥 Amigos' },
                    { id: 'COPA', label: '🏆 Copa Biblos' },
                    { id: 'SOLO', label: '⚡ Solitario' },
                    { id: 'TIERS', label: '📜 Rangos' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setLeaderboardTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                        leaderboardTab === tab.id
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-lg ring-1 ring-amber-400 font-black'
                          : 'bg-stone-800/80 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TARJETA DEL JUGADOR ACTUAL */}
              {(() => {
                const userTier = getRankTier(userProfileState.rating || 1000);
                return (
                  <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-amber-950/70 via-stone-900 to-amber-950/70 rounded-2xl border border-amber-500/40 flex items-center justify-between shadow-inner shrink-0">
                    <div className="flex items-center gap-3">
                      <img
                        src={userProfileState.avatar || '/avatars/david.jpg'}
                        alt="Avatar"
                        className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow"
                      />
                      <div className="text-left">
                        <p className="text-xs font-black text-amber-100 flex items-center gap-1.5">
                          <span>{userProfileState.name}</span>
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-900/60 px-1.5 py-0.2 rounded-full border border-amber-600/40">TÚ</span>
                        </p>
                        <p className="text-[11px] font-bold text-amber-300/90 flex items-center gap-1">
                          <span>{userTier.icon}</span>
                          <span>{userTier.title}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-stone-400">Tu Rating</p>
                      <p className="text-base font-black text-amber-300">{userProfileState.rating || 1000} <span className="text-[10px] text-amber-400 font-normal">pts</span></p>
                    </div>
                  </div>
                );
              })()}

              {/* CONTENIDO SEGÚN LA PESTAÑA */}
              <div className="p-4 max-h-[55vh] overflow-y-auto space-y-2.5 custom-scrollbar flex-1">
                {(() => {
                  const rawEntries = getLeaderboard();

                  // 1. VISTA DE RANGOS BÍBLICOS (CON ICONO DE REGALO Y RECOMPENSAS DE TALENTOS)
                  if (leaderboardTab === 'TIERS') {
                    const userRating = userProfileState.rating || 1000;
                    const userTier = getRankTier(userRating);

                    return (
                      <div className="space-y-2">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-0.5">
                          <p className="text-[11px] font-black uppercase text-amber-300 flex items-center justify-center gap-1">
                            <span>🎁</span> Recompensas de Talentos por Nivel
                          </p>
                          <p className="text-[10px] text-stone-300">
                            Alcanza los puntos de cada rango para desbloquear tu bendición de talentos automáticamente:
                          </p>
                        </div>

                        {RANK_TIERS.map((tier) => {
                          const isCurrent = userTier.level === tier.level;
                          const isUnlocked = userTier.level >= tier.level;

                          return (
                            <div
                              key={tier.level}
                              className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between transition ${
                                isCurrent
                                  ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400/60 shadow-lg'
                                  : isUnlocked
                                  ? 'bg-stone-900/80 border-stone-800'
                                  : 'bg-stone-950/40 border-stone-900 opacity-75'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-2xl shrink-0">{tier.icon}</span>
                                <div className="text-left min-w-0">
                                  <p className={`text-xs font-black ${tier.color} flex items-center gap-1.5 truncate`}>
                                    <span>Nivel {tier.level}: {tier.title}</span>
                                    {isCurrent && (
                                      <span className="text-[9px] bg-amber-500 text-amber-950 font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                                        Tu Rango
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-stone-400 font-mono">
                                    {tier.maxRating >= 99999 ? `${tier.minRating}+ pts` : `${tier.minRating} - ${tier.maxRating} pts`}
                                  </p>
                                </div>
                              </div>

                              {/* 🎁 ICONO DE REGALO CON LA CANTIDAD DE TALENTOS QUE GANARÁ AL LLEGAR A ESE NIVEL */}
                              <div className="flex items-center gap-2 shrink-0 pl-2">
                                <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-mono font-black text-xs ${
                                  isUnlocked
                                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                                    : 'bg-amber-950/50 border-amber-500/50 text-amber-300 shadow-sm'
                                }`}>
                                  <span className="text-sm">🎁</span>
                                  <span>+{tier.rewardTalents}</span>
                                  <GoldCoinIcon className="w-4 h-4 inline" />
                                </div>
                                <span className="text-sm">
                                  {isUnlocked ? '✅' : '🔒'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // 2. VISTA DE CAMPEONES DE LA COPA BIBLOS
                  if (leaderboardTab === 'COPA') {
                    const copaChampions = getCopaBiblosChampions();

                    return (
                      <div className="space-y-3">
                        <div className="p-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                            👑 Salón de Campeones · Torneo Mundial
                          </span>
                          <p className="text-xs text-stone-200">
                            Aquí se inmortalizan los ganadores del podio de cada edición de los domingos.
                          </p>
                        </div>

                        {copaChampions.length === 0 ? (
                          <div className="text-center py-10 text-stone-500 space-y-2">
                            <span className="text-4xl">🏆</span>
                            <p className="text-sm font-bold text-amber-200">¡Próxima Edición de la Copa Biblos en Camino!</p>
                            <p className="text-xs max-w-xs mx-auto">
                              Participa este domingo a las 3:00 PM (RD) para que tu nombre y avatar queden grabados para siempre en el Salón de la Fama.
                            </p>
                          </div>
                        ) : (
                          copaChampions.map((champ, idx) => (
                            <div
                              key={champ.id || idx}
                              className="p-3.5 bg-gradient-to-b from-[#2A2012] via-stone-900 to-[#1A140B] rounded-2xl border-2 border-amber-400/80 shadow-xl space-y-2.5 text-left"
                            >
                              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                                <div>
                                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                                    🏆 {champ.edition}
                                  </span>
                                  <span className="text-[9px] text-stone-400 font-medium">
                                    {champ.editionDate} · {champ.totalParticipants} Participantes
                                  </span>
                                </div>
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/40">
                                  Podio Oficial
                                </span>
                              </div>

                              {/* 🏆 CAMPEÓN (COPA DE ORO) */}
                              <div className="p-2.5 bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-500/25 rounded-xl border border-amber-400/60 flex items-center justify-between shadow-inner">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-2xl animate-bounce">🏆</span>
                                  <img
                                    src={champ.championAvatar || '/avatars/salomon.jpg'}
                                    alt={champ.championName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-amber-300 shadow"
                                  />
                                  <div>
                                    <p className="text-xs font-black text-amber-100 flex items-center gap-1">
                                      <span>{champ.championCountryFlag || '🇩🇴'}</span>
                                      <span>{champ.championName}</span>
                                      <span className="text-[8px] bg-amber-500 text-amber-950 px-1.5 py-0.2 rounded font-black uppercase">Copa de Oro</span>
                                    </p>
                                    <p className="text-[9px] text-amber-300 font-mono">
                                      ⚡ {champ.finalScore} pts · {champ.accuracy}% Precisión
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[11px] font-mono font-black text-amber-300 bg-black/40 px-2 py-1 rounded-lg border border-amber-400/40">
                                  +50 🪙
                                </span>
                              </div>

                              {/* 🥈 Y 🥉 SEGUNDO Y TERCER LUGAR (COPA DE PLATA Y BRONCE) */}
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="p-2 bg-stone-950/80 rounded-xl border border-slate-700/60 flex items-center gap-2">
                                  <span className="text-base">🏆</span>
                                  <div className="truncate">
                                    <p className="font-bold text-slate-200 truncate">
                                      {champ.secondPlaceCountryFlag || '🇲🇽'} {champ.secondPlaceName || 'Subcampeón'}
                                    </p>
                                    <span className="text-[8px] text-slate-400 font-mono">+25 🪙 Copa Plata</span>
                                  </div>
                                </div>

                                <div className="p-2 bg-stone-950/80 rounded-xl border border-amber-900/40 flex items-center gap-2">
                                  <span className="text-base">🏆</span>
                                  <div className="truncate">
                                    <p className="font-bold text-amber-500/90 truncate">
                                      {champ.thirdPlaceCountryFlag || '🇨🇴'} {champ.thirdPlaceName || '3er Lugar'}
                                    </p>
                                    <span className="text-[8px] text-amber-600/90 font-mono">+15 🪙 Copa Bronce</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  }

                  // 3. VISTA DE RATING COMPETITIVO (ORDENADO POR RATING ELO, CLASIFICABLE POR REGIÓN Y POR PAÍS)
                  if (leaderboardTab === 'RATING') {
                    // Mapeo de Regiones y sus países
                    const REGIONS: { [key: string]: { name: string; icon: string; countries: string[] } } = {
                      'CARIBE': { name: 'Caribe', icon: '🌴', countries: ['DO', 'PR', 'CU'] },
                      'CENTROAMERICA': { name: 'Centroamérica', icon: '🌋', countries: ['GT', 'SV', 'HN', 'NI', 'CR', 'PA'] },
                      'SURAMERICA': { name: 'Sudamérica', icon: '🏔️', countries: ['CO', 'VE', 'EC', 'PE', 'BO', 'CL', 'AR', 'PY', 'UY', 'BR'] },
                      'NORTEAMERICA': { name: 'Norteamérica', icon: '🗽', countries: ['US', 'CA', 'MX'] },
                      'EUROPA': { name: 'Europa', icon: '🏰', countries: ['ES', 'IT', 'DE', 'FR', 'GB'] },
                      'MEDIO_ORIENTE': { name: 'Tierra Santa', icon: '🕊️', countries: ['IL'] },
                    };

                    const sortedByRating = [...rawEntries].sort((a, b) => (b.rating || 1000) - (a.rating || 1000));

                    // Filtrado por región
                    let filteredByRegion = sortedByRating;
                    if (ratingRegionFilter !== 'TODAS' && REGIONS[ratingRegionFilter]) {
                      filteredByRegion = filteredByRegion.filter(e => {
                        const code = e.playerCountry || 'DO';
                        return REGIONS[ratingRegionFilter].countries.includes(code);
                      });
                    }

                    // Filtrado por país
                    let finalPlayers = filteredByRegion;
                    if (ratingCountryFilter !== 'TODOS') {
                      finalPlayers = finalPlayers.filter(e => (e.playerCountry || 'DO') === ratingCountryFilter);
                    }

                    // Extraer los países disponibles en los datos para el selector
                    const availableCountriesInRegion = COUNTRIES.filter(c => {
                      if (ratingRegionFilter === 'TODAS') return true;
                      return REGIONS[ratingRegionFilter]?.countries.includes(c.code);
                    });

                    return (
                      <div className="space-y-3">
                        {/* 🌐 CLASIFICACIÓN POR REGIÓN Y POR PAÍS */}
                        <div className="bg-stone-900/90 p-3 rounded-2xl border border-stone-800 space-y-2.5 shadow">
                          {/* 1. Selector de Regiones */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 flex items-center justify-between">
                              <span>🌎 1. Clasificar por Región:</span>
                              <span className="text-[9px] text-stone-400 font-normal">
                                {finalPlayers.length} Jugadores
                              </span>
                            </span>
                            <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                              {[
                                { id: 'TODAS', name: 'Mundial', icon: '🌐' },
                                { id: 'CARIBE', name: 'Caribe', icon: '🌴' },
                                { id: 'CENTROAMERICA', name: 'Centroamérica', icon: '🌋' },
                                { id: 'SURAMERICA', name: 'Sudamérica', icon: '🏔️' },
                                { id: 'NORTEAMERICA', name: 'Norteamérica', icon: '🗽' },
                                { id: 'EUROPA', name: 'Europa', icon: '🏰' },
                                { id: 'MEDIO_ORIENTE', name: 'Tierra Santa', icon: '🕊️' },
                              ].map(reg => (
                                <button
                                  key={reg.id}
                                  onClick={() => {
                                    setRatingRegionFilter(reg.id);
                                    setRatingCountryFilter('TODOS');
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                                    ratingRegionFilter === reg.id
                                      ? 'bg-amber-500 text-amber-950 font-black shadow ring-1 ring-amber-300'
                                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                                  }`}
                                >
                                  <span>{reg.icon}</span>
                                  <span>{reg.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Selector de Países */}
                          <div className="space-y-1 pt-1 border-t border-stone-800">
                            <span className="text-[10px] uppercase font-black tracking-wider text-blue-300 block">
                              📍 2. Clasificar por País:
                            </span>
                            <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                              <button
                                onClick={() => setRatingCountryFilter('TODOS')}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition whitespace-nowrap cursor-pointer ${
                                  ratingCountryFilter === 'TODOS'
                                    ? 'bg-blue-600 text-white font-black shadow'
                                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                                }`}
                              >
                                Todos los Países
                              </button>
                              {availableCountriesInRegion.map(c => (
                                <button
                                  key={c.code}
                                  onClick={() => setRatingCountryFilter(c.code)}
                                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                                    ratingCountryFilter === c.code
                                      ? 'bg-blue-600 text-white font-black shadow ring-1 ring-blue-300'
                                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                                  }`}
                                >
                                  <span>{c.flag}</span>
                                  <span>{c.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* LISTA DE JUGADORES FILTRADOS */}
                        <div className="space-y-2">
                          {finalPlayers.length === 0 ? (
                            <div className="text-center py-8 text-stone-500">
                              <p className="text-sm italic">No hay jugadores registrados en esta región o país aún.</p>
                              <p className="text-xs mt-1 text-amber-400/70">¡Invita a tus hermanos y sé el primero en representar a tu nación!</p>
                            </div>
                          ) : (
                            finalPlayers.map((entry, index) => {
                              let rankBadge = `${index + 1}º`;
                              let rankBg = "bg-stone-900/80 border-stone-800";
                              if (index === 0) { rankBadge = "🥇"; rankBg = "bg-amber-950/80 border-amber-500/80 ring-1 ring-amber-400 shadow-md"; }
                              else if (index === 1) { rankBadge = "🥈"; rankBg = "bg-stone-800/90 border-stone-400/60"; }
                              else if (index === 2) { rankBadge = "🥉"; rankBg = "bg-orange-950/60 border-orange-700/60"; }

                              const tier = getRankTier(entry.rating || 1000);
                              const countryObj = COUNTRIES.find(c => c.code === entry.playerCountry);

                              return (
                                <div
                                  key={entry.id}
                                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${rankBg}`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-base font-black w-6 text-center shrink-0">{rankBadge}</span>
                                    <img
                                      src={entry.playerAvatar || '/avatars/david.jpg'}
                                      alt="Avatar"
                                      className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shadow shrink-0"
                                    />
                                    <div className="text-left min-w-0">
                                      <p className="text-xs font-bold text-amber-100 leading-tight flex items-center gap-1 truncate">
                                        <span className="text-sm">{entry.playerCountryFlag || countryObj?.flag || '🇩🇴'}</span>
                                        <span className="truncate">{entry.playerName}</span>
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-amber-300/80 flex items-center gap-1 font-medium truncate">
                                          <span>{tier.icon}</span>
                                          <span>{tier.title}</span>
                                        </span>
                                        <span className="text-[8px] bg-stone-800 text-stone-400 px-1 rounded font-mono">
                                          {countryObj?.name || 'Internacional'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 pl-2">
                                    <p className="text-sm font-black text-amber-300">{entry.rating || 1000} <span className="text-[10px] font-normal text-amber-400">Rating</span></p>
                                    <p className="text-[10px] text-emerald-400 font-medium">{entry.accuracy}% precisión</p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  }

                  // 4. VISTA DE RANKING ENTRE AMIGOS (ORDENADO POR MAYOR PUNTUACIÓN Y RATING)
                  if (leaderboardTab === 'FRIENDS') {
                    // Amigos guardados del jugador
                    const friends = getSavedFriends();

                    // Construir la lista combinando a TÚ (jugador actual) + todos tus amigos vinculados
                    const myEntry: LeaderboardEntry = {
                      id: 'my_profile',
                      playerName: userProfileState.name || 'Tú',
                      playerAvatar: userProfileState.avatar || '/avatars/david.jpg',
                      playerCountry: userProfileState.country || 'DO',
                      playerCountryFlag: userProfileState.countryFlag || '🇩🇴',
                      mode: 'TABLERO_SOLO',
                      score: userProfileState.bestSoloScore || 0,
                      rating: userProfileState.rating || 1000,
                      rankTitle: getRankTier(userProfileState.rating || 1000).title,
                      rankIcon: getRankTier(userProfileState.rating || 1000).icon,
                      accuracy: userProfileState.accuracy || 0,
                      totalQuestions: userProfileState.totalAnswered || 0,
                      correctQuestions: userProfileState.correctAnswers || 0,
                      timeSeconds: 0,
                      date: 'Hoy'
                    };

                    const friendEntries: LeaderboardEntry[] = friends.map(f => ({
                      id: f.id,
                      playerName: f.name,
                      playerAvatar: f.avatar || '/avatars/david.jpg',
                      playerCountry: f.country || 'DO',
                      playerCountryFlag: f.countryFlag || '🇩🇴',
                      mode: 'ONLINE',
                      score: (f.rating ? Math.round(f.rating * 1.5) : 1500),
                      rating: f.rating || 1000,
                      rankTitle: getRankTier(f.rating || 1000).title,
                      rankIcon: getRankTier(f.rating || 1000).icon,
                      accuracy: 85,
                      totalQuestions: 20,
                      correctQuestions: 17,
                      timeSeconds: 120,
                      date: f.lastPlayed || 'Reciente'
                    }));

                    const allFriendLeaderboard = [myEntry, ...friendEntries].sort((a, b) => (b.rating || 1000) - (a.rating || 1000));

                    return (
                      <div className="space-y-3">
                        <div className="p-3 bg-gradient-to-r from-teal-950/70 via-stone-900 to-teal-950/70 border border-teal-500/40 rounded-2xl text-center space-y-1 shadow">
                          <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 flex items-center justify-center gap-1">
                            <Users size={13} /> Ranking Privado de Amigos
                          </span>
                          <p className="text-xs text-stone-200">
                            Compara tu rating y mayor puntuación contra las personas que tienes agregadas en tu lista de amigos.
                          </p>
                        </div>

                        {friends.length === 0 ? (
                          <div className="p-6 bg-stone-900/80 rounded-2xl border border-dashed border-teal-500/40 text-center space-y-3">
                            <span className="text-4xl">👥</span>
                            <div>
                              <h4 className="text-sm font-bold text-teal-200">Aún no tienes amigos vinculados</h4>
                              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                                Comparte tu enlace o código de invitación para conectar con tus hermanos y competir en este ranking privado.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowLeaderboardModal(false);
                                setShowOnlineModal(true);
                                setOnlineSubTab('FRIENDS_NETWORK');
                                playSound("select");
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                            >
                              <UserPlus size={14} />
                              <span>Invitar y Agregar Amigos</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {allFriendLeaderboard.map((entry, index) => {
                              let rankBadge = `${index + 1}º`;
                              let rankBg = "bg-stone-900/80 border-stone-800";
                              if (index === 0) { rankBadge = "🥇"; rankBg = "bg-teal-950/80 border-teal-500/80 ring-1 ring-teal-400 shadow-md"; }
                              else if (index === 1) { rankBadge = "🥈"; rankBg = "bg-stone-800/90 border-stone-400/60"; }
                              else if (index === 2) { rankBadge = "🥉"; rankBg = "bg-orange-950/60 border-orange-700/60"; }

                              const isMe = entry.id === 'my_profile';
                              const tier = getRankTier(entry.rating || 1000);

                              return (
                                <div
                                  key={entry.id}
                                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${rankBg} ${
                                    isMe ? 'ring-2 ring-amber-400 bg-amber-950/30' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-base font-black w-6 text-center shrink-0">{rankBadge}</span>
                                    <img
                                      src={entry.playerAvatar || '/avatars/david.jpg'}
                                      alt="Avatar"
                                      className="w-10 h-10 rounded-full object-cover border border-teal-400/50 shadow shrink-0"
                                    />
                                    <div className="text-left min-w-0">
                                      <p className="text-xs font-bold text-teal-100 leading-tight flex items-center gap-1.5 truncate">
                                        <span className="text-sm">{entry.playerCountryFlag || '🇩🇴'}</span>
                                        <span className="truncate">{entry.playerName}</span>
                                        {isMe && (
                                          <span className="text-[9px] bg-amber-500 text-amber-950 px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider">
                                            TÚ
                                          </span>
                                        )}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-teal-300/80 flex items-center gap-1 font-medium truncate">
                                          <span>{tier.icon}</span>
                                          <span>{tier.title}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 pl-2">
                                    <p className="text-sm font-black text-teal-300">{entry.rating || 1000} <span className="text-[10px] font-normal text-teal-400">Rating</span></p>
                                    <p className="text-[10px] text-stone-400 font-mono">⚡ {entry.score} pts</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 3. VISTA DE MEJORES DEL SOLITARIO (FILTRABLE POR TIEMPO Y ORDENADO POR SOLO SCORE)
                  const soloEntries = rawEntries.filter(e => e.mode === 'TABLERO_SOLO' || e.mode === 'TRIVIA');
                  const filteredSolo = soloTimeFilter === 'TODOS'
                    ? soloEntries
                    : soloEntries.filter(e => e.timeCategory === soloTimeFilter);

                  const sortedByScore = [...filteredSolo].sort((a, b) => (b.score || 0) - (a.score || 0));

                  return (
                    <div className="space-y-2.5">
                      {/* SUBFILTRO DE TIEMPO / CARRERA EN SOLITARIO */}
                      <div className="flex justify-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                        {[
                          { id: 'TODOS', label: 'Todos' },
                          { id: '5_MIN', label: '⚡ 5 Min' },
                          { id: '10_MIN', label: '⏱️ 10 Min' },
                          { id: '15_MIN', label: '⏳ 15 Min' },
                          { id: '20_MIN', label: '🏃 20 Min' },
                          { id: 'INFINITO', label: '♾️ Meta 75' },
                        ].map(tf => (
                          <button
                            key={tf.id}
                            onClick={() => setSoloTimeFilter(tf.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                              soloTimeFilter === tf.id
                                ? 'bg-amber-500 text-amber-950 font-black shadow'
                                : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                            }`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>

                      {sortedByScore.length === 0 ? (
                        <div className="text-center py-8 text-stone-500">
                          <p className="text-sm italic">No hay récords registrados en esta modalidad de tiempo.</p>
                          <p className="text-xs mt-1 text-amber-400/70">¡Inicia una carrera y sé el primero en marcar récord!</p>
                        </div>
                      ) : (
                        sortedByScore.map((entry, index) => {
                          let rankBadge = `${index + 1}º`;
                          let rankBg = "bg-stone-900/80 border-stone-800";
                          if (index === 0) { rankBadge = "🥇"; rankBg = "bg-amber-950/80 border-amber-500/80 ring-1 ring-amber-400 shadow-md"; }
                          else if (index === 1) { rankBadge = "🥈"; rankBg = "bg-stone-800/90 border-stone-400/60"; }
                          else if (index === 2) { rankBadge = "🥉"; rankBg = "bg-orange-950/60 border-orange-700/60"; }

                          const timeLabel = entry.timeCategory === '5_MIN' ? '⚡ 5 Min'
                            : entry.timeCategory === '10_MIN' ? '⏱️ 10 Min'
                            : entry.timeCategory === '15_MIN' ? '⏳ 15 Min'
                            : entry.timeCategory === '20_MIN' ? '🏃 20 Min'
                            : entry.timeCategory === 'INFINITO' ? '♾️ Meta 75'
                            : `${entry.timeSeconds}s`;

                          return (
                            <div
                              key={entry.id}
                              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${rankBg}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-base font-black w-6 text-center">{rankBadge}</span>
                                <img
                                  src={entry.playerAvatar || '/avatars/david.jpg'}
                                  alt="Avatar"
                                  className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shadow"
                                />
                                <div className="text-left">
                                  <p className="text-xs font-bold text-amber-100 leading-tight">
                                    <span className="mr-1">{entry.playerCountryFlag || '🇩🇴'}</span>
                                    {entry.playerName}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded font-semibold">{timeLabel}</span>
                                    {entry.tilesReached && (
                                      <span className="text-[9px] bg-blue-500/15 text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                                        🏁 Casilla {entry.tilesReached}/75
                                      </span>
                                    )}
                                    <span className="text-[9px] text-stone-400">{entry.date}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-black text-amber-300">⚡ {entry.score} pts</p>
                                <p className="text-[10px] text-emerald-400 font-medium">{entry.accuracy}% prec · {entry.correctQuestions}/{entry.totalQuestions}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 bg-[#1B1A17] border-t border-stone-800 text-center shrink-0">
                <button
                  onClick={() => setShowLeaderboardModal(false)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl text-xs uppercase tracking-widest transition shadow cursor-pointer"
                >
                  Cerrar Ranking
                </button>
              </div>
            </div>
          </div>
        )}

      {/* 🌐 Modal de Multijugador En Línea & 4 Modalidades Exclusivas */}
      {showOnlineModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          onClick={() => {
            if (!isSearchingDuel) setShowOnlineModal(false);
          }}
        >
          <div 
            className="bg-[#24201A] border-2 border-amber-600/50 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
              {/* Encabezado del Modal Online */}
              <div className="bg-gradient-to-r from-stone-900 via-[#2A2318] to-stone-900 p-4 sm:p-5 text-center relative border-b border-amber-900/40 shrink-0">
                <button 
                  onClick={() => {
                    if (onlineRoom) {
                      onlineService.leaveRoom();
                      setOnlineRoom(null);
                    }
                    setOnlineSubTab('MENU');
                    setShowOnlineModal(false);
                  }}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white cursor-pointer z-10"
                >
                  <XCircle size={22} />
                </button>

                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <Globe className="text-amber-400" size={26} />
                  <h2 className="text-xl sm:text-2xl font-black text-amber-200 font-serif uppercase tracking-wider">MODO EN LÍNEA</h2>
                </div>
                <p className="text-[11px] text-stone-400 uppercase tracking-wide font-medium">SALAS PRIVADAS · DUELO MUNDIAL · AMIGOS · TORNEOS</p>

                {/* 🪙 Saldo de Talentos del Jugador en el Lobby */}
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-400/40 rounded-full">
                  <span className="text-[11px] text-stone-300 font-medium">Tus Talentos:</span>
                  <span className="text-xs font-mono font-black text-amber-300 flex items-center gap-1">
                    <GoldCoinIcon className="w-4 h-4" />
                    <span>{userTalents}</span>
                  </span>
                </div>

                {/* Sub-navegación si está dentro de una subsección */}
                {onlineSubTab !== 'MENU' && !onlineRoom && (
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-900/40">
                    <button
                      onClick={() => setOnlineSubTab('MENU')}
                      className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Volver a Modos
                    </button>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      {onlineSubTab === 'PRIVATE' ? '🔒 Sala Privada' :
                       onlineSubTab === 'DUEL_1V1' ? '⚔️ Uno contra uno' :
                       onlineSubTab === 'TODOS_VS_TODOS' ? '👥 Todos Vs Todos (3 a 8)' :
                       onlineSubTab === 'FRIENDS' ? '👥 Jugar con Amigos' : '🏆 Evento Semanal'}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenido Principal con Scroll */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {!onlineRoom ? (
                  <>
                    {/* VISTA 1: CARRUSEL CON SCROLL LATERAL HORIZONTAL DE MODOS ONLINE */}
                    {onlineSubTab === 'MENU' && (
                      <div className="space-y-2.5">
                        {/* Indicador Superior de Desplazamiento Lateral Limpio */}
                        <div className="flex items-center justify-between px-1 text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                          <span className="text-amber-400">
                            SELECCIONA UN MODO DE JUEGO:
                          </span>
                          <span className="text-[10px] bg-stone-800 text-stone-300 px-2.5 py-0.5 rounded-full border border-stone-700 font-black">
                            5 MODOS
                          </span>
                        </div>

                        {/* Contenedor de Fichas con Scroll Horizontal Suave, Más Espacio y Tarjetas con Imágenes Grandes y Protagónicas */}
                        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 px-2 snap-x snap-mandatory custom-scrollbar scroll-smooth">
                          
                          {/* 1. UNO CONTRA UNO */}
                          <div className="w-[210px] sm:w-[230px] shrink-0 snap-center rounded-2xl bg-gradient-to-b from-[#2B221B] via-[#1E1A16] to-[#141210] border-2 border-rose-500/50 hover:border-rose-400 shadow-2xl overflow-hidden flex flex-col justify-between group transition-all">
                            {/* Imagen de la Ficha Protagónica */}
                            <div className="w-full h-36 sm:h-40 relative overflow-hidden bg-gradient-to-b from-black/90 via-black/70 to-[#1E1A16] flex items-center justify-center p-1.5">
                              <img
                                src="/uno contra uno.png"
                                alt="Uno contra uno"
                                className="w-full h-full object-contain scale-105 group-hover:scale-115 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1A16] via-transparent to-transparent pointer-events-none" />
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xl border border-rose-400/50 flex items-center gap-1 z-10">
                                <Swords size={10} /> 1 vs 1
                              </span>
                            </div>

                            {/* Contenido y Detalles */}
                            <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1.5 text-center">
                              <div>
                                <h3 className="text-sm font-serif font-black text-white tracking-wide">
                                  Uno contra uno
                                </h3>
                                <p className="text-[10px] text-stone-300 mt-0.5 leading-snug line-clamp-2">
                                  Enfrentamiento en tiempo real contra otro rival o BiblosBot.
                                </p>
                                {/* Costo y Ganancia */}
                                <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-bold">
                                  <span className="text-stone-300 flex items-center gap-0.5">Entrada: <strong className="text-rose-400 flex items-center gap-0.5"><GoldCoinIcon className="w-3 h-3 inline" /> 1</strong></span>
                                  <span className="text-amber-300 font-extrabold flex items-center gap-0.5">Premio: <strong className="text-amber-400 flex items-center gap-0.5"><GoldCoinIcon className="w-3 h-3 inline" /> 2</strong></span>
                                </div>
                              </div>

                              {/* Botón de Acción */}
                              <div className="pt-0.5">
                                <button
                                  onClick={() => {
                                    playSound("select");
                                    start1v1Matchmaking();
                                  }}
                                  className="w-full py-2 bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-md active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-rose-400/30"
                                >
                                  <Swords size={12} />
                                  <span>Entrar (1</span>
                                  <GoldCoinIcon className="w-3 h-3 inline" />
                                  <span>)</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 2. TODOS VS TODOS (3 A 8 JUGADORES - 30 SEGUNDOS) */}
                          <div className="w-[210px] sm:w-[230px] shrink-0 snap-center rounded-2xl bg-gradient-to-b from-[#1C2826] via-[#16201E] to-[#0E1514] border-2 border-emerald-500/50 hover:border-emerald-400 shadow-2xl overflow-hidden flex flex-col justify-between group transition-all">
                            {/* Imagen de la Ficha Protagónica */}
                            <div className="w-full h-36 sm:h-40 relative overflow-hidden bg-gradient-to-b from-black/90 via-black/70 to-[#16201E] flex items-center justify-center p-1.5">
                              <img
                                src="/3 a 8 juagdores.png"
                                alt="Todos Vs Todos"
                                className="w-full h-full object-contain scale-105 group-hover:scale-115 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#16201E] via-transparent to-transparent pointer-events-none" />
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xl border border-emerald-400/50 flex items-center gap-1 z-10">
                                <Users size={10} /> 3-8
                              </span>
                            </div>

                            {/* Contenido y Detalles */}
                            <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1.5 text-center">
                              <div>
                                <h3 className="text-sm font-serif font-black text-emerald-200 tracking-wide">
                                  Todos Vs Todos
                                </h3>
                                <p className="text-[10px] text-stone-300 mt-0.5 leading-snug line-clamp-2">
                                  Busca rivales por 1 minuto e inicia con quienes estén conectados.
                                </p>
                                {/* Costo y Ganancia */}
                                <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold flex-wrap">
                                  <span className="text-stone-300 flex items-center gap-0.5">Entrada: <strong className="text-emerald-400 flex items-center gap-0.5"><GoldCoinIcon className="w-3 h-3 inline" /> 1</strong></span>
                                  <span className="text-amber-300 font-extrabold flex items-center gap-0.5">Premios: <strong className="text-amber-400 flex items-center gap-0.5"><GoldCoinIcon className="w-3 h-3 inline" /> 3/2/1</strong></span>
                                </div>
                              </div>

                              {/* Botón de Acción */}
                              <div className="pt-0.5">
                                <button
                                  onClick={startTodosVsTodosMatchmaking}
                                  className="w-full py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-500 hover:to-cyan-600 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-md active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-emerald-400/30"
                                >
                                  <Users size={12} />
                                  <span>Entrar (1</span>
                                  <GoldCoinIcon className="w-3 h-3 inline" />
                                  <span>)</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 3. SALA PRIVADA */}
                          <div className="w-[210px] sm:w-[230px] shrink-0 snap-center rounded-2xl bg-gradient-to-b from-[#221F2D] via-[#1B1824] to-[#121019] border-2 border-indigo-500/50 hover:border-indigo-400 shadow-2xl overflow-hidden flex flex-col justify-between group transition-all">
                            {/* Imagen de la Ficha Protagónica */}
                            <div className="w-full h-36 sm:h-40 relative overflow-hidden bg-gradient-to-b from-black/90 via-black/70 to-[#1B1824] flex items-center justify-center p-1.5">
                              <img
                                src="/Sala privada.png"
                                alt="Sala privada"
                                className="w-full h-full object-contain scale-105 group-hover:scale-115 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1B1824] via-transparent to-transparent pointer-events-none" />
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xl border border-indigo-400/50 flex items-center gap-1 z-10">
                                <Lock size={10} /> PIN
                              </span>
                            </div>

                            {/* Contenido y Detalles */}
                            <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1.5 text-center">
                              <div>
                                <h3 className="text-sm font-serif font-black text-indigo-200 tracking-wide">
                                  Sala privada
                                </h3>
                                <p className="text-[10px] text-stone-300 mt-0.5 leading-snug line-clamp-2">
                                  Crea tu sala con código PIN para tu iglesia o familia.
                                </p>
                                {/* Costo y Ganancia */}
                                <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold flex-wrap">
                                  <span className="text-emerald-400 font-extrabold">Gratis</span>
                                  <span className="text-amber-300 font-extrabold flex items-center gap-0.5">Premios: <strong className="text-amber-400 flex items-center gap-0.5"><GoldCoinIcon className="w-3 h-3 inline" /> 3/2/1</strong></span>
                                </div>
                              </div>

                              {/* Botones de Acción */}
                              <div className="space-y-1 pt-0.5">
                                <button
                                  onClick={() => {
                                    playSound("select");
                                    setOnlineSubTab('PRIVATE');
                                  }}
                                  className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-indigo-200 hover:text-white font-bold rounded-xl text-[10px] uppercase tracking-wider border border-indigo-500/40 transition shadow-sm active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Lock size={11} /> Unirse
                                </button>

                                <button
                                  onClick={async () => {
                                    playSound("select");
                                    try {
                                      const pName = userProfileState?.name || 'Jugador Bíblico';
                                      const pAvatar = userProfileState?.avatar || '/avatars/david.jpg';
                                      const room = await onlineService.createRoomAsync(true, { name: pName, avatar: pAvatar });
                                      if (room) setOnlineRoom(room);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition shadow active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-indigo-400/30"
                                >
                                  <Lock size={11} /> Crear Sala
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 4. JUGAR CON AMIGOS */}
                          <div className="w-[210px] sm:w-[230px] shrink-0 snap-center rounded-2xl bg-gradient-to-b from-[#1E2721] via-[#161E1A] to-[#0E1512] border-2 border-teal-500/50 hover:border-teal-400 shadow-2xl overflow-hidden flex flex-col justify-between group transition-all">
                            {/* Imagen de la Ficha Protagónica */}
                            <div className="w-full h-36 sm:h-40 relative overflow-hidden bg-gradient-to-b from-black/90 via-black/70 to-[#161E1A] flex items-center justify-center p-1.5">
                              <img
                                src="/jugar con amigos.png"
                                alt="Jugar con Amigos"
                                className="w-full h-full object-contain scale-105 group-hover:scale-115 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#161E1A] via-transparent to-transparent pointer-events-none" />
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-600 text-white shadow-xl border border-teal-400/50 flex items-center gap-1 z-10">
                                <UserPlus size={10} /> Amigos
                              </span>
                            </div>

                            {/* Contenido y Detalles */}
                            <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1.5 text-center">
                              <div>
                                <h3 className="text-sm font-serif font-black text-teal-200 tracking-wide">
                                  Jugar con Amigos
                                </h3>
                                <p className="text-[10px] text-stone-300 mt-0.5 leading-snug line-clamp-2">
                                  Invita a tus amigos guardados a salas personalizadas.
                                </p>
                                {/* Costo y Ganancia */}
                                <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold flex-wrap">
                                  <span className="text-emerald-400 font-extrabold">Gratis</span>
                                  <span className="text-amber-300 font-extrabold flex items-center gap-0.5">Premios: <strong className="text-amber-400 flex items-center gap-0.5"><GoldCoinIcon className="w-3 h-3 inline" /> 3/2/1</strong></span>
                                </div>
                              </div>

                              {/* Botones de Acción */}
                              <div className="space-y-1 pt-0.5">
                                <button
                                  onClick={() => {
                                    playSound("select");
                                    setOnlineSubTab('FRIENDS');
                                  }}
                                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition shadow active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-teal-400/30"
                                >
                                  <Users size={11} /> Jugar con Amigos (Gratis)
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 5. LA COPA BIBLOS (TORNEO SEMANAL DE LOS DOMINGOS) */}
                          <div className="w-[210px] sm:w-[230px] shrink-0 snap-center rounded-2xl bg-gradient-to-b from-[#2B2317] via-[#1F1910] to-[#14100A] border-2 border-amber-500/50 hover:border-amber-400 shadow-2xl overflow-hidden flex flex-col justify-between group transition-all">
                            {/* Imagen de la Ficha Protagónica */}
                            <div className="w-full h-36 sm:h-40 relative overflow-hidden bg-gradient-to-b from-black/90 via-black/70 to-[#1F1910] flex items-center justify-center p-1.5">
                              <img
                                src="/jugar eventos.png"
                                alt="La Copa Biblos"
                                className="w-full h-full object-contain scale-105 group-hover:scale-115 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1910] via-transparent to-transparent pointer-events-none" />
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-amber-950 shadow-xl border border-amber-300/60 flex items-center gap-1 z-10">
                                <Crown size={10} /> Copa
                              </span>
                            </div>

                            {/* Contenido y Detalles */}
                            <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1.5 text-center">
                              <div>
                                <h3 className="text-sm font-serif font-black text-amber-200 tracking-wide">
                                  La Copa Biblos
                                </h3>
                                <p className="text-[10px] text-stone-300 mt-0.5 leading-snug line-clamp-2">
                                  Participa en la Copa Biblos cada semana y obtén fabulosos premios.
                                </p>
                              </div>

                              {/* Botones y Cronómetro de Acción */}
                              <div className="space-y-1 pt-0.5">
                                <div className="py-1 px-2 bg-black/60 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 shadow-inner">
                                  <span className="text-[9px] text-amber-300 font-bold flex items-center gap-0.5">
                                    <Clock size={10} className="text-amber-400" /> Dom 3PM:
                                  </span>
                                  <span className="text-[9px] font-mono font-black text-amber-300 tracking-wide">
                                    {eventCountdownStr || 'Cargando...'}
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    playSound("select");
                                    setShowCopaBiblosMode(true);
                                  }}
                                  className="w-full py-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-amber-300/40"
                                >
                                  <Trophy size={11} /> Entrar a La Copa
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    )}

                    {/* VISTA 2: SUBMODAL SALA PRIVADA */}
                    {onlineSubTab === 'PRIVATE' && (
                      <div className="space-y-4">
                        <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/40 space-y-3 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto border border-indigo-400/40">
                            <Lock size={24} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-indigo-200">Unirse o Crear Sala Privada</h3>
                            <p className="text-xs text-stone-400 mt-0.5">Ingresa el código PIN de 6 dígitos que te dio el anfitrión</p>
                          </div>

                          <div className="flex gap-2 max-w-xs mx-auto pt-2">
                            <input
                              type="text"
                              placeholder="Ej: 849201"
                              maxLength={8}
                              value={inputPinCode}
                              onChange={(e) => setInputPinCode(e.target.value)}
                              className="flex-1 px-3 py-2.5 bg-stone-950 border-2 border-indigo-500/60 rounded-xl text-center text-base font-mono text-amber-300 focus:outline-none focus:border-amber-400 uppercase tracking-widest shadow-inner"
                            />
                            <button
                              onClick={async () => {
                                if (inputPinCode.trim()) {
                                  const pName = userProfileState?.name || 'Jugador Bíblico';
                                  const pAvatar = userProfileState?.avatar || '/avatars/david.jpg';
                                  const room = await onlineService.joinRoomAsync(inputPinCode, { name: pName, avatar: pAvatar });
                                  if (room) setOnlineRoom(room);
                                }
                              }}
                              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow cursor-pointer"
                            >
                              Entrar
                            </button>
                          </div>
                        </div>

                        <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 space-y-2 text-center">
                          <p className="text-xs text-stone-300 font-bold">¿Quieres ser el anfitrión?</p>
                          <p className="text-[11px] text-stone-400">Genera un nuevo código PIN para compartir con tu iglesia o grupo familiar:</p>
                          <button
                            onClick={async () => {
                              try {
                                const pName = userProfileState?.name || 'Jugador Bíblico';
                                const pAvatar = userProfileState?.avatar || '/avatars/david.jpg';
                                const room = await onlineService.createRoomAsync(true, { name: pName, avatar: pAvatar });
                                if (room) setOnlineRoom(room);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Lock size={14} /> ➕ Crear Nueva Sala Privada
                          </button>
                        </div>
                      </div>
                    )}

                    {/* VISTA 3: SUBMODAL 1 VS 1 DUELO */}
                    {onlineSubTab === 'DUEL_1V1' && (
                      <div className="space-y-4 text-center py-2">
                        {isSearchingDuel ? (
                          /* ⚡ PANTALLA ANIMADA DE BÚSQUEDA DE COMPETIDOR CON AVATARES RÁPIDOS */
                          <div className="bg-gradient-to-b from-rose-950/70 via-stone-900 to-amber-950/50 p-5 rounded-3xl border-2 border-rose-500/50 text-center space-y-4 shadow-2xl relative overflow-hidden">
                            {/* Halo de luz ambiental de radar */}
                            <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />

                            {duelMatchedPlayer ? (
                              /* ⚔️ VISTA DE OPONENTE ENCONTRADO */
                              <div className="space-y-3 relative z-10 py-1">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 rounded-full font-black text-xs uppercase tracking-wider animate-bounce">
                                  <span>⚔️</span> ¡Oponente Encontrado!
                                </div>

                                <div className="flex items-center justify-center gap-4 sm:gap-8 pt-1">
                                  {/* Tú */}
                                  <div className="flex flex-col items-center">
                                    <img
                                      src={userProfileState.avatar || '/avatars/david.jpg'}
                                      alt={userProfileState.name}
                                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-emerald-400 shadow-lg"
                                    />
                                    <p className="text-xs font-bold text-white mt-1.5">{userProfileState.name}</p>
                                    <span className="text-[10px] font-mono text-amber-300 font-bold">{userProfileState.rating || 1000} ELO</span>
                                  </div>

                                  {/* VS */}
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-amber-950 font-black text-sm flex items-center justify-center border-2 border-amber-300 shadow-xl">
                                    VS
                                  </div>

                                  {/* Rival Emparejado */}
                                  <div className="flex flex-col items-center">
                                    <img
                                      src={duelMatchedPlayer.avatar}
                                      alt={duelMatchedPlayer.name}
                                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400 shadow-xl ring-4 ring-amber-400/40"
                                    />
                                    <p className="text-xs font-bold text-amber-200 mt-1.5">{duelMatchedPlayer.name}</p>
                                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{duelMatchedPlayer.rating} ELO</span>
                                  </div>
                                </div>

                                <p className="text-xs text-amber-300 font-bold animate-pulse pt-2">
                                  Entrando a la partida...
                                </p>
                              </div>
                            ) : (
                              /* 🔍 BÚSQUEDA EN PROCESO: AVATARES CAMBIANDO RÁPIDAMENTE */
                              <>
                                {/* DUELO VISUAL: TÚ VS RIVAL CON AVATARES CORRIENDO RÁPIDO */}
                                <div className="flex items-center justify-center gap-4 sm:gap-8 relative z-10 py-1">
                                  {/* 1. Mi Perfil (Izquierda) */}
                                  <div className="flex flex-col items-center">
                                    <div className="relative">
                                      <img
                                        src={userProfileState.avatar || '/avatars/david.jpg'}
                                        alt={userProfileState.name}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-emerald-400 shadow-lg shadow-emerald-950/50"
                                      />
                                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-black rounded-full shadow" />
                                    </div>
                                    <p className="text-xs font-bold text-white mt-1.5 truncate max-w-[85px] sm:max-w-[110px]">
                                      {userProfileState.name}
                                    </p>
                                    <span className="text-[10px] font-mono text-amber-300 font-bold">
                                      {userProfileState.rating || 1000} ELO
                                    </span>
                                  </div>

                                  {/* 2. Emblema Central VS Pulsante */}
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-rose-600 to-amber-600 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-amber-300 shadow-lg shadow-rose-900/60 animate-bounce">
                                      VS
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-stone-400 mt-1">
                                      1 vs 1
                                    </span>
                                  </div>

                                  {/* 3. Avatares Apareciendo y Cambiándose Rápidamente (Derecha) */}
                                  <div className="flex flex-col items-center">
                                    <div className="relative">
                                      {/* Anillo de escaneo radar */}
                                      <div className="absolute -inset-2 rounded-full border-2 border-rose-500/60 animate-ping opacity-75 pointer-events-none" />
                                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-rose-400 shadow-xl shadow-rose-900/50 relative bg-stone-950">
                                        <img
                                          src={BIBLE_AVATARS[searchAvatarIndex]?.imagePath || '/avatars/david.jpg'}
                                          alt="Buscando competidor..."
                                          className="w-full h-full object-cover transition-all duration-75 scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/50 to-transparent" />
                                      </div>
                                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-amber-400 border-2 border-black rounded-full animate-pulse shadow" />
                                    </div>
                                    <p className="text-xs font-bold text-amber-200 mt-1.5 truncate max-w-[85px] sm:max-w-[110px] animate-pulse">
                                      {BIBLE_AVATARS[searchAvatarIndex]?.name || 'Buscando...'}
                                    </p>
                                    <span className="text-[10px] font-mono text-stone-400">
                                      ??? ELO
                                    </span>
                                  </div>
                                </div>

                                {/* Textos de Estado: "Buscando competidor..." y "Buscando..." */}
                                <div className="space-y-1.5 relative z-10 pt-2 border-t border-rose-900/40">
                                  <h3 className="text-base sm:text-lg font-black text-rose-200 uppercase tracking-wide">
                                    Buscando competidor...
                                  </h3>
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-black rounded-full border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
                                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                                      Buscando...
                                    </span>
                                    <span className="text-xs font-mono font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded-md border border-amber-500/20">
                                      00:{duelSearchTime < 10 ? `0${duelSearchTime}` : duelSearchTime}s / 20s
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                                    Buscando en vivo a otro jugador conectado para batirse en duelo...
                                  </p>
                                </div>

                                {/* Botón para Cancelar Búsqueda */}
                                <div className="pt-2 max-w-xs mx-auto relative z-10">
                                  <button
                                    onClick={cancel1v1Matchmaking}
                                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider border border-stone-700 transition cursor-pointer"
                                  >
                                    Cancelar Búsqueda
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : duelNoOpponent ? (
                          /* 🤖 NOTIFICACIÓN TRAS 20s: SIN JUGADORES Y PREGUNTA PARA JUGAR CON BIBLOSBOT */
                          <div className="bg-gradient-to-b from-indigo-950/80 via-stone-900 to-stone-950 p-5 rounded-3xl border-2 border-indigo-500/50 text-center space-y-4 shadow-2xl">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto border border-indigo-400/40 shadow-inner">
                              <Bot size={32} />
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="text-base sm:text-lg font-black text-amber-300">
                                Sin rivales conectados en este momento
                              </h3>
                              <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
                                Buscamos durante 20 segundos y no encontramos a otros jugadores en línea ahora mismo.
                              </p>
                              <div className="p-3 bg-stone-900/90 rounded-2xl border border-stone-800 text-xs text-indigo-200 font-bold max-w-xs mx-auto">
                                ¿Deseas jugar una partida de duelo 1 contra 1 contra <span className="text-amber-400 font-black">BiblosBot</span>?
                              </div>
                            </div>

                            <div className="space-y-2 pt-1 max-w-xs mx-auto">
                              {/* Botón Principal: Jugar contra BiblosBot */}
                              <button
                                onClick={startBiblosBotMatch}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Bot size={16} /> Jugar contra BiblosBot
                              </button>

                              {/* Botón Secundario: Volver a Buscar 20s */}
                              <button
                                onClick={start1v1Matchmaking}
                                className="w-full py-2.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider border border-indigo-700/50 transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Zap size={14} /> Volver a Buscar en Línea
                              </button>

                              {/* Botón Salir */}
                              <button
                                onClick={cancel1v1Matchmaking}
                                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 font-bold rounded-xl text-xs uppercase tracking-wider border border-stone-800 transition cursor-pointer"
                              >
                                Cancelar y Salir
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* VISTA DE ESPERA PARA INICIAR DUELO */
                          <div className="bg-rose-950/30 p-5 rounded-2xl border border-rose-600/40 text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto border border-rose-400/40">
                              <Swords size={28} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-rose-200">1 contra 1 (Duelo Mundial)</h3>
                              <p className="text-xs text-stone-300 mt-1 max-w-sm mx-auto">
                                Enfréntate en vivo a otro jugador conectado en cualquier parte del mundo en una partida rápida con rating ELO.
                              </p>
                            </div>

                            <div className="pt-2 max-w-xs mx-auto">
                              <button
                                onClick={start1v1Matchmaking}
                                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Zap size={16} /> Entrar a Sala 1 contra 1
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* VISTA 3.5: SUBMODAL TODOS VS TODOS (3 A 8 JUGADORES - 30 SEGUNDOS) */}
                    {onlineSubTab === 'TODOS_VS_TODOS' && (
                      <div className="space-y-4 text-center py-2">
                        {isSearchingGroup ? (
                          /* ⚡ PANTALLA ANIMADA DE BÚSQUEDA GRUPAL CON CUENTA REGRESIVA DE 30 SEGUNDOS */
                          <div className="bg-gradient-to-b from-emerald-950/70 via-stone-900 to-teal-950/50 p-5 rounded-3xl border-2 border-emerald-500/50 text-center space-y-4 shadow-2xl relative overflow-hidden">
                            {/* Halo ambiental de radar */}
                            <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />

                            {groupMatchStarting ? (
                              /* 🏁 VISTA DE PARTIDA INICIANDO */
                              <div className="space-y-3 relative z-10 py-3">
                                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/25 text-emerald-300 border border-emerald-400/60 rounded-full font-black text-xs uppercase tracking-wider animate-bounce">
                                  <span>👥</span> ¡Partida Lista con {groupLobbyPlayers.length || 3} Jugadores!
                                </div>
                                <h3 className="text-xl sm:text-2xl font-serif font-black text-amber-300">
                                  Entrando al Tablero...
                                </h3>
                                <p className="text-xs text-stone-300 animate-pulse">
                                  ¡Prepárate para la carrera bíblica masiva!
                                </p>
                              </div>
                            ) : (
                              /* 🔍 BÚSQUEDA EN PROCESO: CUENTA DE 30s Y JUGADORES SUMÁNDOSE */
                              <>
                                <div className="relative z-10 space-y-1">
                                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-inner animate-pulse">
                                    <Clock size={14} className="text-emerald-400" />
                                    <span>Iniciando en {groupTimeRemaining}s</span>
                                  </div>
                                  <h3 className="text-base sm:text-lg font-serif font-black text-white">
                                    Buscando Jugadores (3 a 8)
                                  </h3>
                                  <p className="text-[11px] text-stone-300 max-w-sm mx-auto leading-snug">
                                    Al llegar a 0s, la partida comenzará automáticamente con los conectados.
                                  </p>
                                </div>

                                {/* Rejilla de Jugadores Conectados (Hasta 8 ranuras) */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10 pt-1">
                                  {Array.from({ length: 8 }).map((_, slotIdx) => {
                                    const player = groupLobbyPlayers[slotIdx];
                                    return (
                                      <div
                                        key={slotIdx}
                                        className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                                          player
                                            ? 'bg-emerald-950/80 border-emerald-400/80 shadow-md shadow-emerald-950/50 scale-100 ring-1 ring-emerald-400/50'
                                            : 'bg-black/40 border-stone-800/80 border-dashed opacity-60'
                                        }`}
                                      >
                                        {player ? (
                                          <>
                                            <div className="relative">
                                              <img
                                                src={player.avatar || '/avatars/david.jpg'}
                                                alt={player.name}
                                                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow"
                                              />
                                              <span className="absolute -bottom-1 -right-1 text-[10px]">
                                                {player.countryFlag || '🇩🇴'}
                                              </span>
                                            </div>
                                            <p className="text-[11px] font-bold text-white mt-1.5 truncate max-w-[80px]">
                                              {player.name}
                                            </p>
                                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded-full mt-0.5">
                                              ✓ Listo
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <div className="w-11 h-11 rounded-full border border-stone-700 bg-stone-900 flex items-center justify-center text-stone-500 text-xs">
                                              {slotIdx + 1}
                                            </div>
                                            <p className="text-[10px] text-stone-500 mt-1.5 font-medium">
                                              Esperando...
                                            </p>
                                            <span className="text-[8px] text-stone-600">
                                              Ranura {slotIdx + 1}/8
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Nota Informativa sobre Bots */}
                                <div className="p-2.5 bg-stone-900/80 rounded-2xl border border-stone-800 text-[11px] text-stone-400 max-w-sm mx-auto relative z-10">
                                  🤖 Si hay menos de 3 personas al terminar el tiempo, se completará con BiblosBot para asegurar la partida.
                                </div>

                                {/* Botón para Cancelar Búsqueda */}
                                <div className="pt-1 max-w-xs mx-auto relative z-10">
                                  <button
                                    onClick={cancelTodosVsTodosMatchmaking}
                                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider border border-stone-700 transition cursor-pointer"
                                  >
                                    Cancelar Búsqueda
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          /* VISTA DE ENTRADA A TODOS VS TODOS */
                          <div className="bg-emerald-950/30 p-5 rounded-2xl border border-emerald-600/40 text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-400/40">
                              <Users size={28} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-emerald-200">Todos Vs Todos (3 a 8 Jugadores)</h3>
                              <p className="text-xs text-stone-300 mt-1 max-w-sm mx-auto">
                                Entra a la sala pública automática. Busca participantes por 1 minuto y comienza la carrera con quienes estén conectados.
                              </p>
                            </div>

                            <div className="pt-2 max-w-xs mx-auto">
                              <button
                                onClick={startTodosVsTodosMatchmaking}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-500 hover:to-cyan-600 text-white font-black rounded-xl text-xs uppercase tracking-widest transition shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Users size={16} /> Entrar a Todos Vs Todos
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* VISTA 4: SUBMODAL JUGAR CON AMIGOS (SALA DE AMIGOS + PERFIL + TARJETA DESPLEGABLE) */}
                    {onlineSubTab === 'FRIENDS' && (
                      <div className="space-y-4">
                        {/* 0. SALAS DE AMIGOS ACTIVAS EN LA RED EN TIEMPO REAL */}
                        <div className="bg-gradient-to-b from-stone-900/95 via-stone-950/95 to-black p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-500/50 shadow-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                              <h4 className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                                <Radio size={15} /> Salas de Amigos Activas en la Red
                              </h4>
                            </div>
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                              {activeFriendLobbies.length} {activeFriendLobbies.length === 1 ? 'Sala Abierta' : 'Salas Abiertas'}
                            </span>
                          </div>

                          {activeFriendLobbies.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                              {activeFriendLobbies.map((lobby) => {
                                const myCode = `BIBLOS-${(userProfileState?.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfileState?.rating || 1000) % 9000)}`;
                                const isMyOwnLobby = lobby.hostFriendCode === myCode || lobby.code === friendsLobbyCode;

                                return (
                                  <div
                                    key={lobby.code}
                                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-md transition-all ${
                                      isMyOwnLobby
                                        ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-400/40'
                                        : 'bg-stone-900/90 hover:bg-stone-850 border-emerald-500/40 hover:border-emerald-400'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="relative shrink-0">
                                        <img
                                          src={lobby.hostAvatar}
                                          alt={lobby.hostName}
                                          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shadow"
                                        />
                                        <span className="absolute -bottom-1 -right-1 text-[10px]">
                                          {lobby.hostCountryFlag || '🇩🇴'}
                                        </span>
                                      </div>
                                      <div className="text-left min-w-0">
                                        <h5 className="text-xs font-black text-white truncate">
                                          {lobby.hostName} {isMyOwnLobby && <span className="text-amber-400 text-[10px]">(Tu Sala)</span>}
                                        </h5>
                                        <div className="flex items-center gap-2 text-[9px] text-stone-300 font-mono">
                                          <span className="text-emerald-400 font-bold">{lobby.code}</span>
                                          <span className="text-stone-400">· {lobby.playerCount}/{lobby.maxPlayers} Jug.</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      {isMyOwnLobby ? (
                                        <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-500/40">
                                          👑 Anfitrión
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            playSound("select");
                                            triggerHaptic("success");
                                            const pData = {
                                              name: userProfileState?.name || 'Amigo Bíblico',
                                              avatar: userProfileState?.avatar || '/avatars/david.jpg',
                                              country: userProfileState?.country || 'DO',
                                              countryFlag: userProfileState?.countryFlag || '🇩🇴',
                                              rating: userProfileState?.rating || 1000,
                                              friendCode: myCode
                                            };

                                            onlineService.joinFriendsLobby(
                                              lobby.code,
                                              pData,
                                              (lobbyData) => {
                                                setFriendsLobbyCode(lobbyData.code);
                                                setFriendsLobbyPlayers(lobbyData.players || []);
                                              },
                                              (matchData) => {
                                                playSound("correct");
                                                triggerHaptic("success");
                                                setShowOnlineModal(false);
                                                setShowWelcome(false);
                                                setOnlineRoom(matchData.room);
                                                setScreen('TABLERO');
                                              }
                                            );
                                          }}
                                          className="py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-emerald-950 font-black rounded-xl text-[10px] uppercase tracking-wider shadow active:scale-95 transition cursor-pointer shrink-0"
                                        >
                                          ✓ Unirme
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 text-center space-y-1.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                                <Radio size={16} />
                              </div>
                              <p className="text-xs text-stone-300 font-medium">
                                No hay salas de amigos abiertas en este momento en la red.
                              </p>
                              <p className="text-[10px] text-stone-400">
                                ¡Abre tu propia sala abajo o invita amigos para que se unan a ti!
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 1. SECCIÓN PRINCIPAL: TU PERFIL Y AL LADO LA SALA DE AMIGOS (FILTRADA PARA AMIGOS) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* COLUMNA IZQUIERDA: TU PERFIL ANFITRIÓN */}
                          <div className="md:col-span-4 bg-gradient-to-b from-[#241A0E] via-[#1A140B] to-[#120E08] p-3.5 rounded-2xl border-2 border-amber-500/60 flex flex-col items-center justify-between text-center shadow-xl space-y-2 relative overflow-hidden">
                            <div className="space-y-2 w-full">
                              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40 inline-block">
                                👑 Anfitrión
                              </span>

                              <div className="relative mx-auto w-14 h-14">
                                <img
                                  src={userProfileState.avatar || '/avatars/david.jpg'}
                                  alt={userProfileState.name}
                                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-md ring-2 ring-amber-400/40"
                                />
                                <span className="absolute -bottom-1 -right-1 text-sm bg-stone-900 rounded-full p-0.5 border border-amber-400/40">
                                  {userProfileState.countryFlag || '🇩🇴'}
                                </span>
                              </div>

                              <div>
                                <h4 className="text-sm font-black text-amber-200 truncate max-w-[150px] mx-auto">
                                  {userProfileState.name || 'Jugador Bíblico'}
                                </h4>
                                <p className="text-[10px] font-mono text-amber-400/90 font-bold">
                                  BIBLOS-{(userProfileState.name || 'JUGADOR').substring(0, 3).toUpperCase()}-{Math.floor(1000 + (userProfileState.rating || 1000) % 9000)}
                                </p>
                              </div>

                              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-300 pt-1 border-t border-amber-900/40">
                                <span className="text-amber-300 font-bold">🏆 {userProfileState.rating || 1000} Rating</span>
                                <span className="text-amber-300 font-bold flex items-center gap-1">
                                  <GoldCoinIcon className="w-3.5 h-3.5 inline" /> {userTalents} Tal.
                                </span>
                              </div>
                            </div>

                            <div className="w-full pt-1">
                              <span className="text-[9px] text-emerald-400 font-black bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center justify-center gap-1 w-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Listo para Jugar
                              </span>
                            </div>
                          </div>

                          {/* COLUMNA DERECHA: SALA DE AMIGOS (FILTRADA PARA QUE SOLO APAREZCAN AMIGOS) */}
                          <div className="md:col-span-8 bg-gradient-to-b from-emerald-950/40 via-stone-900/90 to-stone-950 p-3.5 rounded-2xl border-2 border-emerald-500/60 flex flex-col justify-between shadow-xl space-y-2.5">
                            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1.5">
                              <div className="flex items-center gap-1.5 text-left">
                                <Users size={16} className="text-emerald-400" />
                                <div>
                                  <h4 className="text-xs sm:text-sm font-black text-emerald-200 leading-tight">
                                    Sala de Amigos (2 a 8 Jugadores)
                                  </h4>
                                  <span className="text-[9px] text-stone-400">
                                    Solo tus amigos conectados pueden ingresar
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                {selectedFriendsToInvite.length + 1}/8 en Sala
                              </span>
                            </div>

                            {/* REJILLA DE LAS 8 RANURAS DE LA SALA DE AMIGOS */}
                            <div className="grid grid-cols-4 gap-2">
                              {/* Ranura 1: Tú (Anfitrión) */}
                              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-400/80 flex flex-col items-center justify-center text-center shadow">
                                <div className="relative">
                                  <img
                                    src={userProfileState.avatar || '/avatars/david.jpg'}
                                    alt={userProfileState.name}
                                    className="w-9 h-9 rounded-full object-cover border-2 border-amber-400"
                                  />
                                  <span className="absolute -top-1 -right-1 text-[9px]">👑</span>
                                </div>
                                <p className="text-[10px] font-black text-amber-200 truncate max-w-[65px] mt-1">
                                  Tú
                                </p>
                                <span className="text-[8px] font-bold text-amber-400">Anfitrión</span>
                              </div>

                              {/* Ranuras 2 a 8: Amigos Conectados en Tiempo Real o Seleccionados */}
                              {Array.from({ length: 7 }).map((_, idx) => {
                                const networkPlayer = friendsLobbyPlayers[idx + 1];
                                const friendId = selectedFriendsToInvite[idx];
                                const friend = networkPlayer || friendsList.find(f => f.id === friendId);

                                return (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                      friend
                                        ? 'bg-emerald-950/80 border-emerald-400/80 shadow-md ring-1 ring-emerald-400/50 animate-fade-in'
                                        : 'bg-black/30 border-stone-800/80 border-dashed opacity-70'
                                    }`}
                                  >
                                    {friend ? (
                                      <>
                                        <div className="relative">
                                          <img
                                            src={friend.avatar}
                                            alt={friend.name}
                                            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400 shadow"
                                          />
                                          <span className="absolute -bottom-1 -right-1 text-[9px]">
                                            {friend.countryFlag || '🇩🇴'}
                                          </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-emerald-100 truncate max-w-[65px] mt-1">
                                          {friend.name}
                                        </p>
                                        <span className="text-[8px] font-bold text-emerald-400">
                                          {networkPlayer ? '🟢 En Vivo' : '✓ Amigo'}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-9 h-9 rounded-full border border-stone-700 bg-stone-900 flex items-center justify-center text-stone-500 text-[10px]">
                                          {idx + 2}
                                        </div>
                                        <p className="text-[9px] text-stone-500 mt-1 font-medium">Libre</p>
                                        <span className="text-[7px] text-stone-600">Ranura {idx + 2}</span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Botones de Control de la Sala de Amigos */}
                            {friendsLobbyCode ? (
                              <div className="space-y-1.5 pt-1">
                                <div className="p-2 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-center flex items-center justify-between text-xs">
                                  <span className="font-mono text-emerald-300 font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    Sala: {friendsLobbyCode}
                                  </span>
                                  <span className="text-[11px] text-amber-300 font-bold">
                                    {friendsLobbyPlayers.length}/8 Jugadores
                                  </span>
                                </div>

                                {friendsLobbyPlayers.length >= 2 ? (
                                  <button
                                    onClick={() => {
                                      playSound("select");
                                      onlineService.hostStartFriendsMatch(friendsLobbyCode);
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-xl active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                                  >
                                    <Send size={15} /> 🚀 Comenzar Partida con Amigos ({friendsLobbyPlayers.length} Jugadores)
                                  </button>
                                ) : (
                                  <p className="text-[11px] text-amber-300 font-medium animate-pulse text-center py-1">
                                    📡 Buscando amigos en la red... Esperando que acepten la notificación.
                                  </p>
                                )}

                                <button
                                  onClick={() => {
                                    onlineService.cancelFriendsLobby(friendsLobbyCode);
                                    setFriendsLobbyCode(null);
                                    setIsSearchingFriendsInNetwork(false);
                                    setFriendsLobbyPlayers([]);
                                    playSound("select");
                                  }}
                                  className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white font-bold rounded-xl text-[10px] uppercase transition cursor-pointer"
                                >
                                  Cerrar Sala de Amigos
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  playSound("select");
                                  const myCode = `BIBLOS-${(userProfileState?.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfileState?.rating || 1000) % 9000)}`;
                                  const pData = {
                                    name: userProfileState?.name || 'Jugador Bíblico',
                                    avatar: userProfileState?.avatar || '/avatars/david.jpg',
                                    country: userProfileState?.country || 'DO',
                                    countryFlag: userProfileState?.countryFlag || '🇩🇴',
                                    rating: userProfileState?.rating || 1000,
                                    friendCode: myCode
                                  };

                                  setIsSearchingFriendsInNetwork(true);

                                  onlineService.startFriendsLobby(
                                    pData,
                                    (lobbyData) => {
                                      setFriendsLobbyCode(lobbyData.code);
                                      setFriendsLobbyPlayers(lobbyData.players || []);
                                    },
                                    (matchData) => {
                                      playSound("correct");
                                      triggerHaptic("success");
                                      setShowOnlineModal(false);
                                      setShowWelcome(false);
                                      setOnlineRoom(matchData.room);
                                      setScreen('TABLERO');
                                    }
                                  );
                                }}
                                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Send size={14} /> 📡 Abrir Sala y Buscar Amigos en la Red
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 2. LISTA DE TUS AMIGOS VINCULADOS PARA SELECCIONAR O DESELECCIONAR */}
                        <div className="bg-stone-900/60 p-3 rounded-2xl border border-stone-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-200 uppercase flex items-center gap-1.5">
                              <Users size={14} className="text-emerald-400" />
                              Tus Amigos ({friendsList.length}):
                            </span>
                            <div className="flex items-center gap-2">
                              {friendsList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedFriendsToInvite.length === friendsList.length) {
                                      setSelectedFriendsToInvite([]);
                                    } else {
                                      setSelectedFriendsToInvite(friendsList.slice(0, 7).map(f => f.id));
                                    }
                                  }}
                                  className="text-[10px] text-amber-400 hover:underline font-bold"
                                >
                                  {selectedFriendsToInvite.length === friendsList.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                </button>
                              )}
                              <button
                                onClick={() => setShowAddFriendModal(true)}
                                className="py-1 px-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[10px] rounded-xl border border-stone-700 flex items-center gap-1 transition cursor-pointer"
                              >
                                <UserPlus size={11} /> Agregar por Código
                              </button>
                            </div>
                          </div>

                          {friendsList.length === 0 ? (
                            <div className="p-4 rounded-xl bg-stone-950/40 border border-dashed border-stone-800 text-center space-y-1.5">
                              <p className="text-xs font-bold text-stone-300">Aún no tienes amigos vinculados</p>
                              <p className="text-[10px] text-stone-400">
                                Toca el botón <strong>"Invitar Amigos"</strong> abajo para compartir tu enlace oficial.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                              {friendsList.map(friend => {
                                const isSelected = selectedFriendsToInvite.includes(friend.id);
                                const isPending = friend.status === 'PENDING_INCOMING';

                                return (
                                  <div
                                    key={friend.id}
                                    className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition ${
                                      isSelected
                                        ? 'bg-emerald-950/80 border-emerald-400 ring-1 ring-emerald-400'
                                        : isPending
                                        ? 'bg-amber-950/40 border-amber-500/50'
                                        : 'bg-stone-950/70 border-stone-800 hover:border-emerald-500/40'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="relative">
                                          <img src={friend.avatar} alt={friend.name} className="w-8 h-8 rounded-full object-cover border border-amber-400/40" />
                                          <span className="absolute -bottom-1 -right-1 text-[9px]">
                                            {friend.countryFlag || '🇩🇴'}
                                          </span>
                                        </div>
                                        <div className="text-left">
                                          <div className="flex items-center gap-1">
                                            <p className="text-xs font-bold text-amber-100 leading-tight">
                                              {friend.name}
                                            </p>
                                            {isPending && (
                                              <span className="text-[8px] bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded font-black">
                                                Solicitud
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[9px] text-stone-400">
                                            Rating: <strong className="text-amber-300">{friend.rating || 1000}</strong>
                                          </p>
                                        </div>
                                      </div>

                                      {/* Selección para invitar a sala */}
                                      {!isPending && (
                                        <button
                                          onClick={() => {
                                            if (isSelected) {
                                              setSelectedFriendsToInvite(selectedFriendsToInvite.filter(id => id !== friend.id));
                                            } else {
                                              if (selectedFriendsToInvite.length < 7) {
                                                setSelectedFriendsToInvite([...selectedFriendsToInvite, friend.id]);
                                              }
                                            }
                                          }}
                                          className={`w-5 h-5 rounded flex items-center justify-center border text-[11px] font-bold cursor-pointer transition ${
                                            isSelected ? 'bg-emerald-500 text-emerald-950 border-emerald-300' : 'border-stone-700 bg-stone-900 text-transparent hover:border-emerald-400'
                                          }`}
                                          title={isSelected ? 'Deseleccionar' : 'Seleccionar para invitar'}
                                        >
                                          ✓
                                        </button>
                                      )}
                                    </div>

                                    {/* Barra de Controles de Moderación y Amistad */}
                                    <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 text-[10px]">
                                      {isPending ? (
                                        <div className="flex items-center gap-1 w-full justify-between">
                                          <button
                                            onClick={() => {
                                              const updated = acceptFriendRequest(friend.id);
                                              setFriendsList(updated);
                                              playSound("correct");
                                            }}
                                            className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer flex-1"
                                          >
                                            ✓ Aceptar
                                          </button>
                                          <button
                                            onClick={() => {
                                              const updated = rejectFriendRequest(friend.id);
                                              setFriendsList(updated);
                                              playSound("select");
                                            }}
                                            className="py-1 px-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-lg transition cursor-pointer flex-1"
                                          >
                                            ✗ Rechazar
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-[9px] text-stone-500 font-mono">
                                            #{friend.code}
                                          </span>

                                          <div className="flex items-center gap-1">
                                            {/* Reportar */}
                                            <button
                                              onClick={() => {
                                                setReportingFriend(friend);
                                                setReportDetails('');
                                                playSound("select");
                                              }}
                                              className="p-1 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition cursor-pointer"
                                              title="Reportar usuario"
                                            >
                                              <AlertTriangle size={12} />
                                            </button>

                                            {/* Bloquear */}
                                            <button
                                              onClick={() => {
                                                if (confirm(`¿Deseas bloquear a ${friend.name}? Ya no podrá enviarte invitaciones ni interactuar contigo.`)) {
                                                  const res = blockUser(friend.id, friend.name);
                                                  setFriendsList(res.friends);
                                                  setSelectedFriendsToInvite(prev => prev.filter(id => id !== friend.id));
                                                  playSound("select");
                                                }
                                              }}
                                              className="p-1 text-stone-400 hover:text-orange-400 hover:bg-stone-800 rounded transition cursor-pointer"
                                              title="Bloquear usuario"
                                            >
                                              <ShieldAlert size={12} />
                                            </button>

                                            {/* Eliminar */}
                                            <button
                                              onClick={() => {
                                                if (confirm(`¿Eliminar a ${friend.name} de tu lista de amigos?`)) {
                                                  const updated = removeFriend(friend.id);
                                                  setFriendsList(updated);
                                                  setSelectedFriendsToInvite(prev => prev.filter(id => id !== friend.id));
                                                  playSound("select");
                                                }
                                              }}
                                              className="p-1 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded transition cursor-pointer"
                                              title="Eliminar amigo"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 3. BOTÓN INFERIOR PARA DESPLEGAR LA TARJETA DE INVITAR AMIGOS */}
                        <div className="pt-1 space-y-3">
                          <button
                            type="button"
                            onClick={() => {
                              playSound("select");
                              setShowInviteFlyerSection(!showInviteFlyerSection);
                            }}
                            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-between shadow-xl active:scale-[0.98] transition cursor-pointer border border-amber-300"
                          >
                            <div className="flex items-center gap-2">
                              <Share2 size={16} />
                              <span>{showInviteFlyerSection ? 'Ocultar Tarjeta de Invitación ▲' : '➕ Invitar Amigos (Generar Tarjeta Oficial) ▼'}</span>
                            </div>
                            <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              +3 Talentos <GoldCoinIcon className="w-3.5 h-3.5 inline" />
                            </span>
                          </button>

                          {/* TARJETA GRÁFICA OFICIAL DESPLEGABLE */}
                          {showInviteFlyerSection && (
                            <div className="space-y-3 pt-1 animate-fade-in">
                              <div 
                                id="biblos-friend-invite-card"
                                className="bg-gradient-to-b from-[#221A11] via-[#18130C] to-[#0D0A06] p-4 sm:p-5 rounded-3xl border-2 border-amber-500/70 text-center space-y-3.5 shadow-2xl relative overflow-hidden text-stone-200"
                                style={{
                                  backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 119, 6, 0.18), transparent 70%), linear-gradient(to bottom, #221A11, #120E09)'
                                }}
                              >
                                {/* Borde ornamental superior */}
                                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1 font-serif">
                                    🕊️ El Juego de la Biblia
                                  </span>
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-400/40">
                                    Tarjeta Oficial
                                  </span>
                                </div>

                                {/* Logo Oficial de Biblos */}
                                <div className="py-1">
                                  <img
                                    src="/logo-biblos.png"
                                    alt="Biblos Games"
                                    className="w-48 sm:w-56 mx-auto drop-shadow-2xl pointer-events-none"
                                  />
                                </div>

                                {/* Titular Impactante */}
                                <div className="space-y-1">
                                  <h3 className="text-lg sm:text-xl font-serif font-black text-white leading-tight uppercase tracking-tight">
                                    ¡Juguemos una partida bíblica en Biblos Games!
                                  </h3>
                                  <p className="text-[11px] text-amber-200/90 font-medium">
                                    Agrégame como amigo y compitamos en vivo en el tablero
                                  </p>
                                </div>

                                {/* Ficha Destacada del Jugador Anfitrión */}
                                <div className="p-3 bg-gradient-to-r from-stone-900/95 via-emerald-950/80 to-stone-900/95 rounded-2xl border-2 border-emerald-500/60 flex items-center justify-between shadow-inner">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <img
                                        src={userProfileState.avatar || '/avatars/david.jpg'}
                                        alt={userProfileState.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md ring-2 ring-emerald-400/40"
                                      />
                                      <span className="absolute -bottom-1 -right-1 text-sm">
                                        {userProfileState.countryFlag || '🇩🇴'}
                                      </span>
                                    </div>
                                    <div className="text-left">
                                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">
                                        Invitado por:
                                      </span>
                                      <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                                        {userProfileState.name || 'Jugador Bíblico'}
                                      </h4>
                                      <span className="text-[10px] font-mono font-bold text-amber-300">
                                        Código: BIBLOS-{(userProfileState.name || 'JUGADOR').substring(0, 3).toUpperCase()}-{Math.floor(1000 + (userProfileState.rating || 1000) % 9000)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-1 rounded-xl border border-emerald-400/40">
                                      Rating: {userProfileState.rating || 1000}
                                    </span>
                                  </div>
                                </div>

                                {/* Insignias de Juego */}
                                <div className="grid grid-cols-3 gap-2 pt-0.5">
                                  <div className="p-1.5 rounded-xl bg-black/40 border border-amber-900/40 text-[9px] font-bold text-stone-300">
                                    🎲 Tablero en Vivo
                                  </div>
                                  <div className="p-1.5 rounded-xl bg-black/40 border border-amber-900/40 text-[9px] font-bold text-stone-300">
                                    ⚔️ Duelos Bíblicos
                                  </div>
                                  <div className="p-1.5 rounded-xl bg-black/40 border border-amber-900/40 text-[9px] font-bold text-stone-300">
                                    🏆 Salón de la Fama
                                  </div>
                                </div>

                                {/* Pie de Flyer */}
                                <div className="pt-1 text-[9px] text-stone-400 border-t border-stone-800/80 flex items-center justify-between">
                                  <span>biblosgames.com</span>
                                  <span className="text-amber-400 font-mono font-bold">¡Entra y Juégalo Gratis!</span>
                                </div>
                              </div>

                              {/* BOTONES PRINCIPALES: COMPARTIR EN REDES / DESCARGAR IMAGEN */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                <button
                                  onClick={async () => {
                                    playSound("select");
                                    const myCode = `BIBLOS-${(userProfileState.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (userProfileState.rating || 1000) % 9000)}`;
                                    const inviteUrl = generateFriendInviteUrl({
                                      name: userProfileState.name || 'Jugador Bíblico',
                                      code: myCode,
                                      avatar: userProfileState.avatar || '/avatars/david.jpg',
                                      country: userProfileState.country || 'DO',
                                      countryFlag: userProfileState.countryFlag || '🇩🇴'
                                    });
                                    const bonus = claimSocialShareBonus();
                                    if (bonus.success) {
                                      setUserTalents(bonus.newBalance);
                                      confetti({ particleCount: 50, spread: 60 });
                                    }
                                    await shareFriendInviteCard(userProfileState.name || 'Jugador Bíblico', inviteUrl);
                                  }}
                                  className="py-3 px-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer border border-amber-300"
                                >
                                  <Share2 size={16} /> Compartir en Redes
                                </button>

                                <button
                                  onClick={async () => {
                                    playSound("select");
                                    await downloadFriendInviteCard();
                                    triggerHaptic("success");
                                  }}
                                  className="py-3 px-3 bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-amber-500/50 shadow-md active:scale-95 transition cursor-pointer"
                                >
                                  <Download size={16} /> Descargar Imagen
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* VISTA 5: SUBMODAL JUGAR EVENTOS (TORNEOS SEMANALES & FEEDER) */}
                    {onlineSubTab === 'EVENTS' && (
                      <div className="space-y-4">
                        {/* Banner Principal de LA COPA BIBLOS */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-amber-950 shadow-2xl relative overflow-hidden border-2 border-amber-300/80">
                          <div className="relative z-10 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-black/70 text-amber-300 px-3 py-0.5 rounded-full font-black uppercase tracking-wider backdrop-blur-sm border border-amber-400/40">
                                📅 Todos los Domingos · 7:00 PM UTC (3:00 PM RD 🇩🇴)
                              </span>
                              <span className="text-3xl filter drop-shadow-md">🏆</span>
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-2xl font-serif font-black uppercase tracking-tight leading-tight text-white drop-shadow">
                                🏆 LA COPA BIBLOS
                              </h3>
                              <p className="text-xs sm:text-sm font-black text-amber-950 mt-0.5">
                                Participa en la Copa Biblos cada semana y obtén fabulosos premios.
                              </p>
                            </div>
                            <p className="text-xs text-amber-950/90 font-medium leading-snug">
                              El gran evento semanal de Biblos Games. Familias, jóvenes e iglesias de todo el mundo compiten en simultáneo por la gloria del conocimiento bíblico.
                            </p>

                            {/* Franja de Horarios Internacionales */}
                            <div className="pt-1 flex flex-wrap gap-1.5 text-[9px] font-bold">
                              <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded-md">🇩🇴 RD: 3:00 PM</span>
                              <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded-md">🇲🇽 MEX: 1:00 PM</span>
                              <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded-md">🇨🇴 COL: 2:00 PM</span>
                              <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded-md">🇦🇷 ARG: 4:00 PM</span>
                              <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded-md">🇪🇸 ESP: 9:00 PM</span>
                            </div>
                          </div>
                        </div>

                        {/* Contador Regresivo para el Domingo */}
                        <div className="bg-stone-900/95 p-4 rounded-2xl border-2 border-amber-500/50 text-center space-y-1.5 shadow-xl">
                          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <Clock size={13} /> Cuenta Regresiva para la Próxima Copa Biblos:
                          </p>
                          <p className="text-3xl sm:text-4xl font-mono font-black text-amber-300 tracking-wider">
                            {eventCountdownStr || '00d 00h 00m 00s'}
                          </p>
                          <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <span>🎁 Premio: Trofeo Copa Biblos + Corona de Oro + 500 Pts ELO + 50 Talentos</span>
                            <GoldCoinIcon className="w-4 h-4 inline" />
                          </p>
                        </div>

                        {/* Fases / Niveles de la Competencia */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-amber-200 uppercase tracking-wide">Fases de la Copa Biblos (3 Rondas Eliminatorias):</p>
                          <div className="space-y-1.5">
                            {weeklyEvent.stages.map(stage => (
                              <div key={stage.stageNumber} className="p-2.5 bg-stone-900/80 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-amber-100">{stage.title}</p>
                                  <p className="text-[10px] text-stone-400">Dificultad: <strong className="text-emerald-400">{stage.difficulty}</strong> · {stage.questionsCount} Preguntas</p>
                                </div>
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                                  x{stage.pointsMultiplier} Pts
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Botón de Entrada a la Copa Biblos */}
                        <div className="space-y-2 pt-1">
                          <button
                            onClick={() => {
                              playSound("select");
                              setShowOnlineModal(false);
                              setShowCopaBiblosMode(true);
                            }}
                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black rounded-xl text-xs uppercase tracking-widest transition shadow-xl active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trophy size={16} /> 🏆 Entrar a la Sala de la Copa Biblos
                          </button>

                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-stone-400">¿Deseas programar o alimentar preguntas exclusivas?</span>
                            <button
                              onClick={() => setShowEventFeederModal(true)}
                              className="text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              ⚙️ Alimentar Preguntas
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // SALA DE ESPERA & FASES DE VOTACIÓN DEMOCRÁTICA
                  <div className="space-y-6">
                    {/* Tarjeta de Código de Sala con Botón de Copiar y Compartir */}
                    <div className="bg-stone-900/80 p-4 rounded-2xl border border-blue-600/40 text-center space-y-3 relative shadow-lg">
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Código de la Sala</p>
                      
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-wider bg-black/40 px-4 py-2 rounded-xl border border-amber-500/30 select-all shadow-inner">
                          {onlineRoom?.code || '------'}
                        </span>
                        
                        <button
                          type="button"
                          onClick={async () => {
                            const roomCode = onlineRoom?.code || '';
                            const success = await copyToClipboard(roomCode);
                            if (success) {
                              playGameSound('correct');
                              triggerHaptic('success');
                              setIsCopiedCode(true);
                              setTimeout(() => setIsCopiedCode(false), 2500);
                            } else {
                              playGameSound('wrong');
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer ${
                            isCopiedCode
                              ? 'bg-emerald-500 text-emerald-950 ring-2 ring-emerald-300'
                              : 'bg-amber-500 hover:bg-amber-400 text-amber-950 ring-1 ring-amber-400'
                          }`}
                          title="Copiar Código de Sala"
                        >
                          {isCopiedCode ? <Check size={16} className="stroke-[3]" /> : <Copy size={16} />}
                          <span>{isCopiedCode ? '¡Copiado!' : 'Copiar PIN'}</span>
                        </button>

                        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                          <button
                            type="button"
                            onClick={() => {
                              playGameSound('select');
                              triggerHaptic('light');
                              const roomCode = onlineRoom?.code || '';
                              const shareMessage = `✨ ¡Te invito a jugar conmigo en BIBLOS GAMES! 🎲\n\n📌 Código de Sala: ${roomCode}\n\nIngresa en el Modo En Línea: ${window.location.origin}`;
                              navigator.share({
                                title: 'Biblos Games - Sala Multijugador',
                                text: shareMessage,
                                url: window.location.origin
                              }).catch(() => {});
                            }}
                            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow cursor-pointer"
                            title="Compartir por WhatsApp / Mensaje"
                          >
                            <Share2 size={15} />
                            <span>Compartir</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-emerald-400 font-semibold pt-0.5">
                        {(onlineRoom?.players || []).length} {(onlineRoom?.players || []).length === 1 ? 'Jugador Conectado' : 'Jugadores Conectados'}
                      </p>
                    </div>

                    {/* FASE 1: LOBBY & JUGADORES */}
                    {(!onlineRoom.status || onlineRoom.status === 'LOBBY') && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-stone-300 uppercase">Jugadores en el Lobby:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {(onlineRoom.players || []).map(p => (
                              <div key={p.id} className="p-2.5 bg-stone-900 rounded-xl border border-stone-800 flex items-center gap-2">
                                <img src={p.avatar || '/avatars/david.jpg'} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-amber-400/50" />
                                <div>
                                  <p className="text-xs font-bold text-amber-200 leading-tight">{p.name || 'Jugador'}</p>
                                  <p className="text-[9px] text-stone-400">{p.isHost ? '👑 Anfitrión' : '⚡ Competidor'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Configuración de Tiempo por Pregunta para el Anfitrión */}
                        <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800 space-y-1.5">
                          <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                            ⏱️ Tiempo para responder cada pregunta:
                          </label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {[
                              { label: '⚡ 15s (Rápido)', val: 15 },
                              { label: '20s', val: 20 },
                              { label: '25s', val: 25 },
                              { label: '30s', val: 30 },
                              { label: '♾️ Infinito', val: 99999 }
                            ].map(t => (
                              <button
                                key={t.val}
                                onClick={() => {
                                  setQuestionTimeLimit(t.val);
                                  onlineService.sendGameAction('SET_TIME_LIMIT', { timeLimit: t.val });
                                }}
                                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition border cursor-pointer ${
                                  questionTimeLimit === t.val 
                                    ? 'bg-amber-500 text-amber-950 border-amber-300 shadow ring-2 ring-amber-400' 
                                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-amber-500/40'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Botón de Inicio con validación clara de jugadores */}
                        {(() => {
                          const playerCount = (onlineRoom.players || []).length;
                          const isHost = onlineRoom.players?.some(p => String(p.id) === String(onlineService.getSocketId()) && p.isHost) ?? true;

                          if (playerCount < 2) {
                            return (
                              <div className="space-y-2">
                                <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/40 text-[11px] text-amber-200 flex items-center justify-center gap-2">
                                  <span className="text-sm">⏳</span>
                                  <span>Esperando que tu amigo o hermano se una con el PIN <strong>{onlineRoom.code}</strong>...</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Autocompletar con BiblosBot si quiere jugar ya
                                    onlineService.sendGameAction('ADD_BOT_TO_ROOM', { roomCode: onlineRoom.code });
                                    onlineService.setRoomStatus('VOTING_THEME');
                                  }}
                                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-bold rounded-xl text-xs uppercase border border-stone-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <span>🤖</span>
                                  <span>Jugar contra BiblosBot (1vs1)</span>
                                </button>
                              </div>
                            );
                          }

                          return (
                            <button
                              onClick={() => onlineService.setRoomStatus('VOTING_THEME')}
                              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg cursor-pointer animate-pulse"
                            >
                              🗳️ Iniciar Votación de Temática ({playerCount} Jugadores)
                            </button>
                          );
                        })()}
                      </div>
                    )}

                    {/* FASE 2: VOTACIÓN DEMOCRÁTICA DE TEMÁTICA (CON LOS ICONOS OFICIALES DE LA APP) */}
                    {onlineRoom.status === 'VOTING_THEME' && (
                      <div className="space-y-4 text-center">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-amber-300 uppercase">Paso 1: Vota el Modo o Temática</p>
                          <p className="text-[10px] text-amber-400 font-semibold bg-amber-950/40 py-1 px-3 rounded-full border border-amber-800/40 inline-block">
                            ⚡ Regla: ¡Votación Democrática Instantánea!
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'PERIODOS', label: 'Periodos Bíblicos', icon: LayoutGrid },
                            { id: 'PRINCIPIANTE', label: 'Principiante', icon: Sparkles },
                            { id: 'VERSICULOS', label: 'Versículos', icon: BookOpen },
                            { id: 'PERSONAJES', label: 'Personajes', icon: Users },
                            { id: 'DIOS', label: 'Modo Dios', icon: Crown },
                            { id: 'SALVACION', label: 'Salvación', icon: Cross },
                            { id: 'MANDAMIENTOS', label: 'Mandamientos', icon: ScrollText },
                            { id: 'HISTORIA', label: 'Historia', icon: Landmark },
                            { id: 'GEOGRAFIA', label: 'Geografía', icon: MapPin }
                          ].map(t => {
                            const IconComp = t.icon;
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  onlineService.voteTheme(userProfileState.id || 'usr_1', t.id);
                                  onlineService.setRoomStatus('VOTING_DIFFICULTY', { winningTheme: t.id });
                                }}
                                className="p-3 bg-[#2A2621] hover:bg-amber-500/20 border border-stone-800 hover:border-amber-500 rounded-xl font-bold text-xs text-amber-100 transition text-center flex flex-col items-center justify-center gap-1.5 shadow group cursor-pointer"
                              >
                                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 group-hover:bg-amber-500 group-hover:text-amber-950 transition-colors">
                                  <IconComp size={18} />
                                </div>
                                <span className="text-[11px] leading-tight font-bold">{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* FASE 3: VOTACIÓN DE DIFICULTAD */}
                    {onlineRoom.status === 'VOTING_DIFFICULTY' && (
                      <div className="space-y-4 text-center">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-blue-300 uppercase">Paso 2: Vota el Grado de Complejidad</p>
                          <p className="text-[10px] text-blue-300 font-semibold bg-blue-950/40 py-1 px-3 rounded-full border border-blue-800/40 inline-block">
                            ⚡ Regla: ¡Votación Democrática Instantánea!
                          </p>
                        </div>
                        <p className="text-[11px] text-stone-400">Temática seleccionada: <strong className="text-amber-300">{onlineRoom.winningTheme || 'MIXTO'}</strong></p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: 'PRINCIPIANTE', sub: 'Nivel 1 y 2 (Básico)', color: 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200' },
                            { label: 'INTERMEDIO', sub: 'Nivel 3 y 4 (Medio)', color: 'bg-blue-950/60 border-blue-700/60 text-blue-200' },
                            { label: 'AVANZADO', sub: 'Nivel 5 a 7 (Pro)', color: 'bg-purple-950/60 border-purple-700/60 text-purple-200' },
                            { label: 'MIXTO', sub: 'Nivel 3+ (Todas)', color: 'bg-indigo-950/70 border-indigo-500/70 text-indigo-200 ring-1 ring-indigo-400' }
                          ].map(d => (
                            <button
                              key={d.label}
                              onClick={() => {
                                onlineService.voteDifficulty(userProfileState.id || 'usr_1', d.label);
                                onlineService.setRoomStatus('COUNTDOWN', { winningDifficulty: d.label });
                              }}
                              className={`p-3 rounded-xl border font-bold text-xs transition cursor-pointer ${d.color}`}
                            >
                              <p>{d.label}</p>
                              <span className="text-[9px] opacity-70">{d.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FASE 4: CUENTA REGRESIVA SINCRONIZADA */}
                    {onlineRoom.status === 'COUNTDOWN' && (
                      <div className="text-center py-6 space-y-4">
                        <div className="inline-block p-5 bg-amber-500/20 border-2 border-amber-400 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse">
                          <span className="text-6xl font-mono font-black text-amber-300">
                            {onlineCountdown !== null ? (onlineCountdown === 0 ? "🚀" : onlineCountdown) : "⏱️"}
                          </span>
                        </div>
                        <p className="text-sm font-black text-amber-300 uppercase tracking-widest">
                          {onlineCountdown === 0 ? "¡¡A JUGAR!!" : "¡Votaciones Completadas! Entrando al Tablero..."}
                        </p>
                        <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-stone-800 inline-block text-xs space-y-1.5 shadow">
                          <p>Temática: <strong className="text-amber-200">{onlineRoom.winningTheme || 'MIXTO'}</strong></p>
                          <p>Dificultad: <strong className="text-emerald-300">{onlineRoom.winningDifficulty || 'INTERMEDIO'}</strong></p>
                        </div>
                        <p className="text-[11px] text-stone-400">Sincronizando competidores en vivo...</p>
                        <button
                          onClick={() => {
                            setShowOnlineModal(false);
                            setShowWelcome(false);
                            setScreen('TABLERO');
                          }}
                          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-teal-950 font-black rounded-xl text-xs uppercase tracking-widest transition shadow-xl cursor-pointer"
                        >
                          ⚡ Entrar al Tablero Ahora
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        onlineService.leaveRoom();
                        setOnlineRoom(null);
                      }}
                      className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs font-bold rounded-xl border border-stone-800 transition cursor-pointer"
                    >
                      Salir de la Sala
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* ➕ Modal para Agregar Amigo */}
      {showAddFriendModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowAddFriendModal(false)}
        >
          <div
            className="bg-[#2A241C] border-2 border-emerald-500/50 rounded-3xl max-w-sm w-full p-5 text-stone-200 shadow-2xl space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddFriendModal(false)}
              className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-800/60"
            >
              <XCircle size={18} />
            </button>

            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-400/30">
                <UserPlus size={20} />
              </div>
              <h3 className="text-base font-bold text-emerald-200 font-serif">Agregar Nuevo Amigo</h3>
              <p className="text-xs text-stone-400">Ingresa su nombre o su código de amigo</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-stone-400 uppercase font-bold">Nombre o Alias:</label>
                <input
                  type="text"
                  placeholder="Ej: David, Hna. Sara"
                  value={newFriendName}
                  onChange={e => setNewFriendName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-amber-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-400 uppercase font-bold">Código de Amigo:</label>
                <input
                  type="text"
                  placeholder="Ej: BIBLOS-DAV-8821"
                  value={newFriendCode}
                  onChange={e => setNewFriendCode(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (newFriendName.trim() || newFriendCode.trim()) {
                  const friendName = newFriendName.trim() || 'Hermano en la Fe';
                  const friendCode = newFriendCode.trim() || `BIB-${Math.floor(1000 + Math.random() * 9000)}`;
                  const updated = addFriend(friendName, friendCode);
                  setFriendsList(getSavedFriends());
                  setNewFriendName('');
                  setNewFriendCode('');
                  setShowAddFriendModal(false);
                  playSound('correct');
                }
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow"
            >
              Guardar Amigo
            </button>
          </div>
        </div>
      )}

      {/* ⚙️ Modal Feeder para Alimentar Preguntas de Eventos sin Actualizaciones */}
      {showEventFeederModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowEventFeederModal(false)}
        >
          <div
            className="bg-[#2A241C] border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-5 text-stone-200 shadow-2xl space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEventFeederModal(false)}
              className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-800/60"
            >
              <XCircle size={18} />
            </button>

            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto border border-amber-400/30">
                <Calendar size={20} />
              </div>
              <h3 className="text-base font-bold text-amber-200 font-serif">Alimentar Preguntas de Eventos</h3>
              <p className="text-xs text-stone-400">Actualiza las preguntas y temáticas semanales en vivo sin subir una nueva app</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-stone-400 uppercase font-bold">URL de Configuración / JSON Remoto:</label>
                <input
                  type="url"
                  placeholder="https://biblosgames.com/api/weekly-event.json"
                  value={eventFeederUrl}
                  onChange={e => setEventFeederUrl(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[9px] text-stone-500 mt-1">
                  Puedes conectar un endpoint JSON de tu servidor o Supabase para cambiar los eventos cada semana automáticamente.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={async () => {
                  if (eventFeederUrl.trim()) {
                    setIsEventLoading(true);
                    const updated = await loadRemoteEventQuestions(eventFeederUrl.trim());
                    setIsEventLoading(false);
                    if (updated) {
                      setWeeklyEvent(updated);
                      setShowEventFeederModal(false);
                      playSound('correct');
                    } else {
                      alert('No se pudo conectar a la URL remota. Se conservó el evento predeterminado.');
                    }
                  }
                }}
                className="py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow cursor-pointer"
              >
                {isEventLoading ? 'Cargando...' : 'Sincronizar URL'}
              </button>
              <button
                onClick={() => setShowEventFeederModal(false)}
                className="py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👤 Modal de Selección en Solitario (Trivia vs Tablero) */}
      {showSoloSubmodeModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            className="bg-[#24201A] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full text-center space-y-4 shadow-2xl relative"
          >
            <button
              onClick={() => setShowSoloSubmodeModal(false)}
              className="absolute top-3 right-3 p-2 text-stone-400 hover:text-white rounded-full bg-stone-800/60 cursor-pointer"
            >
              <XCircle size={20} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex p-2.5 bg-emerald-500/15 rounded-2xl border border-emerald-500/30 text-amber-300 mb-1">
                <User size={28} />
              </div>
              <h3 className="text-lg font-serif font-black text-amber-200 uppercase tracking-wide">
                Modo Solitario
              </h3>
              <p className="text-xs text-stone-400">
                Elige tu experiencia de juego individual
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1 text-left">
              {/* OPCIÓN A: MODO TRIVIA */}
              <button
                onClick={() => {
                  playSound("select");
                  setShowSoloSubmodeModal(false);
                  setScreen('TRIVIA');
                  setGameMode(null);
                }}
                className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-900/60 to-stone-900 hover:from-amber-800/80 hover:to-stone-800 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl transition-all flex items-center gap-3.5 group active:scale-98 shadow-lg cursor-pointer"
              >
                <div className="p-3 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30 group-hover:scale-110 transition shrink-0">
                  <BookOpen size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-amber-200 text-sm uppercase tracking-wide">
                      Modo Trivia
                    </h4>
                    <span className="text-[9px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      9 Temáticas
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                    Estudio bíblico, preguntas clásicas por períodos y modo proyección.
                  </p>
                </div>
              </button>

              {/* OPCIÓN B: MODO TABLERO CONTRARRELOJ */}
              <button
                onClick={() => {
                  playSound("select");
                  setShowSoloSubmodeModal(false);
                  setBoardSubMode('SOLO');
                  setActiveCustomStudyFilter(null);
                  setScreen('TABLERO');
                }}
                className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/70 to-stone-900 hover:from-emerald-900/80 hover:to-stone-800 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl transition-all flex items-center gap-3.5 group active:scale-98 shadow-lg cursor-pointer"
              >
                <div className="p-3 bg-emerald-500/20 text-amber-300 rounded-xl border border-emerald-400/30 group-hover:scale-110 transition shrink-0">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-emerald-200 text-sm uppercase tracking-wide">
                      Tablero Contrarreloj
                    </h4>
                    <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      Rating ELO
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                    Carrera contrarreloj (+1 por casilla con pregunta obligatoria) y Salón de la Fama.
                  </p>
                </div>
              </button>

              {/* OPCIÓN C: TABLERO CONTRA BIBLOSBOT */}
              <button
                onClick={() => {
                  playSound("select");
                  setShowSoloSubmodeModal(false);
                  setBoardSubMode('VS_BOTS');
                  setActiveCustomStudyFilter(null);
                  setScreen('TABLERO');
                }}
                className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-stone-900 hover:from-blue-900/80 hover:to-stone-800 border-2 border-blue-500/50 hover:border-blue-400 rounded-2xl transition-all flex items-center gap-3.5 group active:scale-98 shadow-lg cursor-pointer ring-1 ring-blue-500/20"
              >
                <div className="p-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/40 group-hover:scale-110 transition shrink-0">
                  <Bot size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-blue-200 text-sm uppercase tracking-wide">
                      Tablero Contra BiblosBot
                    </h4>
                    <span className="text-[9px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                      1vs1 y Bots
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                    Compite en el tablero tradicional por turnos contra rivales bíblicos inteligentes.
                  </p>
                </div>
              </button>

              {/* OPCIÓN C: ESTUDIO BÍBLICO PERSONALIZADO (PREMIUM VIP) */}
              {(() => {
                const isStudyLocked = !userProfileState?.isPremium;
                return (
                  <button
                    onClick={() => {
                      if (isStudyLocked) {
                        playSound("select");
                        triggerHaptic("warning");
                        setShowSoloSubmodeModal(false);
                        setShowPremiumModal(true);
                        return;
                      }
                      playSound("select");
                      setShowSoloSubmodeModal(false);
                      setShowCustomStudyModal(true);
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl transition-all flex items-center gap-3.5 group active:scale-98 shadow-lg cursor-pointer border-2 ${
                      isStudyLocked
                        ? 'bg-gradient-to-r from-[#2A2016] to-[#1C1814] border-amber-600/40 hover:border-amber-400'
                        : 'bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-stone-900 hover:from-purple-900/80 hover:to-stone-800 border-purple-500/50 hover:border-purple-400 ring-1 ring-purple-500/30'
                    }`}
                  >
                    <div className={`p-3 rounded-xl border group-hover:scale-110 transition shrink-0 ${
                      isStudyLocked
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                    }`}>
                      <ScrollText size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-bold text-sm uppercase tracking-wide flex items-center gap-1.5 ${
                          isStudyLocked ? 'text-amber-300' : 'text-purple-200'
                        }`}>
                          <span>Estudio Bíblico Personalizado</span>
                        </h4>
                        <span className="text-[9px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-500/40">
                          {isStudyLocked ? <Lock size={9} /> : <Crown size={9} />}
                          <span>{isStudyLocked ? '🔒 👑' : '👑 VIP'}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                        Filtra por Testamento (AT/NT), Libro individual y Temática específica en Trivia o Tablero.
                      </p>
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 📖 MODAL DE ESTUDIO BÍBLICO PERSONALIZADO (PREMIUM VIP) */}
      {showCustomStudyModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowCustomStudyModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#231E18] border-2 border-purple-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-stone-200 shadow-2xl space-y-4 relative my-auto max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowCustomStudyModal(false)}
              className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-800/80 cursor-pointer"
            >
              <XCircle size={20} />
            </button>

            {/* ENCABEZADO */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 text-purple-300 flex items-center justify-center mx-auto border border-purple-400/40 shadow-inner">
                <ScrollText size={24} />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-serif font-black text-amber-200 tracking-wide">
                  Estudio Bíblico Personalizado
                </h3>
                <span className="text-[9px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/40">
                  👑 VIP
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Diseña tu sesión de estudio según tus necesidades pastorales, de escuela dominical o devocional.
              </p>
            </div>

            {/* SECCIÓN 1: SELECCIÓN DE TESTAMENTO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>📜 1. Alcance Bíblico / Testamento:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ALL', label: 'Toda la Biblia', sub: '66 Libros', icon: '📖' },
                  { id: 'OT', label: 'Antiguo Test.', sub: '39 Libros', icon: '🏛️' },
                  { id: 'NT', label: 'Nuevo Test.', sub: '27 Libros', icon: '✝️' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      playSound("select");
                      setStudyTestament(t.id as any);
                      setStudyBook('ALL'); // Resetear libro al cambiar testamento
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      studyTestament === t.id
                        ? 'bg-purple-600/30 border-purple-400 text-white font-black shadow ring-2 ring-purple-500/50'
                        : 'bg-stone-900/80 border-stone-700/80 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-xs font-bold leading-tight">{t.label}</span>
                    <span className="text-[9px] text-stone-500">{t.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN 2: SELECCIÓN DE LIBRO INDIVIDUAL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>📚 2. Libro Específico:</span>
                </label>
                <span className="text-[10px] text-purple-300 font-bold">
                  {studyBook === 'ALL' ? 'Todos los libros del alcance' : studyBook}
                </span>
              </div>
              <select
                value={studyBook}
                onChange={(e) => setStudyBook(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-amber-200 focus:outline-none focus:border-purple-500 cursor-pointer font-medium"
              >
                <option value="ALL">📖 Todos los Libros ({studyTestament === 'ALL' ? '66 Libros' : studyTestament === 'OT' ? '39 del AT' : '27 del NT'})</option>
                {(() => {
                  const booksList = studyTestament === 'OT'
                    ? OLD_TESTAMENT_BOOKS
                    : studyTestament === 'NT'
                    ? NEW_TESTAMENT_BOOKS
                    : ALL_BIBLE_BOOKS;

                  return booksList.map((bk) => (
                    <option key={bk} value={bk}>
                      {bk}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* SECCIÓN 3: TEMÁTICA O MODO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>🎯 3. Temática o Enfoque:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ALL', label: 'Todas', icon: '🎲' },
                  { id: 'PERIODOS', label: 'Períodos', icon: '🗺️' },
                  { id: 'VERSICULOS', label: 'Versículos', icon: '📖' },
                  { id: 'PERSONAJES', label: 'Personajes', icon: '👥' },
                  { id: 'DIOS', label: 'Modo Dios', icon: '👑' },
                  { id: 'SALVACION', label: 'Salvación', icon: '✝️' },
                  { id: 'MANDAMIENTOS', label: 'Mandamientos', icon: '📜' },
                  { id: 'HISTORIA', label: 'Historia', icon: '🏛️' },
                  { id: 'GEOGRAFIA', label: 'Geografía', icon: '📍' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      playSound("select");
                      setStudyTheme(th.id);
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      studyTheme === th.id
                        ? 'bg-purple-600/30 border-purple-400 text-purple-200 font-black shadow ring-1 ring-purple-400'
                        : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-xs">{th.icon}</span>
                    <span className="text-[10px] font-bold truncate">{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN 4: EXPERIENCIA DE JUEGO (TRIVIA VS TABLERO) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>🎮 4. ¿Cómo deseas estudiarlo?:</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStudyGameExperience('TRIVIA')}
                  className={`p-3 rounded-2xl border-2 transition cursor-pointer text-left flex items-start gap-2.5 ${
                    studyGameExperience === 'TRIVIA'
                      ? 'bg-amber-950/40 border-amber-400 text-amber-200 shadow ring-2 ring-amber-400/40'
                      : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:bg-stone-850'
                  }`}
                >
                  <BookOpen size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs uppercase">Modo Trivia</h5>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Preguntas directas y cronometradas.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStudyGameExperience('TABLERO')}
                  className={`p-3 rounded-2xl border-2 transition cursor-pointer text-left flex items-start gap-2.5 ${
                    studyGameExperience === 'TABLERO'
                      ? 'bg-emerald-950/40 border-emerald-400 text-emerald-200 shadow ring-2 ring-emerald-400/40'
                      : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:bg-stone-850'
                  }`}
                >
                  <Sparkles size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs uppercase">Modo Tablero</h5>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Carrera paso a paso con las preguntas filtradas.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* BOTÓN DE ACCIÓN: INICIAR ESTUDIO PERSONALIZADO */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const filter: CustomStudyFilter = {
                    testament: studyTestament,
                    book: studyBook,
                    theme: studyTheme,
                    difficulty: 'MIXTO'
                  };

                  // Validar que hayan preguntas coincidentes en el banco
                  const matching = filterQuestionsForCustomStudy(ALL_QUESTIONS, filter);
                  if (matching.length === 0) {
                    alert(`No se encontraron preguntas en el banco para "${studyBook === 'ALL' ? studyTestament : studyBook}" con la temática seleccionada. Intenta con "Todas las Temáticas" o todo el Testamento.`);
                    return;
                  }

                  playSound("select");
                  triggerHaptic("success");
                  setActiveCustomStudyFilter(filter);
                  setShowCustomStudyModal(false);

                  if (studyGameExperience === 'TRIVIA') {
                    setGameMode(studyTheme === 'ALL' ? 'MIXTO' : studyTheme as any);
                    setScreen('TRIVIA');
                  } else {
                    setBoardSubMode('SOLO');
                    setScreen('TABLERO');
                  }
                }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-xl border border-purple-300/40 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles size={16} className="text-amber-300 animate-spin-slow" />
                <span>Iniciar Estudio Bíblico Personalizado</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ✨ REACCIONES DE EMOJIS Y FRASES BÍBLICAS FLOTANTES EN PANTALLA */}
      {floatingEmojiBursts.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden flex flex-col justify-end items-end p-6 space-y-2">
          {floatingEmojiBursts.map((burst) => (
            <div
              key={burst.id}
              className="bg-stone-950/95 border-2 border-amber-400/80 shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-2.5 animate-bounce backdrop-blur-md"
            >
              <span className="text-2xl filter drop-shadow-md">
                {burst.emoji.length <= 4 ? burst.emoji : '💬'}
              </span>
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none">
                  {burst.senderName}
                </p>
                <p className="text-xs font-bold text-stone-100 leading-tight mt-0.5">
                  {burst.emoji}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🏆 TORNEO LA COPA BIBLOS (3 FASES ELIMINATORIAS) */}
      {showCopaBiblosMode && (
        <CopaBiblosTournamentMode
          userProfile={userProfileState}
          onExit={() => setShowCopaBiblosMode(false)}
          onOpenProfile={() => {
            setShowCopaBiblosMode(false);
            setShowProfileModal(true);
          }}
          playSound={playSound}
          triggerHaptic={triggerHaptic}
        />
      )}

      {/* ⚠️ MODAL DE REPORTAR Y BLOQUEAR USUARIO */}
      {reportingFriend && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setReportingFriend(null)}
        >
          <div
            className="bg-[#24201A] border-2 border-rose-500/70 rounded-3xl max-w-md w-full p-5 text-center space-y-3.5 shadow-2xl relative text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 mx-auto flex items-center justify-center text-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-serif font-black text-white leading-tight">
                Reportar a {reportingFriend.name}
              </h3>
              <p className="text-xs text-stone-400">
                Selecciona el motivo del reporte. Este jugador será bloqueado automáticamente.
              </p>
            </div>

            <div className="space-y-2 text-left text-xs">
              <label className="block text-stone-300 font-bold text-[11px]">Motivo del Reporte:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as any)}
                className="w-full p-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-200 text-xs focus:border-rose-400 outline-none"
              >
                <option value="CONDUCTA_INAPROPIADA">Conducta Inapropiada / Lenguaje Ofensivo</option>
                <option value="NOMBRE_OFENSIVO">Nombre de Perfil Ofensivo</option>
                <option value="TRAMPA">Sospecha de Trampa / Abandono Frecuente</option>
                <option value="OTRO">Otro Motivo</option>
              </select>

              <label className="block text-stone-300 font-bold text-[11px] pt-1">Detalles (Opcional):</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe brevemente lo ocurrido..."
                rows={2}
                className="w-full p-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-200 text-xs focus:border-rose-400 outline-none resize-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  reportUser(reportingFriend.code, reportingFriend.name, reportReason, reportDetails);
                  const updated = removeFriend(reportingFriend.id);
                  setFriendsList(updated);
                  setSelectedFriendsToInvite(prev => prev.filter(id => id !== reportingFriend.id));
                  setReportingFriend(null);
                  alert(`✅ El reporte de ${reportingFriend.name} ha sido enviado con éxito y el usuario fue bloqueado.`);
                  playSound("select");
                }}
                className="w-full py-3 bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
              >
                Enviar Reporte y Bloquear
              </button>

              <button
                type="button"
                onClick={() => setReportingFriend(null)}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 font-bold rounded-xl text-[11px] uppercase tracking-wider transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚪 MODAL DE CONFIRMACIÓN PARA SALIR / ABANDONAR PARTIDA DE TRIVIA */}
      <AnimatePresence>
        {showTriviaExitConfirm && (
          <motion.div
            key="trivia-exit-confirm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-black/85 backdrop-blur-md p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#24201A] border-2 border-amber-500/60 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto border border-amber-400/40">
                <span className="text-2xl">⚠️</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-amber-200">
                  ¿Abandonar la Partida?
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Tienes una partida de Trivia en curso. Si sales ahora, se reiniciará tu ronda actual y tu puntuación de sesión. ¿Deseas salir al menú principal?
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowTriviaExitConfirm(false);
                    playSound("select");
                    resetGame();
                    setScreen('WELCOME');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Sí, Salir de la Partida
                </button>
                <button
                  type="button"
                  onClick={() => setShowTriviaExitConfirm(false)}
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Continuar Jugando
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 MODAL INTERACTIVO: DESAFÍO BÍBLICO DIARIO (10 CASILLAS Y +1 TALENTO) */}
      <DailyChallengeModal
        isOpen={showDailyChallengeModal}
        onClose={() => setShowDailyChallengeModal(false)}
        onUpdateTalents={(newBalance) => setUserTalents(newBalance)}
        playSound={playSound}
        triggerHaptic={triggerHaptic}
      />

      {/* 🧭 SIMULADOR GUIADO INTERACTIVO DE PRIMERA PARTIDA */}
      <GuidedSimulatorTutorial
        isOpen={showGuidedSimulator}
        onFinish={() => setShowGuidedSimulator(false)}
        playSound={playSound}
        triggerHaptic={triggerHaptic}
      />

      {/* 📊 PANEL EJECUTIVO DE ANALÍTICA Y RETENCIÓN (ADMIN / CREADOR) */}
      <AdminExecutiveDashboardModal
        isOpen={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
      />

      {/* ⚖️ CENTRO LEGAL, PRIVACIDAD Y DERECHOS ARCO (BORRADO DE CUENTA) */}
      <LegalPoliciesModal
        isOpen={showLegalPoliciesModal}
        initialDocId={legalPolicyInitialDoc}
        onClose={() => setShowLegalPoliciesModal(false)}
      />

      {/* 💬 WIDGET FLOTANTE DE CHAT BÍBLICO & VOZ WEBRTC */}
      {(onlineRoom || friendsLobbyCode || (showOnlineModal && onlineSubTab === 'FRIENDS')) && (
        <RoomChatWidget
          roomCode={onlineRoom?.code || friendsLobbyCode || 'AMIGOS'}
          userName={userProfileState?.name || 'Jugador Bíblico'}
          userAvatar={userProfileState?.avatar || '/avatars/david.jpg'}
          playSound={playGameSound}
          triggerHaptic={triggerHaptic}
          onEmojiBurst={triggerEmojiBurst}
        />
      )}
    </>
  );
}

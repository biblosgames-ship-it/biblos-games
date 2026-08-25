import React, { useState, useEffect, useRef } from "react";
import { 
  Trophy, 
  Crown, 
  Clock, 
  Zap, 
  Users, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Play,
  BookOpen,
  Calendar,
  Sparkles,
  Bell,
  BellRing,
  Flame,
  Volume2,
  Bot,
  Lock,
  Globe,
  Flag,
  Maximize2,
  Minimize2,
  Settings,
  PlusCircle,
  Save,
  Download,
  AlertCircle,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { Question } from "../types";
import { UserProfile, recordCopaBiblosAchievement, saveUserProfile } from "../services/userProfile";
import { addTalents } from "../services/economyService";
import { saveCustomQuestions } from "../services/questionsService";
import { getWeeklyEventConfig, saveWeeklyEventConfig, getCopaHistoricalQuestions, WeeklyEvent, getNextSundayDateISO, DEFAULT_WEEKLY_EVENT } from "../services/eventsService";
import { GoldCoinIcon } from "./GoldCoinIcon";
import { LiveInteractivePointerTour } from "./LiveInteractivePointerTour";
import { isTutorialCompleted } from "../services/tutorialService";
import boardData from "../data/boardData.json";
import boardCoordinates from "../data/boardCoordinates.json";

export interface CopaPlayer {
  id: string | number;
  name: string;
  avatar: string;
  country?: string;
  countryFlag?: string;
  isMe: boolean;
  score: number;
  roundScore: number;
  correctCount: number;
  totalAnswered: number;
  currentTile: number; // 0 = Salida, 1..75 = Casillas
  hasAnsweredCurrent: boolean;
  lastPointsEarned: number;
  isEliminated: boolean;
  hasFinishedRace?: boolean;
  finishRank?: number;
  diceRollIndex: number;
  answeredQuestionTiles: number[]; // Lista de casillas de preguntas ya superadas
  botStepsRemaining?: number; // Pasos pendientes de avanzar casilla a casilla
  isWaitingOnQuestion?: boolean;
  botAnswerCountdown?: number; // Ticks restantes de respuesta del bot
  botNextRollCountdown?: number; // Ticks restantes para el siguiente tiro del bot
}

export interface CopaBiblosTournamentModeProps {
  userProfile?: UserProfile | null;
  onExit: () => void;
  onOpenProfile?: () => void;
  playSound?: (type: string) => void;
  triggerHaptic?: (type: any) => void;
}

const TOTAL_TILES = 75;
const CHECKIN_DURATION_SEC = 600;
const GRACE_PERIOD_SEC = 120; // 2 Minutos de plazo tras el primer ganador

// Tiempo límite dinámico por dificultad: Basic = 25s, Intermediate = 20s, Advanced = 15s
export const getQuestionTimeLimitByDifficulty = (diff?: string, round?: number): number => {
  const d = String(diff || '').toUpperCase();
  if (d === 'BASIC' || d === 'PRINCIPIANTE' || round === 1) return 25;
  if (d === 'INTERMEDIATE' || d === 'INTERMEDIO' || round === 2) return 20;
  if (d === 'ADVANCED' || d === 'AVANZADO' || round === 3) return 15;
  return 20;
};

// Secuencia idéntica y equitativa de dados compartida para todos los competidores
const SHARED_DICE_SEQUENCE = [4, 5, 4, 6, 3, 5, 4, 6, 5, 4, 6, 3, 5, 4, 6, 4, 5, 4, 6, 5, 4, 6, 3, 5, 4, 6];

// Exactamente 5 Países de Muestra con sus horas locales correspondientes a las 7:00 PM UTC
const FIVE_COUNTRY_SCHEDULES = [
  { flag: "🇩🇴", code: "RD", name: "Rep. Dom.", time: "3:00 PM" },
  { flag: "🇲🇽", code: "MX", name: "México", time: "1:00 PM" },
  { flag: "🇨🇴", code: "CO", name: "Colombia", time: "2:00 PM" },
  { flag: "🇦🇷", code: "AR", name: "Argentina", time: "4:00 PM" },
  { flag: "🇪🇸", code: "ES", name: "España", time: "9:00 PM" }
];

// Oponentes BiblosBots para el Simulador
const BIBLOS_BOTS: CopaPlayer[] = [
  { id: "bot_david", name: "David (BiblosBot)", avatar: "/avatars/david.jpg", country: "DO", countryFlag: "🇩🇴", isMe: false, score: 0, roundScore: 0, correctCount: 0, totalAnswered: 0, currentTile: 0, hasAnsweredCurrent: false, lastPointsEarned: 0, isEliminated: false, hasFinishedRace: false, diceRollIndex: 0, answeredQuestionTiles: [], botStepsRemaining: 0, isWaitingOnQuestion: false, botNextRollCountdown: 6 },
  { id: "bot_ester", name: "Reina Ester (BiblosBot)", avatar: "/avatars/esther.jpg", country: "MX", countryFlag: "🇲🇽", isMe: false, score: 0, roundScore: 0, correctCount: 0, totalAnswered: 0, currentTile: 0, hasAnsweredCurrent: false, lastPointsEarned: 0, isEliminated: false, hasFinishedRace: false, diceRollIndex: 0, answeredQuestionTiles: [], botStepsRemaining: 0, isWaitingOnQuestion: false, botNextRollCountdown: 10 },
  { id: "bot_moises", name: "Moisés (BiblosBot)", avatar: "/avatars/moises.jpg", country: "CO", countryFlag: "🇨🇴", isMe: false, score: 0, roundScore: 0, correctCount: 0, totalAnswered: 0, currentTile: 0, hasAnsweredCurrent: false, lastPointsEarned: 0, isEliminated: false, hasFinishedRace: false, diceRollIndex: 0, answeredQuestionTiles: [], botStepsRemaining: 0, isWaitingOnQuestion: false, botNextRollCountdown: 8 },
  { id: "bot_debora", name: "Débora (BiblosBot)", avatar: "/avatars/debora.jpg", country: "AR", countryFlag: "🇦🇷", isMe: false, score: 0, roundScore: 0, correctCount: 0, totalAnswered: 0, currentTile: 0, hasAnsweredCurrent: false, lastPointsEarned: 0, isEliminated: false, hasFinishedRace: false, diceRollIndex: 0, answeredQuestionTiles: [], botStepsRemaining: 0, isWaitingOnQuestion: false, botNextRollCountdown: 12 },
  { id: "bot_pedro", name: "Pedro (BiblosBot)", avatar: "/avatars/pedro.jpg", country: "ES", countryFlag: "🇪🇸", isMe: false, score: 0, roundScore: 0, correctCount: 0, totalAnswered: 0, currentTile: 0, hasAnsweredCurrent: false, lastPointsEarned: 0, isEliminated: false, hasFinishedRace: false, diceRollIndex: 0, answeredQuestionTiles: [], botStepsRemaining: 0, isWaitingOnQuestion: false, botNextRollCountdown: 7 }
];

// Helper para determinar si una casilla tiene pregunta bíblica obligatoria
const isQuestionTileIndex = (tileId: number) => {
  const destTileInfo = boardData.find(b => b.id === tileId);
  return destTileInfo?.effect === "QUESTION" || 
         tileId === 4 || tileId === 8 || tileId === 12 || 
         tileId === 14 || tileId === 17 || tileId === 20 || 
         tileId === 24 || tileId === 27 || tileId % 4 === 0;
};

// Helper para obtener coordenadas precisas de cada casilla
const getTileCoordinates = (tileId: number) => {
  return (boardCoordinates as Array<{ x: number; y: number }>)[tileId] || { x: 29.88, y: 89.45 };
};

// Función de Clamping Matemático
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

export const CopaBiblosTournamentMode: React.FC<CopaBiblosTournamentModeProps> = ({
  userProfile,
  onExit,
  onOpenProfile,
  playSound,
  triggerHaptic
}) => {
  const [weeklyEvent, setWeeklyEvent] = useState<WeeklyEvent>(() => getWeeklyEventConfig());
  const [eventCountdownStr, setEventCountdownStr] = useState<string>("");
  const [isCheckinActive, setIsCheckinActive] = useState<boolean>(false);
  const [checkinTimeLeft, setCheckinTimeLeft] = useState<number>(CHECKIN_DURATION_SEC);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    () => !!userProfile?.copaBiblosNotificationEnabled
  );
  const [isRegistered, setIsRegistered] = useState<boolean>(
    () => !!userProfile?.copaBiblosRegistered || !!userProfile?.copaBiblosNotificationEnabled
  );
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);

  // Cámara inicial GENERAL (x:50, y:50, zoom:1) para ver todo el tablero al iniciar
  const [camera, setCamera] = useState<{ x: number; y: number; zoom: number }>({ x: 50, y: 50, zoom: 1 });
  const [isAutoZoomEnabled, setIsAutoZoomEnabled] = useState<boolean>(false);

  const [currentRound, setCurrentRound] = useState<1 | 2 | 3>(1);
  const [roundStatus, setRoundStatus] = useState<"LOBBY" | "SIMULATOR_LOBBY" | "RACING" | "ROUND_SUMMARY" | "FINAL_PODIUM">("LOBBY");
  
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [myDiceRollIndex, setMyDiceRollIndex] = useState<number>(0);
  const [showGoalBanner, setShowGoalBanner] = useState<boolean>(false);

  // TEMPORIZADOR DE GRACIA (2 MINUTOS TRAS EL PRIMER GANADOR)
  const [gracePeriodSecondsLeft, setGracePeriodSecondsLeft] = useState<number | null>(null);
  const [firstFinisherName, setFirstFinisherName] = useState<string | null>(null);

  // SISTEMA EXCLUSIVO Y SECRETO DE ADMINISTRADOR (GESTO OCULTO + PIN)
  const [adminTapCount, setAdminTapCount] = useState<number>(0);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminJsonInput, setAdminJsonInput] = useState<string>("");
  const [adminSaveMessage, setAdminSaveMessage] = useState<string>("");

  const [players, setPlayers] = useState<CopaPlayer[]>(() => {
    const me: CopaPlayer = {
      id: userProfile?.name || "me",
      name: userProfile?.name || "Jugador Bíblico",
      avatar: userProfile?.avatar || "/avatars/david.jpg",
      country: userProfile?.country || "DO",
      countryFlag: userProfile?.countryFlag || "🇩🇴",
      isMe: true,
      score: 0,
      roundScore: 0,
      correctCount: 0,
      totalAnswered: 0,
      currentTile: 0,
      hasAnsweredCurrent: false,
      lastPointsEarned: 0,
      isEliminated: false,
      hasFinishedRace: false,
      diceRollIndex: 0,
      answeredQuestionTiles: [],
      botStepsRemaining: 0,
      isWaitingOnQuestion: false
    };
    return [me];
  });

  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeQuestionTile, setActiveQuestionTile] = useState<number>(0);
  const [currentQuestionMaxTime, setCurrentQuestionMaxTime] = useState<number>(25);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(25);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);

  const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);
  const [myQuestionIndex, setMyQuestionIndex] = useState<number>(0);

  const mePlayer = players.find(p => p.isMe) || players[0];

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const targetDate = new Date(weeklyEvent.nextEventDate);
      const diff = targetDate.getTime() - now.getTime();

      const isSundayNow = now.getUTCDay() === 0;
      const isLiveWindow = diff <= 0 && diff > -1000 * 60 * 10 && isSundayNow;

      if (isLiveWindow) {
        setIsCheckinActive(true);
        const elapsedSec = Math.floor(Math.abs(diff) / 1000);
        const remainingSec = Math.max(0, CHECKIN_DURATION_SEC - elapsedSec);
        setCheckinTimeLeft(remainingSec);
        setEventCountdownStr("🔴 ¡SALA ABIERTA EN VIVO!");

        if (remainingSec <= 0 && roundStatus === "LOBBY") {
          handlePrepareRaceStart(false);
        }
      } else {
        setIsCheckinActive(false);
        if (diff <= 0) {
          setWeeklyEvent(getWeeklyEventConfig());
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setEventCountdownStr(`${days}d ${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [weeklyEvent, roundStatus]);

  const getTilePeriodInfo = (tileId: number) => {
    if (tileId === 0) return { period: "Salida", description: "Punto de Inicio de La Copa Biblos" };
    const found = boardData.find(b => b.id === tileId);
    return found ? { period: found.period, description: found.description } : { period: "El Principio", description: "Avance Bíblico" };
  };

  // Cargar preguntas variadas y barajadas para la ronda actual respetando la dificultad de la fase
  useEffect(() => {
    const targetDiffs = currentRound === 1 
      ? ["PRINCIPIANTE", "BASIC"] 
      : currentRound === 2 
      ? ["INTERMEDIO", "INTERMEDIATE"] 
      : ["AVANZADO", "ADVANCED"];

    // Cargar del banco oficial completo de preguntas y mezclar
    import("../data/questions.json").then((module) => {
      const allQ = (module.default || module) as Question[];
      
      // Filtrar preguntas por dificultad
      let filtered = allQ.filter(q => !q.difficulty || targetDiffs.includes(String(q.difficulty).toUpperCase()));
      if (filtered.length < 25) {
        filtered = allQ;
      }

      // Obtener preguntas de la copa actual y del histórico de copas pasadas
      let customList: Question[] = [];
      const currentCopaCustom = weeklyEvent.customQuestions || [];
      const historicalCopaCustom = getCopaHistoricalQuestions();

      // Combinar sin duplicados
      const allCopaQuestions = [...currentCopaCustom];
      historicalCopaCustom.forEach(hq => {
        if (!allCopaQuestions.some(cq => cq.question.trim().toLowerCase() === hq.question.trim().toLowerCase())) {
          allCopaQuestions.push(hq);
        }
      });

      if (allCopaQuestions.length > 0) {
        const matchingCustom = allCopaQuestions.filter(q => {
          if (!q.difficulty) return true;
          const diffUpper = String(q.difficulty).toUpperCase();
          return targetDiffs.includes(diffUpper);
        });

        customList = matchingCustom.map((q, i) => ({
          id: q.id || `copa_pool_${currentRound}_${i}`,
          mode: (q.mode as any) || "TABLERO",
          question: q.question,
          options: q.options,
          correctAnswer: typeof (q as any).correctAnswer === "number" ? (q as any).correctAnswer : (q.correct ?? 0),
          period: (q.period as any) || (currentRound === 1 ? "El Principio" : currentRound === 2 ? "Reyes, Profetas y Poetas" : "Jesús y la Redención"),
          difficulty: (currentRound === 1 ? "BASIC" : currentRound === 2 ? "INTERMEDIATE" : "ADVANCED") as any,
          reference: q.reference
        }));
      }

      // Barajar aleatoriamente las preguntas para que cada partida sea fresca y única
      const shuffledBase = [...filtered].sort(() => Math.random() - 0.5);
      const combined = [...customList, ...shuffledBase].slice(0, 35);
      setRoundQuestions(combined);
      setMyQuestionIndex(0);
    });
  }, [currentRound, weeklyEvent]);

  // Temporizador de la pregunta bíblica activa del usuario
  useEffect(() => {
    if (!activeQuestion || isAnswerSubmitted) return;

    if (questionTimeLeft <= 0) {
      handleTimeoutAnswer();
      return;
    }

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuestion, questionTimeLeft, isAnswerSubmitted]);

  // CRONÓMETRO DE TIEMPO DE GRACIA (2 MINUTOS TRAS EL 1ER LLEGADO A LA META)
  useEffect(() => {
    if (gracePeriodSecondsLeft === null || roundStatus !== "RACING") return;

    if (gracePeriodSecondsLeft <= 0) {
      finishCurrentRound(players);
      return;
    }

    const graceTimer = setInterval(() => {
      setGracePeriodSecondsLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(graceTimer);
  }, [gracePeriodSecondsLeft, roundStatus, players]);

  // MOTOR EN TIEMPO REAL CON RITMO HUMANO Y REALISTA PARA LOS BIBLOSBOTS
  useEffect(() => {
    if (roundStatus !== "RACING" || !isPracticeMode || showGoalBanner) return;

    const stepInterval = setInterval(() => {
      setPlayers(prevPlayers => {
        return prevPlayers.map(bot => {
          if (bot.isMe || bot.isEliminated || bot.hasFinishedRace) return bot;

          // 1. Si el bot tiene pasos pendientes de avanzar -> Avanzar EXACTAMENTE 1 casilla
          if (bot.botStepsRemaining && bot.botStepsRemaining > 0) {
            const nextTile = Math.min(TOTAL_TILES, bot.currentTile + 1);
            const isQuestion = isQuestionTileIndex(nextTile) && !bot.answeredQuestionTiles.includes(nextTile);

            if (nextTile >= TOTAL_TILES) {
              // Bot llega a la meta
              triggerCompetitorFinish(bot.name);
              return {
                ...bot,
                currentTile: TOTAL_TILES,
                botStepsRemaining: 0,
                hasFinishedRace: true
              };
            }

            if (isQuestion) {
              return {
                ...bot,
                currentTile: nextTile,
                botStepsRemaining: 0,
                isWaitingOnQuestion: true,
                botAnswerCountdown: Math.floor(Math.random() * 9) + 14
              };
            }

            const isDoneMoving = bot.botStepsRemaining - 1 === 0;
            return {
              ...bot,
              currentTile: nextTile,
              botStepsRemaining: bot.botStepsRemaining - 1,
              botNextRollCountdown: isDoneMoving ? Math.floor(Math.random() * 8) + 8 : 0
            };
          }

          // 2. Si el bot está en una pregunta -> Cuenta regresiva de respuesta humana
          if (bot.isWaitingOnQuestion) {
            const cd = (bot.botAnswerCountdown ?? 1) - 1;
            if (cd > 0) {
              return { ...bot, botAnswerCountdown: cd };
            }

            // El bot responde la pregunta tras su tiempo de reflexión
            const isCorrect = Math.random() < 0.75;
            const roundMaxTime = getQuestionTimeLimitByDifficulty(undefined, currentRound);
            const botSpeedSec = Math.floor(Math.random() * (roundMaxTime * 0.4)) + (roundMaxTime * 0.3);
            const speedBonus = Math.round(((roundMaxTime - botSpeedSec) / roundMaxTime) * 50);
            const botPoints = isCorrect ? 100 + Math.max(0, speedBonus) : 0;
            const tileBonus = isCorrect ? 1 : -1;
            const finalTile = Math.max(0, Math.min(TOTAL_TILES, bot.currentTile + tileBonus));

            const reachedGoal = finalTile >= TOTAL_TILES;
            if (reachedGoal) {
              triggerCompetitorFinish(bot.name);
            }

            return {
              ...bot,
              currentTile: finalTile,
              score: bot.score + botPoints,
              roundScore: bot.roundScore + botPoints,
              correctCount: bot.correctCount + (isCorrect ? 1 : 0),
              totalAnswered: bot.totalAnswered + 1,
              isWaitingOnQuestion: false,
              hasFinishedRace: reachedGoal,
              answeredQuestionTiles: [...bot.answeredQuestionTiles, bot.currentTile],
              botNextRollCountdown: reachedGoal ? 0 : Math.floor(Math.random() * 8) + 8
            };
          }

          // 3. Si el bot está inactivo -> Cuenta regresiva para tirar el dado de la secuencia
          const rollCd = (bot.botNextRollCountdown ?? 6) - 1;
          if (rollCd > 0) {
            return { ...bot, botNextRollCountdown: rollCd };
          }

          // Tirar el siguiente dado de la secuencia
          const rollVal = SHARED_DICE_SEQUENCE[bot.diceRollIndex % SHARED_DICE_SEQUENCE.length];
          return {
            ...bot,
            botStepsRemaining: rollVal,
            diceRollIndex: bot.diceRollIndex + 1,
            botNextRollCountdown: 0
          };
        });
      });
    }, 450);

    return () => clearInterval(stepInterval);
  }, [roundStatus, isPracticeMode, showGoalBanner]);

  // DISPARADOR DE TIEMPO DE GRACIA CUANDO CUALQUIER PARTICIPANTE LLEGA A LA META
  const triggerCompetitorFinish = (finisherName: string) => {
    setGracePeriodSecondsLeft(prev => {
      if (prev === null) {
        setFirstFinisherName(finisherName);
        return GRACE_PERIOD_SEC; // Iniciar 120 segundos
      }
      return prev;
    });
  };

  const handleRegisterAndNotify = async () => {
    let notifGranted = false;
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        notifGranted = true;
      } else {
        const perm = await Notification.requestPermission();
        if (perm === "granted") notifGranted = true;
      }
    }

    setIsRegistered(true);
    setNotificationsEnabled(true);

    if (userProfile) {
      saveUserProfile({
        ...userProfile,
        copaBiblosRegistered: true,
        copaBiblosNotificationEnabled: true
      });
    }

    if (playSound) playSound("win");
    if (triggerHaptic) triggerHaptic("success");

    if (notifGranted) {
      try {
        new Notification("🏆 La Copa Biblos", {
          body: "¡Inscripción Exitosa! Te notificaremos el Domingo antes de las 7:00 PM UTC (3:00 PM Hora RD).",
          icon: "/favicon.png"
        });
      } catch (e) {}
    } else {
      alert("¡Inscripción registrada con éxito! Te recordamos estar listo este Domingo a las 7:00 PM UTC (3:00 PM Hora RD).");
    }
  };

  const handleOpenSimulatorRoom = () => {
    setIsPracticeMode(true);
    setCurrentRound(1);
    setShowGoalBanner(false);
    setGracePeriodSecondsLeft(null);
    setFirstFinisherName(null);

    const me: CopaPlayer = {
      id: userProfile?.name || "me",
      name: userProfile?.name || "Jugador Bíblico",
      avatar: userProfile?.avatar || "/avatars/david.jpg",
      country: userProfile?.country || "DO",
      countryFlag: userProfile?.countryFlag || "🇩🇴",
      isMe: true,
      score: 0,
      roundScore: 0,
      correctCount: 0,
      totalAnswered: 0,
      currentTile: 0,
      hasAnsweredCurrent: false,
      lastPointsEarned: 0,
      isEliminated: false,
      hasFinishedRace: false,
      diceRollIndex: 0,
      answeredQuestionTiles: [],
      botStepsRemaining: 0,
      isWaitingOnQuestion: false
    };

    const botsWithTile0 = BIBLOS_BOTS.map((b, i) => ({
      ...b,
      currentTile: 0,
      score: 0,
      roundScore: 0,
      hasFinishedRace: false,
      diceRollIndex: 0,
      answeredQuestionTiles: [],
      botStepsRemaining: 0,
      isWaitingOnQuestion: false,
      botNextRollCountdown: (i + 1) * 4
    }));

    setPlayers([me, ...botsWithTile0]);
    setMyDiceRollIndex(0);
    setMyQuestionIndex(0);
    setRoundStatus("SIMULATOR_LOBBY");
    if (playSound) playSound("select");
  };

  const handlePrepareRaceStart = (isPractice = true) => {
    setIsPracticeMode(isPractice);
    setShowGoalBanner(false);
    setGracePeriodSecondsLeft(null);
    setFirstFinisherName(null);
    setRoundStatus("RACING");
    setCamera({ x: 50, y: 50, zoom: 1 });
    if (playSound) playSound("select");
  };

  const handleToggleZoomView = (enableZoom: boolean) => {
    setIsAutoZoomEnabled(enableZoom);
    if (!enableZoom) {
      setCamera({ x: 50, y: 50, zoom: 1 });
    } else {
      const coords = getTileCoordinates(mePlayer?.currentTile || 0);
      setCamera({ x: coords.x, y: coords.y, zoom: 1.85 });
    }
    if (playSound) playSound("select");
  };

  // GESTO SECRETO PARA ABRIR EL PANEL DE ADMINISTRADOR (5 TOQUES AL TROFEO)
  const handleSecretAdminTap = () => {
    const next = adminTapCount + 1;
    setAdminTapCount(next);
    if (next >= 5) {
      setAdminTapCount(0);
      setShowPinModal(true);
      setEnteredPin("");
      setPinError("");
      if (playSound) playSound("select");
    }
  };

  const handleVerifyPin = () => {
    if (enteredPin === "7777" || enteredPin === "1234") {
      setShowPinModal(false);
      const hasDifficultyInExisting = weeklyEvent.customQuestions?.some(q => !!q.difficulty);
      const questionsToUse = (hasDifficultyInExisting && weeklyEvent.customQuestions && weeklyEvent.customQuestions.length > 0)
        ? weeklyEvent.customQuestions
        : DEFAULT_WEEKLY_EVENT.customQuestions;

      setAdminJsonInput(JSON.stringify({
        title: weeklyEvent.title,
        theme: weeklyEvent.theme,
        customQuestions: questionsToUse
      }, null, 2));
      setShowAdminModal(true);
    } else {
      setPinError("❌ PIN de Administrador incorrecto.");
    }
  };

  // TIRADA INDIVIDUAL DEL JUGADOR
  const handleRollDice = () => {
    if (isRolling || roundStatus !== "RACING" || activeQuestion || showGoalBanner || mePlayer.hasFinishedRace) return;

    setIsRolling(true);
    if (playSound) playSound("roll");
    if (triggerHaptic) triggerHaptic("light");

    const rolled = SHARED_DICE_SEQUENCE[myDiceRollIndex % SHARED_DICE_SEQUENCE.length];
    setMyDiceRollIndex(prev => prev + 1);

    setTimeout(() => {
      animatePlayerStepByStep(rolled);
    }, 350);
  };

  // Recorrido PASO A PASO
  const animatePlayerStepByStep = (stepsRemaining: number) => {
    if (stepsRemaining <= 0) {
      setIsRolling(false);
      return;
    }

    const currentTile = mePlayer.currentTile;
    const nextTile = Math.min(TOTAL_TILES, currentTile + 1);
    
    const hasAlreadyAnswered = mePlayer.answeredQuestionTiles.includes(nextTile);
    const isQuestionTile = isQuestionTileIndex(nextTile) && !hasAlreadyAnswered;

    // Actualizar posición de tu ficha
    setPlayers(prev => prev.map(p => p.isMe ? { ...p, currentTile: nextTile } : p));

    if (isAutoZoomEnabled) {
      const coords = getTileCoordinates(nextTile);
      setCamera({ x: coords.x, y: coords.y, zoom: 1.85 });
    }
    if (playSound) playSound("select");

    // Si la casilla alcanzada es de Trivia no superada -> ¡DETENER Y DISPARAR PREGUNTA!
    if (isQuestionTile && nextTile < TOTAL_TILES) {
      setIsRolling(false);
      setTimeout(() => {
        triggerSimultaneousQuestion(nextTile);
      }, 300);
      return;
    }

    // SI LLEGÓ A LA META 75 -> FANFARRIA, CONFETTI Y ACTIVAR TIEMPO DE GRACIA PARA LOS DEMÁS
    if (nextTile >= TOTAL_TILES) {
      setIsRolling(false);
      setShowGoalBanner(true);
      
      setPlayers(prev => prev.map(p => p.isMe ? { ...p, currentTile: TOTAL_TILES, hasFinishedRace: true } : p));
      triggerCompetitorFinish(mePlayer.name);

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      if (playSound) playSound("win");
      if (triggerHaptic) triggerHaptic("success");

      // El letrero triunfal se muestra 3.2s y luego se pasa al modo de espera activa viendo a los demás competir
      setTimeout(() => {
        setShowGoalBanner(false);
      }, 3200);
      return;
    }

    // Continuar al siguiente paso
    if (stepsRemaining > 1) {
      setTimeout(() => {
        animatePlayerStepByStep(stepsRemaining - 1);
      }, 450);
    } else {
      setIsRolling(false);
    }
  };

  const triggerSimultaneousQuestion = (tileId: number) => {
    if (roundQuestions.length === 0) return;

    const tilePeriod = getTilePeriodInfo(tileId).period;
    const q = roundQuestions[myQuestionIndex % roundQuestions.length];
    const questionWithPeriod = {
      ...q,
      period: tilePeriod
    };

    setActiveQuestion(questionWithPeriod);
    setActiveQuestionTile(tileId);
    setMyQuestionIndex(prev => prev + 1);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    const limit = getQuestionTimeLimitByDifficulty(q?.difficulty, currentRound);
    setCurrentQuestionMaxTime(limit);
    setQuestionTimeLeft(limit);
    if (playSound) playSound("select");
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted || !activeQuestion) return;

    setSelectedOption(idx);
    setIsAnswerSubmitted(true);

    const isCorrect = idx === activeQuestion.correctAnswer;
    let pointsEarned = 0;

    if (isCorrect) {
      const speedBonus = Math.round((questionTimeLeft / currentQuestionMaxTime) * 50);
      pointsEarned = 100 + speedBonus;
      if (playSound) playSound("correct");
      if (triggerHaptic) triggerHaptic("success");
    } else {
      pointsEarned = 0;
      if (playSound) playSound("wrong");
      if (triggerHaptic) triggerHaptic("warning");
    }

    setPlayers(prev => {
      return prev.map(p => {
        if (!p.isMe || p.isEliminated) return p;
        const tileBonus = isCorrect ? 1 : -1;
        const newTile = Math.max(0, Math.min(TOTAL_TILES, p.currentTile + tileBonus));
        
        if (isAutoZoomEnabled) {
          const coords = getTileCoordinates(newTile);
          setCamera({ x: coords.x, y: coords.y, zoom: 1.85 });
        }

        const updatedAnswered = p.answeredQuestionTiles.includes(activeQuestionTile)
          ? p.answeredQuestionTiles
          : [...p.answeredQuestionTiles, activeQuestionTile];

        const reachedGoal = newTile >= TOTAL_TILES;
        if (reachedGoal) {
          triggerCompetitorFinish(p.name);
        }

        return {
          ...p,
          score: p.score + pointsEarned,
          roundScore: p.roundScore + pointsEarned,
          correctCount: p.correctCount + (isCorrect ? 1 : 0),
          totalAnswered: p.totalAnswered + 1,
          currentTile: newTile,
          lastPointsEarned: pointsEarned,
          hasAnsweredCurrent: true,
          hasFinishedRace: reachedGoal,
          answeredQuestionTiles: updatedAnswered
        };
      });
    });

    setTimeout(() => {
      setActiveQuestion(null);
    }, 1600);
  };

  const handleTimeoutAnswer = () => {
    if (isAnswerSubmitted) return;
    handleSelectOption(-1);
  };

  const finishCurrentRound = (currentPlayersList: CopaPlayer[]) => {
    const activePlayers = currentPlayersList.filter(p => !p.isEliminated);
    const sorted = [...activePlayers].sort((a, b) => b.score - a.score);

    setGracePeriodSecondsLeft(null);

    if (currentRound === 3) {
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
      if (playSound) playSound("win");

      const myRank = sorted.findIndex(p => p.isMe) + 1;
      let trophyType: "GOLD" | "SILVER" | "BRONZE" | "PARTICIPANT" = "PARTICIPANT";
      let trophyTitle = "🏅 Finalista de Honor de la Copa Biblos";
      let rewardTalents = 5;

      if (myRank === 1) {
        trophyType = "GOLD";
        trophyTitle = "🏆 Campeón de la Copa Biblos (Oro)";
        rewardTalents = 50;
      } else if (myRank === 2) {
        trophyType = "SILVER";
        trophyTitle = "🥈 Subcampeón de la Copa Biblos (Plata)";
        rewardTalents = 25;
      } else if (myRank === 3) {
        trophyType = "BRONZE";
        trophyTitle = "🥉 Tercer Lugar de la Copa Biblos (Bronce)";
        rewardTalents = 15;
      }

      addTalents(rewardTalents, `Premio La Copa Biblos (${trophyTitle})`, "COPA_BIBLOS");

      if (userProfile) {
        recordCopaBiblosAchievement({
          tournamentDate: new Date().toISOString(),
          trophy: trophyType,
          trophyName: trophyTitle,
          finalRank: myRank,
          totalPoints: mePlayer?.score || 0,
          accuracy: mePlayer?.totalAnswered ? Math.round(((mePlayer?.correctCount || 0) / mePlayer.totalAnswered) * 100) : 100,
          rewardTalents,
          titleEarned: trophyTitle,
        });
      }

      setRoundStatus("FINAL_PODIUM");
    } else {
      const cutCount = Math.max(1, Math.ceil(sorted.length * 0.5));
      const qualified = sorted.slice(0, cutCount);
      const qualifiedIds = new Set(qualified.map(q => q.id));

      setPlayers(prev => prev.map(p => ({
        ...p,
        isEliminated: !qualifiedIds.has(p.id),
        roundScore: 0
      })));

      setRoundStatus("ROUND_SUMMARY");
    }
  };

  // REINICIO COMPLETO Y LIMPIO PARA LA SIGUIENTE FASE
  const handleNextRound = () => {
    const nextR = (currentRound + 1) as 2 | 3;
    setCurrentRound(nextR);
    setShowGoalBanner(false);
    setGracePeriodSecondsLeft(null);
    setFirstFinisherName(null);
    setIsRolling(false);
    setActiveQuestion(null);
    setMyDiceRollIndex(0);
    setMyQuestionIndex(0);

    setPlayers(prev => prev.map((p, idx) => ({
      ...p,
      currentTile: 0,
      roundScore: 0,
      diceRollIndex: 0,
      answeredQuestionTiles: [],
      hasFinishedRace: false,
      botStepsRemaining: 0,
      isWaitingOnQuestion: false,
      hasAnsweredCurrent: false,
      botNextRollCountdown: (idx + 1) * 3
    })));

    setRoundStatus("RACING");
    setCamera({ x: 50, y: 50, zoom: 1 });
    if (playSound) playSound("select");
  };

  const handleSaveCustomTournamentConfig = () => {
    try {
      const parsed = JSON.parse(adminJsonInput);
      if (parsed.customQuestions && Array.isArray(parsed.customQuestions)) {
        const updated: WeeklyEvent = {
          ...weeklyEvent,
          ...parsed,
          nextEventDate: parsed.nextEventDate || weeklyEvent.nextEventDate
        };
        saveWeeklyEventConfig(updated);
        setWeeklyEvent(updated);

        // 🌟 INTEGRACIÓN AUTOMÁTICA: Guardar en el Banco General de Preguntas de la App
        const adaptedForMainBank: Question[] = parsed.customQuestions.map((q: any, idx: number) => ({
          id: q.id || `copa_q_${Date.now()}_${idx}`,
          mode: q.mode || 'TABLERO',
          period: q.period || 'El Principio',
          difficulty: q.difficulty || 'BASIC',
          question: q.question,
          options: q.options,
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : (q.correct ?? 0),
          reference: q.reference || 'Biblia'
        }));
        saveCustomQuestions(adaptedForMainBank);

        setAdminSaveMessage("✅ ¡Guardado con éxito! Las preguntas se integraron a la Copa y al Banco Oficial de la App.");
        setTimeout(() => {
          setShowAdminModal(false);
          setAdminSaveMessage("");
        }, 1800);
      } else {
        setAdminSaveMessage("⚠️ El JSON debe contener un array 'customQuestions'.");
      }
    } catch (e: any) {
      setAdminSaveMessage("❌ Error de formato JSON: " + e.message);
    }
  };

  const clampedCam = calculateClampedCameraTransform(camera);

  const BOT_OFFSETS = [
    { dx: -2.8, dy: 1.5 },
    { dx: 2.8, dy: 1.5 },
    { dx: -3.8, dy: -1.2 },
    { dx: 3.8, dy: -1.2 },
    { dx: 0.0, dy: 2.8 }
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      
      {/* MARCO CONTENEDOR MODAL ORIGINAL */}
      <div className="max-w-md sm:max-w-lg w-full h-full sm:h-[92vh] bg-[#1c1917] sm:rounded-3xl border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden text-stone-200 relative">
        
        {/* CABECERA MÓVIL SUPERIOR (EL TROFEO CONTIENE EL GESTO SECRETO DE ADMINISTRADOR) */}
        <header className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 px-4 py-3 border-b border-amber-500/30 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSecretAdminTap}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md shrink-0 cursor-pointer active:scale-90 transition"
              title="La Copa Biblos"
            >
              <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center text-amber-400">
                <Trophy size={16} />
              </div>
            </button>
            <div>
              <h2 className="text-xs sm:text-sm font-serif font-black text-amber-300 uppercase tracking-wide leading-tight">
                1ra Copa Biblos Semanal
              </h2>
              <p className="text-[10px] font-bold text-amber-200/80 flex items-center gap-1">
                <span>{weeklyEvent.title}</span>
                <span className="text-stone-400">•</span>
                <span className="text-emerald-400 font-mono">Fase {currentRound}/3</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="p-1.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition border border-stone-700"
              title="Salir"
            >
              <XCircle size={18} />
            </button>
          </div>
        </header>

        {/* 1. VISTA DE BIENVENIDA Y HORARIO OFICIAL */}
        {roundStatus === "LOBBY" && (
          <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-between space-y-4 custom-scrollbar">
            <div className="space-y-3 text-center">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Calendar size={14} className="text-amber-400" />
                <span>Domingos 7:00 PM UTC</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight">
                  1ra Copa Biblos Semanal
                </h3>
                <p className="text-xs text-amber-300 font-bold leading-relaxed px-2">
                  Pon a prueba tu conocimiento bíblico compitiendo con participantes de todo el mundo y aumenta tu IQ bíblico.
                </p>
              </div>

              {/* HORARIOS CORRESPONDIENTES A 7:00 PM UTC EN EXACTAMENTE 5 PAÍSES DE MUESTRA */}
              <div className="p-2.5 bg-stone-950/90 rounded-2xl border border-stone-800 space-y-1 text-center">
                <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider flex items-center justify-center gap-1">
                  <Globe size={11} /> Horarios según tu país (7:00 PM UTC):
                </span>
                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  {FIVE_COUNTRY_SCHEDULES.map((c, idx) => (
                    <div key={idx} className="p-1.5 bg-stone-900 rounded-xl border border-stone-800 flex flex-col items-center justify-center text-center">
                      <span className="text-xs">{c.flag}</span>
                      <span className="text-[9px] font-bold text-stone-300 truncate max-w-full leading-tight">{c.code}</span>
                      <span className="text-[9px] font-mono font-black text-amber-300 leading-tight mt-0.5">{c.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ESTADO ESTRICTO DE SALA EN VIVO / CERRADA */}
              <div className="p-3 bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 rounded-2xl border border-amber-500/30 shadow-inner space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest block">
                  {isCheckinActive ? (
                    <span className="text-emerald-400">🔴 SALA ABIERTA EN VIVO</span>
                  ) : (
                    <span className="text-amber-400 flex items-center justify-center gap-1">
                      <Lock size={12} /> SALA OFICIAL CERRADA (7:00 PM UTC)
                    </span>
                  )}
                </span>
                <p className="text-2xl font-black font-mono text-amber-300">
                  {eventCountdownStr || "00d 00h 00m 00s"}
                </p>

                {/* PREMIOS OFICIALES EN COPAS */}
                <div className="p-2 bg-stone-900/90 rounded-xl border border-stone-800 text-xs flex items-center justify-around font-bold mt-2">
                  <span className="flex items-center gap-1 text-amber-300">
                    🏆 <span className="text-[10px] text-amber-200">Oro:</span> <span className="font-black text-amber-300 flex items-center gap-0.5">50 <GoldCoinIcon className="w-3.5 h-3.5" /></span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    🏆 <span className="text-[10px] text-slate-300">Plata:</span> <span className="font-black text-slate-200 flex items-center gap-0.5">25 <GoldCoinIcon className="w-3.5 h-3.5" /></span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    🏆 <span className="text-[10px] text-amber-600">Bronce:</span> <span className="font-black text-amber-600 flex items-center gap-0.5">15 <GoldCoinIcon className="w-3.5 h-3.5" /></span>
                  </span>
                </div>
              </div>

              {!isCheckinActive && (
                <div className="p-3 bg-gradient-to-r from-stone-900 via-amber-950/60 to-stone-900 rounded-2xl border border-amber-500/50 shadow-lg space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                      <Bell size={13} className="text-amber-400" /> Registro Previo del Torneo
                    </span>
                    {isRegistered && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        Inscrito ✓
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-300 leading-snug">
                    {isRegistered
                      ? "¡Ya estás inscrito para este Domingo 7:00 PM UTC! Recibirás un aviso automático en tu pantalla antes de arrancar."
                      : "Inscríbete ahora gratuitamente para reservar tu lugar en la carrera oficial y activar el recordatorio en tu dispositivo."}
                  </p>

                  <button
                    type="button"
                    onClick={handleRegisterAndNotify}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border ${
                      isRegistered
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500/60 shadow"
                        : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-amber-950 border-amber-300 shadow-md font-black active:scale-95 cursor-pointer"
                    }`}
                  >
                    {isRegistered ? <BellRing size={16} className="text-emerald-400" /> : <Bell size={16} />}
                    <span>{isRegistered ? "✅ ¡Inscrito! (Recordatorio Activado 🔔)" : "🔔 Inscribirme al Torneo y Activar Recordatorio"}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={!isCheckinActive}
                onClick={() => handlePrepareRaceStart(false)}
                className={`w-full py-3.5 px-4 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition transform flex items-center justify-center gap-2 border-2 ${
                  isCheckinActive
                    ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-amber-950 border-yellow-200 active:scale-95 cursor-pointer"
                    : "bg-stone-900 text-stone-500 border-stone-800 opacity-60 cursor-not-allowed"
                }`}
              >
                {isCheckinActive ? <Play size={18} fill="currentColor" /> : <Lock size={18} />}
                <span>{isCheckinActive ? "🚀 Entrar a Sala Oficial de Torneo" : "🔒 Sala Oficial Cerrada (Domingos 7:00 PM UTC)"}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenSimulatorRoom}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 text-amber-950 font-black text-xs sm:text-sm rounded-2xl border border-yellow-300 shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Bot size={18} />
                <span>🎮 Entrar al Simulador (Modo Ensayo)</span>
              </button>
            </div>
          </main>
        )}

        {/* 1.B. VISTA INTERNA DE SALA DE ESPERA DEL SIMULADOR */}
        {roundStatus === "SIMULATOR_LOBBY" && (
          <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-between space-y-4 custom-scrollbar text-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                <Bot size={14} className="text-amber-400" />
                <span>Sala del Simulador de Torneo</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-serif font-black text-white leading-tight">
                  Sala de Espera de Ensayo
                </h3>
                <p className="text-xs text-stone-300">
                  ¡Compite en vivo! Todos reciben los mismos dados y preguntas. Quien responda con mayor precisión y velocidad acumulará más puntos.
                </p>
              </div>

              {/* LISTA DE JUGADORES Y BIBLOSBOTS DENTRO DE LA SALA */}
              <div className="p-3.5 bg-stone-950/90 rounded-2xl border border-amber-500/40 space-y-2 text-left shadow-xl">
                <div className="flex justify-between items-center text-xs font-bold text-stone-300">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Users size={14} /> Jugadores en Sala ({players.length})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Listos en Salida ✓
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {players.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-stone-900 rounded-xl border border-stone-800">
                      <div className="flex items-center gap-2.5">
                        <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-full object-cover border border-amber-400 shadow" />
                        <div>
                          <p className="font-bold text-white text-xs flex items-center gap-1">
                            <span>{p.name}</span>
                            <span>{p.countryFlag}</span>
                          </p>
                          <p className="text-[10px] text-amber-400 font-mono font-bold">Casilla 0 (Salida)</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        p.isMe
                          ? "bg-amber-500 text-amber-950 border-amber-300"
                          : "bg-stone-800 text-stone-300 border-stone-700"
                      }`}>
                        {p.isMe ? "Tú" : "BiblosBot"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrepareRaceStart(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-amber-950 font-black text-sm rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2 border-2 border-yellow-200 cursor-pointer"
              >
                <Play size={18} fill="currentColor" />
                <span>🚀 Iniciar Carrera de Ensayo</span>
              </button>

              <button
                type="button"
                onClick={() => setRoundStatus("LOBBY")}
                className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-xl border border-stone-800 transition"
              >
                Volver a la Pantalla del Torneo
              </button>
            </div>
          </main>
        )}

        {/* 3. VISTA DEL TABLERO EN TIEMPO REAL */}
        {roundStatus === "RACING" && (
          <main className="flex-1 overflow-hidden p-2 sm:p-3 flex flex-col justify-between items-center relative">
            
            {/* PANEL SUPERIOR HORIZONTAL DE JUGADORES */}
            <div className="w-full bg-stone-950/90 p-2 rounded-2xl border border-amber-500/40 shrink-0 mb-1 shadow-md">
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5">
                {[...players.filter(p => !p.isEliminated)].sort((a, b) => b.score - a.score).map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border shrink-0 text-xs transition ${
                      p.isMe
                        ? "bg-amber-950 border-amber-400 text-amber-200 ring-2 ring-amber-400 font-bold shadow-lg"
                        : "bg-black/40 border-stone-800 text-stone-400"
                    }`}
                  >
                    <span className="font-mono text-[9px] text-stone-400 font-bold">#{idx + 1}</span>
                    <img src={p.avatar} alt={p.name} className="w-5.5 h-5.5 rounded-full object-cover border border-amber-400 shrink-0 shadow" />
                    <span className="truncate max-w-[65px]">{p.name.split(" ")[0]}</span>
                    <span className="text-[10px] px-1 bg-black/60 rounded text-amber-300 font-mono font-bold">
                      {p.hasFinishedRace ? "🏁 Meta" : p.currentTile === 0 ? "Salida" : `C.${p.currentTile}`}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400">{p.score}pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BARRA DE AVISO DE TIEMPO DE GRACIA (2 MINUTOS TRAS EL PRIMER LLEGADO) */}
            {gracePeriodSecondsLeft !== null && (
              <div className="w-full bg-gradient-to-r from-amber-950 via-red-950/80 to-amber-950 border border-amber-500/60 rounded-xl px-2.5 py-1 mb-1 flex items-center justify-between shadow-md shrink-0 animate-pulse text-xs">
                <span className="font-bold text-amber-200 flex items-center gap-1 text-[11px] truncate">
                  <span>🏁</span>
                  <span>{firstFinisherName} llegó a la meta. ¡Termina tu recorrido!</span>
                </span>
                <span className="font-mono font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded-lg border border-amber-400/40 shrink-0">
                  ⏱️ {Math.floor(gracePeriodSecondsLeft / 60)}:{(gracePeriodSecondsLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}

            {/* SELECTOR COMPACTO Y CENTRADO DE VISTA */}
            <div className="w-full flex items-center justify-center mb-1 shrink-0">
              <div className="inline-flex p-0.5 bg-stone-950/90 rounded-xl border border-stone-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleToggleZoomView(false)}
                  className={`px-3 py-0.5 sm:py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    !isAutoZoomEnabled && camera.zoom === 1
                      ? "bg-amber-500 text-amber-950 font-black shadow"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                  title="Ver todo el tablero completo sin zoom"
                >
                  <Minimize2 size={11} />
                  <span>Vista Completa</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleZoomView(true)}
                  className={`px-3 py-0.5 sm:py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    isAutoZoomEnabled || camera.zoom > 1
                      ? "bg-amber-500 text-amber-950 font-black shadow"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                  title="Activar seguimiento cinemático"
                >
                  <Maximize2 size={11} />
                  <span>Auto-Zoom</span>
                </button>
              </div>
            </div>

            {/* TABLERO INTERACTIVO HD CON PROPORCIÓN 1:1 ESTRICTA */}
            <div className="relative w-full max-w-[min(100%,calc(100vh-275px),410px)] aspect-square bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-900/60 mx-auto my-auto shrink-0">

              {/* VISTA DE CÁMARA CON CLAMPING MATEMÁTICO */}
              <div
                className="relative w-full h-full will-change-transform"
                style={{
                  transform: `translate(${clampedCam.translateX}%, ${clampedCam.translateY}%) scale(${clampedCam.zoom})`,
                  transformOrigin: "0 0",
                  transition: "transform 1.3s cubic-bezier(0.25, 1, 0.5, 1)"
                }}
              >
                <img
                  src="/Tablero.jpg"
                  alt="Tablero Bíblico HD"
                  className="w-full h-full object-fill select-none"
                />

                {/* FICHAS DE JUGADORES */}
                {players.filter(p => !p.isEliminated).map((p, idx) => {
                  const coords = getTileCoordinates(p.currentTile);
                  
                  if (p.isMe) {
                    // TU FICHA PRINCIPAL
                    return (
                      <div
                        key={`copa-token-me-${p.id || idx}`}
                        className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-[left,top]"
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          transition: "left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        }}
                      >
                        <div className="relative flex flex-col items-center justify-center">
                          <span className="absolute bottom-full mb-0.5 text-[7px] font-black px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 rounded-full border border-yellow-200 shadow-md whitespace-nowrap">
                            👑 {p.name.split(" ")[0]} ({p.hasFinishedRace ? "Meta" : p.currentTile === 0 ? "Salida" : `c.${p.currentTile}`})
                          </span>
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full object-cover border-2 border-amber-300 ring-2 ring-amber-400/90 shadow-[0_0_10px_rgba(251,191,36,0.85)] scale-105"
                          />
                        </div>
                      </div>
                    );
                  }

                  // RIVALES / BOTS
                  const botIdx = players.filter(other => !other.isMe && !other.isEliminated && other.currentTile === p.currentTile).indexOf(p);
                  const offset = BOT_OFFSETS[botIdx % BOT_OFFSETS.length] || { dx: 0, dy: 0 };
                  const botX = coords.x + offset.dx;
                  const botY = coords.y + offset.dy;

                  return (
                    <div
                      key={`copa-token-bot-${p.id || idx}`}
                      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-[left,top]"
                      style={{
                        left: `${botX}%`,
                        top: `${botY}%`,
                        transition: "left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      }}
                    >
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover border border-white/80 shadow-sm ring-1 ring-black/60 opacity-90"
                        title={`${p.name} (Casilla ${p.currentTile})`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BARRA INFERIOR DE ACCIÓN: BOTÓN DE DADO O ESTADO DE ESPERA SI YA LLEGASTE A LA META */}
            <div className="w-full mt-1 shrink-0">
              {mePlayer.hasFinishedRace ? (
                <div className="p-2.5 bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 border border-emerald-500/60 rounded-2xl text-center space-y-1 shadow-lg">
                  <p className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1.5">
                    <span>🏁 ¡Llegaste a la Meta!</span>
                    <span className="text-stone-300 font-normal">Puntaje Final:</span>
                    <span className="text-yellow-400 font-mono">{mePlayer.score} pts</span>
                  </p>
                  <p className="text-[10px] text-stone-400">
                    Esperando a los demás competidores... Cierre automático al expirar el tiempo de gracia.
                  </p>
                </div>
              ) : (
                <button
                  disabled={isRolling || Boolean(activeQuestion) || showGoalBanner}
                  onClick={handleRollDice}
                  className={`w-full py-3 sm:py-3.5 px-4 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2.5 border-2 ${
                    isRolling || activeQuestion || showGoalBanner
                      ? "bg-amber-950 text-amber-400 border-amber-500/60 opacity-80 cursor-wait"
                      : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-amber-950 border-yellow-200 ring-4 ring-amber-400/40 cursor-pointer animate-pulse"
                  }`}
                >
                  <span className={`text-lg ${isRolling ? "animate-spin" : ""}`}>🎲</span>
                  <span className="uppercase tracking-wider">
                    {isRolling ? "¡Lanzando Mi Dado..." : "¡TIRAR MI DADO!"}
                  </span>
                </button>
              )}
            </div>
          </main>
        )}

        {/* LETRERO GIGANTE TRIUNFAL: ¡HAS LLEGADO A LA META! CON FANFARRIA */}
        {showGoalBanner && (
          <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in">
            <div className="bg-gradient-to-b from-amber-950 via-[#2A2621] to-stone-950 border-4 border-yellow-400 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-[0_0_60px_rgba(251,191,36,0.9)] animate-bounce text-amber-100 relative">
              <div className="text-5xl animate-spin">🏁</div>
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 uppercase tracking-wide">
                  ¡HAS LLEGADO A LA META!
                </h3>
                <p className="text-xs sm:text-sm font-bold text-amber-300">
                  ¡Gran recorrido completado!
                </p>
              </div>
              <div className="p-2.5 bg-black/60 rounded-2xl border border-amber-500/40 text-xs text-stone-300 font-mono">
                Plazo de 2 min activo para los demás competidores...
              </div>
            </div>
          </div>
        )}

        {/* MODAL PRINCIPAL DE PREGUNTA BÍBLICA */}
        {activeQuestion && (
          <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in">
            <div className="bg-[#2A2621] border-2 border-amber-500 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-amber-100 space-y-4 relative overflow-hidden">
              
              {/* BARRA DE CRONÓMETRO REGRESIVO */}
              <div className="w-full bg-stone-800 h-3 rounded-full overflow-hidden mb-1 border border-stone-700">
                <div
                  className={`h-full transition-all duration-1000 ${
                    questionTimeLeft > currentQuestionMaxTime * 0.5
                      ? "bg-emerald-500"
                      : questionTimeLeft > 5
                      ? "bg-amber-500"
                      : "bg-red-600"
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (questionTimeLeft / currentQuestionMaxTime) * 100))}%`
                  }}
                />
              </div>

              {/* ENCABEZADO DE LA TRIVIA */}
              <div className="flex justify-between items-center border-b border-amber-900/50 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    📖 {activeQuestion.period || "Desafío Bíblico"}
                  </span>
                  <p className="text-[10px] text-stone-400 leading-none mt-0.5">
                    Participante: <span className="text-white font-bold">{mePlayer.name}</span>
                  </p>
                </div>

                <div
                  className={`px-3.5 py-1.5 rounded-2xl font-mono font-black text-lg sm:text-xl shadow-xl flex items-center gap-1.5 ${
                    questionTimeLeft <= 5
                      ? "bg-red-600 text-white animate-bounce ring-4 ring-red-400/50"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 ring-2 ring-amber-300"
                  }`}
                >
                  <span>⏱️ 00:{questionTimeLeft < 10 ? `0${questionTimeLeft}` : questionTimeLeft}</span>
                </div>
              </div>

              {/* CONSECUENCIAS Y TURNO */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-stone-900/90 rounded-xl border border-stone-800 text-[11px] font-bold shadow">
                <div className="flex items-center gap-1 text-emerald-400">
                  <span>🎯 Acierto:</span>
                  <span className="bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-700/60 font-black text-xs">
                    +1 Casilla & Bono de Velocidad
                  </span>
                </div>
                <div className="flex items-center gap-1 text-rose-400">
                  <span>⚠️ Fallo:</span>
                  <span className="bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-700/60 font-black text-xs">
                    -1 Casilla
                  </span>
                </div>
              </div>

              {/* TEXTO DE LA PREGUNTA */}
              <h4 className="text-base sm:text-lg font-bold text-amber-200 leading-snug">
                {activeQuestion.question}
              </h4>

              {/* OPCIONES DE RESPUESTA */}
              <div className="space-y-2 pt-1">
                {activeQuestion.options.map((option, idx) => {
                  let btnColor = "bg-stone-800 text-amber-100 border-stone-700 font-bold hover:border-amber-400 hover:bg-amber-900/70 cursor-pointer";
                  if (isAnswerSubmitted) {
                    if (idx === activeQuestion.correctAnswer) {
                      btnColor = "bg-emerald-700 text-white border-emerald-400 shadow-lg font-bold";
                    } else if (idx === selectedOption) {
                      btnColor = "bg-red-800 text-white border-red-500";
                    } else {
                      btnColor = "bg-stone-900 text-stone-500 border-stone-800 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full p-3 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between ${btnColor}`}
                    >
                      <span className="pr-2">{option}</span>
                      {isAnswerSubmitted && idx === activeQuestion.correctAnswer && (
                        <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />
                      )}
                      {isAnswerSubmitted && idx === selectedOption && idx !== activeQuestion.correctAnswer && (
                        <XCircle size={18} className="text-rose-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. RESUMEN DE FASE / CORTE DEL 50% */}
        {roundStatus === "ROUND_SUMMARY" && (
          <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-between space-y-4 custom-scrollbar text-center">
            <div className="space-y-3 my-auto">
              <span className="text-3xl block">🏁</span>
              <h3 className="text-xl font-serif font-black text-amber-300">
                ¡Fin de la Fase {currentRound}!
              </h3>
              <p className="text-xs text-stone-300 px-2">
                Solo clasifica el 50% con mayor puntuación acumulada.
              </p>

              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-amber-300 pb-1 border-b border-stone-800">
                  <span>Tabla de Clasificación Oficial</span>
                  <span>Puntos</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
                    <div
                      key={p.id}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                        p.isEliminated
                          ? "bg-rose-950/30 border-rose-900/40 text-stone-500"
                          : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-bold"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-stone-400">#{idx + 1}</span>
                        <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="truncate max-w-[120px]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black">{p.score} pts</span>
                        {p.isEliminated ? (
                          <span className="text-[9px] text-rose-400 font-bold">Eliminado</span>
                        ) : (
                          <span className="text-[9px] text-emerald-400 font-bold">Clasificado ✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleNextRound}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-black text-xs rounded-xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Avanzar a la Fase {currentRound + 1}</span>
              <ArrowRight size={16} />
            </button>
          </main>
        )}

        {/* 5. PODIO FINAL Y PREMIACIÓN */}
        {roundStatus === "FINAL_PODIUM" && (
          <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-between space-y-4 custom-scrollbar text-center">
            <div className="space-y-3 my-auto">
              <span className="text-4xl block animate-bounce">🏆</span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-amber-300">
                ¡Gran Podio Final!
              </h3>
              <p className="text-xs text-stone-300">
                Felicidades a los ganadores de La Copa Biblos.
              </p>

              <div className="p-3 bg-gradient-to-b from-amber-600/30 via-yellow-600/20 to-amber-900/10 rounded-2xl border-2 border-amber-400 text-center space-y-1 shadow-lg">
                <span className="text-3xl block">🏆</span>
                <p className="text-xs font-black text-amber-300 uppercase">Campeón · Copa de Oro</p>
                <p className="text-sm font-black text-white">{mePlayer?.name}</p>
                <span className="text-xs font-mono text-amber-300 font-black block">{mePlayer?.score || 0} pts</span>
                
                <div className="pt-1">
                  <span className="text-amber-300 font-black inline-flex items-center gap-1.5 text-sm">
                    +50 <GoldCoinIcon className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 text-amber-300 font-black text-xs rounded-xl border border-amber-500/40 transition"
            >
              Volver al Menú Principal
            </button>
          </main>
        )}

        {/* MODAL 1: AUTENTICACIÓN SECRETA DE ADMINISTRADOR (PIN) */}
        {showPinModal && (
          <div className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in">
            <div className="bg-[#2A2621] border-2 border-amber-500 rounded-3xl p-5 max-w-xs w-full shadow-2xl text-stone-200 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <ShieldCheck size={24} />
              </div>

              <div>
                <h4 className="text-sm font-serif font-black text-amber-300 uppercase">
                  Acceso Exclusivo de Administrador
                </h4>
                <p className="text-[11px] text-stone-400 mt-1">
                  Introduce el PIN maestro para editar o programar torneos:
                </p>
              </div>

              <input
                type="password"
                maxLength={8}
                value={enteredPin}
                onChange={e => setEnteredPin(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleVerifyPin()}
                placeholder="PIN Maestro (ej: 7777)"
                className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-center font-mono text-base font-bold text-amber-300 tracking-widest focus:outline-none focus:border-amber-400"
                autoFocus
              />

              {pinError && (
                <p className="text-xs font-bold text-rose-400">{pinError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleVerifyPin}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-black text-xs rounded-xl shadow-lg"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="py-2 px-3 bg-stone-800 text-stone-300 font-bold text-xs rounded-xl border border-stone-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: PANEL DE EDICIÓN Y PROGRAMACIÓN DE PREGUNTAS */}
        {showAdminModal && (
          <div className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in">
            <div className="bg-[#2A2621] border-2 border-amber-500 rounded-3xl p-5 max-w-lg w-full shadow-2xl text-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Settings size={18} />
                  <span>⚙️ Panel Maestro: Programador de Copas y Preguntas</span>
                </div>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="p-1 rounded-full bg-stone-800 text-stone-400 hover:text-white"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <p className="text-xs text-stone-300 leading-snug">
                Pega aquí el JSON del torneo para programar preguntas personalizadas clasificadas por nivel (<strong>PRINCIPIANTE</strong> para Fase 1, <strong>INTERMEDIO</strong> para Fase 2, <strong>AVANZADO</strong> para Fase 3) en vivo sin necesidad de actualizar el APK en Google Play Store:
              </p>

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-amber-300/80 font-bold uppercase">Editor JSON de la Copa</span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminJsonInput(JSON.stringify({
                      title: "1ra Copa Biblos Semanal",
                      theme: "GRAN TORNEO MUNDIAL BÍBLICO",
                      customQuestions: DEFAULT_WEEKLY_EVENT.customQuestions
                    }, null, 2));
                    setAdminSaveMessage("ℹ️ Plantilla oficial con niveles cargada en el editor. Presiona 'Guardar' para aplicarla.");
                  }}
                  className="text-[10px] font-bold text-amber-400 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-lg border border-amber-500/40 transition cursor-pointer"
                >
                  🔄 Cargar Plantilla con Niveles
                </button>
              </div>

              <textarea
                value={adminJsonInput}
                onChange={e => setAdminJsonInput(e.target.value)}
                rows={12}
                className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400 custom-scrollbar"
                placeholder='{\n  "title": "Copa Bíblica Especial",\n  "theme": "ANTIGUO Y NUEVO TESTAMENTO",\n  "customQuestions": [\n    {\n      "question": "¿Quién construyó el arca?",\n      "options": ["Moisés", "Noé", "David", "Abraham"],\n      "correct": 1,\n      "difficulty": "PRINCIPIANTE",\n      "period": "El Principio",\n      "reference": "Génesis 6"\n    },\n    {\n      "question": "¿Quién fue el rey más sabio?",\n      "options": ["Saúl", "Salomón", "Roboam", "David"],\n      "correct": 1,\n      "difficulty": "INTERMEDIO",\n      "period": "Reyes, Profetas y Poetas",\n      "reference": "1 Reyes 3"\n    },\n    {\n      "question": "¿Dónde fue desterrado Juan?",\n      "options": ["Creta", "Patmos", "Roma", "Chipre"],\n      "correct": 1,\n      "difficulty": "AVANZADO",\n      "period": "Tiempos Finales",\n      "reference": "Apocalipsis 1:9"\n    }\n  ]\n}'
              />

              {adminSaveMessage && (
                <p className="text-xs font-bold text-amber-300">{adminSaveMessage}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveCustomTournamentConfig}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={15} />
                  <span>Guardar y Aplicar a la Copa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="py-2.5 px-4 bg-stone-800 text-stone-300 font-bold text-xs rounded-xl border border-stone-700 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🧭 GUÍA EN VIVO CON PUNTERO DINÁMICO EN LA PANTALLA REAL (COPA BIBLOS) */}
        <LiveInteractivePointerTour
          mode="COPA_BIBLOS"
          isActive={!isTutorialCompleted("COPA_BIBLOS")}
          onFinish={() => {}}
          playSound={playSound}
          triggerHaptic={triggerHaptic}
          steps={[
            {
              title: "1. ¡Bienvenido a la Copa Biblos!",
              instruction: "Este es el gran torneo eliminatorio en vivo de la comunidad donde compites por la Corona y el Salón de Leyendas.",
              position: "top",
              handEmoji: "🏆"
            },
            {
              title: "2. Activa tu Recordatorio y Registro",
              instruction: "Toca 'Activar Notificación' para que la app te avise cuando empiece el torneo.",
              position: "top",
              handEmoji: "👇"
            },
            {
              title: "3. Modo Práctica / Simulador de Carrera",
              instruction: "Puedes entrar al Simulador de Carrera para practicar los 3 asaltos eliminatorios (Grupos, Semifinal y Gran Final).",
              position: "bottom",
              handEmoji: "🎮"
            },
            {
              title: "4. Lanza el Dado y Conquista la Meta",
              instruction: "Durante la carrera, tira los dados, responde las preguntas sin fallar y sé el primero en cruzar la meta para ganar el Oro.",
              position: "bottom",
              handEmoji: "🎲"
            }
          ]}
        />
      </div>
    </div>
  );
};

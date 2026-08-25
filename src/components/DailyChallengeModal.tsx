import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, BookOpen, XCircle, CheckCircle, ArrowRight, RotateCcw, Award, Share2, Flame } from "lucide-react";
import { Question } from "../types";
import {
  DailyChallengeState,
  getDailyChallenge,
  answerDailyQuestion,
  claimDailyChallengeSharePoint,
  getDailyStreakState,
  DailyChallengeStreakState,
  DAILY_STREAK_MILESTONES,
} from "../services/dailyChallengeService";
import { getTalentsBalance } from "../services/economyService";
import { getUserProfile, UserProfile, getRankTier } from "../services/userProfile";
import { InteractiveTutorialGuide } from "./InteractiveTutorialGuide";
import confetti from "canvas-confetti";

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateTalents: (newBalance: number) => void;
  playSound: (type: "select" | "correct" | "wrong") => void;
  triggerHaptic?: (type: "light" | "medium" | "heavy" | "success" | "warning" | "error") => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  onUpdateTalents,
  playSound,
  triggerHaptic,
}) => {
  const [challenge, setChallenge] = useState<DailyChallengeState>(() => getDailyChallenge());
  const [streakState, setStreakState] = useState<DailyChallengeStreakState>(() => getDailyStreakState());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState<boolean>(false);
  const [lastIsCorrect, setLastIsCorrect] = useState<boolean | null>(null);
  const [pointsGainedThisAnswer, setPointsGainedThisAnswer] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile());
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getDailyChallenge();
      setChallenge(current);
      setStreakState(getDailyStreakState());
      setSelectedOption(null);
      setShowAnswerFeedback(false);
      setLastIsCorrect(null);
      setPointsGainedThisAnswer(0);
      setShareFeedback(null);
      setUserProfile(getUserProfile());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentIdx = challenge.currentQuestionIndex;
  const currentQ: Question | undefined = challenge.questions[currentIdx];
  // Seguridad: si no hay preguntas válidas o el índice se desfasó, tratar como terminado
  const isFinished = challenge.completed || currentIdx >= 10 || !currentQ || challenge.questions.length < 10;

  const handleSelectOption = (index: number) => {
    if (showAnswerFeedback || isFinished || !currentQ) return;

    setSelectedOption(index);
    setShowAnswerFeedback(true);

    const result = answerDailyQuestion(index);
    setLastIsCorrect(result.isCorrect);
    setPointsGainedThisAnswer(result.rankingPointsEarned);
    setUserProfile(getUserProfile());

    if (result.isCorrect) {
      playSound("correct");
      if (triggerHaptic) triggerHaptic("success");
    } else {
      playSound("wrong");
      if (triggerHaptic) triggerHaptic("error");
    }

    if (result.rewardEarned) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
      onUpdateTalents(getTalentsBalance());
      setStreakState(getDailyStreakState());
    }

    setTimeout(() => {
      setChallenge(result.newState);
      setSelectedOption(null);
      setShowAnswerFeedback(false);
      setLastIsCorrect(null);
      setPointsGainedThisAnswer(0);
      if (result.isFinished) {
        onUpdateTalents(getTalentsBalance());
        setStreakState(getDailyStreakState());
      }
    }, 1600);
  };

  const handleShare = (platform: "WHATSAPP" | "FACEBOOK") => {
    playSound("select");
    if (triggerHaptic) triggerHaptic("medium");

    const shareUrl = window.location.origin || "https://biblosgames.com";
    const shareText = `📖✨ ¡Acabo de estudiar la Biblia en el Desafío Bíblico de Hoy ("${challenge.title}") en Biblos Games! Llevo una racha de ${Math.max(1, streakState.currentStreak)} días consecutivos de estudio. ¡Ponte a prueba tú también! 🕊️🎮`;

    if (platform === "WHATSAPP") {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`;
      window.open(waUrl, "_blank");
    } else {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
      window.open(fbUrl, "_blank");
    }

    if (!challenge.shareBonusClaimed) {
      setTimeout(() => {
        const claimResult = claimDailyChallengeSharePoint();
        if (claimResult.success) {
          setChallenge(claimResult.newState);
          setUserProfile(getUserProfile());
          setShareFeedback("⭐ ¡+1 Punto Extra al Ranking ELO obtenido por compartir!");
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 },
          });
          playSound("correct");
          if (triggerHaptic) triggerHaptic("success");
        }
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#24201A] border-2 border-amber-500/80 rounded-3xl max-w-lg w-full p-4 sm:p-5 text-center space-y-3 shadow-2xl relative overflow-hidden text-stone-200"
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-800/80 cursor-pointer transition z-10"
        >
          <XCircle size={22} />
        </button>

        {/* Encabezado del Desafío Bíblico de Hoy con Medidor de Racha */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-full text-[10px] font-black uppercase tracking-wider shadow animate-pulse">
              <Flame size={12} className="text-orange-400" />
              <span>Racha: {streakState.currentStreak} {streakState.currentStreak === 1 ? "Día" : "Días"}</span>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
              <span>{challenge.icon} {challenge.themeName || "Estudio Diario"}</span>
            </div>

            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-black">
              <span>+1 Talento</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100 leading-tight">
            {challenge.title}
          </h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Barra de Progreso de 10 Hitos / Casillas */}
        <div className="bg-stone-900/90 p-2.5 rounded-2xl border border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-amber-300 flex items-center gap-1">
              <span>🚩 Casilla:</span>
              <span className="text-white font-mono">{Math.min(10, currentIdx + 1)} / 10</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-mono bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                🏆 {userProfile.rating || 1000} pts ELO
              </span>
              <span className="text-emerald-400 font-mono">
                ✨ {challenge.correctAnswersCount}/10
              </span>
            </div>
          </div>

          {/* Cuadrícula interactiva de 10 casillas */}
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx && !isFinished;
              const ans = challenge.userAnswers[idx];

              let bg = "bg-stone-800 border-stone-700 text-stone-500";
              if (isPast && ans) {
                bg = ans.isCorrect
                  ? "bg-emerald-600 border-emerald-400 text-white font-black"
                  : "bg-rose-900/80 border-rose-600 text-rose-200";
              } else if (isCurrent) {
                bg = "bg-amber-500 border-white text-amber-950 font-black animate-pulse scale-105 shadow-md";
              }

              return (
                <div
                  key={idx}
                  className={`h-8 sm:h-9 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold transition-all ${bg}`}
                >
                  <span>{idx + 1}</span>
                  {isPast && ans && (
                    <span className="text-[8px] leading-none">
                      {ans.isCorrect ? "+1 ⭐" : "✗"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTENIDO: JUEGO O PANTALLA DE DESAFÍO COMPLETADO */}
        {!isFinished && currentQ ? (
          <div className="space-y-3 pt-1">
            {/* Tarjeta de la Pregunta Actual */}
            <div className="bg-[#1B1A17] p-3.5 sm:p-4 rounded-2xl border border-[#3A342C] text-left space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Pregunta {currentIdx + 1} de 10
                </span>
                <span className="text-[11px] font-serif font-bold text-stone-400">
                  {currentQ.reference}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-stone-100 leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Opciones de Respuesta */}
            <div className="grid grid-cols-1 gap-2 text-left">
              {currentQ.options.map((opt, oIdx) => {
                let btnStyle = "bg-stone-900/90 hover:bg-stone-800 border-stone-700 text-stone-200";
                if (showAnswerFeedback) {
                  if (oIdx === currentQ.correctAnswer) {
                    btnStyle = "bg-emerald-700 border-emerald-400 text-white font-bold animate-pulse";
                  } else if (oIdx === selectedOption) {
                    btnStyle = "bg-rose-900 border-rose-500 text-rose-200";
                  } else {
                    btnStyle = "bg-stone-900/40 border-stone-800 text-stone-600 opacity-50";
                  }
                }

                return (
                  <button
                    key={oIdx}
                    disabled={showAnswerFeedback}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer active:scale-98 shadow ${btnStyle}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center text-[10px] font-black text-amber-300 shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="font-medium leading-snug">{opt}</span>
                    </div>

                    {showAnswerFeedback && oIdx === currentQ.correctAnswer && (
                      <div className="flex items-center gap-1 text-emerald-300 shrink-0 font-black text-xs">
                        <span>+1 ⭐</span>
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* PANTALLA DE RESULTADOS DEL DESAFÍO DIARIO + RACHAS EDUCATIVAS */
          <div className="space-y-3 py-1">
            {/* Mensaje de Racha Educativa / Hito alcanzado */}
            {challenge.streakMilestoneUnlocked ? (
              <div className="p-3.5 bg-gradient-to-r from-amber-950 via-orange-950 to-stone-900 border-2 border-amber-400 rounded-2xl text-center space-y-1.5 shadow-xl animate-fade-in">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-amber-400 text-stone-950 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <Flame size={13} />
                  <span>¡Hito Bíblico de {challenge.streakMilestoneUnlocked.milestoneDays} Días!</span>
                </div>
                <h4 className="text-base font-serif font-black text-amber-200">
                  {challenge.streakMilestoneUnlocked.educationalTitle}
                </h4>
                <p className="text-xs text-stone-200 leading-relaxed italic">
                  "{challenge.streakMilestoneUnlocked.biblicalMessage}"
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-[11px] font-black bg-amber-500/20 text-yellow-300 px-2.5 py-0.5 rounded-lg border border-amber-400/40">
                    🪙 +{challenge.streakMilestoneUnlocked.bonusTalents} Talentos
                  </span>
                  <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-400/40">
                    ⭐ +{challenge.streakMilestoneUnlocked.bonusRankingPoints} Puntos ELO
                  </span>
                </div>
              </div>
            ) : (
              /* Indicador de Racha Regular */
              <div className="p-3 bg-stone-900/90 border border-orange-500/40 rounded-2xl text-center space-y-1 shadow-md">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-orange-400">
                  <Flame size={16} className="animate-bounce" />
                  <span>
                    Has estudiado la Biblia durante {Math.max(1, streakState.currentStreak)} {Math.max(1, streakState.currentStreak) === 1 ? "día consecutivo" : "días consecutivos"}.
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {streakState.currentStreak < 3 && `¡Faltan ${3 - streakState.currentStreak} días para tu hito de 3 días (+3 Talentos / +5 ELO)!`}
                  {streakState.currentStreak >= 3 && streakState.currentStreak < 7 && `¡Faltan ${7 - streakState.currentStreak} días para tu hito de 7 días (+7 Talentos / +12 ELO)!`}
                  {streakState.currentStreak >= 7 && streakState.currentStreak < 14 && `¡Faltan ${14 - streakState.currentStreak} días para tu hito de 14 días (+14 Talentos / +25 ELO)!`}
                  {streakState.currentStreak >= 14 && streakState.currentStreak < 30 && `¡Faltan ${30 - streakState.currentStreak} días para el hito de 30 días (+30 Talentos / +60 ELO)!`}
                  {streakState.currentStreak >= 30 && "¡Eres un Columna de Sabiduría Bíblica! Mantén tu devoción encendida."}
                </p>
              </div>
            )}

            {/* Resumen de Aciertos */}
            <div className="p-3 bg-gradient-to-b from-amber-950/50 via-stone-900 to-amber-950/50 border border-amber-500/50 rounded-2xl text-center space-y-1.5 shadow">
              <h3 className="text-base font-serif font-black text-amber-200">
                ¡Desafío Bíblico de Hoy Completado!
              </h3>
              <p className="text-xs text-stone-300">
                Respondiste correctamente <strong className="text-emerald-400">{challenge.correctAnswersCount} de 10</strong> preguntas.
              </p>

              <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/50 rounded-lg text-xs font-black text-amber-300">
                  <span>🏆 +{challenge.correctAnswersCount} Puntos ELO</span>
                </div>

                {challenge.rewardClaimed && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/50 rounded-lg text-xs font-black text-emerald-300">
                    <span>🪙 +1 Talento Diario</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN COMPARTIR POR FACEBOOK O WHATSAPP (+1 PUNTO EXTRA) */}
            <div className="bg-stone-900/90 p-2.5 rounded-2xl border border-amber-500/40 text-center space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wide flex items-center gap-1">
                  <Share2 size={12} className="text-amber-400" />
                  <span>Comparte tu Racha Bíblica (+1 Pto Extra):</span>
                </span>
                {challenge.shareBonusClaimed ? (
                  <span className="text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full font-bold">
                    ✓ Cobrado
                  </span>
                ) : (
                  <span className="text-[8px] bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                    ⭐ +1 Punto ELO
                  </span>
                )}
              </div>

              {shareFeedback && (
                <p className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 py-1 px-2 rounded-lg border border-emerald-500/40 animate-fade-in">
                  {shareFeedback}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShare("WHATSAPP")}
                  className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleShare("FACEBOOK")}
                  className="py-2 px-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <span>📘</span>
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            {/* Listado de citas para repasar */}
            <div className="bg-stone-900/90 p-2.5 rounded-2xl border border-stone-800 text-left space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                📖 Citas Bíblicas del Desafío:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {challenge.questions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="p-1.5 bg-[#1B1A17] rounded-lg border border-stone-800 text-[10px] flex items-center justify-between"
                  >
                    <span className="text-stone-400 font-bold">#{qIdx + 1}</span>
                    <span className="text-amber-200 font-serif truncate">{q.reference}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-stone-400">
              ⏳ El próximo desafío se renovará automáticamente a las <strong>12:00 AM (medianoche)</strong>.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow cursor-pointer"
            >
              Aceptar y Continuar
            </button>
          </div>
        )}
      </motion.div>

      {/* 🧭 TUTORIAL INTERACTIVO DEL DESAFÍO DIARIO */}
      <InteractiveTutorialGuide
        mode="DAILY_CHALLENGE"
        playSound={playSound}
        triggerHaptic={triggerHaptic}
      />
    </div>
  );
};

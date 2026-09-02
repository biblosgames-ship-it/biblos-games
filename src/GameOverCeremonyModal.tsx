import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoldCoinIcon } from './components/GoldCoinIcon';
import {
  Trophy,
  Crown,
  RotateCcw,
  Home,
  Users,
  X,
  Sparkles,
  Target,
  Clock,
  Award,
  TrendingUp,
  CheckCircle,
  Flame,
  Share2,
  MessageCircle,
  Facebook,
  Copy,
  Check
} from 'lucide-react';
import { getRankTier, RankTier, RANK_TIERS } from './services/userProfile';
import { getLeaderboard, SoloScoreResult, LeaderboardEntry, calculateSoloScore } from './services/leaderboardService';

interface PlayerInfo {
  id: string | number;
  name: string;
  avatar?: string;
  country?: string;
  countryFlag?: string;
  position?: number;
}

interface GameOverCeremonyModalProps {
  isOpen: boolean;
  isSolo: boolean;
  isOnline: boolean;
  gameWinner?: PlayerInfo | null;
  currentPlayer?: PlayerInfo | null;
  players: PlayerInfo[];
  soloScoreResult?: SoloScoreResult | null;
  soloMatchDuration?: number;
  correctCount?: number;
  totalQuestions?: number;
  timeElapsedSeconds?: number;
  difficulty?: string;
  userRating?: number;
  talentsEarned?: number;
  surrenderInfo?: { surrenderedName: string; isMeSurrendered: boolean } | null;
  onRestart: () => void;
  onExit: () => void;
  onOpenNewRoom?: () => void;
  onOpenLeaderboard?: () => void;
}

export const GameOverCeremonyModal: React.FC<GameOverCeremonyModalProps> = ({
  isOpen,
  isSolo,
  isOnline,
  gameWinner,
  currentPlayer,
  players = [],
  talentsEarned,
  surrenderInfo,
  soloScoreResult,
  soloMatchDuration = 600,
  correctCount = 0,
  totalQuestions = 0,
  timeElapsedSeconds = 12,
  difficulty = 'INTERMEDIO',
  userRating = 1000,
  onRestart,
  onExit,
  onOpenNewRoom,
  onOpenLeaderboard,
}) => {
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<string>('TODOS');
  const [isCopiedResult, setIsCopiedResult] = useState(false);

  if (!isOpen) return null;

  const winner = gameWinner || currentPlayer || players[0] || {
    id: 1,
    name: 'Jugador Bíblico',
    avatar: '/avatars/david.jpg',
    position: 0,
  };

  const currentPos = typeof winner.position === 'number' ? winner.position : 0;
  const completedMeta = currentPos >= 75;

  const currentCategory = soloMatchDuration === 300 ? '5_MIN'
    : soloMatchDuration === 600 ? '10_MIN'
    : soloMatchDuration === 900 ? '15_MIN'
    : soloMatchDuration === 1200 ? '20_MIN'
    : 'INFINITO';

  const categoryLabel = currentCategory === '5_MIN' ? '⚡ Carrera 5 Min'
    : currentCategory === '10_MIN' ? '⏱️ Carrera 10 Min'
    : currentCategory === '15_MIN' ? '⏳ Carrera 15 Min'
    : currentCategory === '20_MIN' ? '🏃 Carrera 20 Min'
    : '♾️ Meta 75';

  // Si soloScoreResult no ha llegado todavía, se calcula al vuelo de forma 100% segura
  const effectiveSoloResult: SoloScoreResult = soloScoreResult || calculateSoloScore({
    correct: correctCount,
    errors: Math.max(0, totalQuestions - correctCount),
    difficulty,
    timeSeconds: Math.max(5, timeElapsedSeconds),
    turns: Math.max(1, currentPos),
    tilesAdvanced: currentPos,
    completed: completedMeta,
    currentRating: userRating,
  });

  const tier = effectiveSoloResult.rankTier || getRankTier(effectiveSoloResult.newRating || userRating);

  // Calcular la posición que ocupa el jugador en la categoría
  const allLeaderboard = getLeaderboard();
  const catEntries = allLeaderboard
    .filter(e => e.timeCategory === currentCategory || (currentCategory === 'INFINITO' && e.mode === 'TABLERO_SOLO'))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  let myRankPosition = catEntries.findIndex(e => (e.score || 0) <= effectiveSoloResult.totalSoloScore);
  if (myRankPosition === -1) {
    myRankPosition = catEntries.length > 0 ? catEntries.length + 1 : 1;
  } else {
    myRankPosition = myRankPosition + 1;
  }

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : (correctCount > 0 ? 100 : 0);
  const minutes = Math.floor(timeElapsedSeconds / 60);
  const seconds = (timeElapsedSeconds % 60).toString().padStart(2, '0');

  const shareText = `👑 ¡Acabo de jugar en BIBLOS GAMES!
🏆 Jugador: ${winner.name}
🏁 Meta: Casilla ${currentPos}/75
⚡ Solo Score: ${effectiveSoloResult.totalSoloScore} pts | Rating: ${effectiveSoloResult.newRating} ELO
🎯 Aciertos: ${correctCount}/${totalQuestions} (${accuracy}%)
⏱️ Tiempo: ${minutes}:${seconds}
🏅 Rango: ${tier.title} ${tier.icon}

¿Te atreves a superar mi récord? Juega gratis en: ${window.location.origin}`;

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resultados de Biblos Games',
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        console.log('Share canceled', err);
      }
    } else {
      handleCopyResult();
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.origin);
    const quote = encodeURIComponent(shareText);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank', 'width=600,height=400');
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(shareText);
    setIsCopiedResult(true);
    setTimeout(() => setIsCopiedResult(false), 2500);
  };

  // Determinar si el usuario actual es el ganador o perdedor
  const isMeSurrendered = Boolean(surrenderInfo?.isMeSurrendered);
  const isRivalSurrendered = Boolean(surrenderInfo && !surrenderInfo.isMeSurrendered);

  let isMeWinner = true;
  if (isMeSurrendered) {
    isMeWinner = false;
  } else if (isRivalSurrendered) {
    isMeWinner = true;
  } else if (isSolo) {
    // Modo individual: Gana si alcanzó la meta 75 o si en carrera por tiempo obtuvo delta positivo de rating
    isMeWinner = completedMeta || (currentCategory !== 'INFINITO' && currentPos > 0 && effectiveSoloResult.ratingDelta >= 0);
  } else if (gameWinner) {
    // Multijugador / 1v1 / VS Bots / Amigos:
    const myName = (currentPlayer?.name || '').trim().toLowerCase();
    const myId = String(currentPlayer?.id ?? '');
    const winnerName = (gameWinner.name || '').trim().toLowerCase();
    const winnerId = String(gameWinner.id ?? '');

    const matchesId = winnerId !== '' && myId !== '' && winnerId === myId;
    const matchesName = winnerName !== '' && myName !== '' && winnerName === myName;
    
    isMeWinner = Boolean(matchesId || matchesName);
  }

  return (
    <div className={`fixed inset-0 z-[10000] w-full h-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-y-auto ${
      isMeWinner 
        ? 'bg-gradient-to-b from-[#0b241b] via-[#05130e] to-[#020806] text-emerald-100' 
        : 'bg-gradient-to-b from-[#240b0e] via-[#130507] to-[#080203] text-rose-100'
    }`}>
      {/* RESPLANDOR Y HALO DE FONDO */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full blur-[120px] opacity-35 animate-pulse ${
          isMeWinner ? 'bg-emerald-500' : 'bg-rose-600'
        }`} />
      </div>

      {/* CABECERA SUPERIOR: BADGE */}
      <div className="relative z-10 pt-1 sm:pt-2 text-center shrink-0">
        <div className={`inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 rounded-full text-xs font-black tracking-[0.2em] uppercase border shadow-2xl ${
          isMeWinner
            ? 'bg-amber-500 text-amber-950 border-amber-300 ring-4 ring-amber-400/30'
            : 'bg-rose-600 text-white border-rose-400 ring-4 ring-rose-500/30'
        }`}>
          <Sparkles size={14} />
          <span>
            {surrenderInfo
              ? (surrenderInfo.isMeSurrendered ? '🏳️ PARTIDA ABANDONADA' : '🏆 ¡VICTORIA POR RETIRADA RIVAL!')
              : isMeWinner
              ? (completedMeta ? '¡¡META 75 CONQUISTADA!!' : '¡¡CARRERA FINALIZADA Y REGISTRADA!!')
              : '⚔️ ¡FIN DE LA PARTIDA! ⚔️'}
          </span>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
      <div className="relative z-10 my-auto text-center space-y-3 max-w-lg w-full px-2 py-3">
        
        {/* TROFEO / CORONA RADIANTE O CRUZ DE DERROTA */}
        <div className="inline-block">
          <motion.div
            initial={{ scale: 0.6, rotate: isMeWinner ? -8 : 0 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 220 }}
            className={`p-4 sm:p-5 rounded-full border-4 shadow-2xl inline-flex items-center justify-center ${
              isMeWinner
                ? 'border-white shadow-[0_0_50px_rgba(245,158,11,0.5)] bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-500 text-amber-950 ring-8 ring-amber-300/30'
                : 'border-rose-400/80 shadow-[0_0_50px_rgba(244,63,94,0.6)] bg-gradient-to-tr from-rose-900 via-stone-900 to-rose-950 text-rose-300 ring-8 ring-rose-500/30'
            }`}
          >
            {isMeWinner ? (
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
            ) : (
              <X className="w-12 h-12 sm:w-16 sm:h-16 text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,1)] stroke-[3]" />
            )}
          </motion.div>
        </div>

        {/* TÍTULO Y BANNER HAS GANADO / HAS PERDIDO */}
        <div className="space-y-2">
          <h1 className={`text-2xl sm:text-4xl font-black font-serif tracking-tight drop-shadow-[0_0_25px_rgba(245,158,11,0.7)] ${
            isMeWinner ? 'text-amber-300' : 'text-rose-400'
          }`}>
            {surrenderInfo
              ? (surrenderInfo.isMeSurrendered ? '🏳️ HAS ABANDONADO' : '👑 ¡VICTORIA POR ABANDONO!')
              : isMeWinner
              ? (completedMeta ? '👑 ¡META ALCANZADA! 👑' : '🏁 ¡CARRERA COMPLETADA! 🏁')
              : '💔 ¡HAS SIDO DERROTADO! 💔'}
          </h1>

          {/* BANNER ENORME HAS GANADO (VERDE) / HAS PERDIDO (ROJO MAYÚSCULA) */}
          <div className="pt-1 pb-1">
            {isMeWinner ? (
              <motion.div
                initial={{ scale: 0.8, y: -5 }}
                animate={{ scale: [1, 1.04, 1], y: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block px-6 sm:px-10 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-950 border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.75)]"
              >
                <span className="text-3xl sm:text-5xl font-black font-sans uppercase tracking-widest text-emerald-300 drop-shadow-[0_0_25px_rgba(52,211,153,1)]">
                  ¡HAS GANADO!
                </span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, y: -5 }}
                animate={{ scale: [1, 1.03, 1], y: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block px-6 sm:px-10 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.75)]"
              >
                <span className="text-3xl sm:text-5xl font-black font-sans uppercase tracking-widest text-rose-300 drop-shadow-[0_0_25px_rgba(251,113,133,1)]">
                  ¡HAS PERDIDO!
                </span>
              </motion.div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-stone-200 font-medium max-w-sm mx-auto leading-snug">
            {surrenderInfo ? (
              surrenderInfo.isMeSurrendered ? (
                <span>Has abandonado el duelo. La victoria y la bolsa de talentos se otorgan al rival <strong className="text-amber-300">{winner.name}</strong>.</span>
              ) : (
                <span>¡El rival <strong className="text-rose-300">{surrenderInfo.surrenderedName}</strong> ha abandonado la partida! Te llevas la victoria y los <strong className="text-amber-300">+2 🪙 Talentos</strong>.</span>
              )
            ) : isMeWinner ? (
              <span>¡Gran desempeño, <strong className="text-amber-300">{currentPlayer?.name || winner.name}</strong>! Alcanzaste la <strong className="text-amber-300">Casilla {currentPos}/75</strong>.</span>
            ) : (
              <span>¡Buen intento, <strong className="text-stone-300">{currentPlayer?.name || 'Jugador'}</strong>! La victoria fue para <strong className="text-amber-300">{winner.name}</strong> ({winner.countryFlag || '🇩🇴'}). ¡Sigue entrenando tu conocimiento bíblico!</span>
            )}
          </p>
        </div>

        {/* 🥇 1. POSICIONAMIENTO EN EL SALÓN DE LA FAMA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-gradient-to-r from-amber-950/80 via-stone-900/90 to-amber-950/80 rounded-2xl border-2 border-amber-400/80 shadow-lg flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-amber-950 flex flex-col items-center justify-center font-black shadow-md shrink-0 border border-amber-300">
              <span className="text-lg leading-none">{myRankPosition === 1 ? '🥇' : myRankPosition === 2 ? '🥈' : myRankPosition === 3 ? '🥉' : '🏅'}</span>
              <span className="text-[10px] leading-tight font-mono font-black">#{myRankPosition}</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                Tu Posición en el Salón de la Fama
              </span>
              <p className="text-xs sm:text-sm font-black text-white leading-tight">
                {myRankPosition === 1 ? '¡Eres el #1 en esta modalidad!' : `Puesto #${myRankPosition} en ${categoryLabel}`}
              </p>
              <p className="text-[10px] text-stone-300">
                {categoryLabel} · Casilla {currentPos}/75
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenLeaderboard) {
                onOpenLeaderboard();
              } else {
                setShowFullLeaderboard(true);
              }
            }}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-[11px] rounded-xl shadow transition shrink-0 flex items-center gap-1 border border-amber-300 cursor-pointer"
          >
            <Crown size={14} />
            <span>Ver Tabla</span>
          </button>
        </motion.div>

        {/* 🪙 RECOMPENSA DE TALENTOS BÍBLICOS */}
        {typeof talentsEarned === 'number' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-3 rounded-2xl border-2 flex items-center justify-between shadow-xl ${
              talentsEarned > 0
                ? 'bg-gradient-to-r from-amber-950 via-emerald-950 to-stone-900 border-amber-400 text-amber-200'
                : talentsEarned === 0
                ? 'bg-stone-900 border-stone-700 text-stone-300'
                : 'bg-rose-950/80 border-rose-600 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GoldCoinIcon className="w-7 h-7 inline-block animate-bounce shrink-0" />
              <div className="text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">
                  Economía de Partida
                </span>
                <p className="text-xs sm:text-sm font-black text-white leading-tight">
                  {talentsEarned > 0
                    ? `¡Has ganado +${talentsEarned} Talentos Bíblicos!`
                    : talentsEarned === 0
                    ? 'Recuperas tu entrada de Talentos'
                    : `Consumo: ${talentsEarned} Talento`}
                </p>
              </div>
            </div>
            <span className={`text-sm sm:text-base font-mono font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
              talentsEarned > 0
                ? 'bg-amber-500 text-amber-950 border-amber-300'
                : 'bg-stone-800 text-stone-300 border-stone-600'
            }`}>
              <GoldCoinIcon className="w-4 h-4" /> {talentsEarned >= 0 ? `+${talentsEarned}` : talentsEarned}
            </span>
          </motion.div>
        )}

        {/* 📊 2. RESUMEN DETALLADO DE LA PARTIDA */}
        <div className="bg-stone-950/85 backdrop-blur-md p-3.5 rounded-2xl border border-stone-800 space-y-2 text-left shadow-xl">
          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
            📊 Resumen de tu Desempeño:
          </span>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-stone-900/90 p-2 rounded-xl border border-stone-800">
              <span className="text-[9px] text-stone-400 block font-medium">🎯 Aciertos</span>
              <span className="font-bold text-xs sm:text-sm text-emerald-400">{correctCount}/{totalQuestions}</span>
            </div>
            <div className="bg-stone-900/90 p-2 rounded-xl border border-stone-800">
              <span className="text-[9px] text-stone-400 block font-medium">🎯 Precisión</span>
              <span className="font-bold text-xs sm:text-sm text-blue-400">{accuracy}%</span>
            </div>
            <div className="bg-stone-900/90 p-2 rounded-xl border border-stone-800">
              <span className="text-[9px] text-stone-400 block font-medium">🏁 Avance</span>
              <span className="font-bold text-xs sm:text-sm text-amber-300">C.{currentPos}/75</span>
            </div>
            <div className="bg-stone-900/90 p-2 rounded-xl border border-stone-800">
              <span className="text-[9px] text-stone-400 block font-medium">⏱️ Tiempo</span>
              <span className="font-bold text-xs sm:text-sm text-yellow-300">{minutes}:{seconds}</span>
            </div>
          </div>
        </div>

        {/* ⚡ 3. TARJETA DE SOLO SCORE & CALIBRACIÓN DE RATING */}
        <div className="bg-stone-950/90 backdrop-blur-xl p-3.5 rounded-2xl border-2 border-amber-400/80 shadow-2xl space-y-2.5 text-left">
          {/* RANGO BÍBLICO */}
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/40 rounded-xl p-2 text-center shadow-inner flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{tier.icon}</span>
              <div className="text-left">
                <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider block">Categoría de Jugador</span>
                <span className="text-xs sm:text-sm font-black text-amber-100">{tier.title}</span>
              </div>
            </div>
            <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-lg">
              Nivel {tier.level}
            </span>
          </div>

          {/* SCORE TOTAL Y RATING */}
          <div className="flex items-center justify-between p-2.5 bg-black/70 rounded-xl border border-amber-500/30">
            <div>
              <span className="text-[9px] text-stone-400 block uppercase font-bold">Solo Score Total</span>
              <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                ⚡ {effectiveSoloResult.totalSoloScore} <span className="text-xs text-amber-400 font-sans">pts</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-stone-400 block uppercase font-bold">Rating ELO</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className={`px-2 py-0.5 rounded-full text-xs font-black font-mono ${
                  effectiveSoloResult.ratingDelta >= 0 ? 'bg-emerald-500 text-emerald-950' : 'bg-rose-600 text-white'
                }`}>
                  {effectiveSoloResult.ratingDelta >= 0 ? `+${effectiveSoloResult.ratingDelta}` : effectiveSoloResult.ratingDelta}
                </span>
                <span className="text-sm sm:text-base font-black text-white font-mono">
                  {effectiveSoloResult.newRating} pts
                </span>
              </div>
            </div>
          </div>

          {/* DESGLOSE EN 4 PILARES */}
          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
            <div className="bg-stone-900/90 p-1.5 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[8px]">Base</span>
              <span className="font-bold text-amber-200">+{effectiveSoloResult.baseScore}</span>
            </div>
            <div className="bg-stone-900/90 p-1.5 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[8px]">Avance</span>
              <span className="font-bold text-yellow-300">+{effectiveSoloResult.progressBonus}</span>
            </div>
            <div className="bg-stone-900/90 p-1.5 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[8px]">Velocidad</span>
              <span className="font-bold text-emerald-300">+{effectiveSoloResult.timeBonus}</span>
            </div>
            <div className="bg-stone-900/90 p-1.5 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[8px]">Precisión</span>
              <span className="font-bold text-blue-300">+{effectiveSoloResult.accuracyBonus}</span>
            </div>
          </div>
        </div>

        {/* 🏆 4. TOP 3 DE ESTA CARRERA EN EL SALÓN DE LA FAMA */}
        <div className="bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-amber-500/40 shadow-xl space-y-2 text-left">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🏆 Top 3 de {categoryLabel}:</span>
            </span>
            <span className="text-[9px] text-stone-400">Salón de la Fama</span>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
            {catEntries.slice(0, 3).map((e, idx) => (
              <div
                key={e.id || idx}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                  idx === 0
                    ? 'bg-amber-950/80 border-amber-500/80 ring-1 ring-amber-400'
                    : 'bg-stone-900/80 border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-black w-4 text-center">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}</span>
                  <img src={e.playerAvatar || '/avatars/david.jpg'} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-amber-400/40" />
                  <div>
                    <p className="font-bold text-amber-100 leading-tight">{e.playerCountryFlag || '🇩🇴'} {e.playerName}</p>
                    <p className="text-[9px] text-stone-400">🏁 Casilla {e.tilesReached || 75}/75</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-300 text-xs">⚡ {e.score} pts</p>
                  <p className="text-[9px] text-emerald-400">{e.accuracy}% prec</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📲 5. COMPARTIR RESULTADOS CON AMIGOS Y REDES SOCIALES */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-stone-900/95 to-emerald-950/90 p-3.5 rounded-2xl border-2 border-emerald-500/50 shadow-2xl space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 size={15} />
              <span>Comparte tu Victoria:</span>
            </span>
            <span className="text-[10px] text-amber-300 font-bold font-mono">
              ⚡ {effectiveSoloResult.totalSoloScore} pts
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2.5 px-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-emerald-400/40"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={handleShareFacebook}
              className="py-2.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-blue-400/40"
            >
              <Facebook size={15} />
              <span>Facebook</span>
            </button>

            {/* Copiar / Más opciones */}
            <button
              type="button"
              onClick={handleShareNative}
              className="py-2.5 px-2 bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-white font-black text-xs rounded-xl border border-amber-500/40 shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              {isCopiedResult ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span>{isCopiedResult ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTONES INFERIORES DE ACCIÓN */}
      <div className="relative z-10 w-full max-w-lg pb-3 pt-2 shrink-0">
        <div className="bg-black/90 backdrop-blur-xl p-3 rounded-3xl border-2 border-white/20 shadow-2xl flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-3 px-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-yellow-300 hover:to-amber-500 text-stone-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl transition transform active:scale-95 flex items-center justify-center gap-1.5 border-2 border-white"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Volver a Jugar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isOnline && onOpenNewRoom) {
                  onOpenNewRoom();
                } else if (onOpenLeaderboard) {
                  onOpenLeaderboard();
                } else {
                  setShowFullLeaderboard(true);
                }
              }}
              className="w-full py-3 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl transition transform active:scale-95 flex items-center justify-center gap-1.5 border-2 border-blue-300 cursor-pointer"
            >
              {isOnline ? <Users className="w-4 h-4 shrink-0" /> : <Crown className="w-4 h-4 shrink-0 text-amber-300" />}
              <span>{isOnline ? 'Abrir Sala' : 'Salón de la Fama'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="w-full py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold rounded-xl text-xs sm:text-sm transition transform active:scale-95 flex items-center justify-center gap-1.5 border border-stone-600 cursor-pointer"
          >
            <Home className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ir al Inicio (Menú Principal)</span>
          </button>
        </div>
      </div>

      {/* MODAL INTEGRADO DEL SALÓN DE LA FAMA */}
      <AnimatePresence>
        {showFullLeaderboard && (
          <div
            className="fixed inset-0 z-[20000] bg-black/90 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center animate-fade-in"
            onClick={() => setShowFullLeaderboard(false)}
          >
            <div
              className="bg-[#2A2621] border-2 border-amber-500/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-amber-100 max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-[#1B1A17] border-b border-amber-900/40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-400" />
                  <h3 className="text-base font-black text-amber-200 tracking-wide font-serif">
                    Salón de la Fama Bíblico
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullLeaderboard(false)}
                  className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FILTROS DE TIEMPO */}
              <div className="p-3 bg-stone-900/90 border-b border-stone-800 flex justify-center gap-1 overflow-x-auto custom-scrollbar">
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
                    type="button"
                    onClick={() => setLeaderboardFilter(tf.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                      leaderboardFilter === tf.id
                        ? 'bg-amber-500 text-amber-950 font-black shadow'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* LISTA */}
              <div className="p-4 overflow-y-auto space-y-2 custom-scrollbar max-h-[50vh]">
                {(() => {
                  const allEntriesList = getLeaderboard();
                  const filtered = leaderboardFilter === 'TODOS'
                    ? allEntriesList
                    : allEntriesList.filter(e => e.timeCategory === leaderboardFilter);
                  const sorted = [...filtered].sort((a, b) => (b.score || 0) - (a.score || 0));

                  if (sorted.length === 0) {
                    return (
                      <p className="text-xs text-stone-400 text-center py-6">No hay registros en esta categoría de tiempo.</p>
                    );
                  }

                  return sorted.map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                        idx === 0
                          ? 'bg-amber-950/80 border-amber-500/80 ring-1 ring-amber-400'
                          : 'bg-stone-900/80 border-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-black w-5 text-center">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}</span>
                        <img src={entry.playerAvatar || '/avatars/david.jpg'} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-amber-400/50 shadow" />
                        <div className="text-left">
                          <p className="font-bold text-amber-100 leading-tight">{entry.playerName}</p>
                          <p className="text-[9px] text-stone-400">🏁 Casilla {entry.tilesReached || 75}/75 · {entry.timeCategory || `${entry.timeSeconds}s`}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-300">⚡ {entry.score} pts</p>
                        <p className="text-[9px] text-emerald-400">{entry.accuracy}% prec</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="p-3 bg-[#1B1A17] border-t border-stone-800 text-center">
                <button
                  type="button"
                  onClick={() => setShowFullLeaderboard(false)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl text-xs uppercase tracking-widest transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

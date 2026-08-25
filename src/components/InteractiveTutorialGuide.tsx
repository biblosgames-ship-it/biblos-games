import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle, HelpCircle, X, Dices, BookOpen, Trophy, Flame } from "lucide-react";
import { TutorialMode, isTutorialCompleted, markTutorialCompleted } from "../services/tutorialService";

export interface TutorialStep {
  title: string;
  instruction: string;
  highlightText?: string;
  icon: string;
}

const TUTORIAL_CONTENT: Record<TutorialMode, { modeName: string; steps: TutorialStep[] }> = {
  TABLERO: {
    modeName: "Tu Primera Partida en el Tablero",
    steps: [
      {
        title: "1. Lanza el Dado",
        instruction: "Toca el dado digital o introduce el número de tu dado físico de mesa.",
        highlightText: "🎲 Lanza el Dado",
        icon: "🎲"
      },
      {
        title: "2. Avanza Casillas",
        instruction: "Tu peón bíblico recorrerá la historia de la Biblia desde el Principio hasta el Fin.",
        highlightText: "🏃 Avanza por el mapa",
        icon: "🗺️"
      },
      {
        title: "3. Responde y Aprende",
        instruction: "Cada casilla te hará una pregunta con su cita bíblica. ¡Acierta para ganar bonificación y puntos ELO!",
        highlightText: "📖 Preguntas de la Palabra",
        icon: "📜"
      },
      {
        title: "4. Llega a la Meta",
        instruction: "Sé el primero en llegar a la Casilla 66 (Apocalipsis) y corónate en el Salón de la Fama.",
        highlightText: "👑 ¡A conquistar la meta!",
        icon: "🏆"
      }
    ]
  },
  TRIVIA: {
    modeName: "Tu Primer Estudio en Modo Trivia",
    steps: [
      {
        title: "1. Elige tu Período o Tema",
        instruction: "Selecciona entre los 6 Períodos Bíblicos o 9 Temáticas de estudio espiritual.",
        highlightText: "📚 6 Períodos Bíblicos",
        icon: "📖"
      },
      {
        title: "2. Responde con tu Cita",
        instruction: "Lee la pregunta y selecciona una de las 4 opciones. Si fallas, verás la cita bíblica para repasar.",
        highlightText: "💡 Aprende de cada error",
        icon: "✨"
      },
      {
        title: "3. Racha y Puntos",
        instruction: "Mantén rachas de aciertos para multiplicar tu puntaje y subir de nivel espiritual.",
        highlightText: "🔥 Multiplicador de Racha",
        icon: "🔥"
      }
    ]
  },
  DAILY_CHALLENGE: {
    modeName: "Desafío Bíblico de Hoy",
    steps: [
      {
        title: "1. 10 Casillas por Día",
        instruction: "Cada medianoche (12:00 AM) se genera un recorrido de 10 preguntas temáticas.",
        highlightText: "🚩 10 Casillas automáticas",
        icon: "🌱"
      },
      {
        title: "2. Gana +1 Talento y ELO",
        instruction: "Cada acierto suma +1 Punto ELO a tu ranking y al completar las 10 ganas +1 Talento.",
        highlightText: "🪙 +1 Talento Oficial",
        icon: "⭐"
      },
      {
        title: "3. Construye tu Racha",
        instruction: "Estudia la Biblia de 3 a 30 días seguidos para desbloquear hitos y recompensas exclusivas.",
        highlightText: "🔥 Racha Consecutiva",
        icon: "📜"
      }
    ]
  },
  COPA_BIBLOS: {
    modeName: "La Copa Biblos",
    steps: [
      {
        title: "1. 3 Fases Eliminatorias",
        instruction: "Compite en Fase de Grupos, Semifinal y Gran Final en vivo contra la comunidad.",
        highlightText: "⚔️ Torneo de Campeones",
        icon: "🏆"
      },
      {
        title: "2. Corona y Trofeos",
        instruction: "Gana trofeos de Oro, Plata o Bronce y títulos legendarios para tu perfil bíblico.",
        highlightText: "👑 Salón de Leyendas",
        icon: "🥇"
      }
    ]
  }
};

interface InteractiveTutorialGuideProps {
  mode: TutorialMode;
  forceShow?: boolean;
  onClose?: () => void;
  playSound?: (type: string) => void;
  triggerHaptic?: (type: any) => void;
}

export const InteractiveTutorialGuide: React.FC<InteractiveTutorialGuideProps> = ({
  mode,
  forceShow = false,
  onClose,
  playSound,
  triggerHaptic
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      setCurrentStepIndex(0);
      return;
    }

    const completed = isTutorialCompleted(mode);
    if (!completed) {
      setIsVisible(true);
      setCurrentStepIndex(0);
    }
  }, [mode, forceShow]);

  if (!isVisible) return null;

  const content = TUTORIAL_CONTENT[mode];
  const steps = content.steps;
  const currentStep = steps[currentStepIndex];
  const isLast = currentStepIndex >= steps.length - 1;

  const handleNext = () => {
    if (playSound) playSound("select");
    if (triggerHaptic) triggerHaptic("selection");

    if (isLast) {
      markTutorialCompleted(mode);
      setIsVisible(false);
      if (onClose) onClose();
      if (playSound) playSound("correct");
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (playSound) playSound("select");
    markTutorialCompleted(mode);
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-auto animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-gradient-to-b from-[#2B1F14] via-[#1E1710] to-[#14100C] border-2 border-amber-400/90 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl text-stone-200 relative overflow-hidden ring-4 ring-amber-500/20"
      >
        {/* Destello de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Botón Cerrar / Saltar */}
        <button
          onClick={handleSkip}
          className="absolute top-3.5 right-3.5 p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-900/60 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Cabecera del Tutorial */}
        <div className="flex items-center gap-2 mb-2 text-left">
          <span className="text-2xl">{currentStep.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.2 rounded-full border border-amber-400/40">
                Aprende Jugando · Paso {currentStepIndex + 1}/{steps.length}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-serif font-black text-amber-100 leading-tight">
              {content.modeName}
            </h3>
          </div>
        </div>

        {/* Tarjeta Visual del Paso Actual */}
        <div className="p-3.5 bg-stone-900/90 rounded-2xl border border-amber-500/30 text-left space-y-2 shadow-inner my-2">
          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
            <span>{currentStep.title}</span>
          </h4>
          <p className="text-xs text-stone-300 leading-relaxed">
            {currentStep.instruction}
          </p>
          {currentStep.highlightText && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-400/30 rounded-lg text-[10px] font-mono font-bold text-amber-300">
              <span>💡 Clave:</span>
              <span>{currentStep.highlightText}</span>
            </div>
          )}
        </div>

        {/* Barra de Progreso de Pasos */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? "w-6 bg-amber-400"
                    : idx < currentStepIndex
                    ? "w-2.5 bg-emerald-500"
                    : "w-2.5 bg-stone-700"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-1 transition cursor-pointer font-medium"
            >
              Saltar
            </button>

            <button
              onClick={handleNext}
              className="py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isLast ? "¡Entendido, a Jugar!" : "Siguiente"}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

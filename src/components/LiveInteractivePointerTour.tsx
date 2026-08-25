import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle2, Sparkles, HelpCircle } from "lucide-react";
import { markTutorialCompleted, isTutorialCompleted, TutorialMode } from "../services/tutorialService";

export interface LiveTourStep {
  targetId?: string;
  title: string;
  instruction: string;
  position: "top" | "bottom" | "center";
  handEmoji?: string;
}

interface LiveInteractivePointerTourProps {
  mode: TutorialMode;
  steps: LiveTourStep[];
  isActive: boolean;
  onFinish: () => void;
  playSound?: (type: string) => void;
  triggerHaptic?: (type: any) => void;
}

export const LiveInteractivePointerTour: React.FC<LiveInteractivePointerTourProps> = ({
  mode,
  steps,
  isActive,
  onFinish,
  playSound,
  triggerHaptic,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isActive) {
      setCurrentStepIndex(0);
    }
  }, [isActive]);

  if (!isActive || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isLast = currentStepIndex >= steps.length - 1;

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playSound) playSound("select");
    if (triggerHaptic) triggerHaptic("selection");

    if (isLast) {
      markTutorialCompleted(mode);
      onFinish();
      if (playSound) playSound("correct");
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playSound) playSound("select");
    markTutorialCompleted(mode);
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[140] pointer-events-none flex flex-col justify-between p-3 sm:p-5 animate-fade-in">
      {/* CAPA DE OSCURECIMIENTO SUAVE PARA RESALTAR LA PANTALLA REAL */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* TARJETA GUÍA FLOTANTE DINÁMICA CON DEDO APUNTANDO */}
      <motion.div
        key={currentStepIndex}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative z-10 w-full max-w-sm mx-auto bg-gradient-to-b from-[#2F2113] via-[#20180F] to-[#15100B] border-2 border-amber-400 rounded-3xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] text-stone-200 pointer-events-auto space-y-2.5 ring-4 ring-amber-500/30"
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl animate-bounce">{currentStep.handEmoji || "👇"}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
              Guía en Vivo · Paso {currentStepIndex + 1}/{steps.length}
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="p-1 text-stone-400 hover:text-white rounded-full bg-stone-900/80 cursor-pointer transition"
            title="Saltar Guía"
          >
            <X size={15} />
          </button>
        </div>

        {/* Título e Instrucción Real */}
        <div className="text-left space-y-1">
          <h4 className="text-sm font-serif font-black text-amber-200 leading-tight">
            {currentStep.title}
          </h4>
          <p className="text-xs text-stone-300 leading-relaxed font-medium">
            {currentStep.instruction}
          </p>
        </div>

        {/* Barra de progreso de pasos y botón siguiente */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-800/80">
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? "w-5 bg-amber-400"
                    : idx < currentStepIndex
                    ? "w-2 bg-emerald-400"
                    : "w-2 bg-stone-700"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-[10px] text-stone-400 hover:text-stone-200 px-1.5 py-0.5 font-semibold cursor-pointer"
            >
              Saltar
            </button>
            <button
              onClick={handleNext}
              className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>{isLast ? "¡Listo!" : "Siguiente"}</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

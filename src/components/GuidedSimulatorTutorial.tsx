import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Dices, ArrowRight, CheckCircle2, Trophy, BookOpen, Flame, HelpCircle, X } from "lucide-react";
import { markTutorialCompleted } from "../services/tutorialService";
import confetti from "canvas-confetti";

interface GuidedSimulatorTutorialProps {
  isOpen: boolean;
  onFinish: () => void;
  playSound?: (type: string) => void;
  triggerHaptic?: (type: any) => void;
}

export const GuidedSimulatorTutorial: React.FC<GuidedSimulatorTutorialProps> = ({
  isOpen,
  onFinish,
  playSound,
  triggerHaptic,
}) => {
  // Pasos: 0 = Tirar Dado, 1 = Mover Peón, 2 = Responder Pregunta, 3 = Ver Victoria y Aprender
  const [step, setStep] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [playerPosition, setPlayerPosition] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  if (!isOpen) return null;

  const handleRollDice = () => {
    if (step !== 0) return;
    if (playSound) playSound("select");
    if (triggerHaptic) triggerHaptic("medium");

    setDiceValue(3);
    setStep(1);

    // Animación de mover paso a paso
    setTimeout(() => {
      setPlayerPosition(1);
      if (playSound) playSound("select");
    }, 400);
    setTimeout(() => {
      setPlayerPosition(2);
      if (playSound) playSound("select");
    }, 800);
    setTimeout(() => {
      setPlayerPosition(3);
      if (playSound) playSound("correct");
      if (triggerHaptic) triggerHaptic("success");
      setStep(2); // Abre pregunta
    }, 1200);
  };

  const handleAnswerQuestion = (optionIdx: number) => {
    if (step !== 2 || isAnswering) return;
    setSelectedOption(optionIdx);
    setIsAnswering(true);

    const isCorrect = optionIdx === 1; // "Noé"
    if (isCorrect) {
      if (playSound) playSound("correct");
      if (triggerHaptic) triggerHaptic("success");
    } else {
      if (playSound) playSound("wrong");
    }

    setTimeout(() => {
      setStep(3);
      setIsAnswering(false);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      if (playSound) playSound("win");
    }, 1200);
  };

  const handleComplete = () => {
    markTutorialCompleted("TABLERO");
    markTutorialCompleted("TRIVIA");
    if (playSound) playSound("select");
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 overflow-y-auto text-stone-200 animate-fade-in">
      {/* CABECERA CON BANNER GUÍA EN VIVO */}
      <div className="w-full max-w-md bg-[#2A1F14] border-2 border-amber-400/90 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-2 text-left">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl animate-bounce">
            {step === 0 && "🎲"}
            {step === 1 && "🏃"}
            {step === 2 && "📖"}
            {step === 3 && "🏆"}
          </span>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.2 rounded-full border border-amber-400/40">
                Simulador Guiado · Paso {step + 1} de 4
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-serif font-black text-amber-100 leading-tight mt-0.5">
              {step === 0 && "1. Toca el botón para tirar el dado"}
              {step === 1 && "2. Avanzando por la historia bíblica..."}
              {step === 2 && "3. Responde la pregunta de la casilla"}
              {step === 3 && "4. ¡Excelente! Has dominado la mecánica"}
            </h3>
          </div>
        </div>

        <button
          onClick={handleComplete}
          className="p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-900/80 cursor-pointer"
          title="Saltar"
        >
          <X size={18} />
        </button>
      </div>

      {/* ÁREA CENTRAL: SIMULADOR REAL DE TABLERO EN VIVO */}
      <div className="w-full max-w-md my-auto py-2 space-y-3">
        {/* TABLERO MINIATURA INTERACTIVO REAL */}
        <div className="bg-[#1C1813] border-2 border-amber-500/50 rounded-3xl p-4 shadow-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wide">
              Mapa de Casillas (Historia Bíblica)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              Casilla actual: <strong className="text-amber-300">{playerPosition}</strong> / 66
            </span>
          </div>

          {/* RUTA DE CASILLAS EN VIVO */}
          <div className="grid grid-cols-4 gap-2 py-2">
            {[
              { id: 0, label: "SALIDA", icon: "🚩", period: "Inicio" },
              { id: 1, label: "Génesis 1", icon: "🌱", period: "Principio" },
              { id: 2, label: "Edén", icon: "🌳", period: "Principio" },
              { id: 3, label: "El Arca", icon: "📜", period: "Principio" },
            ].map((tile) => {
              const isPlayerHere = playerPosition === tile.id;
              return (
                <div
                  key={tile.id}
                  className={`relative h-20 rounded-2xl border-2 flex flex-col items-center justify-center p-1 transition-all ${
                    isPlayerHere
                      ? "bg-amber-500/25 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105"
                      : "bg-stone-900/80 border-stone-800 text-stone-400"
                  }`}
                >
                  <span className="text-lg">{tile.icon}</span>
                  <span className="text-[9px] font-bold text-stone-200 mt-1 leading-tight text-center">
                    {tile.label}
                  </span>

                  {/* Peón Bíblico en la casilla */}
                  {isPlayerHere && (
                    <motion.div
                      layoutId="simulator-pawn"
                      className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center text-[10px] shadow-lg animate-bounce"
                    >
                      👑
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SIMULADOR DE PREGUNTA INTERACTIVA (PASO 2) */}
          <AnimatePresence>
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#2B2217] p-3.5 rounded-2xl border-2 border-amber-400 text-left space-y-2.5 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-amber-500/30 text-amber-300 font-black px-2 py-0.5 rounded-full uppercase">
                    Casilla 3: El Principio
                  </span>
                  <span className="text-[10px] font-serif text-stone-300 font-bold">
                    Génesis 6:14
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                  ¿Quién construyó el arca por mandato divino para salvar a su familia?
                </h4>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {["Moisés", "Noé", "David", "Abraham"].map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    let style = "bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-400";
                    if (isAnswering) {
                      if (idx === 1) style = "bg-emerald-600 border-emerald-300 text-white font-black animate-pulse";
                      else if (isSelected) style = "bg-rose-900 border-rose-500 text-rose-200";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswering}
                        onClick={() => handleAnswerQuestion(idx)}
                        className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-between cursor-pointer active:scale-95 ${style}`}
                      >
                        <span>{opt}</span>
                        {isAnswering && idx === 1 && <CheckCircle2 size={13} className="text-white" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MENSAJE FINAL DE APRENDIZAJE (PASO 3) */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 bg-gradient-to-b from-amber-950 via-stone-900 to-amber-950 border-2 border-amber-400 rounded-2xl text-center space-y-2 shadow-xl"
            >
              <span className="text-3xl inline-block animate-bounce">🎉🏆</span>
              <h4 className="text-sm font-serif font-black text-amber-200">
                ¡Así de fácil se juega Biblos Games!
              </h4>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Tiras el dado, avanzas casillas, respondes preguntas con citas bíblicas, sumas puntos a tu ranking y aprendes de la Palabra mientras te diviertes.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* BARRA INFERIOR DE ACCIÓN GUIADA */}
      <div className="w-full max-w-md space-y-2">
        {step === 0 && (
          <button
            onClick={handleRollDice}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
          >
            <Dices size={20} />
            <span>👉 Toca Aquí Para Tirar el Dado</span>
          </button>
        )}

        {step === 1 && (
          <div className="w-full py-3 bg-stone-900 border border-stone-800 text-stone-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2">
            <span className="animate-spin">🎲</span>
            <span>Avanzando 3 casillas...</span>
          </div>
        )}

        {step === 2 && (
          <div className="w-full py-2.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black rounded-2xl text-xs flex items-center justify-center gap-2">
            <span>👆 Elige la opción correcta arriba</span>
          </div>
        )}

        {step === 3 && (
          <button
            onClick={handleComplete}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>¡Comenzar mi Primera Partida Real!</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

import React from "react";
import { Sparkles, TrendingUp, AlertCircle, Target, ArrowRight } from "lucide-react";
import { generateSpiritualCoachInsights, CoachInsights } from "../services/spiritualCoachService";

interface BiblosCoachWidgetProps {
  userName?: string;
  onOpenStudyMode?: (theme: string) => void;
}

export const BiblosCoachWidget: React.FC<BiblosCoachWidgetProps> = ({
  userName = "Jugador Bíblico",
  onOpenStudyMode
}) => {
  const insights: CoachInsights = generateSpiritualCoachInsights(userName);

  return (
    <div className="w-full bg-gradient-to-r from-[#291F14] via-[#1D160F] to-[#291F14] p-3.5 sm:p-4 rounded-3xl border-2 border-amber-500/60 shadow-xl text-stone-200 text-left space-y-3 relative overflow-hidden group">
      {/* Destello de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Cabecera del Entrenador */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm border border-amber-400/40">
            <span>🧠</span>
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 font-serif">
              Biblos Coach · Entrenador Personal
            </span>
            <p className="text-[9px] text-stone-400">
              Análisis dinámico de tu conocimiento bíblico en tiempo real
            </p>
          </div>
        </div>

        <span className="text-[9px] bg-emerald-950 text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-500/40">
          {insights.overallAccuracy}% Precisión
        </span>
      </div>

      {/* Frase Personalizada: "Biblos te conoce" */}
      <p className="text-xs sm:text-[13px] font-medium text-stone-200 leading-snug">
        <span className="text-amber-300 font-bold">"{userName}"</span>, {insights.coachMessage.replace(userName + ", ", "")}
      </p>

      {/* 3 Tarjetas de Áreas: Fuerte, Refuerzo y Progreso */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
        {/* Área más fuerte */}
        <div className="p-2.5 bg-emerald-950/40 rounded-2xl border border-emerald-500/40 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300 uppercase">
            <span className="flex items-center gap-1">
              <span>{insights.strongestArea.icon}</span> Tu Fuerte
            </span>
            <span className="font-mono font-black">{insights.strongestArea.accuracy}%</span>
          </div>
          <p className="text-[11px] font-bold text-white truncate">
            {insights.strongestArea.name}
          </p>
          <span className="text-[9px] text-emerald-400/90 block">¡Dominio alto!</span>
        </div>

        {/* Área a reforzar */}
        <div className="p-2.5 bg-rose-950/40 rounded-2xl border border-rose-500/40 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 uppercase">
            <span className="flex items-center gap-1">
              <span>{insights.weakestArea.icon}</span> Reforzar
            </span>
            <span className="font-mono font-black">{insights.weakestArea.accuracy}%</span>
          </div>
          <p className="text-[11px] font-bold text-white truncate">
            {insights.weakestArea.name}
          </p>
          <span className="text-[9px] text-rose-300/90 block">Necesita repaso</span>
        </div>

        {/* Progreso / Mejora */}
        <div className="p-2.5 bg-amber-950/40 rounded-2xl border border-amber-500/40 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 uppercase">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} /> Progreso
            </span>
            <span className="font-mono font-black text-amber-400">
              +{insights.improvedArea ? insights.improvedArea.percentage : 18}%
            </span>
          </div>
          <p className="text-[11px] font-bold text-white truncate">
            {insights.improvedArea ? insights.improvedArea.name : "Geografía Bíblica"}
          </p>
          <span className="text-[9px] text-amber-300/90 block">Crecimiento continuo</span>
        </div>
      </div>
    </div>
  );
};

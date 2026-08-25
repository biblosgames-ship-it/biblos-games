import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  Trophy, 
  Sparkles, 
  ShieldAlert, 
  X, 
  RefreshCw, 
  DollarSign, 
  Target, 
  Activity,
  Flame
} from "lucide-react";
import { calculateLocalDeviceKPIs, getLocalAnalyticsData, GlobalKPIs } from "../services/analyticsService";
import { getLeaderboard } from "../services/leaderboardService";
import { getBlockedUsers } from "../services/friendsService";

interface AdminExecutiveDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminExecutiveDashboardModal: React.FC<AdminExecutiveDashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [kpis, setKpis] = useState<GlobalKPIs>(() => calculateLocalDeviceKPIs());
  const [activeTab, setActiveTab] = useState<"METRICAS" | "RETENCION" | "SERVIDORES">("METRICAS");
  const [leaderboardCount, setLeaderboardCount] = useState<number>(0);
  const [blockedCount, setBlockedCount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setKpis(calculateLocalDeviceKPIs());
      setLeaderboardCount(getLeaderboard().length);
      setBlockedCount(getBlockedUsers().length);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 text-stone-200 animate-fade-in">
      <div className="bg-[#1D1812] border-2 border-amber-500/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-4 ring-amber-500/20">
        
        {/* CABECERA EJECUTIVA */}
        <div className="p-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-400/40">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-sm sm:text-base text-amber-100 uppercase tracking-wider">
                  Panel Ejecutivo & Analítica de Biblos Games
                </h3>
                <span className="text-[9px] bg-rose-500/30 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded-full font-black uppercase">
                  Solo Creador / Admin
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Monitoreo en tiempo real de DAU, Retención (D1, D7, D30), Partidas, ELO y Conversión
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full bg-stone-900/80 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* PESTAÑAS DEL DASHBOARD */}
        <div className="grid grid-cols-3 bg-stone-950/80 border-b border-stone-800 p-1.5 gap-1 text-xs font-black uppercase tracking-wider">
          <button
            onClick={() => setActiveTab("METRICAS")}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "METRICAS"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Activity size={14} />
            <span>Tráfico & Rendimiento</span>
          </button>

          <button
            onClick={() => setActiveTab("RETENCION")}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "RETENCION"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <TrendingUp size={14} />
            <span>Retención (D1 · D7 · D30)</span>
          </button>

          <button
            onClick={() => setActiveTab("SERVIDORES")}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "SERVIDORES"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Salud & Moderación</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
          {activeTab === "METRICAS" && (
            <div className="space-y-4">
              {/* FILA 1: USUARIOS ACTIVOS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-[#262018] rounded-2xl border border-amber-500/30 text-left space-y-1 shadow">
                  <div className="flex justify-between items-center text-amber-300">
                    <span className="text-[10px] font-black uppercase tracking-wider">DAU (Usuarios Diarios)</span>
                    <Users size={16} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-black text-white">{kpis.dau} <span className="text-xs text-stone-400 font-normal">activos</span></p>
                  <p className="text-[10px] text-stone-400">Jugadores que entraron en las últimas 24h</p>
                </div>

                <div className="p-4 bg-[#262018] rounded-2xl border border-amber-500/30 text-left space-y-1 shadow">
                  <div className="flex justify-between items-center text-amber-300">
                    <span className="text-[10px] font-black uppercase tracking-wider">WAU (Usuarios Semanales)</span>
                    <Users size={16} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-black text-white">{kpis.wau} <span className="text-xs text-stone-400 font-normal">semanales</span></p>
                  <p className="text-[10px] text-stone-400">Activos en los últimos 7 días</p>
                </div>

                <div className="p-4 bg-[#262018] rounded-2xl border border-amber-500/30 text-left space-y-1 shadow">
                  <div className="flex justify-between items-center text-amber-300">
                    <span className="text-[10px] font-black uppercase tracking-wider">MAU (Usuarios Mensuales)</span>
                    <Users size={16} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-mono font-black text-white">{kpis.mau} <span className="text-xs text-stone-400 font-normal">mensuales</span></p>
                  <p className="text-[10px] text-stone-400">Activos en el mes corriente</p>
                </div>
              </div>

              {/* FILA 2: ENGAGEMENT Y JUEGO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-900 rounded-2xl border border-stone-800 text-left space-y-1">
                  <span className="text-[9px] font-bold uppercase text-stone-400 block">Partidas / Jugador</span>
                  <p className="text-xl font-mono font-black text-amber-300">{kpis.matchesPerUser}</p>
                  <p className="text-[9px] text-stone-500">Promedio por usuario</p>
                </div>

                <div className="p-3 bg-stone-900 rounded-2xl border border-stone-800 text-left space-y-1">
                  <span className="text-[9px] font-bold uppercase text-stone-400 block">Duración Promedio</span>
                  <p className="text-xl font-mono font-black text-amber-300">{kpis.avgDurationMinutes} min</p>
                  <p className="text-[9px] text-stone-500">Tiempo por sesión</p>
                </div>

                <div className="p-3 bg-stone-900 rounded-2xl border border-stone-800 text-left space-y-1">
                  <span className="text-[9px] font-bold uppercase text-stone-400 block">Preguntas / Sesión</span>
                  <p className="text-xl font-mono font-black text-amber-300">{kpis.questionsPerSession}</p>
                  <p className="text-[9px] text-stone-500">Respuestas por jugador</p>
                </div>

                <div className="p-3 bg-stone-900 rounded-2xl border border-stone-800 text-left space-y-1">
                  <span className="text-[9px] font-bold uppercase text-stone-400 block">Precisión Global</span>
                  <p className="text-xl font-mono font-black text-emerald-400">{kpis.accuracyRate}%</p>
                  <p className="text-[9px] text-stone-500">Respuestas acertadas</p>
                </div>
              </div>

              {/* FILA 3: MONETIZACIÓN Y CONVERSIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-gradient-to-br from-amber-950/60 to-stone-900 rounded-2xl border border-amber-500/40 text-left space-y-1">
                  <div className="flex justify-between items-center text-amber-300">
                    <span className="text-[10px] font-bold uppercase">Conversión Free → Premium</span>
                    <DollarSign size={16} />
                  </div>
                  <p className="text-2xl font-mono font-black text-amber-200">{kpis.freeToPremiumConversionRate}%</p>
                  <p className="text-[10px] text-stone-400">Jugadores que desbloquearon versión Full</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-950/60 to-stone-900 rounded-2xl border border-purple-500/40 text-left space-y-1">
                  <div className="flex justify-between items-center text-purple-300">
                    <span className="text-[10px] font-bold uppercase">Participación en Copa</span>
                    <Trophy size={16} />
                  </div>
                  <p className="text-2xl font-mono font-black text-purple-200">{kpis.copaParticipationRate}%</p>
                  <p className="text-[10px] text-stone-400">Usuarios que compitieron en la Copa</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-rose-950/60 to-stone-900 rounded-2xl border border-rose-500/40 text-left space-y-1">
                  <div className="flex justify-between items-center text-rose-300">
                    <span className="text-[10px] font-bold uppercase">Tasa de Abandono (Leavers)</span>
                    <ShieldAlert size={16} />
                  </div>
                  <p className="text-2xl font-mono font-black text-rose-300">{kpis.abandonRate}%</p>
                  <p className="text-[10px] text-stone-400">Partidas abandonadas voluntariamente</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "RETENCION" && (
            <div className="space-y-4 text-left">
              <div className="bg-[#241F18] p-4 rounded-2xl border border-amber-500/40 space-y-3">
                <h4 className="font-serif font-black text-sm text-amber-200 uppercase tracking-wide">
                  Curva de Retención de Jugadores
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Mide el porcentaje de personas que regresan a estudiar la Biblia en Biblos Games tras su primer día:
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800 text-center space-y-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase">D1 (Día 1)</span>
                    <p className="text-3xl font-mono font-black text-emerald-400">{kpis.retentionD1}%</p>
                    <p className="text-[9px] text-stone-400">Regresan al día siguiente</p>
                  </div>

                  <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800 text-center space-y-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase">D7 (Día 7)</span>
                    <p className="text-3xl font-mono font-black text-amber-300">{kpis.retentionD7}%</p>
                    <p className="text-[9px] text-stone-400">Activos a la semana</p>
                  </div>

                  <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800 text-center space-y-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase">D30 (Día 30)</span>
                    <p className="text-3xl font-mono font-black text-purple-300">{kpis.retentionD30}%</p>
                    <p className="text-[9px] text-stone-400">Hábito consolidado al mes</p>
                  </div>
                </div>
              </div>

              <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <Flame size={18} />
                  <h5 className="font-bold text-xs uppercase">Factores Clave de Retención Activos en Biblos:</h5>
                </div>
                <ul className="text-xs text-stone-300 space-y-1.5 list-disc pl-5 leading-relaxed">
                  <li><strong>Desafío Bíblico de Hoy:</strong> Notificaciones a las 12:00 AM que reactivan al usuario diariamente.</li>
                  <li><strong>Rachas Educativas (3, 7, 14 y 30 días):</strong> Premian la perseverancia con Talentos y puntos ELO.</li>
                  <li><strong>Copa Biblos Semanal:</strong> Evento de alta concurrencia los fines de semana.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "SERVIDORES" && (
            <div className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Total en Ranking / Base de Datos</span>
                  <p className="text-2xl font-mono font-black text-amber-300">{leaderboardCount} perfiles</p>
                  <p className="text-[9px] text-stone-500">Registrados en el Leaderboard</p>
                </div>

                <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Usuarios Bloqueados / Moderados</span>
                  <p className="text-2xl font-mono font-black text-rose-400">{blockedCount} cuentas</p>
                  <p className="text-[9px] text-stone-500">Por reportes o abandono reiterado</p>
                </div>
              </div>

              <div className="p-4 bg-[#231E17] rounded-2xl border border-amber-500/30 text-xs text-stone-300 space-y-2">
                <p className="font-bold text-amber-300">🔗 Opciones de Sincronización para Escalar a Nivel Global:</p>
                <p className="text-stone-400 leading-relaxed">
                  Este panel calcula la analítica y telemetría de tu motor local. Cuando conectes tu backend en <strong>Supabase</strong> o <strong>Firebase Analytics</strong>, este mismo panel mostrará las cifras agregadas de los miles de jugadores de todo el mundo en vivo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-3 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[10px] text-stone-500 font-mono">
            Acceso Secreto: Gesto de 5 toques en Logo / PIN 1234
          </span>

          <button
            onClick={onClose}
            className="py-2 px-5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};

import { getUserProfile, getNextRankTierInfo } from "./userProfile";
import { getDailyChallenge } from "./dailyChallengeService";
import { generateSpiritualCoachInsights } from "./spiritualCoachService";

export interface NotificationSettings {
  enabled: boolean;
  dailyChallengeReminder: boolean;
  copaBiblosReminder: boolean;
  levelProgressReminder: boolean;
  rankingReminder: boolean;
  lastDailyChallengeNotified?: string; // YYYY-MM-DD
  lastLevelXpNotified?: number; // tier level
  lastRankingCheckScore?: number;
  lastCopaBiblosNotified?: string;
}

const NOTIFICATIONS_STORAGE_KEY = "biblos_notification_settings_v1";

export function getNotificationSettings(): NotificationSettings {
  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Error leyendo notification settings:", e);
    }
  }
  return {
    enabled: false,
    dailyChallengeReminder: true,
    copaBiblosReminder: true,
    levelProgressReminder: true,
    rankingReminder: true,
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Solicita permiso de notificaciones al navegador o sistema operativo
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Las notificaciones no son soportadas en este navegador.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const isGranted = permission === "granted";
    const current = getNotificationSettings();
    saveNotificationSettings({
      ...current,
      enabled: isGranted,
    });
    return isGranted;
  } catch (e) {
    console.error("Error al solicitar permisos de notificación:", e);
    return false;
  }
}

export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Envía una notificación del sistema si las notificaciones están activadas y permitidas
 */
export function sendSmartNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
  }
): boolean {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  const settings = getNotificationSettings();
  if (!settings.enabled) return false;

  try {
    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: options.tag,
      data: options.data,
    });

    notification.onclick = function () {
      window.focus();
      this.close();
    };

    return true;
  } catch (e) {
    console.warn("Fallo al emitir notificación:", e);
    return false;
  }
}

/**
 * Revisa el estado de la aplicación de forma inteligente para emitir notificaciones relevantes sin ser invasivo.
 */
export function checkAndTriggerSmartNotifications(): void {
  const settings = getNotificationSettings();
  if (!settings.enabled || Notification.permission !== "granted") return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // 1. “Tu desafío diario está disponible.”
  if (settings.dailyChallengeReminder && settings.lastDailyChallengeNotified !== todayStr) {
    const dailyData = getDailyChallenge();
    if (!dailyData.completed) {
      const sent = sendSmartNotification("📖 Tu Desafío Bíblico de Hoy está disponible", {
        body: `${dailyData.icon} "${dailyData.title}" te espera para ejercitar tu espíritu y ganar +1 Talento.`,
        tag: "daily-challenge-reminder",
      });
      if (sent) {
        settings.lastDailyChallengeNotified = todayStr;
        saveNotificationSettings(settings);
      }
    }
  }

  // 2. “Estás a 50 XP (puntos) del próximo nivel.”
  if (settings.levelProgressReminder) {
    const profile = getUserProfile();
    const nextTierInfo = getNextRankTierInfo(profile.rating || 1000);
    if (nextTierInfo.nextTier && nextTierInfo.pointsNeeded <= 60 && nextTierInfo.pointsNeeded > 0) {
      if (settings.lastLevelXpNotified !== nextTierInfo.nextTier.level) {
        const sent = sendSmartNotification("⭐ ¡Estás muy cerca de subir de nivel bíblico!", {
          body: `Estás a solo ${nextTierInfo.pointsNeeded} puntos de alcanzar "${nextTierInfo.nextTier.title}". ¡Juega una partida para ascender!`,
          tag: "level-progress-reminder",
        });
        if (sent) {
          settings.lastLevelXpNotified = nextTierInfo.nextTier.level;
          saveNotificationSettings(settings);
        }
      }
    }
  }

  // 3. “La Copa Biblos comienza en 2 horas.” (Sábados/Domingos o Torneos programados)
  if (settings.copaBiblosReminder) {
    const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = now.getHours();
    // Recordatorio de Copa de Fin de Semana
    if ((dayOfWeek === 6 || dayOfWeek === 0) && hour >= 16 && hour <= 19 && settings.lastCopaBiblosNotified !== todayStr) {
      const sent = sendSmartNotification("🏆 Torneo Copa Biblos", {
        body: "La Copa Biblos está lista para comenzar. ¡Inscríbete y compite por la corona!",
        tag: "copa-biblos-reminder",
      });
      if (sent) {
        settings.lastCopaBiblosNotified = todayStr;
        saveNotificationSettings(settings);
      }
    }
  }

  // 4. “Biblos Coach: Tu Entrenador Bíblico Personal” ("Biblos te conoce")
  try {
    const coachStats = localStorage.getItem("biblos_coach_notif_date");
    if (coachStats !== todayStr) {
      const profile = getUserProfile();
      const coach = generateSpiritualCoachInsights(profile.name || "Discípulo");
      if (coach && coach.smartNotificationText) {
        const sent = sendSmartNotification("🧠 Biblos Coach · Tu Progreso Bíblico", {
          body: coach.smartNotificationText,
          tag: "biblos-coach-insight",
        });
        if (sent) {
          localStorage.setItem("biblos_coach_notif_date", todayStr);
        }
      }
    }
  } catch (e) {}
}

/**
 * Notificación inteligente cuando un usuario es superado o retado en el ranking
 */
export function notifyRankingOvertaken(newRank: number, competitorName: string): void {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.rankingReminder) return;

  sendSmartNotification("⚔️ Novedad en el Ranking Bíblico", {
    body: `${competitorName} ha sumado puntos y ahora estás en la posición #${newRank}. ¡Entra al tablero a recuperar tu trono!`,
    tag: "ranking-overtaken",
  });
}

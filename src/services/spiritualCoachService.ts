export interface CategoryStats {
  answered: number;
  correct: number;
  accuracy: number;
  recentImprovement: number; // Porcentaje de mejora reciente
}

export interface CoachInsights {
  strongestArea: { name: string; accuracy: number; icon: string };
  weakestArea: { name: string; accuracy: number; icon: string; advice: string };
  improvedArea?: { name: string; percentage: number; icon: string };
  overallAccuracy: number;
  totalAnswered: number;
  coachHeadline: string;
  coachMessage: string;
  smartNotificationText: string;
}

const CATEGORY_STATS_STORAGE_KEY = "biblos_category_mastery_v1";

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; advice: string }> = {
  PERSONAJES: {
    label: "Personajes Bíblicos",
    icon: "👥",
    advice: "Repasa los patriarcas, reyes y apóstoles para consolidar tu conocimiento de quién es quién."
  },
  PROFETAS: {
    label: "Reyes y Profetas",
    icon: "📜",
    advice: "Dedica unos minutos a estudiar los mensajes de Elías, Isaías y Daniel."
  },
  VERSICULOS: {
    label: "Versículos y Citas",
    icon: "📖",
    advice: "Memorizar textos claves te ayudará a responder más rápido."
  },
  HISTORIA: {
    label: "Historia Bíblica",
    icon: "🏛️",
    advice: "Sigue la línea de tiempo desde el Éxodo hasta la Iglesia Primitiva."
  },
  GEOGRAFIA: {
    label: "Geografía Bíblica",
    icon: "🗺️",
    advice: "Ubica los montes, ríos (Jordán, Nilo) y ciudades bíblicas."
  },
  SALVACION: {
    label: "Plan de Salvación",
    icon: "✝️",
    advice: "Profundiza en la gracia, la fe y los evangelios."
  },
  MANDAMIENTOS: {
    label: "Mandamientos y Ley",
    icon: "⚖️",
    advice: "Estudia los preceptos dados a Moisés en el Sinaí."
  },
  DIOS: {
    label: "Atributos de Dios",
    icon: "👑",
    advice: "Conoce más sobre Su omnipotencia, santidad y amor eterno."
  },
  PRINCIPIANTE: {
    label: "Preguntas Fundamentales (Principiante)",
    icon: "🌱",
    advice: "Fundamentos sencillos de las historias más conocidas."
  },
  GENERAL: {
    label: "Cultura General Bíblica",
    icon: "✨",
    advice: "Continúa explorando ambos testamentos."
  }
};

export function getCategoryMasteryStats(): Record<string, CategoryStats> {
  try {
    const raw = localStorage.getItem(CATEGORY_STATS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Datos iniciales realistas si es nuevo jugador
  return {
    PERSONAJES: { answered: 14, correct: 12, accuracy: 86, recentImprovement: 12 },
    PROFETAS: { answered: 10, correct: 5, accuracy: 50, recentImprovement: 0 },
    GEOGRAFIA: { answered: 11, correct: 9, accuracy: 82, recentImprovement: 18 },
    VERSICULOS: { answered: 15, correct: 11, accuracy: 73, recentImprovement: 5 },
    HISTORIA: { answered: 8, correct: 6, accuracy: 75, recentImprovement: 8 }
  };
}

export function saveCategoryMasteryStats(stats: Record<string, CategoryStats>): void {
  try {
    localStorage.setItem(CATEGORY_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {}
}

export function recordQuestionMastery(categoryOrPeriod: string, isCorrect: boolean): void {
  const stats = getCategoryMasteryStats();
  const normalizedKey = normalizeCategoryKey(categoryOrPeriod);

  const prev = stats[normalizedKey] || { answered: 0, correct: 0, accuracy: 0, recentImprovement: 0 };
  const answered = prev.answered + 1;
  const correct = prev.correct + (isCorrect ? 1 : 0);
  const newAccuracy = Math.round((correct / answered) * 100);
  const recentImprovement = isCorrect ? Math.min(35, prev.recentImprovement + 4) : Math.max(0, prev.recentImprovement - 2);

  stats[normalizedKey] = {
    answered,
    correct,
    accuracy: newAccuracy,
    recentImprovement
  };

  saveCategoryMasteryStats(stats);
}

function normalizeCategoryKey(input: string): string {
  const upper = String(input || "").toUpperCase();
  if (upper.includes("PERSONAJE")) return "PERSONAJES";
  if (upper.includes("PROFETA") || upper.includes("REY")) return "PROFETAS";
  if (upper.includes("VERSICULO") || upper.includes("CITA")) return "VERSICULOS";
  if (upper.includes("HISTORIA") || upper.includes("TIEMPO")) return "HISTORIA";
  if (upper.includes("GEOGRAFIA") || upper.includes("LUGAR") || upper.includes("CIUDAD")) return "GEOGRAFIA";
  if (upper.includes("SALVACION") || upper.includes("CRUZ") || upper.includes("GRACIA")) return "SALVACION";
  if (upper.includes("MANDAMIENTO") || upper.includes("LEY")) return "MANDAMIENTOS";
  if (upper.includes("DIOS")) return "DIOS";
  if (upper.includes("KID") || upper.includes("BASICO") || upper.includes("PRINCIPIANTE")) return "PRINCIPIANTE";
  return "GENERAL";
}

export function generateSpiritualCoachInsights(playerName: string = "Discípulo"): CoachInsights {
  const stats = getCategoryMasteryStats();
  const entries = Object.entries(stats);

  if (entries.length === 0) {
    return {
      strongestArea: { name: "Personajes Bíblicos", accuracy: 85, icon: "👥" },
      weakestArea: { name: "Reyes y Profetas", accuracy: 50, icon: "📜", advice: "Dedica unos minutos a estudiar los mensajes de los profetas." },
      improvedArea: { name: "Geografía Bíblica", percentage: 18, icon: "🗺️" },
      overallAccuracy: 78,
      totalAnswered: 45,
      coachHeadline: "¡Biblos te conoce y guía tu crecimiento espiritual!",
      coachMessage: `${playerName}, tu área más fuerte es Personajes Bíblicos (85% de aciertos), pero necesitas reforzar Reyes y Profetas.`,
      smartNotificationText: `📖 ${playerName}, has mejorado un 18% en Geografía Bíblica. ¡Hoy es un buen día para reforzar Profetas!`
    };
  }

  // Ordenar por precisión
  const sorted = entries.sort((a, b) => b[1].accuracy - a[1].accuracy);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Buscar mayor mejora reciente
  const mostImproved = [...entries].sort((a, b) => b[1].recentImprovement - a[1].recentImprovement)[0];

  const bestCfg = CATEGORY_CONFIG[best[0]] || { label: best[0], icon: "⭐", advice: "" };
  const worstCfg = CATEGORY_CONFIG[worst[0]] || { label: worst[0], icon: "💡", advice: "Practica esta área para equilibrar tu conocimiento." };
  const impCfg = mostImproved ? CATEGORY_CONFIG[mostImproved[0]] : null;

  let totalAns = 0;
  let totalCorr = 0;
  entries.forEach(([_, val]) => {
    totalAns += val.answered;
    totalCorr += val.correct;
  });
  const overallAcc = totalAns > 0 ? Math.round((totalCorr / totalAns) * 100) : 75;

  const coachMessage = `${playerName}, tu área más fuerte es ${bestCfg.label} (${best[1].accuracy}% de aciertos). Para tu próximo nivel necesitas reforzar ${worstCfg.label}.`;
  const notificationMsg = mostImproved && mostImproved[1].recentImprovement > 0
    ? `✨ Has mejorado un ${mostImproved[1].recentImprovement}% en ${impCfg?.label || "la Palabra"}. Tu área a reforzar: ${worstCfg.label}.`
    : `📖 Tu área más fuerte es ${bestCfg.label}. ¡Entra hoy y refuerza ${worstCfg.label}!`;

  return {
    strongestArea: { name: bestCfg.label, accuracy: best[1].accuracy, icon: bestCfg.icon },
    weakestArea: { name: worstCfg.label, accuracy: worst[1].accuracy, icon: worstCfg.icon, advice: worstCfg.advice },
    improvedArea: mostImproved && mostImproved[1].recentImprovement > 0 
      ? { name: impCfg?.label || mostImproved[0], percentage: mostImproved[1].recentImprovement, icon: impCfg?.icon || "📈" } 
      : undefined,
    overallAccuracy: overallAcc,
    totalAnswered: totalAns,
    coachHeadline: "Biblos Coach: Tu Entrenador Bíblico Personal",
    coachMessage,
    smartNotificationText: notificationMsg
  };
}

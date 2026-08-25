export interface WeeklyEventStage {
  stageNumber: number;
  title: string;
  theme: string;
  difficulty: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | 'MIXTO';
  questionsCount: number;
  pointsMultiplier: number;
}

export interface CustomTournamentQuestion {
  id?: string;
  mode?: string | string[];
  period?: string;
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';
  question: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2 o 3 (índice de la respuesta correcta)
  correct?: number; // compatibilidad
  reference: string;
  explanation?: string;
}

export interface WeeklyEvent {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  description: string;
  dayOfWeekName: string;
  scheduledTime: string;
  nextEventDate: string;
  bannerGradient: string;
  icon: string;
  rewards: string;
  stages: WeeklyEventStage[];
  customQuestions?: CustomTournamentQuestion[];
}

const STORAGE_EVENTS_KEY = 'biblos_copa_semanal_config_v4';

export function getNextSundayDateISO(): string {
  const now = new Date();
  const targetUtcHour = 19; // 7:00 PM UTC (15:00 en RD UTC-4)
  
  // Encontrar el próximo domingo (0 = Domingo)
  const currentDay = now.getUTCDay();
  let daysUntilSunday = (7 - currentDay) % 7;
  
  // Si hoy es domingo pero ya pasó la hora (19:00 UTC), programar para el siguiente domingo
  if (currentDay === 0 && now.getUTCHours() >= targetUtcHour) {
    daysUntilSunday = 7;
  }
  
  const nextSunday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
    targetUtcHour,
    0,
    0,
    0
  ));

  return nextSunday.toISOString();
}

export const DEFAULT_WEEKLY_EVENT: WeeklyEvent = {
  id: 'copa_biblos_oficial_2026',
  title: '🏆 LA COPA BIBLOS',
  subtitle: '“Cada domingo, el mundo se conecta para jugar la Biblia.”',
  theme: 'GRAN TORNEO MUNDIAL BÍBLICO',
  description: 'El evento semanal cumbre de Biblos Games. Miles de jugadores, familias, jóvenes e iglesias de todo el mundo compiten en simultáneo por la gloria del saber bíblico.',
  dayOfWeekName: 'Todos los Domingos',
  scheduledTime: '7:00 PM UTC · 3:00 PM República Dominicana (UTC-4)',
  nextEventDate: getNextSundayDateISO(),
  bannerGradient: 'from-amber-600 via-amber-500 to-yellow-600',
  icon: '🏆',
  rewards: '🥇 Trofeo Copa Biblos + Corona de Oro + 500 Pts ELO + 50 Talentos 🪙',
  stages: [
    { stageNumber: 1, title: 'Fase 1: Los Patriarcas y el Éxodo', theme: 'PERIODOS', difficulty: 'PRINCIPIANTE', questionsCount: 5, pointsMultiplier: 1 },
    { stageNumber: 2, title: 'Fase 2: Reyes, Profetas y Salmos', theme: 'PERSONAJES', difficulty: 'INTERMEDIO', questionsCount: 5, pointsMultiplier: 1.5 },
    { stageNumber: 3, title: 'Fase 3: Vida de Jesús y Profecías', theme: 'VERSICULOS', difficulty: 'AVANZADO', questionsCount: 5, pointsMultiplier: 2 }
  ],
  customQuestions: [
    {
      id: "copa_001",
      mode: "PERSONAJES",
      period: "El Principio",
      difficulty: "BASIC",
      question: "¿Quién fue vendido por sus hermanos a los madianitas por veinte piezas de plata?",
      options: ["Benjamín", "José", "Rubén", "Judá"],
      correctAnswer: 1,
      reference: "Génesis 37:28"
    },
    {
      id: "copa_002",
      mode: "HISTORIA",
      period: "El Pueblo de Dios y la Ley",
      difficulty: "BASIC",
      question: "¿Quién guio al pueblo de Israel a través del Mar Rojo en seco?",
      options: ["Josué", "Moisés", "Aarón", "Gedeón"],
      correctAnswer: 1,
      reference: "Éxodo 14:21-22"
    },
    {
      id: "copa_003",
      mode: ["HISTORIA", "GEOGRAFIA"],
      period: "El Principio",
      difficulty: "INTERMEDIATE",
      question: "¿Sobre qué montes reposó el arca de Noé tras el diluvio?",
      options: ["Monte Sinaí", "Monte Carmelo", "Montes de Ararat", "Monte Horeb"],
      correctAnswer: 2,
      reference: "Génesis 8:4"
    },
    {
      id: "copa_004",
      mode: "PERSONAJES",
      period: "Reyes, Profetas y Poetas",
      difficulty: "INTERMEDIATE",
      question: "¿Qué profeta vio la gloria de Dios en visión junto al río Quebar?",
      options: ["Isaías", "Jeremías", "Ezequiel", "Daniel"],
      correctAnswer: 2,
      reference: "Ezequiel 1:1-3"
    },
    {
      id: "copa_005",
      mode: "PERSONAJES",
      period: "El Principio",
      difficulty: "ADVANCED",
      question: "¿Qué significa el nombre 'Caín' según las palabras de Eva?",
      options: ["Dolor", "Adquirido", "Fortaleza", "Vida"],
      correctAnswer: 1,
      reference: "Génesis 4:1"
    },
    {
      id: "copa_006",
      mode: ["HISTORIA", "GEOGRAFIA"],
      period: "Tiempos Finales",
      difficulty: "ADVANCED",
      question: "¿Cuál es el nombre de la isla a la que fue desterrado el apóstol Juan cuando recibió el Apocalipsis?",
      options: ["Creta", "Chipre", "Patmos", "Malta"],
      correctAnswer: 2,
      reference: "Apocalipsis 1:9"
    }
  ]
};

export function getWeeklyEventConfig(): WeeklyEvent {
  try {
    const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
    if (!raw) {
      const fresh = { ...DEFAULT_WEEKLY_EVENT, nextEventDate: getNextSundayDateISO() };
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw);
    const targetTime = parsed.nextEventDate ? new Date(parsed.nextEventDate).getTime() : 0;
    // Si la fecha objetivo ya pasó (más allá de los 10 minutos de Check-In), recalcular para el próximo domingo
    if (!targetTime || targetTime < Date.now() - 1000 * 60 * 10) {
      parsed.nextEventDate = getNextSundayDateISO();
      parsed.title = '🏆 LA COPA BIBLOS';
      parsed.subtitle = '“Cada domingo, el mundo se conecta para jugar la Biblia.”';
      parsed.scheduledTime = '7:00 PM UTC · 3:00 PM República Dominicana (UTC-4)';
      parsed.dayOfWeekName = 'Todos los Domingos';
      saveWeeklyEventConfig(parsed);
    }
    return parsed;
  } catch {
    return { ...DEFAULT_WEEKLY_EVENT, nextEventDate: getNextSundayDateISO() };
  }
}

const STORAGE_COPA_HISTORICAL_QUESTIONS_KEY = 'biblos_copa_historical_questions_v1';

/**
 * Obtiene todas las preguntas históricas acumuladas de todas las ediciones de La Copa Biblos
 */
export function getCopaHistoricalQuestions(): CustomTournamentQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_COPA_HISTORICAL_QUESTIONS_KEY);
    if (!raw) return DEFAULT_WEEKLY_EVENT.customQuestions || [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error al leer historial de preguntas de la Copa:', err);
    return DEFAULT_WEEKLY_EVENT.customQuestions || [];
  }
}

/**
 * Agrega preguntas de una Copa al histórico acumulado
 */
export function appendCopaHistoricalQuestions(questions: CustomTournamentQuestion[]): void {
  try {
    const current = getCopaHistoricalQuestions();
    const map = new Map<string, CustomTournamentQuestion>();

    // Indexar por texto de pregunta para no duplicar
    current.forEach(q => {
      const key = q.question.trim().toLowerCase();
      map.set(key, q);
    });

    questions.forEach((q, idx) => {
      const key = q.question.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          ...q,
          id: q.id || `copa_hist_${Date.now()}_${idx}`
        });
      }
    });

    const combined = Array.from(map.values());
    localStorage.setItem(STORAGE_COPA_HISTORICAL_QUESTIONS_KEY, JSON.stringify(combined));
  } catch (err) {
    console.error('Error al guardar preguntas en historial de Copa:', err);
  }
}

export function saveWeeklyEventConfig(event: WeeklyEvent): void {
  try {
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(event));
    if (event.customQuestions && event.customQuestions.length > 0) {
      appendCopaHistoricalQuestions(event.customQuestions);
    }
  } catch (err) {
    console.error('Error guardando configuración de evento:', err);
  }
}

export function loadRemoteEventQuestions(jsonString: string): Array<{ question: string; options: string[]; correct: number; reference: string; explanation?: string }> | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question && Array.isArray(parsed[0].options)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export interface CopaBiblosChampion {
  id: string;
  edition: string; // ej: "Edición I · Pentecostés"
  editionDate: string;
  championName: string;
  championAvatar: string;
  championCountry: string;
  championCountryFlag: string;
  championRating: number;
  finalScore: number;
  accuracy: number;
  secondPlaceName: string;
  secondPlaceAvatar: string;
  secondPlaceCountryFlag: string;
  thirdPlaceName: string;
  thirdPlaceAvatar: string;
  thirdPlaceCountryFlag: string;
  totalParticipants: number;
}

const STORAGE_COPA_CHAMPIONS_KEY = 'biblos_copa_champions_hall_of_fame_v1';

export const DEMO_COPA_CHAMPIONS: CopaBiblosChampion[] = [
  {
    id: 'copa_champ_1',
    edition: 'Edición Inaugural · Gloria en el Sinaí',
    editionDate: 'Domingo Anterior',
    championName: 'Rey Salomón',
    championAvatar: '/avatars/salomon.jpg',
    championCountry: 'DO',
    championCountryFlag: '🇩🇴',
    championRating: 3150,
    finalScore: 5420,
    accuracy: 98,
    secondPlaceName: 'Profeta Daniel',
    secondPlaceAvatar: '/avatars/daniel.jpg',
    secondPlaceCountryFlag: '🇲🇽',
    thirdPlaceName: 'Reina Ester',
    thirdPlaceAvatar: '/avatars/esther.jpg',
    thirdPlaceCountryFlag: '🇨🇴',
    totalParticipants: 48
  }
];

export function getCopaBiblosChampions(): CopaBiblosChampion[] {
  try {
    const raw = localStorage.getItem(STORAGE_COPA_CHAMPIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error al leer campeones de Copa Biblos:', err);
  }
  return DEMO_COPA_CHAMPIONS;
}

export function saveCopaBiblosChampion(championRecord: CopaBiblosChampion): void {
  try {
    const current = getCopaBiblosChampions();
    const updated = [championRecord, ...current.filter(c => c.id !== championRecord.id)];
    localStorage.setItem(STORAGE_COPA_CHAMPIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error al guardar campeón de Copa Biblos:', err);
  }
}

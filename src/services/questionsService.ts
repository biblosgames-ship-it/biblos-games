import { Question, Period } from '../types';
import rawQuestionsData from '../data/questions.json';

const CUSTOM_QUESTIONS_STORAGE_KEY = 'biblos_custom_questions_db_v1';

export const BASE_QUESTIONS_COUNT = (rawQuestionsData as Question[]).length;

/**
 * Obtiene las preguntas base incluidas en el paquete del juego (664 preguntas)
 */
export function getBaseQuestions(): Question[] {
  return rawQuestionsData as Question[];
}

/**
 * Obtiene las preguntas adicionales agregadas por el administrador
 */
export function getCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(CUSTOM_QUESTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error al leer preguntas personalizadas:', err);
    return [];
  }
}

/**
 * Obtiene todas las preguntas combinadas (Base + Personalizadas), sin duplicados
 */
export function getAllGameQuestions(): Question[] {
  const custom = getCustomQuestions();
  if (custom.length === 0) {
    return getBaseQuestions();
  }

  // Las personalizadas van primero para que tengan prioridad
  const customIds = new Set(custom.map(q => q.id));
  const baseFiltered = getBaseQuestions().filter(q => !customIds.has(q.id));
  return [...custom, ...baseFiltered];
}

export const FREE_QUESTIONS_RATIO = 0.60; // 60% para modo Free, 100% para modo Premium

/**
 * Obtiene el banco de preguntas adaptado según el estado del usuario (Free vs Premium/VIP)
 * - Modo Free: 60% del catálogo total disponible de forma equilibrada entre periodos y dificultades.
 * - Modo Premium: 100% de las preguntas desbloqueadas (1,000+ preguntas completas sin límite).
 */
export function getQuestionsForUser(isPremium: boolean = false): {
  questions: Question[];
  totalCount: number;
  freeCount: number;
  premiumCount: number;
  isFullAccess: boolean;
} {
  const all = getAllGameQuestions();
  const total = all.length;
  const targetFreeCount = Math.max(1, Math.round(total * FREE_QUESTIONS_RATIO));

  if (isPremium) {
    return {
      questions: all,
      totalCount: total,
      freeCount: targetFreeCount,
      premiumCount: total,
      isFullAccess: true,
    };
  }

  // MODO FREE: Tomar exactamente el 60% del mazo
  const freeQuestions = all.slice(0, targetFreeCount);

  return {
    questions: freeQuestions,
    totalCount: total,
    freeCount: freeQuestions.length,
    premiumCount: total,
    isFullAccess: false,
  };
}

/**
 * Guarda o añade nuevas preguntas al banco general de preguntas
 */
export function saveCustomQuestions(newQuestions: Question[]): { success: boolean; count: number; error?: string } {
  try {
    const current = getCustomQuestions();
    const map = new Map<string, Question>();

    // Indexar las existentes
    current.forEach(q => map.set(q.id || `q_${map.size}`, q));

    // Agregar o actualizar con las nuevas
    newQuestions.forEach((q, i) => {
      const qId = q.id || `custom_q_${Date.now()}_${i}`;
      map.set(qId, {
        ...q,
        id: qId,
        mode: q.mode || 'HISTORIA',
        period: q.period || ('El Principio' as any),
        difficulty: (q.difficulty || 'BASIC') as any,
        options: Array.isArray(q.options) ? q.options : ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : ((q as any).correct ?? 0),
        reference: q.reference || 'Biblia'
      });
    });

    const merged = Array.from(map.values());
    localStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: merged.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Error desconocido' };
  }
}

/**
 * Elimina todas las preguntas personalizadas y regresa al banco original de 664 preguntas
 */
export function resetCustomQuestions(): void {
  localStorage.removeItem(CUSTOM_QUESTIONS_STORAGE_KEY);
}

/**
 * Estructura y Taxonomía Bíblica para Estudio Personalizado
 */
export const OLD_TESTAMENT_BOOKS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
  'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes',
  '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester',
  'Job', 'Salmos', 'Salmo', 'Proverbios', 'Eclesiastés', 'Cantares',
  'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel',
  'Oseas', 'Joel', 'Amós', 'Abdías', 'Jonás', 'Miqueas', 'Nahúm',
  'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías'
];

export const NEW_TESTAMENT_BOOKS = [
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos',
  'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios', 'Filipenses', 'Colosenses',
  '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón',
  'Hebreos', 'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas',
  'Apocalipsis'
];

export const ALL_BIBLE_BOOKS = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];

export interface CustomStudyFilter {
  testament: 'ALL' | 'OT' | 'NT';
  book: string; // 'ALL' o nombre del libro
  theme: string; // 'ALL' | 'PERIODOS' | 'KIDS' | 'VERSICULOS' | 'PERSONAJES' | 'DIOS' | 'SALVACION' | 'MANDAMIENTOS' | 'HISTORIA' | 'GEOGRAFIA'
  difficulty?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'MIXTO';
}

/**
 * Normaliza nombres de libros y referencias para comparar
 */
export function normalizeText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Determina si una referencia bíblica pertenece a un libro específico
 */
export function matchesBibleBook(reference: string, bookName: string): boolean {
  if (!reference || !bookName || bookName === 'ALL') return true;
  const normRef = normalizeText(reference);
  const normBook = normalizeText(bookName);
  return normRef.startsWith(normBook) || normRef.includes(normBook);
}

/**
 * Determina el testamento canónico de un libro bíblico
 */
export function getBookTestament(bookName: string): 'OT' | 'NT' | null {
  if (!bookName || bookName === 'ALL') return null;
  const norm = normalizeText(bookName);
  if (OLD_TESTAMENT_BOOKS.some(b => normalizeText(b) === norm)) return 'OT';
  if (NEW_TESTAMENT_BOOKS.some(b => normalizeText(b) === norm)) return 'NT';
  return null;
}

/**
 * Determina si una referencia bíblica pertenece al Antiguo o Nuevo Testamento
 */
export function getTestamentForReference(reference: string): 'OT' | 'NT' | 'UNKNOWN' {
  if (!reference) return 'UNKNOWN';
  const normRef = normalizeText(reference);

  for (const book of NEW_TESTAMENT_BOOKS) {
    if (normRef.startsWith(normalizeText(book)) || normRef.includes(normalizeText(book))) {
      return 'NT';
    }
  }

  for (const book of OLD_TESTAMENT_BOOKS) {
    if (normRef.startsWith(normalizeText(book)) || normRef.includes(normalizeText(book))) {
      return 'OT';
    }
  }

  return 'UNKNOWN';
}

/**
 * Mapeo de Períodos por Testamento
 */
export const OLD_TESTAMENT_PERIODS: Period[] = [
  Period.PRINCIPIO,
  Period.LEY,
  Period.REYES_PROFETAS,
];

export const NEW_TESTAMENT_PERIODS: Period[] = [
  Period.REDENCION,
  Period.IGLESIA,
  Period.TIEMPOS_FINALES,
];

/**
 * Filtra el banco de preguntas según la configuración de Estudio Bíblico Personalizado
 */
export function filterQuestionsForCustomStudy(allQuestions: Question[], filter: CustomStudyFilter): Question[] {
  if (!allQuestions || allQuestions.length === 0) return [];

  // Si se eligió un libro puntual, su testamento tiene prioridad
  const effectiveTestament = filter.book && filter.book !== 'ALL'
    ? (getBookTestament(filter.book) || filter.testament)
    : filter.testament;

  return allQuestions.filter(q => {
    // 1. Filtrar por Testamento (Permite referencias del AT como Daniel/Zacarías en Tiempos Finales o períodos del AT)
    if (effectiveTestament === 'OT') {
      const t = getTestamentForReference(q.reference);
      const isOTPeriod = OLD_TESTAMENT_PERIODS.includes(q.period);
      if (t !== 'OT' && !isOTPeriod) return false;
    } else if (effectiveTestament === 'NT') {
      const t = getTestamentForReference(q.reference);
      const isNTPeriod = NEW_TESTAMENT_PERIODS.includes(q.period);
      if (t !== 'NT' && !isNTPeriod) return false;
    }

    // 2. Filtrar por Libro individual
    if (filter.book && filter.book !== 'ALL') {
      if (!matchesBibleBook(q.reference, filter.book)) {
        return false;
      }
    }

    // 3. Filtrar por Temática
    if (filter.theme && filter.theme !== 'ALL' && filter.theme !== 'MIXTO') {
      if (filter.theme === 'PERIODOS') {
        // En Periodos entran todas
      } else if (filter.theme === 'PRINCIPIANTE' || filter.theme === 'KIDS') {
        if (q.difficulty !== 'BASIC' as any) return false;
      } else {
        const matchesTheme = Array.isArray(q.mode) ? q.mode.includes(filter.theme as any) : q.mode === filter.theme;
        if (!matchesTheme) return false;
      }
    }

    // 4. Filtrar por Dificultad (si aplica)
    if (filter.difficulty && filter.difficulty !== 'MIXTO') {
      if (filter.difficulty === 'BASIC' && q.difficulty !== 'BASIC' as any) return false;
      if (filter.difficulty === 'INTERMEDIATE' && q.difficulty !== 'BASIC' as any && q.difficulty !== 'INTERMEDIATE' as any) return false;
      if (filter.difficulty === 'ADVANCED' && q.difficulty !== 'INTERMEDIATE' as any && q.difficulty !== 'ADVANCED' as any) return false;
    }

    return true;
  });
}

/**
 * Obtiene los períodos válidos según el filtro de Estudio Personalizado activo
 */
export function getAvailablePeriodsForCustomStudy(allQuestions: Question[], filter: CustomStudyFilter | null): Period[] {
  if (!filter) {
    return Object.values(Period);
  }

  const effectiveTestament = filter.book && filter.book !== 'ALL'
    ? (getBookTestament(filter.book) || filter.testament)
    : filter.testament;

  // Filtrar las preguntas con el filtro
  const filtered = filterQuestionsForCustomStudy(allQuestions, filter);

  // Extraer los períodos presentes en las preguntas coincidentes
  const presentPeriods = new Set<Period>();
  filtered.forEach(q => {
    if (q.period) presentPeriods.add(q.period);
  });

  if (presentPeriods.size > 0) {
    return Array.from(presentPeriods);
  }

  if (effectiveTestament === 'OT') return OLD_TESTAMENT_PERIODS;
  if (effectiveTestament === 'NT') return NEW_TESTAMENT_PERIODS;
  return Object.values(Period);
}

/**
 * Genera y descarga el archivo JSON completo con todas las preguntas (para respaldos o subir a Supabase/GitHub)
 */
export function downloadFullQuestionsJSON(): void {
  const all = getAllGameQuestions();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(all, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `biblos_preguntas_completas_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

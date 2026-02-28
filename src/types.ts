export enum Difficulty {
  BASIC = 'BASIC',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum Period {
  PRINCIPIO = 'El Principio',
  LEY = 'El Pueblo de Dios y la Ley',
  REYES_PROFETAS = 'Reyes, Profetas y Poetas',
  REDENCION = 'Jesús y la Redención',
  IGLESIA = 'La Iglesia Cristiana',
  TIEMPOS_FINALES = 'Tiempos Finales',
}

export interface Question {
  id: string;
  period: Period;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctAnswer: number; // Index of options
  reference: string;
}

export const PERIOD_COLORS: Record<Period, string> = {
  [Period.PRINCIPIO]: 'bg-period-principio',
  [Period.LEY]: 'bg-period-ley',
  [Period.REYES_PROFETAS]: 'bg-period-reyes',
  [Period.REDENCION]: 'bg-period-redencion',
  [Period.IGLESIA]: 'bg-period-iglesia',
  [Period.TIEMPOS_FINALES]: 'bg-period-finales',
};

export const PERIOD_ICONS: Record<Period, string> = {
  [Period.PRINCIPIO]: '/images/principio.png',
  [Period.LEY]: '/images/ley.png',
  [Period.REYES_PROFETAS]: '/images/reyes.png',
  [Period.REDENCION]: '/images/redencion.png',
  [Period.IGLESIA]: '/images/iglesia.png',
  [Period.TIEMPOS_FINALES]: '/images/finales.png',
};

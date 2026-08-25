export type TutorialMode = "TABLERO" | "TRIVIA" | "DAILY_CHALLENGE" | "COPA_BIBLOS";

export interface TutorialProgress {
  tableroCompleted: boolean;
  triviaCompleted: boolean;
  dailyChallengeCompleted: boolean;
  copaBiblosCompleted: boolean;
}

const TUTORIAL_STORAGE_KEY = "biblos_tutorials_progress_v1";

export function getTutorialProgress(): TutorialProgress {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return {
    tableroCompleted: false,
    triviaCompleted: false,
    dailyChallengeCompleted: false,
    copaBiblosCompleted: false,
  };
}

export function saveTutorialProgress(progress: TutorialProgress): void {
  localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(progress));
}

export function isTutorialCompleted(mode: TutorialMode): boolean {
  const p = getTutorialProgress();
  switch (mode) {
    case "TABLERO":
      return p.tableroCompleted;
    case "TRIVIA":
      return p.triviaCompleted;
    case "DAILY_CHALLENGE":
      return p.dailyChallengeCompleted;
    case "COPA_BIBLOS":
      return p.copaBiblosCompleted;
  }
}

export function markTutorialCompleted(mode: TutorialMode): void {
  const p = getTutorialProgress();
  switch (mode) {
    case "TABLERO":
      p.tableroCompleted = true;
      break;
    case "TRIVIA":
      p.triviaCompleted = true;
      break;
    case "DAILY_CHALLENGE":
      p.dailyChallengeCompleted = true;
      break;
    case "COPA_BIBLOS":
      p.copaBiblosCompleted = true;
      break;
  }
  saveTutorialProgress(p);
}

export function resetTutorials(): void {
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
}

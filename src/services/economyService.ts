/**
 * Servicio de Economía Bíblica: Talentos
 * Administra el balance de talentos, transacciones, recarga diaria cada 24h, bonificaciones y costos de partida.
 */

export interface TalentTransaction {
  id: string;
  amount: number; // Positivo (ganancia) o negativo (gasto)
  reason: string;
  category: 
    | 'WELCOME_BONUS'
    | 'DAILY_REFILL'
    | 'REFERRAL_BONUS'
    | 'SHARE_BONUS'
    | 'SOLO_MATCH_FEE'
    | 'SOLO_MATCH_WIN'
    | 'LOCAL_GROUP_FEE'
    | 'LOCAL_GROUP_WIN'
    | 'MATCH_1V1_FEE'
    | 'MATCH_1V1_WIN'
    | 'GROUP_MATCH_FEE'
    | 'GROUP_MATCH_WIN'
    | 'FRIENDS_MATCH_REWARD'
    | 'EVENT_FEE'
    | 'EVENT_WIN'
    | 'SPECIAL_MODE_FEE'
    | 'LEVEL_UP_REWARD'
    | 'FRIEND_GIFT'
    | 'MANUAL_ADJUST'
    | 'REWARDED_AD'
    | 'COPA_BIBLOS';
  timestamp: string;
}

export const LEVEL_UP_REWARDS: Record<number, number> = {
  1: 0,  // Nivel 1: Nivel inicial (ya incluye el bono de bienvenida de 12)
  2: 30, // Nivel 2: Explorador Bíblico (+30 Talentos)
  3: 40, // Nivel 3: Discípulo de la Fe (+40 Talentos)
  4: 50, // Nivel 4: Guerrero de la Palabra (+50 Talentos)
  5: 60, // Nivel 5: Siervo de la Verdad (+60 Talentos)
  6: 70, // Nivel 6: Sabio de la Escritura (+70 Talentos)
  7: 80, // Nivel 7: Maestro de la Biblia (+80 Talentos)
};

export interface EconomyState {
  talents: number;
  lastDailyRefill: string | null; // ISO Date String
  lastShareBonusDate: string | null; // YYYY-MM-DD
  history: TalentTransaction[];
}

const ECONOMY_KEY = 'biblos_economy_state';
const CORRECTION_KEY = 'biblos_talents_recalibrated_v2';

export const INITIAL_WELCOME_TALENTS = 12;
export const DAILY_REFILL_TALENTS = 6;
export const DAILY_REFILL_CAP = 30; // Tope máximo acumulable exclusivamente por recargas diarias automáticas
export const REFILL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Horas
export const REFERRAL_INVITER_TALENTS = 3;
export const REFERRAL_INVITEE_TALENTS = 2;
export const SOCIAL_SHARE_TALENTS = 3; // +3 talentos extras por compartir en Facebook / Redes

export const FEES = {
  SOLO_MATCH: 1,
  SOLO_MATCH_WIN: 2,
  LOCAL_GROUP: 1,
  LOCAL_GROUP_WIN: 0, // En grupo local en el mismo dispositivo es solo consumo recreativo (sin recompensa de talentos)
  MATCH_1V1: 1,
  MATCH_1V1_WIN: 2,
  GROUP_MATCH: 1,
  GROUP_MATCH_PODIUM: {
    1: 3,
    2: 2,
    3: 1
  } as Record<number, number>,
  FRIENDS_MATCH: 0, // ¡Gratis! Jugar con amigos nunca descuenta talentos
  FRIENDS_MATCH_PODIUM: {
    1: 3, // 1er Lugar: 3 talentos del sistema
    2: 2, // 2do Lugar: 2 talentos del sistema
    3: 1  // 3er Lugar: 1 talento del sistema
  } as Record<number, number>,
  EVENT: 3,
  EVENT_WIN: 15,
  SPECIAL_MODE: 1
};

export const getInitialEconomyState = (): EconomyState => {
  return {
    talents: INITIAL_WELCOME_TALENTS,
    lastDailyRefill: new Date().toISOString(),
    lastShareBonusDate: null,
    history: [
      {
        id: `tx_${Date.now()}_welcome`,
        amount: INITIAL_WELCOME_TALENTS,
        reason: 'Bono de Bienvenida Bíblico (Saldo Inicial)',
        category: 'WELCOME_BONUS',
        timestamp: new Date().toISOString()
      }
    ]
  };
};

export const resetTalentsBalance = (amount: number = INITIAL_WELCOME_TALENTS): number => {
  const initial: EconomyState = {
    talents: amount,
    lastDailyRefill: new Date().toISOString(),
    lastShareBonusDate: null,
    history: [
      {
        id: `tx_${Date.now()}_welcome`,
        amount: amount,
        reason: 'Bono de Bienvenida Bíblico (Saldo Inicial)',
        category: 'WELCOME_BONUS',
        timestamp: new Date().toISOString()
      }
    ]
  };
  saveEconomyState(initial);
  try {
    localStorage.setItem(CORRECTION_KEY, 'true');
  } catch (e) {}
  return amount;
};

export const getEconomyState = (): EconomyState => {
  try {
    // Recalibración automática única para corregir saldos inflados por el bug de nivel
    const isRecalibrated = localStorage.getItem(CORRECTION_KEY);
    if (!isRecalibrated) {
      const reset = getInitialEconomyState();
      saveEconomyState(reset);
      localStorage.setItem(CORRECTION_KEY, 'true');
      return reset;
    }

    const raw = localStorage.getItem(ECONOMY_KEY);
    if (raw) {
      const parsed: EconomyState = JSON.parse(raw);
      if (typeof parsed.talents !== 'number' || isNaN(parsed.talents)) {
        parsed.talents = INITIAL_WELCOME_TALENTS;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading economy state', e);
  }

  const initial = getInitialEconomyState();
  saveEconomyState(initial);
  return initial;
};


export const saveEconomyState = (state: EconomyState): void => {
  try {
    localStorage.setItem(ECONOMY_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving economy state', e);
  }
};

/**
 * Obtener saldo actual de talentos
 */
export const getTalentsBalance = (): number => {
  return getEconomyState().talents;
};

/**
 * Verificar si tiene suficientes talentos para una acción
 */
export const canAffordTalents = (amount: number): boolean => {
  return getTalentsBalance() >= amount;
};

/**
 * Agregar talentos con registro en el historial
 */
export const addTalents = (
  amount: number,
  reason: string,
  category: TalentTransaction['category']
): { newBalance: number; transaction: TalentTransaction } => {
  const state = getEconomyState();
  const validAmount = Math.max(0, Math.round(amount));
  state.talents += validAmount;

  const transaction: TalentTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    amount: validAmount,
    reason,
    category,
    timestamp: new Date().toISOString()
  };

  state.history = [transaction, ...state.history.slice(0, 49)]; // Guardar últimas 50 transacciones
  saveEconomyState(state);

  return { newBalance: state.talents, transaction };
};

/**
 * Gastar / consumir talentos
 */
export const spendTalents = (
  amount: number,
  reason: string,
  category: TalentTransaction['category']
): { success: boolean; newBalance: number; transaction?: TalentTransaction } => {
  const state = getEconomyState();
  const validAmount = Math.max(0, Math.round(amount));

  if (state.talents < validAmount) {
    return { success: false, newBalance: state.talents };
  }

  state.talents -= validAmount;

  const transaction: TalentTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    amount: -validAmount,
    reason,
    category,
    timestamp: new Date().toISOString()
  };

  state.history = [transaction, ...state.history.slice(0, 49)];
  saveEconomyState(state);

  return { success: true, newBalance: state.talents, transaction };
};

/**
 * Comprobar y aplicar la recarga diaria (+6 talentos con tope de 30) si han pasado 24h
 * - Si el usuario ya tiene 30 o más talentos, no se le suman más talentos por recarga pasiva para fomentar el juego activo.
 * - Los talentos ganados por victorias, copas o compartir no tienen tope y pueden subir libremente.
 */
export const checkAndApplyDailyRefill = (): { applied: boolean; added: number; newBalance: number; nextRefillMs: number; reason?: string } => {
  const state = getEconomyState();
  const now = Date.now();
  const lastRefillTime = state.lastDailyRefill ? new Date(state.lastDailyRefill).getTime() : 0;
  const elapsed = now - lastRefillTime;

  if (elapsed >= REFILL_COOLDOWN_MS) {
    // Si ya alcanzó o superó el tope de 30 talentos para la cuota pasiva diaria
    if (state.talents >= DAILY_REFILL_CAP) {
      state.lastDailyRefill = new Date().toISOString();
      saveEconomyState(state);
      return { 
        applied: false, 
        added: 0, 
        newBalance: state.talents, 
        nextRefillMs: REFILL_COOLDOWN_MS,
        reason: `Has alcanzado el tope de ${DAILY_REFILL_CAP} talentos diarios. ¡Juega partidas o compite para seguir ganando más!`
      };
    }

    // Calcular cuánto puede recibir sin exceder el tope de 30
    const availableSpace = Math.max(0, DAILY_REFILL_CAP - state.talents);
    const amountToAdd = Math.min(DAILY_REFILL_TALENTS, availableSpace);

    state.talents += amountToAdd;
    state.lastDailyRefill = new Date().toISOString();

    const transaction: TalentTransaction = {
      id: `tx_${Date.now()}_refill`,
      amount: amountToAdd,
      reason: `Recarga Diaria de Bendición (+${amountToAdd} Talentos)`,
      category: 'DAILY_REFILL',
      timestamp: new Date().toISOString()
    };

    state.history = [transaction, ...state.history.slice(0, 49)];
    saveEconomyState(state);

    return { applied: true, added: amountToAdd, newBalance: state.talents, nextRefillMs: REFILL_COOLDOWN_MS };
  }

  const remaining = Math.max(0, REFILL_COOLDOWN_MS - elapsed);
  return { applied: false, added: 0, newBalance: state.talents, nextRefillMs: remaining };
};

/**
 * Obtener tiempo restante para la próxima recarga diaria
 */
export const getTimeUntilNextRefill = (): { remainingMs: number; formatted: string; canClaim: boolean; isCapped: boolean } => {
  const state = getEconomyState();
  const now = Date.now();
  const lastRefillTime = state.lastDailyRefill ? new Date(state.lastDailyRefill).getTime() : 0;
  const elapsed = now - lastRefillTime;
  const isCapped = state.talents >= DAILY_REFILL_CAP;

  if (elapsed >= REFILL_COOLDOWN_MS) {
    return { remainingMs: 0, formatted: '00:00:00', canClaim: !isCapped, isCapped };
  }

  const remainingMs = REFILL_COOLDOWN_MS - elapsed;
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return { remainingMs, formatted, canClaim: false, isCapped };
};

/**
 * Recompensa por compartir en redes (1 vez al día)
 */
export const claimSocialShareBonus = (): { success: boolean; added: number; newBalance: number; message: string } => {
  const state = getEconomyState();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (state.lastShareBonusDate === today) {
    return {
      success: false,
      added: 0,
      newBalance: state.talents,
      message: 'Ya recibiste tu bono por compartir hoy. ¡Vuelve mañana por más talentos!'
    };
  }

  state.lastShareBonusDate = today;
  state.talents += SOCIAL_SHARE_TALENTS;

  const transaction: TalentTransaction = {
    id: `tx_${Date.now()}_share`,
    amount: SOCIAL_SHARE_TALENTS,
    reason: 'Bono por Compartir en Redes Sociales',
    category: 'SHARE_BONUS',
    timestamp: new Date().toISOString()
  };

  state.history = [transaction, ...state.history.slice(0, 49)];
  saveEconomyState(state);

  return {
    success: true,
    added: SOCIAL_SHARE_TALENTS,
    newBalance: state.talents,
    message: `¡Has recibido +${SOCIAL_SHARE_TALENTS} Talentos por compartir en redes!`
  };
};

/**
 * Recompensa por vincular amigo referido
 */
export const claimReferralBonus = (isInviter: boolean, friendName: string): { added: number; newBalance: number } => {
  const amount = isInviter ? REFERRAL_INVITER_TALENTS : REFERRAL_INVITEE_TALENTS;
  const reason = isInviter 
    ? `Bono de Amigo Referido (${friendName})` 
    : `Bono de Bienvenida por Invitación (${friendName})`;

  const { newBalance } = addTalents(amount, reason, 'REFERRAL_BONUS');
  return { added: amount, newBalance };
};
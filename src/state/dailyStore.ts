import { create } from 'zustand';
import { EMPTY_DAILY, loadDaily, openDaily, recordDailyResult, saveDaily, todayUtc } from './daily';
import type { DailyResult, DailyState } from './daily';

interface DailyStore {
  state: DailyState;
  hydrate(): void;
  /** Starts or resumes today's attempt. */
  open(date?: string): void;
  record(result: DailyResult): void;
}

export const useDailyStore = create<DailyStore>((set, get) => ({
  state: { ...EMPTY_DAILY },

  hydrate() {
    set({ state: loadDaily() });
  },

  open(date = todayUtc()) {
    const state = openDaily(get().state, date);
    set({ state });
    saveDaily(state);
  },

  record(result) {
    const state = recordDailyResult(get().state, result);
    set({ state });
    saveDaily(state);
  },
}));

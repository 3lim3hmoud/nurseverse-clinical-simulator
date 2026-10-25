import { useSyncExternalStore } from 'react';

/** Which of the app-wide screens (settings, control editor) is open. Plain store, so any screen can open them. */
interface UiState {
  settings: boolean;
  editing: boolean;
}

let state: UiState = { settings: false, editing: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<UiState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const openSettings = () => set({ settings: true, editing: false });
export const closeSettings = () => set({ settings: false });
export const startEditing = () => set({ settings: false, editing: true });
export const stopEditing = () => set({ editing: false });

export function useUi(): UiState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

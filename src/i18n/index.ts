import { useSyncExternalStore } from 'react';
import { ar } from './ar';
import { en } from './en';

export type Lang = 'en' | 'ar';

const STORAGE_KEY = 'nurseverse-lang';
const dictionaries: Record<Lang, Record<string, string>> = { en, ar };
const listeners = new Set<() => void>();

function initial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    /* storage blocked: ignore */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

let current: Lang = initial();

export const getLang = (): Lang => current;
export const dirOf = (lang: Lang = current): 'rtl' | 'ltr' => (lang === 'ar' ? 'rtl' : 'ltr');

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn());
}

/** Translate a key. Works anywhere (domain code included); UI components should call useLang() so they re-render. */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = dictionaries[current][key] ?? en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getLang,
  );
}

/** Translation + text direction for React components (re-renders when the language changes). */
export function useI18n() {
  const lang = useLang();
  return { lang, dir: dirOf(lang), t };
}

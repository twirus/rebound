import { signal } from '@preact/signals';
import ru from './ru.json';
import en from './en.json';

export type Language = 'ru' | 'en';

export const dictionaries: Record<Language, Record<string, string>> = { ru, en };

function detectLanguage(): Language {
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export const language = signal<Language>(detectLanguage());

/** Looks up a player-facing string and fills {placeholders}. Missing keys fail loudly. */
export function t(key: string, params: Record<string, string> = {}): string {
  const template = dictionaries[language.value][key];
  if (template === undefined) {
    throw new Error(`Missing i18n key "${key}" for language "${language.value}"`);
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) => params[name] ?? match);
}

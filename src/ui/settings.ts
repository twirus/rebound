import { effect, signal } from '@preact/signals';

const SETTINGS_KEY = 'rebound.settings';

interface Settings {
  soundEnabled: boolean;
}

function loadSettings(): Settings {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}');
    const soundEnabled =
      typeof parsed === 'object' && parsed !== null && 'soundEnabled' in parsed
        ? parsed.soundEnabled !== false
        : true;
    return { soundEnabled };
  } catch (error) {
    console.error('Settings could not be read; using defaults', error);
    return { soundEnabled: true };
  }
}

export const soundEnabled = signal(loadSettings().soundEnabled);

effect(() => {
  const settings: Settings = { soundEnabled: soundEnabled.value };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Settings could not be saved', error);
  }
});

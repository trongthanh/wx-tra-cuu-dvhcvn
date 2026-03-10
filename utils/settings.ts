/**
 * Extension settings management
 */

export interface Settings {
  /** Enable page content annotation */
  enableAnnotation: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  enableAnnotation: true,
};

const STORAGE_KEY = 'vw_settings';

/**
 * Get current settings from storage
 */
export async function getSettings(): Promise<Settings> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to storage
 */
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await browser.storage.local.set({ [STORAGE_KEY]: updated });
}

/**
 * Get a single setting value
 */
export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
  const settings = await getSettings();
  return settings[key];
}

/**
 * Set a single setting value
 */
export async function setSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
): Promise<void> {
  await saveSettings({ [key]: value });
}

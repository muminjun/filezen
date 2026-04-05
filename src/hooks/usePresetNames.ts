import { useTranslations } from 'next-intl';

export function usePresetNames() {
  const t = useTranslations('presets');

  const getPresetName = (presetId: string): string => {
    try {
      return t(presetId as any);
    } catch {
      return presetId;
    }
  };

  return { getPresetName };
}

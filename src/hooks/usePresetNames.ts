import { useTranslations } from 'next-intl';

export function usePresetNames() {
  const t = useTranslations('presets');

  const getPresetName = (presetId: string): string => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return t(presetId as any);
    } catch {
      return presetId;
    }
  };

  return { getPresetName };
}

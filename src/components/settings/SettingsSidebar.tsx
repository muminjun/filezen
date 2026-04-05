'use client';

import { useTranslations } from 'next-intl';
import { useAppContext } from '../../context/AppContext';
import { usePresetNames } from '../../hooks/usePresetNames';
import { Button } from '../ui/button';
import type { ImageFormat, ResizeMode } from '../../lib/types';

export function SettingsSidebar() {
  const t = useTranslations('settings');
  const { settings, updateSettings, presets } = useAppContext();
  const { getPresetName } = usePresetNames();

  // 동적 포맷 라벨
  const formatLabels: Record<string, string> = {
    png: t('formatLabels.png'),
    jpg: t('formatLabels.jpg'),
    webp: t('formatLabels.webp'),
  };

  // 동적 리사이즈 모드 라벨
  const resizeModeLabels: Record<string, string> = {
    contain: t('resizeLabels.contain'),
    cover: t('resizeLabels.cover'),
    stretch: t('resizeLabels.stretch'),
    crop: t('resizeLabels.crop'),
  };

  return (
    <div className="w-64 lg:border-l border-muted-foreground/25 bg-muted/50 p-4 overflow-y-auto">
      <div className="space-y-6 lg:space-y-6">
        {/* Format */}
        <div>
          <label className="text-sm font-semibold block mb-2">{t('format')}</label>
          <div className="space-y-1">
            {Object.entries(formatLabels).map(([format, label]) => (
              <Button
                key={format}
                variant={settings.format === format ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => updateSettings({ format: format as ImageFormat })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="text-sm font-semibold block mb-2">{t('dimensions')}</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">{t('width')}</label>
              <input
                type="number"
                value={settings.width}
                onChange={(e) => updateSettings({ width: parseInt(e.target.value) })}
                className="w-full px-2 py-1 rounded border border-muted-foreground/25 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('height')}</label>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => updateSettings({ height: parseInt(e.target.value) })}
                className="w-full px-2 py-1 rounded border border-muted-foreground/25 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Resize Mode */}
        <div>
          <label className="text-sm font-semibold block mb-2">{t('resizeMode')}</label>
          <div className="space-y-1">
            {Object.entries(resizeModeLabels).map(([mode, label]) => (
              <Button
                key={mode}
                variant={settings.resizeMode === mode ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => updateSettings({ resizeMode: mode as ResizeMode })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="text-sm font-semibold block mb-2">{t('quality')}</label>
          {settings.format === 'jpg' && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t('jpgQuality')}</span>
                <span className="text-xs font-semibold">{settings.jpgQuality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.jpgQuality}
                onChange={(e) => updateSettings({ jpgQuality: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
          {settings.format === 'webp' && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t('webpQuality')}</span>
                <span className="text-xs font-semibold">{settings.webpQuality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.webpQuality}
                onChange={(e) => updateSettings({ webpQuality: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
          {settings.format === 'png' && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t('pngCompression')}</span>
                <span className="text-xs font-semibold">{settings.pngCompressionLevel}/9</span>
              </div>
              <input
                type="range"
                min="0"
                max="9"
                value={settings.pngCompressionLevel}
                onChange={(e) => updateSettings({ pngCompressionLevel: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Presets */}
        {presets && presets.length > 0 && (
          <div>
            <label className="text-sm font-semibold block mb-2">{t('presets')}</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {presets.slice(0, 5).map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    updateSettings({
                      width: preset.width,
                      height: preset.height,
                      resizeMode: preset.resizeMode,
                      format: preset.format,
                    });
                  }}
                >
                  {getPresetName(preset.id)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={settings.removeMetadata}
              onChange={(e) => updateSettings({ removeMetadata: e.target.checked })}
              className="w-4 h-4"
            />
            <span>{t('metadata')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}

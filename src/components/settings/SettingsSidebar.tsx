'use client';

import { useAppContext } from '../../context/AppContext';
import { FORMAT_LABELS, RESIZE_MODE_LABELS } from '../../lib/constants';
import { Button } from '../ui/button';

export function SettingsSidebar() {
  const { settings, updateSettings, presets, applyPreset } = useAppContext();

  return (
    <div className="w-64 border-l border-muted-foreground/25 bg-muted/50 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Format */}
        <div>
          <label className="text-sm font-semibold block mb-2">Format</label>
          <div className="space-y-1">
            {Object.entries(FORMAT_LABELS).map(([format, label]) => (
              <Button
                key={format}
                variant={settings.format === format ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => updateSettings({ format: format as any })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="text-sm font-semibold block mb-2">Dimensions</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">Width</label>
              <input
                type="number"
                value={settings.width}
                onChange={(e) => updateSettings({ width: parseInt(e.target.value) })}
                className="w-full px-2 py-1 rounded border border-muted-foreground/25 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Height</label>
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
          <label className="text-sm font-semibold block mb-2">Resize Mode</label>
          <div className="space-y-1">
            {Object.entries(RESIZE_MODE_LABELS).map(([mode, label]) => (
              <Button
                key={mode}
                variant={settings.resizeMode === mode ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => updateSettings({ resizeMode: mode as any })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="text-sm font-semibold block mb-2">Quality</label>
          {settings.format === 'jpg' && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">JPG Quality</span>
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
                <span className="text-xs text-muted-foreground">WebP Quality</span>
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
                <span className="text-xs text-muted-foreground">Compression</span>
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
            <label className="text-sm font-semibold block mb-2">Quick Presets</label>
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
                  {preset.name}
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
            <span>Remove Metadata (EXIF)</span>
          </label>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { CanvasElement, ImageEl, TextEl, ShapeEl, CanvasBackground } from '@/types/canvas';

interface CanvasPropertiesProps {
  selected: CanvasElement | null;
  background: CanvasBackground;
  showBackground: boolean;
  onChangeElement: (patch: Partial<CanvasElement>) => void;
  onDeleteElement: () => void;
  onMoveLayer: (direction: 'up' | 'down') => void;
  onChangeBackground: (bg: CanvasBackground) => void;
}

export function CanvasProperties({
  selected,
  background,
  showBackground,
  onChangeElement,
  onDeleteElement,
  onMoveLayer,
  onChangeBackground,
}: CanvasPropertiesProps) {
  if (!selected && !showBackground) return null;

  return (
    <aside className="hidden sm:flex w-56 flex-shrink-0 flex-col border-l border-border bg-card overflow-y-auto">
      <div className="p-3 space-y-4">
        {showBackground && !selected && (
          <BackgroundPanel bg={background} onChange={onChangeBackground} />
        )}

        {selected && selected.type === 'image' && (
          <ImagePanel el={selected as ImageEl} onChange={(p) => onChangeElement(p as Partial<CanvasElement>)} />
        )}
        {selected && selected.type === 'text' && (
          <TextPanel el={selected as TextEl} onChange={(p) => onChangeElement(p as Partial<CanvasElement>)} />
        )}
        {selected && selected.type === 'shape' && (
          <ShapePanel el={selected as ShapeEl} onChange={(p) => onChangeElement(p as Partial<CanvasElement>)} />
        )}

        {selected && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">레이어</p>
            <div className="flex gap-1">
              <button onClick={() => onMoveLayer('up')} className="flex-1 flex items-center justify-center gap-1 rounded border border-border py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
                <ChevronUp size={14} /> 앞으로
              </button>
              <button onClick={() => onMoveLayer('down')} className="flex-1 flex items-center justify-center gap-1 rounded border border-border py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
                <ChevronDown size={14} /> 뒤로
              </button>
            </div>
            <button onClick={onDeleteElement} className="w-full flex items-center justify-center gap-1.5 rounded border border-red-500/30 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors">
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground mb-1">{children}</p>;
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0.5" />
      <span className="text-xs text-muted-foreground font-mono">{value.toUpperCase()}</span>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">{Math.round(value)}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary" />
    </div>
  );
}

function ImagePanel({ el, onChange }: { el: ImageEl; onChange: (p: Partial<ImageEl>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">이미지</p>
      <SliderRow label="투명도" value={el.opacity * 100} min={0} max={100}
        onChange={(v) => onChange({ opacity: v / 100 })} />
    </div>
  );
}

function TextPanel({ el, onChange }: { el: TextEl; onChange: (p: Partial<TextEl>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">텍스트</p>
      <SliderRow label="폰트 크기" value={el.fontSize} min={8} max={200}
        onChange={(v) => onChange({ fontSize: v })} />
      <div>
        <Label>색상</Label>
        <ColorInput value={el.color} onChange={(v) => onChange({ color: v })} />
      </div>
      <div className="flex gap-1">
        <button onClick={() => onChange({ bold: !el.bold })}
          className={`flex-1 rounded border py-1 text-xs font-bold transition-colors ${el.bold ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>B</button>
        <button onClick={() => onChange({ italic: !el.italic })}
          className={`flex-1 rounded border py-1 text-xs italic transition-colors ${el.italic ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>I</button>
      </div>
      <div className="flex gap-1">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button key={a} onClick={() => onChange({ align: a })}
            className={`flex-1 rounded border py-1 text-xs transition-colors ${el.align === a ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            {a === 'left' ? '←' : a === 'center' ? '↔' : '→'}
          </button>
        ))}
      </div>
      <SliderRow label="투명도" value={el.opacity * 100} min={0} max={100}
        onChange={(v) => onChange({ opacity: v / 100 })} />
    </div>
  );
}

function ShapePanel({ el, onChange }: { el: ShapeEl; onChange: (p: Partial<ShapeEl>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">도형</p>
      <div>
        <Label>채우기</Label>
        <ColorInput value={el.fill} onChange={(v) => onChange({ fill: v })} />
      </div>
      <div>
        <Label>테두리 색</Label>
        <ColorInput value={el.stroke} onChange={(v) => onChange({ stroke: v })} />
      </div>
      <SliderRow label="테두리 두께" value={el.strokeWidth} min={0} max={20}
        onChange={(v) => onChange({ strokeWidth: v })} />
      <SliderRow label="투명도" value={el.opacity * 100} min={0} max={100}
        onChange={(v) => onChange({ opacity: v / 100 })} />
    </div>
  );
}

function BackgroundPanel({ bg, onChange }: { bg: CanvasBackground; onChange: (b: CanvasBackground) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">배경</p>
      <div className="flex gap-1">
        {(['color', 'gradient'] as const).map((t) => (
          <button key={t} onClick={() => onChange(t === 'color' ? { type: 'color', color: '#ffffff' } : { type: 'gradient', from: '#6366f1', to: '#818cf8', direction: 'horizontal' })}
            className={`flex-1 rounded border py-1 text-xs transition-colors ${bg.type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            {t === 'color' ? '단색' : '그라디언트'}
          </button>
        ))}
      </div>
      {bg.type === 'color' && (
        <div>
          <Label>색상</Label>
          <ColorInput value={bg.color} onChange={(v) => onChange({ ...bg, color: v })} />
        </div>
      )}
      {bg.type === 'gradient' && (
        <>
          <div><Label>시작 색</Label><ColorInput value={bg.from} onChange={(v) => onChange({ ...bg, from: v })} /></div>
          <div><Label>끝 색</Label><ColorInput value={bg.to} onChange={(v) => onChange({ ...bg, to: v })} /></div>
          <div className="flex gap-1">
            {(['horizontal', 'vertical'] as const).map((d) => (
              <button key={d} onClick={() => onChange({ ...bg, direction: d })}
                className={`flex-1 rounded border py-1 text-xs transition-colors ${bg.direction === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                {d === 'horizontal' ? '가로' : '세로'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

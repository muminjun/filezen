'use client';

import { useRef, useState } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextEl } from '@/types/canvas';

interface TextElementProps {
  el: TextEl;
  stageRef: React.RefObject<Konva.Stage | null>;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TextEl>) => void;
}

export function TextElement({ el, stageRef, isSelected, onSelect, onChange }: TextElementProps) {
  const textRef = useRef<Konva.Text>(null);
  const [editing, setEditing] = useState(false);

  const handleDblClick = () => {
    if (!textRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const textNode = textRef.current;
    const stageBox = stage.container().getBoundingClientRect();
    const absPos = textNode.getAbsolutePosition();
    const scale = stage.scaleX();

    const textarea = document.createElement('textarea');
    textarea.value = el.text;
    textarea.style.cssText = `
      position: fixed;
      top: ${stageBox.top + absPos.y * scale}px;
      left: ${stageBox.left + absPos.x * scale}px;
      width: ${el.width * scale}px;
      font-size: ${el.fontSize * scale}px;
      font-weight: ${el.bold ? 'bold' : 'normal'};
      font-style: ${el.italic ? 'italic' : 'normal'};
      color: ${el.color};
      background: transparent;
      border: 1px dashed #6366f1;
      outline: none;
      resize: none;
      padding: 2px;
      z-index: 9999;
      line-height: 1.2;
      overflow: hidden;
      transform: rotate(${el.rotation}deg);
      transform-origin: top left;
    `;
    document.body.appendChild(textarea);
    textarea.focus();
    setEditing(true);

    const finish = () => {
      onChange({ text: textarea.value });
      document.body.removeChild(textarea);
      setEditing(false);
    };

    textarea.addEventListener('blur', finish, { once: true });
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') textarea.blur();
    });
  };

  return (
    <Text
      ref={textRef}
      id={el.id}
      text={el.text}
      x={el.x}
      y={el.y}
      width={el.width}
      fontSize={el.fontSize}
      fill={el.color}
      fontStyle={`${el.bold ? 'bold' : ''} ${el.italic ? 'italic' : ''}`.trim() || 'normal'}
      align={el.align}
      rotation={el.rotation}
      opacity={el.opacity}
      visible={!editing}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * node.scaleX()),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}

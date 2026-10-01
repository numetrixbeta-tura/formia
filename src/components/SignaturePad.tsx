import { useEffect, useRef, useState, type PointerEvent } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 280;
const PADDING = 18;

function drawSavedSignature(canvas: HTMLCanvasElement, dataUrl: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !dataUrl) return;
  const image = new Image();
  image.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  image.src = dataUrl;
}

function trimCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < 0) return '';

  minX = Math.max(0, minX - PADDING);
  minY = Math.max(0, minY - PADDING);
  maxX = Math.min(width - 1, maxX + PADDING);
  maxY = Math.min(height - 1, maxY + PADDING);

  const cropped = document.createElement('canvas');
  cropped.width = maxX - minX + 1;
  cropped.height = maxY - minY + 1;
  const croppedCtx = cropped.getContext('2d');
  if (!croppedCtx) return '';
  croppedCtx.drawImage(canvas, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  return cropped.toDataURL('image/png');
}

export default function SignaturePad({ value, onChange, error, required }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const lastEmittedValueRef = useRef('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value || value === lastEmittedValueRef.current) return;
    drawSavedSignature(canvas, value);
    hasDrawnRef.current = true;
    setIsEmpty(false);
  }, [value]);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const p = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawingRef.current = true;
    hasDrawnRef.current = true;
    setIsEmpty(false);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const p = pointFromEvent(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const signature = trimCanvas(canvas);
      lastEmittedValueRef.current = signature;
      onChange(signature);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingRef.current = false;
    hasDrawnRef.current = false;
    lastEmittedValueRef.current = '';
    setIsEmpty(true);
    onChange('');
  };

  return (
    <div className={`signature-field ${error ? 'signature-field--error' : ''}`}>
      <div className="signature-field__heading">
        <span className="field__label">
          Firma digital
          {required && <span className="field__required">*</span>}
        </span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={clear} disabled={isEmpty}>
          Borrar y firmar de nuevo
        </button>
      </div>
      <div className="signature-pad-wrap">
        <canvas
          ref={canvasRef}
          className="signature-pad"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={() => { if (drawingRef.current) end(); }}
        />
        {isEmpty && <div className="signature-pad__hint">Firma aquí con el dedo o con el mouse</div>}
      </div>
      {error && <span className="field__error-msg">{error}</span>}
    </div>
  );
}

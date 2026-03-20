import React, { useRef, useState, useCallback, useEffect } from 'react';

const DrawingCanvas = ({ onStrokeComplete, disabled, width = 400, height = 400 }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState('#000000');
  const [tool, setTool] = useState('draw'); // 'draw' | 'eraser'
  const [strokes, setStrokes] = useState([]);

  const COLORS = [
    '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#6b7280',
  ];

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const redrawCanvas = useCallback((strokeList) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokeList.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.brushSize * 3 : stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, []);

  const handleStart = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    const pos = getPos(e);
    setIsDrawing(true);
    setCurrentPoints([pos]);
  }, [disabled, getPos]);

  const handleMove = useCallback((e) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const pos = getPos(e);

    setCurrentPoints((prev) => {
      const updated = [...prev, pos];

      const canvas = canvasRef.current;
      if (!canvas) return updated;
      const ctx = canvas.getContext('2d');

      // Draw incremental line segment
      if (prev.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : brushColor;
        ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(prev[prev.length - 1].x, prev[prev.length - 1].y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }

      return updated;
    });
  }, [isDrawing, disabled, getPos, brushColor, brushSize, tool]);

  const handleEnd = useCallback((e) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    setIsDrawing(false);

    if (currentPoints.length > 1) {
      const stroke = {
        points: currentPoints,
        color: brushColor,
        brushSize,
        tool,
      };
      const newStrokes = [...strokes, stroke];
      setStrokes(newStrokes);
      onStrokeComplete?.(stroke);
    }
    setCurrentPoints([]);
  }, [isDrawing, disabled, currentPoints, brushColor, brushSize, tool, strokes, onStrokeComplete]);

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redrawCanvas(newStrokes);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`border-2 rounded-xl bg-white touch-none ${
          disabled ? 'border-canvas-border/30 opacity-60 cursor-not-allowed' : 'border-canvas-border cursor-crosshair'
        }`}
        style={{ width: '100%', maxWidth: width, aspectRatio: `${width}/${height}` }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* Toolbar */}
      {!disabled && (
        <div className="w-full max-w-[400px] space-y-2">
          {/* Colors */}
          <div className="flex items-center gap-1.5 justify-center flex-wrap">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { setBrushColor(color); setTool('draw'); }}
                className={`w-7 h-7 rounded-full border-2 transition ${
                  brushColor === color && tool === 'draw' ? 'border-canvas-accent scale-110' : 'border-canvas-border'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Brush size + tools */}
          <div className="flex items-center gap-3 justify-center">
            {[2, 4, 8].map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`flex items-center justify-center w-9 h-9 rounded-lg border transition ${
                  brushSize === size ? 'border-canvas-accent bg-canvas-accent/10' : 'border-canvas-border'
                }`}
              >
                <div
                  className="rounded-full bg-canvas-text"
                  style={{ width: size + 4, height: size + 4 }}
                />
              </button>
            ))}

            <button
              onClick={() => setTool(tool === 'eraser' ? 'draw' : 'eraser')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                tool === 'eraser' ? 'border-canvas-accent bg-canvas-accent/10 text-canvas-accent' : 'border-canvas-border'
              }`}
            >
              Eraser
            </button>

            <button
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-canvas-border hover:bg-canvas-card transition"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;

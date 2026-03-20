import React, { useRef, useEffect, useCallback } from 'react';
import useGameStore from '../stores/gameStore';

const HostCanvasDisplay = ({ width = 800, height = 600 }) => {
  const canvasRef = useRef(null);
  const strokes = useGameStore((s) => s.strokes);

  const drawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : (stroke.color || '#000000');
      ctx.lineWidth = stroke.tool === 'eraser' ? (stroke.brushSize || 4) * 3 : (stroke.brushSize || 4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    drawAllStrokes();
  }, [drawAllStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border-2 border-canvas-border rounded-2xl bg-white shadow-lg"
      style={{ width: '100%', maxWidth: width, aspectRatio: `${width}/${height}` }}
    />
  );
};

export default HostCanvasDisplay;

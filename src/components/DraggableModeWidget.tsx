import React, { useState, useEffect, useRef } from "react";
import { GripHorizontal, LayoutGrid } from "lucide-react";
import { DragPosition } from "../types";

export type ViewMode = "normal" | "zen" | "ambient";

interface DraggableModeWidgetProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const DraggableModeWidget: React.FC<DraggableModeWidgetProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  const [position, setPosition] = useState<DragPosition>({ x: 40, y: 195 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionRef = useRef<DragPosition>({ x: 40, y: 195 });
  const widgetRef = useRef<HTMLDivElement | null>(null);

  // Restore position from localStorage on mount
  useEffect(() => {
    const savedX = localStorage.getItem("mode_widget_x");
    const savedY = localStorage.getItem("mode_widget_y");
    if (savedX !== null && savedY !== null) {
      const parsedX = parseFloat(savedX);
      const parsedY = parseFloat(savedY);

      const safeX = Math.min(Math.max(20, parsedX), window.innerWidth - 220);
      const safeY = Math.min(Math.max(20, parsedY), window.innerHeight - 200);
      setPosition({ x: safeX, y: safeY });
      positionRef.current = { x: safeX, y: safeY };
    } else {
      setPosition({ x: 40, y: 195 });
      positionRef.current = { x: 40, y: 195 };
    }
  }, []);

  // Recalculate margins on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 210) - 20;
        const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 150) - 20;
        const bounded = {
          x: Math.min(Math.max(20, prev.x), Math.max(20, maxX)),
          y: Math.min(Math.max(20, prev.y), Math.max(20, maxY)),
        };
        positionRef.current = bounded;
        return bounded;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - positionRef.current.x,
        y: e.touches[0].clientY - positionRef.current.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const widgetWidth = widgetRef.current?.offsetWidth || 210;
      const widgetHeight = widgetRef.current?.offsetHeight || 150;

      const maxBoundX = window.innerWidth - widgetWidth - 20;
      const maxBoundY = window.innerHeight - widgetHeight - 20;

      const computedNewX = e.clientX - dragStartRef.current.x;
      const computedNewY = e.clientY - dragStartRef.current.y;

      const boundedX = Math.min(Math.max(20, computedNewX), maxBoundX);
      const boundedY = Math.min(Math.max(20, computedNewY), maxBoundY);

      setPosition({ x: boundedX, y: boundedY });
      positionRef.current = { x: boundedX, y: boundedY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const widgetWidth = widgetRef.current?.offsetWidth || 210;
      const widgetHeight = widgetRef.current?.offsetHeight || 150;

      const maxBoundX = window.innerWidth - widgetWidth - 20;
      const maxBoundY = window.innerHeight - widgetHeight - 20;

      const computedNewX = e.touches[0].clientX - dragStartRef.current.x;
      const computedNewY = e.touches[0].clientY - dragStartRef.current.y;

      const boundedX = Math.min(Math.max(20, computedNewX), maxBoundX);
      const boundedY = Math.min(Math.max(20, computedNewY), maxBoundY);

      setPosition({ x: boundedX, y: boundedY });
      positionRef.current = { x: boundedX, y: boundedY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem("mode_widget_x", positionRef.current.x.toString());
      localStorage.setItem("mode_widget_y", positionRef.current.y.toString());
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={widgetRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      className={`absolute z-[20] select-none rounded-2xl flex flex-col p-4 pt-5 pb-3 w-[210px] border border-white/10 bg-white/5 backdrop-blur-2xl outline-hidden hover:border-white/20 active:border-cyan-400/40 ${
        isDragging
          ? "cursor-grabbing shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-cyan-400/45 scale-[1.01] transition-none"
          : "cursor-grab shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(34,211,238,0.08)] transition-[border-color,box-shadow,background-color,transform] duration-300"
      }`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      id="mode-widget-draggable"
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full" />

      <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold letter-spacing-wider pb-1.5 border-b border-white/5 mb-2.5 font-display">
        <div className="flex items-center gap-1.5">
          <LayoutGrid size={11} className="text-cyan-400" />
          <span>Display Mode</span>
        </div>
        <div className="flex items-center gap-1">
          <GripHorizontal size={11} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {(["normal", "zen", "ambient"] as ViewMode[]).map((mode) => {
          const isActive = viewMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className={`w-full py-1.5 rounded-lg text-[9px] font-bold tracking-widest font-sans cursor-pointer uppercase border transition-all duration-300 ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                  : "bg-black/25 text-white/40 border-white/5 hover:text-white/80 hover:border-white/10"
              }`}
            >
              {mode}
            </button>
          );
        })}
      </div>
    </div>
  );
};

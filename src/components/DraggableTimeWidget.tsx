import React, { useState, useEffect, useRef } from "react";
import { Clock, GripHorizontal, Move, Music } from "lucide-react";
import { DragPosition, Song } from "../types";

interface DraggableTimeWidgetProps {
  currentSong: Song | null;
  isPlaying: boolean;
}

export const DraggableTimeWidget: React.FC<DraggableTimeWidgetProps> = ({
  currentSong,
  isPlaying,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [position, setPosition] = useState<DragPosition>({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionRef = useRef<DragPosition>({ x: 80, y: 80 });
  const widgetRef = useRef<HTMLDivElement | null>(null);

  // Update clock time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hydrate coordinate positions from localStorage upon component mounting
  useEffect(() => {
    const savedX = localStorage.getItem("time_widget_x");
    const savedY = localStorage.getItem("time_widget_y");
    if (savedX !== null && savedY !== null) {
      const parsedX = parseFloat(savedX);
      const parsedY = parseFloat(savedY);
      
      // Make sure they fit inside current window to protect against screen-shrink resets
      const safeX = Math.min(Math.max(20, parsedX), window.innerWidth - 220);
      const safeY = Math.min(Math.max(20, parsedY), window.innerHeight - 150);
      setPosition({ x: safeX, y: safeY });
      positionRef.current = { x: safeX, y: safeY };
    } else {
      // Default to top-left spacing
      setPosition({ x: 40, y: 40 });
      positionRef.current = { x: 40, y: 40 };
    }
  }, []);

  // Monitor viewport size to clamp widget coordinates within safe margins
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 200) - 20;
        const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 120) - 20;
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

  // Desktop Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with main mouse button (left click)
    if (e.button !== 0) return;
    
    // Prevent dragging if hitting text fields too aggressively
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
    e.preventDefault();
  };

  // Mobile Touch Start
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - positionRef.current.x,
        y: e.touches[0].clientY - positionRef.current.y,
      };
    }
  };

  // Dragging event loop handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const widgetWidth = widgetRef.current?.offsetWidth || 200;
      const widgetHeight = widgetRef.current?.offsetHeight || 110;

      // Safe outer boundaries padding
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

      const widgetWidth = widgetRef.current?.offsetWidth || 200;
      const widgetHeight = widgetRef.current?.offsetHeight || 110;

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
      localStorage.setItem("time_widget_x", positionRef.current.x.toString());
      localStorage.setItem("time_widget_y", positionRef.current.y.toString());
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

  // Formatter helpers
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  const datesFormatted = time.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

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
      id="time-widget-draggable"
    >
      {/* Decorative top drag bar slot mimicking the design HTML */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full" />

      {/* Draggable Header handle */}
      <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold letter-spacing-wider pb-1.5 border-b border-white/5 mb-1.5 font-display">
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-cyan-400 animate-pulse" />
          <span>Water Widget</span>
        </div>
        <div className="flex items-center gap-1">
          <GripHorizontal size={11} />
        </div>
      </div>

      {/* Clock display */}
      <div className="flex items-baseline gap-1 justify-center py-1 font-display tracking-wide text-white">
        <span className="text-3xl font-light">
          {hours}:{minutes}
        </span>
        <span className="text-xs font-bold text-cyan-400/80 tracking-[0.1em] self-center ml-1 uppercase">
          {parseInt(hours) >= 12 ? "PM" : "AM"}
        </span>
      </div>

      {/* Date */}
      <div className="text-center font-sans font-medium text-[10px] text-white/40 uppercase tracking-widest mb-1.5">
        {datesFormatted}
      </div>

      {/* Now Playing visual feedback on time widget */}
      {currentSong && (
        <div className="flex items-center justify-center gap-1.5 pt-1.5 border-t border-white/5 text-[9px] text-cyan-200/90 font-medium font-sans">
          <Music size={10} className={isPlaying ? "animate-spin" : ""} style={{ animationDuration: "3s" }} />
          <marquee className="max-w-[150px] overflow-hidden whitespace-nowrap scroll-smooth" scrollamount="2.5">
            {currentSong.title} - {currentSong.artist}
          </marquee>
        </div>
      )}
    </div>
  );
};

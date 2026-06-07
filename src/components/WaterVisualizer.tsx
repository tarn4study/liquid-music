import React, { useEffect, useRef } from "react";

interface WaterVisualizerProps {
  isPlaying: boolean;
  audioAnalyser: AnalyserNode | null;
  tempoSpeed: number; // multiplier for baseline movement
  themeGradient: string; // CSS gradient string
  bgImageUrl: string | null; // Selected background image from scanned folder
}

interface Droplet {
  id: number;
  x: number;
  y: number;
  r: number; // radius/size
  vy: number; // vertical velocity
  wobble: number; // current visual distort
  wobbleSpeed: number;
  wobbleAmount: number;
  targetWobble: number;
  alpha: number;
  active: boolean;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  speed: number;
  alpha: number;
}

export const WaterVisualizer: React.FC<WaterVisualizerProps> = ({
  isPlaying,
  audioAnalyser,
  tempoSpeed,
  themeGradient,
  bgImageUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropletsRef = useRef<Droplet[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);

  // Initializing default droplet population
  useEffect(() => {
    const droplets: Droplet[] = [];
    // Instantiate 15 random initial ambient drops
    for (let i = 0; i < 15; i++) {
      droplets.push({
        id: Math.random(),
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 3 + Math.random() * 8,
        vy: 0.2 + Math.random() * 0.8,
        wobble: 0,
        wobbleSpeed: 0.05 + Math.random() * 0.1,
        wobbleAmount: 0.1 + Math.random() * 0.1,
        targetWobble: 0,
        alpha: 0.6 + Math.random() * 0.3,
        active: true,
      });
    }
    dropletsRef.current = droplets;
  }, []);

  // Handle ResizeObserver to keep canvas fluidly fitted
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // trigger initial layout

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Canvas render and update loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = audioAnalyser ? new Uint8Array(audioAnalyser.frequencyBinCount) : null;

    const updateAndRender = (timestamp: number) => {
      const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;

      // Clear with elegant blend overlay for smooth trailing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let bassEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;
      let overallVolume = 0;

      // Extract Audio Analyser metrics
      if (audioAnalyser && isPlaying && dataArray) {
        audioAnalyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        // Bass bins (approx 20Hz - 150Hz)
        for (let i = 0; i < 10; i++) {
          bassEnergy += dataArray[i];
          sum += dataArray[i];
        }
        bassEnergy = bassEnergy / 10 / 255; // Normalized 0..1

        // Mid range (approx 150Hz - 2000Hz)
        for (let i = 10; i < 60; i++) {
          midEnergy += dataArray[i];
          sum += dataArray[i];
        }
        midEnergy = midEnergy / 50 / 255;

        // High range (above 2000Hz)
        for (let i = 60; i < 120; i++) {
          highEnergy += dataArray[i];
          sum += dataArray[i];
        }
        highEnergy = highEnergy / 60 / 255;

        overallVolume = sum / 120 / 255;
      } else {
        // Fallback pulsing if paused or simple lofi playing
        const pulse = Math.sin(timestamp * 0.002) * 0.5 + 0.5;
        bassEnergy = isPlaying ? 0.3 + pulse * 0.2 : 0.05;
        midEnergy = isPlaying ? 0.2 + pulse * 0.1 : 0.02;
        highEnergy = isPlaying ? 0.15 : 0.01;
        overallVolume = isPlaying ? 0.2 + pulse * 0.15 : 0.03;
      }

      // 1. Spawning droplets based on highEnergy (like splash) and tempo
      dropCounterRef.current += dt * (1 + highEnergy * 8 + tempoSpeed);
      if (dropCounterRef.current > 4) {
        dropCounterRef.current = 0;
        // Spawn standard drop at random top
        dropletsRef.current.push({
          id: Math.random(),
          x: Math.random() * canvas.width,
          y: -10,
          r: 2 + Math.random() * 6,
          vy: (0.4 + Math.random() * 1.2) * (1 + bassEnergy * 0.8),
          wobble: 0,
          wobbleSpeed: 0.08 + Math.random() * 0.1,
          wobbleAmount: 0.1,
          targetWobble: 0,
          alpha: 0.4 + Math.random() * 0.4,
          active: true,
        });
      }

      // 2. Physics & Draw Droplets with realistic magnification refractive lensing
      const drops = dropletsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        if (!drop.active) continue;

        // Gravity slides drops down, accelerated by bass/volume
        const speedMultiplier = isPlaying ? (1 + bassEnergy * 2.0 + tempoSpeed * 0.5) : 0.4;
        drop.y += drop.vy * speedMultiplier * 60 * dt;

        // Wobbling is driven by bass and mid frequencies!
        drop.wobble += drop.wobbleSpeed;
        const currentPulse = Math.sin(drop.wobble) * drop.wobbleAmount;
        const dynamicWobble = currentPulse + (isPlaying ? bassEnergy * 0.5 : 0);

        // Slow sliding track logic - smaller ones cling, larger ones run faster
        if (drop.r > 6 && Math.random() < 0.02) {
          drop.vy += 0.1; // accelerate sliding
        }

        // Render drop - glowing glass sphere with custom highlights
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;

        const grad = ctx.createRadialGradient(
          drop.x - drop.r * 0.2,
          drop.y - drop.r * 0.2,
          drop.r * 0.1,
          drop.x,
          drop.y,
          drop.r
        );
        // Frosted liquid refraction
        grad.addColorStop(0, `rgba(255, 255, 255, ${drop.alpha + 0.15})`);
        grad.addColorStop(0.3, `rgba(255, 255, 255, ${drop.alpha * 0.6})`);
        grad.addColorStop(0.7, `rgba(240, 250, 255, ${drop.alpha * 0.2})`);
        grad.addColorStop(0.9, `rgba(180, 220, 255, ${drop.alpha * 0.4})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0.05)`);

        ctx.beginPath();
        // Distort drop into oval/pear shape based on wobble and downwards motion
        const rx = drop.r * (1 + dynamicWobble * 0.4);
        const ry = drop.r * (1 - dynamicWobble * 0.2 + (drop.vy > 1.2 ? 0.15 : 0));
        ctx.ellipse(drop.x, drop.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Highlighting highlight (glistening water droplet effect)
        ctx.beginPath();
        ctx.arc(drop.x - rx * 0.3, drop.y - ry * 0.3, rx * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fill();

        ctx.restore();

        // 3. Merging droplets check (sliding drops swallow tiny stationary ones)
        for (let j = i + 1; j < drops.length; j++) {
          const other = drops[j];
          if (!other.active) continue;

          const dx = drop.x - other.x;
          const dy = drop.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Close proximity triggers merger
          if (dist < (drop.r + other.r) * 0.85) {
            // merge other into drop
            const totalArea = Math.PI * drop.r * drop.r + Math.PI * other.r * other.r;
            drop.r = Math.min(22, Math.sqrt(totalArea / Math.PI)); // cap maximum size protect screen
            // move drop center intermediate
            drop.x = (drop.x * drop.r + other.x * other.r) / (drop.r + other.r);
            drop.vy = Math.max(drop.vy, other.vy) * 1.1; // gains velocity running down
            drop.alpha = Math.max(drop.alpha, other.alpha);
            other.active = false;

            // Trigger micro water ripple around merger spot
            ripplesRef.current.push({
              x: drop.x,
              y: drop.y,
              r: 1,
              maxR: drop.r * 2.5,
              speed: 40,
              alpha: 0.3,
            });
          }
        }

        // Clip out of screen
        if (drop.y - drop.r > canvas.height) {
          drop.active = false;
        }
      }

      // Purge inactive drops
      dropletsRef.current = drops.filter((d) => d.active);

      // 4. Update and Drawing Ripples (expanding liquid waves on glass)
      const ripples = ripplesRef.current;
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        r.r += r.speed * dt * (1 + bassEnergy * 1.5); // high volume expands ripples faster
        r.alpha -= dt * 0.95; // fade effect

        if (r.alpha <= 0) {
          continue;
        }

        // Glass ripple refracting glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.4})`;
        ctx.lineWidth = 1.5 + (1 - r.alpha) * 3; // ring thickens as it spreads
        ctx.stroke();

        // Inner soft ripple echo
        if (r.r > 15) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r - 12, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.15})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Purge dead ripples
      ripplesRef.current = ripples.filter((r) => r.alpha > 0);

      // Periodically trigger lofi ambient ripples if music is playing
      if (isPlaying && Math.random() < 0.015 * (1 + bassEnergy * 4)) {
        ripplesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 2,
          maxR: 30 + Math.random() * 80 + (bassEnergy * 100),
          speed: 35 + Math.random() * 30,
          alpha: 0.3 + bassEnergy * 0.4,
        });
      }

      animationId = requestAnimationFrame(updateAndRender);
    };

    animationId = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, audioAnalyser, tempoSpeed]);

  // Click on screen handler - generate expanding custom ripples at mouse coordinates
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create a powerful primary ripple with high speed
    ripplesRef.current.push({
      x,
      y,
      r: 1,
      maxR: 160 + Math.random() * 80,
      speed: 120,
      alpha: 0.7,
    });

    // Create 2 subordinate droplets splashes!
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 20;
      dropletsRef.current.push({
        id: Math.random(),
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        r: 3 + Math.random() * 5,
        vy: 0.5 + Math.random() * 1.5,
        wobble: 0,
        wobbleSpeed: 0.1,
        wobbleAmount: 0.2,
        targetWobble: 0,
        alpha: 0.7,
        active: true,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none transition-all duration-1000 ease-in-out bg-[#0a0c10]"
      style={{
        background: bgImageUrl ? `url(${bgImageUrl})` : undefined,
        backgroundSize: bgImageUrl ? "cover" : undefined,
        backgroundPosition: bgImageUrl ? "center" : undefined,
      }}
      id="water-drop-canvas-wrapper"
    >
      {/* Background Atmosphere: Simulating blurred cover art */}
      {!bgImageUrl && (
        <div className="absolute inset-0 z-0" id="ambient-blend-atmosphere">
          <div 
            className="absolute inset-0 opacity-45 blur-[120px] scale-110 transition-all duration-1000 ease-in-out" 
            style={{ background: themeGradient }} 
            id="immersive-backdrop-gradient" 
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Glassmorphism blur frost overlays to merge art beautifully */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[8px] pointer-events-none" id="glass-backdrop-blur" />
      <div className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/50 pointer-events-none" id="vignette-overlay" />

      {/* Interactive Droplet/Ripple Canvas layer */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-pointer touch-none z-[5]"
        id="water-droplets-physics-canvas"
      />
    </div>
  );
};

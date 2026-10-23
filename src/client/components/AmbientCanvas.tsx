import { useEffect, useRef } from "react";

interface AmbientCanvasProps {
  playing: boolean;
  className?: string;
}

function hash(index: number): number {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function drawField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
): void {
  if (w < 8 || h < 8) return;
  ctx.clearRect(0, 0, w, h);

  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  sky.addColorStop(0, "#04080c");
  sky.addColorStop(0.42, "#0a1014");
  sky.addColorStop(0.72, "#171614");
  sky.addColorStop(1, "#221b14");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars.
  for (let index = 0; index < 90; index += 1) {
    const x = hash(index * 3.1) * w;
    const y = hash(index * 7.7 + 2) * h * 0.52;
    const twinkle = 0.35 + 0.35 * Math.sin(time * 0.35 + index * 1.7);
    const radius = hash(index * 5.3) > 0.86 ? 1.3 : 0.7;
    ctx.fillStyle = `rgba(226, 232, 224, ${twinkle * 0.7})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moon and its halo.
  const moonX = w * 0.72;
  const moonY = h * 0.19;
  const halo = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, h * 0.28);
  halo.addColorStop(0, "rgba(244, 226, 190, 0.2)");
  halo.addColorStop(0.35, "rgba(238, 214, 172, 0.07)");
  halo.addColorStop(1, "rgba(238, 214, 172, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(moonX - h * 0.3, moonY - h * 0.3, h * 0.6, h * 0.6);
  ctx.fillStyle = "rgba(246, 232, 202, 0.88)";
  ctx.beginPath();
  ctx.arc(moonX, moonY, Math.max(5, h * 0.026), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(10, 14, 15, 0.18)";
  ctx.beginPath();
  ctx.arc(moonX - h * 0.008, moonY + h * 0.006, Math.max(4, h * 0.023), 0, Math.PI * 2);
  ctx.fill();

  // A slow cloud veil.
  const cloudShift = Math.sin(time * 0.018) * w * 0.06;
  const cloud = ctx.createLinearGradient(0, h * 0.28, 0, h * 0.44);
  cloud.addColorStop(0, "rgba(120, 132, 130, 0)");
  cloud.addColorStop(0.5, "rgba(120, 132, 130, 0.06)");
  cloud.addColorStop(1, "rgba(120, 132, 130, 0)");
  ctx.fillStyle = cloud;
  ctx.fillRect(-w * 0.1 + cloudShift, h * 0.26, w * 1.3, h * 0.2);

  const driftX = Math.sin(time * 0.02) * w * 0.006;
  const driftY = Math.cos(time * 0.013) * h * 0.003;
  ctx.save();
  ctx.translate(driftX, driftY);

  // Far ridge.
  const drawRidge = (base: number, amplitude: number, color: string, phase: number) => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.05, h * base);
    for (let step = 0; step <= 8; step += 1) {
      const x = -w * 0.05 + (w * 1.1 * step) / 8;
      const y =
        h * base +
        Math.sin(step * 1.4 + phase) * h * amplitude +
        Math.cos(step * 0.7 + phase * 1.7) * h * amplitude * 0.45;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w * 1.05, h);
    ctx.lineTo(-w * 0.05, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  drawRidge(0.585, 0.026, "#0d1414", 0.4);
  drawRidge(0.645, 0.03, "#0a1010", 2.2);
  drawRidge(0.71, 0.024, "#070b0a", 4.1);

  // The far house with one warm window.
  const houseX = w * 0.215;
  const houseY = h * 0.625;
  const houseW = w * 0.052;
  const houseH = h * 0.055;
  ctx.fillStyle = "#050807";
  ctx.fillRect(houseX, houseY, houseW, houseH);
  ctx.beginPath();
  ctx.moveTo(houseX - w * 0.008, houseY);
  ctx.lineTo(houseX + houseW * 0.5, houseY - h * 0.034);
  ctx.lineTo(houseX + houseW + w * 0.008, houseY);
  ctx.closePath();
  ctx.fill();
  const windowX = houseX + houseW * 0.3;
  const windowY = houseY + houseH * 0.3;
  const windowW = Math.max(2, houseW * 0.16);
  const windowH = Math.max(2, houseH * 0.2);
  ctx.fillStyle = "rgba(255, 196, 116, 0.92)";
  ctx.fillRect(windowX, windowY, windowW, windowH);
  const windowGlow = ctx.createRadialGradient(
    windowX + windowW * 0.5,
    windowY + windowH * 0.5,
    0,
    windowX + windowW * 0.5,
    windowY + windowH * 0.5,
    h * 0.09
  );
  windowGlow.addColorStop(0, "rgba(255, 187, 105, 0.26)");
  windowGlow.addColorStop(1, "rgba(255, 187, 105, 0)");
  ctx.fillStyle = windowGlow;
  ctx.fillRect(windowX - h * 0.1, windowY - h * 0.1, h * 0.2, h * 0.2);

  // Field.
  const field = ctx.createLinearGradient(0, h * 0.7, 0, h);
  field.addColorStop(0, "#080c0a");
  field.addColorStop(1, "#030504");
  ctx.fillStyle = field;
  ctx.fillRect(-w * 0.1, h * 0.7, w * 1.2, h * 0.3);

  // Grass.
  for (let index = 0; index < 150; index += 1) {
    const x = hash(index * 2.9) * w * 1.1 - w * 0.05;
    const base = h * (0.74 + hash(index * 4.1) * 0.26);
    const height = h * (0.012 + hash(index * 6.3) * 0.045);
    const sway = Math.sin(time * 0.7 + index) * w * 0.0025;
    const alpha = 0.04 + hash(index * 8.9) * 0.08;
    ctx.strokeStyle = `rgba(138, 156, 124, ${alpha})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + sway, base - height * 0.6, x + sway * 1.7, base - height);
    ctx.stroke();
  }

  // Fireflies.
  for (let index = 0; index < 16; index += 1) {
    const baseX = hash(index * 4.7 + 1) * w;
    const baseY = h * (0.58 + hash(index * 8.1) * 0.3);
    const x = baseX + Math.sin(time * 0.22 + index * 2.3) * w * 0.018;
    const y = baseY + Math.cos(time * 0.18 + index * 1.4) * h * 0.012;
    const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(time * 0.6 + index * 1.9));
    const radius = Math.max(0.8, w * 0.0016);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 7);
    glow.addColorStop(0, `rgba(255, 198, 120, ${0.6 * pulse})`);
    glow.addColorStop(1, "rgba(255, 198, 120, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 7, y - radius * 7, radius * 14, radius * 14);
    ctx.fillStyle = `rgba(255, 221, 164, ${0.9 * pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Film grain.
  for (let index = 0; index < 260; index += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillStyle = `rgba(236, 230, 216, ${Math.random() * 0.028})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Lens vignette and warm grade.
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.18, w * 0.5, h * 0.45, h * 0.82);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  const warmth = ctx.createLinearGradient(0, h * 0.45, 0, h);
  warmth.addColorStop(0, "rgba(60, 38, 20, 0)");
  warmth.addColorStop(1, "rgba(60, 38, 20, 0.12)");
  ctx.fillStyle = warmth;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);
}

export function AmbientCanvas({ playing, className }: AmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let lastDraw = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawField(context, width, height, timeRef.current);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    if (!reduced && playing) {
      const tick = (now: number) => {
        if (!last) last = now;
        const delta = Math.min(100, now - last);
        last = now;
        timeRef.current += delta / 1000;
        if (timeRef.current - lastDraw > 0.04) {
          lastDraw = timeRef.current;
          drawField(context, width, height, timeRef.current);
        }
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      className={className ? `ambient-canvas ${className}` : "ambient-canvas"}
      role="img"
      aria-label="A slow nocturnal film: moonlight over a dark field, a distant house with one warm window, and drifting fireflies."
    />
  );
}

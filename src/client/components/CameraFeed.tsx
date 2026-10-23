import { useEffect, useRef } from "react";
import type { CameraMode } from "../../shared/types";

interface CameraFeedProps {
  mode: CameraMode;
  active: boolean;
  deviceId: string;
  className?: string;
}

const MONO = '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace';

function drawScene(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: CameraMode,
  time: number,
  active: boolean
): void {
  if (width < 8 || height < 8) return;
  const ctx = context;
  const w = width;
  const h = height;

  ctx.clearRect(0, 0, w, h);

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#05080a");
  sky.addColorStop(0.55, "#0a1113");
  sky.addColorStop(1, "#080a09");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // House wall, right of the frame.
  const wall = ctx.createLinearGradient(w * 0.54, 0, w, h);
  wall.addColorStop(0, "#0d1314");
  wall.addColorStop(0.55, "#111718");
  wall.addColorStop(1, "#090d0e");
  ctx.fillStyle = wall;
  ctx.fillRect(w * 0.54, 0, w * 0.46, h);

  // Siding lines.
  ctx.strokeStyle = "rgba(220, 210, 190, 0.035)";
  ctx.lineWidth = 1;
  for (let y = h * 0.04; y < h * 0.82; y += h * 0.055) {
    ctx.beginPath();
    ctx.moveTo(w * 0.56, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Porch floor.
  const floor = ctx.createLinearGradient(0, h * 0.76, 0, h);
  floor.addColorStop(0, "#0b0e0d");
  floor.addColorStop(1, "#040606");
  ctx.fillStyle = floor;
  ctx.fillRect(0, h * 0.76, w, h * 0.24);

  ctx.strokeStyle = "rgba(220, 210, 190, 0.055)";
  for (let index = 1; index < 5; index += 1) {
    const y = h * (0.76 + index * 0.048);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Door.
  const doorX = w * 0.645;
  const doorY = h * 0.1;
  const doorW = w * 0.245;
  const doorH = h * 0.66;
  const door = ctx.createLinearGradient(doorX, doorY, doorX + doorW, doorY + doorH);
  door.addColorStop(0, "#0c1112");
  door.addColorStop(1, "#080b0c");
  ctx.fillStyle = door;
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.strokeStyle = "rgba(230, 215, 190, 0.14)";
  ctx.lineWidth = 1;
  ctx.strokeRect(doorX + 0.5, doorY + 0.5, doorW - 1, doorH - 1);
  ctx.strokeStyle = "rgba(230, 215, 190, 0.07)";
  ctx.strokeRect(doorX + w * 0.025, doorY + h * 0.04, doorW - w * 0.05, doorH * 0.36);
  ctx.strokeRect(doorX + w * 0.025, doorY + h * 0.44, doorW - w * 0.05, doorH * 0.42);

  const handleX = doorX + doorW * 0.83;
  const handleY = doorY + doorH * 0.52;
  ctx.fillStyle = "rgba(232, 184, 118, 0.55)";
  ctx.beginPath();
  ctx.arc(handleX, handleY, Math.max(1.5, w * 0.0045), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(232, 184, 118, 0.18)";
  ctx.beginPath();
  ctx.arc(handleX, handleY, Math.max(4, w * 0.012), 0, Math.PI * 2);
  ctx.stroke();

  // Porch light.
  const flicker = 0.86 + Math.sin(time * 1.6) * 0.05 + Math.sin(time * 4.1) * 0.02;
  const lightX = w * 0.605;
  const lightY = h * 0.12;
  const glow = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, w * 0.62);
  glow.addColorStop(0, `rgba(255, 196, 128, ${0.34 * flicker})`);
  glow.addColorStop(0.35, `rgba(255, 172, 98, ${0.12 * flicker})`);
  glow.addColorStop(1, "rgba(255, 172, 98, 0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Light fixture.
  ctx.fillStyle = "rgba(255, 207, 148, 0.72)";
  ctx.beginPath();
  ctx.moveTo(lightX - w * 0.018, lightY - h * 0.018);
  ctx.lineTo(lightX + w * 0.018, lightY - h * 0.018);
  ctx.lineTo(lightX + w * 0.028, lightY + h * 0.008);
  ctx.lineTo(lightX - w * 0.028, lightY + h * 0.008);
  ctx.closePath();
  ctx.fill();

  // A quiet plant at the left edge.
  ctx.strokeStyle = "rgba(120, 138, 112, 0.25)";
  ctx.lineWidth = Math.max(1, w * 0.002);
  for (let index = 0; index < 5; index += 1) {
    const baseX = w * 0.08;
    const baseY = h * 0.83;
    const spread = (index - 2) * w * 0.018;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(baseX + spread, baseY - h * 0.12, baseX + spread * 1.7, baseY - h * 0.2);
    ctx.stroke();
  }

  const baseY = h * 0.805;
  const personHeight = h * 0.54;
  const breathing = Math.sin(time * 1.15) * h * 0.0016;
  const cx = w * (mode === "sundown" ? 0.355 : 0.385);
  const headRadius = personHeight * 0.088;
  const headY = baseY - personHeight + headRadius + breathing;
  const shoulderY = headY + headRadius * 1.55;
  const hipY = baseY - personHeight * 0.38;
  const torsoHalf = personHeight * 0.145;

  if (mode === "coldchain") {
    // Sun raking across the porch.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.translate(w * 0.94, -h * 0.1);
    ctx.rotate(0.52);
    for (let index = 0; index < 5; index += 1) {
      ctx.fillStyle = `rgba(255, 205, 145, ${0.035 + index * 0.006})`;
      ctx.fillRect(-w * 0.06 - index * w * 0.11, 0, w * 0.032, h * 1.5);
    }
    ctx.restore();

    // Heat shimmer above the parcel.
    ctx.strokeStyle = "rgba(255, 200, 140, 0.12)";
    ctx.lineWidth = 1;
    for (let index = 0; index < 4; index += 1) {
      const y = h * (0.66 + index * 0.018) + Math.sin(time * 1.6 + index) * 1.4;
      ctx.beginPath();
      ctx.moveTo(w * 0.36, y);
      ctx.bezierCurveTo(w * 0.44, y - 3, w * 0.52, y + 3, w * 0.6, y);
      ctx.stroke();
    }
  } else {
    // Person silhouette.
    ctx.fillStyle = "#050707";

    // Legs.
    ctx.beginPath();
    ctx.roundRect(cx - torsoHalf * 0.72, hipY, torsoHalf * 0.55, baseY - hipY, 2);
    ctx.roundRect(cx + torsoHalf * 0.18, hipY, torsoHalf * 0.55, baseY - hipY, 2);
    ctx.fill();

    // Torso.
    ctx.beginPath();
    ctx.moveTo(cx - torsoHalf, shoulderY);
    ctx.quadraticCurveTo(cx - torsoHalf * 1.06, hipY - h * 0.06, cx - torsoHalf * 0.8, hipY + h * 0.02);
    ctx.lineTo(cx + torsoHalf * 0.8, hipY + h * 0.02);
    ctx.quadraticCurveTo(cx + torsoHalf * 1.06, hipY - h * 0.06, cx + torsoHalf, shoulderY);
    ctx.quadraticCurveTo(cx, shoulderY - h * 0.02, cx - torsoHalf, shoulderY);
    ctx.fill();

    // Neck.
    ctx.fillRect(cx - headRadius * 0.28, headY + headRadius * 0.62, headRadius * 0.56, headRadius * 0.8);

    // Head.
    ctx.beginPath();
    ctx.arc(cx, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Arms.
    ctx.strokeStyle = "#050707";
    ctx.lineWidth = Math.max(4, personHeight * 0.032);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - torsoHalf * 0.92, shoulderY + h * 0.015);
    ctx.lineTo(cx - torsoHalf * 1.1, hipY + h * 0.06);
    ctx.stroke();

    if (mode === "sundown") {
      ctx.beginPath();
      ctx.moveTo(cx + torsoHalf * 0.9, shoulderY + h * 0.02);
      ctx.quadraticCurveTo(cx + torsoHalf * 1.5, shoulderY + h * 0.04, cx + w * 0.115, shoulderY + h * 0.12);
      ctx.stroke();

      // Keys, catching the porch light.
      const keyX = cx + w * 0.125;
      const keyY = shoulderY + h * 0.13;
      const glint = 0.55 + Math.sin(time * 2.4) * 0.2;
      ctx.strokeStyle = `rgba(247, 199, 132, ${glint})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(keyX, keyY, Math.max(2, w * 0.008), 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(keyX + w * 0.006, keyY + h * 0.004);
      ctx.lineTo(keyX + w * 0.028, keyY + h * 0.018);
      ctx.moveTo(keyX + w * 0.006, keyY + h * 0.012);
      ctx.lineTo(keyX + w * 0.026, keyY + h * 0.026);
      ctx.stroke();
    } else {
      // Courier: cap, parcel and signature tablet.
      ctx.beginPath();
      ctx.moveTo(cx + torsoHalf * 0.9, shoulderY + h * 0.02);
      ctx.quadraticCurveTo(cx + torsoHalf * 1.4, shoulderY + h * 0.12, cx + torsoHalf * 0.7, hipY);
      ctx.stroke();

      ctx.fillStyle = "#050707";
      ctx.beginPath();
      ctx.ellipse(cx, headY - headRadius * 0.62, headRadius * 1.18, headRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - headRadius * 1.25, headY - headRadius * 0.72, headRadius * 1.45, headRadius * 0.28);

      const boxW = w * 0.15;
      const boxH = h * 0.115;
      const boxX = cx - boxW * 0.55;
      const boxY = hipY - h * 0.075;
      ctx.fillStyle = "#241d16";
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = "rgba(240, 198, 144, 0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
      ctx.fillStyle = "rgba(240, 198, 144, 0.32)";
      ctx.fillRect(boxX + boxW * 0.46, boxY, boxW * 0.08, boxH);

      const padX = cx + torsoHalf * 1.12;
      const padY = shoulderY + h * 0.08;
      ctx.save();
      ctx.translate(padX, padY);
      ctx.rotate(-0.16);
      ctx.fillStyle = "rgba(206, 193, 171, 0.72)";
      ctx.fillRect(0, 0, w * 0.062, h * 0.088);
      ctx.strokeStyle = "rgba(20, 22, 20, 0.55)";
      for (let index = 0; index < 4; index += 1) {
        ctx.beginPath();
        ctx.moveTo(w * 0.009, h * (0.02 + index * 0.014));
        ctx.lineTo(w * 0.05, h * (0.02 + index * 0.014));
        ctx.stroke();
      }
      ctx.restore();
    }

    // Rim light from the porch.
    ctx.strokeStyle = "rgba(244, 187, 116, 0.34)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, headY, headRadius + 1, -0.75, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + torsoHalf - 1, shoulderY + 2);
    ctx.quadraticCurveTo(cx + torsoHalf * 1.02, hipY - h * 0.06, cx + torsoHalf * 0.78, hipY);
    ctx.stroke();
  }

  if (mode === "coldchain") {
    const boxW = w * 0.19;
    const boxH = h * 0.125;
    const boxX = w * 0.405;
    const boxY = h * 0.695;
    const parcel = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    parcel.addColorStop(0, "#d9cfbd");
    parcel.addColorStop(1, "#a89d89");
    ctx.fillStyle = parcel;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "rgba(240, 214, 172, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    ctx.fillStyle = "rgba(72, 112, 92, 0.9)";
    const crossX = boxX + boxW * 0.5;
    const crossY = boxY + boxH * 0.45;
    const crossW = Math.max(2, boxW * 0.055);
    ctx.fillRect(crossX - crossW * 0.5, crossY - crossW * 2, crossW, crossW * 4);
    ctx.fillRect(crossX - crossW * 2, crossY - crossW * 0.5, crossW * 4, crossW);

    ctx.fillStyle = "rgba(20, 24, 20, 0.65)";
    ctx.font = `500 ${Math.max(6, Math.round(w * 0.012))}px ${MONO}`;
    ctx.fillText("INSULIN · 4°C", boxX + boxW * 0.12, boxY + boxH * 0.85);
  }

  // Detection box.
  const subject =
    mode === "coldchain"
      ? {
          x: w * 0.385,
          y: h * 0.665,
          width: w * 0.235,
          height: h * 0.17,
          label: "PARCEL · 34°C · SUN"
        }
      : {
          x: cx - w * 0.105,
          y: headY - headRadius * 1.5,
          width: w * 0.225,
          height: personHeight * 0.99,
          label: mode === "sundown" ? "PERSON · 0.98 · KEYS" : "COURIER · 0.96 · PARCEL"
        };

  const amber = active ? "rgba(255, 185, 110, 0.94)" : "rgba(232, 173, 108, 0.72)";
  ctx.save();
  ctx.strokeStyle = amber;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(subject.x, subject.y, subject.width, subject.height);
  ctx.setLineDash([]);

  const tick = Math.max(6, w * 0.018);
  ctx.lineWidth = 1.5;
  const corners: Array<[number, number, number, number]> = [
    [subject.x, subject.y, 1, 1],
    [subject.x + subject.width, subject.y, -1, 1],
    [subject.x, subject.y + subject.height, 1, -1],
    [subject.x + subject.width, subject.y + subject.height, -1, -1]
  ];
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + dx * tick, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * tick);
    ctx.stroke();
  }

  ctx.font = `500 ${Math.max(7, Math.round(w * 0.016))}px ${MONO}`;
  const labelWidth = ctx.measureText(subject.label).width + 12;
  const labelY = Math.max(4, subject.y - 15);
  ctx.fillStyle = "rgba(4, 7, 7, 0.88)";
  ctx.fillRect(subject.x, labelY, labelWidth, 15);
  ctx.strokeStyle = amber;
  ctx.lineWidth = 1;
  ctx.strokeRect(subject.x + 0.5, labelY + 0.5, labelWidth - 1, 14);
  ctx.fillStyle = "#f2c58f";
  ctx.fillText(subject.label, subject.x + 6, labelY + 10.5);
  ctx.restore();

  // Camera chrome.
  ctx.save();
  ctx.font = `500 ${Math.max(7, Math.round(w * 0.015))}px ${MONO}`;
  ctx.fillStyle = "rgba(236, 228, 214, 0.72)";
  ctx.fillText("RING · FRONT DOOR", w * 0.035, h * 0.07);

  ctx.fillStyle = "rgba(224, 124, 92, 0.95)";
  ctx.beginPath();
  ctx.arc(w * 0.025, h * 0.065, Math.max(1.5, w * 0.004), 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(236, 228, 214, 0.5)";
  ctx.fillText("CAM 02 · 1440P", w * 0.965, h * 0.07);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(236, 228, 214, 0.62)";
  ctx.fillText("2026-10-23  02:15:07", w * 0.035, h * 0.955);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(236, 228, 214, 0.42)";
  ctx.fillText("H.264 · 12 FPS", w * 0.965, h * 0.955);
  ctx.restore();

  // Moving scan band.
  const bandY = ((time * 0.028) % 1.2) * h - h * 0.1;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + h * 0.16);
  band.addColorStop(0, "rgba(255, 255, 255, 0)");
  band.addColorStop(0.5, "rgba(255, 255, 255, 0.022)");
  band.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, h * 0.16);

  // Sensor grain.
  for (let index = 0; index < 210; index += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const alpha = Math.random() * 0.05;
    ctx.fillStyle = `rgba(235, 230, 218, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Vignette.
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.46, h * 0.2, w * 0.5, h * 0.46, h * 0.78);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.52)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

export function CameraFeed({ mode, active, deviceId, className }: CameraFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    let elapsed = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(context, width, height, mode, elapsed, active);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    if (!reduced) {
      const tick = (now: number) => {
        if (!last) last = now;
        const delta = Math.min(120, now - last);
        last = now;
        elapsed += delta / 1000;
        if (elapsed - lastDraw > 0.085) {
          lastDraw = elapsed;
          drawScene(context, width, height, mode, elapsed, active);
        }
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [active, mode]);

  const label =
    mode === "sundown"
      ? "Simulated Ring camera view: a person stands at the front door at night, holding a keyring."
      : mode === "courier"
        ? "Simulated Ring camera view: a courier holds a parcel and a signature tablet at the front door."
        : "Simulated Ring camera view: a cold-chain parcel sits in direct sun on the porch.";

  return (
    <canvas
      ref={canvasRef}
      className={className ? `camera-feed ${className}` : "camera-feed"}
      role="img"
      aria-label={`${label} Device ${deviceId}.`}
    />
  );
}

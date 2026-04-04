import { useEffect, useRef } from "react";
import clsx from "clsx";

const PARTICLE_DENSITY = 0.00009;
const BG_PARTICLE_DENSITY = 0.00003;
const POINTER_RADIUS = 160;

interface ParticleBackgroundProps {
  className?: string;
}

type ParticleLayer = "foreground" | "background";

type Particle = {
  alpha: number;
  color: string;
  layer: ParticleLayer;
  rotation: number;
  size: number;
  spin: number;
  twinkleOffset: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const withAlpha = (color: string, alpha: number) => {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((value) => value + value)
            .join("")
        : hex;

    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  if (color.startsWith("rgba(")) {
    return color.replace(
      /rgba\((.+?),\s*[\d.]+\)$/,
      `rgba($1, ${alpha.toFixed(3)})`,
    );
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha.toFixed(3)})`);
  }

  return color;
};

const readThemeColor = (name: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
};

const createParticle = (
  width: number,
  height: number,
  palette: string[],
  layer: ParticleLayer,
): Particle => {
  const speed = layer === "background" ? randomBetween(0.08, 0.2) : randomBetween(0.18, 0.45);
  const angle = randomBetween(0, Math.PI * 2);

  return {
    alpha: layer === "background" ? randomBetween(0.1, 0.22) : randomBetween(0.22, 0.55),
    color: palette[Math.floor(Math.random() * palette.length)],
    layer,
    rotation: randomBetween(0, Math.PI * 2),
    size: layer === "background" ? randomBetween(1.2, 2.2) : randomBetween(1.8, 3.6),
    spin: randomBetween(-0.0035, 0.0035),
    twinkleOffset: randomBetween(0, Math.PI * 2),
    twinkleSpeed: randomBetween(0.8, 1.8),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    x: randomBetween(0, width),
    y: randomBetween(0, height),
  };
};

const drawStar = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  color: string,
) => {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.lineCap = "round";
  context.strokeStyle = color;
  context.fillStyle = color;

  context.beginPath();
  context.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
  context.fill();

  context.lineWidth = Math.max(0.8, radius * 0.22);
  context.beginPath();
  context.moveTo(-radius, 0);
  context.lineTo(radius, 0);
  context.moveTo(0, -radius);
  context.lineTo(0, radius);
  context.stroke();

  context.lineWidth = Math.max(0.6, radius * 0.14);
  context.beginPath();
  context.moveTo(-radius * 0.62, -radius * 0.62);
  context.lineTo(radius * 0.62, radius * 0.62);
  context.moveTo(radius * 0.62, -radius * 0.62);
  context.lineTo(-radius * 0.62, radius * 0.62);
  context.stroke();
  context.restore();
};

const wrapParticle = (particle: Particle, width: number, height: number) => {
  const margin = 24;

  if (particle.x < -margin) {
    particle.x = width + margin;
  } else if (particle.x > width + margin) {
    particle.x = -margin;
  }

  if (particle.y < -margin) {
    particle.y = height + margin;
  } else if (particle.y > height + margin) {
    particle.y = -margin;
  }
};

const ParticleBackground = ({ className }: ParticleBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const pointer = {
      active: false,
      x: 0,
      y: 0,
    };

    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastTime = performance.now();
    let particles: Particle[] = [];
    let text = readThemeColor("--text-color", "#f4f6ff");

    const buildParticles = () => {
      const foregroundCount = Math.max(
        18,
        Math.round(width * height * PARTICLE_DENSITY),
      );
      const backgroundCount = Math.max(
        8,
        Math.round(width * height * BG_PARTICLE_DENSITY),
      );

      const foregroundPalette = [text];
      const backgroundPalette = [text];

      particles = [
        ...Array.from({ length: backgroundCount }, () =>
          createParticle(width, height, backgroundPalette, "background"),
        ),
        ...Array.from({ length: foregroundCount }, () =>
          createParticle(width, height, foregroundPalette, "foreground"),
        ),
      ];
    };

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(rect.width));
      const nextHeight = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = nextWidth;
      height = nextHeight;
      text = readThemeColor("--text-color", text);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      pointer.active = isInside;

      if (!isInside) {
        return;
      }

      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };

    const handlePointerEnd = () => {
      pointer.active = false;
    };

    const render = (time: number) => {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx * delta * 0.06;
        particle.y += particle.vy * delta * 0.06;
        particle.rotation += particle.spin * delta;

        let drawX = particle.x;
        let drawY = particle.y;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);

          if (distance > 0 && distance < POINTER_RADIUS) {
            const force = (POINTER_RADIUS - distance) / POINTER_RADIUS;
            const repelDistance =
              force * force * (particle.layer === "background" ? 18 : 44);

            drawX += (dx / distance) * repelDistance;
            drawY += (dy / distance) * repelDistance;
          }
        }

        wrapParticle(particle, width, height);

        const twinkle =
          0.72 +
          0.28 *
            Math.sin(time * 0.002 * particle.twinkleSpeed + particle.twinkleOffset);

        drawStar(
          context,
          drawX,
          drawY,
          particle.size,
          particle.rotation,
          withAlpha(particle.color, particle.alpha * twinkle),
        );
      }

      frameId = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(container);
    resizeCanvas();

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerEnd, { passive: true });
    window.addEventListener("pointercancel", handlePointerEnd, { passive: true });
    window.addEventListener("blur", handlePointerEnd);

    frameId = window.requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      window.removeEventListener("blur", handlePointerEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={clsx(
        "absolute inset-0 h-full w-full overflow-hidden cursor-default",
        className,
      )}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
};

export default ParticleBackground;

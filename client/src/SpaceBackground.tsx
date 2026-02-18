import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

/**
 * SpaceBackground Component
 * 
 * Renders an animated space background with:
 * - Parallax stars moving at different depths (warp-speed effect)
 * - Twinkling star animations
 * - Subtle nebula particle effects
 * - Responsive to window resizing
 * - Optimized canvas rendering with requestAnimationFrame
 * 
 * Usage:
 * <SpaceBackground>
 *   <YourContent />
 * </SpaceBackground>
 */
export const SpaceBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef<number>(0);

  // Generate initial stars
  const generateStars = (width: number, height: number, count: number = 300): Star[] => {
    return Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 100,
      size: Math.random() * 1.5,
      opacity: Math.random() * 0.7 + 0.3,
      color: ['#ffffff', '#fff9e6', '#e6f3ff', '#ffe6f0'][Math.floor(Math.random() * 4)]
    }));
  };

  // Create nebula particle
  const createParticle = (x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1 + 0.5;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.3 + 0.1,
      life: 0,
      maxLife: Math.random() * 200 + 100,
      color: ['#9d4edd', '#7b2cbf', '#5a189a', '#3c096c', '#240046'][
        Math.floor(Math.random() * 5)
      ]
    };
  };

  // Draw stars with parallax effect (warp speed)
  const drawStars = (
    ctx: CanvasRenderingContext2D,
    _width: number,
    height: number,
    time: number
  ) => {
    starsRef.current.forEach(star => {
      // Parallax effect: stars move based on depth (z)
      const depth = star.z / 100;
      const speed = depth * 0.5;
      const offsetY = (time * speed) % height;

      // Star position with parallax
      const x = star.x;
      const y = (star.y + offsetY) % height;

      // Twinkle effect
      const twinkle = Math.sin(time * 0.05 + star.x + star.y) * 0.3 + 0.7;
      const finalOpacity = star.opacity * twinkle;

      // Draw star with size based on depth
      const finalSize = star.size + depth * 0.5;

      ctx.fillStyle = star.color;
      ctx.globalAlpha = finalOpacity;
      ctx.beginPath();
      ctx.arc(x, y, finalSize, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  };

  // Draw nebula clouds (semi-transparent overlays)
  const drawNebula = (
    ctx: CanvasRenderingContext2D,
    _width: number,
    height: number,
    time: number
  ) => {
    // Create a subtle animated gradient nebula effect
    const gradient = ctx.createRadialGradient(
      _width * 0.25 + Math.sin(time * 0.001) * 50,
      height * 0.25 + Math.cos(time * 0.0015) * 50,
      50,
      _width * 0.25 + Math.sin(time * 0.001) * 50,
      height * 0.25 + Math.cos(time * 0.0015) * 50,
      500
    );

    gradient.addColorStop(0, 'rgba(157, 78, 221, 0.08)');
    gradient.addColorStop(0.5, 'rgba(123, 44, 191, 0.04)');
    gradient.addColorStop(1, 'rgba(90, 24, 154, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, _width, height);

    // Second nebula cloud for variety
    const gradient2 = ctx.createRadialGradient(
      _width * 0.75 + Math.cos(time * 0.0012) * 80,
      height * 0.75 + Math.sin(time * 0.001) * 80,
      100,
      _width * 0.75 + Math.cos(time * 0.0012) * 80,
      height * 0.75 + Math.sin(time * 0.001) * 80,
      400
    );

    gradient2.addColorStop(0, 'rgba(123, 44, 191, 0.06)');
    gradient2.addColorStop(0.5, 'rgba(90, 24, 154, 0.03)');
    gradient2.addColorStop(1, 'rgba(36, 0, 70, 0)');

    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, _width, height);
  };

  // Draw particles (nebula effect)
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life += 1;

      const lifePercent = particle.life / particle.maxLife;
      particle.opacity = (1 - lifePercent) * 0.3;

      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Remove dead particles
      if (particle.life >= particle.maxLife) {
        particlesRef.current.splice(index, 1);
      }
    });

    ctx.globalAlpha = 1;
  };

  // Emit new particles occasionally
  const emitParticles = (width: number, height: number) => {
    // Emit 1-3 particles every frame randomly
    if (Math.random() > 0.7) {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(
          createParticle(Math.random() * width, Math.random() * height)
        );
      }
    }

    // Limit particle count for performance
    if (particlesRef.current.length > 100) {
      particlesRef.current = particlesRef.current.slice(-100);
    }
  };

  // Main animation loop
  const animate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas with deep space background
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, width, height);

    // Draw background gradient (optional darker gradient at edges)
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height)
    );
    bgGradient.addColorStop(0, 'rgba(10, 15, 40, 0)');
    bgGradient.addColorStop(1, 'rgba(5, 5, 20, 0.3)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw effects
    drawNebula(ctx, width, height, timeRef.current);
    drawStars(ctx, width, height, timeRef.current);
    emitParticles(width, height);
    drawParticles(ctx);

    timeRef.current += 1;
  };

  // Setup and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    // Set canvas size to container
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      starsRef.current = generateStars(width, height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const animationLoop = () => {
      if (canvas && ctx) {
        animate(ctx, canvas.width, canvas.height);
      }
      animationIdRef.current = requestAnimationFrame(animationLoop);
    };

    animationIdRef.current = requestAnimationFrame(animationLoop);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Background canvas - fixed to viewport */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        />
      </div>
      {/* Content rendered on top of background */}
      {children}
    </>
  );
};

export default SpaceBackground;

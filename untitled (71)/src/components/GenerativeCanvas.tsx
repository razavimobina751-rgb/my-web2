import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Play, Pause, RotateCcw, Settings, Heart, Zap } from 'lucide-react';

interface GenerativeCanvasProps {
  videoId: string;
  lang: 'zh' | 'en';
}

export const GenerativeCanvas: React.FC<GenerativeCanvasProps> = ({ videoId, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [complexity, setComplexity] = useState(1.5);
  const [themeMode, setThemeMode] = useState<'gold' | 'emerald' | 'crimson'>('gold');
  const [interactionHint, setInteractionHint] = useState(true);

  // Particle representation for animations
  const particlesRef = useRef<any[]>([]);
  const frameIdRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });

  // Translation helpers
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing dynamically using ResizeObserver as requested
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        initParticles(width, height);
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Initialize Particles depending on videoId
    const initParticles = (width: number, height: number) => {
      const arr: any[] = [];
      if (videoId === 'vid-silk-road') {
        // Drifting desert sands & floating ancient calligraphy scripts
        for (let i = 0; i < 75; i++) {
          arr.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 0.5,
            vx: Math.random() * 0.7 + 0.15, // drifting wind direction
            vy: (Math.random() - 0.5) * 0.1,
            alpha: Math.random() * 0.6 + 0.2,
            char: ['丝', '路', '关', '古', '行', '沙', '春', '暖'][Math.floor(Math.random() * 8)]
          });
        }
      } else if (videoId === 'vid-lanterns-peace') {
        // Floating bright lanterns of peace rising toward the night sky
        for (let i = 0; i < 40; i++) {
          arr.push({
            x: Math.random() * width,
            y: height + Math.random() * 100,
            radius: Math.random() * 5 + 3,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -(Math.random() * 0.5 + 0.15),
            alpha: Math.random() * 0.7 + 0.3,
            symbol: ['平', '安', '智', '法', '慧', '光', '宁', '和'][Math.floor(Math.random() * 8)]
          });
        }
      } else if (videoId === 'vid-jade-dragon') {
        // Jade Dragon & golden light sparkles
        for (let i = 0; i < 80; i++) {
          arr.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            hue: Math.random() > 0.45 ? 152 : 46, // Elegant Jade/Gold balance
            alpha: Math.random() * 0.8 + 0.2
          });
        }
      } else if (videoId === 'vid-book-wisdom') {
        // Sparking pixels of knowledge soaring from an open book
        for (let i = 0; i < 55; i++) {
          arr.push({
            x: width / 2 + (Math.random() - 0.5) * 90,
            y: height / 2 + (Math.random() - 0.5) * 30,
            radius: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -Math.random() * 0.6 - 0.15,
            alpha: Math.random() * 0.8 + 0.2,
            char: ['理', '智', '教', '儒', '经', '史', '书', '章'][Math.floor(Math.random() * 8)]
          });
        }
      } else {
        // vid-mountain-path: cloud mist elements & distant peak specs
        for (let i = 0; i < 60; i++) {
          arr.push({
            x: Math.random() * width,
            y: Math.random() * (height - 80),
            radius: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.05,
            alpha: Math.random() * 0.5 + 0.1
          });
        }
      }
      particlesRef.current = arr;
    };

    let animationTime = 0;

    // Core Animation loop
    const render = () => {
      const W = canvas.width / window.devicePixelRatio;
      const H = canvas.height / window.devicePixelRatio;

      // Dark slate background with very rich translucent ink-decay washes
      ctx.fillStyle = '#0f0e0a'; // Sacred midnight ink black
      ctx.fillRect(0, 0, W, H);

      // Render aesthetic background light glow
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H) / 1.5);
      if (themeMode === 'gold') {
        bgGrad.addColorStop(0, 'rgba(138, 109, 28, 0.12)'); // Amber glow
        bgGrad.addColorStop(1, 'rgba(15, 14, 10, 0)');
      } else if (themeMode === 'emerald') {
        bgGrad.addColorStop(0, 'rgba(16, 185, 129, 0.10)'); // Jade shine
        bgGrad.addColorStop(1, 'rgba(15, 14, 10, 0)');
      } else {
        bgGrad.addColorStop(0, 'rgba(220, 38, 38, 0.11)'); // Crimson ink wash
        bgGrad.addColorStop(1, 'rgba(15, 14, 10, 0)');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Apply interactions directly from Mouse coordinates
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isMouseDown = mouseRef.current.isDown;

      // Draw aesthetic outer frame borders
      ctx.strokeStyle = 'rgba(180, 154, 76, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, W - 24, H - 24);
      ctx.strokeRect(18, 18, W - 36, H - 36);

      // Color palette based on user selected themeMode
      const getLineColor = (alpha = 1) => {
        if (themeMode === 'gold') return `rgba(212, 175, 55, ${alpha})`; // Classic Gold
        if (themeMode === 'emerald') return `rgba(52, 211, 153, ${alpha})`; // Elegant Jade Emerald
        return `rgba(239, 68, 68, ${alpha})`; // Imperial Crimson Red
      };

      if (isPlaying) {
        animationTime += 0.015 * speed;
      }

      // Render Theme-specific drawings
      if (videoId === 'vid-silk-road') {
        // --- 1. Ancient Silk Road Journey ---
        // Render beautiful warm sunrise behind distant desert dunes
        const cx = W / 2;
        const cy = H / 2;

        ctx.save();
        // Drawing golden rising sun on the horizon
        const sunGrad = ctx.createRadialGradient(cx, cy + 40, 2, cx, cy + 40, 120);
        sunGrad.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
        sunGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(cx, cy + 40, 100 * complexity, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw overlapping beautiful desert sand dunes
        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = getLineColor(0.2);
        for (let dune = 0; dune < 3; dune++) {
          ctx.beginPath();
          ctx.fillStyle = dune === 0 ? 'rgba(30, 28, 20, 0.5)' : dune === 1 ? 'rgba(38, 35, 25, 0.6)' : 'rgba(46, 42, 28, 0.7)';
          const duneOffset = dune * 40;
          ctx.moveTo(0, H);
          for (let x = 0; x <= W; x += 10) {
            const y = H - 100 - duneOffset + Math.sin(x * 0.005 + animationTime * 0.15 + dune) * 20 * complexity;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W, H);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();

        // Draw Chinese architectural pagoda/gate silhouette in the distance
        ctx.save();
        ctx.fillStyle = 'rgba(20, 18, 14, 0.85)';
        ctx.strokeStyle = getLineColor(0.3);
        ctx.lineWidth = 1;
        const archX = cx + 80;
        const archY = H - 150;
        ctx.beginPath();
        // Pagoda Base
        ctx.fillRect(archX - 16, archY, 32, 50);
        // Tiers
        ctx.fillRect(archX - 22, archY - 12, 44, 12);
        ctx.fillRect(archX - 14, archY - 24, 28, 12);
        ctx.fillRect(archX - 8, archY - 36, 16, 12);
        ctx.strokeRect(archX - 16, archY, 32, 50);
        ctx.strokeRect(archX - 22, archY - 12, 44, 12);
        ctx.strokeRect(archX - 14, archY - 24, 28, 12);
        ctx.strokeRect(archX - 8, archY - 36, 16, 12);
        ctx.restore();

        // Animate drift particles (Desert sands + floating elegant characters)
        particlesRef.current.forEach(p => {
          if (isPlaying) {
            p.x += p.vx * speed * 1.5;
            p.y += p.vy * speed;
            if (p.x > W) {
              p.x = 0;
              p.y = Math.random() * H;
            }
          }
          ctx.save();
          ctx.fillStyle = getLineColor(p.alpha * complexity);
          ctx.font = '11px serif';
          ctx.fillText(p.char || '.', p.x, p.y);
          ctx.restore();
        });

      } else if (videoId === 'vid-lanterns-peace') {
        // --- 2. Lanterns of Peace ---
        // Beautiful night sky over shimmering reflective black water
        const cx = W / 2;
        const cy = H / 2;

        // Draw subtle water ripples at the bottom
        ctx.save();
        ctx.strokeStyle = getLineColor(0.15);
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          const ry = H - 40 + i * 10;
          ctx.moveTo(15, ry);
          ctx.bezierCurveTo(cx - 100, ry + Math.sin(animationTime + i) * 6, cx + 100, ry - Math.sin(animationTime + i) * 6, W - 15, ry);
          ctx.stroke();
        }
        ctx.restore();

        // Animate Floating lanterns
        particlesRef.current.forEach(p => {
          if (isPlaying) {
            p.y += p.vy * speed * 1.2;
            p.x += (p.vx + Math.sin(animationTime * 0.8 + p.y * 0.01) * 0.15) * speed;
            // Recycle lanterns
            if (p.y < 20) {
              p.y = H + Math.random() * 50;
              p.x = Math.random() * W;
            }
          }

          ctx.save();
          ctx.shadowBlur = 12 * complexity;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';

          // Draw floating lantern box/oval
          const size = p.radius * complexity;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.75)'; // Soft orange-yellow
          ctx.beginPath();
          ctx.rect(p.x - size / 2, p.y - size, size, size * 1.4);
          ctx.fill();

          // Red cap/base accent
          ctx.fillStyle = 'rgba(220, 38, 38, 0.8)';
          ctx.fillRect(p.x - size / 2 - 1, p.y - 1, size + 2, 2);

          // Draw floating wisdom text inside the lantern glow
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.max(6, size * 0.7)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(p.symbol, p.x, p.y - size * 0.35);

          ctx.restore();
        });

      } else if (videoId === 'vid-jade-dragon') {
        // --- 3. Jade Dragon and Golden Light ---
        // A physical flying golden & emerald dragon wrapping around mountains
        const cx = W / 2;
        const cy = H / 2;

        // Draw majestic jagged peaks outline in background
        ctx.save();
        ctx.strokeStyle = getLineColor(0.18);
        ctx.fillStyle = 'rgba(15, 14, 10, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, H - 20);
        ctx.lineTo(W * 0.25, H - 180);
        ctx.lineTo(W * 0.45, H - 90);
        ctx.lineTo(W * 0.7, H - 240);
        ctx.lineTo(W - 20, H - 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw serpentine Jade Dragon body segments
        ctx.save();
        const segs = 22;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10 * complexity;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.6)'; // Rich Emerald color

        let headX = cx + Math.cos(animationTime * 1.2) * (W * 0.35);
        let headY = cy - 40 + Math.sin(animationTime * 2.4) * (H * 0.22);

        // Pull toward mouse if interacting
        if (mx > 0 && my > 0) {
          headX = mx;
          headY = my;
        }

        ctx.beginPath();
        for (let i = 0; i < segs; i++) {
          const ratio = i / segs;
          // Calculate trailing wave segments
          const segX = headX - Math.cos(animationTime * 1.5 - ratio * 4) * (i * 12);
          const segY = headY - Math.sin(animationTime * 1.5 - ratio * 4) * (i * 12);

          if (i === 0) {
            ctx.moveTo(segX, segY);
          } else {
            ctx.lineTo(segX, segY);
          }

          // Oval body spine segments
          ctx.save();
          ctx.fillStyle = i % 2 === 0 ? 'rgba(16, 185, 129, 0.8)' : '#D4AF37';
          ctx.beginPath();
          ctx.arc(segX, segY, (14 - i * 0.5) * complexity, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = '#34D399';
        ctx.stroke();
        ctx.restore();

        // Stardust update
        particlesRef.current.forEach(p => {
          if (isPlaying) {
            p.x += p.vx * speed * 1.3;
            p.y += p.vy * speed * 1.3;
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`;
          ctx.fill();
        });

      } else if (videoId === 'vid-book-wisdom') {
        // --- 4. The Book of Wisdom ---
        // Elegant Open book standing in a library environment with dust clouds
        const cx = W / 2;
        const cy = H / 2 + 20;

        // Draw Sunbeams coming from top-left
        ctx.save();
        const beamGrad = ctx.createRadialGradient(20, 20, 10, cx, cy, Math.max(W, H));
        beamGrad.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
        beamGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.03)');
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W, 0);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Drawing central majestic Open book pages
        ctx.save();
        ctx.shadowBlur = 18 * complexity;
        ctx.shadowColor = getLineColor(0.4);

        const pw = 100 * complexity;
        const ph = 65 * complexity;

        // Left Page
        ctx.fillStyle = '#fbf0d9'; // Antique parchment color
        ctx.beginPath();
        ctx.moveTo(cx, cy + ph * 0.3);
        ctx.bezierCurveTo(cx - pw * 0.4, cy + ph * 0.25, cx - pw * 0.8, cy + ph * 0.45, cx - pw, cy + ph * 0.4);
        ctx.lineTo(cx - pw, cy - ph * 0.6);
        ctx.bezierCurveTo(cx - pw * 0.8, cy - ph * 0.55, cx - pw * 0.4, cy - ph * 0.75, cx, cy - ph * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8c6239';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Right Page
        ctx.beginPath();
        ctx.moveTo(cx, cy + ph * 0.3);
        ctx.bezierCurveTo(cx + pw * 0.4, cy + ph * 0.25, cx + pw * 0.8, cy + ph * 0.45, cx + pw, cy + ph * 0.4);
        ctx.lineTo(cx + pw, cy - ph * 0.6);
        ctx.bezierCurveTo(cx + pw * 0.8, cy - ph * 0.55, cx + pw * 0.4, cy - ph * 0.75, cx, cy - ph * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Simulated text lines inside the book
        ctx.strokeStyle = '#b2916b';
        ctx.lineWidth = 1;
        for (let row = 0; row < 4; row++) {
          const dy = cy - ph * 0.4 + row * (10 * complexity);
          // Left page lines
          ctx.beginPath();
          ctx.moveTo(cx - pw * 0.8, dy);
          ctx.lineTo(cx - pw * 0.2, dy + Math.sin(row) * 2);
          ctx.stroke();
          // Right page lines
          ctx.beginPath();
          ctx.moveTo(cx + pw * 0.2, dy);
          ctx.lineTo(cx + pw * 0.8, dy + Math.sin(row) * -2);
          ctx.stroke();
        }
        ctx.restore();

        // Animate mystical glowing text characters drifting out
        particlesRef.current.forEach(p => {
          if (isPlaying) {
            p.y += p.vy * speed * 1.5;
            p.x += (p.vx + Math.sin(animationTime + p.y * 0.05) * 0.3) * speed;
            if (p.y < 30) {
              p.y = cy + (Math.random() - 0.5) * 20;
              p.x = cx + (Math.random() - 0.5) * 40;
            }
          }
          ctx.save();
          ctx.fillStyle = getLineColor(p.alpha * complexity);
          ctx.font = `italic ${10 + p.radius * 2}px serif`;
          ctx.fillText(p.char, p.x, p.y);
          ctx.restore();
        });

      } else {
        // --- 5. Path Through the Mountains ---
        const cx = W / 2;
        const cy = H / 2;

        // Draw warm rising sunrise in the center-left peaks
        ctx.save();
        const horizon = H - 120;
        const sunX = cx - 100;
        const sunY = horizon - 20;

        const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 90 * complexity);
        sunGrad.addColorStop(0, 'rgba(251, 146, 60, 0.42)'); // orange sunrise
        sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 80 * complexity, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw layered mountain range curves (Winding path going up)
        ctx.save();
        ctx.lineWidth = 1.2;
        for (let layer = 0; layer < 4; layer++) {
          ctx.beginPath();
          ctx.strokeStyle = getLineColor(0.15 + layer * 0.15);
          ctx.fillStyle = `rgba(${16 + layer * 8}, ${15 + layer * 8}, ${12 + layer * 8}, 0.85)`;
          
          const startY = horizon + layer * 30;
          ctx.moveTo(20, H);
          ctx.lineTo(20, startY);
          // Curve peaks
          ctx.bezierCurveTo(W * 0.25, startY - 80, W * 0.5, startY + 20, W * 0.7, startY - 110);
          ctx.lineTo(W - 20, H);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Paths climbing up the mountain peaks
        ctx.strokeStyle = getLineColor(0.65);
        ctx.lineWidth = 2 * complexity;
        ctx.beginPath();
        ctx.moveTo(cx - 150, horizon + 80);
        ctx.quadraticCurveTo(cx - 30, horizon + 50, cx - 80, horizon);
        ctx.quadraticCurveTo(cx - 130, horizon - 40, cx - 110, horizon - 70);
        ctx.stroke();
        ctx.restore();

        // Mist/Cloud particles moving across peaks
        particlesRef.current.forEach(p => {
          if (isPlaying) {
            p.x += p.vx * speed;
            p.y += p.vy * speed;
            if (p.x > W) p.x = 0;
            if (p.x < 0) p.x = W;
          }
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.22})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 6 * complexity, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // Interaction Hint
      if (interactionHint) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '10px serif';
        ctx.textAlign = 'center';
        ctx.fillText(t('💡 拖拽鼠标：注入中阿文化气力', '💡 Drag mouse: Infold and direct the cultural energy fields'), W / 2, H - 28);
        ctx.restore();
      }

      frameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      resizeObserver.disconnect();
    };
  }, [videoId, isPlaying, speed, complexity, themeMode, interactionHint]);

  // Handle Mouse inputs
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;

    if (interactionHint) setInteractionHint(false);

    // Spawn sparkles on click drag
    if (mouseRef.current.isDown && isPlaying) {
      const W = canvas.width / window.devicePixelRatio;
      const H = canvas.height / window.devicePixelRatio;
      if (particlesRef.current.length > 200) {
        particlesRef.current.shift();
      }
      
      // Add custom mouse touch point seed
      if (videoId === 'vid-silk-road') {
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          radius: Math.random() * 3 + 1.2,
          vx: Math.random() * 1.5 + 0.5,
          vy: (Math.random() - 0.5) * 1.0,
          alpha: 1.0,
          char: ['丝', '路'][Math.floor(Math.random() * 2)]
        });
      } else if (videoId === 'vid-lanterns-peace') {
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          radius: Math.random() * 7 + 4,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1.1 - 0.3,
          alpha: 1.0,
          symbol: '和'
        });
      } else if (videoId === 'vid-jade-dragon') {
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          radius: Math.random() * 2.5 + 0.5,
          vx: (Math.random() - 0.5) * 2.0,
          vy: (Math.random() - 0.5) * 2.0,
          hue: Math.random() > 0.5 ? 152 : 46,
          alpha: 1.0
        });
      } else if (videoId === 'vid-book-wisdom') {
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          radius: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -Math.random() * 1.5 - 0.5,
          alpha: 1.0,
          char: '智'
        });
      } else {
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          radius: Math.random() * 4 + 2,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          alpha: 0.8
        });
      }
    }
  };

  const handleMouseDown = () => {
    mouseRef.current.isDown = true;
  };

  const handleMouseUp = () => {
    mouseRef.current.isDown = false;
  };

  const handleMouseLeave = () => {
    mouseRef.current.isDown = false;
    mouseRef.current.x = 0;
    mouseRef.current.y = 0;
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0c0a] rounded-2xl overflow-hidden border border-stone-800 relative select-none">
      
      {/* Top Banner indicating offline rendering is active */}
      <div className="bg-[#181611] px-4 py-2 border-b border-[#2d281d] flex items-center justify-between text-xs font-mono">
        <span className="text-[#B49A4C] flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#D4AF37]" />
          {t('端侧数字引擎 (Generative Live Art Engine)', 'Generative Live Art Engine Active')}
        </span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-stone-400 text-[10px] uppercase">{t('流畅渲染 (60FPS Local)', '60FPS Local')}</span>
        </div>
      </div>

      {/* Main interactive stage */}
      <div className="relative flex-1 bg-[#100f0d] aspect-video">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block absolute inset-0 touch-none"
        />
      </div>

      {/* Bottom control studio rail */}
      <div className="bg-[#0f0e0c] border-t border-[#1e1c14] p-4 flex flex-wrap gap-4 items-center justify-between">
        
        {/* Play/Pause controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl text-stone-100 cursor-pointer transition-colors ${
              isPlaying ? 'bg-amber-850 hover:bg-[#A38023]' : 'bg-stone-800 hover:bg-stone-700'
            }`}
            title={isPlaying ? t('暂停 (Pause)', 'Pause') : t('播放 (Play)', 'Play')}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => {
              setSpeed(1);
              setComplexity(1.5);
              setThemeMode('gold');
              setInteractionHint(true);
            }}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 hover:border-stone-700 text-stone-300 transition-all cursor-pointer"
            title={t('重置 (Reset)', 'Reset Settings')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Parameter Sliders */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Speed slider */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">{t('时钟速率 (Speed)', 'Speed')}</span>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-20 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#8A6D1C]"
            />
            <span className="text-[9px] font-mono text-stone-500 w-6">{speed}x</span>
          </div>

          {/* Complexity slider */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">{t('气脉张力 (Tenseness)', 'Complexity')}</span>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={complexity}
              onChange={(e) => setComplexity(Number(e.target.value))}
              className="w-20 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
            />
            <span className="text-[9px] font-mono text-stone-500 w-6">{complexity}x</span>
          </div>

          {/* Golden / Jade Tone Toggle */}
          <div className="flex items-center space-x-1 border border-stone-800 bg-stone-950 p-1 rounded-lg">
            {(['gold', 'emerald', 'crimson'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wider cursor-pointer transition-all ${
                  themeMode === mode
                    ? mode === 'gold' ? 'bg-[#8A6D1C] text-white font-bold' : mode === 'emerald' ? 'bg-emerald-800 text-white font-bold' : 'bg-red-850 text-white font-bold'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                {mode === 'gold' ? t('玄金', 'Gold') : mode === 'emerald' ? t('青翠', 'Jade') : t('丹红', 'Red')}
              </button>
            ))}
          </div>
        </div>

        {/* Informational note */}
        <div className="text-[10px] text-stone-500 font-serif hidden md:block">
          {t('✔ 100% 离线自给，不消耗外网数据', '✔ 100% Local power. Zero data usage.')}
        </div>

      </div>
    </div>
  );
};

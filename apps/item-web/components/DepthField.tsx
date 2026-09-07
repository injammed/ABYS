"use client";

import { useEffect, useRef } from "react";

// A virtual camera volume in metres. Projection changes only the ambient
// scene; document flow, pointer targets and scrolling stay in screen space.
const FAR_METRES = 10000 * 0.9144;

export function DepthField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let width = 0;
    let height = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let light = document.documentElement.dataset.aetimmTheme === "light";

    const draw = () => {
      frame = 0;
      if (document.visibilityState === "hidden") return;
      context.clearRect(0, 0, width, height);
      const cameraX = motion.matches ? 0 : x * 32;
      const cameraY = motion.matches ? 0 : y * 20;
      const travel = motion.matches ? 0 : Math.min(window.scrollY * 0.035, 150);
      const project = (wx: number, wy: number, z: number) => {
        const scale = (width * 0.7) / (z + 450);
        return [width * 0.55 + (wx - cameraX) * scale, height * 0.39 + (wy - cameraY) * scale];
      };
      const line = (points: number[][], alpha: number, spectral = false) => {
        context.beginPath();
        points.forEach(([px, py], index) => index === 0 ? context.moveTo(px, py) : context.lineTo(px, py));
        context.strokeStyle = light ? `rgba(39,66,110,${alpha * 0.6})` : spectral ? `rgba(143,182,241,${alpha})` : `rgba(204,197,184,${alpha})`;
        context.lineWidth = 0.7;
        context.stroke();
      };
      // Perspective planes are exponentially spaced into the 10,000-yard
      // volume. Far geometry converges optically instead of filling the page.
      for (let index = 0; index < 12; index += 1) {
        const z = Math.pow(index / 11, 2) * FAR_METRES + travel;
        const corners = [[-700, -370], [700, -370], [700, 370], [-700, 370], [-700, -370]];
        line(corners.map(([px, py]) => project(px, py, z)), 0.16 - index * 0.008, index % 3 === 0);
      }
      for (const [px, py] of [[-700, -370], [700, -370], [700, 370], [-700, 370], [-350, 370], [350, 370]]) {
        line([project(px, py, travel), project(px, py, FAR_METRES)], 0.1, true);
      }
      // Deterministic points read as distant light, never activity or data.
      for (let index = 1; index <= 55; index += 1) {
        const z = 200 + ((index * 1789) % 8944);
        const [px, py] = project(((index * 827) % 2200) - 1100, ((index * 419) % 1100) - 550, z);
        context.fillStyle = light ? "rgba(50,70,110,.12)" : `rgba(207,217,241,${0.16 + (index % 4) * 0.045})`;
        context.fillRect(px, py, index % 7 === 0 ? 2 : 1, 1);
      }
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(draw); };
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      schedule();
    };
    const move = (event: PointerEvent) => {
      if (motion.matches || !pointer.matches || event.pointerType === "touch") return;
      x = event.clientX / width - 0.5;
      y = event.clientY / height - 0.5;
      schedule();
    };
    const scroll = () => { if (!motion.matches) schedule(); };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => { light = document.documentElement.dataset.aetimmTheme === "light"; schedule(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-aetimm-theme"] });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    resize();
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);

  return <div className="depth-field" aria-hidden="true" data-virtual-depth-yards="10000"><canvas ref={canvasRef} /><span className="depth-coordinate">AETIMM / VIRTUAL DEPTH · 10,000 YD</span></div>;
}

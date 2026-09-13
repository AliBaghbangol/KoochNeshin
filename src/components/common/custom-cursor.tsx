"use client";

import * as React from "react";

export function CustomCursor() {
  const dotRef = React.useRef<HTMLDivElement>(null);
  const ringRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = `${mouseX}px`;
        dotRef.current.style.top = `${mouseY}px`;
      }
    };

    // Smooth ring follow with lag
    const animate = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.left = `${ringX}px`;
        ringRef.current.style.top = `${ringY}px`;
      }
      rafId = requestAnimationFrame(animate);
    };
    animate();

    // Hover detection on clickable elements. `.cursor-pointer` is included so
    // clickable CARDS (tour/equipment/blog — divs with onClick, not <button>)
    // get the gold "this is clickable" cursor state too.
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest(
        "a, button, [role='button'], [role='option'], input, textarea, select, label, summary, [data-clickable], .cursor-pointer",
      );
      if (isClickable) {
        dotRef.current?.classList.add("hovering");
        ringRef.current?.classList.add("hovering");
      } else {
        dotRef.current?.classList.remove("hovering");
        ringRef.current?.classList.remove("hovering");
      }
    };

    const onDown = () => ringRef.current?.classList.add("clicking");
    const onUp = () => ringRef.current?.classList.remove("clicking");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}

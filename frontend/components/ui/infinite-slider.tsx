"use client";

import React from "react";

type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  reverse?: boolean;
  speed?: number;
  speedOnHover?: number;
  className?: string;
};

/**
 * Infinite horizontal slider (marquee). Duplicates children for seamless loop.
 * Uses CSS animation: translateX(-50%) so content is duplicated once.
 */
export function InfiniteSlider({
  children,
  gap = 24,
  reverse = false,
  speed = 80,
  speedOnHover,
  className = "",
}: InfiniteSliderProps) {
  const [duration, setDuration] = React.useState(speed);

  const style: React.CSSProperties = {
    display: "flex",
    width: "max-content",
    gap: `${gap}px`,
    animation: `infinite-slider-scroll ${duration}s linear infinite`,
    animationDirection: reverse ? "reverse" : "normal",
  };

  return (
    <div
      className={className}
      onMouseEnter={speedOnHover != null ? () => setDuration(speedOnHover) : undefined}
      onMouseLeave={speedOnHover != null ? () => setDuration(speed) : undefined}
    >
      <div style={style}>
        {children}
        {children}
      </div>
    </div>
  );
}

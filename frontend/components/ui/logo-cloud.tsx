"use client";

import { InfiniteSlider } from "@/components/ui/infinite-slider";

const logos = [
  { src: "https://storage.efferd.com/logo/nvidia-wordmark.svg", alt: "Nvidia Logo" },
  { src: "https://storage.efferd.com/logo/supabase-wordmark.svg", alt: "Supabase Logo" },
  { src: "https://storage.efferd.com/logo/openai-wordmark.svg", alt: "OpenAI Logo" },
  { src: "https://storage.efferd.com/logo/turso-wordmark.svg", alt: "Turso Logo" },
  { src: "https://storage.efferd.com/logo/vercel-wordmark.svg", alt: "Vercel Logo" },
  { src: "https://storage.efferd.com/logo/github-wordmark.svg", alt: "GitHub Logo" },
  { src: "https://storage.efferd.com/logo/claude-wordmark.svg", alt: "Claude AI Logo" },
  { src: "https://storage.efferd.com/logo/clerk-wordmark.svg", alt: "Clerk Logo" },
];

export function LogoCloud() {
  return (
    <div
      className="overflow-hidden py-4"
      style={{
        maskImage: "linear-gradient(to right, transparent, black, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black, transparent)",
      }}
    >
      <InfiniteSlider gap={42} reverse speed={80} speedOnHover={25}>
        {logos.map((logo) => (
          <img
            alt={logo.alt}
            className="pointer-events-none h-4 select-none md:h-5 brightness-0 invert opacity-80"
            height="auto"
            key={`logo-${logo.alt}`}
            loading="lazy"
            src={logo.src}
            width="auto"
          />
        ))}
      </InfiniteSlider>
    </div>
  );
}

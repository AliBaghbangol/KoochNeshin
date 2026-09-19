"use client";

import * as React from "react";
import { ImageOff, Mountain, Tent, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type FallbackKind = "tour" | "equipment" | "avatar" | "destination" | "default";

const FALLBACKS: Record<
  FallbackKind,
  { gradient: string; Icon: typeof Mountain; tint: string }
> = {
  tour: {
    gradient: "from-emerald via-emerald-dark to-forest",
    Icon: Mountain,
    tint: "text-gold",
  },
  equipment: {
    gradient: "from-sunset to-sunset-dark",
    Icon: Tent,
    tint: "text-cream",
  },
  avatar: {
    gradient: "from-emerald-light to-emerald",
    Icon: User,
    tint: "text-cream",
  },
  destination: {
    gradient: "from-forest via-emerald-dark to-emerald",
    Icon: MapPin,
    tint: "text-gold",
  },
  default: {
    gradient: "from-emerald to-forest",
    Icon: Mountain,
    tint: "text-gold",
  },
};

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: FallbackKind;
  /** show shimmer placeholder while loading */
  shimmer?: boolean;
  /** aspect class for the wrapper, e.g. "aspect-[16/10]" — if provided, wrapper is relative */
  aspectClass?: string;
  /** label shown on fallback (e.g. category name) */
  fallbackLabel?: string;
}

/**
 * Drop-in replacement for <img> that gracefully handles broken external
 * images (Unsplash hotlink protection etc.) by showing a branded gradient
 * placeholder with an icon. Also shows a shimmer skeleton while loading.
 */
export function SmartImage({
  src,
  alt,
  fallback = "default",
  shimmer = true,
  aspectClass,
  fallbackLabel,
  className,
  ...rest
}: SmartImageProps) {
  const [status, setStatus] = React.useState<
    "loading" | "loaded" | "error"
  >("loading");
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    setStatus("loading");
    // Local/cached images can finish loading BEFORE hydration attaches the
    // onLoad listener — check `complete` so they never stay stuck invisible.
    const el = imgRef.current;
    if (el && el.complete) {
      setStatus(el.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [src]);

  const cfg = FALLBACKS[fallback];
  const Icon = cfg.Icon;

  const imgEl = (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("error")}
      className={cn(
        className,
        status === "loaded" ? "opacity-100" : "opacity-0",
        "transition-opacity duration-500"
      )}
      {...rest}
    />
  );

  const placeholder = (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br",
        cfg.gradient
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-noise opacity-10" />
      <Icon className={cn("h-1/4 w-1/4 max-h-16 max-w-16 opacity-60", cfg.tint)} />
      {fallbackLabel && (
        <span
          className={cn(
            "rounded-full bg-cream/10 px-3 py-1 text-[10px] font-bold backdrop-blur",
            cfg.tint
          )}
        >
          {fallbackLabel}
        </span>
      )}
      <span className="absolute bottom-2 right-2 opacity-30">
        <ImageOff className="h-4 w-4 text-cream" />
      </span>
    </div>
  );

  const shimmerEl = (
    <div className="shimmer-bg absolute inset-0" aria-hidden />
  );

  if (aspectClass) {
    return (
      <div className={cn("relative overflow-hidden", aspectClass)}>
        {status === "error" && placeholder}
        {status === "loading" && shimmer && shimmerEl}
        {imgEl}
      </div>
    );
  }

  // No wrapper — return a relative-positioned fragment
  return (
    <div className="relative h-full w-full overflow-hidden">
      {status === "error" && placeholder}
      {status === "loading" && shimmer && shimmerEl}
      {imgEl}
    </div>
  );
}

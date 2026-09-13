"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Map as MapIcon, MapPin, Heart, UserRound } from "lucide-react";
import { useGo } from "@/lib/use-go";
import { useNav } from "@/store/nav-store";
import { useAuth } from "@/store/auth-store";
import { useWishlist } from "@/store/wishlist-store";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation (BRIEF §6).
 * - Fixed, safe-area aware, ~64px tall, active indicator, subtle blur
 * - Desktop (≥1024px) never renders it — desktop layout untouched
 * - Hides while the virtual keyboard is open (visualViewport heuristic)
 */
export function BottomNav() {
  const pathname = usePathname() || "/";
  const go = useGo();
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const setWishlistOpen = useNav((s) => s.setWishlistOpen);
  const wishCount = useWishlist((s) => s.tourIds.length + s.equipmentIds.length);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const [mounted, setMounted] = React.useState(false);
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Hide the bar while the on-screen keyboard is visible (inputs/checkout).
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const open = window.innerHeight - vv.height > 140;
      setKeyboardOpen(open);
    };
    onResize();
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const active = React.useMemo(() => {
    if (pathname.startsWith("/tours")) return "tours";
    if (pathname.startsWith("/destinations") || pathname.startsWith("/category"))
      return "destinations";
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/leader") ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/admin")
    )
      return "profile";
    return "home";
  }, [pathname]);

  const onProfile = () => {
    if (mounted && isAuthenticated) go("user-dashboard");
    else setAuthOpen(true);
  };

  const items = [
    {
      key: "home",
      label: "خانه",
      icon: Home,
      active: active === "home",
      onClick: () => go("home"),
    },
    {
      key: "tours",
      label: "تورها",
      icon: MapIcon,
      active: active === "tours",
      onClick: () => go("tours"),
    },
    {
      key: "destinations",
      label: "مقاصد",
      icon: MapPin,
      active: active === "destinations",
      onClick: () => go("destinations"),
    },
    {
      key: "wishlist",
      label: "علاقه‌مندی",
      icon: Heart,
      active: false,
      badge: mounted ? wishCount : 0,
      onClick: () => setWishlistOpen(true),
    },
    {
      key: "profile",
      label: "پروفایل",
      icon: UserRound,
      active: active === "profile",
      onClick: onProfile,
    },
  ];

  return (
    <nav
      aria-label="ناوبری اصلی موبایل"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 lg:hidden",
        keyboardOpen ? "translate-y-full" : "translate-y-0"
      )}
    >
      <div className="border-t border-border/60 bg-background/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_-16px_rgba(11,31,26,0.35)] backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                aria-label={item.label}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 transition-colors active:scale-[0.97]",
                  item.active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute top-1.5 h-1 w-8 rounded-full bg-primary"
                  />
                )}
                <motion.span
                  animate={{
                    scale: item.active && mounted ? 1.08 : 1,
                    y: item.active && mounted ? -1 : 0,
                  }}
                  whileTap={{ scale: 0.82 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "relative grid place-items-center rounded-2xl transition-colors",
                    item.active ? "bg-primary/10" : "bg-transparent"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5 transition", mounted && item.key === "wishlist" && (item.badge ?? 0) > 0 && "fill-sunset/15")}
                  />
                  {/* v27 — خانه فعال: کاشی گرادیانی برند + نقطه طلایی (اکوی لوگو)
                      تا آیکون خانه شیک و متمایز شود (جایگزین قطب‌نما) */}
                  {item.key === "home" && item.active && (
                    <>
                      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald via-emerald-dark to-forest opacity-[0.14]" />
                      <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-gold shadow-glow-gold" />
                    </>
                  )}
                  {item.key === "wishlist" && mounted && (item.badge ?? 0) > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-sunset px-1 text-[9px] font-bold text-white">
                      {toFa(item.badge ?? 0)}
                    </span>
                  )}
                </motion.span>
                <span className={cn("text-[10px] leading-none", item.active && "font-bold")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

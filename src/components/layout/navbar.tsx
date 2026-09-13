"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  Moon,
  Sun,
  User,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Home,
  Map as MapIcon,
  MapPin,
  Tent,
  Newspaper,
  Info,
  ChevronLeft,
  Backpack,
  Heart,
  Wand2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useCart } from "@/store/cart-store";
import { useWishlist } from "@/store/wishlist-store";
import { useAuth } from "@/store/auth-store";
import { useSearchPalette } from "@/store/search-palette-store";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/layout/notification-center";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { BrandMark } from "@/components/common/brand-mark";
import { useHeroScrolled } from "@/hooks/use-scroll-state";

const NAV_LINKS = [
  { id: "home", label: "خانه", icon: Home, path: "/" },
  { id: "tours", label: "تورها", icon: MapIcon, path: "/tours" },
  { id: "planner", label: "برنامه‌ریز هوشمند", icon: Wand2, path: "/planner" },
  { id: "destinations", label: "مقاصد", icon: MapPin, path: "/destinations" },
  { id: "equipment", label: "تجهیزات", icon: Tent, path: "/equipment" },
  { id: "blog", label: "مجله", icon: Newspaper, path: "/blog" },
  { id: "about", label: "درباره ما", icon: Info, path: "/about" },
];

/**
 * Derive the active nav item from the real URL pathname (not the zustand
 * view store) so the animated pill always sits on the page the user is
 * actually on — even after a hard reload or a back/forward navigation.
 * Detail pages (tour/product/blog/story) keep their parent section lit.
 */
function activeNavIdFromPath(pathname: string): string {
  const segments = pathname.split("?")[0].split("#")[0].split("/").filter(Boolean);
  if (segments.length === 0) return "home";
  const head = segments[0];
  const match = NAV_LINKS.find((l) => l.path === `/${head}`);
  return match ? match.id : "";
}

/**
 * variant="hero"  → cream over the hero photo, dark once scrolled
 * variant="sheet" → always foreground (visible on the white menu sheet
 *                   regardless of scroll state — v27 fix: the toggle menu
 *                   must show the same navbar icons as the top bar)
 */
function ThemeToggle({ variant = "hero" }: { variant?: "hero" | "sheet" }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const scrolled = useHeroScrolled();
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  return (
    <IconTooltip label={theme === "dark" ? "حالت روشن" : "حالت تاریک"} side="bottom">
      <button
        aria-label="تغییر تم"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full transition",
          variant === "sheet" || scrolled
            ? "text-foreground/70 hover:bg-primary/10 hover:text-primary"
            : "text-cream/70 hover:bg-cream/10 hover:text-cream",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              <Sun className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              <Moon className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </IconTooltip>
  );
}

function CartButton({ variant = "hero" }: { variant?: "hero" | "sheet" }) {
  const count = useCart((s) => s.count());
  const setCartOpen = useNav((s) => s.setCartOpen);
  const scrolled = useHeroScrolled();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <IconTooltip label="سبد خرید" side="bottom">
      <button
        aria-label="سبد خرید"
        onClick={() => setCartOpen(true)}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-full transition",
          variant === "sheet" || scrolled
            ? "text-foreground/70 hover:bg-primary/10 hover:text-primary"
            : "text-cream/70 hover:bg-cream/10 hover:text-cream",
        )}
      >
        <Backpack className="h-5 w-5" />
        <AnimatePresence>
          {mounted && count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0, y: -6 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white"
            >
              {toFa(count)}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </IconTooltip>
  );
}

function WishlistButton({ variant = "hero" }: { variant?: "hero" | "sheet" }) {
  const count = useWishlist((s) => s.tourIds.length + s.equipmentIds.length);
  const setWishlistOpen = useNav((s) => s.setWishlistOpen);
  const scrolled = useHeroScrolled();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <IconTooltip label="علاقه‌مندی‌ها" side="bottom">
      <button
        aria-label="علاقه‌مندی‌ها"
        onClick={() => setWishlistOpen(true)}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-full transition",
          variant === "sheet" || scrolled
            ? "text-foreground/70 hover:bg-primary/10 hover:text-primary"
            : "text-cream/70 hover:bg-cream/10 hover:text-cream",
        )}
      >
        <Heart className={cn("h-5 w-5 transition", mounted && count > 0 && "fill-sunset text-sunset")} />
        <AnimatePresence>
          {mounted && count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0, y: -6 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sunset px-1 text-[10px] font-bold text-white"
            >
              {toFa(count)}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </IconTooltip>
  );
}

function UserMenu({ full = false }: { full?: boolean }) {
  const { user, isAuthenticated, role, logout } = useAuth();
  const go = useGo();
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  // Prevent hydration mismatch: on SSR, zustand persist hasn't hydrated
  // yet so isAuthenticated is false. We render a placeholder until mounted.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || !isAuthenticated || !user) {
    // Drawer variant: a big, centered gradient CTA (user request — the tiny
    // inline "ورود" button looked lost at the bottom of the menu sheet).
    if (full) {
      return (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setAuthOpen(true)}
          className="relative flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-l from-emerald via-emerald-dark to-emerald px-6 py-3.5 text-base font-extrabold text-white shadow-lg shadow-emerald/30 transition hover:shadow-xl hover:shadow-emerald/40"
        >
          {/* sheen sweep */}
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 hover:translate-x-full"
          />
          <User className="h-5 w-5" />
          ورود | ثبت‌نام
        </motion.button>
      );
    }
    return (
      <Button
        size="sm"
        onClick={() => setAuthOpen(true)}
        className="rounded-full bg-primary px-5 text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-emerald-dark"
      >
        <User className="ml-1 h-4 w-4" />
        ورود
      </Button>
    );
  }

  if (full) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-center gap-3 rounded-2xl border bg-secondary/50 px-4 py-3 transition hover:bg-secondary">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {/* v29 fix: min-w-0 + truncate — long names can never push
                past the card border (they used to spill out of the box) */}
            <span className="flex min-w-0 flex-1 flex-col text-right">
              <span className="truncate text-sm font-bold">{user.fullName}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {role === "admin"
                  ? "مدیر سایت"
                  : role === "leader"
                    ? "لیدر تور"
                    : role === "seller"
                      ? "فروشنده تجهیزات"
                      : role === "traveler"
                        ? "مسافر"
                        : "مهمان"}
              </span>
            </span>
            <ChevronLeft className="h-4 w-4 shrink-0 rotate-180 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          sideOffset={10}
          collisionPadding={12}
          className="w-64 rounded-2xl border-border/60 p-2 shadow-xl shadow-black/10"
        >
          {/* Menu header — avatar + name + role */}
          <DropdownMenuLabel className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{user.fullName}</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {role === "admin"
                  ? "مدیر سایت"
                  : role === "leader"
                    ? "لیدر تور"
                    : role === "seller"
                      ? "فروشنده تجهیزات"
                      : role === "traveler"
                        ? "مسافر"
                        : "مهمان"}
              </span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => go("user-dashboard", { tab: "settings" })} className="rounded-xl py-2.5">
            <CircleUserRound className="ml-2 h-4 w-4" /> پروفایل من
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => go("user-dashboard")} className="rounded-xl py-2.5">
            <LayoutDashboard className="ml-2 h-4 w-4" /> داشبورد من
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout()}
            className="rounded-xl py-2.5 text-destructive focus:text-destructive"
          >
            <LogOut className="ml-2 h-4 w-4" /> خروج از حساب
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="منوی حساب کاربری"
          className="grid h-9 w-9 place-items-center overflow-hidden rounded-full ring-2 ring-primary/20 transition hover:ring-primary"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      {/* align="center" + collisionPadding keeps the panel visually centred
          under the avatar (user: «وسط نیست») while Radix collision detection
          stops it hugging the viewport edge on narrow screens. */}
      <DropdownMenuContent
        align="center"
        sideOffset={10}
        collisionPadding={12}
        className="w-64 rounded-2xl border-border/60 p-2 shadow-xl shadow-black/10"
      >
        {/* Menu header — avatar + name + role */}
        <DropdownMenuLabel className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold">{user.fullName}</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {role === "admin"
                ? "مدیر سایت"
                : role === "leader"
                  ? "لیدر تور"
                  : role === "seller"
                    ? "فروشنده تجهیزات"
                    : role === "traveler"
                      ? "مسافر"
                      : "مهمان"}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* پروفایل من — deep-links to the profile editing tab of the
            role-appropriate dashboard (restored — user: «پاک شده»). */}
        <DropdownMenuItem
          onClick={() =>
            role === "admin"
              ? go("admin-dashboard")
              : role === "leader"
                ? go("leader-dashboard")
                : role === "seller"
                  ? go("seller-dashboard")
                  : go("user-dashboard", { tab: "settings" })
          }
          className="rounded-xl py-2.5"
        >
          <CircleUserRound className="ml-2 h-4 w-4" /> پروفایل من
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            role === "admin"
              ? go("admin-dashboard")
              : role === "leader"
                ? go("leader-dashboard")
                : role === "seller"
                  ? go("seller-dashboard")
                  : go("user-dashboard")
          }
          className="rounded-xl py-2.5"
        >
          <LayoutDashboard className="ml-2 h-4 w-4" /> داشبورد من
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="rounded-xl py-2.5 text-destructive focus:text-destructive"
        >
          <LogOut className="ml-2 h-4 w-4" /> خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const go = useGo();
  const scrolled = useHeroScrolled();
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Active item comes from the URL — the single source of truth for
  // "which page am I on" — so the sliding pill follows navigation.
  const pathname = usePathname() || "/";
  const activeId = activeNavIdFromPath(pathname);

  return (
    <>
      {/* ===== Full navbar — only on hero (not scrolled) ===== */}
      <AnimatePresence>
        {!scrolled && (
          <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-forest/60 to-transparent py-4 pt-[max(1rem,env(safe-area-inset-top))] max-sm:py-3"
          >
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 max-sm:gap-2 md:px-6">
              {/* Logo — v30 brand mark (سیاه‌چادر + Damavand + sun) */}
              <button onClick={() => go("home")} className="group flex items-center gap-2">
                <BrandMark className="h-10 w-10 rounded-2xl shadow-lg shadow-emerald/30 transition group-hover:scale-105" />
                <div className="hidden flex-col text-right leading-none sm:flex">
                  <span className="text-lg font-extrabold tracking-tight text-cream">کوچ‌نشین</span>
                  <span className="text-[10px] text-cream/60">سفرهای تجربی ایران</span>
                </div>
              </button>

              {/* Desktop nav — the cream pill slides between items via
                  layoutId; active item derives from the URL pathname */}
              <div className="hidden items-center gap-1 lg:flex">
                {NAV_LINKS.map((link) => {
                  const active = activeId === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => go(link.id as never)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative rounded-full px-4 py-2 text-sm font-medium transition",
                        // Active link gets an opaque cream pill with dark
                        // forest text — clearly readable on top of any hero
                        // photo (the old green-on-photo combo was illegible).
                        active ? "text-forest" : "text-cream/70 hover:text-cream"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-cream shadow-[0_4px_18px_rgba(11,31,26,0.4)] ring-1 ring-forest/10"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      {link.label}
                    </button>
                  );
                })}
              </div>

              {/* Actions — all cream on hero */}
              <div className="flex items-center gap-1.5 max-sm:gap-0.5">
                <IconTooltip label="جستجو" side="bottom">
                  <button
                    aria-label="جستجو"
                    onClick={() => useSearchPalette.getState().setOpen(true)}
                    className="grid h-9 w-9 place-items-center rounded-full text-cream/70 transition hover:bg-cream/10 hover:text-cream max-md:h-11 max-md:w-11"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </IconTooltip>
                <div className="max-md:hidden">
                  <ThemeToggle />
                </div>
                <div className="max-sm:hidden">
                  <WishlistButton />
                </div>
                <div className="max-md:hidden">
                  <NotificationCenter />
                </div>
                <CartButton />
                <div className="hidden sm:block">
                  <UserMenu />
                </div>

                {/* Mobile menu trigger */}
                <IconTooltip label="منو" side="bottom">
                  <button
                    aria-label="منو"
                    onClick={() => setMenuOpen(true)}
                    className="grid h-9 w-9 place-items-center rounded-full text-cream/70 transition hover:bg-cream/10 hover:text-cream max-md:h-11 max-md:w-11 lg:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </IconTooltip>
              </div>
            </nav>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ===== Floating menu button — when scrolled past hero.
              Lives at the TOP-LEFT, horizontally aligned with the
              scroll-to-top button (bottom-left) — user request. ===== */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setMenuOpen(true)}
            aria-label="منو"
            className="fixed left-4 top-4 z-50 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition hover:scale-105 hover:bg-emerald-dark md:left-6 md:top-6"
          >
            <Menu className="h-5 w-5" />
            {/* Cart badge */}
            {useCart.getState().count() > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {toFa(useCart.getState().count())}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== Slide-in menu — works for both states ===== */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="w-80 max-sm:w-[88vw] overflow-hidden p-0 [&_[data-slot=sheet-close]]:hidden"
        >
          <SheetHeader className="shrink-0 border-b p-5">
            <SheetTitle className="flex items-center justify-between text-right">
              <button onClick={() => go("home")} className="flex items-center gap-2">
                <BrandMark className="h-9 w-9" />
                <span>کوچ‌نشین</span>
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="بستن منو"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </SheetTitle>
          </SheetHeader>

          {/* Nav links — active item derives from the URL; the soft
              primary pill slides between rows with layoutId.
              v29 fix: on short screens the bottom sheet is capped at
              92svh, so this block becomes the scrollable flex-1 area —
              the profile card pinned at the bottom now ALWAYS stays
              inside the sheet box (was: name spilling out of the frame). */}
          <div className="custom-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-4">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = activeId === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    go(link.id as never);
                    setMenuOpen(false);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 items-center justify-between rounded-2xl px-4 py-3 text-right transition",
                    active ? "text-primary" : "hover:bg-secondary"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="drawer-nav-pill"
                      className="absolute inset-0 -z-10 rounded-2xl bg-primary/10 ring-1 ring-primary/20"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5 transition", active && "scale-110")} />
                    {link.label}
                  </span>
                  <ChevronLeft className={cn("h-4 w-4 transition", active ? "opacity-100 text-primary" : "opacity-50")} />
                </button>
              );
            })}
          </div>

          {/* Quick actions — shrink-0 so the profile card is never
              squeezed or pushed out of the box on small screens */}
          <div className="shrink-0 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-center gap-2">
              <IconTooltip label="جستجو" side="top">
                <button
                  aria-label="جستجو"
                  onClick={() => {
                    useSearchPalette.getState().setOpen(true);
                    setMenuOpen(false);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-xl text-foreground/70 transition hover:bg-primary/10 hover:text-primary"
                >
                  <Search className="h-5 w-5" />
                </button>
              </IconTooltip>
              {/* v27 — variant="sheet": جستجو/تم/علاقه‌مندی/اعلان/سبد همیشه
                  با رنگ foreground داخل منو دیده می‌شوند (قبلاً روی شیت سفید
                  کِرِم بودند و نامرئی می‌شدند) */}
              <ThemeToggle variant="sheet" />
              <WishlistButton variant="sheet" />
              <NotificationCenter variant="sheet" />
              <CartButton variant="sheet" />
            </div>
            <div className="pt-2 flex justify-center">
              <UserMenu full />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

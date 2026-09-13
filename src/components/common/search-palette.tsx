"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Map as MapIcon,
  Tent,
  Compass,
  Mountain,
  MapPin,
  Star,
  CornerDownLeft,
  Search as SearchIcon,
} from "lucide-react";
import { useSearchPalette } from "@/store/search-palette-store";
import {
  useRecentSearches,
  formatRelativeTs,
  type RecentSearch,
} from "@/store/recent-searches-store";
import { useGo } from "@/lib/use-go";
import { tours, destinations } from "@/mocks/tours";
import { equipment } from "@/mocks/equipment";
import { toFa, formatCurrency, CATEGORY_LABELS } from "@/lib/format";
import { SmartImage } from "@/components/common/smart-image";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, X, ArrowUpRight } from "lucide-react";

type ResultGroup = "tours" | "destinations" | "equipment" | "pages";
interface ResultItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  group: ResultGroup;
  badge?: string;
  action: () => void;
}

const QUICK_PAGES = [
  { id: "home", title: "خانه", icon: Compass },
  { id: "tours", title: "همه تورها", icon: MapIcon },
  { id: "destinations", title: "مقاصد گردشگری", icon: MapPin },
  { id: "equipment", title: "فروشگاه تجهیزات", icon: Tent },
  { id: "leader-dashboard", title: "پنل لیدر", icon: Mountain },
  { id: "blog", title: "مجله سفر", icon: Compass },
];

const GROUP_LABELS: Record<ResultGroup, string> = {
  tours: "تورها",
  destinations: "مقاصد",
  equipment: "تجهیزات",
  pages: "صفحات",
};

const GROUP_ICONS: Record<ResultGroup, typeof MapIcon> = {
  tours: MapIcon,
  destinations: MapPin,
  equipment: Tent,
  pages: Compass,
};

export function SearchPalette() {
  // Selective subscriptions: the palette stays mounted app-wide, so it must
  // not re-render on unrelated store slices (e.g. recent-searches writes).
  const open = useSearchPalette((s) => s.open);
  const setOpen = useSearchPalette((s) => s.setOpen);
  const query = useSearchPalette((s) => s.query);
  const setQuery = useSearchPalette((s) => s.setQuery);
  const go = useGo();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Build all results based on query
  const results = React.useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const out: ResultItem[] = [];

    const toursFiltered = q
      ? tours.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q) ||
            t.province.toLowerCase().includes(q)
        )
      : tours.slice(0, 4);

    toursFiltered.slice(0, 6).forEach((t) => {
      out.push({
        id: `tour-${t.id}`,
        title: t.title,
        subtitle: `${t.destination} • ${CATEGORY_LABELS[t.category]}`,
        image: t.images[0],
        group: "tours",
        badge: toFa(t.rating),
        action: () => {
          go("tour-detail", { id: t.id });
          closePalette();
        },
      });
    });

    const destFiltered = q
      ? destinations.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.province.toLowerCase().includes(q)
        )
      : destinations.slice(0, 4);

    destFiltered.slice(0, 4).forEach((d) => {
      out.push({
        id: `dest-${d.id}`,
        title: d.name,
        subtitle: `${d.province} • ${toFa(d.toursCount)} تور`,
        image: d.image,
        group: "destinations",
        badge: CATEGORY_LABELS[d.category],
        action: () => {
          go("tours", { destination: d.name });
          closePalette();
        },
      });
    });

    // Add a "browse all destinations" entry when searching destinations
    if (q && destFiltered.length > 0) {
      out.push({
        id: "dest-browse-all",
        title: "همه مقاصد را ببین",
        subtitle: `${toFa(destinations.length)} مقصد`,
        group: "destinations",
        action: () => {
          go("destinations");
          closePalette();
        },
      });
    }

    const equipFiltered = q
      ? equipment.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.brand.toLowerCase().includes(q)
        )
      : equipment.slice(0, 4);

    equipFiltered.slice(0, 4).forEach((e) => {
      out.push({
        id: `eq-${e.id}`,
        title: e.title,
        subtitle: `${e.brand} • ${formatCurrency(e.price)}`,
        image: e.images[0],
        group: "equipment",
        action: () => {
          go("product-detail", { id: e.id });
          closePalette();
        },
      });
    });

    // pages
    const pageFiltered = q
      ? QUICK_PAGES.filter((p) => p.title.toLowerCase().includes(q))
      : QUICK_PAGES;
    pageFiltered.slice(0, 4).forEach((p) => {
      out.push({
        id: `page-${p.id}`,
        title: p.title,
        subtitle: "صفحه",
        group: "pages",
        action: () => {
          go(p.id as never);
          closePalette();
        },
      });
    });

    return out;
  }, [query, go]);

  const addRecentSearch = useRecentSearches((s) => s.add);
  const closePalette = React.useCallback(() => {
    if (query.trim().length >= 2) addRecentSearch(query.trim());
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, [setOpen, setQuery, query, addRecentSearch]);

  // Keyboard shortcuts: Cmd/Ctrl+K to open, Esc to close
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useSearchPalette.getState().toggle();
      }
      if (e.key === "Escape" && useSearchPalette.getState().open) {
        closePalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closePalette]);

  // Focus input when opened + lock body scroll so arrow keys don't scroll
  // the background page while the palette is open.
  // We use TWO mechanisms:
  //  1. `document.body.style.overflow = "hidden"` — prevents normal scroll
  //  2. A window-level `keydown` capture handler that calls `preventDefault`
  //     on ArrowUp/ArrowDown/PageUp/PageDown/Space/Home/End when the palette
  //     is open. This is needed because the home page uses `SnapScroll` which
  //     listens to `wheel`/`keydown` on `window` and would otherwise scroll
  //     the snap container even when body overflow is locked.
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const blockScrollKeys = new Set([
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
        "Space",
      ]);
      const onKey = (e: KeyboardEvent) => {
        if (blockScrollKeys.has(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      // Use capture phase so we intercept before SnapScroll's handler.
      window.addEventListener("keydown", onKey, { capture: true });

      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey, { capture: true });
      };
    } else {
      setQuery("");
      setActiveIdx(0);
    }
  }, [open, setQuery]);

  // Arrow key navigation — works on both the recent/trending view (which
  // has no `results`) and the search-results view. When `results` is empty
  // (default view), arrow keys do nothing to avoid clamping activeIdx to -1.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      if (results.length === 0) return;
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      if (results.length === 0) return;
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (results.length === 0 || !results[activeIdx]) return;
      e.preventDefault();
      results[activeIdx].action();
    } else if (e.key === "Home") {
      if (results.length === 0) return;
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === "End") {
      if (results.length === 0) return;
      e.preventDefault();
      setActiveIdx(results.length - 1);
    } else if (e.key === "PageDown") {
      if (results.length === 0) return;
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 5, results.length - 1));
    } else if (e.key === "PageUp") {
      if (results.length === 0) return;
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 5, 0));
    }
  };

  // Group results for display
  const grouped = React.useMemo(() => {
    const map: Record<ResultGroup, ResultItem[]> = {
      tours: [],
      destinations: [],
      equipment: [],
      pages: [],
    };
    results.forEach((r) => map[r.group].push(r));
    return map;
  }, [results]);

  // Flatten for indexing with group labels
  const flatWithHeaders = React.useMemo(() => {
    const out: ({ type: "header"; group: ResultGroup } | ResultItem)[] = [];
    (Object.keys(grouped) as ResultGroup[]).forEach((g) => {
      if (grouped[g].length > 0) {
        out.push({ type: "header", group: g });
        grouped[g].forEach((item) => out.push(item));
      }
    });
    return out;
  }, [grouped]);

  // Reset active index when query changes
  React.useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Scroll active item into view
  React.useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(
      `[data-idx="${activeIdx}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  // Compute flat index map
  const itemIndexMap = React.useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    flatWithHeaders.forEach((entry) => {
      if ("type" in entry && entry.type === "header") return;
      map.set((entry as ResultItem).id, idx);
      idx++;
    });
    return map;
  }, [flatWithHeaders]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePalette}
            className="absolute inset-0 bg-forest/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b p-4 max-sm:gap-2 max-sm:p-3">
              <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="جستجوی تور، مقصد، تجهیز..."
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={closePalette}
                aria-label="بستن جستجو"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="custom-scroll max-h-[60vh] overflow-y-auto p-2"
            >
              {query.trim() && results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary">
                    <Search className="h-6 w-6 opacity-50" />
                  </div>
                  <div>
                    <p className="font-semibold">نتیجه‌ای یافت نشد</p>
                    <p className="mt-1 text-sm">
                      برای «{query}» چیزی پیدا نکردیم.
                    </p>
                  </div>
                </div>
              ) : !query.trim() ? (
                <RecentAndTrending onPick={(q) => setQuery(q)} />
              ) : (
                flatWithHeaders.map((entry) => {
                  if ("type" in entry && entry.type === "header") {
                    const Icon = GROUP_ICONS[entry.group];
                    return (
                      <div
                        key={`h-${entry.group}`}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {GROUP_LABELS[entry.group]}
                      </div>
                    );
                  }
                  const item = entry as ResultItem;
                  const idx = itemIndexMap.get(item.id) ?? 0;
                  const active = idx === activeIdx;
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onMouseMove={() => setActiveIdx(idx)}
                      onClick={item.action}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl p-2.5 text-right transition",
                        active ? "bg-primary/10" : "hover:bg-secondary/60"
                      )}
                    >
                      {item.image ? (
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                          <SmartImage
                            src={item.image}
                            alt={item.title}
                            fallback={item.group === "equipment" ? "equipment" : "tour"}
                            aspectClass="aspect-square"
                            shimmer={false}
                          />
                        </div>
                      ) : (
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Compass className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          <HighlightedText text={item.title} query={query} />
                        </p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-muted-foreground">
                            <HighlightedText text={item.subtitle} query={query} />
                          </p>
                        )}
                      </div>
                      {item.badge && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                          {item.group === "tours" && (
                            <Star className="h-3 w-3 fill-current" />
                          )}
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <CornerDownLeft className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer — keyboard shortcuts legend removed per spec. The
                keyboard handlers (↑/↓/↵/Esc/Cmd+K) in onKeyDown and the
                global keydown listener above still work; only the visual
                legend was removed. */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Trending searches (static, based on popular destinations)
const TRENDING_SEARCHES = [
  "دماوند",
  "کویر لوت",
  "قشم",
  "تخت جمشید",
  "جنگل ابر",
];

function RecentAndTrending({ onPick }: { onPick: (q: string) => void }) {
  const recent = useRecentSearches((s) => s.queries) as RecentSearch[];
  const removeRecent = useRecentSearches((s) => s.remove);
  const clearRecent = useRecentSearches((s) => s.clear);

  return (
    <div className="space-y-5 p-3">
      {/* Recent searches */}
      {recent.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              جستجوهای اخیر
            </span>
            <button
              onClick={clearRecent}
              className="relative text-[11px] text-muted-foreground transition hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
            >
              پاک کردن
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((r) => (
              <div
                key={r.q}
                className="group flex items-center gap-1.5 rounded-full border bg-secondary/50 py-1 pr-3 pl-1.5 text-sm transition hover:border-primary"
              >
                <button
                  onClick={() => onPick(r.q)}
                  className="flex items-center gap-1.5 text-foreground/80"
                >
                  <span>{r.q}</span>
                  <span className="hidden text-[10px] font-medium text-muted-foreground/70 sm:inline">
                    {formatRelativeTs(r.ts)}
                  </span>
                </button>
                <button
                  onClick={() => removeRecent(r.q)}
                  className="relative grid h-5 w-5 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                  aria-label={`حذف ${r.q}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <RecentEmptyState onPick={onPick} />
      )}

      {/* Trending searches */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-sunset" />
          جستجوهای پرطرفدار
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING_SEARCHES.map((q, i) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="flex items-center gap-1 rounded-full border border-sunset/20 bg-sunset/5 px-3 py-1 text-sm text-sunset transition hover:border-sunset hover:bg-sunset/10"
            >
              {i < 3 && (
                <span className="text-[10px] font-black leading-none text-sunset/60">
                  {toFa(i + 1)}.
                </span>
              )}
              {q}
              <ArrowUpRight className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Suggested tours (first 3) */}
      <div>
        <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          پیشنهادها
        </div>
        <div className="space-y-1">
          {tours.slice(0, 3).map((t) => (
            <button
              key={t.id}
              onClick={() => onPick(t.destination)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-right transition hover:bg-secondary"
            >
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                <SmartImage
                  src={t.images[0]}
                  alt={t.title}
                  fallback="tour"
                  shimmer={false}
                  aspectClass="size-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.destination} • {CATEGORY_LABELS[t.category]}
                </p>
              </div>
              <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Quick experience categories shown when there is no search history yet. */
const EXPERIENCE_CHIPS = [
  { key: "mountain", label: "کوهنوردی", cls: "border-emerald/25 bg-emerald/5 text-emerald hover:border-emerald hover:bg-emerald/10" },
  { key: "desert", label: "بیابان‌گردی", cls: "border-gold/30 bg-gold/5 text-gold hover:border-gold hover:bg-gold/10" },
  { key: "forest", label: "جنگل", cls: "border-emerald-light/30 bg-emerald-light/5 text-emerald-light hover:border-emerald-light hover:bg-emerald-light/10" },
  { key: "coastal", label: "ساحلی", cls: "border-sunset/25 bg-sunset/5 text-sunset hover:border-sunset hover:bg-sunset/10" },
  { key: "historical", label: "تاریخی", cls: "border-forest/25 bg-forest/5 text-forest hover:border-forest hover:bg-forest/10 dark:border-cream/25 dark:bg-cream/5 dark:text-cream dark:hover:border-cream dark:hover:bg-cream/10" },
] as const;

function RecentEmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-4 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-background shadow-sm ring-1 ring-border/60">
        <Search className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <p className="mt-2.5 text-sm font-semibold">
        جستجوهای اخیر شما اینجا نمایش داده می‌شود
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        یا از دسته‌بندی‌های زیر شروع کنید:
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {EXPERIENCE_CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => onPick(CATEGORY_LABELS[c.key])}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-bold transition",
              c.cls
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Highlights the matched substring of `text` (case-insensitive) with a soft gold mark. */
function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const q = query.trim();
  if (q.length < 2) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-gold/25 px-0.5 text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

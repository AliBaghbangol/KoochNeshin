"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarCheck,
  ChevronsLeftRight,
  Info,
  Star,
  Tag,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { create } from "zustand";
import { useNotifications, type NotificationType } from "@/store/notifications-store";
import { useGo } from "@/lib/use-go";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";

/**
 * NotificationRealtimeBridge — connects the app to the notification
 * mini-service (socket.io, port 3004 behind the gateway) and:
 *
 *  1. Receives `notification:new` broadcasts and injects them into the
 *     notifications store (server ids → deduped by the store).
 *  2. Shows a rich auto-dismissing toast for each new live event
 *     (only when the tab is visible).
 *  3. Exposes `useRealtimeStatus` (connection state + online count) so the
 *     notification center can render a «زنده / آفلاین» chip.
 *  4. Exposes `simulateLiveEvent()` used by the notification-center demo
 *     button to ask the server to broadcast an event immediately.
 *
 * Zero UI on its own besides the toast. Mount once in AppShell.
 */

export type RealtimeStatus = "connecting" | "online" | "offline";

interface RealtimeState {
  status: RealtimeStatus;
  onlineCount: number;
  lastEventAt: string | null;
  set: (s: Partial<Omit<RealtimeState, "set">>) => void;
}

export const useRealtimeStatus = create<RealtimeState>()((set) => ({
  status: "connecting",
  onlineCount: 0,
  lastEventAt: null,
  set: (s) => set(s),
}));

let activeSocket: Socket | null = null;

/** Ask the server to broadcast a live event immediately (demo/QA helper). */
export function simulateLiveEvent() {
  if (activeSocket?.connected) {
    activeSocket.emit("notifications:simulate");
    return true;
  }
  return false;
}

const TYPE_ICON: Record<NotificationType, typeof Tag> = {
  discount: Tag,
  booking: CalendarCheck,
  review: Star,
  system: Info,
  social: Users,
};

/** Solid accent (CSS var) per type — used for SVG strokes and bars. */
const TYPE_SOLID: Record<NotificationType, string> = {
  discount: "var(--sunset)",
  booking: "var(--emerald)",
  review: "var(--gold)",
  system: "var(--emerald-light)",
  social: "var(--emerald)",
};

/** Countdown ring geometry (must match the `toast-ring` keyframes). */
const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R; // ≈ 125.7
const TOAST_DURATION = 7000;
const SWIPE_THRESHOLD = 90;

interface LivePayload {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionLabel?: string;
  actionView?: string;
}

function LiveToast({
  payload,
  onClose,
}: {
  payload: LivePayload;
  onClose: () => void;
}) {
  const go = useGo();
  const Icon = TYPE_ICON[payload.type] ?? Bell;
  const solid = TYPE_SOLID[payload.type] ?? "var(--emerald)";

  // Timer that pauses while hovered/held and resumes with the remaining
  // time; the SVG ring freezes in sync via animation-play-state.
  const [paused, setPaused] = React.useState(false);
  const [exitX, setExitX] = React.useState<number | null>(null);
  const remainingRef = React.useRef(TOAST_DURATION);
  const startRef = React.useRef<number>(Date.now());
  const timerRef = React.useRef<number | null>(null);
  const draggedRef = React.useRef(false);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (paused) {
      remainingRef.current = Math.max(
        600,
        remainingRef.current - (Date.now() - startRef.current)
      );
      clearTimer();
      return;
    }
    startRef.current = Date.now();
    timerRef.current = window.setTimeout(onClose, remainingRef.current);
    return clearTimer;
  }, [paused, onClose, clearTimer]);

  const handleClick = () => {
    // Ignore the click that browsers fire right after a swipe/drag.
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    useNotifications.getState().markRead(payload.id);
    if (payload.actionView) {
      go(payload.actionView as never);
    }
    onClose();
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragStart={() => {
        draggedRef.current = true;
        setPaused(true);
      }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
          // Fly the toast off toward the swipe direction, then unmount.
          setExitX(info.offset.x > 0 ? 440 : -440);
          requestAnimationFrame(() => onClose());
        } else {
          setPaused(false);
          window.setTimeout(() => {
            draggedRef.current = false;
          }, 80);
        }
      }}
      initial={{ opacity: 0, y: -28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: exitX === null ? -14 : 0,
        x: exitX ?? 0,
        scale: exitX === null ? 0.94 : 0.92,
        transition: { duration: 0.28, ease: "easeIn" },
      }}
      whileDrag={{ scale: 1.03 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="pointer-events-auto relative cursor-grab touch-pan-y active:cursor-grabbing"
      role="status"
      aria-live="polite"
    >
      <motion.button
        onClick={handleClick}
        className="relative block w-full overflow-hidden rounded-2xl border border-border/60 bg-card p-4 pl-10 text-right shadow-[0_18px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${payload.title} — ${payload.body}`}
      >
        {/* Colored accent edge (RTL start side) */}
        <span
          className="absolute inset-y-0 right-0 w-1.5"
          style={{ backgroundColor: solid }}
          aria-hidden
        />
        <span className="flex items-start gap-3">
          {/* Icon tile wrapped in the live countdown ring */}
          <span className="relative grid h-11 w-11 shrink-0 place-items-center">
            <svg
              viewBox="0 0 44 44"
              className="absolute inset-0 h-full w-full -rotate-90"
              aria-hidden
            >
              <circle
                cx="22"
                cy="22"
                r={RING_R}
                fill="none"
                stroke={solid}
                strokeOpacity="0.18"
                strokeWidth="3"
              />
              <circle
                cx="22"
                cy="22"
                r={RING_R}
                fill="none"
                stroke={solid}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                style={{
                  animation: `toast-ring ${TOAST_DURATION / 1000}s linear forwards`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            </svg>
            <Icon className="h-5 w-5" style={{ color: solid }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-bold text-foreground">
                {payload.title}
              </span>
              <span
                className="flex shrink-0 items-center gap-1 rounded-full bg-foreground/5 px-1.5 py-0.5 text-[9px] font-bold"
                style={{ color: solid }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ backgroundColor: solid }}
                />
                زنده
              </span>
            </span>
            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-foreground/75">
              {payload.body}
            </span>
            {payload.actionLabel && (
              <span
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold group-hover:underline"
                style={{ color: solid }}
              >
                {payload.actionLabel}
                <span aria-hidden>←</span>
              </span>
            )}
          </span>
        </span>
      </motion.button>

      {/* Close (X) — sibling of the button, never nested inside it */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          draggedRef.current = false;
          onClose();
        }}
        aria-label="بستن اعلان"
        className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Paused / swipe hint — appears while the toast is held */}
      {paused && exitX === null && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 flex items-center justify-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 text-[9px] font-bold text-background backdrop-blur"
        >
          <ChevronsLeftRight className="h-3 w-3" />
          تایمر متوقف شد — برای بستن بکشید
        </motion.span>
      )}
    </motion.div>
  );
}

export function NotificationRealtimeBridge() {
  const [toast, setToast] = React.useState<LivePayload | null>(null);
  const setRealtime = useRealtimeStatus((s) => s.set);

  const showToast = React.useCallback((p: LivePayload) => {
    if (typeof document !== "undefined" && document.hidden) return; // silent when tab hidden
    // Replacing the payload remounts LiveToast (keyed by id) with a fresh
    // 7s timer — the toast itself owns its lifetime now (pause-aware).
    setToast(p);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Connection target is environment-adaptive:
    //  - Sandbox/preview (any non-local host) → Caddy gateway via XTransformPort.
    //    Never use PORT in the URL, always use XTransformPort (Caddy gateway).
    //  - Local run (localhost/127.0.0.1) → the notification mini-service port
    //    directly (start it with `bun run dev` inside mini-services/notification-service).
    const localHosts = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];
    const isLocalRun = localHosts.includes(window.location.hostname);
    const socket = io(
      isLocalRun ? "http://localhost:3004" : "/?XTransformPort=3004",
      {
        transports: ["websocket", "polling"],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 15000,
        timeout: 10000,
      },
    );
    activeSocket = socket;

    setRealtime({ status: "connecting" });

    socket.on("connect", () => {
      setRealtime({ status: "online" });
    });

    socket.on("notifications:hello", (data: { online?: number }) => {
      setRealtime({
        status: "online",
        onlineCount: typeof data?.online === "number" ? data.online : 0,
      });
    });

    socket.on("platform:stats", (data: { online?: number }) => {
      setRealtime({
        onlineCount: typeof data?.online === "number" ? data.online : 0,
      });
    });

    socket.on("notification:new", (payload: LivePayload) => {
      if (!payload?.id || !payload?.type || !payload?.title) return;
      useNotifications.getState().add({
        id: payload.id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        actionLabel: payload.actionLabel,
        actionView: payload.actionView,
      });
      useRealtimeStatus.getState().set({ lastEventAt: new Date().toISOString() });
      showToast(payload);
    });

    socket.on("disconnect", () => {
      setRealtime({ status: "offline" });
    });

    socket.on("connect_error", () => {
      setRealtime({ status: "offline" });
    });

    return () => {
      socket.disconnect();
      activeSocket = null;
    };
  }, [setRealtime, showToast]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[300]",
        // Live notifications now live at the TOP: top-center on phones and
        // tablets, top-right on desktop — and the body is fully opaque so
        // text stays readable over any background.
        "max-lg:top-3 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:w-[min(24rem,calc(100vw-1.5rem))]",
        "lg:top-6 lg:right-6 lg:w-[24rem]",
      )}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {toast && <LiveToast key={toast.id} payload={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

/** Small live-status chip used inside the notification center header. */
export function RealtimeStatusChip() {
  const status = useRealtimeStatus((s) => s.status);
  const onlineCount = useRealtimeStatus((s) => s.onlineCount);

  if (status === "online") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emerald"
        title={`اتصال زنده برقرار است — ${toFa(onlineCount)} کاربر آنلاین`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
        </span>
        زنده
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
      title={status === "connecting" ? "در حال اتصال…" : "اتصال برقرار نیست"}
    >
      {status === "connecting" ? (
        <Wifi className="h-3 w-3 animate-pulse" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      {status === "connecting" ? "اتصال…" : "آفلاین"}
    </span>
  );
}

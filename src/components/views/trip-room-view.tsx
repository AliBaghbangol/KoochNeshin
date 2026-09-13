"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Lock, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookings } from "@/store/bookings-store";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { useTripRoomFor, useTrackTripRoomOpened } from "@/data/use-trip-room";
import { findBooking } from "@/lib/bookings/mock-bookings";
import { TripRoomTabs } from "@/components/trip-room/trip-room-tabs";
import { flagOn } from "@/lib/feature-flags";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";

/**
 * Trip Room view — spec §2.
 *
 * URL: /trips/[bookingId]/room
 *
 * Rules:
 *  - If the booking is `pending`, the chat is read-only.
 *  - If the booking is `cancelled` or not found → empty state.
 *  - Guests (unauthenticated) are sent to the auth modal.
 */
export function TripRoomView() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId;
  const userBookings = useBookings((s) => s.bookings);
  const { isAuthenticated } = useAuth();
  const authHydrated = useAuthHydrated();
  const { setAuthOpen } = useNav();

  const booking = bookingId ? findBooking(userBookings, bookingId) : undefined;

  const room = useTripRoomFor(booking ?? null);
  useTrackTripRoomOpened(bookingId ?? null);

  if (!flagOn("tripRoom")) {
    return <DisabledState />;
  }

  // Wait for the persisted auth state to rehydrate BEFORE deciding whether
  // the visitor is a guest — otherwise logged-in users get the auth modal
  // spuriously opened during the first (unhydrated) render.
  if (!authHydrated) {
    return <Skeleton className="min-h-[60vh] w-full rounded-2xl" />;
  }

  if (!isAuthenticated) {
    return <GuestRedirect onLogin={() => setAuthOpen(true)} />;
  }

  if (!booking) {
    return (
      <EmptyState
        title="رزرو پیدا نشد"
        body="این رزرو در دسترس نیست یا حذف شده است."
      />
    );
  }

  if (booking.status === "cancelled") {
    return (
      <EmptyState
        title="این رزرو لغو شده است"
        body="اتاق سفر برای رزروهای لغوشده در دسترس نیست."
      />
    );
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <ScrollReveal>
        <button
          onClick={() => window.history.back()}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          بازگشت
        </button>

        <TripRoomTabs room={room} />

        {booking.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-2 rounded-2xl border border-gold/30 bg-gold/5 p-3 text-[12px]"
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p>
              رزرو شما هنوز تأیید نشده است. فقط می‌توانید اعلامیه‌ها را بخوانید.
              پس از تأیید رزرو، چت برای شما باز خواهد شد.
            </p>
          </motion.div>
        )}
      </ScrollReveal>
    </div>
  );
}

/**
 * GuestRedirect — opens the auth modal exactly once for confirmed guests.
 * The view already waits for auth rehydration before mounting this, so a
 * single fire is enough (deps []). The fired-ref guard also protects
 * against re-invocation if the parent re-renders for unrelated reasons.
 */
function GuestRedirect({ onLogin }: { onLogin: () => void }) {
  const firedRef = React.useRef(false);
  React.useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onLogin();
  }, [onLogin]);
  return <Skeleton className="min-h-[60vh] w-full rounded-2xl" />;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
          <MessageSquare className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-extrabold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function DisabledState() {
  return (
    <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-extrabold">این بخش فعلاً غیرفعال است</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          اتاق سفر به‌زودی فعال خواهد شد.
        </p>
      </div>
    </div>
  );
}

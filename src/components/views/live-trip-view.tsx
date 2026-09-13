"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookings } from "@/store/bookings-store";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { findBooking } from "@/lib/bookings/mock-bookings";
import { tours } from "@/mocks/tours";
import { LiveTripDashboard } from "@/components/live-trip/live-trip-dashboard";
import { flagOn } from "@/lib/feature-flags";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { track } from "@/lib/analytics/track";

/**
 * Live Trip view — spec §3.
 * URL: /trips/[bookingId]/live
 *
 * Only confirmed bookings can enter Live mode. Fires `live_trip_started`
 * on first mount.
 */
export function LiveTripView() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId;
  const userBookings = useBookings((s) => s.bookings);
  const { isAuthenticated } = useAuth();
  const authHydrated = useAuthHydrated();
  const { setAuthOpen } = useNav();

  const booking = bookingId ? findBooking(userBookings, bookingId) : undefined;
  const tour = booking ? (tours.find((t) => t.id === booking.tourId) ?? null) : null;

  React.useEffect(() => {
    if (booking) {
      track("live_trip_started", { bookingId: booking.id });
    }
    // Track once per booking entry; `booking` object identity changes on every
    // poll tick but we only care about the id transition here.
  }, [booking?.id]);

  if (!flagOn("liveTrip")) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold">حالت زنده فعلاً غیرفعال است</h2>
        </div>
      </div>
    );
  }

  // Wait for the persisted auth state to rehydrate BEFORE deciding whether
  // the visitor is a guest (prevents spurious auth modal for logged-in users).
  if (!authHydrated) {
    return <Skeleton className="min-h-[60vh] w-full rounded-2xl" />;
  }

  if (!isAuthenticated) {
    return <GuestRedirect onLogin={() => setAuthOpen(true)} />;
  }

  if (!booking) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
        <div>
          <h2 className="text-lg font-extrabold">رزرو پیدا نشد</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            این رزرو در دسترس نیست.
          </p>
        </div>
      </div>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
        <div>
          <h2 className="text-lg font-extrabold">این رزرو لغو شده است</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            حالت زنده برای رزروهای لغوشده در دسترس نیست.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <ScrollReveal>
        <button
          onClick={() => window.history.back()}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          بازگشت به اتاق سفر
        </button>
        <LiveTripDashboard booking={booking} tour={tour} />
      </ScrollReveal>
    </div>
  );
}

/**
 * GuestRedirect — opens the auth modal exactly once for confirmed guests.
 * The view already waits for auth rehydration before mounting this, so a
 * single fire is enough. The fired-ref guard prevents re-invocation.
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

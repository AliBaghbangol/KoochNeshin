import { NotFoundView } from "@/components/views/not-found-view";
import { OfflineIndicator } from "@/components/common/offline-indicator";

export default function NotFound() {
  return (
    <>
      <NotFoundView />
      {/* The 404 route renders standalone (no AppShell) — mount the offline
          experience here too so going offline while lost also gets the
          «اتصال قطع شد» scene instead of nothing. */}
      <OfflineIndicator />
    </>
  );
}

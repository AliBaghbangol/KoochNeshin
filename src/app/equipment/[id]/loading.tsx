import { AppShell } from "@/components/layout/app-shell";
import { KochLoader } from "@/components/common/koch-loader";

export default function Loading() {
  return (
    <AppShell>
      <KochLoader label="در حال باز کردن غلاف تجهیز…" />
    </AppShell>
  );
}

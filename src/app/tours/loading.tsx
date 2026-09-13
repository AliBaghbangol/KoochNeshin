import { AppShell } from "@/components/layout/app-shell";
import { KochLoader } from "@/components/common/koch-loader";

export default function Loading() {
  return (
    <AppShell>
      <KochLoader label="در حال کوچ به سراغ تورها…" />
    </AppShell>
  );
}

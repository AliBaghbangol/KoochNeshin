"use client";

import * as React from "react";
import { CreditCard, Loader2, Lock, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/store/wallet-store";
import { formatCurrency, formatNumber, toEn } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * «افزایش موجودی کیف پول» — wallet top-up dialog, opened from the checkout
 * payment step when the wallet balance can't cover the order (and reachable
 * anywhere else the dialog is mounted). The gateway row is a mock: the balance
 * is credited through the real wallet store (`useWallet.topUp`) but no real
 * payment happens and no real money moves.
 */

const PRESET_AMOUNTS = [500_000, 1_000_000, 2_000_000, 5_000_000];
const MIN_TOPUP = 100_000;
const MAX_TOPUP = 100_000_000;

export function WalletTopUpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const balance = useWallet((s) => s.balance);
  const topUp = useWallet((s) => s.topUp);

  const [selectedPreset, setSelectedPreset] = React.useState<number | null>(null);
  const [customRaw, setCustomRaw] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Fresh state every time the dialog opens — no stale amount from a
  // previous attempt should linger.
  React.useEffect(() => {
    if (open) {
      setSelectedPreset(null);
      setCustomRaw("");
      setLoading(false);
    }
  }, [open]);

  const amount = customRaw ? Number(customRaw) : selectedPreset;
  const outOfRange = amount !== null && (amount < MIN_TOPUP || amount > MAX_TOPUP);
  const canSubmit = amount !== null && !outOfRange;

  const handleCustomChange = (v: string) => {
    // Persian digits → Latin, digits only, 9 digits cap (up to ۱۰۰٬۰۰۰٬۰۰۰).
    setSelectedPreset(null);
    setCustomRaw(toEn(v).replace(/\D/g, "").slice(0, 9));
  };

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    // Mock gateway round-trip (~900ms) — then credit the real store balance.
    window.setTimeout(() => {
      topUp(amount);
      toast.success("کیف پول شارژ شد", {
        description: `${formatCurrency(amount)} به موجودی اضافه شد`,
      });
      setLoading(false);
      onOpenChange(false);
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl border-border/60 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-start">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
              <Wallet className="h-5 w-5" />
            </span>
            افزایش موجودی کیف پول
          </DialogTitle>
          <DialogDescription className="text-start">
            موجودی فعلی: {formatCurrency(balance)}
          </DialogDescription>
        </DialogHeader>

        {/* Preset amounts */}
        <div className="grid grid-cols-2 gap-2">
          {PRESET_AMOUNTS.map((preset) => {
            const selected = !customRaw && selectedPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset);
                  setCustomRaw("");
                }}
                className={cn(
                  "min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition",
                  selected
                    ? "border-gold bg-gold/10 text-gold shadow-sm shadow-gold/20"
                    : "border-border/60 bg-background text-foreground hover:border-gold/40 hover:bg-gold/5"
                )}
              >
                {formatNumber(preset)}
                <span className="ms-1 text-[10px] font-normal text-muted-foreground">
                  تومان
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        <div className="space-y-1.5">
          <Input
            value={customRaw}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="یا مبلغ دلخواه (تومان)"
            aria-label="مبلغ دلخواه به تومان"
            className="h-11 rounded-xl"
            inputMode="numeric"
            dir="ltr"
          />
          {amount !== null && (
            <p className="text-[11px] text-muted-foreground">
              مبلغ: {formatNumber(amount)} تومان
            </p>
          )}
          {outOfRange && (
            <p className="text-[11px] text-destructive">
              مبلغ باید بین {formatNumber(MIN_TOPUP)} تا {formatNumber(MAX_TOPUP)}{" "}
              تومان باشد.
            </p>
          )}
        </div>

        {/* Mock gateway */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold">درگاه بانکی — شبیه‌سازی پرداخت</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" />
              پرداخت آزمایشی، پول واقعی جابه‌جا نمی‌شود
            </p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="h-11 w-full rounded-2xl bg-gold text-base font-extrabold text-forest shadow-lg shadow-gold/20 transition hover:bg-gold/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال اتصال به درگاه...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              شارژ کیف پول
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

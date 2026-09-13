"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Check, X, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "kochneshin-cookie-consent";

type Choice = "all" | "essential";

const COOKIE_TYPES: {
  name: string;
  description: string;
  required: boolean;
}[] = [
  {
    name: "کوکی‌های ضروری",
    description:
      "این کوکی‌ها برای عملکرد صحیح سایت ضروری هستند و قابلیت غیرفعال‌سازی ندارند. شامل احراز هویت، سبد خرید، امنیت و ذخیره ترجیحات کاربر می‌شود.",
    required: true,
  },
  {
    name: "کوکی‌های تحلیلی",
    description:
      "به ما کمک می‌کنند بفهمیم کاربران چگونه با سایت تعامل دارند تا تجربه کاربری را بهبود ببخشیم. اطلاعات به‌صورت ناشناس و جمع‌آوری‌شده جمع‌آوری می‌شود.",
    required: false,
  },
  {
    name: "کوکی‌های بازاریابی",
    description:
      "برای نمایش تبلیغات مرتبط و شخصی‌سازی محتوا استفاده می‌شوند. فعالیت شما در سایت برای ارائه پیشنهادهای بهتر ردیابی می‌شود.",
    required: false,
  },
];

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [policyOpen, setPolicyOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setVisible(true), 2500);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = (choice: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
      // Let waiters (PWA install nudge) react immediately instead of polling.
      window.dispatchEvent(new CustomEvent("koch-consent-answered"));
    } catch {
      // ignore
    }
  };

  const accept = (choice: Choice) => {
    persist(choice);
    setVisible(false);
    setPolicyOpen(false);
    toast.success(
      choice === "all"
        ? "کوکی‌ها پذیرفته شدند"
        : "فقط کوکی‌های ضروری فعال شدند",
      { description: "تنظیمات ذخیره شد." }
    );
  };

  const reject = () => {
    persist("essential");
    setVisible(false);
    setPolicyOpen(false);
    toast.success("فقط کوکی‌های ضروری فعال شدند", {
      description: "شما می‌توانید هر زمان از تنظیمات تغییر دهید.",
    });
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed inset-x-4 bottom-4 z-[45] mx-auto max-w-2xl md:inset-x-auto md:right-6 md:left-6 max-sm:bottom-[max(4.75rem,calc(4.75rem+env(safe-area-inset-bottom)))]"
          >
            <div className="overflow-hidden rounded-3xl border bg-card/95 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                {/* Icon */}
                <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold sm:grid">
                  <Cookie className="h-7 w-7" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h4 className="flex items-center gap-2 text-sm font-bold">
                    <Cookie className="h-4 w-4 text-gold sm:hidden" />
                    استفاده از کوکی
                  </h4>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    ما از کوکی برای بهبود تجربه کاربری، تجزیه و تحلیل و شخصی‌سازی
                    محتوا استفاده می‌کنیم. با ادامه استفاده از سایت، شما با
                    <button
                      type="button"
                      onClick={() => setPolicyOpen(true)}
                      className="mx-1 font-semibold text-primary hover:underline"
                    >
                      سیاست کوکی
                    </button>
                    موافقت می‌کنید.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:flex-col max-sm:items-stretch max-sm:gap-2">
                  <button
                    type="button"
                    onClick={reject}
                    className="rounded-full border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:border-destructive hover:text-destructive max-sm:min-h-11 max-sm:w-full"
                  >
                    موافقت نمی‌کنم
                  </button>
                  <button
                    type="button"
                    onClick={() => accept("essential")}
                    className="rounded-full border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:border-foreground hover:text-foreground max-sm:min-h-11 max-sm:w-full"
                  >
                    فقط ضروری
                  </button>
                  <button
                    type="button"
                    onClick={() => accept("all")}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-emerald-dark max-sm:min-h-11 max-sm:w-full max-sm:justify-center"
                  >
                    <Check className="h-3.5 w-3.5" />
                    قبول همه
                  </button>
                  <button
                    type="button"
                    onClick={reject}
                    aria-label="بستن"
                    className="relative grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary sm:hidden max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Decorative gradient bar */}
              <div className="h-1 bg-gradient-to-l from-emerald via-gold to-sunset" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Policy Dialog */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto sm:max-w-lg">
          <DialogHeader className="text-right">
            <div className="mb-1 flex items-center gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                <Shield className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-extrabold">
                سیاست کوکی کوچ‌نشین
              </DialogTitle>
            </div>
            <DialogDescription className="text-right leading-6">
              این سیاست توضیح می‌دهد که چگونه کوچ‌نشین از کوکی‌ها و فناوری‌های
              مشابه در وب‌سایت خود استفاده می‌کند. شما می‌توانید با انتخاب
              گزینه‌های موجود، کنترل کامل روی استفاده از کوکی‌ها داشته باشید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {COOKIE_TYPES.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border bg-secondary/30 p-4"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h5 className="font-bold">{c.name}</h5>
                  {c.required ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      ضروری
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      اختیاری
                    </span>
                  )}
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  {c.description}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-row gap-2 sm:flex-row max-sm:flex-col">
            <Button
              variant="outline"
              onClick={() => accept("essential")}
              className="flex-1 max-sm:h-11"
            >
              فقط ضروری
            </Button>
            <Button
              onClick={() => accept("all")}
              className="flex-1 bg-primary text-primary-foreground max-sm:h-11"
            >
              قبول همه
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" className="flex-1 max-sm:h-11">
                بستن
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

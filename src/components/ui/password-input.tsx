"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * اینپوت رمز عبور با چشم نمایش/مخفی‌کردن (ورژن ۲۴ — بخش ۶ سند بررسی).
 * کاراکتر ماسک با `-webkit-text-security: disc` به دایره‌ی نرم‌تر تبدیل
 * می‌شود (فایرفاکس به بولت پیش‌فرض خودش برمی‌گردد که مشکلی نیست) و دکمه‌ی
 * چشم تجربه‌ی تایپ رمز را دقیق می‌کند.
 */
export function PasswordInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={show ? "text" : "password"}
        className={cn("custom-mask pe-10", className)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 start-3 grid w-8 place-items-center text-muted-foreground transition hover:text-emerald"
        aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

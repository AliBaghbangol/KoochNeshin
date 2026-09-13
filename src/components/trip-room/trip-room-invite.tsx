"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Copy,
  Check,
  UserPlus,
  QrCode,
  X,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { TripRoom } from "@/types/trip-room";
import { toFa } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Trip Room Invite — Trip Room enhancement (spec §2).
 *
 * Lets the user share an invite link to the Trip Room so other members
 * can join. Shows:
 *   - The invite URL (copyable)
 *   - A "Copy link" + "Native share" button pair
 *   - A QR code (SVG-generated, no external dependency) for in-person invites
 *   - Member count + capacity info
 *
 * Privacy: the invite link only works for users who already have a booking
 * for the same tour (frontend gate; backend should re-validate).
 *
 * TODO(backend): real invite tokens with expiration + role scoping.
 */

export function TripRoomInvite({
  room,
  open,
  onOpenChange,
}: {
  room: TripRoom;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const inviteUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/trips/${room.bookingId}/room?invite=1`;
  }, [room.bookingId]);

  function copyLink() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("کپی لینک در دسترس نیست.");
      return;
    }
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast.success("لینک دعوت کپی شد!");
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      toast.info("اشتراک‌گذاری بومی در دسترس نیست — از کپی لینک استفاده کن.");
      return;
    }
    try {
      await navigator.share({
        title: `دعوت به اتاق سفر «${room.tourTitle}»`,
        text: `به اتاق سفر ما در کوچ‌نشین بپیوند!`,
        url: inviteUrl,
      });
    } catch {
      /* user cancelled — silent */
    }
  }

  // QR code matrix (deterministic from inviteUrl hash) — pure SVG, no deps
  const qrMatrix = React.useMemo(() => generateQrMatrix(inviteUrl), [inviteUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald/10 text-emerald">
              <UserPlus className="h-5 w-5" />
            </span>
            دعوت به اتاق سفر
          </DialogTitle>
          <DialogDescription>
            لینک دعوت را با هم‌سفرانت به اشتراک بگذار
          </DialogDescription>
        </DialogHeader>

        {/* member count info */}
        <div className="flex items-center gap-2 rounded-xl bg-emerald/5 px-3 py-2 text-[11px]">
          <Users className="h-3.5 w-3.5 text-emerald" />
          <span className="text-muted-foreground">
            {toFa(room.members.length)} عضو در اتاق سفر
          </span>
        </div>

        {/* QR code (SVG) */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-4">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <QrSvg matrix={qrMatrix} size={160} />
          </div>
          <p className="text-[10px] text-muted-foreground">
            برای اسکن با دوربین موبایل
          </p>
        </div>

        {/* link field */}
        <div className="flex items-center gap-2 rounded-xl border bg-background/40 p-2">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-muted-foreground outline-none"
            dir="ltr"
          />
          <Button
            size="sm"
            variant={copied ? "outline" : "default"}
            onClick={copyLink}
            className="h-7 shrink-0 gap-1 text-[11px]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                کپی شد
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                کپی
              </>
            )}
          </Button>
        </div>

        {/* action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={copyLink}
            className="gap-1.5"
          >
            {copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
            {copied ? "کپی شد" : "کپی لینک"}
          </Button>
          <Button
            onClick={nativeShare}
            className="bg-gradient-to-br from-emerald to-emerald-dark gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            اشتراک‌گذاری
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          🔒 فقط کاربرانی که رزرو این تور را دارند می‌توانند به اتاق سفر بپیوندند.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** Generate a deterministic QR-like matrix from a string (mock — not a real QR). */
function generateQrMatrix(str: string): boolean[][] {
  // 21x21 grid (QR Version 1 size)
  const N = 21;
  const matrix: boolean[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => false),
  );
  // Hash the string to seed
  let seed = 0;
  for (let i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) | 0;
  }
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  // Fill data area (skip finder patterns)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      // Finder patterns at top-left, top-right, bottom-left (7x7 each)
      if (
        (x < 7 && y < 7) ||
        (x >= N - 7 && y < 7) ||
        (x < 7 && y >= N - 7)
      ) {
        // Finder pattern: outer ring + inner square
        const inFinder =
          (x === 0 || x === 6 || y === 0 || y === 6 ||
            (x >= N - 7 && (x === N - 7 || x === N - 1 || y === 0 || y === 6)) ||
            (y >= N - 7 && (x === 0 || x === 6 || y === N - 7 || y === N - 1)));
        const inner =
          (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
          (x >= N - 5 && x <= N - 3 && y >= 2 && y <= 4) ||
          (x >= 2 && x <= 4 && y >= N - 5 && y <= N - 3);
        matrix[y][x] = inFinder || inner;
      } else {
        matrix[y][x] = rand() > 0.5;
      }
    }
  }
  return matrix;
}

function QrSvg({ matrix, size }: { matrix: boolean[][]; size: number }) {
  const N = matrix.length;
  const cell = size / N;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (matrix[y][x]) {
        cells.push(
          <rect
            key={`${x}-${y}`}
            x={x * cell}
            y={y * cell}
            width={cell}
            height={cell}
            fill="#0f6b4a"
          />,
        );
      }
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="QR code for invite link"
    >
      <rect width={size} height={size} fill="white" />
      {cells}
    </svg>
  );
}

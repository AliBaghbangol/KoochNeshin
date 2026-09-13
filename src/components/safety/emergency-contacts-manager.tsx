"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Phone,
  Trash2,
  Pencil,
  Check,
  X,
  Bell,
  BellOff,
  AlertOctagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  useEmergencyContacts,
  normalizePhone,
  RELATIONSHIP_LABEL,
  MAX_EMERGENCY_CONTACTS,
  type ContactRelationship,
} from "@/store/emergency-contacts-store";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Emergency Contacts Manager — spec §4 expansion.
 *
 * Lets the user maintain up to 5 emergency contacts that get notified on
 * SOS. Each row has name, phone (with tel: link), relationship tag, and a
 * per-contact "notify on SOS" toggle.
 *
 * TODO(backend): sync to `POST /api/users/me/emergency-contacts`.
 */
export function EmergencyContactsManager() {
  const contacts = useEmergencyContacts((s) => s.contacts);
  const addContact = useEmergencyContacts((s) => s.addContact);
  const updateContact = useEmergencyContacts((s) => s.updateContact);
  const removeContact = useEmergencyContacts((s) => s.removeContact);

  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  function handleAdd(c: {
    name: string;
    phone: string;
    relationship: ContactRelationship;
    notifyOnSos: boolean;
  }) {
    const ok = addContact(c);
    if (!ok) {
      toast.error(`حداکثر ${toFa(MAX_EMERGENCY_CONTACTS)} مخاطب می‌توانید ثبت کنید.`);
      return;
    }
    toast.success("مخاطب اضطراری اضافه شد.");
    setOpen(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]"
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/10 text-red-600">
            <AlertOctagon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">مخاطبان اضطراری</h3>
            <p className="text-[10px] text-muted-foreground">
              هنگام SOS به این افراد هم اطلاع‌رسانی می‌شود
            </p>
          </div>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          {toFa(contacts.length)} / {toFa(MAX_EMERGENCY_CONTACTS)}
        </span>
      </div>

      {/* contact list */}
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {contacts.map((c) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="group flex items-center gap-3 rounded-2xl border bg-background/40 p-2.5 transition hover:shadow-sm"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald/10 text-emerald">
                <Phone className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-bold">{c.name}</p>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                    {RELATIONSHIP_LABEL[c.relationship]}
                  </span>
                </div>
                <a
                  href={`tel:${normalizePhone(c.phone)}`}
                  className="text-[11px] font-mono text-emerald hover:underline"
                  dir="ltr"
                >
                  {c.phone}
                </a>
              </div>
              <button
                type="button"
                aria-label={c.notifyOnSos ? "خاموش کردن اطلاع‌رسانی SOS" : "روشن کردن اطلاع‌رسانی SOS"}
                onClick={() =>
                  updateContact(c.id, { notifyOnSos: !c.notifyOnSos })
                }
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full transition",
                  c.notifyOnSos
                    ? "bg-emerald/15 text-emerald hover:bg-emerald/25"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
                title={c.notifyOnSos ? "اطلاع‌رسانی روشن" : "اطلاع‌رسانی خاموش"}
              >
                {c.notifyOnSos ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                aria-label="حذف مخاطب"
                onClick={() => {
                  removeContact(c.id);
                  toast.info("مخاطب حذف شد.");
                }}
                className="grid h-7 w-7 place-items-center rounded-full text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
        {contacts.length === 0 && (
          <li className="grid place-items-center rounded-2xl border border-dashed bg-background/30 p-5 text-center text-[11px] text-muted-foreground">
            هنوز مخاطب اضطراری ثبت نشده. حداقل یک نفر اضافه کن.
          </li>
        )}
      </ul>

      {/* add button / form */}
      {open ? (
        <ContactForm
          onSubmit={handleAdd}
          onCancel={() => setOpen(false)}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={contacts.length >= MAX_EMERGENCY_CONTACTS}
          onClick={() => setOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          {contacts.length >= MAX_EMERGENCY_CONTACTS
            ? `حداکثر ${toFa(MAX_EMERGENCY_CONTACTS)} مخاطب`
            : "افزودن مخاطب اضطراری"}
        </Button>
      )}

      <p className="mt-3 rounded-xl bg-muted/40 p-2 text-[10px] leading-4 text-muted-foreground">
        🔒 مخاطبان اضطراری فقط در زمان فوریت برای شما ارسال می‌شوند و در پروفایل
        عمومی شما دیده نمی‌شوند. در اضطرار واقعی، حتماً با اورژانس (۱۱۵) نیز تماس بگیرید.
      </p>
    </motion.div>
  );
}

function ContactForm({
  onSubmit,
  onCancel,
  initial,
}: {
  onSubmit: (c: {
    name: string;
    phone: string;
    relationship: ContactRelationship;
    notifyOnSos: boolean;
  }) => void;
  onCancel: () => void;
  initial?: {
    name: string;
    phone: string;
    relationship: ContactRelationship;
    notifyOnSos: boolean;
  };
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [phone, setPhone] = React.useState(initial?.phone ?? "");
  const [relationship, setRelationship] = React.useState<ContactRelationship>(
    initial?.relationship ?? "parent",
  );
  const [notifyOnSos, setNotifyOnSos] = React.useState(initial?.notifyOnSos ?? true);

  function submit() {
    if (!name.trim() || !phone.trim()) {
      toast.error("نام و شماره الزامی است.");
      return;
    }
    onSubmit({ name: name.trim(), phone: phone.trim(), relationship, notifyOnSos });
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 space-y-2 overflow-hidden rounded-2xl border bg-background/40 p-3"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="نام مخاطب"
        className="text-sm"
      />
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="شماره موبایل (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)"
        className="font-mono text-sm"
        dir="ltr"
      />
      <Select
        value={relationship}
        onValueChange={(v) => setRelationship(v as ContactRelationship)}
      >
        <SelectTrigger className="w-full text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(RELATIONSHIP_LABEL) as ContactRelationship[]).map((k) => (
            <SelectItem key={k} value={k}>
              {RELATIONSHIP_LABEL[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
        <span className="text-[11px] font-bold">اطلاع‌رسانی در SOS</span>
        <Switch checked={notifyOnSos} onCheckedChange={setNotifyOnSos} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} className="flex-1">
          <Check className="h-3.5 w-3.5" />
          ذخیره
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
          انصراف
        </Button>
      </div>
    </motion.div>
  );
}

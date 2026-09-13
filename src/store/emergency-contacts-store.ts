"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Emergency Contacts store — spec §4 expansion.
 *
 * Each user can register up to N emergency contacts (name + phone +
 * relationship) that will be notified alongside the leader when an SOS is
 * triggered. Persisted to localStorage so it survives refresh.
 *
 * TODO(backend): `POST /api/users/me/emergency-contacts` should sync these
 * to the server so they are available even when the user is offline or on
 * another device.
 */

export type ContactRelationship =
  | "parent"
  | "sibling"
  | "spouse"
  | "child"
  | "friend"
  | "other";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string; // Persian digits allowed — normalized before tel: link
  relationship: ContactRelationship;
  /** آیا در SOS به این شخص هم پیام ارسال شود */
  notifyOnSos: boolean;
}

const MAX_CONTACTS = 5;

interface EmergencyContactsState {
  contacts: EmergencyContact[];
  addContact: (c: Omit<EmergencyContact, "id">) => boolean;
  updateContact: (id: string, patch: Partial<EmergencyContact>) => void;
  removeContact: (id: string) => void;
  canAddMore: () => boolean;
}

function genId() {
  return `ec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/** تبدیل ارقام فارسی به انگلیسی برای tel: link */
export function normalizePhone(phone: string): string {
  const faToEn: Record<string, string> = {
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };
  return phone.replace(/[۰-۹]/g, (d) => faToEn[d] ?? d).replace(/[^\d+]/g, "");
}

export const RELATIONSHIP_LABEL: Record<ContactRelationship, string> = {
  parent: "والدین",
  sibling: "خواهر/برادر",
  spouse: "همسر",
  child: "فرزند",
  friend: "دوست",
  other: "سایر",
};

export const useEmergencyContacts = create<EmergencyContactsState>()(
  persist(
    (set, get) => ({
      contacts: [
        {
          id: "ec_seed_1",
          name: "خانه",
          phone: "۰۹۱۲۳۴۵۶۷۸۹",
          relationship: "parent",
          notifyOnSos: true,
        },
      ],
      addContact: (c) => {
        if (get().contacts.length >= MAX_CONTACTS) return false;
        set((s) => ({ contacts: [...s.contacts, { ...c, id: genId() }] }));
        return true;
      },
      updateContact: (id, patch) =>
        set((s) => ({
          contacts: s.contacts.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      removeContact: (id) =>
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      canAddMore: () => get().contacts.length < MAX_CONTACTS,
    }),
    { name: "koch-emergency-contacts-v1" },
  ),
);

export const MAX_EMERGENCY_CONTACTS = MAX_CONTACTS;

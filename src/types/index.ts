// ===== Core domain types for the Kochneshin tourism platform =====

export type TourCategory =
  | "mountain"
  | "desert"
  | "coastal"
  | "historical"
  | "forest";

export type Difficulty = "easy" | "medium" | "hard";

export type TourStatus = "active" | "full" | "finished" | "draft";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type UserRole = "guest" | "traveler" | "leader" | "seller" | "admin";

export type ProductCondition = "new" | "used";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  elevation?: number;
  distance?: number;
  meals: string[];
  highlight?: boolean;
}

export interface LeaderSummary {
  id: string;
  fullName: string;
  avatar: string;
  rating: number;
  experienceYears: number;
  verificationStatus: VerificationStatus;
}

export interface Leader extends LeaderSummary {
  bio: string;
  licenseImage?: string;
  nationalIdImage?: string;
  toursCount: number;
  specialties: string[];
  languages: string[];
  satisfaction: number;
  recentRatingTrend: { month: string; rating: number }[];
  bookingTrend: { month: string; bookings: number }[];
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  tourId?: string;
}

export interface Tour {
  id: string;
  title: string;
  destination: string;
  province: string;
  leaderId: string;
  leader: LeaderSummary;
  price: number;
  discountPrice?: number;
  duration: number;
  capacity: number;
  reservedCount: number;
  startDate: string;
  images: string[];
  category: TourCategory;
  difficulty: Difficulty;
  itinerary: ItineraryDay[];
  facilities: string[];
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  status: TourStatus;
  coordinates: { lat: number; lng: number };
  badges?: string[];
}

export interface Destination {
  id: string;
  name: string;
  province: string;
  image: string;
  description: string;
  toursCount: number;
  category: TourCategory;
  rating: number;
}

export interface EquipmentProduct {
  id: string;
  title: string;
  category: "mountaineering" | "camping" | "clothing" | "travel-gear";
  brand: string;
  price: number;
  rentPricePerDay?: number;
  availableForRent: boolean;
  availableForSale: boolean;
  /** Units available for direct sale. */
  stock: number;
  /** Units available for rent (defaults to `stock` when omitted). */
  rentStock?: number;
  images: string[];
  condition: ProductCondition;
  rating: number;
  description: string;
  specs: { label: string; value: string }[];
}

export interface CartItem {
  id: string;
  type: "tour" | "equipment-sale" | "equipment-rent";
  refId: string;
  title: string;
  image: string;
  unitPrice: number;
  quantity: number;
  meta?: {
    participants?: number;
    startDate?: string;
    rentDays?: number;
    rentStart?: string;
    rentEnd?: string;
  };
}

export interface Booking {
  id: string;
  tourId: string;
  tourTitle: string;
  userId: string;
  participantsCount: number;
  totalPrice: number;
  status: BookingStatus;
  date: string;
}

export interface User {
  id: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface ProvinceInfo {
  id: string;
  name: string;
  toursCount: number;
  cx: number;
  cy: number;
}

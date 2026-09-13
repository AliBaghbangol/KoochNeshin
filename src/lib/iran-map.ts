/**
 * Verified geography helpers for the home-page Iran map (iran-map-explorer).
 *
 * The SVG (/public/iran-map.svg, viewBox "-2 42.5 964 875") was generated
 * from amCharts geodata in Web-Mercator projection. The constants below were
 * SOLVED from the file itself:
 *
 *  - x anchors: the dataset's west/east extremes (44.038°E, 63.317°E) map to
 *    the path bounding box x ∈ [0, 960]  →  49.795 svg units per degree lon.
 *  - y scale: Mercator conformality requires y-units-per-mercator-unit =
 *    x-units-per-degree × 180/π = 2853.3 (verified: the fit reproduces Iran's
 *    real 1650 km N-S extent and keeps horizontal/vertical scales equal).
 *  - y anchor: dataset bbox top (44.5) = northernmost point 39.71°N.
 *
 * IMPORTANT — the SVG's path ids are NOT the ones most component code assumed.
 * They were verified by inverse-projecting every path's centroid and matching
 * it to the real province position (Khorasan Razavi is "IR-30", NOT "IR-11";
 * "IR-11" is Zanjan). Use PROVINCE_NAMES_FA below — never guess from ISO.
 */

/** svg-units per degree of longitude */
const K_X = 49.795;
/** svg-units offset (x = K_X·lon + B_X) */
const B_X = -2192.9;
/** svg-units per mercator unit (≈ K_X · 180/π, conformal) */
const K_Y = 2853.3;
/** svg-units offset (y = B_Y − K_Y·merc(lat)) */
const B_Y = 2200.0;

/** Web-Mercator "y" for a latitude (radians-ish unit). */
function mercN(latDeg: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (latDeg * Math.PI) / 360));
}

/** Project a real lat/lng into the iran-map.svg coordinate space.
 *  Output is rounded to 2 decimals — SSR (node) and the browser disagree on
 *  the last bits of Math.log/tan floats, which used to trigger a hydration
 *  mismatch warning on the SVG y attribute. */
export function projectIran(latDeg: number, lngDeg: number): { x: number; y: number } {
  const x = K_X * lngDeg + B_X;
  const y = B_Y - K_Y * mercN(latDeg);
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
  };
}

/** Same viewBox used by both the province SVG and the marker overlay. */
export const IRAN_MAP_VIEWBOX = "-2 42.5 964 875";

/**
 * TRUE path-id → province-name mapping for /public/iran-map.svg,
 * derived geometrically (inverse-projected path centroids vs. real
 * province positions). The ids follow the ISO 3166-2:IR family but the
 * Khorasan trio sits at 29/30/31 and Alborz is IR-32; IR-09 does not
 * exist in this dataset.
 */
export const PROVINCE_NAMES_FA: Record<string, string> = {
  "IR-01": "آذربایجان شرقی",
  "IR-02": "آذربایجان غربی",
  "IR-03": "اردبیل",
  "IR-04": "اصفهان",
  "IR-05": "ایلام",
  "IR-06": "بوشهر",
  "IR-07": "تهران",
  "IR-08": "چهارمحال و بختیاری",
  "IR-10": "خوزستان",
  "IR-11": "زنجان",
  "IR-12": "سمنان",
  "IR-13": "سیستان و بلوچستان",
  "IR-14": "فارس",
  "IR-15": "کرمان",
  "IR-16": "کردستان",
  "IR-17": "کرمانشاه",
  "IR-18": "کهگیلویه و بویراحمد",
  "IR-19": "گیلان",
  "IR-20": "لرستان",
  "IR-21": "مازندران",
  "IR-22": "مرکزی",
  "IR-23": "هرمزگان",
  "IR-24": "همدان",
  "IR-25": "یزد",
  "IR-26": "قم",
  "IR-27": "گلستان",
  "IR-28": "قزوین",
  "IR-29": "خراسان جنوبی",
  "IR-30": "خراسان رضوی",
  "IR-31": "خراسان شمالی",
  "IR-32": "البرز",
};

/** Aggregated availability stats for one province (or one destination). */
export interface AvailabilityStats {
  /** number of active tours */
  count: number;
  /** total seats across the tours */
  capacity: number;
  /** total reserved seats */
  reserved: number;
  /** capacity − reserved */
  remaining: number;
  /** reserved / capacity (1 = fully booked) */
  fillRatio: number;
}

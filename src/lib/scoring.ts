/**
 * VendorBridge Smart Award Engine
 * -------------------------------
 * Produces an explainable, weighted score for each quotation so procurement
 * teams get a defensible, data-driven award recommendation — not just "lowest
 * price wins". Scores are normalized 0–100 across the competing quotes.
 *
 * Weights (sum = 100):
 *   Price        45  — lower total is better (most weight: cost is king)
 *   Delivery     25  — faster delivery is better
 *   Vendor rating 20 — historical vendor quality (0–5 stars)
 *   Reliability  10  — vendor status & track record bonus
 */

export const WEIGHTS = { price: 45, delivery: 25, rating: 20, reliability: 10 } as const;

export type ScoreInput = {
  quotationId: string;
  vendorName: string;
  vendorRating: number;        // 0–5
  vendorStatus: string;        // ACTIVE / PENDING / ...
  totalAmount: number;
  deliveryDays: number;
};

export type ScoredQuote = ScoreInput & {
  score: number;               // 0–100 composite
  breakdown: { price: number; delivery: number; rating: number; reliability: number };
  isLowestPrice: boolean;
  isFastest: boolean;
  rank: number;
};

export type Recommendation = {
  scored: ScoredQuote[];
  winner: ScoredQuote | null;
  reasons: string[];
};

function normalizeLowerIsBetter(value: number, min: number, max: number) {
  if (max === min) return 1;
  return (max - value) / (max - min); // 1 when value==min (best)
}

export function scoreQuotations(quotes: ScoreInput[]): Recommendation {
  if (quotes.length === 0) return { scored: [], winner: null, reasons: [] };

  const prices = quotes.map((q) => q.totalAmount);
  const days = quotes.map((q) => q.deliveryDays);
  const minPrice = Math.min(...prices), maxPrice = Math.max(...prices);
  const minDays = Math.min(...days), maxDays = Math.max(...days);

  const scored: ScoredQuote[] = quotes.map((q) => {
    const priceN = normalizeLowerIsBetter(q.totalAmount, minPrice, maxPrice);
    const deliveryN = normalizeLowerIsBetter(q.deliveryDays, minDays, maxDays);
    const ratingN = Math.min(q.vendorRating / 5, 1);
    const reliabilityN = q.vendorStatus === "ACTIVE" ? 1 : q.vendorStatus === "PENDING" ? 0.5 : 0.2;

    const breakdown = {
      price: +(priceN * WEIGHTS.price).toFixed(1),
      delivery: +(deliveryN * WEIGHTS.delivery).toFixed(1),
      rating: +(ratingN * WEIGHTS.rating).toFixed(1),
      reliability: +(reliabilityN * WEIGHTS.reliability).toFixed(1),
    };
    const score = +(breakdown.price + breakdown.delivery + breakdown.rating + breakdown.reliability).toFixed(1);
    return {
      ...q, breakdown, score,
      isLowestPrice: q.totalAmount === minPrice,
      isFastest: q.deliveryDays === minDays,
      rank: 0,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => (s.rank = i + 1));

  const winner = scored[0] || null;
  const reasons: string[] = [];
  if (winner) {
    if (winner.isLowestPrice) reasons.push("Lowest total price among all bids");
    else {
      const cheapest = scored.find((s) => s.isLowestPrice)!;
      const delta = winner.totalAmount - cheapest.totalAmount;
      reasons.push(`Priced ₹${delta.toLocaleString("en-IN")} above the cheapest, but wins on overall value`);
    }
    if (winner.isFastest) reasons.push(`Fastest delivery (${winner.deliveryDays} days)`);
    if (winner.vendorRating >= 4) reasons.push(`Strong vendor rating (★ ${winner.vendorRating.toFixed(1)})`);
    if (winner.vendorStatus === "ACTIVE") reasons.push("Verified, active vendor");
    const runnerUp = scored[1];
    if (runnerUp) reasons.push(`Beats next-best (${runnerUp.vendorName}) by ${(winner.score - runnerUp.score).toFixed(1)} points`);
  }
  return { scored, winner, reasons };
}

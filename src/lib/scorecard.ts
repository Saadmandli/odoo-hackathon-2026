/** Computes a vendor performance scorecard from historical procurement data. */
export type ScorecardInput = {
  rating: number;
  quotesSubmitted: number;
  ordersWon: number;
  ordersReceived: number;   // POs with goods receipt
  totalSpend: number;
};

export type Scorecard = ScorecardInput & {
  winRate: number;          // % of quotes that became orders
  fulfillmentRate: number;  // % of orders received
  performance: number;      // 0–100 composite
  grade: "A" | "B" | "C" | "D";
};

export function computeScorecard(i: ScorecardInput): Scorecard {
  const winRate = i.quotesSubmitted ? (i.ordersWon / i.quotesSubmitted) * 100 : 0;
  const fulfillmentRate = i.ordersWon ? (i.ordersReceived / i.ordersWon) * 100 : 0;
  const performance = +(
    (i.rating / 5) * 40 +
    (winRate / 100) * 25 +
    (fulfillmentRate / 100) * 25 +
    Math.min(i.totalSpend / 5000000, 1) * 10
  ).toFixed(1) * 1;
  const score = +performance.toFixed(1);
  const grade = score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D";
  return { ...i, winRate: +winRate.toFixed(0), fulfillmentRate: +fulfillmentRate.toFixed(0), performance: score, grade };
}

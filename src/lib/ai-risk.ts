/**
 * VendorBridge Zero-Cost AI Risk & Fraud Detector Engine
 * ------------------------------------------------------
 * Performs real-time statistical anomaly detection and supplier risk scoring
 * without requiring external paid API calls.
 */

export type QuoteRiskInput = {
  quotationId: string;
  vendorName: string;
  vendorRating: number;        // 0-5 stars
  vendorCity?: string | null;
  buyerCity?: string | null;
  totalAmount: number;
  rfqBudget?: number | null;
  competingPrices?: number[];
  deliveryDays: number;
};

export type AIRiskAnalysis = {
  riskScore: number;           // 0 - 100
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskBadgeLabel: string;
  signals: { text: string; type: "WARNING" | "INFO" | "SUCCESS" }[];
};

export function analyzeQuoteRisk(input: QuoteRiskInput): AIRiskAnalysis {
  let riskScore = 15; // base score
  const signals: { text: string; type: "WARNING" | "INFO" | "SUCCESS" }[] = [];

  // 1. Price Anomaly & Budget Deviation Analysis
  if (input.rfqBudget && input.rfqBudget > 0) {
    const ratio = input.totalAmount / input.rfqBudget;
    if (ratio > 1.25) {
      riskScore += 35;
      signals.push({
        text: `Price is ${((ratio - 1) * 100).toFixed(0)}% ABOVE the RFQ budget target`,
        type: "WARNING",
      });
    } else if (ratio < 0.55) {
      riskScore += 25;
      signals.push({
        text: `Price is suspiciously low (${((1 - ratio) * 100).toFixed(0)}% below budget) — verify quality specifications`,
        type: "WARNING",
      });
    } else {
      signals.push({ text: "Price is well within target RFQ budget range", type: "SUCCESS" });
    }
  }

  // 2. Competitor Price Anomaly (Z-Score / Deviation)
  if (input.competingPrices && input.competingPrices.length > 1) {
    const avg = input.competingPrices.reduce((a, b) => a + b, 0) / input.competingPrices.length;
    const diffPct = ((input.totalAmount - avg) / avg) * 100;
    if (diffPct > 20) {
      riskScore += 20;
      signals.push({ text: `Priced ${diffPct.toFixed(1)}% above average competing bids`, type: "WARNING" });
    } else if (diffPct < -25) {
      riskScore += 15;
      signals.push({ text: `Priced ${Math.abs(diffPct).toFixed(1)}% below competitor average (aggressive discount)`, type: "INFO" });
    } else {
      signals.push({ text: "Price aligns with market competitor averages", type: "SUCCESS" });
    }
  }

  // 3. Vendor Quality & Rating
  if (input.vendorRating < 3.0) {
    riskScore += 30;
    signals.push({ text: `Low vendor rating (★ ${input.vendorRating.toFixed(1)} / 5.0)`, type: "WARNING" });
  } else if (input.vendorRating >= 4.2) {
    riskScore -= 10;
    signals.push({ text: `High vendor rating (★ ${input.vendorRating.toFixed(1)} / 5.0)`, type: "SUCCESS" });
  }

  // 4. Delivery Speed Anomaly
  if (input.deliveryDays > 21) {
    riskScore += 15;
    signals.push({ text: `Long fulfillment timeline (${input.deliveryDays} days)`, type: "WARNING" });
  } else if (input.deliveryDays <= 3) {
    signals.push({ text: `Rapid delivery commitment (${input.deliveryDays} days)`, type: "SUCCESS" });
  }

  // 5. City Proximity Logistics Signal
  if (input.buyerCity && input.vendorCity) {
    if (input.buyerCity.toLowerCase() === input.vendorCity.toLowerCase()) {
      riskScore -= 5;
      signals.push({ text: `Local supplier in ${input.buyerCity} (minimal logistics risk)`, type: "SUCCESS" });
    } else {
      signals.push({ text: `Inter-city shipment from ${input.vendorCity} to ${input.buyerCity}`, type: "INFO" });
    }
  }

  // Clamp 0 to 100
  riskScore = Math.max(0, Math.min(100, riskScore));

  const riskLevel = riskScore >= 60 ? "HIGH" : riskScore >= 35 ? "MEDIUM" : "LOW";
  const riskBadgeLabel =
    riskLevel === "HIGH"
      ? `🔴 High Risk (${riskScore}%)`
      : riskLevel === "MEDIUM"
      ? `🟡 Moderate Risk (${riskScore}%)`
      : `🟢 Low Risk (${riskScore}%)`;

  return { riskScore, riskLevel, riskBadgeLabel, signals };
}

/**
 * Threshold-based approval routing.
 * Mirrors real ERP delegation-of-authority: small spend auto-approves,
 * medium needs a Manager, large needs Admin sign-off.
 */
import type { Role } from "@prisma/client";

export const APPROVAL_TIERS = [
  { name: "Auto-approved",      max: 100000,    autoApprove: true,  approver: null as Role | null },
  { name: "Manager approval",   max: 1000000,   autoApprove: false, approver: "MANAGER" as Role | null },
  { name: "Admin sign-off",     max: Infinity,  autoApprove: false, approver: "ADMIN" as Role | null },
];

export function resolveTier(amount: number) {
  return APPROVAL_TIERS.find((t) => amount <= t.max) ?? APPROVAL_TIERS[APPROVAL_TIERS.length - 1];
}

export function tierLabel(amount: number) {
  const t = resolveTier(amount);
  if (t.autoApprove) return `${t.name} (≤ ₹${(100000).toLocaleString("en-IN")})`;
  return t.name;
}

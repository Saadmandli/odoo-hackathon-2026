import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VendorBridge — Procurement & Vendor Management ERP",
  description: "Digitize procurement: vendors, RFQs, quotations, approvals, purchase orders and invoices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

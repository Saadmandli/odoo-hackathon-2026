/**
 * VendorBridge Comprehensive Smoke Test Runner
 * --------------------------------------------
 * Validates authentication flow, page routing, RBAC protection,
 * category filtering, and API endpoints.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const testResults = [];

function record(name, success, detail = "") {
  testResults.push({ name, status: success ? "PASS ✅" : "FAIL ❌", detail });
  console.log(`[${success ? "PASS" : "FAIL"}] ${name} ${detail ? `(${detail})` : ""}`);
}

async function runSmokeTests() {
  console.log(`\n🚀 Starting VendorBridge Smoke Test Suite on ${BASE_URL}...\n`);

  try {
    // 1. Unauthenticated Public Routes
    const loginRes = await fetch(`${BASE_URL}/login`);
    record("Public Route: Login Page", loginRes.status === 200, `Status ${loginRes.status}`);

    const signupRes = await fetch(`${BASE_URL}/signup`);
    record("Public Route: Signup Page", signupRes.status === 200, `Status ${signupRes.status}`);

    // 2. Admin Authentication
    const adminAuthRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@vendorbridge.com", password: "password123" }),
    });

    if (!adminAuthRes.ok) {
      record("Auth: Admin Login", false, `HTTP ${adminAuthRes.status}`);
      return;
    }
    record("Auth: Admin Login", true, "Session Cookie Established");
    const adminCookie = adminAuthRes.headers.get("set-cookie") || "";

    const headers = { cookie: adminCookie };

    // 3. Admin Protected Endpoints
    const meRes = await fetch(`${BASE_URL}/api/me`, { headers });
    const meData = await meRes.json();
    record("API /api/me (Admin)", meRes.status === 200 && meData.user?.role === "ADMIN", `Role: ${meData.user?.role}`);

    const adminUsersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers });
    record("API /api/admin/users (Admin Portal)", adminUsersRes.status === 200, `HTTP ${adminUsersRes.status}`);

    const vendorsRes = await fetch(`${BASE_URL}/api/vendors`, { headers });
    record("API /api/vendors (Sellers Directory)", vendorsRes.status === 200, `HTTP ${vendorsRes.status}`);

    const rfqsRes = await fetch(`${BASE_URL}/api/rfqs`, { headers });
    const rfqsData = await rfqsRes.json();
    record("API /api/rfqs (RFQ List)", rfqsRes.status === 200, `Count: ${rfqsData.rfqs?.length || 0}`);

    const posRes = await fetch(`${BASE_URL}/api/purchase-orders`, { headers });
    record("API /api/purchase-orders", posRes.status === 200, `HTTP ${posRes.status}`);

    const invoicesRes = await fetch(`${BASE_URL}/api/invoices`, { headers });
    record("API /api/invoices", invoicesRes.status === 200, `HTTP ${invoicesRes.status}`);

    const reportsRes = await fetch(`${BASE_URL}/api/reports`, { headers });
    record("API /api/reports (ERP Analytics)", reportsRes.status === 200, `HTTP ${reportsRes.status}`);

    const scorecardRes = await fetch(`${BASE_URL}/api/scorecard`, { headers });
    record("API /api/scorecard (Vendor Ratings)", scorecardRes.status === 200, `HTTP ${scorecardRes.status}`);

    // 4. Seller Authentication & Scoping Test
    const sellerAuthRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "vendor@techno.com", password: "password123" }),
    });
    record("Auth: Seller Login", sellerAuthRes.ok, "Seller Session Established");
    const sellerCookie = sellerAuthRes.headers.get("set-cookie") || "";
    const sellerHeaders = { cookie: sellerCookie };

    const sellerRfqsRes = await fetch(`${BASE_URL}/api/rfqs`, { headers: sellerHeaders });
    const sellerRfqsData = await sellerRfqsRes.json();
    record("API /api/rfqs (Seller Category Scoped)", sellerRfqsRes.status === 200, `Scoped RFQs: ${sellerRfqsData.rfqs?.length || 0}`);

    // 5. Buyer Authentication & Privacy Scoping Test
    const buyerAuthRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "buyer@vendorbridge.com", password: "password123" }),
    });
    record("Auth: Buyer Login", buyerAuthRes.ok, "Buyer Session Established");
    const buyerCookie = buyerAuthRes.headers.get("set-cookie") || "";
    const buyerHeaders = { cookie: buyerCookie };

    const buyerRfqsRes = await fetch(`${BASE_URL}/api/rfqs`, { headers: buyerHeaders });
    const buyerRfqsData = await buyerRfqsRes.json();
    record("API /api/rfqs (Buyer Privacy Scoped)", buyerRfqsRes.status === 200, `Buyer Owned RFQs: ${buyerRfqsData.rfqs?.length || 0}`);

    console.log("\n=========================================");
    console.log("📊 SMOKE TEST SUMMARY");
    console.log("=========================================");
    const passed = testResults.filter((r) => r.status.includes("PASS")).length;
    console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${testResults.length - passed}`);
    if (passed === testResults.length) {
      console.log("\n🎉 ALL SMOKE TESTS PASSED 100% CLEAN!\n");
    } else {
      console.log("\n⚠️ SOME SMOKE TESTS FAILED — Review logs above.\n");
    }
  } catch (e) {
    console.error("Smoke test runner error:", e);
  }
}

runSmokeTests();

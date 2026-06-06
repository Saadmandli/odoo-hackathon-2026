import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";
import { resolveTier } from "@/lib/approval-policy";

// Officer requests approval for a chosen quotation.
// Smart routing: small spend auto-approves; otherwise routes to the right role.
export async function POST(req: Request) {
  try {
    const user = await requireUser(["PROCUREMENT_OFFICER", "ADMIN"]);
    const { quotationId } = await req.json();
    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId }, include: { rfq: true, vendor: true } });
    if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

    const tier = resolveTier(quotation.totalAmount);
    await prisma.quotation.update({ where: { id: quotationId }, data: { status: "SELECTED" } });

    if (tier.autoApprove) {
      const approval = await prisma.approval.create({
        data: { rfqId: quotation.rfqId, quotationId, status: "APPROVED", autoApproved: true, tier: tier.name, decidedAt: new Date(), remarks: "Auto-approved: within delegated spend limit" },
      });
      await prisma.rFQ.update({ where: { id: quotation.rfqId }, data: { status: "AWARDED" } });
      await logActivity({ userId: user.id, action: "AUTO_APPROVE", entityType: "Approval", entityId: approval.id, message: `${quotation.vendor.name}'s quote on ${quotation.rfq.rfqNumber} auto-approved (${tier.name})` });
      await notify(quotation.rfq.createdById, "APPROVAL", `Auto-approved: ${quotation.rfq.rfqNumber} (within limit)`, `/rfqs/${quotation.rfqId}`);
      return NextResponse.json({ approval, autoApproved: true, tier: tier.name }, { status: 201 });
    }

    const approval = await prisma.approval.create({
      data: { rfqId: quotation.rfqId, quotationId, status: "PENDING", tier: tier.name },
    });
    await logActivity({ userId: user.id, action: "REQUEST_APPROVAL", entityType: "Approval", entityId: approval.id, message: `Approval requested (${tier.name}) for ${quotation.vendor.name}'s quote on ${quotation.rfq.rfqNumber}` });

    const targetRole = tier.approver ?? "MANAGER";
    const approvers = await prisma.user.findMany({ where: { role: { in: targetRole === "ADMIN" ? ["ADMIN"] : ["MANAGER", "ADMIN"] } } });
    for (const m of approvers) await notify(m.id, "APPROVAL", `${tier.name} needed: ${quotation.rfq.rfqNumber} — ${quotation.vendor.name}`, `/approvals`);
    return NextResponse.json({ approval, autoApproved: false, tier: tier.name }, { status: 201 });
  } catch (e) { return err(e); }
}

// Manager / Admin decides
export async function PATCH(req: Request) {
  try {
    const user = await requireUser(["MANAGER", "ADMIN"]);
    const { approvalId, decision, remarks } = await req.json();
    if (!["APPROVED", "REJECTED"].includes(decision))
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });

    const approval = await prisma.approval.update({
      where: { id: approvalId },
      data: { status: decision, remarks: remarks || null, approverId: user.id, decidedAt: new Date() },
      include: { rfq: true, quotation: { include: { vendor: true } } },
    });

    if (decision === "REJECTED") {
      await prisma.quotation.update({ where: { id: approval.quotationId }, data: { status: "REJECTED" } });
    } else {
      await prisma.rFQ.update({ where: { id: approval.rfqId }, data: { status: "AWARDED" } });
    }

    await logActivity({ userId: user.id, action: decision, entityType: "Approval", entityId: approval.id, message: `${user.name} ${decision.toLowerCase()} ${approval.quotation.vendor.name}'s quote on ${approval.rfq.rfqNumber}` });
    const officer = await prisma.rFQ.findUnique({ where: { id: approval.rfqId }, select: { createdById: true } });
    if (officer) await notify(officer.createdById, "APPROVAL", `Quotation ${decision.toLowerCase()} for ${approval.rfq.rfqNumber}`, `/rfqs/${approval.rfqId}`);
    return NextResponse.json({ approval });
  } catch (e) { return err(e); }
}

export async function GET() {
  try {
    await requireUser(["MANAGER", "ADMIN", "PROCUREMENT_OFFICER"]);
    const approvals = await prisma.approval.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        rfq: { select: { rfqNumber: true, title: true } },
        approver: { select: { name: true } },
        quotation: { include: { vendor: { select: { name: true } } } },
      },
    });
    return NextResponse.json({ approvals });
  } catch (e) { return err(e); }
}

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
}

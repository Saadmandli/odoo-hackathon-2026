import { prisma } from "./prisma";

export async function logActivity(params: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  message: string;
}) {
  try {
    await prisma.activityLog.create({ data: { ...params } });
  } catch (e) {
    console.error("activity log failed", e);
  }
}

export async function notify(userId: string, type: string, message: string, link?: string) {
  try {
    await prisma.notification.create({ data: { userId, type, message, link } });
  } catch (e) {
    console.error("notify failed", e);
  }
}

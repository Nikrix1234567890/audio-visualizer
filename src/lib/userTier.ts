import { prisma } from "@/lib/prisma";
import type { TierName } from "@/lib/tiers";

/** The plan of an account; visitors without an account are on the free plan. */
export async function getTier(userId: string | null | undefined): Promise<TierName> {
  if (!userId) return "FREE";
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });
  return user?.tier === "PREMIUM" ? "PREMIUM" : "FREE";
}

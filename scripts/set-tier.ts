// Sets the plan of an account by hand - for testing, or to give someone
// Premium without a payment.  usage: pnpm tier <email> FREE|PREMIUM
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const [email, tier] = process.argv.slice(2);
  if (!email || (tier !== "FREE" && tier !== "PREMIUM")) {
    console.error("usage: pnpm tier <email> FREE|PREMIUM");
    process.exitCode = 1;
    return;
  }
  const prisma = new PrismaClient();
  const { count } = await prisma.user.updateMany({
    where: { email: email.toLowerCase().trim() },
    data: { tier },
  });
  console.log(count ? `${email} is now ${tier}.` : `No account with the email ${email}.`);
  await prisma.$disconnect();
}

main();

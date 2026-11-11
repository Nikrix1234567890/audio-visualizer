// Deletes old files that belong to nobody (see src/lib/cleanup.ts).
//   pnpm cleanup --dry-run   lists what would be deleted
//   pnpm cleanup             deletes it
import "dotenv/config";
import { ANONYMOUS_FILE_DAYS, cleanUpStorage } from "../src/lib/cleanup";
import { prisma } from "../src/lib/prisma";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const report = await cleanUpStorage({ dryRun });
  const verb = dryRun ? "Would delete" : "Deleted";
  console.log(
    `${verb} ${report.uploads.length} uploads and ${report.renders.length} videos of anonymous visitors older than ${ANONYMOUS_FILE_DAYS} days.`,
  );
  if (dryRun) for (const key of [...report.uploads, ...report.renders]) console.log(`  ${key}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

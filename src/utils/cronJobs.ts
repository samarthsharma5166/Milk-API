import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

const prisma = new PrismaClient();

// Runs every hour to delete expired tokens
cron.schedule("0 * * * *", async () => {
  await prisma.blackListToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  console.log("Expired tokens cleaned up!");
});



// Runs every day at midnight (00:00) in India Time (IST)






// Runs every 2 minutes

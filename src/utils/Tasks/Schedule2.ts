import prisma from "../../DB/Db";
import cron from "node-cron";

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
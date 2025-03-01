import prisma from "../../DB/Db";
import cron from "node-cron";


  const updateSubscriptionOrderItems =  async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set time to the start of the day

      // Find all order items where nextDate or startDate is today
      const orderItemsToUpdate = await prisma.orderItem.findMany({
        where: {
          OR: [
            {
              nextDate: {
                equals: today,
              },
            },
            {
              startDate: {
                equals: today,
              },
            },
          ],
          subscriptionType: {
            not: "ONE_TIME", // Exclude one-time orders
          },
        },
      });

      // Update the status of each order item
      for (const orderItem of orderItemsToUpdate) {
        await prisma.orderItem.update({
          where: { id: orderItem.id },
          data: {
            orderStatus: "PENDING", // Or any other status you want to set
          },
        });

        console.log(`Updated order item ${orderItem.id} to PENDING status.`);
      }

      console.log("Subscription order items updated successfully!");
    } catch (error) {
      console.error("Error updating subscription order items:", error);
    }
  }


cron.schedule("0 0 * * *", updateSubscriptionOrderItems, {
  timezone: "Asia/Kolkata", // Set the timezone to India (IST)
});



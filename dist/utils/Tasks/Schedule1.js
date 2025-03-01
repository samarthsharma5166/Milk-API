"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = __importDefault(require("../../DB/Db"));
const node_cron_1 = __importDefault(require("node-cron"));
const updateSubscriptionOrderItems = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to the start of the day
        // Find all order items where nextDate or startDate is today
        const orderItemsToUpdate = yield Db_1.default.orderItem.findMany({
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
            yield Db_1.default.orderItem.update({
                where: { id: orderItem.id },
                data: {
                    orderStatus: "PENDING", // Or any other status you want to set
                },
            });
            console.log(`Updated order item ${orderItem.id} to PENDING status.`);
        }
        console.log("Subscription order items updated successfully!");
    }
    catch (error) {
        console.error("Error updating subscription order items:", error);
    }
});
node_cron_1.default.schedule("0 0 * * *", updateSubscriptionOrderItems, {
    timezone: "Asia/Kolkata", // Set the timezone to India (IST)
});

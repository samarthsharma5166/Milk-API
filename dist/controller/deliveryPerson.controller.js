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
exports.getAllDeliveryPerson = exports.confirmDelivery = exports.sendDeliveryOtp = exports.pickDeliveries = exports.getAssignedDeliveries = exports.getDeliverPerson = exports.deliveryPersonLogin = exports.deliveryPersonSingUp = void 0;
const deliverySchema_1 = require("../Schema/deliverySchema");
const Db_1 = __importDefault(require("../DB/Db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const otpUtils_1 = require("../utils/otpUtils");
const date_fns_1 = require("date-fns");
const nodeMailer_1 = require("../utils/nodeMailer");
const server_1 = require("../server");
const deliveryPersonSingUp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, contactNo, email, vehicleNumber, aadhareNo, password, } = req.body;
        console.log(name, contactNo, email, vehicleNumber, aadhareNo, password);
        if (!name ||
            !contactNo ||
            !email ||
            !vehicleNumber ||
            !aadhareNo ||
            !password) {
            res.status(400).json({
                success: false,
                message: "All fields are required",
                error: "All fields are required",
            });
            return;
        }
        const user = yield Db_1.default.deliveryPerson.findUnique({
            where: { email: email },
        });
        if (user) {
            res.status(400).json({
                success: false,
                message: "Email already exists",
                error: "Email already exists",
            });
            return;
        }
        const check = yield deliverySchema_1.deliveryPersonSchema.safeParse(req.body);
        console.log(check);
        if (!check.success) {
            res.status(400).json({
                success: false,
                message: check.error.issues[0].message,
                error: check.error.issues[0].message,
            });
            return;
        }
        const hashPassword = yield bcrypt_1.default.hash(password, 10);
        console.log(hashPassword);
        const deliveryPerson = yield Db_1.default.deliveryPerson.create({
            data: {
                name,
                contactNo,
                email,
                vehicleNumber,
                aadhareNo,
                password: hashPassword,
            },
        });
        res.status(200).json({
            success: true,
            message: "Delivery person created successfully",
            data: deliveryPerson,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            // @ts-ignore
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.deliveryPersonSingUp = deliveryPersonSingUp;
const deliveryPersonLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        console.log("from email", email, password);
        const check = deliverySchema_1.deliveryPersonLoginSchema.safeParse(req.body);
        if (!check.success) {
            console.log(check.error);
            res.status(400).json({
                success: false,
                message: check.error.format(),
                error: check.error.issues[0].message,
            });
            return;
        }
        const deliveryPerson = yield Db_1.default.deliveryPerson.findFirst({
            where: {
                email,
            },
        });
        if (!deliveryPerson) {
            res.status(404).json({
                success: false,
                message: "Delivery person not found",
                error: "Delivery person not found",
            });
            return;
        }
        const isPasswordMatch = yield bcrypt_1.default.compare(password, deliveryPerson.password);
        if (!isPasswordMatch) {
            res.status(401).json({
                success: false,
                message: "Invalid credentials",
                error: "Invalid credentials",
            });
            return;
        }
        const token = (0, otpUtils_1.generateToken)({
            id: deliveryPerson.id,
            email: deliveryPerson.email,
            name: deliveryPerson.name,
        });
        res.status(200).json({
            success: true,
            message: "Delivery person logged in successfully",
            token,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            // @ts-ignore
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.deliveryPersonLogin = deliveryPersonLogin;
const getDeliverPerson = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "unauthorized",
            error: "unauthorized",
        });
        return;
    }
    try {
        const { id, email, name } = req.user;
        console.log(id, email, name);
        const deliveryBoy = yield Db_1.default.deliveryPerson.findFirst({
            where: {
                email,
                name,
                id,
            },
        });
        res.status(200).json({
            success: true,
            message: "fetched successfull",
            deliveryboy: deliveryBoy,
        });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            // @ts-ignore
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.getDeliverPerson = getDeliverPerson;
const getAssignedDeliveries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deliveryPersonId = req.params.deliveryPersonId;
        console.log(deliveryPersonId);
        if (!deliveryPersonId) {
            res
                .status(400)
                .json({ success: false, message: "Delivery Person ID is required" });
            return;
        }
        // Fetch all deliveries assigned to the delivery person for active users only
        const deliveries = yield Db_1.default.delivery.findMany({
            where: {
                deliveryPersonId,
                orderItem: {
                    user: {
                        status: true, // Only fetch for active users
                    },
                    nextDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of the day
                        lt: new Date(new Date().setHours(23, 59, 59, 999)), // End of the day
                    },
                },
            },
            include: {
                orderItem: {
                    select: {
                        title: true,
                        image: true,
                        quantity: true,
                        volume: true,
                        subscriptionType: true,
                        deliveryTime: true,
                        startDate: true,
                        nextDate: true,
                        address: true,
                        coordinates: true,
                        orderStatus: true,
                        totalPrice: true,
                        userId: true, // Get userId to query User
                    },
                },
            },
        });
        // Extract userIds and get user details separately
        const userIds = deliveries.map((d) => d.orderItem.userId);
        const users = yield Db_1.default.user.findMany({
            where: {
                id: {
                    in: userIds,
                },
                status: true, // Active users only
            },
            select: {
                id: true,
                name: true,
                contactNo: true,
            },
        });
        // Map user details to deliveries
        const deliveriesWithUserDetails = deliveries.map((delivery) => {
            const user = users.find((u) => u.id === delivery.orderItem.userId);
            return Object.assign(Object.assign({}, delivery), { user });
        });
        console.log(deliveriesWithUserDetails);
        server_1.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "deliveries",
                    data: deliveriesWithUserDetails,
                }));
            }
        });
        res.status(200).json({
            success: true,
            message: "Deliveries fetched successfully",
            deliveries: deliveriesWithUserDetails,
        });
        return;
    }
    catch (error) {
        console.error("Error fetching deliveries:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
});
exports.getAssignedDeliveries = getAssignedDeliveries;
const pickDeliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.orderId;
        const deliveryId = req.params.deliveryId;
        console.log(orderId, deliveryId);
        if (!orderId || !deliveryId) {
            res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const delivery = yield Db_1.default.delivery.findUnique({
            where: { id: deliveryId },
        });
        if (!delivery) {
            res.status(404).json({
                success: false,
                message: "Delivery not found",
                error: "Delivery not found",
            });
            return;
        }
        const orderItem = yield Db_1.default.orderItem.findUnique({
            where: { id: orderId },
        });
        if (!orderItem) {
            res.status(404).json({
                success: false,
                message: "Order item not found",
                error: "Order item not found",
            });
            return;
        }
        const result = yield Db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const delivery = yield tx.delivery.update({
                where: { id: deliveryId },
                data: { status: "IN_PROGRESS" },
            });
            const orderItem = yield tx.orderItem.update({
                where: { id: orderId },
                data: { orderStatus: "PICKED_UP" },
            });
            return { delivery, orderItem };
        }));
        server_1.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "ORDER_STATUS_UPDATE",
                    orderId,
                    status: "PICKED_UP",
                }));
            }
        });
        res.status(200).json({
            success: true,
            message: "Delivery picked up successfully",
            delivery: result.delivery,
            orderItem: result.orderItem,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            // @ts-ignore
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.pickDeliveries = pickDeliveries;
const sendDeliveryOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, deliveryId } = req.params;
        console.log("/nsendDeliveryOtp", orderId, deliveryId);
        // Validate required fields
        if (!orderId || !deliveryId) {
            res.status(400).json({
                success: false,
                message: "Delivery ID is required",
            });
            return;
        }
        const orderItem = yield Db_1.default.orderItem.findUnique({
            where: { id: orderId },
            select: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        contactNo: true,
                    },
                },
            },
        });
        if (!orderItem || !orderItem.user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const { name, email } = orderItem.user;
        const otp = (0, otpUtils_1.generateOtp)();
        const otpExpireAt = new Date();
        otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 5);
        const delivery = yield Db_1.default.delivery.findUnique({
            where: { id: deliveryId },
        });
        console.log(delivery);
        const data = yield Db_1.default.orderItem.update({
            where: { id: orderId },
            data: {
                otp,
                otpExpiresAt: otpExpireAt,
            },
        });
        console.log(data);
        const message = `
🌟 Your Order is Almost There! 🌟

Dear ${name},

We’re excited to let you know that your order is on its way! To ensure a secure delivery, please use the following One-Time Password (OTP) to confirm your order:

🔑 OTP: ${otp}

This OTP is valid for the next 5 minutes. For your security, please do not share it with anyone, including our delivery team.

If you did not request this OTP or have any concerns, please contact our support team immediately at support@example.com or +1-800-123-4567.

Thank you for choosing Example Corp. We hope you enjoy your purchase!

🚚 Happy Shopping,  
The Example Corp Team  
support@example.com  
www.example.com
`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Confirm Your Delivery with OTP",
            text: message,
        };
        console.log("sending email");
        yield nodeMailer_1.auth.sendMail(mailOptions);
        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            // @ts-ignore
            error: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.sendDeliveryOtp = sendDeliveryOtp;
const confirmDelivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, deliveryId } = req.params;
        const { otp } = req.body;
        console.log(orderId, deliveryId, otp);
        // Validate required fields
        if (!orderId || !deliveryId || !otp) {
            res.status(400).json({
                success: false,
                message: "All fields are required",
            });
            return;
        }
        const result = yield Db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Fetch delivery and orderItem within the transaction
            const orderItem = yield tx.orderItem.findUnique({
                where: { id: orderId },
            });
            if (!orderItem || !orderItem.otpExpiresAt) {
                throw new Error("Order item not found");
            }
            // Verify OTP
            const otpVerified = orderItem.otp === otp;
            if (!otpVerified) {
                throw new Error("Invalid OTP");
            }
            // Check if OTP has expired
            if (new Date() > orderItem.otpExpiresAt) {
                throw new Error("OTP has expired");
            }
            // Fetch delivery details
            const delivery = yield tx.delivery.findUnique({
                where: { id: deliveryId },
            });
            if (!delivery) {
                throw new Error("Delivery not found");
            }
            // Update delivery status and order item status
            const updatedDelivery = yield tx.delivery.update({
                where: { id: deliveryId },
                data: { status: "DELIVERED" },
            });
            yield tx.orderItem.update({
                where: { id: orderId },
                data: { orderStatus: "DELIVERED" },
            });
            // Deduct wallet balance
            const wallet = yield tx.wallet.update({
                where: { userId: orderItem.userId },
                data: {
                    balance: {
                        decrement: orderItem.totalPrice,
                    },
                },
            });
            yield tx.transaction.create({
                data: {
                    type: "DEBIT",
                    amount: orderItem.totalPrice,
                    description: `Delivery for ${orderItem.title}`,
                    walletId: wallet.id,
                },
            });
            // Calculate next delivery date for subscriptions
            let updatedOrderItemDate = null;
            if (orderItem.subscriptionType &&
                orderItem.subscriptionType !== "ONE_TIME") {
                let nextDate = null;
                // Use the current `nextDate` if it exists, otherwise use `startDate`
                const baseDate = orderItem.nextDate || orderItem.startDate;
                if (orderItem.subscriptionType === "DAILY") {
                    nextDate = (0, date_fns_1.addDays)(baseDate, 1);
                }
                else if (orderItem.subscriptionType === "ALTERNATE") {
                    nextDate = (0, date_fns_1.addDays)(baseDate, 2);
                }
                // Update the order item with the new `nextDate`
                updatedOrderItemDate = yield tx.orderItem.update({
                    where: { id: orderItem.id },
                    data: {
                        nextDate,
                    },
                });
                const user = yield tx.user.findUnique({
                    where: {
                        id: orderItem.id,
                    },
                    select: {
                        name: true,
                        email: true,
                        contactNo: true,
                    },
                });
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: user === null || user === void 0 ? void 0 : user.email,
                    subject: "Order Delivered Successfully!",
                    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4CAF50;">🎉 Your Order Has Been Delivered! 🎉</h2>
          <p>Dear ${user === null || user === void 0 ? void 0 : user.name},</p>
          <p>We are happy to inform you that your order <strong>#${updatedOrderItemDate === null || updatedOrderItemDate === void 0 ? void 0 : updatedOrderItemDate.id}</strong> has been successfully delivered.</p>
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Product:</strong> ${updatedOrderItemDate === null || updatedOrderItemDate === void 0 ? void 0 : updatedOrderItemDate.title}</li>
            <li><strong>Quantity:</strong> ${updatedOrderItemDate === null || updatedOrderItemDate === void 0 ? void 0 : updatedOrderItemDate.quantity}</li>
            <li><strong>Delivery Address:</strong> ${updatedDelivery === null || updatedDelivery === void 0 ? void 0 : updatedDelivery.address}</li>
            <li><strong>Total Amount:</strong> ₹${updatedOrderItemDate === null || updatedOrderItemDate === void 0 ? void 0 : updatedOrderItemDate.totalPrice}</li>
            <li><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>You can download your invoice <a href="${updatedOrderItemDate === null || updatedOrderItemDate === void 0 ? void 0 : updatedOrderItemDate.invoiceUrl}" style="color: #007bff; text-decoration: none;">here</a>.</p>

          <p>Thank you for choosing us! If you have any questions or concerns, feel free to <a href="mailto:support@yourcompany.com">contact us</a>.</p>
          <p>Best Regards,<br><strong>Your Milk Delivery Team</strong></p>
        </div>
        `,
                };
                yield nodeMailer_1.auth.sendMail(mailOptions);
            }
            return { updatedDelivery, updatedOrderItemDate };
        }));
        // Notify clients via WebSocket
        server_1.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "ORDER_STATUS_UPDATE",
                    orderId,
                    status: "DELIVERED",
                }));
            }
        });
        res.status(200).json({
            success: true,
            message: "Delivery confirmed successfully",
            delivery: Object.assign({}, result === null || result === void 0 ? void 0 : result.updatedDelivery),
            orderItem: Object.assign({}, result === null || result === void 0 ? void 0 : result.updatedOrderItemDate),
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message || "Unknown error",
        });
    }
});
exports.confirmDelivery = confirmDelivery;
const getAllDeliveryPerson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deliveryPersons = yield Db_1.default.deliveryPerson.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                contactNo: true,
                aadhareNo: true,
                vehicleNumber: true,
                zoneId: true,
                zone: true,
                zoneCoordinates: true
            }
        });
        if (!deliveryPersons) {
            res.status(404).json({
                success: false,
                message: "Delivery Person not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Fetched Delivery Person successfully",
            deliveryPersons
        });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            // @ts-ignore
            error: error === null || error === void 0 ? void 0 : error.message,
        });
        return;
    }
});
exports.getAllDeliveryPerson = getAllDeliveryPerson;

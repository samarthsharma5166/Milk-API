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
exports.changeDeliveryForOrderItem = exports.deleteDeliveryPerson = exports.shiftDelivery = exports.getAllDeliveryPerson = exports.confirmDelivery = exports.sendDeliveryOtp = exports.pickDeliveries = exports.getAssignedDeliveries = exports.getDeliverPerson = exports.deliveryPersonLogin = exports.deliveryPersonSingUp = void 0;
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
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Confirm Your Delivery with OTP",
            html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
    <h2 style="color: #4CAF50; text-align: center;">🌟 Your Order is Almost There! 🌟</h2>
    <p>Dear <strong>${name}</strong>,</p>
    <p>We’re excited to let you know that your order is on its way! To ensure a secure delivery, please use the following One-Time Password (OTP) to confirm your order:</p>
    <div style="text-align: center; font-size: 24px; font-weight: bold; color: #ff5722; border: 2px dashed #ff5722; display: inline-block; padding: 10px 20px; margin: 20px 0; border-radius: 8px;">
      🔑 ${otp}
    </div>
    <p><strong>This OTP is valid for the next 5 minutes.</strong> For your security, please do not share it with anyone, including our delivery team.</p>
    <p>If you did not request this OTP or have any concerns, please contact our support team immediately:</p>
    <p style="text-align: center;">
      📧 <a href="mailto:support@example.com" style="color: #007bff; text-decoration: none;">support@example.com</a><br>
      📞 <a href="tel:+18001234567" style="color: #007bff; text-decoration: none;">+1-800-123-4567</a>
    </p>
    <p style="text-align: center;">Thank you for choosing <strong>Example Corp</strong>. We hope you enjoy your purchase!</p>
    <div style="text-align: center; margin-top: 20px;">
      <a href="https://www.example.com" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Our Website</a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #777; margin-top: 20px;">
      🚚 Happy Shopping, <br>
      The Example Corp Team<br>
      <a href="https://www.example.com" style="color: #007bff; text-decoration: none;">www.example.com</a>
    </p>
  </div>
  `,
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
    var _a, _b, _c, _d, _e, _f, _g;
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
        const user = yield Db_1.default.user.findFirst({
            where: {
                id: (_a = result.updatedOrderItemDate) === null || _a === void 0 ? void 0 : _a.userId,
            },
            select: {
                name: true,
                email: true,
                contactNo: true,
            },
        });
        console.log("user", user);
        console.log(result.updatedOrderItemDate);
        const mailOptions = {
            from: process.env.EMAIL,
            to: user === null || user === void 0 ? void 0 : user.email,
            subject: "Order Delivered Successfully!",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4CAF50;">🎉 Your Order Has Been Delivered! 🎉</h2>
          <p>Dear ${user === null || user === void 0 ? void 0 : user.name},</p>
          <p>We are happy to inform you that your order <strong>#${(_b = result.updatedOrderItemDate) === null || _b === void 0 ? void 0 : _b.id}</strong> has been successfully delivered.</p>
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Product:</strong> ${(_c = result.updatedOrderItemDate) === null || _c === void 0 ? void 0 : _c.title}</li>
            <li><strong>Quantity:</strong> ${(_d = result.updatedOrderItemDate) === null || _d === void 0 ? void 0 : _d.quantity}</li>
            <li><strong>Delivery Address:</strong> ${(_e = result.updatedDelivery) === null || _e === void 0 ? void 0 : _e.address}</li>
            <li><strong>Total Amount:</strong> ₹${(_f = result.updatedOrderItemDate) === null || _f === void 0 ? void 0 : _f.totalPrice}</li>
            <li><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>You can download your invoice <a href="${(_g = result.updatedOrderItemDate) === null || _g === void 0 ? void 0 : _g.invoiceUrl}" style="color: #007bff; text-decoration: none;">here</a>.</p>

          <p>Thank you for choosing us! If you have any questions or concerns, feel free to <a href="mailto:support@yourcompany.com">contact us</a>.</p>
          <p>Best Regards,<br><strong>Your Milk Delivery Team</strong></p>
        </div>
      `,
        };
        yield nodeMailer_1.auth.sendMail(mailOptions);
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
const shiftDelivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deliveryId, newDeliveryPersonId } = req.params;
        // Validate required fields
        if (!deliveryId || !newDeliveryPersonId) {
            res.status(400).json({
                success: false,
                message: "Delivery ID and New Delivery Person ID are required",
            });
            return;
        }
        // Check if the new delivery person exists
        const newDeliveryPerson = yield Db_1.default.deliveryPerson.findUnique({
            where: { id: newDeliveryPersonId },
        });
        if (!newDeliveryPerson) {
            res.status(404).json({
                success: false,
                message: "New Delivery Person not found",
            });
            return;
        }
        // Check if the delivery exists
        const delivery = yield Db_1.default.delivery.findUnique({
            where: { id: deliveryId },
        });
        if (!delivery) {
            res.status(404).json({
                success: false,
                message: "Delivery not found",
            });
            return;
        }
        const orderItems = yield Db_1.default.orderItem.findMany({
            where: {
                deliveryPersonId: delivery.deliveryPersonId,
            }
        });
        if (!orderItems) {
            res.status(404).json({
                success: false,
                message: "delivery person has no order items",
            });
            return;
        }
        const result = yield Db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const updatedOrderItems = yield tx.orderItem.updateMany({
                where: {
                    deliveryPersonId: delivery.deliveryPersonId,
                },
                data: {
                    deliveryPersonId: newDeliveryPersonId,
                },
            });
            const updatedDelivery = yield tx.delivery.update({
                where: { id: deliveryId },
                data: { deliveryPersonId: newDeliveryPersonId },
            });
            return {
                updatedOrderItems,
                updatedDelivery
            };
        }));
        res.status(200).json({
            success: true,
            message: "Delivery shifted successfully",
            delivery: result.updatedDelivery,
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
exports.shiftDelivery = shiftDelivery;
const deleteDeliveryPerson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deliveryPersonId } = req.params;
        // Validate required fields
        if (!deliveryPersonId) {
            res.status(400).json({
                success: false,
                message: "Delivery Person ID is required",
            });
            return;
        }
        // Check if the delivery person exists
        const deliveryPerson = yield Db_1.default.deliveryPerson.findUnique({
            where: { id: deliveryPersonId },
        });
        if (!deliveryPerson) {
            res.status(404).json({
                success: false,
                message: "Delivery Person not found",
            });
            return;
        }
        const orderItems = yield Db_1.default.orderItem.findMany({
            where: {
                deliveryPersonId: deliveryPersonId,
                nextDate: {
                    gte: new Date(),
                },
            },
        });
        if (orderItems.length > 0) {
            res.status(400).json({
                success: false,
                message: "Delivery Person has active orders",
            });
            return;
        }
        // Delete the delivery person
        yield Db_1.default.deliveryPerson.delete({
            where: { id: deliveryPersonId },
        });
        res.status(200).json({
            success: true,
            message: "Delivery Person deleted successfully",
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
exports.deleteDeliveryPerson = deleteDeliveryPerson;
const changeDeliveryForOrderItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderItemId, newDeliveryPersonId } = req.params;
        // Validate required fields
        if (!orderItemId || !newDeliveryPersonId) {
            res.status(400).json({
                success: false,
                message: "Order Item ID and New Delivery Person ID are required",
            });
            return;
        }
        // Check if the new delivery person exists
        const newDeliveryPerson = yield Db_1.default.deliveryPerson.findUnique({
            where: { id: newDeliveryPersonId },
        });
        if (!newDeliveryPerson) {
            res.status(404).json({
                success: false,
                message: "New Delivery Person not found",
            });
            return;
        }
        // Check if the order item exists
        const orderItem = yield Db_1.default.orderItem.findUnique({
            where: { id: orderItemId },
            include: { delivery: true, user: true }, // Include the associated delivery
        });
        if (!orderItem) {
            res.status(404).json({
                success: false,
                message: "Order Item not found",
            });
            return;
        }
        const result = yield Db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Update the delivery person for the order item
            const updatedOrderItem = yield tx.orderItem.update({
                where: { id: orderItemId },
                data: { deliveryPersonId: newDeliveryPersonId },
            });
            // If the order item has an associated delivery, update the delivery person in the Delivery table
            if (orderItem.delivery) {
                yield tx.delivery.update({
                    where: { orderItemId: orderItemId },
                    data: { deliveryPersonId: newDeliveryPersonId },
                });
            }
            return {
                updatedOrderItems: updatedOrderItem,
            };
        }));
        const neworderItem = yield Db_1.default.orderItem.findUnique({
            where: { id: orderItemId },
            include: { deliveryPerson: {
                    select: {
                        name: true,
                        email: true,
                        contactNo: true
                    }
                }, user: {
                    select: {
                        name: true,
                        email: true,
                        contactNo: true
                    }
                } }, // Include the associated delivery
        });
        res.status(200).json({
            success: true,
            message: "Delivery person updated successfully",
            orderItem: neworderItem,
        });
        return;
    }
    catch (error) {
        console.error("Error changing delivery person:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return;
    }
});
exports.changeDeliveryForOrderItem = changeDeliveryForOrderItem;

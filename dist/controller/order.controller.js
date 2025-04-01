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
exports.confirmOrder = confirmOrder;
exports.getSubscribedOrder = getSubscribedOrder;
exports.updateOrder = updateOrder;
exports.getAllOrder = getAllOrder;
exports.getMyOrder = getMyOrder;
const Db_1 = __importDefault(require("../DB/Db"));
const otpUtils_1 = require("../utils/otpUtils");
const invoice_1 = require("../utils/invoice");
function confirmOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { quantity, subscriptionType, deliveryTime, startDate, volume } = req.body;
            const productId = req.params.productId;
            const user = req.user;
            if (!quantity ||
                !subscriptionType ||
                !deliveryTime ||
                !startDate ||
                !volume) {
                res
                    .status(400)
                    .json({ success: false, message: "Missing required fields" });
                return;
            }
            // Find the product
            const product = yield Db_1.default.product.findUnique({
                where: { id: productId },
            });
            if (!product) {
                res
                    .status(404)
                    .json({ success: false, message: "Product not found" });
                return;
            }
            if (!user || !user.id || !user.email || !user.name) {
                res
                    .status(400)
                    .json({ success: false, message: "User not found" });
                return;
            }
            const userData = yield Db_1.default.user.findUnique({ where: { id: user.id } });
            if (!userData) {
                res
                    .status(404)
                    .json({ success: false, message: "User not found" });
                return;
            }
            // Determine next delivery date based on subscription type
            // let nextDate: Date | null = null;
            const parsedStartDate = new Date(startDate);
            // if (subscriptionType === "DAILY") nextDate = addDays(parsedStartDate, 1);
            // else if (subscriptionType === "ALTERNATE")
            //   nextDate = addDays(parsedStartDate, 2);
            // Execute transaction
            const result = yield Db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const walletData = yield tx.wallet.findUnique({
                    where: { userId: user.id },
                });
                console.log("walledData", walletData);
                if (!walletData)
                    throw new Error("Wallet not found");
                const sgst = parseFloat(product.sgst || "0");
                const cgst = parseFloat(product.cgst || "0");
                const totalTaxRate = sgst + cgst; // Total GST tax rate
                console.log("QQQ", quantity);
                // Calculate tax amount
                const basePrice = parseFloat(product.price.toString());
                const totalBaseAmount = basePrice * quantity * (volume / parseFloat(product.volumes[0]));
                const taxAmount = (totalBaseAmount * totalTaxRate) / 100;
                const totalAmount = totalBaseAmount + taxAmount; // Final amount including GST
                let order = yield tx.order.findFirst({
                    where: { userId: user.id },
                    take: 1,
                });
                if (Number(walletData.balance) < totalAmount) {
                    throw new Error("Insufficient balance");
                }
                console.log("order", order);
                if (!order) {
                    order = yield tx.order.create({
                        data: {
                            userId: user.id,
                            totalAmount: 0,
                            status: "PENDING",
                        },
                    });
                }
                const orderItem = yield tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        title: product.title,
                        image: product.image,
                        productId: product.id,
                        userId: user.id,
                        price: product.price,
                        quantity,
                        volume,
                        subscriptionType,
                        deliveryTime,
                        startDate: parsedStartDate,
                        nextDate: parsedStartDate,
                        address: userData.address,
                        coordinates: userData.coordinates,
                        orderStatus: "PENDING",
                        totalPrice: totalAmount,
                    },
                });
                yield tx.order.update({
                    where: { id: order.id },
                    data: { totalAmount: order.totalAmount + totalAmount },
                });
                // Assign delivery to delivery person
                const deliveryBoys = yield tx.deliveryPerson.findMany({
                    where: { zoneCoordinates: { not: null } },
                    select: {
                        id: true,
                        name: true,
                        zoneId: true,
                        zoneCoordinates: true,
                    },
                });
                console.log("delivery bosy", deliveryBoys);
                let nearestDeliveryPerson = null;
                let shortestDistance = Infinity;
                console.log(nearestDeliveryPerson, shortestDistance);
                const userCoordinates = JSON.parse(userData.coordinates);
                const userLat = userCoordinates.lat;
                const userLng = userCoordinates.lng;
                deliveryBoys.forEach((person) => {
                    const personCoordinates = person.zoneCoordinates;
                    if (!personCoordinates)
                        return;
                    const coordinates = JSON.parse(personCoordinates);
                    const { lat, lng } = coordinates;
                    const distance = (0, otpUtils_1.calculateDistance)(userLat, userLng, lat, lng);
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestDeliveryPerson = person;
                    }
                });
                if (!nearestDeliveryPerson) {
                    throw new Error("No active delivery persons available");
                }
                // @ts-ignore
                console.log(nearestDeliveryPerson.id, shortestDistance);
                // @ts-ignore
                if (nearestDeliveryPerson && nearestDeliveryPerson.id) {
                    const delivery = yield tx.delivery.create({
                        data: {
                            orderItemId: orderItem.id,
                            // @ts-ignore
                            deliveryPersonId: nearestDeliveryPerson.id,
                            deliveryTime,
                            status: "SCHEDULED",
                            address: userData.address,
                            DeliveryCoordinates: userData.coordinates,
                        },
                    });
                    const invoiceData = {
                        currency: "INR",
                        taxNotation: "GST",
                        marginTop: 50,
                        marginRight: 50,
                        marginLeft: 50,
                        marginBottom: 50,
                        sender: {
                            company: "Your Milk Delivery",
                            address: "123 Street, City, India",
                            zip: "123456",
                            city: "Your City",
                            country: "India",
                            taxId: "GSTIN123456789", // Replace with actual GSTIN
                        },
                        client: {
                            company: user.name,
                            address: userData.address,
                            zip: "123456",
                            city: "Your City",
                            country: "India",
                        },
                        invoiceNumber: `INV-${order.id}`,
                        invoiceDate: new Date().toISOString().split("T")[0],
                        products: [
                            {
                                quantity: quantity,
                                description: `${product.title} (${volume} ${product.unit})`,
                                price: basePrice,
                                taxRate: totalTaxRate, // Total GST tax rate
                                sgst: sgst, // SGST %
                                cgst: cgst, // CGST %
                                sgstAmount: ((totalBaseAmount * sgst) / 100).toFixed(2),
                                cgstAmount: ((totalBaseAmount * cgst) / 100).toFixed(2),
                                totalBaseAmount: totalBaseAmount.toFixed(2),
                                taxAmount: taxAmount.toFixed(2), // Total GST amount
                                totalAmount: totalAmount.toFixed(2), // Final price including GST
                            },
                        ],
                        total: {
                            subtotal: totalBaseAmount.toFixed(2),
                            sgst: `${sgst} %`,
                            cgst: `${cgst} %`,
                            totalTaxRate: taxAmount.toFixed(2),
                            grandTotal: totalAmount.toFixed(2),
                        },
                        bottomNotice: "Thank you for your purchase! Prices include GST where applicable.",
                    };
                    const updateOrderItem = yield tx.orderItem.update({
                        where: { id: orderItem.id },
                        // @ts-ignore
                        data: { deliveryPersonId: nearestDeliveryPerson.id },
                    });
                    console.log("res", orderItem, delivery);
                    return { updateOrderItem, delivery, invoiceData }; // This will be returned correctly
                }
                throw new Error("No active delivery persons available");
            }), {
                timeout: 10000,
            });
            const invoiceUrl = yield (0, invoice_1.genrateInvoice)(result.invoiceData, result.updateOrderItem.id);
            console.log(invoiceUrl);
            const orderItem = yield Db_1.default.orderItem.update({
                where: { id: result.updateOrderItem.id },
                data: { invoiceUrl: invoiceUrl },
            });
            res.status(201).json({
                success: true,
                message: "Order confirmed successfully",
                order: result === null || result === void 0 ? void 0 : result.updateOrderItem,
                delivery: result === null || result === void 0 ? void 0 : result.delivery,
            });
        }
        catch (error) {
            console.error("Error confirming order:", error);
            res.status(500).json({
                success: false,
                message: "Something went wrong",
            });
        }
    });
}
function getSubscribedOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            if (!user) {
                res.status(400).json({
                    success: false,
                    message: "User not found",
                    error: "User not found",
                });
                return;
            }
            const orders = yield Db_1.default.orderItem.findMany({
                where: {
                    userId: user.id,
                    subscriptionType: { in: ["DAILY", "ALTERNATE"] },
                    // orderStatus: "PENDING",
                }, include: {
                    Product: true
                }
            });
            res.status(200).json({
                success: true,
                message: "Orders fetched successfully",
                orders,
            });
        }
        catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).json({
                success: false,
                message: error || "Something went wrong",
                error: error,
            });
        }
    });
}
// update existing subscribed order 
function updateOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const orderId = req.params.id;
            console.log(orderId);
            const { quantity, subscriptionType, deliveryTime, volume } = req.body;
            if (!orderId || !quantity || !subscriptionType || !deliveryTime || !volume) {
                res.status(400).json({
                    success: false,
                    message: "Invalid request",
                });
                return;
            }
            const orderItem = yield Db_1.default.orderItem.findUnique({
                where: { id: orderId },
                include: {
                    Product: true
                }
            });
            if (!orderItem) {
                res.status(404).json({
                    success: false,
                    message: "Order not found",
                });
                return;
            }
            const price = (Number(orderItem.Product.price) / Number(orderItem.Product.volumes[0])) * Number(volume) * Number(quantity);
            const walletData = yield Db_1.default.wallet.findUnique({
                where: { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id },
            });
            if (!walletData)
                throw new Error("Wallet not found");
            if (Number(walletData.balance) < price) {
                res.status(400).json({
                    success: false,
                    message: "Insufficient balance",
                    error: "Insufficient balance",
                });
                return;
            }
            const order = yield Db_1.default.orderItem.update({
                where: { id: orderId },
                data: {
                    quantity: parseInt(quantity),
                    subscriptionType,
                    deliveryTime,
                    volume,
                    totalPrice: price
                },
            });
            res.status(200).json({
                success: true,
                message: "Order updated successfully",
                order,
            });
        }
        catch (error) {
            console.error("Error updating order:", error);
            res.status(500).json({
                success: false,
                message: error || "Something went wrong",
            });
        }
    });
}
function getAllOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            if (!user) {
                res.status(400).json({
                    success: false,
                    message: "User not found",
                    error: "User not found",
                });
                return;
            }
            const result = yield Db_1.default.orderItem.findMany({
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            contactNo: true,
                            address: true
                        }
                    },
                    deliveryPerson: {
                        select: {
                            name: true,
                            contactNo: true,
                            email: true
                        }
                    }
                }
            });
            res.status(200).json({
                success: true,
                message: "Orders fetched successfully",
                orders: result,
            });
        }
        catch (error) {
            console.error("Error updating order:", error);
            res.status(500).json({
                success: false,
                message: error || "Something went wrong",
            });
        }
    });
}
function getMyOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            if (!user) {
                res.status(400).json({
                    success: false,
                    message: "User not found",
                    error: "User not found",
                });
                return;
            }
            const order = yield Db_1.default.orderItem.findMany({
                where: {
                    userId: user.id
                },
            });
            res.status(200).json({
                success: true,
                message: "Orders fetched successfully",
                orders: order,
            });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                message: error || "Something went wrong",
            });
        }
    });
}

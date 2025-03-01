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
exports.productStats = exports.transectionStats = exports.orderStats = exports.userStats = void 0;
const Db_1 = __importDefault(require("../DB/Db"));
const userStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield Db_1.default.user.groupBy({
            by: ['createdAt'],
            _count: {
                id: true
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        const labels = user.map(user => new Date(user.createdAt).toLocaleString("default", { month: "short", year: "numeric" }));
        const data = user.map(user => user._count.id);
        console.log(labels, data);
        res.status(200).json({ labels, data });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.userStats = userStats;
const orderStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield Db_1.default.order.groupBy({
            by: ["createdAt"],
            _sum: {
                totalAmount: true
            },
            orderBy: {
                createdAt: "asc"
            }
        });
        const labels = orders.map((order) => new Date(order.createdAt).toLocaleString("default", {
            month: "short",
            year: "numeric",
        }));
        const data = orders.map((order) => order._sum.totalAmount);
        res.status(200).json({ labels, data });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.orderStats = orderStats;
const transectionStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const credit = yield Db_1.default.transaction.aggregate({
            _sum: {
                amount: true
            },
            where: {
                type: "CREDIT"
            }
        });
        const debit = yield Db_1.default.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                type: "debit",
            },
        });
        res.json({
            labels: ["Credit", "Debit"],
            data: [credit._sum.amount || 0, debit._sum.amount || 0],
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.transectionStats = transectionStats;
const productStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Group by productId to count purchases
        const products = yield Db_1.default.orderItem.groupBy({
            by: ["productId"],
            _count: {
                productId: true,
            },
            orderBy: {
                _count: {
                    productId: "desc",
                },
            },
            take: 5, // Top 5 most purchased products
        });
        // Get product details for each productId
        const productDetails = yield Promise.all(products.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const product = yield Db_1.default.product.findUnique({
                where: {
                    id: item.productId,
                },
            });
            return {
                name: (product === null || product === void 0 ? void 0 : product.title) || "Unknown Product",
                count: item._count.productId,
            };
        })));
        const labels = productDetails.map((p) => p.name);
        const data = productDetails.map((p) => p.count);
        res.json({ labels, data });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.productStats = productStats;

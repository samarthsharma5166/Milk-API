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
exports.userSockets = exports.wss = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const user_route_1 = __importDefault(require("./routes/user.route"));
const cors_1 = __importDefault(require("cors"));
const product_route_1 = __importDefault(require("./routes/product.route"));
const order_route_1 = __importDefault(require("./routes/order.route"));
const stats_route_1 = __importDefault(require("./routes/stats.route"));
const transeciton_route_1 = __importDefault(require("./routes/transeciton.route"));
const deliveryPerson_route_1 = __importDefault(require("./routes/deliveryPerson.route"));
const zone_route_1 = __importDefault(require("./routes/zone.route"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// WebSocket Setup
exports.wss = new ws_1.WebSocketServer({ server });
// const users = [];
function checkUser(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                return null;
            }
            const decode = yield jsonwebtoken_1.default.verify(token, secret);
            if (!decode) {
                return null;
            }
            console.log(decode);
            return decode;
        }
        catch (e) {
            return null;
        }
    });
}
exports.userSockets = new Map();
exports.wss.on("connection", (ws, request) => __awaiter(void 0, void 0, void 0, function* () {
    const url = request.url;
    if (!url) {
        ws.close();
        return;
    }
    const queryParams = new URLSearchParams(url.split("?")[1] || "");
    const token = queryParams.get("token");
    if (!token) {
        console.log("hererererer");
        ws.close();
        return;
    }
    const Detail = yield checkUser(token);
    if (!Detail) {
        ws.close();
        return;
    }
    exports.userSockets.set(Detail.id, ws);
    ws.on("message", (message) => {
        console.log("Received from client:", message.toString());
        ws.send("Message received by server!");
    });
    ws.on("close", () => {
        console.log(`Client disconnected: ${Detail.id}`);
        exports.userSockets.delete(Detail.id); // Remove user from map when disconnected
    });
}));
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "http://localhost:8081",
        "https://milk-admin.onrender.com",
        "*"
    ], // Set to the frontend's URL
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
}));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("heloooo");
});
// Define routes for user
app.use("/api/v1/user", user_route_1.default);
// Defining routes for product 
app.use("/api/v1/product", product_route_1.default);
// placing order
app.use("/api/v1/order", order_route_1.default);
// transeciton route
app.use("/api/v1/transection", transeciton_route_1.default);
// stats 
app.use("/api/v1/stats", stats_route_1.default);
// deliveryPersonRoutes
app.use("/api/v1/deliveryPerson", deliveryPerson_route_1.default);
// zone Routes
app.use("/api/v1/zone", zone_route_1.default);
exports.default = server;

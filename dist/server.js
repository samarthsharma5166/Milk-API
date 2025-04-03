"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = void 0;
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
const cloudinary_1 = __importDefault(require("cloudinary"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// WebSocket Setup
exports.wss = new ws_1.WebSocketServer({ server });
// const users = [];
exports.wss.on("connection", (ws, request) => {
    console.log("New WebSocket client connected");
    // const url = request.url;
    // if (!url) {
    //   ws.close();
    //   return;
    // }
    //  const queryParams = new URLSearchParams(url.split("?")[1] || "");
    //  const token = queryParams.get("token");
    //  if (!token) {
    //    ws.close();
    //    return;
    //  }
    ws.on("message", (message) => {
        console.log("Received from client:", message.toString());
        ws.send("Message received by server!");
    });
    ws.on("close", () => {
        console.log("Client disconnected");
    });
});
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

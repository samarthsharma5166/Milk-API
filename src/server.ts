import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import userRoute from "./routes/user.route";
import cors from "cors"
import productRoute from './routes/product.route'
import orderRoute from './routes/order.route'
import stateRoute from './routes/stats.route'
import transecitonRoute from './routes/transeciton.route'
import deliveryRotue from './routes/deliveryPerson.route'
import zoneRotue from './routes/zone.route'
import prisma from "./DB/Db";
import cloudinary from "cloudinary";
const app = express();
const server = http.createServer(app);

// WebSocket Setup
export const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");

  ws.on("message", (message) => {
    console.log("Received from client:", message.toString());
    ws.send("Message received by server!");
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

cloudinary.v2.config({
  cloud_name:process.env.CLOUD_NAME,
  api_key:process.env.CLOUD_API_KEY,
  api_secret:process.env.CLOUD_API_SECRET
})

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8081",
      "https://milk-admin.onrender.com",
    ], // Set to the frontend's URL
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

app.use(express.json());

// Define routes for user
app.use("/api/v1/user", userRoute);

// Defining routes for product 
app.use("/api/v1/product", productRoute);

// placing order
app.use("/api/v1/order", orderRoute);

// transeciton route
app.use("/api/v1/transection", transecitonRoute);

// stats 
app.use("/api/v1/stats", stateRoute);

// deliveryPersonRoutes
app.use("/api/v1/deliveryPerson", deliveryRotue);

// zone Routes
app.use("/api/v1/zone", zoneRotue);



export default server;

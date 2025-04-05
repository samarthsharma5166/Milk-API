import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import userRoute from "./routes/user.route";
import cors from "cors"
import productRoute from './routes/product.route'
import orderRoute from './routes/order.route'
import stateRoute from './routes/stats.route'
import transecitonRoute from './routes/transeciton.route'
import deliveryRotue from './routes/deliveryPerson.route'
import zoneRotue from './routes/zone.route'
import prisma from "./DB/Db";
import jwt, { JwtPayload } from "jsonwebtoken";
import jsonwebtoken from "jsonwebtoken";
import cloudinary from "cloudinary";
const app = express();
const server = http.createServer(app);

// WebSocket Setup
export const wss = new WebSocketServer({ server });
// const users = [];

async function checkUser(token: string): Promise<JwtPayload | null> {
  try {
     const secret = process.env.JWT_SECRET;
     if (!secret) {
       return null;
     }
    const decode = await jwt.verify(token, secret) as JwtPayload;
    if (!decode) {
      return null;
    }
    console.log(decode);
    return decode;
  } catch (e) {
    return null;
  }
}

export const userSockets = new Map<string, WebSocket>();

wss.on("connection", async(ws,request) => {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }
   const queryParams = new URLSearchParams(url.split("?")[1] || "");
   const token = queryParams.get("token");
   if(!token){
    console.log("hererererer")
     ws.close();
     return
   }
   
  const Detail = await checkUser(token);
  if (!Detail) {
    ws.close();
    return;
  }
  userSockets.set(Detail.id, ws);

  ws.on("message", (message) => {
    console.log("Received from client:", message.toString());
    ws.send("Message received by server!");
  });

  ws.on("close", () => {
    console.log(`Client disconnected: ${Detail.id}`);
    userSockets.delete(Detail.id); // Remove user from map when disconnected
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
      "*"
    ], // Set to the frontend's URL
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

app.use(express.json());

app.get("/",(req,res)=>{
  res.send("heloooo")
})


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

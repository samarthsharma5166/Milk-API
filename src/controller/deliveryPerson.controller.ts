import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/types";
import {
  deliveryPersonSignUpSchematype,
  deliveryPersonSchema,
  deliveryPersonLoginSchematype,
  deliveryPersonLoginSchema,
} from "../Schema/deliverySchema";
import prisma from "../DB/Db";
import bcrypt from "bcrypt";
import { generateOtp, generateToken } from "../utils/otpUtils";
import { addDays } from "date-fns";
import { auth } from "../utils/nodeMailer";
import { wss } from "../server";
import { updateOrder } from "./order.controller";

export const deliveryPersonSingUp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      contactNo,
      email,
      vehicleNumber,
      aadhareNo,
      password,
    }: deliveryPersonSignUpSchematype = req.body;

    console.log(name, contactNo, email, vehicleNumber, aadhareNo, password);
    if (
      !name ||
      !contactNo ||
      !email ||
      !vehicleNumber ||
      !aadhareNo ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
        error: "All fields are required",
      });
      return;
    }
    const user = await prisma.deliveryPerson.findUnique({
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
    const check = await deliveryPersonSchema.safeParse(req.body);
    console.log(check);
    if (!check.success) {
      res.status(400).json({
        success: false,
        message: check.error.issues[0].message,
        error: check.error.issues[0].message,
      });
      return;
    }
    const hashPassword = await bcrypt.hash(password, 10);
    console.log(hashPassword);
    const deliveryPerson = await prisma.deliveryPerson.create({
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
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error === null || error === void 0 ? void 0 : error.message,
    });
  }
};

export const deliveryPersonLogin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password }: deliveryPersonLoginSchematype = req.body;
    console.log("from email", email, password);
    const check = deliveryPersonLoginSchema.safeParse(req.body);
    if (!check.success) {
      console.log(check.error);
      res.status(400).json({
        success: false,
        message: check.error.format(),
        error: check.error.issues[0].message,
      });
      return;
    }

    const deliveryPerson = await prisma.deliveryPerson.findFirst({
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

    const isPasswordMatch = await bcrypt.compare(
      password,
      deliveryPerson.password
    );

    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "Invalid credentials",
      });
      return;
    }
    const token = generateToken({
      id: deliveryPerson.id,
      email: deliveryPerson.email,
      name: deliveryPerson.name,
    });

    res.status(200).json({
      success: true,
      message: "Delivery person logged in successfully",
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error === null || error === void 0 ? void 0 : error.message,
    });
  }
};

export const getDeliverPerson = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
    const deliveryBoy = await prisma.deliveryPerson.findFirst({
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
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error === null || error === void 0 ? void 0 : error.message,
    });
  }
};

export const getAssignedDeliveries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
    const deliveries = await prisma.delivery.findMany({
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
    const users = await prisma.user.findMany({
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
      return {
        ...delivery,
        user,
      };
    });
    console.log(deliveriesWithUserDetails);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "deliveries",
            data: deliveriesWithUserDetails,
          })
        );
      }
    })
    res.status(200).json({
      success: true,
      message: "Deliveries fetched successfully",
      deliveries: deliveriesWithUserDetails,
    });

    return;
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const pickDeliveries = async (req: AuthRequest, res: Response) => {
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

    const delivery = await prisma.delivery.findUnique({
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
    const orderItem = await prisma.orderItem.findUnique({
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

    const result = await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: { status: "IN_PROGRESS" },
      });
      const orderItem = await tx.orderItem.update({
        where: { id: orderId },
        data: { orderStatus: "PICKED_UP" },
      });
      return { delivery, orderItem };
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "ORDER_STATUS_UPDATE",
            orderId,
            status: "PICKED_UP",
          })
        );
      }
    });

    res.status(200).json({
      success: true,
      message: "Delivery picked up successfully",
      delivery: result.delivery,
      orderItem: result.orderItem,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error === null || error === void 0 ? void 0 : error.message,
    });
  }
};

export const sendDeliveryOtp = async (req: AuthRequest, res: Response) => {
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

    const orderItem = await prisma.orderItem.findUnique({
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

    const otp = generateOtp();
    const otpExpireAt = new Date();
    otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 5);
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });
    console.log(delivery);
    const data = await prisma.orderItem.update({
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

    await auth.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error === null || error === void 0 ? void 0 : error.message,
    });
  }
};

export const confirmDelivery = async (req: AuthRequest, res: Response) => {
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

    const result = await prisma.$transaction(async (tx) => {
      // Fetch delivery and orderItem within the transaction
      const orderItem = await tx.orderItem.findUnique({
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
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery) {
        throw new Error("Delivery not found");
      }

      // Update delivery status and order item status
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: { status: "DELIVERED" },
      });

      await tx.orderItem.update({
        where: { id: orderId },
        data: { orderStatus: "DELIVERED" },
      });

      // Deduct wallet balance
      const wallet = await tx.wallet.update({
        where: { userId: orderItem.userId },
        data: {
          balance: {
            decrement: orderItem.totalPrice,
          },
        },
      });

      await tx.transaction.create({
        data: {
          type: "DEBIT",
          amount: orderItem.totalPrice,
          description: `Delivery for ${orderItem.title}`,
          walletId: wallet.id,
        },
      });

      // Calculate next delivery date for subscriptions
      let updatedOrderItemDate = null;
      if (
        orderItem.subscriptionType &&
        orderItem.subscriptionType !== "ONE_TIME"
      ) {
        let nextDate: Date | null = null;

        // Use the current `nextDate` if it exists, otherwise use `startDate`
        const baseDate = orderItem.nextDate || orderItem.startDate;

        if (orderItem.subscriptionType === "DAILY") {
          nextDate = addDays(baseDate, 1);
        } else if (orderItem.subscriptionType === "ALTERNATE") {
          nextDate = addDays(baseDate, 2);
        }

        // Update the order item with the new `nextDate`
        updatedOrderItemDate = await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            nextDate,
          },
        });
      }

      return { updatedDelivery, updatedOrderItemDate };
    });

    // Notify clients via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "ORDER_STATUS_UPDATE",
            orderId,
            status: "DELIVERED",
          })
        );
      }
    });

        const user = await prisma.user.findFirst({
          where: {
            id: result.updatedOrderItemDate?.userId,
          },
          select: {
            name: true,
            email: true,
            contactNo: true,
          },
        });

        console.log("user",user)
        console.log(result.updatedOrderItemDate)


        const mailOptions = {
          from: process.env.EMAIL,
          to: user?.email,
          subject: "Order Delivered Successfully!",
          html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4CAF50;">🎉 Your Order Has Been Delivered! 🎉</h2>
          <p>Dear ${user?.name},</p>
          <p>We are happy to inform you that your order <strong>#${
            result.updatedOrderItemDate?.id
          }</strong> has been successfully delivered.</p>
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Product:</strong> ${result.updatedOrderItemDate?.title}</li>
            <li><strong>Quantity:</strong> ${result.updatedOrderItemDate?.quantity}</li>
            <li><strong>Delivery Address:</strong> ${result.updatedDelivery?.address}</li>
            <li><strong>Total Amount:</strong> ₹${result.updatedOrderItemDate?.totalPrice}</li>
            <li><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>You can download your invoice <a href="${result.updatedOrderItemDate?.invoiceUrl}" style="color: #007bff; text-decoration: none;">here</a>.</p>

          <p>Thank you for choosing us! If you have any questions or concerns, feel free to <a href="mailto:support@yourcompany.com">contact us</a>.</p>
          <p>Best Regards,<br><strong>Your Milk Delivery Team</strong></p>
        </div>
      `,
        };
        await auth.sendMail(mailOptions);
    

    res.status(200).json({
      success: true,
      message: "Delivery confirmed successfully",
      delivery: { ...result?.updatedDelivery },
      orderItem: { ...result?.updatedOrderItemDate },
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

export const getAllDeliveryPerson = async(req:AuthRequest,res:Response)=>{
  try {
    const deliveryPersons = await prisma.deliveryPerson.findMany({
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
    })
    if(!deliveryPersons){
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
    })
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error === null || error === void 0 ? void 0 : error.message,
    });
    return
  }
}

export const shiftDelivery = async (req: AuthRequest, res: Response) => {
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
    const newDeliveryPerson = await prisma.deliveryPerson.findUnique({
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
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
      return;
    }

    const orderItems = await prisma.orderItem.findMany({
      where: {
        deliveryPersonId: delivery.deliveryPersonId,
      }
    })

    if(!orderItems){
      res.status(404).json({
        success: false,
        message: "delivery person has no order items",
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
     const updatedOrderItems = await tx.orderItem.updateMany({
        where: {
          deliveryPersonId: delivery.deliveryPersonId,
        },
        data: {
          deliveryPersonId: newDeliveryPersonId,
        },
      });
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: { deliveryPersonId: newDeliveryPersonId },
      });

      return {
        updatedOrderItems,
        updatedDelivery
      }
    })

    res.status(200).json({
      success: true,
      message: "Delivery shifted successfully",
      delivery: result.updatedDelivery,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error === null || error === void 0 ? void 0 : error.message,
    });
  }
};

export const deleteDeliveryPerson = async (req: AuthRequest, res: Response) => {
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
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
    });

    if (!deliveryPerson) {
      res.status(404).json({
        success: false,
        message: "Delivery Person not found",
      });
      return;
    }

    const orderItems = await prisma.orderItem.findMany({
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
    await prisma.deliveryPerson.delete({
      where: { id: deliveryPersonId },
    });

    res.status(200).json({
      success: true,
      message: "Delivery Person deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      // @ts-ignore
      error: error === null || error === void 0 ? void 0 : error.message,
    });
  }
};

export const changeDeliveryForOrderItem = async (
  req: AuthRequest,
  res: Response
) => {
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
    const newDeliveryPerson = await prisma.deliveryPerson.findUnique({
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
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { delivery: true ,user: true}, // Include the associated delivery
    });

    if (!orderItem) {
       res.status(404).json({
        success: false,
        message: "Order Item not found",
      });
      return;
    }


    const result = await prisma.$transaction(async (tx) => {
      // Update the delivery person for the order item
      const updatedOrderItem = await tx.orderItem.update({
        where: { id: orderItemId },
        data: { deliveryPersonId: newDeliveryPersonId },
      });

      // If the order item has an associated delivery, update the delivery person in the Delivery table
      if (orderItem.delivery) {
        await tx.delivery.update({
          where: { orderItemId: orderItemId },
          data: { deliveryPersonId: newDeliveryPersonId },
        });
      }

      return {
        updatedOrderItems: updatedOrderItem,
      }
    })


    const neworderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { deliveryPerson: {
        select: {
          name: true,
          email: true,
          contactNo: true
        }
      } ,user: {
        select: {
          name: true,
          email: true,
          contactNo: true
        }
      }}, // Include the associated delivery
    })
     res.status(200).json({
       success: true,
       message: "Delivery person updated successfully",
       orderItem: neworderItem,
     });
    return;
  } catch (error) {
    console.error("Error changing delivery person:", error);
     res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
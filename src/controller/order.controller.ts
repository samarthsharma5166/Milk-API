import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/types"; // Adjust import path // Adjust import path
import { addDays } from "date-fns"; // Helps in adding days to a date
import prisma from "../DB/Db";
import { Decimal } from "@prisma/client/runtime/library";
import { calculateDistance } from "../utils/otpUtils";
import { DeliveryPerson } from "@prisma/client";
import easyinvoice from "easyinvoice";
import {v2} from "cloudinary";
import { genrateInvoice } from "../utils/invoice";
import { auth } from "../utils/nodeMailer";


type DeliveryPersonType = {
  id: string;
  name: string;
  zoneId: string | null;
  zoneCoordinates: string | null;
};

export async function confirmOrder(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { quantity, subscriptionType, deliveryTime, startDate, volume } =
      req.body;
    const productId = req.params.productId;
    const user = req.user;

    if (
      !quantity ||
      !subscriptionType ||
      !deliveryTime ||
      !startDate ||
      !volume
    ) {
       res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
        return;
    }

    // Find the product
    const product = await prisma.product.findUnique({
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

    const userData = await prisma.user.findUnique({ where: { id: user.id } });

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
    const result = await prisma.$transaction(async (tx) => {
      const walletData = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      console.log("walledData", walletData);
      if (!walletData) throw new Error("Wallet not found");


      const sgst = parseFloat(product.sgst || "0");
      const cgst = parseFloat(product.cgst || "0");
      const totalTaxRate = sgst + cgst; // Total GST tax rate
  

      // Calculate tax amount
      const basePrice = parseFloat(product.price.toString());
      const totalBaseAmount = basePrice * quantity * (volume / parseFloat(product.volumes[0]));
      const taxAmount = (totalBaseAmount * totalTaxRate) / 100;
      const totalAmount = totalBaseAmount + taxAmount; // Final amount including GST

      let order = await tx.order.findFirst({
        where: { userId: user.id },
        take: 1,
      });

      if (Number(walletData.balance) < totalAmount) {
        throw new Error("Insufficient balance");
      }

      if (!order) {
        order = await tx.order.create({
          data: {
            userId: user.id,
            totalAmount: 0,
            status: "PENDING",
          },
        });
      }

      const orderItem = await tx.orderItem.create({
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
          totalPrice:totalAmount,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { totalAmount: order.totalAmount + totalAmount },
      });

      // Assign delivery to delivery person
      const deliveryBoys = await tx.deliveryPerson.findMany({
        where: { zoneCoordinates: { not: null } },
        select: {
          id: true,
          name: true,
          zoneId: true,
          zoneCoordinates: true,
        },
      });

      console.log("delivery bosy", deliveryBoys);

      let nearestDeliveryPerson: DeliveryPersonType | null = null;
      let shortestDistance = Infinity;

      console.log(nearestDeliveryPerson, shortestDistance);

      const userCoordinates = JSON.parse(userData.coordinates);
      const userLat = userCoordinates.lat;
      const userLng = userCoordinates.lng;

      deliveryBoys.forEach((person) => {
        const personCoordinates = person.zoneCoordinates;
        if (!personCoordinates) return;
        const coordinates = JSON.parse(personCoordinates);
        const { lat, lng } = coordinates;
        const distance = calculateDistance(userLat, userLng, lat, lng);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestDeliveryPerson = person;
        }
      });


      // @ts-ignore
      if (nearestDeliveryPerson && nearestDeliveryPerson.id) {
        const delivery = await tx.delivery.create({
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
          bottomNotice:
            "Thank you for your purchase! Prices include GST where applicable.",
        };

        const updateOrderItem = await tx.orderItem.update({
          where: { id: orderItem.id },
          // @ts-ignore
          data: { deliveryPersonId: nearestDeliveryPerson.id },
        });

        console.log("res", orderItem, delivery);

        return { updateOrderItem, delivery, invoiceData }; // This will be returned correctly
      }

      throw new Error("No active delivery persons available");
    },{
      timeout: 10000,
    });

    const invoiceUrl = await genrateInvoice(result.invoiceData, result.updateOrderItem.id);
    console.log(invoiceUrl);

    const orderItem = await prisma.orderItem.update(
      {
        where: { id: result.updateOrderItem.id },
        data: { invoiceUrl: invoiceUrl },
        include: { delivery: true, user: true },
      },
  
    )
  
    const deliveryPersonId = orderItem?.deliveryPersonId;

    if(!deliveryPersonId){
      return
    }
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: deliveryPerson?.email,
      subject: `New Delivery Assigned - Order from ${orderItem?.user?.name}`,
      html: `
        <h2>New Delivery Assigned</h2>
        <p>Hello ${deliveryPerson?.name},</p>
        <p>A new order has been assigned to you. Below are the order details:</p>
        <ul>
          <li><strong>Order ID:</strong> ${orderItem?.id}</li>
          <li><strong>Customer Name:</strong> ${orderItem?.user?.name}</li>
          <li><strong>Delivery Address:</strong> ${orderItem?.address}</li>
          <li><strong>Delivery Time:</strong> ${orderItem?.deliveryTime}</li>
          <li><strong>Product:</strong> ${orderItem?.title} (${
        orderItem?.volume
      })</li>
          <li><strong>Quantity:</strong> ${orderItem?.quantity}</li>
          <li><strong>Total Price:</strong> ₹${orderItem?.totalPrice.toFixed(
            2
          )}</li>
        </ul>
        <p>Please make sure to deliver the order on time and update the status accordingly.</p>
        <p>Thank you,</p>
        <p><strong>Your Milk Delivery Team</strong></p>
      `,
    };

  await auth.sendMail(mailOptions);


    res.status(201).json({
      success: true,
      message: "Order confirmed successfully",
      order: result?.updateOrderItem,
      delivery: result?.delivery,
    });
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}


export async function getSubscribedOrder(req: AuthRequest, res: Response, next: NextFunction) {
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

    const orders = await prisma.orderItem.findMany({
      where: {
        userId: user.id,
        subscriptionType: {in: ["DAILY", "ALTERNATE"]},
        // orderStatus: "PENDING",
      },include: {
        Product: true
      }
    });



    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
      error: error,
    });
  }
}
// update existing subscribed order 

export async function updateOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orderId = req.params.id;
    console.log(orderId)
    const { quantity, subscriptionType, deliveryTime, volume } = req.body;
    if (!orderId || !quantity || !subscriptionType || !deliveryTime  || !volume) {
      res.status(400).json({
        success: false,
        message: "Invalid request",
      });
      return;
    }

    const orderItem = await prisma.orderItem.findUnique({
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

    const price = (Number(orderItem.Product.price)/Number(orderItem.Product.volumes[0])) * Number(volume) * Number(quantity);

     const walletData = await prisma.wallet.findUnique({
       where: { userId: req.user?.id },
     });

     if (!walletData) throw new Error("Wallet not found");

     if (Number(walletData.balance) < price){
       res.status(400).json({
         success: false,  
         message: "Insufficient balance",
         error: "Insufficient balance",
       });
       return;
     }

    const order = await prisma.orderItem.update({
      where: { id: orderId },
      data: {
        quantity:parseInt(quantity),
        subscriptionType,
        deliveryTime,
        volume,
        totalPrice:price
      },
    });

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
    });
  }
}


export async function getAllOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if(!user){
      res.status(400).json({
        success: false,
        message: "User not found",
        error: "User not found",  
      })
      return;
    }
    const result = await prisma.orderItem.findMany({
      include:{
        user:{
          select:{
            name: true,
            email:true,
            contactNo: true,
            address: true
          }
        },
        deliveryPerson:{
          select: {
            name: true,
            contactNo: true,
            email: true
          }
        }
      }
    })

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders: result,
    });

  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
    });
  }
}


export async function getMyOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user

    if(!user){
      res.status(400).json({
        success: false,
        message: "User not found",
        error: "User not found",  
      })
      return;
    }
    const order = await prisma.orderItem.findMany({
      where: {
        userId: user.id
      },
    })
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders: order,
    });
    
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
    });
  }
}
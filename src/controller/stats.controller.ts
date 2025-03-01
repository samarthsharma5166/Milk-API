import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/types";
import prisma from "../DB/Db";



export const userStats = async(req:AuthRequest,res:Response,next:NextFunction)=> {
    try {
        const user = await prisma.user.groupBy({
            by:['createdAt'],
            _count:{
                id:true
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        const labels = user.map(user=> new Date(user.createdAt).toLocaleString("default", { month: "short", year: "numeric" }));
        const data = user.map(user=>user._count.id);
        console.log(labels,data);
        res.status(200).json({labels,data});
        
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
}

export const orderStats = async(req:AuthRequest,res:Response,next:NextFunction)=> {
    try {
        const orders = await prisma.order.groupBy({
            by:["createdAt"],
            _sum:{
                totalAmount:true
            },
            orderBy:{
                createdAt:"asc"
            }
        })

        const labels = orders.map((order) =>
          new Date(order.createdAt).toLocaleString("default", {
            month: "short",
            year: "numeric",
          })
        );
        const data = orders.map((order) => order._sum.totalAmount);

        res.status(200).json({labels,data});
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
}

export const transectionStats = async(req:AuthRequest,res:Response,next:NextFunction)=>{
    try {
        const credit = await prisma.transaction.aggregate({
            _sum:{
                amount:true
            },
            where:{
                type:"CREDIT"
            }
        })

        const debit = await prisma.transaction.aggregate({
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
        
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
}

export const productStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
    try {
      // Group by productId to count purchases
      const products = await prisma.orderItem.groupBy({
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
      const productDetails = await Promise.all(
        products.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: {
              id: item.productId,
            },
          });
          return {
            name: product?.title || "Unknown Product",
            count: item._count.productId,
          };
        })
      );

      const labels = productDetails.map((p) => p.name);
      const data = productDetails.map((p) => p.count);

      res.json({ labels, data });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
};
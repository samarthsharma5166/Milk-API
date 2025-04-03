import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/types";
import prisma from "../DB/Db";

export const getAllTransection = async(req:AuthRequest, res:Response,next:NextFunction) => {
    try {
        const user = req.user;
        if(!user){
            res.status(400).json({
                success: false,
                message: "User not found",
                error: "User not found",
            });
            return
        }
        const transections = await prisma.transaction.findMany({
            orderBy:{
                createdAt:"desc"
            }
        })
        console.log(transections)
        res.status(200).json({
            success: true,
            message: "Transection data fetched successfully",
            transections
        })
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });   
    }
}

export const getMyTransection = async(req:AuthRequest,res:Response,next:NextFunction)=>{
    try {
        const {id} = req.params;
        const transaction = await prisma.transaction.findMany({
            where:{
                walletId:id
            },
            orderBy: {
                createdAt: "desc",
            },
        })
        console.log(transaction)
        res.status(200).json({
          success: true,
          message: "Transection` data fetched successfully",
          transaction,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal server error" });
    }
}
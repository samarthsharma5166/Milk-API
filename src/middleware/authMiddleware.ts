import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {AuthRequest} from '../types/types.d'
import { Prisma } from "@prisma/client";
import prisma from "../DB/Db";
const authMiddleware = async(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

 if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
 }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });``
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Handle the case when JWT_SECRET is not defined
    res.status(500).json({ error: "JWT_SECRET is not defined" });
    return;
  }

  const blacklistedToken = await prisma.blackListToken.findUnique({
    where: { token },
  });

  if (blacklistedToken) {
     res.status(403).json({ message: "Token is expired or revoked" });
     return;
  }


  const Detail = jwt.verify(token, secret);
    if (typeof Detail === "object" && Detail !== null) {
        req.user = Detail as { id: string; name: string; email: string; role:string };
    } 
    else {
        res.status(401).json({ error: "Invalid token" });
        return;
    }
    next();
};

const isValidUser = async(req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const user = await prisma.user.findUnique({
    where:{
      id : userId
    }
  });

  if(user?.role !== "ADMIN" && user?.role !=='MANAGER' ){
    res.status(401).json({
      success:false,
      message:"you are not authorized to do this operation"
    })
    return
  }

  next();
}


export {authMiddleware,isValidUser}
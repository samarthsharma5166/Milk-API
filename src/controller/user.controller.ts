import prisma from "../DB/Db";
import { NextFunction, Request, Response } from "express";
import {
  UserOtpVerify,
  userOtpVerifySchema,
  UserSignIn,
  userSignInSchema,
  UserSignUp,
  userSignUpSchema,
} from "../Schema/userSchemas";
import { z } from "zod";
import { generateOtp, generateToken } from "../utils/otpUtils";
import bcrypt from "bcrypt";
import { auth } from "../utils/nodeMailer";
import { AuthRequest } from "../types/types";
import axios from "axios";

export const SignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: UserSignUp = req.body;
    const validatedUser = await userSignUpSchema.safeParse(user);
    if (validatedUser.success === false) {
      res.status(400).json({
        success: false,
        message: "enter valid data",
        error: validatedUser.error.format(),
      });
      return;
    }
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedUser.data.email,
      },
    });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists",
        error: "User already exists",
      });
      return;
    }

    let coordinates = "";

    const fullAddress = `${validatedUser.data.address}, ${validatedUser.data.city}, ${validatedUser.data.state}, ${validatedUser.data.pincode}`;
    const locationIQKey = process.env.LOCATION_IQ;
    try {
      const geoRes = await axios.get(`https://us1.locationiq.com/v1/search`, {
        params: {
          key: locationIQKey,
          q: fullAddress,
          format: "json",
        },
      });

      if (geoRes.data && geoRes.data.length > 0) {
        const { lat, lon } = geoRes.data[0];
        coordinates = `{ "lat": ${lat}, "lng": ${lon} }`;
      } else {
        res.status(400).json({
          success: false,
          message: "Invalid address. Could not fetch coordinates.",
        });
      }
    } catch (geoError) {
      console.error("Geocoding Error:", geoError);
      res.status(400).json({
        success: false,
        message: "Invalid address. Could not fetch coordinates.",
      });
      return;
    }
    const hashPassword = await bcrypt.hash(validatedUser.data.password, 10);
    const userRes = await prisma.$transaction(async (tx) => {
      // Create the wallet and associate it with the user
      const newWallet = await tx.wallet.create({
        data: {
          balance: 0,
        },
      });

      const newUser = await tx.user.create({
        data: {
          name: validatedUser.data.name,
          email: validatedUser.data.email,
          password: hashPassword,
          contactNo: validatedUser.data.contactNo,
          city: validatedUser.data.city,
          state: validatedUser.data.state,
          walletId: newWallet.id,
          address: validatedUser.data.address,
          altAddress: validatedUser.data.altAddress,
          status: validatedUser.data.status,
          coordinates,
          pincode: validatedUser.data.pincode,
          createdAt: validatedUser.data.createdAt,
          updatedAt: validatedUser.data.updatedAt,
        },
      });

      const updateWallet = await tx.wallet.update({
        where: {
          id: newWallet.id,
        },
        data: {
          userId: newUser.id,
        },
      });
      return { newUser, updateWallet };
    });

    res.status(201).json({
      success: true,
      message: "User successfully signed",
      user: userRes.newUser,
      wallet: userRes.updateWallet,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      console.log(error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
};

export const OtpSender = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("come here otp send");
    const userData: UserSignIn = req.body;
    const validatedUser = await userSignInSchema.safeParse(userData);
    if (validatedUser.success === false) {
      res.status(400).json({
        success: false,
        message: "enter valid data",
        error: validatedUser.error.format(),
      });
      return;
    }
    console.log("finding user in db");
    const user = await prisma.user.findUnique({
      where: { email: validatedUser.data.email },
    });
    console.log(user);

    if (!user) {
      res.status(400).json({
        success: false,
        message: "User not found",
        error: "User not found",
      });
      return;
    }
    const response = await bcrypt.compare(
      validatedUser.data.password,
      user.password
    );
    if (!response) {
      res.status(400).json({
        success: false,
        message: "Invalid password",
        error: "Invalid password",
      });
      return;
    }

    const otp = generateOtp();
    const otpExpireAt = new Date();
    otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 5);

    const result = await prisma.user.update({
      where: { email: validatedUser.data.email },
      data: {
        otp: otp,
        otpExpiresAt: otpExpireAt,
      },
    });

   const mailOptions = {
     from: process.env.EMAIL,
     to: user.email,
     subject: "Your One-Time Password (OTP) for Secure Login",
     html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
    <h2 style="color: #4CAF50; text-align: center;">🔐 Secure Login OTP</h2>
    <p>Dear User,</p>
    <p>Your One-Time Password (OTP) for logging into your account is:</p>
    <div style="text-align: center; font-size: 24px; font-weight: bold; color: #ff5722; border: 2px dashed #ff5722; display: inline-block; padding: 10px 20px; margin: 20px 0; border-radius: 8px;">
      🔑 ${otp}
    </div>
    <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this OTP with anyone, as it is intended for your use only.</p>
    <h3>For your security:</h3>
    <ul>
      <li>Never share your OTP with anyone, including support staff.</li>
      <li>If you did not request this OTP, please contact our support team immediately.</li>
    </ul>
    <p style="text-align: center;">
      📧 <a href="mailto:support@example.com" style="color: #007bff; text-decoration: none;">support@example.com</a><br>
      📞 <a href="tel:+18001234567" style="color: #007bff; text-decoration: none;">+1-800-123-4567</a>
    </p>
    <p style="text-align: center;">Thank you for choosing <strong>Your Company Name</strong>. We are committed to keeping your account secure.</p>
    <div style="text-align: center; margin-top: 20px;">
      <a href="https://www.example.com" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Our Website</a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #777; margin-top: 20px;">
      Best regards, <br>
      <strong>Your Company Name</strong><br>
      <a href="https://www.example.com" style="color: #007bff; text-decoration: none;">www.example.com</a>
    </p>
  </div>
  `,
   };
    

    await auth.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.message });
      return;
    } else {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("come here otp verify");
    const userData: UserOtpVerify = req.body;
    const validatedUser = await userOtpVerifySchema.safeParse(userData);
    if (validatedUser.success === false) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: validatedUser.error.format(),
      });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { email: validatedUser.data.email },
    });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "User not found",
        error: "User not found",
      });
      return;
    }
    const response = await bcrypt.compare(
      validatedUser.data.password,
      user?.password || ""
    );
    if (!response) {
      res.status(400).json({
        success: false,
        message: "Invalid password",
        error: "Invalid password",
      });
      return;
    }
    if (!user.otp || !user.otpExpiresAt) {
      res.status(400).json({
        success: false,
        message: "OTP not found",
        error: "OTP not found",
      });
      return;
    }
    if (user.otp !== validatedUser.data.otp) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP",
        error: "Invalid OTP",
      });
      return;
    }
    if (user?.otpExpiresAt < new Date()) {
      res.status(400).json({
        success: false,
        message: "OTP has expired",
        error: "OTP has expired",
      });
      return;
    }
    const data = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    await prisma.user.update({
      where: { email: validatedUser.data.email },
      data: {
        otp: null,
        otpExpiresAt: null,
      },
    });
    const token = generateToken(data);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
    });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.message });
    } else {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const userData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
    const userData = await prisma.user.findUnique({
      where: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      include: {
        wallet: true,
      },
    });
    const updateUserData = {
      id: userData?.id,
      name: userData?.name,
      email: userData?.email,
      contactNo: userData?.contactNo,
      role: userData?.role,
      city: userData?.city,
      state: userData?.state,
      address: userData?.address,
      altAddress: userData?.altAddress,
      status: userData?.status,
      pincode: userData?.pincode,
      wallet: userData?.wallet,
      createdAt: userData?.createdAt,
      updatedAt: userData?.updatedAt,
    };
    res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      user: updateUserData,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const getAllUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        wallet: true,
      },
    });
    res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      user: users,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
      },
    });

    const balance = user?.wallet?.balance;
    if (!balance) {
      res.status(400).json({
        success: false,
        message: "User has no balance",
        error: "User has no balance",
      });
      return;
    }
    if (parseFloat(balance.toString()) > 0) {
      res.status(400).json({
        success: false,
        message: "User has balance",
        error: "User has balance",
      });
      return;
    }
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      user: deletedUser,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const updateAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { address, city, state, pincode } = req.body;
  console.log("reqsdkfjasio", req.body);
  if (!address || !city || !state || !pincode) {
    res.status(400).json({
      success: false,
      message: "All fields are required",
      error: "All fields are required",
    });
    return;
  }
  console.log("checkd");
  if (!req.user || !req.user.id) {
    res.status(400).json({
      success: false,
      message: "User not found",
      error: "User not found",
    });
    return;
  }
  const userId = req.user.id;
  try {
    console.log("finding");
    const user = await prisma.user.findUnique({
      where: { id: userId, email: req.user.email, name: req.user.name },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "User not found",
        error: "User not found",
      });
      return;
    }

    let coordinates = "";

    const fullAddress = `${address}, ${city}, ${state}, ${pincode}`;
    const locationIQKey = process.env.LOCATION_IQ;
    try {
      const geoRes = await axios.get(`https://us1.locationiq.com/v1/search`, {
        params: {
          key: locationIQKey,
          q: fullAddress,
          format: "json",
        },
      });

      if (geoRes.data && geoRes.data.length > 0) {
        const { lat, lon } = geoRes.data[0];
        coordinates = `{ "lat": ${lat}, "lng": ${lon} }`;
      } else {
        res.status(400).json({
          success: false,
          message: "Invalid address. Could not fetch coordinates.",
        });
      }
    } catch (geoError) {
      console.error("Geocoding Error:", geoError);
      res.status(400).json({
        success: false,
        message: "Invalid address. Could not fetch coordinates.",
      });
      return;
    }
    console.log("perform operation");
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        address,
        city,
        state,
        pincode,
        coordinates,
      },
    });
    res.status(200).json({
      success: true,
      message: "User address updated successfully",
      user: updatedUser,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.id) {
    res.status(400).json({
      success: false,
      message: "User not found",
      error: "User not found",
    });
    return;
  }
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "User not found",
        error: "User not found",
      });
      return;
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId, email: req.user.email, name: req.user.name },
      data: {
        status: !user.status,
      },
    });
    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user: updatedUser,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const addMoneyToWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, amount } = req.body;

    // Validate input
    if (!userId || !amount || amount <= 0) {
      res.status(400).json({ message: "Invalid request data." });
      return;
    }

    // Find the user and wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: user.walletId },
      data: {
        balance: {
          increment: parseFloat(amount),
        },
        transactions: {
          create: {
            type: "DEBIT",
            amount: parseFloat(amount),
            description: "Money added to wallet",
          },
        },
      },
    });

    res.status(200).json({
      message: "Money added successfully.",
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error("Error adding money:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract token from header
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Store token in BlackListToken with expiry (24 hours)
    await prisma.blackListToken.create({
      data: {
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Set TTL of 24 hours
      },
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

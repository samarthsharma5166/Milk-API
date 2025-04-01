import { DeliveryType, SubscriptionType } from "@prisma/client";
import { z } from "zod";


// user types

export const userSignUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactNo: z
    .string()
    .max(10, "Contact number must be at least 10 characters")
    .min(10, "Contact number must be at least 10 characters"),
  city: z.string().min(1, "City is required"), // City is required
  state: z.string().min(1, "State is required"), // State is required
  address: z.string().min(1, "Address is required"), // Address is required
  altAddress: z
    .string()
    .max(100, "Alternative address cannot exceed 100 characters")
    .optional(), // Optional alternative address
  status: z.boolean().default(true).optional(), // Default to "active" status
  pincode: z.string().min(6, "Pincode must be at least 6 digits"), // Pincode validation
  createdAt: z.date().default(() => new Date()), // CreatedAt defaults to the current date
  updatedAt: z.date().default(() => new Date()), // UpdatedAt defaults to the current date
});

export type UserSignUp = z.infer<typeof userSignUpSchema>;


export const userSignInSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type UserSignIn = z.infer<typeof userSignInSchema>;

export const userOtpVerifySchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  otp: z.string().min(6, "OTP must be at least 6 digits"),
});

export type UserOtpVerify = z.infer<typeof userOtpVerifySchema>;


// Proudct types 

export const ProductDataSchema = z.object({
  title: z.string().min(3, { message: "Title is required" }),
  description: z.string().min(5, { message: "Description is required" }),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format") // Ensures proper decimal format
    .transform((val) => parseFloat(val)), // Convert string to float
  unit: z.string().min(1, { message: "Unit is required" }),
  volumes: z
    .array(z.string())
    .min(1, { message: "At least one volume is required" }),
  minQuantity: z
    .number()
    .min(1, { message: "Minimum quantity must be at least 1" }),
  maxQuantity: z
    .number()
    .min(1, { message: "Maximum quantity must be at least 1" }),
  stockQuantity: z
    .number()
    .min(0, { message: "Stock quantity must be at least 0" }),
  isOutOfStock: z.boolean().default(false),
  category: z.string().min(1, { message: "Category is required" }),
  image: z.string().min(1, { message: "Image URL is required" }),
  deliveryType: z.nativeEnum(DeliveryType), 
  subscriptionType: z.array(z.string()), 
  startDate: z.date().optional(),
  discount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid discount format" }) // Ensure proper decimal format
    .transform((val) => parseFloat(val)).optional(), // Matches Float in Prisma
  createdAt: z.date().optional(), // Prisma auto-generates this
  updatedAt: z.date().optional(), // Prisma auto-updates this
  sgst: z.string().min(1, { message: "SGST is required" }),
  cgst: z.string().min(1, { message: "CGST is required" }),
});

export type ProductData = z.infer<typeof ProductDataSchema>;

export const UpdateProductDataSchema = z.object({
  title: z.string().min(3, { message: "Title is required" }).optional(),
  description: z
    .string()
    .min(5, { message: "Description is required" })
    .optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format") // Ensures proper decimal format
    .transform((val) => parseFloat(val))
    .optional(),
  unit: z.string().min(1, { message: "Unit is required" }).optional(),
  volumes: z
    .array(z.string())
    .min(1, { message: "At least one volume is required" }),
  stockQuantity: z
    .number()
    .min(0, { message: "Stock quantity must be at least 0" })
    .optional(),
  isOutOfStock: z.boolean().default(false).optional(),
  category: z.string().min(1, { message: "Category is required" }).optional(),
  image: z.string().min(1, { message: "Image is required" }).optional(),
  deliveryType: z.nativeEnum(DeliveryType).optional(), // ✅ Now using Prisma's enum
  createdAt: z.date().optional(), // ✅ Prisma handles default values
  updatedAt: z.date().optional(),
});

export type UpdatedProductData = z.infer<typeof UpdateProductDataSchema>;

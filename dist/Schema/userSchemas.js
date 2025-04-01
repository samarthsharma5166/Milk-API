"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductDataSchema = exports.ProductDataSchema = exports.userOtpVerifySchema = exports.userSignInSchema = exports.userSignUpSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
// user types
exports.userSignUpSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email address").min(1, "Email is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    contactNo: zod_1.z
        .string()
        .max(10, "Contact number must be at least 10 characters")
        .min(10, "Contact number must be at least 10 characters"),
    city: zod_1.z.string().min(1, "City is required"), // City is required
    state: zod_1.z.string().min(1, "State is required"), // State is required
    address: zod_1.z.string().min(1, "Address is required"), // Address is required
    altAddress: zod_1.z
        .string()
        .max(100, "Alternative address cannot exceed 100 characters")
        .optional(), // Optional alternative address
    status: zod_1.z.boolean().default(true).optional(), // Default to "active" status
    pincode: zod_1.z.string().min(6, "Pincode must be at least 6 digits"), // Pincode validation
    createdAt: zod_1.z.date().default(() => new Date()), // CreatedAt defaults to the current date
    updatedAt: zod_1.z.date().default(() => new Date()), // UpdatedAt defaults to the current date
});
exports.userSignInSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address").min(1, "Email is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
exports.userOtpVerifySchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address").min(1, "Email is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    otp: zod_1.z.string().min(6, "OTP must be at least 6 digits"),
});
// Proudct types 
exports.ProductDataSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, { message: "Title is required" }),
    description: zod_1.z.string().min(5, { message: "Description is required" }),
    price: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format") // Ensures proper decimal format
        .transform((val) => parseFloat(val)), // Convert string to float
    unit: zod_1.z.string().min(1, { message: "Unit is required" }),
    volumes: zod_1.z
        .array(zod_1.z.string())
        .min(1, { message: "At least one volume is required" }),
    minQuantity: zod_1.z
        .number()
        .min(1, { message: "Minimum quantity must be at least 1" }),
    maxQuantity: zod_1.z
        .number()
        .min(1, { message: "Maximum quantity must be at least 1" }),
    stockQuantity: zod_1.z
        .number()
        .min(0, { message: "Stock quantity must be at least 0" }),
    isOutOfStock: zod_1.z.boolean().default(false),
    category: zod_1.z.string().min(1, { message: "Category is required" }),
    image: zod_1.z.string().min(1, { message: "Image URL is required" }),
    deliveryType: zod_1.z.nativeEnum(client_1.DeliveryType),
    subscriptionType: zod_1.z.array(zod_1.z.string()),
    startDate: zod_1.z.date().optional(),
    discount: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid discount format" }) // Ensure proper decimal format
        .transform((val) => parseFloat(val)).optional(), // Matches Float in Prisma
    createdAt: zod_1.z.date().optional(), // Prisma auto-generates this
    updatedAt: zod_1.z.date().optional(), // Prisma auto-updates this
    sgst: zod_1.z.string().min(1, { message: "SGST is required" }),
    cgst: zod_1.z.string().min(1, { message: "CGST is required" }),
});
exports.UpdateProductDataSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, { message: "Title is required" }).optional(),
    description: zod_1.z
        .string()
        .min(5, { message: "Description is required" })
        .optional(),
    price: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format") // Ensures proper decimal format
        .transform((val) => parseFloat(val))
        .optional(),
    unit: zod_1.z.string().min(1, { message: "Unit is required" }).optional(),
    volumes: zod_1.z
        .array(zod_1.z.string())
        .min(1, { message: "At least one volume is required" }),
    stockQuantity: zod_1.z
        .number()
        .min(0, { message: "Stock quantity must be at least 0" })
        .optional(),
    isOutOfStock: zod_1.z.boolean().default(false).optional(),
    category: zod_1.z.string().min(1, { message: "Category is required" }).optional(),
    image: zod_1.z.string().min(1, { message: "Image is required" }).optional(),
    deliveryType: zod_1.z.nativeEnum(client_1.DeliveryType).optional(), // ✅ Now using Prisma's enum
    createdAt: zod_1.z.date().optional(), // ✅ Prisma handles default values
    updatedAt: zod_1.z.date().optional(),
});

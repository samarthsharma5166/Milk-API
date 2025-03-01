"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryPersonLoginSchema = exports.deliveryPersonSchema = void 0;
const zod_1 = require("zod");
exports.deliveryPersonSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    contactNo: zod_1.z
        .string()
        .max(10, "Contact number must be at least 10 characters")
        .min(10, "Contact number must be at least 10 characters"),
    email: zod_1.z.string().email("Invalid email address").min(1, "Email is required"),
    vehicleNumber: zod_1.z.string().min(1, "Vehicle number is required"),
    aadhareNo: zod_1.z.string().min(1, "Aadhar number is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
});
exports.deliveryPersonLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address").min(1, "Email is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});

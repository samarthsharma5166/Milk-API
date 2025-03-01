import { z } from "zod";
export const deliveryPersonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactNo: z
    .string()
    .max(10, "Contact number must be at least 10 characters")
    .min(10, "Contact number must be at least 10 characters"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  aadhareNo: z.string().min(1, "Aadhar number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const deliveryPersonLoginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type deliveryPersonLoginSchematype = z.infer<typeof deliveryPersonLoginSchema>;

export type deliveryPersonSignUpSchematype = z.infer<typeof deliveryPersonSchema>;
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.addMoneyToWallet = exports.updateStatus = exports.updateAddress = exports.deleteUser = exports.getAllUser = exports.userData = exports.verifyOtp = exports.OtpSender = exports.SignUp = void 0;
const Db_1 = __importDefault(require("../DB/Db"));
const userSchemas_1 = require("../Schema/userSchemas");
const zod_1 = require("zod");
const otpUtils_1 = require("../utils/otpUtils");
const bcrypt_1 = __importDefault(require("bcrypt"));
const nodeMailer_1 = require("../utils/nodeMailer");
const axios_1 = __importDefault(require("axios"));
const SignUp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.body;
        const validatedUser = yield userSchemas_1.userSignUpSchema.safeParse(user);
        if (validatedUser.success === false) {
            res.status(400).json({
                success: false,
                message: "enter valid data",
                error: validatedUser.error.format(),
            });
            return;
        }
        const existingUser = yield Db_1.default.user.findUnique({
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
            const geoRes = yield axios_1.default.get(`https://us1.locationiq.com/v1/search`, {
                params: {
                    key: locationIQKey,
                    q: fullAddress,
                    format: "json",
                },
            });
            if (geoRes.data && geoRes.data.length > 0) {
                const { lat, lon } = geoRes.data[0];
                coordinates = `{ "lat": ${lat}, "lng": ${lon} }`;
            }
            else {
                res.status(400).json({
                    success: false,
                    message: "Invalid address. Could not fetch coordinates.",
                });
            }
        }
        catch (geoError) {
            console.error("Geocoding Error:", geoError);
            res.status(400).json({
                success: false,
                message: "Invalid address. Could not fetch coordinates.",
            });
            return;
        }
        const hashPassword = yield bcrypt_1.default.hash(validatedUser.data.password, 10);
        const userRes = yield Db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create the wallet and associate it with the user
            const newWallet = yield tx.wallet.create({
                data: {
                    balance: 0,
                },
            });
            const newUser = yield tx.user.create({
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
            const updateWallet = yield tx.wallet.update({
                where: {
                    id: newWallet.id,
                },
                data: {
                    userId: newUser.id,
                },
            });
            return { newUser, updateWallet };
        }));
        res.status(201).json({
            success: true,
            message: "User successfully signed",
            user: userRes.newUser,
            wallet: userRes.updateWallet,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: error.message });
        }
        else {
            console.log(error);
            res.status(500).json({ success: false, error: "Internal server error" });
        }
    }
});
exports.SignUp = SignUp;
const OtpSender = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("come here otp send");
        const userData = req.body;
        const validatedUser = yield userSchemas_1.userSignInSchema.safeParse(userData);
        if (validatedUser.success === false) {
            res.status(400).json({
                success: false,
                message: "enter valid data",
                error: validatedUser.error.format(),
            });
            return;
        }
        console.log("finding user in db");
        const user = yield Db_1.default.user.findUnique({
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
        const response = yield bcrypt_1.default.compare(validatedUser.data.password, user.password);
        if (!response) {
            res.status(400).json({
                success: false,
                message: "Invalid password",
                error: "Invalid password",
            });
            return;
        }
        const otp = (0, otpUtils_1.generateOtp)();
        const otpExpireAt = new Date();
        otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 5);
        const result = yield Db_1.default.user.update({
            where: { email: validatedUser.data.email },
            data: {
                otp: otp,
                otpExpiresAt: otpExpireAt,
            },
        });
        const message = `Dear User,

Your One-Time Password (OTP) for logging into your account is:

**OTP: ${otp}**

This OTP is valid for the next 5 minutes. Please do not share this OTP with anyone, as it is intended for your use only.

For your security:
- Never share your OTP with anyone, including support staff.
- If you did not request this OTP, please contact our support team immediately at [support email] or [support phone number].

Thank you for choosing [Your Company Name]. We are committed to keeping your account secure.

Best regards,  
[Your Company Name]  
[Your Contact Information]  
[Your Website URL]`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: "Your One-Time Password (OTP) for Secure Login",
            text: message,
        };
        yield nodeMailer_1.auth.sendMail(mailOptions);
        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.message });
            return;
        }
        else {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    }
});
exports.OtpSender = OtpSender;
const verifyOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("come here otp verify");
        const userData = req.body;
        const validatedUser = yield userSchemas_1.userOtpVerifySchema.safeParse(userData);
        if (validatedUser.success === false) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                error: validatedUser.error.format(),
            });
            return;
        }
        const user = yield Db_1.default.user.findUnique({
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
        const response = yield bcrypt_1.default.compare(validatedUser.data.password, (user === null || user === void 0 ? void 0 : user.password) || "");
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
        if ((user === null || user === void 0 ? void 0 : user.otpExpiresAt) < new Date()) {
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
        yield Db_1.default.user.update({
            where: { email: validatedUser.data.email },
            data: {
                otp: null,
                otpExpiresAt: null,
            },
        });
        const token = (0, otpUtils_1.generateToken)(data);
        res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            token,
        });
        return;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.message });
        }
        else {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
});
exports.verifyOtp = verifyOtp;
const userData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const userData = yield Db_1.default.user.findUnique({
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
            id: userData === null || userData === void 0 ? void 0 : userData.id,
            name: userData === null || userData === void 0 ? void 0 : userData.name,
            email: userData === null || userData === void 0 ? void 0 : userData.email,
            contactNo: userData === null || userData === void 0 ? void 0 : userData.contactNo,
            role: userData === null || userData === void 0 ? void 0 : userData.role,
            city: userData === null || userData === void 0 ? void 0 : userData.city,
            state: userData === null || userData === void 0 ? void 0 : userData.state,
            address: userData === null || userData === void 0 ? void 0 : userData.address,
            altAddress: userData === null || userData === void 0 ? void 0 : userData.altAddress,
            status: userData === null || userData === void 0 ? void 0 : userData.status,
            pincode: userData === null || userData === void 0 ? void 0 : userData.pincode,
            wallet: userData === null || userData === void 0 ? void 0 : userData.wallet,
            createdAt: userData === null || userData === void 0 ? void 0 : userData.createdAt,
            updatedAt: userData === null || userData === void 0 ? void 0 : userData.updatedAt,
        };
        res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            user: updateUserData,
        });
        return;
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.userData = userData;
const getAllUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield Db_1.default.user.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.getAllUser = getAllUser;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.params.id;
        const user = yield Db_1.default.user.findUnique({
            where: { id: userId },
            include: {
                wallet: true,
            },
        });
        const balance = (_a = user === null || user === void 0 ? void 0 : user.wallet) === null || _a === void 0 ? void 0 : _a.balance;
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
        const deletedUser = yield Db_1.default.user.delete({
            where: { id: userId },
        });
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            user: deletedUser,
        });
        return;
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.deleteUser = deleteUser;
const updateAddress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield Db_1.default.user.findUnique({
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
            const geoRes = yield axios_1.default.get(`https://us1.locationiq.com/v1/search`, {
                params: {
                    key: locationIQKey,
                    q: fullAddress,
                    format: "json",
                },
            });
            if (geoRes.data && geoRes.data.length > 0) {
                const { lat, lon } = geoRes.data[0];
                coordinates = `{ "lat": ${lat}, "lng": ${lon} }`;
            }
            else {
                res.status(400).json({
                    success: false,
                    message: "Invalid address. Could not fetch coordinates.",
                });
            }
        }
        catch (geoError) {
            console.error("Geocoding Error:", geoError);
            res.status(400).json({
                success: false,
                message: "Invalid address. Could not fetch coordinates.",
            });
            return;
        }
        console.log("perform operation");
        const updatedUser = yield Db_1.default.user.update({
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
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.updateAddress = updateAddress;
const updateStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield Db_1.default.user.findUnique({
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
        const updatedUser = yield Db_1.default.user.update({
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
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});
exports.updateStatus = updateStatus;
const addMoneyToWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, amount } = req.body;
        // Validate input
        if (!userId || !amount || amount <= 0) {
            res.status(400).json({ message: "Invalid request data." });
            return;
        }
        // Find the user and wallet
        const user = yield Db_1.default.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        // Update wallet balance
        const updatedWallet = yield Db_1.default.wallet.update({
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
    }
    catch (error) {
        console.error("Error adding money:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
exports.addMoneyToWallet = addMoneyToWallet;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.split(" ")[1]; // Extract token from header
        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        // Store token in BlackListToken with expiry (24 hours)
        yield Db_1.default.blackListToken.create({
            data: {
                token,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Set TTL of 24 hours
            },
        });
        res.status(200).json({ success: true, message: "Logged out successfully" });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.logout = logout;

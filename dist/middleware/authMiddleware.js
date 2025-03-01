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
exports.isValidUser = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Db_1 = __importDefault(require("../DB/Db"));
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        ``;
        return;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // Handle the case when JWT_SECRET is not defined
        res.status(500).json({ error: "JWT_SECRET is not defined" });
        return;
    }
    const blacklistedToken = yield Db_1.default.blackListToken.findUnique({
        where: { token },
    });
    if (blacklistedToken) {
        res.status(403).json({ message: "Token is expired or revoked" });
        return;
    }
    const Detail = jsonwebtoken_1.default.verify(token, secret);
    if (typeof Detail === "object" && Detail !== null) {
        req.user = Detail;
    }
    else {
        res.status(401).json({ error: "Invalid token" });
        return;
    }
    next();
});
exports.authMiddleware = authMiddleware;
const isValidUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const user = yield Db_1.default.user.findUnique({
        where: {
            id: userId
        }
    });
    if ((user === null || user === void 0 ? void 0 : user.role) !== "ADMIN" && (user === null || user === void 0 ? void 0 : user.role) !== 'MANAGER') {
        res.status(401).json({
            success: false,
            message: "you are not authorized to do this operation"
        });
        return;
    }
    next();
});
exports.isValidUser = isValidUser;

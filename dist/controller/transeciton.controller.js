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
exports.getMyTransection = exports.getAllTransection = void 0;
const Db_1 = __importDefault(require("../DB/Db"));
const getAllTransection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const transections = yield Db_1.default.transaction.findMany();
        console.log(transections);
        res.status(200).json({
            success: true,
            message: "Transection data fetched successfully",
            transections
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getAllTransection = getAllTransection;
const getMyTransection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const transaction = yield Db_1.default.transaction.findMany({
            where: {
                walletId: id
            }
        });
        console.log(transaction);
        res.status(200).json({
            success: true,
            message: "Transection data fetched successfully",
            transaction
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getMyTransection = getMyTransection;

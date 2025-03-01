"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailOptions = exports.auth = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const auth = nodemailer_1.default.createTransport({
    service: 'gmail',
    secure: true,
    port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});
exports.auth = auth;
const mailOptions = {
    from: process.env.EMAIL,
    to: '',
    subject: 'OTP',
    text: 'That was easy!'
};
exports.mailOptions = mailOptions;

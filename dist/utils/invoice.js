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
exports.genrateInvoice = genrateInvoice;
const cloudinary_1 = require("cloudinary");
const easyinvoice_1 = __importDefault(require("easyinvoice"));
function genrateInvoice(invoiceData, orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const invoice = yield easyinvoice_1.default.createInvoice(invoiceData);
        const pdfBuffer = yield Buffer.from(invoice.pdf, "base64");
        const cloudinaryResponse = yield new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader
                .upload_stream({
                resource_type: "raw",
                folder: "invoices",
                public_id: `invoice_${orderId}`,
            }, (error, cloudinaryResult) => {
                if (error)
                    reject(error);
                else
                    resolve(cloudinaryResult);
            })
                .end(pdfBuffer);
        });
        // @ts-ignore
        const invoiceUrl = cloudinaryResponse.secure_url;
        return invoiceUrl;
        console.log(invoiceUrl);
    });
}

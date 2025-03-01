import { v2 } from "cloudinary";
import easyinvoice from "easyinvoice";

export async function genrateInvoice(invoiceData: any,orderId:any) {
  const invoice = await easyinvoice.createInvoice(invoiceData);
  const pdfBuffer = await Buffer.from(invoice.pdf, "base64");
  const cloudinaryResponse = await new Promise((resolve, reject) => {
    v2.uploader
      .upload_stream(
        {
          resource_type: "raw",
          folder: "invoices",
          public_id: `invoice_${orderId}`,
        },
        (error, cloudinaryResult) => {
          if (error) reject(error);
          else resolve(cloudinaryResult);
        }
      )
      .end(pdfBuffer);
  });
  // @ts-ignore
  const invoiceUrl = cloudinaryResponse.secure_url;
  return invoiceUrl
  console.log(invoiceUrl);
}
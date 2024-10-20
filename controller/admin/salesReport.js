import orderModel from "../../models/orderSchema.js"
// import { generatePDF } from "./pdfGenerator.js";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

export const salesReport=async(req,res)=>{
try{

 const orders=await orderModel.find({'products.paymentStatus':"paid"})
 console.log(orders);

//  const pdfPath = generatePDF(orders);
//     res.download(pdfPath); // Send the file to the client
    res.render("admin/salesReport",{orders})
}catch(err){    
console.log(err);

}
}



export const downloadPdf = async (req, res) => {
    console.log("downloadPdf ");
 
    const generatePDF = (orders) => {
       return new Promise((resolve, reject) => {
          const doc = new PDFDocument();
          const filePath = path.resolve('./sales-report.pdf');
 
          const writeStream = fs.createWriteStream(filePath);
          doc.pipe(writeStream);
 
          // Add content
          doc.fontSize(20).text('Sales Report', { align: 'center' });
          doc.moveDown();
 
          // Table header
          doc.fontSize(8).text('User        | Product       | Quantity | Product Discount| Coupon Discount | Total amount| Order Status | Payment Status | Date', { align: 'left' });
          doc.moveDown();
 
          orders.forEach(order => {
             const orderData = `${order.user} | ${order.products[0]._id} | ${order.products[0].quantity} | ${(order.products[0].price-order.products[0].discountedPrice).toFixed(2)} | ${order.products[0].couponAdded.toFixed(2)} | ${order.products[0].totalPay} | ${order.products[0].orderStatus} || ${order.products[0].paymentStatus} | ${order.createdAt.toLocaleDateString()}`;
             doc.text(orderData);
            doc.moveDown();
             
          });
 
          doc.end();
 
          writeStream.on('finish', () => resolve(filePath)); // Wait for file writing to finish
          writeStream.on('error', reject); // Handle errors
       });
    };
 
    try {
       const orders = await orderModel.find({ 'products.paymentStatus': "paid" });
 
       const pdfPath = await generatePDF(orders); // Wait for PDF generation
       res.download(pdfPath, (err) => {
          if (err) {
             console.error("Error during download: ", err);
          } else {
             console.log("File downloaded successfully.");
          }
       });
    } catch (error) {
       console.error("Error generating PDF: ", error);
       res.status(500).send("Error generating PDF");
    }
 };

 export const downloadExcel=async(req,res)=>{

const generateExcel = async (orders) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

  // Set the columns
worksheet.columns = [
    { header: 'User', key: 'user' },
    { header: 'Product', key: 'product' },
    { header: 'Quantity', key: 'quantity' },
    { header: 'Product Discount', key: 'productDiscount' }, // Renamed to match PDF
    { header: 'Coupon Discount', key: 'couponDiscount' },
    { header: 'Total Amount', key: 'totalAmount' }, // Renamed to match PDF
    { header: 'Order Status', key: 'orderStatus' },
    { header: 'Payment Status', key: 'paymentStatus' },
    { header: 'Date', key: 'date' },
];

// Add data
orders.forEach(order => {
    // Calculate Product Discount
    const productDiscount = (order.products[0].price - order.products[0].discountedPrice).toFixed(2);
    
    // Add a row in the worksheet with the required fields
    worksheet.addRow({
        user: order.user, 
        product: order.products[0]._id, 
        quantity: order.products[0].quantity, // Quantity
        productDiscount: (order.products[0].price - order.products[0].discountedPrice).toFixed(2), // Product Discount
        couponDiscount: order.products[0].couponAdded.toFixed(2), // Coupon Discount
        totalAmount: order.products[0].totalPay, // Total Amount
        orderStatus: order.products[0].orderStatus, // Order Status
        paymentStatus: order.products[0].paymentStatus, // Payment Status
        date: new Date(order.createdAt).toLocaleDateString(), // Date
    });
    
});

    const filePath = './sales-report.xlsx';
    await workbook.xlsx.writeFile(filePath);
    return filePath; // Return the path to download later
};

const orders = await orderModel.find({ 'products.paymentStatus': "paid" });

const excelPath = await generateExcel(orders);
res.download(excelPath); // Send the file to the client




 }
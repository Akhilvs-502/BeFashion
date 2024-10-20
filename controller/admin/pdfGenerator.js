import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generatePDF = (orders) => {
    const doc = new PDFDocument();
    const filePath = './sales-report.pdf';

    doc.pipe(fs.createWriteStream(filePath));

    // Add content
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();
    
    // Table header
    doc.fontSize(12).text('User | Product | Quantity | Total Sales | Coupon Discount | Discount Applied | Order Status | Payment Status | Date');

    orders.forEach(order => {
        const orderData = `${order.user.name} | ${order.products[0].productName} | ${order.products[0].quantity} | $${(order.products[0].price * order.products[0].quantity).toFixed(2)} | $${order.products[0].couponAdded.toFixed(2)} | $${order.products[0].discountedPrice.toFixed(2)} | ${order.orderStatus} | ${order.paymentStatus} | ${new Date(order.createdAt).toLocaleDateString()}`;
        doc.text(orderData);
    });

    doc.end();
    return filePath; // Return the path to download later
};

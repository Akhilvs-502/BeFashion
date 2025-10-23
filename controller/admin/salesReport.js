import orderModel from "../../models/orderSchema.js"
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { HttpStatusCode } from "../../shared/constants/HttpStatusCode.js";

let orders = []

export const salesReport = async (req, res) => {
    try {
        let filter = req.query.filter ? req.query.filter : ""
        console.log(req.query);
        if (req.query.filter == "daily") {
            let now = new Date()
            let startOfDay = new Date(now.setHours(0, 0, 0, 0));
            let endOfDay = new Date(now.setHours(23, 59, 59, 999));
            orders = await orderModel.find({ 'products.paymentStatus': "paid", createdAt: { $lt: endOfDay, $gte: startOfDay } })
            console.log(orders);
        }
        else if (req.query.filter == "monthly") {
            let now = new Date()
            let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            console.log(startOfMonth, endOfMonth);

            orders = await orderModel.find({ 'products.paymentStatus': "paid", createdAt: { $gte: startOfMonth, $lt: endOfMonth } })
            console.log(orders);
        }
        else if (req.query.filter == "Yearly") {
            let now = new Date()
            let startOfYear = new Date(now.getFullYear(), 0, 1);
            let endOfYear = new Date(now.getFullYear(), 11, 31);
            endOfYear.setHours(23, 59, 59, 999);
            orders = await orderModel.find({ 'products.paymentStatus': "paid", createdAt: { $gte: startOfYear, $lt: endOfYear } })
            console.log(orders);
        }
        else if (req.query.filter == "date") {
            let startDate = req.query.startDate
            startDate = new Date(startDate)
            startDate = startDate.setHours(0, 0, 0, 0)
            let endDate = req.query.endDate
            endDate = new Date(endDate)
            endDate.setHours(23, 59, 59, 999)
            orders = await orderModel.find({ 'products.paymentStatus': "paid", createdAt: { $gte: startDate, $lt: endDate } })
            console.log(orders);
        } else {
            let now = new Date()
            let startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
            startOfWeek.setHours(0, 0, 0, 0);
            let endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
            endOfWeek.setHours(23, 59, 59, 999);
            orders = await orderModel.find({ 'products.paymentStatus': "paid", createdAt: { $gte: startOfWeek, $lt: endOfWeek } })
            console.log(orders);

        }
        let totalRevenue = 0
        let overallDiscounted = 0
        let salesCount = 0


        orders.forEach(order => {
            order.products.forEach(product => {
                console.log(product.totalPay);
                totalRevenue += product.totalPay
                overallDiscounted += product.discountedPrice
                salesCount++
            });
        })
        totalRevenue = totalRevenue.toFixed(2)
        console.log(overallDiscounted);

        overallDiscounted = (totalRevenue - overallDiscounted).toFixed(2)
        console.log(overallDiscounted);
        console.log(totalRevenue);


        res.render("admin/salesReport", { orders, totalRevenue, overallDiscounted, salesCount, filter })
    } catch (err) {

        console.log(err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })

    }
}



export const downloadPdf = async (req, res) => {


    try {

        const generatePDF = (orders) => {
            return new Promise((resolve, reject) => {
                const doc = new PDFDocument();

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
                doc.pipe(res); // Pipe the PDF directly to the response
                // Add content
                doc.fontSize(20).text('Sales Report', { align: 'center' });
                doc.moveDown();

                // Table header
                doc.fontSize(8).text('User        | Product       | Quantity | Product Discount| Coupon Discount | Total amount| Order Status | Payment Status | Date', { align: 'left' });
                doc.moveDown();

                orders.forEach(order => {
                    console.log(order);

                    const orderData = `${order.user} | ${order.products[0]._id} | ${order.products[0].quantity} | ${(order.products[0].price - order.products[0].discountedPrice).toFixed(2)} | ${order.products[0].couponAdded.toFixed(2)} | ${order.products[0].totalPay} | ${order.products[0].orderStatus} || ${order.products[0].paymentStatus} | ${order.createdAt.toLocaleDateString()}`;
                    doc.text(orderData);
                    doc.moveDown();

                });

                doc.end();
                resolve();

            });
        };

        const pdfPath = await generatePDF(orders, res); // Wait for PDF generation
        console.log("PDF sent successfully.");
    } catch (error) {
        console.error("Error generating PDF: ", error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send("Error generating PDF");
    }
};




export const downloadExcel = async (req, res) => {

    try {

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

            // Write the Excel file to a buffer
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        };


        const excelBuffer = await generateExcel(orders);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
        res.send(excelBuffer);

    } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send("Could not generate Excel file.");
    }


}
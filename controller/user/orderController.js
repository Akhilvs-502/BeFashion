
import PDFDocument from 'pdfkit';
import orderModel from '../../models/orderSchema.js';
import usermodel from '../../models/userModel.js';


    export const downloadInvoice=async(req,res)=>{
       const {orderId} =req.query
      const order=await orderModel.find({_id:orderId}).populate("products.product")
      let user=order[0].user
      user=await usermodel.find({_id:user})
      let userName=user[0].name     
      let shippingAddress=order[0].shippingAddress
      console.log(order[0].products);
let orderItems=[]
      const  shippingFee=order[0].shippingFee
      order[0].products.forEach(product=>{
console.log(product.orderStatus=="delivered");
if(product.orderStatus=="delivered"){

    orderItems.push({name:product.product.productName,description:(product.product.description).substring(0,15),price:product.discountedPrice,couponDiscount:product.couponAdded, quantity:product.quantity})
}})



      
// let orderItems = [
//         { name: "Product 1", description: "Description of Product 1", price: 10, quantity: 2 },
//         { name: "Product 2", description: "Description of Product 2", price: 20, quantity: 1 },
//     ];
    const doc = new PDFDocument();

    // Set the response headers to trigger a download
    res.setHeader('Content-disposition', 'attachment; filename=invoice.pdf');
    res.setHeader('Content-type', 'application/pdf');

    // Pipe the PDF into the response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("BeFashion ptd", 20, 20);
    doc.fontSize(10).text("beFashion  560002 india", 20, 50);
    doc.text("Bangalore, KARNATAKA, 560002", 20, 65);
    doc.text("Phone: (123) 456-7890", 20, 80);
    doc.text("Email: info@beFashion.com", 20, 95);
    
    doc.fontSize(14).text("Invoice", 360, 20);  // Moved slightly to the left
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 360, 40);
    doc.text(`Invoice #: 001`, 360, 60);

    // Customer Information
    doc.fontSize(12).text("Bill To:", 20, 120);
    doc.fontSize(10).text( `Customer Name:${userName}`, 20, 140);
    doc.text(`Shipping Address: ${shippingAddress.address},${shippingAddress.city},${shippingAddress.locality},${shippingAddress.state},${shippingAddress.pincode}`, 20, 155);

    // Table Header 
    const startY = 200;
    const rowHeight = 25;
    
    doc.fontSize(12)
        .text("Item", 20, startY)
        .text("Description", 180, startY)
        .text("Unit Cost", 350, startY)
        .text("Quantity", 420, startY)
        .text("Line Total", 480, startY);

    // // Sample Order Details
    // orderItems = [
    //     { name: "Product 1", description: "Description of Product 1", price: 10, quantity: 2 },
    //     { name: "Product 2", description: "Description of Product 2", price: 20, quantity: 1 },
    // ];

    // Add order items to the PDF 

    orderItems.forEach((item, index) => {
        const y = startY + (index + 1) * rowHeight;
        doc.text(item.name, 20, y);
        doc.text(item.description, 180, y);
        doc.text(`Rs ${item.price.toFixed(2)}`, 350, y);
        doc.text(item.quantity.toString(), 420, y);
        doc.text(`Rs ${(item.price * item.quantity).toFixed(2)}`, 480, y);
    });

    // Totals 
    const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0); 
    const couponDiscount = orderItems.reduce((acc, item) => acc + (item.couponDiscount), 0); 
    const total = subtotal - couponDiscount+shippingFee;
    doc.text("Subtotal:Rs " + subtotal.toFixed(2), 350, startY + (orderItems.length + 1) * rowHeight);
    doc.text("Coupon Discount:Rs " + couponDiscount.toFixed(2), 350, startY + (orderItems.length + 2) * rowHeight);
    doc.text("Shipping charge:Rs " + shippingFee.toFixed(2), 350, startY + (orderItems.length + 3) * rowHeight);
    doc.text("Total:Rs " + total.toFixed(2), 350, startY + (orderItems.length + 4) * rowHeight);

    // Footer
    doc.fontSize(8).text("Thank you for your business!", 20, startY + (orderItems.length + 5) * rowHeight);
    doc.text("This is a computer-generated invoice and does not require a signature.", 20, startY + (orderItems.length + 6) * rowHeight);

    // Finalize the PDF and end the stream
    doc.end();

}



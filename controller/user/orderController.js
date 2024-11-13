
import PDFDocument from 'pdfkit';
import orderModel from '../../models/orderSchema.js';
import usermodel from '../../models/userModel.js';
import dotenv from "dotenv";
dotenv.config()
import Razorpay from 'razorpay'
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
import walletModel from "../../models/walletModel.js";
import productModel from '../../models/productSchema.js';
import cartModel from '../../models/cartSchema.js';
import couponModel from '../../models/couponSchema.js';
import offerModel from '../../models/offerSchema.js';

let razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});


export const orderUpdate = async (req, res) => {
    try {
        const { addressID, orderType } = req.body
        const jwtUser = req.userData
        const address = await usermodel.findOne({ email: jwtUser.email, 'address._id': addressID }, { 'address.$': 1 })
        const user = await usermodel.findOne({ email: jwtUser.email })
        const userID = address._id
        const addressDatas = address.address[0]
        const cart = await cartModel.findOne({ userId: userID }).populate({ path: 'products.productId', model: productModel })
        let productArray = []
        let totalOrderPrice = 0;
        let shippingFee = 0
        let discountedPrice = 0
        let productCoupon = (cart.couponDiscount) / ((cart.products).length)
        let productIds = []
        
        if (cart.products) {
            //   cart.products.forEach(async product => {
                for( const product of cart.products ){
                    totalOrderPrice += Number(((product.productId.price) - ((product.productId.price) * (product.productId.discount / 100))).toFixed(2)) * product.quantity
                    let discountedPrice = ((product.productId.price) - ((product.productId.price) * (product.productId.discount / 100))).toFixed(2)
                    productIds.push(product.productId._id)
                    //OFFER
                    let offerDiscount = 0
                    const offerData = await offerModel.find({ 'offerFor.offerGive': product.productId._id })
                    if (offerData.length > 0) {
                        for (const offer of offerData) {
                            if (offer.offerType == "price") {
                                offerDiscount += offer.discountValue
                        }
                        else {
                            let productPrice = await productModel.find({ _id: product.productId._id })
                            let discountPrice = (productPrice[0].price) * ((productPrice[0].discount) / 100)
                            discountPrice = productPrice[0].price - discountPrice
                            offerDiscount += discountPrice * ((offer.discountValue) / 100)


                        }
                    }
                }

                offerDiscount = Math.round(offerDiscount)

                console.log(offerDiscount + "offer");

                const data = {
                    product: product.productId._id,
                    quantity: product.quantity,
                    price: product.productId.price,
                    discountedPrice: discountedPrice,
                    paymentMode: orderType,
                    orderStatus: "processing",
                    color: product.productId.color[0],
                    size: product.size,
                    offerAdded: offerDiscount,
                    couponAdded: productCoupon,
                    totalPay: ((discountedPrice) * (product.quantity)) - productCoupon-offerDiscount
                }


                // console.log("stock:" + product.productId.stock);
                const newStock = (product.productId.stock) - (product.quantity)
                productArray.push(data)
                await productModel.findOneAndUpdate({ _id: product.productId._id }, { $set: { stock: newStock } })
                //updating the coupon

                const couponStatus = await couponModel.findOne({ couponCode: cart.couponCode, 'usedBy.userId': userID })
                let couponUpdate
                if (!couponStatus) {
                    console.log("user first time apply coupon");
                    couponUpdate = await couponModel.findOneAndUpdate(
                        { couponCode: cart.couponCode },
                        { $push: { usedBy: { userId: userID, usedCount: 1 } } },
                        { new: true }
                    )
                } else {
                    console.log(couponStatus);
                    couponUpdate = await couponModel.findOneAndUpdate({ couponCode: cart.couponCode, 'usedBy.userId': userID }, { $inc: { 'usedBy.$.usedCount': 1 } })
                }
                console.log(couponUpdate);





         }

            console.log(productArray + "array");

            totalOrderPrice < 500 ? shippingFee = 40 : shippingFee = 0
            const order = new orderModel({
                user: userID,
                shippingAddress: {
                    address: addressDatas.name,
                    phone: addressDatas.phone,
                    pincode: addressDatas.pincode,
                    state: addressDatas.state,
                    locality: addressDatas.locality,
                    city: addressDatas.city,
                },
                products: productArray,
                shippingFee: shippingFee
            })
            const orderId = order._id

            totalOrderPrice += shippingFee
            console.log(shippingFee);
            totalOrderPrice = totalOrderPrice.toFixed(2)
            //// total OFFER
            let offerDiscount = 0
            for (const productId of productIds) {
                const offerData = await offerModel.find({ 'offerFor.offerGive': productId })
                if (offerData.length > 0) {
                    for (const offer of offerData) {
                        if (offer.offerType == "price") {
                            offerDiscount += offer.discountValue
                        }
                        else {
                            let productPrice = await productModel.find({ _id: productId })
                            let discountPrice = (productPrice[0].price) * ((productPrice[0].discount) / 100)
                            discountPrice = productPrice[0].price - discountPrice
                            offerDiscount += discountPrice * ((offer.discountValue) / 100)
                        }
                    }
                }
            }
            offerDiscount = Math.round(offerDiscount)
            totalOrderPrice = totalOrderPrice - offerDiscount


            ////Response to cod
            if (orderType == 'cod') {
                if (totalOrderPrice < 1000) {
                    await order.save()
                    console.log(orderType);
                    const update = await cartModel.deleteOne({ userId: userID })  //delete user cart
                    res.status(201).json({ orderId: orderId, message: "order created", orderType, user, totalOrderPrice })
                }
                else {
                    res.status(409).json({ status: "codNotAllowed", message: "order amount is less than 1000" })
                }
            }

            /////Responsee to razorpay
            else if (orderType == 'razorpay') {
                console.log("json send to the axos");

                console.log(totalOrderPrice);
                console.log(discountedPrice);

                const orderOptions = {
                    amount: ((totalOrderPrice) - (cart.couponDiscount)) * 100,  // Amount is in smallest currency unit (50000 paise = ₹500)
                    currency: "INR",
                    receipt: "order_rcptid_11",
                    payment_capture: '1' // Auto-capture the payment
                };
                razorpayInstance.orders.create(orderOptions, async (err, razorpayOrder) => {
                    console.log("creating instance");

                    if (err) {
                        console.error("Error in creating order:", err);
                        res.status(500).send('Something went wrong');
                    } else {
                        await order.save()
                        console.log(order);
                        const update = await cartModel.deleteOne({ userId: userID })   //delete user cart

                        res.json({
                            razorpayOrderId: razorpayOrder.id,  // Send order.id to frontend
                            amount: razorpayOrder.amount,  // Send amount to frontend
                            currency: razorpayOrder.currency, // Send currency
                            orderType: orderType,
                            orderId: orderId,
                            totalOrderPrice,
                            user,
                            RAZORPAY_KEY_ID
                        });
                    }
                });
            }
            //wallet
            else if (orderType == 'wallet') {
                console.log(orderType);
                const userId = await usermodel.findOne({ email: user.email }, { _id: 1 })
                // const wallet = await walletModel.findOne({ userId: userId._id })
                const wallectCheck = await walletModel.findOneAndUpdate({ userId: userId._id })
                if (wallectCheck.balance > totalOrderPrice) {
                    const update = await cartModel.deleteOne({ userId: userID })   //delete user cart

                    const wallet = await walletModel.findOneAndUpdate({ userId: userId._id }, {
                        $inc: { balance: -(totalOrderPrice - (cart.couponDiscount)) }, $push: {
                            transactions: {
                                wallectAmount: (totalOrderPrice - (cart.couponDiscount)),
                                orderId: orderId,
                                trasactionType: "debited",
                                trasactionsDate: new Date()
                            }
                        }
                    }, { new: true })
                    console.log(order._id);
                    await order.save()
                    const updateorder = await orderModel.findOneAndUpdate({ _id: order._id }, { $set: { "products.$[].paymentStatus": "paid" } }, { new: true })
                    console.log(updateorder);
                    res.status(201).json({ orderId: orderId, message: "order created", orderType, user })
                }
                else {
                    // await orderModel.findOneAndUpdate({ _id: order._id }, { $set: { "products.$[].paymentStatus": "failed" } })
                    res.status(404).json({ message: "Insufficient wallet balance to complete the order", status: "noBalance" })
                }
            }

        } else {
            res.status(404).json({ message: "there is no product in the cart" })
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ message: "there is no product in the cart" })

    }



}




export const orderSuccess = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const user = req.userData
        const orderDetails = await orderModel.find({ _id: orderId })
        const products = orderDetails[0].products

        const order = orderDetails[0]
        console.log(order);

        res.render("user/orderSuccess", { user, orderId, products, order })
    }
    catch {

    }

}




export const showOrders = async (req, res) => {
    try {

        // Get page and limit from query parameters, set default values if not provided
        const page = parseInt(req.query.page) || 1;  // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10

        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;
        const user = req.userData
        const userData = await usermodel.find({ email: user.email })
        const userId = userData[0]._id
        const orderData2 = await orderModel.find({ user: userId })
        let totalPages = 0
        orderData2.forEach(userOrders => {
            totalPages += userOrders.products.length
        })
        console.log(totalPages);


        const orderData = await orderModel.find({ user: userId }).sort({ createdAt: -1 }).populate({ path: 'products.product', model: productModel }).skip(skip).limit(limit)
        console.log(orderData[0]);
        res.render("user/showOrders", {
            user, orderData, totalPages: totalPages / limit,
            currentPage: page,
            limit: limit
        })
    } catch (err) {
        console.log(err);

    }
}


export const orderCancel = async (req, res) => {
    try {
        const user = req.userData
        const userData = await usermodel.find({ email: user.email })
        const userId = userData[0]._id
        console.log(userId);
        const { product_id } = req.body
        console.log(product_id);
        const order = await orderModel.findOne({ user: userId, 'products._id': product_id }, { 'products.$': 1 })
        const ship = await orderModel.findOne({ user: userId, 'products._id': product_id })
        console.log(order.products[0].paymentStatus);
        console.log(order.products[0].paymentStatus);

        console.log(ship.shippingFee);
        const RefundRupee = (order.products[0].totalPay) + ship.shippingFee

        //if paid refund
        if (order.products[0].paymentStatus == "paid") {
            await walletModel.findOneAndUpdate({ userId: userId }, {
                $inc: { balance: RefundRupee }, $push: {
                    transactions: {
                        wallectAmount: RefundRupee,
                        orderId: order._id,
                        trasactionType: "creditd",
                        trasactionsDate: new Date()
                    }
                }
            })
            await orderModel.findOneAndUpdate({ 'products._id': product_id }, { 'products.$.paymentStatus': "refunded" })
        }
        const update = await orderModel.findOneAndUpdate({ user: userId, 'products._id': product_id }, { 'products.$.orderStatus': 'cancelled' })
        res.json({ message: 'updated' })
    }
    catch (err) {
        console.log(err);

        res.status(409).json({ message: "err" })
    }


}





export const returnOrder = async (req, res) => {
    try {
        console.log("return");

        const user = req.userData
        const userData = await usermodel.find({ email: user.email })
        const userId = userData[0]._id

        const { text, product_id } = req.body
        const update = await orderModel.findOneAndUpdate({ user: userId, 'products._id': product_id }, { 'products.$.returnStatus': 'requested', 'products.$.returnReason': text }, { new: true })
        console.log(update);
        res.json({ message: "order retured" })

    }
    catch {
        console.log("catch");

    }
}


export const downloadInvoice = async (req, res) => {
    const { orderId } = req.query
    const order = await orderModel.find({ _id: orderId }).populate("products.product")
    let user = order[0].user
    user = await usermodel.find({ _id: user })
    let userName = user[0].name
    let shippingAddress = order[0].shippingAddress
    console.log(order[0].products);
    let orderItems = []
    const shippingFee = order[0].shippingFee
    order[0].products.forEach(product => {
        console.log(product.orderStatus == "delivered");
        if (product.orderStatus == "delivered") {

            orderItems.push({ name: product.product.productName, description: (product.product.description).substring(0, 15), price: product.discountedPrice, couponDiscount: product.couponAdded, quantity: product.quantity })
        }
    })





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
    doc.fontSize(10).text(`Customer Name:${userName}`, 20, 140);
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
    const total = subtotal - couponDiscount + shippingFee;
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



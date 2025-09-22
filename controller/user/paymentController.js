import orderModel from "../../models/orderSchema.js"
import Razorpay from 'razorpay'
import cartModel from "../../models/cartSchema.js"
import usermodel from "../../models/userModel.js"
import { createHmac } from 'crypto';  // for verifiction in razorpay 
import mongoose from "mongoose";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

let razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});



export const paymentVerification = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { order_id, payment_id, signature, orderId } = req.body;

        const hmac = createHmac('sha256', RAZORPAY_KEY_SECRET);
        hmac.update(order_id + "|" + payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== signature) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ status: 'failure', message: 'Payment verification failed.' });
        }

        
        await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { 'products.$[].paymentStatus': 'paid', 'products.$[].orderStatus': 'processing' } }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.json({ status: 'success', message: 'Payment verified', orderId });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.log(err);
        res.status(500).json({ message: "Error in payment verification" });
    }
};




export const paymentFailed = async (req, res) => {
    try {
        const { orderId } = req.body
        const updateorder = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { "products.$[].paymentStatus": "pending" } }, { new: true })
        await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { "products.$[].orderStatus": "pending" } }, { new: true })

        console.log(orderId);
    } catch (err) {
        res.render("user/500")

    }
}

export const repayment = async (req, res) => {
    try {
        const { orderid } = req.body
        console.log(orderid);
        const orderData = await orderModel.findOne({ _id: orderid })
        const userID = orderData.user
        const user = await usermodel.findOne({ _id: userID })

        let totalOrderPrice = 0
        orderData.products.forEach(order => {
            console.log(order);
            totalOrderPrice += order.totalPay
        })
        totalOrderPrice += orderData.shippingFee
        console.log(totalOrderPrice);



        const orderOptions = {
            amount: (totalOrderPrice) * 100,  // Amount is in smallest currency unit (50000 paise = ₹500)
            currency: "INR",
            receipt: "order_rcptid_11",
            payment_capture: '1' // Auto-capture the payment
        };
        razorpayInstance.orders.create(orderOptions, async (err, order) => {
            console.log("creating instance");

            if (err) {
                console.error("Error in creating order:", err);
                res.status(500).send('Something went wrong');
            } else {
                // console.log(order);
                const update = await cartModel.deleteOne({ userId: userID })   //delete user cart

                res.json({
                    razorpayOrderId: order.id,  // Send order.id to frontend
                    amount: order.amount,  // Send amount to frontend
                    currency: order.currency, // Send currency
                    orderId: orderid,
                    totalOrderPrice,
                    user,
                    RAZORPAY_KEY_ID
                });
            }
        });


    } catch (err) {
        console.log(err);

    }

}


import orderModel from "../../models/orderSchema.js"
import Razorpay from 'razorpay'
import cartModel from "../../models/cartSchema.js"
import usermodel from "../../models/userModel.js"
import { createHmac } from 'crypto';  // for verifiction in razorpay 

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

let razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});





export const paymentVerificaton = async (req, res) => {
    try {

        const user = req.userData
        const userData = await usermodel.find({ email: user.email })
        const userId = userData[0]._id
        const { order_id, payment_id, signature, orderId } = req.body;
        console.log("verification");
        const hmac = createHmac('sha256', RAZORPAY_KEY_SECRET); 
        hmac.update(order_id + "|" + payment_id);
        const generated_signature = hmac.digest('hex');
        if (generated_signature === signature) {
            console.log("sign");
            
            const event = req.body.event;

            if (event === 'payment.failed') {
                const paymentInfo = req.body.payload.payment.entity;
                console.log('Payment Failed:', paymentInfo);
                const update = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { 'products.$[].paymentStatus': 'pending', 'products.$[].orderStatus': 'pending' } }, { new: true })
            }
            // Payment verification successful
            const update = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { 'products.$[].paymentStatus': 'paid', 'products.$[].orderStatus': 'processing'} }, { new: true })
            console.log('Payment verified successfully!');
            res.json({ status: 'success', message: 'Payment verified and updated in database.', orderId });
        } else {
            const update = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { 'products.$[].orderStatus': 'pending' } }, { new: true })
            // Payment verification failed
            console.error('Payment verification failed.');
            res.json({ status: 'failure', message: 'Payment verification failed.' });
        }
    }
    catch(err) {
    console.log(err);

    }

}



export const paymentFailed = async (req, res) => {
    try {
        const { orderId } = req.body
        const updateorder = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { "products.$[].paymentStatus": "pending" } }, { new: true })
        await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { "products.$[].orderStatus": "pending" } }, { new: true })

        console.log(orderId);
    } catch (err) {

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


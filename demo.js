
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





export const paymentVerificaton = async (req, res) => {

    const session=await mongoose.startSession()
    session.startTransaction()

    try {

        const user = req.userData
        const userData = await usermodel.find({ email: user.email })
        const userId = userData[0]._id
        const { order_id, payment_id, signature, orderId } = req.body;
     

        const hmac = createHmac('sha256', RAZORPAY_KEY_SECRET); 
        hmac.update(order_id + "|" + payment_id);
        const generated_signature = hmac.digest('hex');
        if (generated_signature === signature) {
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
        res.render("user/500")

    }
}
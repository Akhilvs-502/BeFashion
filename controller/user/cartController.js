import cartModel from "../../models/cartSchema.js"
import usermodel from "../../models/userModel.js"
import couponModel from "../../models/couponSchema.js"
import productModel from "../../models/productSchema.js"
import e from "express"




export const addToCart = async (req, res) => {
    try {

        const jwtUser = req.userData
        const userData = await usermodel.findOne({ email: jwtUser.email })
        const { productId, selectSize } = req.body
        console.log(productId);
        
        console.log(selectSize);
        const userCart = await cartModel.findOne({ userId: userData._id })

        if (!userCart) {
            console.log("thre is no user cart");

            const model = new cartModel({
                userId: userData._id,
                products: [{ productId, quantity: 1, size: selectSize }]
            })
            await model.save()
            console.log("Cart created");
            
            return res.status(201).json({ message: "new cart created" })
        }
  

        else {
            console.log("user cart is exit");
            console.log(userData._id);

            const model = await cartModel.findOne({ userId: userData._id })
            const productIndex = model.products.findIndex(item => item.productId == productId)
            console.log(productIndex);

            if (productIndex == -1) {
                console.log("product creating");
                const product = await cartModel.findOneAndUpdate({ userId: userData._id },
                    {
                        $addToSet: {
                            products: {
                                productId, quantity: 1, size: selectSize
                            }
                        }
                    }, { new: true }
                )
                return res.status(201).json({ message: "new product added to the cart" })
            } else {
                return res.status(409).json({ message: "already added" })
            }
        }
    }

    catch(err) {
        console.log(err);
        
        return res.status(409).json({ message: "Something went wrong please try again " })
    }
}


export const showCart = async (req, res) => {
    try {
        
        const user = req.userData
        const userData = await usermodel.findOne({ email: user.email })
        const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount = 0
        let total = 0
        if (cart) {
            console.log("cart ");
            if (cart.products.length == 0) {
                await cartModel.findOneAndUpdate({ userId: userData._id }, { couponDiscount: 0 })

            }
            const products = cart.products.forEach(product => {
                totalPrice += product.productId.price * product.quantity
            })
            cart.products.forEach(product => {
                discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
            })
            shippingFee = totalPrice < 500 ? 40 : 0
            shippingFee = totalPrice == 0 ? 0 : shippingFee
            couponDiscount = (cart.couponDiscount).toFixed(2)
            total = ((totalPrice - discountPrice) + shippingFee).toFixed(2)
            total = total - couponDiscount
            discountPrice.toFixed(2)
            const coupon = await couponModel.find({ block: false })
            console.log(coupon);

            res.render('user/showCart', { user, cart, totalPrice, total, discountPrice, shippingFee, couponDiscount, coupon })
        } else {
            console.log("ShowCart");
            const coupon = await couponModel.find({ block: false })

            res.render('user/showCart', { user, cart, totalPrice, total, discountPrice, shippingFee, couponDiscount, coupon })

        }

    }
    catch (err) {
        console.log(err);

    }

}


export const updateQuantity = async (req, res) => {
    try {
        console.log(req.body);

        const jwtUser = req.userData
        const userData = await usermodel.findOne({ email: jwtUser.email })
        const { productId, action, value } = req.body


        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount = 0
        let total = 0
        async function newCart() {
            const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
            if (cart) {
                const products = cart.products.forEach(product => {
                    totalPrice += product.productId.price * product.quantity
                })
                cart.products.forEach(product => {
                    discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
                })
                shippingFee = totalPrice < 500 ? 40 : 0
                shippingFee = totalPrice == 0 ? 0 : shippingFee
                couponDiscount = (cart.couponDiscount).toFixed(2)
                total = ((totalPrice - discountPrice) + shippingFee).toFixed(2)
                total = total - couponDiscount
                discountPrice.toFixed(2)

            }


        }

        if (action === "quantityAdding") {
            console.log(value);
            const productDetails = await productModel.findOne({ _id: productId })
            if(Number(value+1)>=5){
            return  res.status(409).json({ message: "Only 5 quantites allowed to buy" })

            }
         else if (productDetails.stock <= value) {
                console.log("err");
                res.status(409).json({ message: "The product is currently out of stock! You can't add any more to the quantity" })
            }
            else {
                const cart = await cartModel.findOneAndUpdate({
                    userId: userData._id, 'products.productId': productId
                }, { $inc: { 'products.$.quantity': 1 } }, { new: true })
                const productDetails = await productModel.findOne({ _id: productId })
                const productPrice = productDetails.price
                const productDiscountPrice = productPrice - (productPrice * (productDetails.discount / 100))

                await newCart()

                res.json({ totalPrice, total, shippingFee, discountPrice, productPrice, productDiscountPrice })
            }


        }
        else if (action === "quantityDecreasing") {
            await cartModel.findOneAndUpdate({
                userId: userData._id, 'products.productId': productId
            },
                { $inc: { 'products.$.quantity': -1 } })
            const productDetails = await productModel.findOne({ _id: productId })
            console.log(productDetails);
            const productPrice = productDetails.price
            const productDiscountPrice = productPrice - (productPrice * (productDetails.discount / 100))
            console.log(productPrice, productDiscountPrice);

            await newCart()
            res.json({ totalPrice, total, shippingFee, discountPrice, productPrice, productDiscountPrice })



        }
        else if (action === "selectSize") {
            await cartModel.findOneAndUpdate({
                userId: userData._id, 'products.productId': productId
            },
                { $set: { "products.$.size": value } })
            res.json({
                message: "size changed"
            })
        }
        else if (action === "delete") {
            await cartModel.findOneAndUpdate({
                userId: userData._id
            },
                { $pull: { products: { productId: productId } } })
            res.json({
                message: "product deleted"
            })
        }
    }

    catch(err) {
        console.log(err);
        
        res.status(500).json({ message: "server error" })
    }

}

import usermodel from "../../models/userModel.js"
import cartModel from "../../models/cartSchema.js"

export const checkOutStep1 = async (req, res) => {
    try {

        const user = req.userData
        const userData = await usermodel.findOne({ email: user.email })
        const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount = 0
        let total = 0

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
        //address
        const dataBase = await usermodel.findOne({ email: user.email })
        console.log(dataBase);

        res.render("user/checkoutStep1", { user, cart, total, totalPrice, couponDiscount, discountPrice, shippingFee, dataBase })
    }
    catch {

    }
}



export const postCheckOutStep1 = async (req, res) => {
 try {
        const jwtUser = req.userData
        const { addressID } = req.body
        let data = await usermodel.findOne({ email: jwtUser.email, 'address._id': addressID }, { 'address.$': 1 })
        res.json({ addressID })
} catch {

    }

}



export const selectPayment = (req, res) => {
    try {
        const addressID = req.params.addressID
        console.log(addressID);
        const user = req.userData
        res.render("user/selectPayment", { user, addressID })
    }
    catch {
        res.render("user/home", { user: false })
    }
}



export const cartSummary = async (req, res) => {
    try {

        const addressID = req.params.addressID
        console.log(addressID);
        const user = req.userData
        const userData = await usermodel.findOne({ email: user.email })
        const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount = 0
        let total = 0
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
        res.render("user/orderSummary", { user, total, couponDiscount, cart, totalPrice, discountPrice, shippingFee, addressID })
    }
    catch(err) {
        res.render("user/500")

    }

}

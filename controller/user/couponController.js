import { escapeRegExpChars } from "ejs/lib/utils.js";
import cartModel from "../../models/cartSchema.js";
import couponModel from "../../models/couponSchema.js";
import usermodel from "../../models/userModel.js";


export const applyCoupon = async (req, res) => {
    try {
        let { couponCode } = req.body
        couponCode = couponCode.toUpperCase()
        const userEmail = req.userData.email
        const user = await usermodel.findOne({ email: userEmail })

        const coupon = await couponModel.findOne({ couponCode: couponCode })
        if (coupon) {
            const now = new Date()
            if (now >= coupon.startDate && now <= coupon.endDate) {
                const cart = await cartModel.findOne({ userId: user._id }).populate({ path: 'products.productId', model: 'product' })
                let totalPrice = 0
                let discountPrice = 0
                if (cart) {
                    const products = cart.products.forEach(product => {
                        totalPrice += product.productId.price * product.quantity
                    })
                    cart.products.forEach(product => {
                        discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
                    })

                }
                let overalTotal = totalPrice - discountPrice
                let couponDiscount = 0
                if (coupon.couponType == "percentage") {
                    couponDiscount = (overalTotal * (coupon.discountValue / 100)).toFixed(2)
                } else {
                    couponDiscount = coupon.discountValue
                }
                let couponStatus = await couponModel.findOne({ couponCode, 'usedBy.userId': user._id }, { usedBy: { $elemMatch: { userId: user._id } } })
                if (couponStatus) {
                    if (couponStatus.usedBy[0].usedCount >= coupon.usageCount) {
                       
                        return res.status(409).json({ message: "Coupon usage limit exceeded. This coupon is no longer available for use", status: "limitExceeded" })
                    }
                }

                if (couponDiscount > coupon.maxDiscountAmount) {
                    couponDiscount = coupon.maxDiscountAmount
                }

                if (totalPrice >= coupon.minimumAmount) {

                    const cartUpdate = await cartModel.findOneAndUpdate({ userId: user._id }, { couponDiscount, couponCode })


                    res.json({ message: "coupon applyed" })
                }
                else {
                    res.status(409).json({ message: "mininum cart value Error ", status: "noMinium", minimumAmount: coupon.minimumAmount })
                }
            }
            else {
                res.status(409).json({ message: "coupon expired", status: "expireCoupn" })
            }
        } else {
            res.status(409).json({ message: "no coupn found", status: "noCoupn" })
        }


    } catch (err) {
        console.log(err);

    }

}


export const removeCoupon = async (req, res) => {
    try {
        const userEmail = req.userData.email
        const user = await usermodel.findOne({ email: userEmail })
        const cartUpdate = await cartModel.findOneAndUpdate({ userId: user._id }, { couponDiscount: 0, couponCode: "" })
        res.json({ message: "coupon removed" })


    } catch (err) {
        console.log(err);

    }
}


export const showCoupons = async (req, res) => {

    const userEmail = req.userData.email
    const user = await usermodel.findOne({ email: userEmail })
    const coupon = await couponModel.find({ block: false })

    res.render("user/coupons", { user, coupon })
}


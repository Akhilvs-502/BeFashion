import couponModel from "../../models/couponSchema.js"
import { HttpStatusCode } from "../../shared/constants/HttpStatusCode.js"





export const showCoupon = async (req, res) => {
    try {
        const coupons = await couponModel.find({})

        res.render("admin/coupon", { coupons })
    }
    catch (err) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })
    }


}



export const createCoupon = async (req, res) => {
    try {

        console.log("create coupon working");
        
        const { couponCode, couponType, discountValue, minimumAmount, startDate, endDate, usageCount,maxDiscountAmount} = req.body
        const alredyCoupoon = await couponModel.findOne({ couponCode })

        if (!alredyCoupoon) {
            const coupon = new couponModel({
                couponCode,
                couponType,
                discountValue: Number(discountValue)
                , minimumAmount: Number(minimumAmount)
                , maxDiscountAmount: Number(maxDiscountAmount)
                , startDate, endDate, usageCount
            })
            await coupon.save()
            res.status(HttpStatusCode.CREATED).json({ message: "coupon added" })

        } else {
            res.status(HttpStatusCode.CONFLICT).json({ message: "coupon code already added", status: "alreadyAdded" })
        }

    } catch (err) {
        console.log(err);
        
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "internal server error" })

    }
}



export const changeCouponSts = async (req, res) => {
    try {
        console.log("coupon woking");
        const { couponId } = req.body

        const coupon = await couponModel.findOne({ _id: couponId })
        if (coupon.block) {
            await couponModel.findOneAndUpdate({ _id: couponId }, { block: false })
        } else {
            await couponModel.findOneAndUpdate({ _id: couponId }, { block: true })
        }

        res.status(HttpStatusCode.OK).json({ message: "coupon Status changed" })
    }

    catch (err) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })

    }
}



export const deleteCoupn = async (req, res) => {
    try {
        const { couponId } = req.body

        const coupon = await couponModel.findOneAndDelete({ _id: couponId })

        res.status(HttpStatusCode.OK).json({ message: "coupon deleted" })
    }
    catch (err) {

        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })

    }
}



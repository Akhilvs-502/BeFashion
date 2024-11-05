import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
    },
    couponType: {
        type: String,
        enum: ["percentage", "price"]
    },
    discountValue: {
        type: Number,
        required: true
    },
    minimumAmount: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    usageCount: {
        type: Number,
        default: 0
    },
    usedBy: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId
            },
            usedCount: {
                type: Number,
                default: 0
            }

        }
    ],
    block: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const couponModel = mongoose.model("coupon", couponSchema)
export default couponModel
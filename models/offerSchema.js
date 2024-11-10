import mongoose from "mongoose";


const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    offer:[{
        offerTarget:{
            type:String,
            enum:["product","category"],
            required:true
        },
        offerGive:{
            type:mongoose.Schema.Types.ObjectId,
            required:true
        }
    }],
    offerType: {
        type: String,
        enum: ["percentage", "price"],
        required:true
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
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"productModel"
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"categoryModel"
    }
}, { timestamps: true })

const offerModel = mongoose.model("offer", offerSchema)
export default offerModel
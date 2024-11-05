import mongoose from "mongoose";
import productModel from "./productSchema.js";
const cartSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'usermodel'
    },
    products:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:'productModel'
        },
        quantity:{
            type:Number,
            default:1
        },size:{
            type:String,
        }
    }],
    couponDiscount:{
        type:Number,
        default:0
    },
    couponCode:{
        type:String
    },
    status:{
        type:String,
        default:"active"
    }
})


const cartModel=mongoose.model('cart',cartSchema)
export default cartModel
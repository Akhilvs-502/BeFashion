import mongoose from "mongoose";

const productSchema=new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required: true
    },
    description:{
        type:String
    },
    quantity:{
        type:String,
        required: true
    },
    discount:{
        type:String,
         default: '0'
    },
    stock:{
        type:Number,
        min:0
    },
    color:[{ type: String }],
    size:[{ type: String }],
    category:{
        type:String
    },
    block:{
        type:Boolean,
        default:false
    },
    images:[{ type: String }] // Array to store image URLs
},{timestamps:true})

const productModel=mongoose.model('product',productSchema)
export default productModel

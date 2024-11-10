import mongoose from "mongoose";

const orderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"usermodel",
        required:true
    },
    products:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"product"
            },
            quantity:{
                type:Number,
                // required:true,
                min:1
            },
            price:{

                type:Number,
                // required:true
            },
            discountedPrice:{
                type:Number,
                default:0
            },
            couponAdded:{
                type:Number,
                default:0
            },
            offerAdded:{
                type:Number,
                default:0
            },
            totalPay:{
                type:Number,
                required:true
            },
            orderStatus:{
                type:String,
                enum:['pending','processing','shipped','delivered','cancelled',"returned","failed"],
                default:"pending"
            },
            returnStatus:{
                type:String,
                enum:['requested','pending','approved','returned','rejected',"refunded"],
                default:"pending"
            },
            returnReason:{
                type:String
            },
            paymentMode:{
                type:String,
                enum:["cod",'razorpay','wallet']
            },
            paymentStatus:{
                type:String,
                enum:['pending','paid','failed',"refunded"],
                default:'pending'
            },
            color:{
                type:String
            },
            size:{
                type:String
            }



        }
    ],
    shippingAddress:{
                address:{type:String},
                phone:{type:String},
                pincode:{type:String},
                state:{type:String},
                locality:{type:String},
                city:{type:String},
            },
            shippingFee:{
                type:Number,
                default:0
            }
           

},{timestamps:true})

const orderModel=mongoose.model('order',orderSchema)
export default orderModel   
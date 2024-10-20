import mongoose from "mongoose";

const walletSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"usermodel"
    },
    balance:{
        type:Number,
        default:0
    },
    transactions:[
        {
            wallectAmount:{
                type:Number,
                default:0
            },
            orderId:{
                type:String
            },trasactionType:{
                type:String,
                enum:["creditd","debited"]
            },trasactionsDate:{
                type:Date,
                required:true,
                default:Date.now()
            }
        }
    ]
},{timestamps:true})

const walletModel=new mongoose.model('wallet',walletSchema)

export default walletModel
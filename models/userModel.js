import mongoose from 'mongoose'
import addAddressSchema from './addressSchema.js'
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    phone:{
        type:Number
    },  
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true,
        default:""
    },
    googleId:{
        type:String
    },
    verified:{
        type:Boolean
    },
    otp:{
        type:Number
    },
    expiresAt:{
        type:Number
    },
    blocked:{
        type:Boolean,
        default:false
    },
    joined:{
        type:Date,
        default:Date.now
    },
    dob:{
        type:String
    },
    alternativePhone:{
        type:Number
    },
    gender:{
        type:String
    },
    address:{
        type:[addAddressSchema],
        default:[]
    }
})

const usermodel=mongoose.model('user',userSchema)
export default usermodel
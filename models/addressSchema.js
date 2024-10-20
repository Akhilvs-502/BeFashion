import mongoose from "mongoose";
const addAddressSchema=new mongoose.Schema({
    name:{
        type:String
    },
    phone:{
        type:Number
    },
    address:{
        type:String
    },
    pincode:{
        type:Number
    },
    state:{
        type:String
    },
    locality:{
        type:String
    },
    district:{
        type:String
    },
    addressType:{
        type:String
    },
    city:{
        type:String
    }

})
export default addAddressSchema
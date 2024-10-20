import mongoose from "mongoose"
 const wishlistSchema =new mongoose.Schema({
    
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"usermodel"
    },
    products:[
        {
        productId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"product"
        }   
         }
    ]
 })

 const wishlistModel=mongoose.model("wishlist",wishlistSchema)
 export default wishlistModel
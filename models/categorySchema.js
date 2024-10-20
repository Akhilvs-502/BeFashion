import mongoose from 'mongoose'

const categorySchema=new mongoose.Schema({
    categoryName:{
        type:String
    },
    block:{
        type:Boolean,
        default:false
    }
})

const categoryModel=mongoose.model('category',categorySchema)
export default categoryModel
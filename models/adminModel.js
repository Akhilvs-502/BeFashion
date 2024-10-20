import mongoose from 'mongoose'
const userSchema=new mongoose.Schema({
     
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        // require:true
    }

})


const adminmodel=mongoose.model('admin',userSchema)
export default adminmodel


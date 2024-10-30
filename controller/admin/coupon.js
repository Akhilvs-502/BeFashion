import couponModel from "../../models/couponSchema.js"



export const showCoupon=async(req,res)=>{
    try{
        const coupons=await couponModel.find({})
        // console.log(coupons);
        
        res.render("admin/coupon",{coupons})
    }
    catch(err){

    }
   
    
 }


 export const addCoupon=async(req,res)=>{
    try{
        const {couponCode,couponType,discountValue,minimumAmount,startDate,endDate,usageCount}=req.body
        console.log(req.body);
  const alredyCoupoon=await   couponModel.findOne({couponCode})
        console.log(alredyCoupoon);
        if(!alredyCoupoon){       
        const coupon=await new couponModel({
            couponCode
            ,couponType,
            discountValue:Number(discountValue)
            ,minimumAmount:Number(minimumAmount)
            ,startDate,endDate,usageCount
        })
        coupon.save()

        console.log("Wr");
        res.json({messagae:"coupon added"})
    }else{
        res.status(409).json({messagae:"coupon code already added",status:"alredyAddded"})
    }
        
    }catch(err){
        console.log(err);
        
    }
 }


 export const changeCouponSts=async(req,res)=>{
    try{
        console.log("coupon woking");
    const {couponId}=req.body

    const coupon= await couponModel.findOne({_id:couponId})
    if(coupon.block){
        await couponModel.findOneAndUpdate({_id:couponId},{block:false})
    }else{
        await couponModel.findOneAndUpdate({_id:couponId},{block:true})
    }
    
    res.json({messagae:"coupon Status changed"})
}

    catch(err){
        console.log(err);
        
    }
 }


 export const deleteCoupn=async(req,res)=>{
    try{
    const {couponId}=req.body
    const coupon= await couponModel.findOneAndDelete({_id:couponId})
    res.json({messagae:"coupon deleted"})
}
    catch(err){
        console.log(err);
        
    }
 }


 
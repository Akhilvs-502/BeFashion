
import usermodel from "../../models/userModel.js";
import wishlistModel from "../../models/whishlistModel.js";

export const addToWishlist = async (req, res) => {
    try {
        const userEmail = req.userData.email
        const { productID } = req.body
        const user = await usermodel.findOne({ email: userEmail })
        // console.log(user);
        const wishlist = await wishlistModel.findOne({ userId: user._id })
        // console.log(wishlist);
        // console.log(productID);



        if (wishlist) {
         const product=await wishlistModel.findOne({userId:user._id,'products.productId':productID},{'products.$':1})
         console.log(product);
         if(product){
            res.status(409).json({message:"already added "})
        }else{
             await wishlistModel.findOneAndUpdate({userId:user._id},{ $push:{products:{ productId: productID  }  }}) }
             res.json({message:"product added to wishlist"})
         
        } else {
            const create = new wishlistModel({
                userId: user._id,
                products: [{
                    productId: productID  } ] })

            create.save()
        }
        res.json({message:"product added to wishlist"})
    }
    catch (err) {
        console.log(err);

    }


}


export const showWishlist=async(req,res)=>{
    const userEmail=req.userData.email
    const user=await usermodel.findOne({email:userEmail})
    console.log(user);
    
    let products=await wishlistModel.findOne({userId:user._id}).populate("products.productId")
    products=products.products
    console.log(products);
    // console.log();

    
    res.render("user/wishlist",{products,user})
}


export const removeFromWishlist=async(req,res)=>{
    try{
        const userEmail=req.userData.email
        const user=await usermodel.findOne({email:userEmail})
        const {productID}=req.body
        await wishlistModel.findOneAndUpdate({userId:user._id},{ $pull:{products:{ productId: productID  }  }}) 
        res.json({message:"product removed form the whishlist"})

    }catch(err){
        console.log(err);
        
    }
    
    
}
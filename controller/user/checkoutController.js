import usermodel from "../../models/userModel.js"
import cartModel from "../../models/cartSchema.js"
import offerModel from "../../models/offerSchema.js"
import productModel from "../../models/productSchema.js"

export const checkOutStep1 = async (req, res) => {
    try {

        const user = req.userData
        const userData = await usermodel.findOne({ email: user.email })
        const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount = 0
        let total = 0

        const products = cart.products.forEach(product => {
            totalPrice += product.productId.price * product.quantity
        })
        let productIds=[]
        cart.products.forEach(product => {
            discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
            productIds.push(product.productId._id)

        })
        shippingFee = totalPrice < 500 ? 40 : 0
        shippingFee = totalPrice == 0 ? 0 : shippingFee
        couponDiscount = (cart.couponDiscount).toFixed(2)
        total = ((totalPrice - discountPrice) + shippingFee).toFixed(2)
        total = total - couponDiscount
        discountPrice.toFixed(2)
        //address
        const dataBase = await usermodel.findOne({ email: user.email })
        // console.log(dataBase);
         ////OFFER
         let offerDiscount=0
         for(const productId of productIds){
            const offerData= await offerModel.find({'offerFor.offerGive':productId})
           if(offerData.length>0){
           for(const offer of offerData){
                  if( offer.offerType=="price"){
                   offerDiscount+=offer.discountValue
                  }
                  else{
       let productPrice  =await productModel.find({_id:productId})
       let discountPrice =(productPrice[0].price) * ((productPrice[0].discount) / 100)
           discountPrice=productPrice[0].price-discountPrice
           offerDiscount+=discountPrice*((offer.discountValue)/100)
       }
   }
}
}


offerDiscount=Math.round(offerDiscount)
total=total-offerDiscount

        res.render("user/checkoutStep1", { user, cart, total, totalPrice, couponDiscount, discountPrice, shippingFee, dataBase,offerDiscount })
    }
    catch(err) {
        console.log(err);
        

    }
}



export const postCheckOutStep1 = async (req, res) => {
 try {
        const jwtUser = req.userData
        const { addressID } = req.body
        let data = await usermodel.findOne({ email: jwtUser.email, 'address._id': addressID }, { 'address.$': 1 })
        res.json({ addressID })
} catch(err) {

    }

}



export const selectPayment = (req, res) => {
    try {
        const addressID = req.params.addressID
        console.log(addressID);
        const user = req.userData
        res.render("user/selectPayment", { user, addressID })
    }
    catch(err) {
        res.render("user/home", { user: false })
    }
}



export const cartSummary = async (req, res) => {
    try {

        const addressID = req.params.addressID
        console.log(addressID);
        const user = req.userData
        const userData = await usermodel.findOne({ email: user.email })
        const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount = 0
        let total = 0
        const products = cart.products.forEach(product => {
            totalPrice += product.productId.price * product.quantity
        })
        let productIds=[]
        cart.products.forEach(product => {
            discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
            productIds.push(product.productId._id)

        })
        shippingFee = totalPrice < 500 ? 40 : 0
        shippingFee = totalPrice == 0 ? 0 : shippingFee
        couponDiscount = (cart.couponDiscount).toFixed(2)
        total = ((totalPrice - discountPrice) + shippingFee).toFixed(2)
        total = total - couponDiscount
        discountPrice.toFixed(2)

             ////OFFER
             let offerDiscount=0
             for(const productId of productIds){
                const offerData= await offerModel.find({'offerFor.offerGive':productId})
               if(offerData.length>0){
               for(const offer of offerData){
                      if( offer.offerType=="price"){
                       offerDiscount+=offer.discountValue
                      }
                      else{
           let productPrice  =await productModel.find({_id:productId})
           let discountPrice =(productPrice[0].price) * ((productPrice[0].discount) / 100)
               discountPrice=productPrice[0].price-discountPrice
               offerDiscount+=discountPrice*((offer.discountValue)/100)
           }
       }
    }
    }
offerDiscount=Math.round(offerDiscount)

total=total-offerDiscount
    
        res.render("user/orderSummary", { user, total, couponDiscount, cart, totalPrice, discountPrice, shippingFee, addressID ,offerDiscount})
    }
    catch(err) {
        console.log(err);
        
        res.render("user/500")

    }

}

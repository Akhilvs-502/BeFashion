import categoryModel from "../../models/categorySchema.js"
import offerModel from "../../models/offerSchema.js"
import productModel from "../../models/productSchema.js"
import { HttpStatusCode } from "../../shared/constants/HttpStatusCode.js"


export const showOffers = async (req, res) => {
    try {

        const categories = await categoryModel.find({ block: false })
        const products = await productModel.find({})
        const offers = await offerModel.find({})
        console.log(offers);

        res.render("admin/offer", { products, categories, offers })
    } catch (err) {
        console.log(err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })
        
    }
}

export const addProductOffer = async (req, res) => {
    try {

        const { product_id, offerTitle, offerType, discountValue, startDate, endDate } = req.body
        console.log(req.body);

        const alredyoffer = await offerModel.findOne({ offerTitle })
        const productName = await productModel.findOne({ _id: product_id })
        console.log(productName.productName);

        console.log(alredyoffer);
        // if(!alredyoffer){       
        const offer = await new offerModel({
            title: offerTitle, offerType,
            discountValue: Number(discountValue)
            , startDate, endDate,
            offerFor: [{
                offerGive: product_id
            }]
            , offerTarget: "product"
            , targetName: productName.productName

        })
        await offer.save()

        console.log("Wr");
        res.status(HttpStatusCode.OK).json({ message: "coupon added" })
        // }else{
        // res.status(409).json({messagae:"coupon code already added",status:"alredyAddded"})
        // }



        // console.log(product_id,discount);
        // const update =await productModel.findOneAndUpdate({_id:product_id},{discount:discount},{new:true})
        // console.log(update);
        // res.json({message:"discount updated"})


    } catch (err) {
        console.log(err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })
    }
}

export const addCategoryOffer = async (req, res) => {
    try {
        const { offerTitle, discountValue, category, startDate, endDate, offerType } = req.body;
        const products = await productModel.find({ category: category })

        const offerFor = products.map(product => {
            // console.log(product._id);

            return { offerGive: product._id }
        })

        console.log(offerFor);

        const offer = await new offerModel({
            title: offerTitle, offerType,
            discountValue: Number(discountValue)
            , startDate, endDate, offerTarget: "category"
            , targetName: category,
            offerFor
        })
        await offer.save()
        // const {category,discount}=req.body
        // console.log(category,discount);
        // const update =await productModel.updateMany({category:category},{discount:discount},{new:true})
        // console.log(update);
        res.status(HttpStatusCode.OK).json({ message: "discount updated" })


    } catch (err) {
        console.log(err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })
    }
}



export const deleteOffer = async (req, res) => {

    try{

        const { offerId } = req.body
        const deleteOffer = await offerModel.findOneAndDelete({ _id: offerId })

        res.status(HttpStatusCode.OK).json({ message: "offer Deleted" })
    }catch(err){
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })
    }
}




export const editOffer = async (req, res) => {
    try{

        const { offerTitle, offerType, discount, offerId } = req.body
        console.log(offerId);
        
        const offer = await offerModel.findOneAndUpdate({ _id: offerId }, { title: offerTitle, offerType, discountValue: discount })

        res.status(HttpStatusCode.OK).json({ message: "Offer Status Updated", offer })

    }catch(err){
        console.log(err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "internal server error" })
    }

}
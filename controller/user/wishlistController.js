
import usermodel from "../../models/userModel.js";
import wishlistModel from "../../models/whishlistModel.js";
import { HttpStatusCode } from "../../shared/constants/HttpStatusCode.js";

export const addToWishlist = async (req, res) => {
    try {


        const userEmail = req.userData.email
        const { productID } = req.body
        const user = await usermodel.findOne({ email: userEmail })
        const wishlist = await wishlistModel.findOne({ userId: user._id })


        if (wishlist) {
            const product = await wishlistModel.findOne({ userId: user._id, 'products.productId': productID }, { 'products.$': 1 })
            console.log(product);
            if (product) {
                return res.status(409).json({ message: "already added " })
            } else {
                await wishlistModel.findOneAndUpdate({ userId: user._id }, { $push: { products: { productId: productID } } })
            }
            return res.json({ message: "product added to wishlist" })

        } else {
            const create = new wishlistModel({
                userId: user._id,
                products: [{
                    productId: productID
                }]
            })

            create.save()
        }
        return res.status(HttpStatusCode.OK).json({ message: "product added to wishlist" })
    }
    catch (err) {
        console.log(err);
        res.render("user/500")

    }


}




export const showWishlist = async (req, res) => {
    try {

        const userEmail = req.userData.email
        const user = await usermodel.findOne({ email: userEmail })
        console.log(user);

        let products = await wishlistModel.findOne({ userId: user._id }).populate("products.productId")
        products = products ? products.products : products = []
        res.render("user/wishlist", { products, user })
    } catch (err) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: " error in showing wishlist" })
    }
}




export const removeFromWishlist = async (req, res) => {
    try {
        const userEmail = req.userData.email
        const user = await usermodel.findOne({ email: userEmail })
        const { productID } = req.body
        console.log(productID);

        await wishlistModel.findOneAndUpdate({ userId: user._id }, { $pull: { products: { productId: productID } } })
        res.status(HttpStatusCode.OK).json({ message: "product removed form the whishlist" })

    } catch (err) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: " error in product removed form the whishlist" })

    }


}
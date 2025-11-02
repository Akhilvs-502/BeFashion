import usermodel from "../models/userModel.js"
import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
import nodemailer from 'nodemailer'
dotenv.config()
import bcrypt from 'bcrypt'
import productModel from "../models/productSchema.js";
import cartModel from "../models/cartSchema.js";
const secretKey = process.env.SECRET_KEY
import walletModel from "../models/walletModel.js";
import wishlistModel from "../models/whishlistModel.js";
import offerModel from "../models/offerSchema.js";
import { HttpStatusCode } from "../shared/constants/HttpStatusCode.js";




export const home = async (req, res) => {
    try {
        const products = await productModel.find({ block: false }).sort({ _id: -1 }).limit(10)

        const token = req.cookies.token
        const secretKey = process.env.SECRET_KEY
        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                if (err) {
                    let wishlistProduct = []
                    res.render('user/home', { products, user: false, wishlistProduct })
                }
                else {
                    const user = await usermodel.findOne({ email: data.email })
                    console.log(user);

                    const wishlist = await wishlistModel.find({ userId: user._id })
                    var wishlistProduct
                    console.log(wishlist, "wishlist");

                    if (wishlist.length >= 1) {

                        wishlistProduct = wishlist[0].products.length >= 1 ? wishlist[0].products : []
                    }
                    else {
                        wishlistProduct = []
                    }
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {
                        console.log("include wishlist");
                        console.log(wishlistProduct);

                        res.render('user/home', { products, user: user, wishlistProduct })
                    }
                }
            })
        } else {
            let wishlistProduct = []
            res.render('user/home', { products, user: false, wishlistProduct })
        }
    }
    catch (err) {
        console.log(err);
        res.render("user/500")

    }
}















export const allProducts = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        const skip = (page - 1) * limit;

        let products
        let filters = []
        let query = { block: false, "variants.stock": { $gt: 0 } }
        let sort = {}
        let categories = []
        if (req.query.men == 'true') {
            console.log("mens");

            filters.push('mens')
            categories.push('mens')
        }
        if ((req.query.women) === 'true') {

            filters.push('womens')
            categories.push('Womens')
        }
        if ((req.query.kids) === "true") {
            filters.push('kids')
            categories.push("kids")
        }

        if (categories.length > 0) {
            query.category = { $in: categories }
        }

        if ((req.query.price) == 'low-high') {
            filters.push('low-high')
            sort.price = 1
        }
        if ((req.query.price) == 'high-low') {
            filters.push('high-low')
            sort.price = -1
        }
        if ((req.query.sort) == 'aA-zZ') {
            filters.push('aA-zZ')
            query.productName = { $regex: /.*/, $options: 'i' }
            sort.productName = 1


        }
        if ((req.query.sort) == 'zZ-aA') {
            filters.push('zZ-aA')
            query.productName = { $regex: /.*/, $options: 'i' }
            sort.productName = -1
        }
        if (req.query.search) {
            const search = req.query.search
            query.productName = { $regex: `^${search}`, $options: "i" }

        }
        if ((req.query.stock) === 'true') {
            query.stock = { $gte: 0 }
            filters.push('stock')
        }
        if ((req.query.newArrivals) === 'true') {
            sort.createdAt = -1
            filters.push('newArrivals')

        }


        products = await productModel.find(query).collation({ locale: 'en', strength: 2 }).sort(sort).skip(skip).limit(limit)


        // Fetch the total number of products for calculating the total pages
        const totalProducts = await productModel.find(query).countDocuments();


        // console.log(products);


        ///JWT token checking
        const token = req.cookies.token
        const secretKey = process.env.SECRET_KEY
        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                if (err) {

                    wishlistProduct = []  //solve this err

                    res.render('user/allProducts', {
                        products, totalPages: Math.ceil(totalProducts / limit),
                        currentPage: page,
                        limit: limit, user: false, filters, wishlistProduct
                    })
                }
                else {

                    const user = await usermodel.findOne({ email: data.email })
                    const wishlist = await wishlistModel.find({ userId: user._id })
                    var wishlistProduct
                    if (wishlist.length >= 1) {
                        wishlistProduct = wishlist[0].products.length >= 1 ? wishlist[0].products : []
                    }
                    else {
                        wishlistProduct = []
                    }
                    console.log(wishlistProduct);

                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {

                        console.log(products, "product");


                        res.render('user/allProducts', {

                            products, totalPages: Math.ceil(totalProducts / limit),
                            currentPage: page,
                            limit: limit, user: user, filters, wishlistProduct
                        })
                    }
                }
            })
        } else {
            let wishlistProduct = []
            console.log("no product");

            res.render('user/allProducts', {
                products, totalPages: Math.ceil(totalProducts / limit),
                currentPage: page,
                limit: limit, user: false, filters, wishlistProduct
            })
        }
    }
    catch (err) {
        console.log(err);
        res.render("user/500")

    }



}


export const productView = async (req, res) => {
    try {

        const id = req.params.id

        const product = await productModel.findById(id)
        const categories = product.category
        const products = await productModel.find({ category: categories }).limit(6)

        ///JWT token checking
        const token = req.cookies.token
        const secretKey = process.env.SECRET_KEY


        const offer = await offerModel.find({ 'offerFor.offerGive': id })
        // console.log(offer+"offeres");
        var wishlistProduct = []

        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                if (err) {
                    res.render('user/productView', { product, products, user: false, offer, wishlistProduct })
                }
                else {
                    console.log(products, "pro");

                    const user = await usermodel.findOne({ email: data.email })
                    const wishlist = await wishlistModel.find({ userId: user._id })

                    if (wishlist.length >= 1) {
                        console.log("pro");
                        wishlistProduct = wishlist[0].products.length >= 1 ? wishlist[0].products : []
                    }
                    else {

                        wishlistProduct = []
                    }

                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {

                        const userData = await usermodel.findOne({ email: data.email })
                        const userCart = await cartModel.findOne({ userId: userData._id, 'products.productId': id })


                        res.render('user/productView', { product, products, user: data, offer, wishlistProduct })
                    }
                }

            })
        } else {
            wishlistProduct = []
            res.render('user/productView', { product, products, user: false, offer, wishlistProduct })
        }
    }
    catch (err) {
        console.log(err);

        res.render("user/500")

    }
}




export const wallet = async (req, res) => {
    try {

        const user = req.userData
        const userId = await usermodel.findOne({ email: user.email }, { _id: 1 })
        let wallet = await walletModel.findOne({ userId: userId._id })
        console.log(wallet);

        if (!wallet) {
            let walletSave = new walletModel({
                userId: userId._id
            })
            await walletSave.save()
            return res.render("user/wallet", { user, wallet: walletSave })

        }

        res.render("user/wallet", { user, wallet })
    }
    catch (err) {
        console.log(err);
        res.render("user/500")

    }
}
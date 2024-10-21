import usermodel from "../models/userModel.js"
import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
import nodemailer from 'nodemailer'
dotenv.config()
import bcrypt from 'bcrypt'

import productModel from "../models/productSchema.js";
import mongoose from "mongoose";
import cartModel from "../models/cartSchema.js";
import orderModel from "../models/orderSchema.js";
const secretKey = process.env.SECRET_KEY
import Razorpay from 'razorpay'
import { createHmac } from 'crypto';  // for verifiction in razorpay 
import walletModel from "../models/walletModel.js";
import couponModel from "../models/couponSchema.js";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET


let razorpayInstance = new Razorpay({
    key_id:RAZORPAY_KEY_ID, 
    key_secret:RAZORPAY_KEY_SECRET 
});
export const home = async (req, res) => {
    try {

        const products = await productModel.find({ block: false }).sort({ _id: -1 }).limit(10)

        const token = req.cookies.token
        const secretKey = process.env.SECRET_KEY
        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                if (err) {
                    res.render('user/home', { products, user: false })
                }
                else {
                    const user = await usermodel.findOne({ email: data.email })
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {

                        res.render('user/home', { products, user: user })
                    }
                }
            })
        } else {
            res.render('user/home', { products, user: false })
        }
    }
    catch {

    }
}

export const login = (req, res) => {
    try {

        console.log(req.cookies.token);
        const token = req.cookies.token
        const secretKey = process.env.SECRET_KEY
        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                if (err) {
                    res.render('user/login')
                }
                else {
                    const user = await usermodel.findOne({ email: data.email })
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {
                        res.redirect('/user/home')

                    }
                }
            })
        } else {
            res.render('user/login')
        }
    }
    catch {

    }
}




export const postLogin = async (req, res) => {
    try {

        const { email, password, rememberme } = req.body
        const userDatabase = await usermodel.findOne({ email: email, verified: true })


        if (userDatabase) {
            const isMatch = await bcrypt.compare(password, userDatabase.password,)
            if (isMatch) {
                console.log("password matched");

                const expiresIn = rememberme ? '7d' : '1h'
                // console.log(expiresIn);
                // console.log(secretKey);

                const token = jwt.sign({ email: userDatabase.email, name: userDatabase.name }, secretKey, { expiresIn })

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',  // Only set cookie over HTTPS in production
                    maxAge: 100000000,
                    sameSite: 'Strict'
                })
                res.json({
                    message: 'Login Successful',
                    token: token
                })
            } else {
                res.status(401).json({
                    message: "*Invalid password"
                })
            }
        }

        else {
            res.status(401).json({
                message: "*Invalid user.please enter the correct email and password"
            })
        }
    }
    catch {

    }
}



export const signUp = async (req, res) => {
    res.render('user/signup')
}


export const profile = async (req, res) => {
    const user = req.userData
    const dataBase = await usermodel.findOne({ email: user.email })
    res.render('user/profile', { user: dataBase, dataBase })
}

export const logout = (req, res) => {
    // console.log(req.cookies.token);
    res.clearCookie('token');
    // console.log(res.cookies.token);
    req.session.destroy()
    res.redirect('/user/login')
}

export const postSignup = async (req, res) => {
    try {

        const { email, phone, name, password } = req.body
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const emailPresent = await usermodel.findOne({ email })
        const phonePresent = await usermodel.findOne({ phone })
        const emailVerifed = await usermodel.findOne({ email, verified: true })
        const phoneVerifed = await usermodel.findOne({ email, verified: true })
        console.log(emailPresent, phonePresent);

        if (!emailPresent && !phonePresent) {
            const newUser = new usermodel({
                name: name,
                phone: phone,
                email: email,
                password: hashedPassword,
                verified: false,
            })
            await newUser.save();

            res.json({
                message: 'New account created',
                email: email
            })
        }
        else if (!emailVerifed && !phoneVerifed) {

            res.json({
                message: 'user exists  with notverifed',
                email: email
            })


        } else {
            res.status(409).json({
                Message: 'User alredy exists*'
            })
        }

    }
    catch {

    }
}


export const mailforotp = (req, res) => {
    const email = req.params.email
    req.session.userEmail = email
    res.render('user/mailforotp', { email })

}





export const getotp = async (req, res) => {

    const email = req.session.userEmail

    console.log("getotpemail" + email);
    res.render('user/otp', { email })
}










export const postMailforotp = async (req, res) => {
    try {

        const { email } = req.body
        req.session.userEmail = email

        console.log(req.body);
        console.log(email);

        console.log("this is postmail");


        function otpGenerator() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        }
        const otp = otpGenerator()
        const expiresAt = Date.now() + 3 * 60 * 1000

        const userFound = await usermodel.findOneAndUpdate(
            { email: email }, { otp: otp, expiresAt: expiresAt }, { upsert: true })
        if (!userFound) {
            return res.send("user not found")
        }


        // send to mail 
        const transpoter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'getupsignin@gmail.com',
                pass: 'xoep evgg bbkm pfsa'
            }
        });

        async function sendOTPEmail(clientEmail, otp) {
            const mailOptions = {
                from: 'getupsignin@gmail.com',
                to: clientEmail,
                subject: 'your otp code',
                text: `your OTP code is ${otp} .it will expire in 3 minutes`

            };
            try {
                await transpoter.sendMail(mailOptions);
                console.log("otp send to the client email");

            }
            catch (error) {
                console.log('Err sending otp  to the email');

            }

        }

        sendOTPEmail(email, otp)
        res.redirect('/user/getotp')
    }
    catch {

    }
}




export const postOtp = async (req, res) => {
    try {

        async function verifyOtp(userOtp, storedOtp, expiresAt) {

            const currentTime = Date.now()
            if (currentTime > expiresAt) {
                console.log("expired otp");
                res.status(400).json({
                    message: 'otp expired'
                })

            }

            else if (userOtp == storedOtp) {
                console.log("valid otp");
                const vali = await usermodel.findOneAndUpdate({ email: email }, { verified: true })
                res.status(200).json({
                    message: 'otp validated true'
                })


            } else {
                console.log("invalid otp");
                res.status(400).json({
                    message: 'Wrong OTP enterd'
                })
            }

        }
        const { userEntedOtp } = req.body
        // const userOtp=Number([num1,num2,num3,num4,num5,num6].join(""))
        // console.log(userOtp);
        console.log("this is postotp");
        const email = req.session.userEmail
        console.log(userEntedOtp);
        console.log(email);

        const user = await usermodel.findOne({ email: email })
        console.log(user);

        const storedOtp = user.otp
        console.log(user.otp);
        const expiresAt = user.expiresAt
        verifyOtp(userEntedOtp, storedOtp, expiresAt)
    }
    catch {

    }

}




//forgotpassword
export const forgotpassword = (req, res) => {
    res.render("user/forgotpassword",)
}

export const postForgotpassword = async (req, res) => {
    try {


        const { email } = req.body
        req.session.userEmail = email

        console.log(req.body);
        console.log(email);

        console.log("this is postmail");


        function otpGenerator() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        }
        const otp = otpGenerator()
        const expiresAt = Date.now() + 3 * 60 * 1000

        const userFound = await usermodel.findOneAndUpdate(
            { email: email }, { otp: otp, expiresAt: expiresAt }, { upsert: true })
        if (!userFound) {
            return res.send("user not found")
        }


        // send to mail 
        const transpoter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'getupsignin@gmail.com',
                pass: 'xoep evgg bbkm pfsa'
            }
        });

        async function sendOTPEmail(clientEmail, otp) {
            const mailOptions = {
                from: 'getupsignin@gmail.com',
                to: clientEmail,
                subject: 'your otp code',
                text: `your OTP code is ${otp} .it will expire in 3 minutes`

            };
            try {
                await transpoter.sendMail(mailOptions);
                console.log("otp send to the client email");

            }
            catch (error) {
                console.log('Err sending otp  to the email');

            }

        }

        sendOTPEmail(email, otp)
        res.redirect('/user/resetPassword')
    }
    catch {

    }
}

export const resetPassword = (req, res) => {
    const email = req.session.userEmail
    res.render('user/resetPassword', { email })
}

export const changePassword = (req, res) => {
    res.render('user/changePassword')
}

export const passwordUpdate = async (req, res) => {
    try {

        const { userPasswordInput } = req.body
        console.log(userPasswordInput);
        let email = req.session.userEmail  // THIS IS FOR WHEN I USING FORGOTPASSWORD SESSION created in otp send route - mailforotp
        if (!email) {                        // THIS IS FOR CHANGE PASSWORD THE EMAIL GETTING FROM THE TOKEN
            const token = req.cookies.token
            if (token) {
                jwt.verify(token, secretKey, (err, data) => {
                    email = data.email
                })
            }
        }
        console.log(email);
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userPasswordInput, saltRounds)

        const user = await usermodel.findOneAndUpdate({ email: email }, { password: hashedPassword })
        console.log(user);

        // Simple alert
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch {

    }

}

export const allProducts = async (req, res) => {
    try {
        // Get page and limit from query parameters, set default values if not provided
        const page = parseInt(req.query.page) || 1;  // Current page, default is 1
        const limit = parseInt(req.query.limit) || 15; // Number of items per page, default is 10

        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;




        // const products = await productModel.find().skip(skip).limit(limit)




        console.log(req.query)
        let products
        let filters = []
        let query = { block: false, stock: { $gt: 0 } }
        let sort = {}
        let categories = []
        if (req.query.men == 'true') {
            console.log("mens");

            filters.push('mens')
            categories.push('mens')
        }
        if ((req.query.women) === 'true') {
            console.log("women32");

            filters.push('womens')
            categories.push('Womens')
        }
        if ((req.query.kids) === "true") {
            console.log("kids");
            filters.push('kids')
            categories.push("kids")
        }

        if (categories.length > 0) {
            query.category = { $in: categories }
        }
        console.log(filters);
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
            console.log(req.query.search);
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









        ///JWT token checking
        const token = req.cookies.token
        const secretKey = process.env.SECRET_KEY
        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                if (err) {
                    res.render('user/allProducts', {
                        products, totalPages: Math.ceil(totalProducts / limit),
                        currentPage: page,
                        limit: limit, user: false, filters
                    })
                }
                else {

                    const user = await usermodel.findOne({ email: data.email })
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {
                        res.render('user/allProducts', {

                            products, totalPages: Math.ceil(totalProducts / limit),
                            currentPage: page,
                            limit: limit, user: user, filters
                        })
                    }
                }
            })
        } else {
            res.render('user/allProducts', {
                products, totalPages: Math.ceil(totalProducts / limit),
                currentPage: page,
                limit: limit, user: false, filters
            })
        }
    }
    catch {

    }



}


export const productView = async (req, res) => {
    try {

        const id = req.params.id

        const product = await productModel.findById(id)
        const categories = product.category
        // console.log(product.category);
        const products = await productModel.find({ category: categories }).limit(6)
        // console.log(products);
        ///JWT token checking
        const token = req.cookies.token
        const secretKey = process.env.SECRET_KEY

        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                if (err) {
                    res.render('user/productView', { product, products, user: false })
                }
                else {
                    const user = await usermodel.findOne({ email: data.email })
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {

                        console.log(data);
                        const userData = await usermodel.findOne({ email: data.email })
                        const userCart = await cartModel.findOne({ userId: userData._id, 'products.productId': id })
                        console.log(userCart);

                        res.render('user/productView', { product, products, user: data })
                    }
                }

            })
        } else {
            res.render('user/productView', { product, products, user: false })
        }
    }
    catch {

    }
}



export const editProfile = async (req, res) => {
    try {

        const user = req.userData
        const dataBase = await usermodel.findOne({ email: req.userData.email })
        console.log(req.userData.email);

        res.render('user/editProfile', { user, dataBase })
    }
    catch {
        const user = req.userData
        res.render('user/editProfile', { user, dataBase: null })

    }
}




export const patchEditProfile = async (req, res) => {
    try {

        let { name, email, phone, dob, altPhone, gender } = req.body
        console.log(gender + "s");

        console.log(name, email, phone, dob, altPhone, gender);
        await usermodel.updateOne({ email: email }, { name: name })
        if (phone) {
            console.log("phone");

            await usermodel.updateOne({ email: email }, { phone })
        }
        if (dob) {
            await usermodel.updateOne({ email: email }, { dob })
        }
        if (altPhone) {

            await usermodel.updateOne({ email: email }, { alternativePhone: altPhone })
        }
        if (gender) {
            console.log("working");
            console.log(gender);
            const user = await usermodel.updateOne({ email: email }, { gender })
        }
        res.json({ message: 'successfully updated profile' })
    }
    catch {
        res.status.json({ message: "error in update profile" })
    }
}



export const showAddress = async (req, res) => {
    const user = req.userData
    const dataBase = await usermodel.findOne({ email: req.userData.email })
    res.render('user/address', { user, dataBase })

}


export const addAddress = async (req, res) => {
    try {

        const user = req.userData
        const dataBase = await usermodel.findOne({ email: req.userData.email })
        console.log(req.userData.email);

        res.render('user/addAddress', { user, dataBase })
    }
    catch {

    }
}


export const postAddAddress = async (req, res) => {
    try {
        const user = req.userData
        const { name, phone, pincode, state, locality, city, address, typeofAddress } = req.body
        console.log(name, phone, pincode, state, locality, city, address, typeofAddress);
        const addressData = {
            name, phone, pincode, state, locality, city, address, addressType: typeofAddress
        }

        const data = await usermodel.findOneAndUpdate({ email: req.userData.email }, { $push: { address: addressData } }, { new: true })
        if (data) {
            res.json({ message: "address updated" })
        }

    }
    catch {
        res.status(400).json({ message: "error in adding address" })
    }
}



export const deleteAddress = async (req, res) => {
    try {
        const user = req.userData
        const { addressId } = req.body
        console.log(addressId);

        const data = await usermodel.findOneAndUpdate({ email: req.userData.email }, { $pull: { address: { _id: addressId } } })
        res.json({
            message: "delete Address"

        })
    }

    catch {

    }
}


export const editAddress = async (req, res) => {
    try {

        const addressID = req.params.addressID
        console.log(addressID);
        const user = req.userData
        let dataBase = await usermodel.aggregate([
            { $match: { email: req.userData.email } },
            { $unwind: '$address' },
            { $match: { 'address._id': new mongoose.Types.ObjectId(addressID) } }, { $project: { address: 1 } }
        ]);
        dataBase = dataBase[0]
        console.log(dataBase);
        res.render('user/editAddress', { user, dataBase })
    }
    catch {

    }
}


export const patchAddAddress = async (req, res) => {
    try {

        const { name, phone, pincode, state, locality, city, address, typeofAddress, addressID } = req.body
        const user = req.userData
        const data = await usermodel.findOneAndUpdate({
            email: user.email,
            'address._id': new mongoose.Types.ObjectId(addressID)
        },
            {
                $set: {
                    'address.$.name': name,
                    'address.$.phone': phone,
                    'address.$.pincode': pincode,
                    'address.$.state': state,
                    'address.$.locality': locality,
                    'address.$.city': city,
                    'address.$.addressType': typeofAddress
                },
            },
            { new: true }

        )
        console.log(data);

        res.json({
            messsae: "success"
        })
    }
    catch {

    }

}



export const addToCart = async (req, res) => {
    try {

        const jwtUser = req.userData
        const userData = await usermodel.findOne({ email: jwtUser.email })
        const { productId, selectSize } = req.body
        console.log(selectSize);
        //    console.log(userData);
        const userCart = await cartModel.findOne({ userId: userData._id })
        //if user cart is not there creating

        if (!userCart) {
            console.log("thre is no user cart");

            const model = new cartModel({
                userId: userData._id,
                products: [{ productId, quantity: 1, size: selectSize }]
            })
            await model.save()
            return res.status(201).json({ message: "new cart created" })
        }
        // else {
        //     await cartModel.findOneAndUpdate({
        //         userId: userData._id,
        //         'products.productId': productId
        //     },
        //         { $inc:{'products.$.quantity':1}
        //     })

        // }

        else {
            console.log("user cart is exit");
            console.log(userData._id);

            const model = await cartModel.findOne({ userId: userData._id })
            const productIndex = model.products.findIndex(item => item.productId == productId)
            console.log(productIndex);

            if (productIndex == -1) {
                console.log("product creating");
                const product = await cartModel.findOneAndUpdate({ userId: userData._id },
                    {
                        $addToSet: {
                            products: {
                                productId, quantity: 1, size: selectSize
                            }
                        }
                    }, { new: true }
                )
                return res.status(201).json({ message: "new product added to the cart" })
            } else {
                return res.status(409).json({ message: "already added" })
            }
        }
    }

    catch {
        return res.status(409).json({ message: "Something went wrong please try again " })
    }
}


export const showCart = async (req, res) => {
    try {

        const user = req.userData
        const userData = await usermodel.findOne({ email: user.email })
        // const cart = await cartModel.findOne({ userId: userData._id }).populate('products.productId')
        const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount=0
        let total=0
        if (cart) {
            if(cart.products.length==0){
                await cartModel.findOneAndUpdate({ userId: userData._id },{couponDiscount:0})
                
            }
            const products = cart.products.forEach(product => {
                totalPrice += product.productId.price * product.quantity
            })
            cart.products.forEach(product => {
                discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
            })
            shippingFee = totalPrice < 500 ? 40 : 0
            shippingFee = totalPrice == 0 ? 0 : shippingFee
            couponDiscount=(cart.couponDiscount).toFixed(2)
            total=((totalPrice-discountPrice)+shippingFee).toFixed(2)
            total=total-couponDiscount
            discountPrice.toFixed(2)
            const coupon=await couponModel.find({block:false})
            console.log(coupon);
            
            res.render('user/showCart', { user, cart, totalPrice,total, discountPrice, shippingFee ,couponDiscount,coupon})
        } else {
            console.log("ShowCart");
            const coupon=await couponModel.find({block:false})

            res.render('user/showCart', { user, cart, totalPrice,total, discountPrice, shippingFee,couponDiscount,coupon })

        }

    }
    catch(err) {
        console.log(err);
        
    }

}



export const updateQuantity = async (req, res) => {
    try {
        console.log(req.body);

        const jwtUser = req.userData
        const userData = await usermodel.findOne({ email: jwtUser.email })
        const { productId, action, value } = req.body


        // const cart = await cartModel.findOne({ userId: userData._id }).populate('products.productId')
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount=0
        let total=0
        async function newCart() {
            const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
            if (cart) {
                const products = cart.products.forEach(product => {
                    totalPrice += product.productId.price * product.quantity
                })
                cart.products.forEach(product => {
                    discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
                })
                shippingFee = totalPrice < 500 ? 40 : 0
                shippingFee = totalPrice == 0 ? 0 : shippingFee
                couponDiscount=(cart.couponDiscount).toFixed(2)
                total=((totalPrice-discountPrice)+shippingFee).toFixed(2)
                total=total-couponDiscount
                discountPrice.toFixed(2)

            }


        }

        if (action === "quantityAdding") {
            console.log(value);

            const productDetails = await productModel.findOne({ _id: productId })
            if (productDetails.stock <= value) {
                console.log("err");
                res.status(409).json({ message: "The product is currently out of stock! You can't add any more to the quantity" })
            }
            else {
                const cart = await cartModel.findOneAndUpdate({
                    userId: userData._id, 'products.productId': productId
                }, { $inc: { 'products.$.quantity': 1 } }, { new: true })
                const productDetails = await productModel.findOne({ _id: productId })
                console.log(productDetails);
                const productPrice = productDetails.price
                const productDiscountPrice = productPrice - (productPrice * (productDetails.discount / 100))
                console.log(productPrice, productDiscountPrice);

                await newCart()

                res.json({ totalPrice,total, shippingFee, discountPrice, productPrice, productDiscountPrice})
            }


        }
        else if (action === "quantityDecreasing") {
            await cartModel.findOneAndUpdate({
                userId: userData._id, 'products.productId': productId
            },
                { $inc: { 'products.$.quantity': -1 } })
            const productDetails = await productModel.findOne({ _id: productId })
            console.log(productDetails);
            const productPrice = productDetails.price
            const productDiscountPrice = productPrice - (productPrice * (productDetails.discount / 100))
            console.log(productPrice, productDiscountPrice);

            await newCart()
            res.json({ totalPrice,total, shippingFee, discountPrice, productPrice, productDiscountPrice })



        }
        else if (action === "selectSize") {
            await cartModel.findOneAndUpdate({
                userId: userData._id, 'products.productId': productId
            },
                { $set: { "products.$.size": value } })
            res.json({
                message: "size changed"
            })
        }
        else if (action === "delete") {
            await cartModel.findOneAndUpdate({
                userId: userData._id
            },
                { $pull: { products: { productId: productId } } })
            res.json({
                message: "product deleted"
            })
        }
    }

    catch {
        res.status(500).json({ message: "server error" })
    }

}


export const checkOutStep1 = async (req, res) => {
    try {

        const user = req.userData
        const userData = await usermodel.findOne({ email: user.email })
        // const cart = await cartModel.findOne({ userId: userData._id }).populate('products.productId')
        const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount=0
        let total=0

        const products = cart.products.forEach(product => {
            totalPrice += product.productId.price * product.quantity
        })
        cart.products.forEach(product => {
            discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
        })
        shippingFee = totalPrice < 500 ? 40 : 0
        shippingFee = totalPrice == 0 ? 0 : shippingFee
         couponDiscount=(cart.couponDiscount).toFixed(2)
                total=((totalPrice-discountPrice)+shippingFee).toFixed(2)
                total=total-couponDiscount
                discountPrice.toFixed(2)
        //address
        const dataBase = await usermodel.findOne({ email: user.email })
        console.log(dataBase);

        res.render("user/checkOutStep1", { user, cart, total,totalPrice,couponDiscount, discountPrice, shippingFee, dataBase })
    }
    catch {

    }
}


export const postCheckOutStep1 = async (req, res) => {
    try {
        const jwtUser = req.userData
        const { addressID } = req.body


        let data = await usermodel.findOne({ email: jwtUser.email, 'address._id': addressID }, { 'address.$': 1 })
        //     const address = data.address[0]
        //     const userID=data._id
        //     const orderID=order._id

        res.json({ addressID })
    } catch {

    }

}


export const cartSummary = async (req, res) => {
    try {

        const addressID = req.params.addressID
        console.log(addressID);
        const user = req.userData
        const userData = await usermodel.findOne({ email: user.email })
        // const cart = await cartModel.findOne({ userId: userData._id }).populate('products.productId')
        const cart = await cartModel.findOne({ userId: userData._id }).populate({ path: 'products.productId', model: 'product' })
        let totalPrice = 0
        let shippingFee = 0
        let discountPrice = 0
        let couponDiscount=0
        let total=0
        const products = cart.products.forEach(product => {
            totalPrice += product.productId.price * product.quantity
        })
        cart.products.forEach(product => {
            discountPrice += (product.productId.price * product.quantity) * ((product.productId.discount) / 100)
        })
        shippingFee = totalPrice < 500 ? 40 : 0
        shippingFee = totalPrice == 0 ? 0 : shippingFee
        couponDiscount=(cart.couponDiscount).toFixed(2)
        total=((totalPrice-discountPrice)+shippingFee).toFixed(2)
        total=total-couponDiscount
        discountPrice.toFixed(2)
        res.render("user/orderSummary", { user,total,couponDiscount, cart, totalPrice, discountPrice, shippingFee, addressID })
    }
    catch {

    }

}

export const selectPayment = (req, res) => {
    try {
        const addressID = req.params.addressID
        console.log(addressID);

        const user = req.userData
        res.render("user/selectPayment", { user, addressID })
    }
    catch {
        res.render("user/home", { user: false })
    }
}

export const orderUpdate = async (req, res) => {
    try {
        const { addressID, orderType } = req.body
        const jwtUser = req.userData
        const address = await usermodel.findOne({ email: jwtUser.email, 'address._id': addressID }, { 'address.$': 1 })
        const user = await usermodel.findOne({ email: jwtUser.email })
        const userID = address._id
        const addressDatas = address.address[0]
        const cart = await cartModel.findOne({ userId: userID }).populate({ path: 'products.productId', model: productModel })
        let productArray = []
        let totalOrderPrice = 0;
        let shippingFee=0
        let discountedPrice=0
        let productCoupon=(cart.couponDiscount)/((cart.products).length)
        if (cart.products) {
            cart.products.forEach(async product => {
                totalOrderPrice += Number(((product.productId.price) - ((product.productId.price) * (product.productId.discount / 100))).toFixed(2)) * product.quantity
               let discountedPrice=((product.productId.price) - ((product.productId.price) * (product.productId.discount / 100))).toFixed(2)
                  
                const data = {
                    product: product.productId._id,
                    quantity: product.quantity,
                    price: product.productId.price,
                    discountedPrice:discountedPrice,
                    paymentMode: orderType,
                    orderStatus: "processing",
                    color: product.productId.color[0],
                    size: product.size,
                    couponAdded:productCoupon,
                    totalPay:((discountedPrice)*( product.quantity))-productCoupon
                }
      
                
                // console.log("stock:" + product.productId.stock);
                const newStock = (product.productId.stock) - (product.quantity)
                productArray.push(data)
                await productModel.findOneAndUpdate({ _id: product.productId._id }, { $set: { stock: newStock } })
            })
            totalOrderPrice < 500 ? shippingFee=40 :shippingFee=0
            const order = new orderModel({
                user: userID,
                shippingAddress: {
                    address: addressDatas.name,
                    phone: addressDatas.phone,
                    pincode: addressDatas.pincode,
                    state: addressDatas.state,
                    locality: addressDatas.locality,
                    city: addressDatas.city,
                },
                products: productArray,
                shippingFee:shippingFee
            })
            const orderId = order._id
            await order.save()

            totalOrderPrice+=shippingFee
            console.log(shippingFee);
            totalOrderPrice=totalOrderPrice.toFixed(2)
            ////Response to cod
            if (orderType == 'cod') {
                console.log(orderType);
                // await order.update({"products."})
                const update = await cartModel.deleteOne({ userId: userID })  //delete user cart
                res.status(201).json({ orderId: orderId, message: "order created", orderType, user,totalOrderPrice })
            }

            /////Responsee to razorpay
            else if (orderType == 'razorpay') {
                console.log("json send to the axos");

                console.log(totalOrderPrice);
                console.log(discountedPrice);

                const orderOptions = {
                    amount: ((totalOrderPrice)-(cart.couponDiscount))* 100,  // Amount is in smallest currency unit (50000 paise = ₹500)
                    currency: "INR",
                    receipt: "order_rcptid_11",
                    payment_capture: '1' // Auto-capture the payment
                };
                razorpayInstance.orders.create(orderOptions, async (err, order) => {
                    console.log("creating instance");

                    if (err) {
                        console.error("Error in creating order:", err);
                        res.status(500).send('Something went wrong');
                    } else {
                        console.log(order);
                        const update = await cartModel.deleteOne({ userId: userID })   //delete user cart

                        res.json({
                            razorpayOrderId: order.id,  // Send order.id to frontend
                            amount: order.amount,  // Send amount to frontend
                            currency: order.currency, // Send currency
                            orderType: orderType,
                            orderId: orderId,
                            totalOrderPrice,
                            user,
                            RAZORPAY_KEY_ID
                        });
                    }
                });
            }
            //wallet
            else if (orderType == 'wallet') {
                console.log(orderType);
                const update = await cartModel.deleteOne({ userId: userID })   //delete user cart
                const userId = await usermodel.findOne({ email: user.email }, { _id: 1 })
                // const wallet = await walletModel.findOne({ userId: userId._id })
                const wallectCheck = await walletModel.findOneAndUpdate({ userId: userId._id })
                if(wallectCheck.balance > totalOrderPrice){
                const wallet = await walletModel.findOneAndUpdate({ userId: userId._id },{ $inc: { balance:-(totalOrderPrice-(cart.couponDiscount))}, $push: {
                    transactions: {
                        wallectAmount: (totalOrderPrice-(cart.couponDiscount)),
                        orderId: orderId,
                        trasactionType: "debited",
                        trasactionsDate: new Date()
                }}},{new:true})
            console.log(order._id);
                
             const updateorder=   await orderModel.findOneAndUpdate({_id:order._id},{$set:{"products.$[].paymentStatus":"paid"}},{new:true})
             console.log(updateorder);
             
            
                res.status(201).json({ orderId: orderId, message: "order created", orderType, user })
            }
            else{
                await orderModel.findOneAndUpdate({_id:order._id},{$set:{"products.$[].paymentStatus":"failed"}})

                res.status(404).json({message:"Insufficient wallet balance to complete the order",status:"noBalance"})
            }
            }

        } else {
            res.status(404).json({ message: "there is no product in the cart" })
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ message: "there is no product in the cart" })

    }




    // const order=await orderModel.findByIdAndUpdate({_id:addressID},{})
    // // console.log(order);
    // const userID=order.user
    // // const products=cart.products
    // const cart=await cartModel.findOne({userId:userID}).populate({path:'products.productId',model:productModel})
    // // console.log(cart);

}


export const orderSuccess = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const user = req.userData
        const orderDetails = await orderModel.find({ _id: orderId })
        const products = orderDetails[0].products

        const order = orderDetails[0]
        console.log(order);

        res.render("user/orderSuccess", { user, orderId, products, order })
    }
    catch {

    }

}

export const showOrders = async (req, res) => {
    try {
        // Get page and limit from query parameters, set default values if not provided
const page = parseInt(req.query.page) || 1;  // Current page, default is 1
const limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10

// Calculate the number of documents to skip
const skip = (page - 1) * limit;
const orderData2=  await orderModel.find({})
let totalPages=0
orderData2.forEach(userOrders=>{           
     totalPages+= userOrders.products.length  
  })
  console.log(totalPages);
  
        const user = req.userData
        const userData = await usermodel.find({ email: user.email })
        const userId = userData[0]._id
        const orderData = await orderModel.find({ user: userId }).sort({ createdAt: -1 }).populate({ path: 'products.product', model: productModel }).skip(skip).limit(limit)   
        console.log(orderData[0]);
        res.render("user/showOrders", { user, orderData ,totalPages:totalPages/limit,
            currentPage: page,
            limit: limit})
    } catch {

    }
}


export const orderCancel = async (req, res) => {
    try {
        const user = req.userData
        const userData = await usermodel.find({ email: user.email })
        const userId = userData[0]._id
        console.log(userId);
        const { product_id } = req.body
        console.log(product_id);
       const order= await orderModel.findOne({ user: userId, 'products._id': product_id },{'products.$':1})
       const ship= await orderModel.findOne({ user: userId,'products._id': product_id })
       console.log(order.products[0].paymentStatus);
       console.log(ship.shippingFee);
       const RefundRupee=(((order.products[0].discountedPrice)*(order.products[0].quantity))-order.products[0].couponAdded)+ship.shippingFee
       
       //if paid refund
       if(order.products[0].paymentStatus=="paid"){
        await walletModel.findOneAndUpdate({ userId: userId }, {
            $inc: { balance: RefundRupee }, $push: {
                transactions: {
                    wallectAmount: RefundRupee,
                    orderId: order._id,
                    trasactionType: "creditd",
                    trasactionsDate: new Date()
                }
            }
        })
   await orderModel.findOneAndUpdate({ 'products._id': product_id }, { 'products.$.paymentStatus': "refunded" })
       }
        const update = await orderModel.findOneAndUpdate({ user: userId, 'products._id': product_id }, { 'products.$.orderStatus': 'cancelled' })
        res.json({ message: 'updated' })
    }
    catch(err) {
        console.log(err);
        
        res.status(409).json({ message: "err" })
    }


}

export const returnOrder = async (req, res) => {
    try {
        console.log("return");

        const user = req.userData
        const userData = await usermodel.find({ email: user.email })
        const userId = userData[0]._id

        const { text, product_id } = req.body
        const update = await orderModel.findOneAndUpdate({ user: userId, 'products._id': product_id }, { 'products.$.returnStatus': 'requested', 'products.$.returnReason': text }, { new: true })
        console.log(update);
        res.json({ message: "order retured" })

    }
    catch {
        console.log("catch");

    }
}

export const paymentVerificaton = async (req, res) => {
    try{

    const user = req.userData
    const userData = await usermodel.find({ email: user.email })
    const userId = userData[0]._id
    const { order_id, payment_id, signature, orderId } = req.body;
    console.log("verification");
    const hmac = createHmac('sha256', 'Oj8C7Cc4ETqAjrLRfwlN3LUF');
    hmac.update(order_id + "|" + payment_id);
    const generated_signature = hmac.digest('hex');
    if (generated_signature === signature) {
        // Payment verification successful

        // database to mark the order as 'Paid
        const update = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { 'products.$[].paymentStatus': 'paid' } }, { new: true })
        //   console.log(update);

        console.log('Payment verified successfully!');

        // Send success response to frontend
        res.json({ status: 'success', message: 'Payment verified and updated in database.', orderId });
    } else {
        // Payment verification failed
        console.error('Payment verification failed.');
        res.json({ status: 'failure', message: 'Payment verification failed.' });
    }
}
catch{

}

}


export const wallet = async (req, res) => {
    try{

    const user = req.userData
    const userId = await usermodel.findOne({ email: user.email }, { _id: 1 })
    const wallet = await walletModel.findOne({ userId: userId._id })


    res.render("user/wallet", { user, wallet })
}
catch{

}
}
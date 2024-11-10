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




export const home = async (req, res) => {
    try {
        const products = await productModel.find({ block: false }).sort({ _id: -1 }).limit(10)

        const token = req.cookies.token
        const secretKey = process.env.SECRET_KEY
        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                if (err) {
                    let wishlistProduct=[]
                    res.render('user/home', { products, user: false ,wishlistProduct})
                }
                else {
                    const user = await usermodel.findOne({ email: data.email })
                    console.log(user);
                    
                    const wishlist= await wishlistModel.find({userId:user._id})
                    var wishlistProduct
                    console.log(wishlist,"wishlist");
                    
                    if(wishlist.length>=1){
                        
                        wishlistProduct=wishlist[0].products.length>=1 ? wishlist[0].products : []
                    }
                    else{
                            wishlistProduct=[]
                        }
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {
                        console.log("include wishlist");
                        console.log(wishlistProduct);
                        
                        res.render('user/home', { products, user: user,wishlistProduct })
                    }
                }
            })
        } else {
            let wishlistProduct=[]
            res.render('user/home', { products, user: false ,wishlistProduct})
        }
    }
    catch (err){
        console.log(err);
        
        res.render("user/500")

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
                    console.log(user);
                    
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
        res.render("user/500")

    }
}



export const signUp = async (req, res) => {
try{
    res.render('user/signup')
}catch(err){
    res.render("user/500")

}
}




export const logout = (req, res) => {
try{
    res.clearCookie('token');
    req.session.destroy()
    res.redirect('/user/login')
}catch(err){
    res.render("user/500")

}
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
        res.render("user/500")

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
        res.render("user/500")

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
        res.render("user/500")

    }

}

export const allProducts = async (req, res) => {
    try {

        let ans=await productModel.find({})
        // console.log(ans);
        let userd=await usermodel.find({})
        // console.log(userd);
        
        // Get page and limit from query parameters, set default values if not provided
        const page = parseInt(req.query.page) || 1;  // Current page, default is 1
        const limit = parseInt(req.query.limit) || 15; // Number of items per page, default is 10

        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;
        // console.log(req.query)
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
            // console.log(req.query.search);
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
                  
                     wishlistProduct=[]  //solve this err
                    res.render('user/allProducts', {
                        products, totalPages: Math.ceil(totalProducts / limit),
                        currentPage: page,
                        limit: limit, user: false, filters,wishlistProduct
                    })
                }
                else {

                    const user = await usermodel.findOne({ email: data.email })
                    const wishlist= await wishlistModel.find({userId:user._id})
                    var wishlistProduct
                if(wishlist.length>=1){
                        wishlistProduct=wishlist[0].products.length>=1 ? wishlist[0].products : []
                     }
                        else{
                            wishlistProduct=[]
                        }
            console.log(wishlistProduct);
            
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {
                        console.log("ser");
                        

                        res.render('user/allProducts', {

                            products, totalPages: Math.ceil(totalProducts / limit),
                            currentPage: page,
                            limit: limit, user: user, filters,wishlistProduct
                        })
                    }
                }
            })
        } else {
        let wishlistProduct=[]
        console.log("noproduct");
        
            res.render('user/allProducts', {
                products, totalPages: Math.ceil(totalProducts / limit),
                currentPage: page,
                limit: limit, user: false, filters,wishlistProduct
            })
        }
    }
    catch(err) {
console.log(err);
res.render("user/500")

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
        const offer=await offerModel.find({'offer.offerGive':id})
        console.log(offer);
        
        if (token) {
            jwt.verify(token, secretKey, async (err, data) => {
                wishlistProduct=[]
                if (err) {
                    res.render('user/productView', { product, products, user: false,offer , wishlistProduct})
                }
                else {
                    const user = await usermodel.findOne({ email: data.email })
                    const wishlist= await wishlistModel.find({userId:user._id})
                    var wishlistProduct
                if(wishlist.length>=1){
                    console.log("pro");
                        wishlistProduct=wishlist[0].products.length>=1 ? wishlist[0].products : []
                     }
                        else{
                            
                            wishlistProduct=[]
                        }
                    
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {

                        console.log(wishlistProduct);
                        const userData = await usermodel.findOne({ email: data.email })
                        const userCart = await cartModel.findOne({ userId: userData._id, 'products.productId': id })
        

                        res.render('user/productView', { product, products, user: data,offer ,wishlistProduct})
                    }
                }

            })
        } else {
            res.render('user/productView', { product, products, user: false,offer})
        }
    }
    catch {
        res.render("user/500")

    }
}











export const wallet = async (req, res) => {
    try {

        const user = req.userData
        const userId = await usermodel.findOne({ email: user.email }, { _id: 1 })
        let  wallet = await walletModel.findOne({ userId: userId._id })
        console.log(wallet);
        
        if(!wallet){
             let  walletSave= new  walletModel({
                    userId:userId._id
                })
               await walletSave.save()
       return res.render("user/wallet", { user, wallet:walletSave })

        }


        res.render("user/wallet", { user, wallet })
    }
    catch(err) {
console.log(err);
res.render("user/500")

    }
}
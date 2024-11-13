import adminmodel from "../models/adminModel.js";
import usermodel from "../models/userModel.js";
import categoryModel from "../models/categorySchema.js";
import productModel from "../models/productSchema.js";
import orderModel from "../models/orderSchema.js";
import walletModel from "../models/walletModel.js";
import jwt from 'jsonwebtoken'

const secretKey = process.env.SECRET_KEY

export const login = (req, res) => {
    try{
        const token=req.cookies.adminToken
      if(!token){
   res.render('admin/login')       
   }else{
       jwt.verify(token,secretKey,async(err,data)=>{
   
           if(err){
           res.render('admin/login')
           }
           else{
            const users = await usermodel.find()
            res.render('admin/home', { users })
           }
       })
   }
   }
   catch{
       
   }

}

export const postLogin = async (req, res) => {
    const { email, password ,rememberMe} = req.body
    console.log(req.body);
    
    const expiresIn = rememberMe ? '7d' : '1d'
   const expireCookie= rememberMe ? 7 * 24 * 60 * 60 :1* 24 * 60 * 60;
console.log(expireCookie);

    const data = await adminmodel.findOne({ email: email, password: password })
    console.log(data);
    
    console.log(data);
    if(data){
        const token = jwt.sign({ email: data.email, name: data.name }, secretKey, { expiresIn })
         
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // Only set cookie over HTTPS in production
            maxAge:expireCookie,
            sameSite: 'Strict'
        })
        res.json({
            message: 'Login Successful',
            token: token
        })
        // res.redirect('/admin/home')
    }else{
        res.status(409).json({
            message: 'login Failed',
        })
    }

}


export const logout=(req,res)=>{
    res.clearCookie('adminToken');
    res.redirect('/admin/login')

}


export const home = async (req, res) => {
    const users = await usermodel.find()
    // console.log(users);


    res.render('admin/home', { users })
}


export const blockUser = async (req, res) => {
    try {

        const { email } = req.body
        console.log(email);
        const sucess = await usermodel.findOne({ email })
        if (sucess.blocked) {
            await usermodel.findOneAndUpdate({ email }, { blocked: false })
            res.json({ message: sucess })
        } else {
            await usermodel.findOneAndUpdate({ email }, { blocked: true })
            res.json({ message: sucess })

        }
    }
    catch {

    }
}

export const productList = async (req, res) => {
    try {

        // Get page and limit from query parameters, set default values if not provided
        const page = parseInt(req.query.page) || 1;  // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10

        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Fetch the total number of products for calculating the total pages
        const totalProducts = await productModel.countDocuments();



        const products = await productModel.find().skip(skip).limit(limit)
        const route = "productList"
        res.render('admin/productList', {
            products, route, totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            limit: limit
        })
    }
    catch {

    }
}

export const addProduct = async (req, res) => {

    const categories = await categoryModel.find({ block: false })
    console.log(categories);


    res.render("admin/addProduct", { categories })
}



export const category = async (req, res) => {
    try {
        // Get page and limit from query parameters, set default values if not provided
        const page = parseInt(req.query.page) || 1;  // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10

        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Fetch the total number of categories for calculating the total pages
        const totalCategories = await categoryModel.countDocuments();

        // Fetch the paginated categories
        const categories = await categoryModel.find().skip(skip).limit(limit)


        // Send the paginated data with total categories and current page info
        res.render('admin/category', {
            categories: categories,
            totalPages: Math.ceil(totalCategories / limit),
            currentPage: page,
            limit: limit
        })

    } catch (err) {
        res.status(500).json({ message: "Error fetching categories", error: err });
    }


}

export const addCategory = (req, res) => {
    res.render('admin/addCategory')
}


export const postAddCategory = async (req, res) => {
    try {

        const { categoryName } = req.body
        const category = await categoryModel.findOne({ categoryName: categoryName })
        console.log(category);

        if (!category) {
            console.log(category);
            const newCategory = new categoryModel({
                categoryName: categoryName
            })
            await newCategory.save()
        }


        res.json({ message: 'category added' })
    }
    catch {
        res.status(409).json({ message: "err" })
    }
}

export const blockCategory = async (req, res) => {
    try {

        const { category } = req.body
        console.log(category);
        const sucess = await categoryModel.findOne({ categoryName: category })
        console.log(sucess);

        if (sucess.block) {
            await categoryModel.findOneAndUpdate({ categoryName: category }, { block: false })
            res.json({ message: sucess })
        } else {
            await categoryModel.findOneAndUpdate({ categoryName: category }, { block: true })
            res.json({ message: sucess })

        }
    }
    catch {

    }
}


export const editCategory = (req, res) => {
    const category = req.params.category
    req.session.category = category
    res.render('admin/editCategory', { category })

}

export const postEditCategory = async (req, res) => {
    try {

        const oldCategory = req.session.category
        const { categoryName } = req.body
        console.log(categoryName);
        await categoryModel.findOneAndUpdate({ categoryName: oldCategory }, { categoryName: categoryName })
        console.log(oldCategory);
        res.json({
            message: 'Edited'
        })
    } catch {

    }

}








export const postUploadImage = async (req, res) => {
    try {
        // The uploaded image's URL is available in req.file.path
        const imageUrl = req.file.path;
        console.log(req.body.productId); // Check the productId being passed
        console.log(imageUrl);

        // /ait product.save();
        console.log("imaged saved in monogo");


        // Send success response to the frontend
        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.json({ success: false, message: 'Image upload failed' });
    }
}



export const postAddproduct = async (req, res) => {
    try {
        console.log("psot add product");
        
        const { productName, price, description, quantity, discount, stock, color, size, category, images } = req.body
        console.log(images + "images");
        console.log("postADDproduct");

        const product = new productModel({
            productName,
            price,
            description,
            quantity, discount,
            stock,
            color,
            size,
            category,
            images
        })
        await product.save()
        res.json({ message: "product added" })
        console.log(productName);
    } catch(err) {
console.log("err on adding product-postProduct",err);

    }

}



export const blockProduct = async (req, res) => {
try{
    const { productID } = req.body
    console.log(productID);

    const product = await productModel.findOne({ _id: productID, block: false })
    if (product) {
        await productModel.findOneAndUpdate({ _id: productID }, { block: true })
        res.json({ message: 'sucess' })

    } else {
        await productModel.findOneAndUpdate({ _id: productID }, { block: false })
        res.json({ message: 'sucess' })

    }
    console.log(product);
}catch(err){

}
}



export const editProduct = async (req, res) => {
    const productID = req.params.productID
    // console.log(productID);
    const products = await productModel.find({ _id: productID })
    const product = products[0]

    const categories = await categoryModel.find({ block: false })
    res.render('admin/editProduct', { categories, product })

}


export const postEditProduct = async (req, res) => {
    const { productID, productName, price, description, discount, stock, color, size, category, images } = req.body
    const update = await productModel.findByIdAndUpdate({ _id: productID }, {
        productName, price, description, discount, stock, color, size, category, images
    })
    console.log("PostEditProduct");

    res.json({
        message: "product_edited"
    })

}


export const searchProduct = async (req, res) => {
try{

    const { search } = req.body
    console.log(search);

    // Get page and limit from query parameters, set default values if not provided
    const page = parseInt(req.query.page) || 1;  // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch the total number of products for calculating the total pages
    const totalProducts = await productModel.find({ productName: { $regex: search, $options: 'i' } }).countDocuments();



    const products = await productModel.find({ productName: { $regex: search, $options: 'i' } }).skip(skip).limit(limit)
    console.log(products);
    const route = "searchProduct"
    res.render('admin/productList', {
        products, route, totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        limit: limit
    })
}catch(err){
    console.log(err);
    
}
}


export const orderList = async (req, res) => {
    try {

// Get page and limit from query parameters, set default values if not provided
const page = parseInt(req.query.page) || 1;  // Current page, default is 1
const limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10

// Calculate the number of documents to skip
const skip = (page - 1) * limit;

        const orderData = await orderModel.find({}).sort({ createdAt: -1 }).populate({ path: 'products.product', model: productModel }).skip(skip).limit(limit)
        console.log(orderData[0]);
        // res.render("user/showOrders", { user, orderData })
        let totalPages=0
      
      const orderData2=  await orderModel.find({})
      orderData2.forEach(userOrders=>{           
           totalPages+= userOrders.products.length  
        })
        console.log(totalPages);
        
        res.render('admin/orderList',{ orderData ,totalPages:totalPages/limit,
            currentPage: page,
            limit: limit})
    }
    catch(err) {
        console.log(err);
        
        res.status(409).json({ message: "err" })
    }



}


export const adminOrderUpdate = async (req, res) => {
    try {
        // console.log(req.body);
        const { status, product_id, returnStatus } = req.body
        const current= await orderModel.findOne({ 'products._id': product_id },{"products.$":1})
console.log(current.products[0].orderStatus=="cancelled");
        if(current.products[0].orderStatus!=="cancelled"){
            
            if (status) {
                if(status=="delivered"){
                    console.log("delivered");
                    const update = await orderModel.findOneAndUpdate({'products._id': product_id ,'products.paymentMode':"cod"}, { 'products.$.paymentStatus':"paid" })
                }
                const update = await orderModel.findOneAndUpdate({ 'products._id': product_id }, { 'products.$.orderStatus': status })
                return res.status(200).json({ message: "delivery address" })
            }
            console.log(status);
        const update = await orderModel.findOneAndUpdate({ 'products._id': product_id }, { 'products.$.returnStatus': returnStatus })
        res.status(200).json({ message: "delivery address" })
    }}
    catch(err) {
        console.log(err);
        
        res.status(409).json({ message: "err" })
    }

}

export const refund = async (req, res) => {
try{

    console.log(req.body);
    const { product_id, userOrders_id } = req.body
    const update = await orderModel.findOne({ 'products._id': product_id }, { 'products.$': 1 })
    const user = await orderModel.findOne({ 'products._id': product_id })
    // console.log(user.user);
    const userId = user.user

    // const RefundRupee = update.products[0].discountedPrice
    const RefundRupee =( (update.products[0].totalPay)* update.products[0].quantity)


    const wallet = await walletModel.findOne({ userId: userId })
    if (wallet) {
        console.log(wallet);
        await walletModel.findOneAndUpdate({ userId: userId }, {
            $inc: { balance: RefundRupee }, $push: {
                transactions: {
                    wallectAmount: RefundRupee,
                    orderId: userOrders_id,
                    trasactionType: "creditd",
                    trasactionsDate: new Date()
                }
            }
        })
        const update = await orderModel.findOneAndUpdate({ 'products._id': product_id }, { 'products.$.returnStatus': "refunded" })
        res.json({ message: "wallect updated" })

    } else {
        const walletCreate = new walletModel({
            userId: userId,
            balance: RefundRupee,
            transactions: [
                {
                    wallectAmount: RefundRupee,
                    orderId: userOrders_id,
                    trasactionType: "creditd",
                    trasactionsDate: new Date()

                }
            ]
        })
        await walletCreate.save()
        const update = await orderModel.findOneAndUpdate({ 'products._id': product_id }, { 'products.$.returnStatus': "refunded" })
        res.json({ message })
    }


}catch(err){
    console.log(err);
    
}
}
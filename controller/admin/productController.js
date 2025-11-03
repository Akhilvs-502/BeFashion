




import categoryModel from "../../models/categorySchema.js";
import productModel from "../../models/productSchema.js";

import jwt from 'jsonwebtoken'
import { HttpStatusCode } from "../../shared/constants/HttpStatusCode.js";
import { ErrorMessages } from "../../shared/constants/ErrorMessages.js";

const secretKey = process.env.SECRET_KEY

export const productList = async (req, res) => {
    try {

        // Get page and limit from query parameters,
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

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











export const postUploadImage = async (req, res) => {
    try {

        const imageUrl = req.file.path;

        // Send success response to the frontend
        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.json({ success: false, message: 'Image upload failed' });
    }
}



export const postAddproduct = async (req, res) => {
    try {
        console.log("post add product");

        const { productName, price, description, discount, variants, category, images } = req.body

        console.log(req.body, variants);

        const product = new productModel({
            productName,
            price,
            description,
            discount,
            variants,
            category,
            images
        })
        await product.save()
        res.json({ message: "product added" })
        console.log(productName);
    } catch (err) {
        console.log("err on adding product-postProduct", err);

    }

}



export const blockProduct = async (req, res) => {
    try {
        const { productID } = req.body
        console.log(productID);

        const product = await productModel.findOne({ _id: productID, block: false })
        if (product) {
            await productModel.findOneAndUpdate({ _id: productID }, { block: true })
            res.json({ message: 'sucess', blocked: true })

        } else {
            await productModel.findOneAndUpdate({ _id: productID }, { block: false })
            res.json({ message: 'sucess', blocked: false })

        }
        console.log(product);
    } catch (err) {

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
    try {

        const { productID, productName, price, description, discount, stock, color, size, category, images } = req.body
        const update = await productModel.findByIdAndUpdate({ _id: productID }, {
            productName, price, description, discount, stock, color, size, category, images
        })
        console.log("PostEditProduct");

        res.json({
            message: "product_edited"
        })

    } catch (err) {
        console.log(err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
            message: ErrorMessages.SYSTEM.INTERNAL_ERROR
        })
    }

}

export const searchProduct = async (req, res) => {
    try {

        const { search } = req.body

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const totalProducts = await productModel.find({ productName: { $regex: search, $options: 'i' } }).countDocuments();

        const products = await productModel.find({ productName: { $regex: search, $options: 'i' } }).skip(skip).limit(limit)


        const route = "searchProduct"
        res.render('admin/productList', {
            products, route, totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            limit: limit
        })
    } catch (err) {
        console.log(err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: ErrorMessages.SYSTEM.INTERNAL_ERROR })

    }
}

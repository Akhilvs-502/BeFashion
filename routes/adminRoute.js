import express from 'express'
import {login,postLogin,home,blockUser,logout,orderList,adminOrderUpdate,refund} from '../controller/adminController.js'
const routes=express.Router()
import { storage } from '../config/cloudinary.js';
import multer from 'multer';
const upload = multer({ storage });
import adminAuth from '../middewares/adminAuthenticate.js';
import * as coupon from "../controller/admin/coupon.js"
import * as offer from "../controller/admin/offeresController.js"
import * as sales from "../controller/admin/salesReport.js"
import * as dashboard from "../controller/admin/dashboard.js"
import * as categoryController from "../controller/admin/categoryController.js"
import * as productController from "../controller/admin/productController.js"
routes.get('/login',login)
routes.post('/login',postLogin)
routes.get('/home',adminAuth,home)
routes.get('/logout',logout)
routes.patch('/blockUser',adminAuth,blockUser)



// CATEGORY
routes.get('/category',adminAuth,categoryController.category)
routes.get('/addCategory',adminAuth,categoryController.addCategory)
routes.post('/addCategory',adminAuth,categoryController.postAddCategory)
routes.patch('/blockCategory',adminAuth,categoryController.blockCategory)
routes.get('/editCategory/:category',adminAuth,categoryController.editCategory)
routes.post('/editCategory',adminAuth,categoryController.postEditCategory)


// PRODUCT
routes.post('/uploadImage',adminAuth,upload.single('croppedImage'),productController.postUploadImage)
routes.patch('/blockProduct',adminAuth,productController.blockProduct)
routes.get('/editProduct/:productID',adminAuth,productController.editProduct)
routes.post('/postEditProduct',adminAuth,productController.postEditProduct)
routes.post('/searchProduct',adminAuth,productController.searchProduct)
routes.get('/productList',adminAuth,productController.productList)
routes.get('/addProduct',adminAuth,productController.addProduct)
routes.post('/addProduct',adminAuth,productController.postAddproduct)


routes.get("/orderList",adminAuth,orderList)
routes.post("/orderUpdate",adminAuth,adminOrderUpdate)
routes.post("/refund",adminAuth,refund)

routes.get("/showCoupon",adminAuth,coupon.showCoupon)
routes.post("/createCoupon",adminAuth,coupon.createCoupon)
routes.patch("/changeCouponSts",adminAuth,coupon.changeCouponSts)
routes.patch("/deleteCoupn",adminAuth,coupon.deleteCoupn)

//offer
routes.get("/offers",adminAuth,offer.showOffers)
routes.post("/addProductOffer",adminAuth,offer.addProductOffer)
routes.post("/addCategoryOffer",adminAuth,offer.addCategoryOffer)
routes.patch("/deleteOffer",adminAuth,offer.deleteOffer)
routes.patch("/editOffer",adminAuth,offer.editOffer)

routes.get("/salesReport",adminAuth,sales.salesReport)
routes.get("/downloadPdf",adminAuth,sales.downloadPdf)
routes.get("/downloadExcel",adminAuth,sales.downloadExcel)

routes.get("/ViewDashboard",adminAuth,dashboard.ViewDashboard)
routes.post("/getChartData",adminAuth,dashboard.getChartData)


export default routes

import express from 'express'
import {login,postLogin,home,blockUser,logout,productList,addProduct,category,addCategory,postAddCategory,blockCategory,editCategory,postEditCategory,postUploadImage,postAddproduct,blockProduct,editProduct,postEditProduct,searchProduct,orderList,adminOrderUpdate,refund} from '../controller/adminController.js'
const routes=express.Router()
import { storage } from '../config/gridFs.js';
import multer from 'multer';
const upload = multer({ storage });
import adminAuth from '../middewares/adminAuthenticate.js';
import * as coupon from "../controller/admin/coupon.js"
import * as offer from "../controller/admin/offeresController.js"
import * as sales from "../controller/admin/salesReport.js"
import * as dashboard from "../controller/admin/dashboard.js"
routes.get('/login',login)
routes.post('/login',postLogin)
routes.get('/home',adminAuth,home)
routes.get('/logout',logout)
routes.patch('/blockUser',adminAuth,blockUser)
routes.get('/productList',adminAuth,productList)
routes.get('/addProduct',adminAuth,addProduct)
routes.post('/addProduct',adminAuth,postAddproduct)
routes.get('/category',adminAuth,category)
routes.get('/addCategory',adminAuth,addCategory)
routes.post('/addCategory',adminAuth,postAddCategory)
routes.patch('/blockCategory',adminAuth,blockCategory)
routes.get('/editCategory/:category',adminAuth,editCategory)
routes.post('/editCategory',adminAuth,postEditCategory)
routes.post('/uploadImage',adminAuth,upload.single('croppedImage'),postUploadImage)
routes.patch('/blockProduct',adminAuth,blockProduct)
routes.get('/editProduct/:productID',adminAuth,editProduct)
routes.post('/postEditProduct',adminAuth,postEditProduct)
routes.post('/searchProduct',adminAuth,searchProduct)
routes.get("/orderList",adminAuth,orderList)
routes.post("/orderUpdate",adminAuth,adminOrderUpdate)
routes.post("/refund",adminAuth,refund)

routes.get("/showCoupon",adminAuth,coupon.showCoupon)
routes.post("/addCoupon",adminAuth,coupon.addCoupon)
routes.patch("/changeCouponSts",adminAuth,coupon.changeCouponSts)
routes.patch("/deleteCoupn",adminAuth,coupon.deleteCoupn)

//offer
routes.get("/offers",adminAuth,offer.showOffers)
routes.post("/addProductOffer",adminAuth,offer.addProductOffer)
routes.post("/addCategoryOffer",adminAuth,offer.addCategoryOffer)

routes.get("/salesReport",adminAuth,sales.salesReport)
routes.get("/downloadPdf",adminAuth,sales.downloadPdf)
routes.get("/downloadExcel",adminAuth,sales.downloadExcel)

routes.get("/ViewDashboard",adminAuth,dashboard.ViewDashboard)
routes.post("/getChartData",adminAuth,dashboard.getChartData)
export default routes

import express from 'express'
import {login,postLogin,home,blockUser,productList,addProduct,category,addCategory,postAddCategory,blockCategory,editCategory,postEditCategory,postUploadImage,postAddproduct,blockProduct,editProduct,postEditProduct,searchProduct,orderList,adminOrderUpdate,refund} from '../controller/adminController.js'
const routes=express.Router()
import { storage } from '../config/gridFs.js';
import multer from 'multer';
import { orderUpdate } from '../controller/userController.js';
const upload = multer({ storage });
import * as coupon from "../controller/admin/coupon.js"
import * as offer from "../controller/admin/offeresController.js"
import * as sales from "../controller/admin/salesReport.js"
routes.get('/login',login)
routes.post('/login',postLogin)
routes.get('/home',home)
routes.patch('/blockUser',blockUser)
routes.get('/productList',productList)
routes.get('/addProduct',addProduct)
routes.post('/addProduct',postAddproduct)
routes.get('/category',category)
routes.get('/addCategory',addCategory)
routes.post('/addCategory',postAddCategory)
routes.patch('/blockCategory',blockCategory)
routes.get('/editCategory/:category',editCategory)
routes.post('/editCategory',postEditCategory)
routes.post('/uploadImage',upload.single('croppedImage'),postUploadImage)
routes.patch('/blockProduct',blockProduct)
routes.get('/editProduct/:productID',editProduct)
routes.post('/postEditProduct',postEditProduct)
routes.post('/searchProduct',searchProduct)
routes.get("/orderList",orderList)
routes.post("/orderUpdate",adminOrderUpdate)
routes.post("/refund",refund)

routes.get("/showCoupon",coupon.showCoupon)
routes.post("/addCoupon",coupon.addCoupon)
routes.patch("/changeCouponSts",coupon.changeCouponSts)
routes.patch("/deleteCoupn",coupon.deleteCoupn)

//offer
routes.get("/offers",offer.showOffers)
routes.post("/addProductOffer",offer.addProductOffer)
routes.post("/addCategoryOffer",offer.addCategoryOffer)

routes.get("/salesReport",sales.salesReport)
routes.get("/downloadPdf",sales.downloadPdf)
routes.get("/downloadExcel",sales.downloadExcel)
export default routes

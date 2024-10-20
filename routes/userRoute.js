import express, { Router } from 'express'
import auth from '../middewares/authenticate.js'
import { home,login,postLogin,signUp,profile,logout,postSignup,mailforotp,postMailforotp,postOtp,getotp,forgotpassword,postForgotpassword,
    resetPassword,passwordUpdate,changePassword,allProducts,productView,editProfile,patchEditProfile,showAddress,addAddress,postAddAddress,
    deleteAddress,editAddress,patchAddAddress,addToCart,showCart,updateQuantity,checkOutStep1,postCheckOutStep1,cartSummary,selectPayment,orderUpdate,orderSuccess,
    showOrders,orderCancel,returnOrder,paymentVerificaton,wallet} from '../controller/userController.js'
import * as wishlist from "../controller/user/wishlistController.js"
import * as coupon from "../controller/user/couponController.js"
const routes=express.Router()

routes.get("/home",home)
routes.get('/login',login)
routes.post('/login',postLogin)
routes.get('/signup',signUp)
routes.get('/profile',auth,profile)
routes.get('/logout',logout)
routes.post('/postSignup',postSignup)
routes.get('/mailforotp/:email',mailforotp)
routes.post('/mailforotp',postMailforotp)
routes.post('/postOtp',postOtp)
routes.get('/getotp',getotp)
routes.get('/forgotpassword',forgotpassword)
routes.post('/postForgotpassword',postForgotpassword)
routes.get('/resetPassword',resetPassword)
routes.patch('/passwordUpdate',passwordUpdate)
routes.get('/changePassword',changePassword)
routes.get('/allProducts',allProducts)
routes.get('/productView/:id',productView)
routes.get('/editProfile',auth,editProfile)
routes.patch('/editProfile',auth,patchEditProfile)
routes.get('/address',auth,showAddress)
routes.get('/addAddress',auth,addAddress)
routes.post("/addAddress",auth,postAddAddress)
routes.patch("/deleteAddress",auth,deleteAddress)
routes.get('/editAddress/:addressID',auth,editAddress)
routes.patch("/addAddress",auth,patchAddAddress)

// CART
routes.post("/addToCart",auth,addToCart)
routes.get('/showCart',auth,showCart)
routes.post('/cart/updateQuantity',auth,updateQuantity)

//ORDER
routes.get("/cart/checkOutStep1",auth,checkOutStep1)
routes.post("/cart/checkOutStep1",auth,postCheckOutStep1)
routes.get("/cartSummary/:addressID",auth,cartSummary)
routes.get("/selectPayment/:addressID",auth,selectPayment)
routes.post("/orderUpdate",auth,orderUpdate)
routes.get("/orderSuccess/:orderId",auth,orderSuccess)
routes.get("/showOrders",auth,showOrders)
routes.post("/orderCancel",auth,orderCancel)
routes.post("/return",auth,returnOrder)
routes.post("/paymentVerificaton",auth,paymentVerificaton)

//wallect
routes.get("/wallet",auth,wallet)

//wishlist
routes.post("/addToWhishlist",auth,wishlist.addToWishlist)
routes.get("/showWishlist",auth,wishlist.showWishlist)
routes.post("/removeFromWhishlist",auth,wishlist.removeFromWishlist)

// coupon
routes.post("/applyCoupon",auth,coupon.applyCoupon)
routes.post("/removeCoupon",auth,coupon.removeCoupon)
export default routes
import express, { Router } from 'express'
import auth from '../middewares/authenticate.js'
import { home,login,postLogin,signUp,logout,postSignup,mailforotp,postMailforotp,postOtp,getotp,forgotpassword,postForgotpassword,
    resetPassword,passwordUpdate,changePassword,allProducts,productView,wallet} from '../controller/userController.js'
import * as wishlist from "../controller/user/wishlistController.js"
import * as coupon from "../controller/user/couponController.js"
import * as order from "../controller/user/orderController.js"
import * as payment from"../controller/user/paymentController.js"
import * as checkout from "../controller/user/checkoutController.js"
import * as cart from "../controller/user/cartController.js"
import * as address from "../controller/user/addressController.js"
import * as profile from "../controller/user/profileContoller.js"
const routes=express.Router()


routes.get("/home",home)
routes.get('/login',login)
routes.post('/login',postLogin)
routes.get('/signup',signUp)
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
routes.get('/productView/:id',productView)
routes.get('/allProducts',allProducts)

//PROFILE
routes.get('/profile',auth,profile.profile)
routes.get('/editProfile',auth,profile.editProfile)
routes.patch('/editProfile',auth,profile.patchEditProfile)

//ADDRESS
routes.get('/address',auth,address.showAddress)
routes.get('/addAddress',auth,address.addAddress)
routes.post("/addAddress",auth,address.postAddAddress)
routes.patch("/deleteAddress",auth,address.deleteAddress)
routes.get('/editAddress/:addressID',auth,address.editAddress)
routes.patch("/addAddress",auth,address.patchAddAddress)

// CART
routes.post("/addToCart",auth,cart.addToCart)
routes.get('/showCart',auth,cart.showCart)
routes.post('/cart/updateQuantity',auth,cart.updateQuantity)

//CHECKOUT
routes.get("/cart/checkOutStep1",auth,checkout.checkOutStep1)
routes.post("/cart/checkOutStep1",auth,checkout.postCheckOutStep1)
routes.get("/cartSummary/:addressID",auth,checkout.cartSummary)
routes.get("/selectPayment/:addressID",auth,checkout.selectPayment)
//ORDER
routes.post("/orderUpdate",auth,order.orderUpdate)
routes.get("/orderSuccess/:orderId",auth,order.orderSuccess)
routes.get("/showOrders",auth,order.showOrders)
routes.post("/orderCancel",auth,order.orderCancel)
routes.post("/return",auth,order.returnOrder)
routes.get("/downloadInvoice",auth,order.downloadInvoice)

//wallect
routes.get("/wallet",auth,wallet)

//wishlist
routes.post("/addToWhishlist",auth,wishlist.addToWishlist)
routes.get("/showWishlist",auth,wishlist.showWishlist)
routes.post("/removeFromWhishlist",auth,wishlist.removeFromWishlist)

// coupon
routes.post("/applyCoupon",auth,coupon.applyCoupon)
routes.post("/removeCoupon",auth,coupon.removeCoupon)
routes.get("/showCoupons",auth,coupon.showCoupons)

//PAYMENT
routes.post("/paymentVerificaton",auth,payment.paymentVerification)
routes.patch("/paymentFailed",auth,payment.paymentFailed)
routes.patch("/repayment",auth,payment.repayment)
export default routes

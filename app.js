import express from "express"
import path, { join } from 'path'
import { fileURLToPath } from 'url';
import expressEjsLayouts from "express-ejs-layouts";
const __filename = fileURLToPath(import.meta.url);
const __dirname =path.dirname(__filename);          
import userRoute from './routes/userRoute.js'
import adminRouter from './routes/adminRoute.js'
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config()
import passport from "./config/passport.js";
import googleRoutes from './routes/googleRoute.js'
import  session from "express-session";
import cors from 'cors';
import PDFDocument from 'pdfkit';
import fs from 'fs';
const app=express()
app.use(cors());
app.set('view engine','ejs')
app.set('views','./views')
app.use(express.static(path.join(__dirname,'public')))
app.use(expressEjsLayouts)
app.set('layout','layout')
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))

app.use(session({
    secret: 'mykey',
    resave: false,
    saveUninitialized: true,
    cookie:{  secure: process.env.NODE_ENV === 'production', }
  }));

app.get("/",(req,res)=>{
    res.redirect("/user/home")
})
app.use('/user',userRoute)
app.use('/admin',adminRouter)




 const MONGOURL=process.env.MONGO_URL;
 const PORT=process.env.PORT



// Express session passport initialize

app.use(passport.initialize())
app.use(passport.session())
app.use(googleRoutes)


//////

app.get("*",(req,res)=>{
    res.render("user/404")
})





// const generatePDF = (orders) => {
//     const doc = new PDFDocument();
//     const filePath = './sales-report.pdf';

//     doc.pipe(fs.createWriteStream(filePath));

//     // Add content
//     doc.fontSize(20).text('Sales Report', { align: 'center' });
//     doc.moveDown();
    
//     // Table header
//     doc.fontSize(12).text('User | Product | Quantity | Total Sales | Coupon Discount | Discount Applied | Order Status | Payment Status | Date');

//     orders.forEach(order => {
//         const orderData = `${order.user.name} | ${order.products[0].productName} | ${order.products[0].quantity} | $${(order.products[0].price * order.products[0].quantity).toFixed(2)} | $${order.products[0].couponAdded.toFixed(2)} | $${order.products[0].discountedPrice.toFixed(2)} | ${order.orderStatus} | ${order.paymentStatus} | ${new Date(order.createdAt).toLocaleDateString()}`;
//         doc.text(orderData);
//     });
// 
//     doc.end();
//     return filePath; // Return the path to download later
// };





mongoose.connect(MONGOURL).then(()=>{                 /// change this to config file
    console.log("datebase Conneted successfully");
    app.listen(PORT,(err,data)=>{
        console.log("server running");
        
    })
}).catch((err)=>{
    console.log("err connection database",err);
})
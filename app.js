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
import { home } from "./controller/userController.js";
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

app.get("/",home)
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




mongoose.connect(MONGOURL).then(()=>{                 
    console.log("datebase Conneted successfully");
    app.listen(PORT,(err,data)=>{
        console.log("server running");
        
    })
}).catch((err)=>{
    console.log("err connection database",err);
})
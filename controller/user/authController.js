
import usermodel from "../../models/userModel.js"
import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
dotenv.config()
import bcrypt from 'bcrypt'

const secretKey = process.env.SECRET_KEY

import { HttpStatusCode } from "../../shared/constants/HttpStatusCode.js";
import { ErrorMessages } from "../../shared/constants/ErrorMessages.js";




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
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
            message: ErrorMessages.SYSTEM.INTERNAL_ERROR
        })
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
                res.status(HttpStatusCode.UNAUTHORIZED).json({
                    message: "*Invalid password"
                })
            }
        }

        else {
            res.status(HttpStatusCode.UNAUTHORIZED).json({
                message: "*Invalid user.please enter the correct email and password"
            })
        }
    }
    catch {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
            message: "server error"
        })

    }
}



export const signUp = async (req, res) => {
    try {
        res.render('user/signup')
    } catch (err) {
        res.render("user/500")

    }
}



export const logout = (req, res) => {
    try {
        res.clearCookie('token');
        req.session.destroy()
        res.redirect('/user/login')
    } catch (err) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: ErrorMessages.SYSTEM.INTERNAL_ERROR })

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

            res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'user exists  with not verified', email: email })


        } else {
            res.status(HttpStatusCode.CONFLICT).json({ Message: 'User already exists*' })
        }

    }
    catch {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: ErrorMessages.SYSTEM.INTERNAL_ERROR })
    }
}
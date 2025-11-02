

import usermodel from "../models/userModel.js"
import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
import nodemailer from 'nodemailer'
dotenv.config()
import bcrypt from 'bcrypt'
const secretKey = process.env.SECRET_KEY







//forgotpassword
export const forgotpassword = (req, res) => {
    res.render("user/forgotpassword",)
}



export const postForgotpassword = async (req, res) => {
    try {


        const { email } = req.body
        req.session.userEmail = email

        console.log(req.body);
        console.log(email);

        console.log("this is postmail");


        function otpGenerator() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        }
        const otp = otpGenerator()
        const expiresAt = Date.now() + 3 * 60 * 1000

        const userFound = await usermodel.findOneAndUpdate(
            { email: email }, { otp: otp, expiresAt: expiresAt }, { upsert: true })
        if (!userFound) {
            return res.send("user not found")
        }


        // send to mail 
        const transpoter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                // pass: 'xoep evgg bbkm pfsa'
                pass: process.env.NODEMAILER_PASS
            }
        });

        async function sendOTPEmail(clientEmail, otp) {
            const mailOptions = {
                from: 'getupsignin@gmail.com',
                to: clientEmail,
                subject: 'your otp code',
                text: `your OTP code is ${otp} .it will expire in 3 minutes`

            };
            try {
                await transpoter.sendMail(mailOptions);
                console.log("otp send to the client email");

            }
            catch (error) {
                console.log(error);

                console.log('Err sending otp  to the email');

            }

        }

        sendOTPEmail(email, otp)
        res.redirect('/user/resetPassword')
    }
    catch {
        res.render("user/500")

    }
}




export const resetPassword = (req, res) => {
    const email = req.session.userEmail
    res.render('user/resetPassword', { email })
}




export const changePassword = (req, res) => {
    res.render('user/changePassword')
}




export const passwordUpdate = async (req, res) => {
    try {

        const { userPasswordInput } = req.body
        console.log(userPasswordInput);
        let email = req.session.userEmail  // THIS IS FOR WHEN I USING FORGOTPASSWORD SESSION created in otp send route - mailforotp
        if (!email) {                        // THIS IS FOR CHANGE PASSWORD THE EMAIL GETTING FROM THE TOKEN
            const token = req.cookies.token
            if (token) {
                jwt.verify(token, secretKey, (err, data) => {
                    email = data.email
                })
            }
        }
        console.log(email);
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userPasswordInput, saltRounds)

        const user = await usermodel.findOneAndUpdate({ email: email }, { password: hashedPassword })
        console.log(user);

        // Simple alert
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch {
        res.render("user/500")

    }

}



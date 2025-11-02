

import usermodel from "../../models/userModel.js"
import dotenv from "dotenv";
import nodemailer from 'nodemailer'
dotenv.config()





export const mailforotp = (req, res) => {
    try {

        const email = req.params.email
        req.session.userEmail = email
        res.render('user/mailforotp', { email })
    } catch (err) {
        res.render("user/500")
    }

}





export const getotp = async (req, res) => {

    try {

        const email = req.session.userEmail

        console.log("getotpemail" + email);
        res.render('user/otp', { email })

    } catch (err) {
        res.render("user/500")
    }


}






export const postMailforotp = async (req, res) => {
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

                console.log(error, "err");
                console.log('Err sending otp  to the emaill');

            }

        }

        sendOTPEmail(email, otp)
        res.redirect('/user/getotp')
    }
    catch (error) {
        console.log("post main for otp", error)
        res.render("user/500")
    }
}





export const postOtp = async (req, res) => {
    try {

        async function verifyOtp(userOtp, storedOtp, expiresAt) {

            const currentTime = Date.now()
            if (currentTime > expiresAt) {
                console.log("expired otp");
                res.status(400).json({
                    message: 'otp expired'
                })

            }

            else if (userOtp == storedOtp) {
                console.log("valid otp");
                const vali = await usermodel.findOneAndUpdate({ email: email }, { verified: true })
                res.status(200).json({
                    message: 'otp validated true'
                })


            } else {
                console.log("invalid otp");
                res.status(400).json({
                    message: 'Wrong OTP enterd'
                })
            }

        }
        const { userEntedOtp } = req.body
        // const userOtp=Number([num1,num2,num3,num4,num5,num6].join(""))
        // console.log(userOtp);
        console.log("this is postotp");
        const email = req.session.userEmail
        console.log(userEntedOtp);
        console.log(email);

        const user = await usermodel.findOne({ email: email })
        console.log(user);

        const storedOtp = user.otp
        console.log(user.otp);
        const expiresAt = user.expiresAt
        verifyOtp(userEntedOtp, storedOtp, expiresAt)
    }
    catch {
        res.render("user/500")

    }

}


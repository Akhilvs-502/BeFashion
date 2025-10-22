import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
dotenv.config()
import usermodel from '../models/userModel.js';

const secretKey = process.env.SECRET_KEY

const adminAuth = (req, res, next) => {
    try {
        const token = req.cookies.adminToken
        console.log(token);

        if (!token) {
            console.log("no token");

            res.redirect('/admin/login')
        } else {
            jwt.verify(token, secretKey, async (err, data) => {

                if (err) {
                    console.log("blocked");

                    res.redirect('/admin/login')
                }
                else {
                    console.log("next");

                    next()


                }
            })
        }
    }
    catch {

    }
}
export default adminAuth
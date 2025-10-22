import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
dotenv.config()
import usermodel from '../models/userModel.js';

const secretKey = process.env.SECRET_KEY

const auth = (req, res, next) => {
    try {


        const token = req.cookies.token
        //  console.log(token);

        if (!token) {
            console.log("no token");
            res.redirect('/user/login')
        } else {
            jwt.verify(token, secretKey, async (err, data) => {

                if (err) {
                    console.log("login");

                    res.redirect('/user/login')
                }
                else {

                    console.log("home");
                    req.userData = data
                    const user = await usermodel.findOne({ email: data.email })
                    if (user.blocked) {
                        res.clearCookie('token');
                        req.session.destroy()
                        res.render('user/blockedUser')
                    } else {
                        next()
                    }

                }
            })
        }
    }
    catch {

    }
}
export default auth
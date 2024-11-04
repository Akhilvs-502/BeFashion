import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import usermodel from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config()
// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session

passport.deserializeUser((id, done) => {
    usermodel.findById(id).then(user => {
        if (!user) {
            return done(new Error('User not found'), null);
        }
        return done(null, user)
    }).catch(err => {
        done(err)
    })
});


// Google OAuth Strategy
const clientId = process.env.Client_ID
const clientSecret = process.env.Client_Secret
const Gcallback=process.env.Google_callback
console.log(Gcallback);

passport.use(new GoogleStrategy({
    clientID: clientId,  // Your Google Client ID
    clientSecret: clientSecret,  // Your Google Client Secret
    callbackURL: Gcallback ,  // Callback URL
},
    (accessToken, refreshToken, profile, done) => {
        usermodel.findOne({ $or: [{ googleId: profile.id }, { email: profile.emails[0].value }] }).then(user => {
            console.log(profile);

            if (!user) {
                // Creating a new user
                const newUser = new usermodel({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,  // Fetching email properly
                    verifeid: true
                });
                return newUser.save()

            }
            return user
        }).then(user => {

            done(null, user)

        }).catch(err => done(err))
    }
))

// Export passport configuration
export default passport;

 import express from 'express'
 import passport from 'passport'
 const routes=express.Router()
 import jwt from 'jsonwebtoken'
 const secretKey = process.env.SECRET_KEY
 

 // Google Authentication Route
routes.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback Route
routes.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home or wherever want

  const user=req.user
  console.log(user+"GOOGLE");
  
  const expiresIn='1d'
  const token = jwt.sign({googleId:user.id,email:user.email,name:user.name}, secretKey, { expiresIn })

  res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  // Only set cookie over HTTPS in production
      maxAge: 1000000000,
      sameSite: 'Lax'
  })



    res.redirect('/user/home');
    
  }
);

export default routes
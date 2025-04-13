const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const adminLayout = '../views/layouts/admin';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWTSECRET;


/* 
Check cookie - authorization
*/
const authMiddleWare = (req, res, next) => {
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({message: 'Unauthorized'});
    }

    try{
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
        
    }catch (error){
        return res.status(401).json({message: 'Unauthorized'});
    }
}



/**
 * Get
   Get ADMIN Page  
*/
 router.get('/admin', async (req, res) =>{
    
    try {
        const locals = {
            title: "Admin Page",
            description: "Simple one"
        }

        res.render('admin/login', {locals, layout: adminLayout});
    } catch (error) {
        console.log(error);
    }

 });


/**
 * Post
   Posting ADMIN login  
*/
router.post('/admin', async (req, res) =>{
    try {
        const {username, password } = req.body;
        const user = await User.findOne({username});

        if(!user){
            res.status(401).json({message:'Invalid Credentials'});
        }
       
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            res.status(401).json({message:'Invalid Credentials'});

        }

        const token = jwt.sign({userId: user._id}, jwtSecret)
        res.cookie('token', token, {httpOnly: true});

        res.redirect('/dashboard');

    } catch (error) {
        console.log(error);
    }

 });



 /**
 * Post
   getting dashboard page
*/
router.get('/dashboard', authMiddleWare, async (req, res) =>{

    try {
        const locals = {
            title: 'Dashboard',
            description: 'Dashboard page of the blog'
        }

        const data = await Post.find();
        res.render('admin/dashboard', {locals, data, layout: adminLayout});
    } catch (error) {
        console.log(error);
    }

});


 /**
 * Post
   Add POST page
*/
router.get('/add-posts', authMiddleWare, async (req, res) =>{

    try {
        const locals = {
            title: 'Add Post',
            description: 'Add a new post for the blog'
        }

        const data = await Post.find();
        res.render('admin/add-posts', {locals});
    } catch (error) {
        console.log(error);
    }

});




 /**
 * Post
   Add POST content
*/
router.post('/add-posts', authMiddleWare, async (req, res) =>{

    try {
        const newPost = new Post({
            title: req.body.title,
            body: req.body.body
        });

        await Post.create(newPost);
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }

});



 /**
 * GET
   Getting specific blog content
*/
router.get('/edit-posts/:id', authMiddleWare, async (req, res) =>{

    try {

        const locals = {
            title: 'Edit Post',
            description: 'Editing the posts of Blog'
        }
      const data = await Post.findOne({_id: req.params.id})
      

      res.render('admin/edit-posts', {
          data,
          locals,
          layout: adminLayout
      });
    } catch (error) {
        console.log(error);
    }

});

 /**
 * PUT
   Updating POST content
*/
router.put('/edit-posts/:id', authMiddleWare, async (req, res) =>{

    try {
      await Post.findByIdAndUpdate(req.params.id, {
          title: req.body.title,
          body: req.body.body,
          updatedAt: Date.now()
          
      });
      console.log();

      res.redirect(`/edit-posts/${req.params.id}`);
    } catch (error) {
        console.log(error);
    }

});



 /**
 * DELETE
   Admin - Deleting POST content
*/
router.delete('/delete-posts/:id', authMiddleWare, async (req, res) =>{

    try {
        await Post.deleteOne({_id: req.params.id});
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        
    }



});
 /**
 * Post
   Posting Register  
*/
router.post('/register', async (req, res) =>{
    
    try {
        const {username, password } = req.body;
        const hashedPassword  = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({username, password: hashedPassword});
            res.status(201).json({message: 'User Created', user});
        } catch (error) {
            if(error.code === 11000){
                res.status(409).json({message: 'User already exist'});
            }
            res.status(500).json({message: 'Internal Server Error'});
            
        }
    }catch(error){
        console.log(error);
    }
 });



  /**
 * GEt
   Admin - Logging out
*/
router.get('/logout', (req, res) =>{
    res.clearCookie('token');
    res.redirect('/');
    }

);

module.exports = router;



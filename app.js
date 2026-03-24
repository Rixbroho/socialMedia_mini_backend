const express=require('express');
const app=express();
const userModel=require('./models/user');
const postModel=require('./models/posts')

const cookiesParser=require('cookie-parser');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookiesParser());

const isLoggedIn=(req,res,next)=>{
    const token=req.cookies.token;
    if(!token) return res.redirect('/login');

    if(token=='') {
        return res.send('login first')
        // return res.redirect('/login')
    }
    else{
        let data=jwt.verify(token,'scret');
        req.user=data;
    }
    next()
}

app.get('/',(req,res)=>{
    res.render('index')
});

app.get('/login',(req,res)=>{
    res.render('login')
})

app.get('/logout',(req,res)=>{
    res.cookie('token','')
    res.redirect('/login')
});

app.get('/profile',isLoggedIn,async (req,res)=>{
    let user=await userModel.findOne({email: req.user.email}).populate("posts")
    res.render('profile',{user});
    // console.log(user)
})

app.post('/register',async (req,res)=>{
    let {username,email,password,age,name}=req.body;
    let checkUser=await userModel.findOne({email});
    // console.log(checkUser)
    // if(checkUser) return res.status(500).send('user exist');

    const salt=await bcrypt.genSalt(10);
    const hash=await bcrypt.hash(password,salt)

    const user=await userModel.create({
        username,
        email,
        password: hash,
        age,
        name
    });
    let token=jwt.sign({email,userId:user._id},'scret');
    res.cookie('token',token)
    res.redirect('/login')
})

app.post('/login',async(req,res)=>{
    let {email,password}=req.body;

    let checkUser=await userModel.findOne({email});
    if(!checkUser) return res.status(400).send('something went wrong');

    let checkpassword=await bcrypt.compare(password,checkUser.password);
    if(!checkpassword) return res.send('something went wrong p');

    let token=jwt.sign({email,userId:checkUser._id},'scret');
    res.cookie('token',token);
    res.redirect('/profile')
});

app.post('/post',isLoggedIn,async(req,res)=>{
    let user=await userModel.findOne({email: req.user.email});
    let {content}=req.body;
    console.log(content)
    let newPost=await postModel.create({
        user: user._id,
        content
    });
    console.log(newPost);
    user.posts.push(newPost._id);
    await user.save();
    res.redirect('/profile')
})


app.listen(3000);
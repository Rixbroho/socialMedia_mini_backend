const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/posts");

const cookiesParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const path=require('path');
const jwt = require("jsonwebtoken");

const multerConfig=require('./config/multerConfig')

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookiesParser());
app.use(express.static(path.join(__dirname,"public")));

const isLoggedIn = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  // if(token=='') {
  //     return res.send('login first')
  //     // return res.redirect('/login')
  // }
  try {
    let data = jwt.verify(token, "scret");
    req.user = data;
    next();
  } catch (err) {
    return res.send("login first");
  }
};

app.get("/", (req, res) => {
  res.render("index");
});


app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  // console.log(req.user)
  if (post.likes.indexOf(req.user.userId) === -1) {
    post.likes.push(req.user.userId);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userId), 1);
  }
  await post.save();
  res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit", { post });
});

app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  // console.log("REQ.USER:", req.user);
  res.render("profile", { user });
  // console.log(user)
});

app.get("/profile/upload", isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({ email: req.user.email });
  // console.log("REQ.USER:", req.user);
  res.render("profileupload", { user });
  // console.log(user)
});

app.post("/register", async (req, res) => {
  let { username, email, password, age, name } = req.body;
  let checkUser = await userModel.findOne({ email });
  // console.log(checkUser)
  // if(checkUser) return res.status(500).send('user exist');

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await userModel.create({
    username,
    email,
    password: hash,
    age,
    name,
  });
  let token = jwt.sign({ email, userId: user._id }, "scret");
  res.cookie("token", token);
  res.redirect("/login");
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let checkUser = await userModel.findOne({ email });
  if (!checkUser) return res.status(400).send("something went wrong");

  let checkpassword = await bcrypt.compare(password, checkUser.password);
  if (!checkpassword) return res.send("something went wrong p");

  let token = jwt.sign({ email, userId: checkUser._id }, "scret");
  res.cookie("token", token);
  res.redirect("/profile");
});

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;
  console.log(content);
  let newPost = await postModel.create({
    user: user._id,
    content,
  });
  console.log(newPost);
  user.posts.push(newPost._id);
  await user.save();
  res.redirect("/profile");
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content },
  );
  res.redirect("/profile");
});

app.post('/upload',isLoggedIn, multerConfig.single('image'), async function (req, res) {
  let user=await userModel.findOne({email:req.user.email});
  // console.log(user)
  user.profilepic=req.file.filename;
  await user.save();
  res.redirect('/profile')
});



app.listen(3000);

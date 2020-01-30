//jshint esversion:6

//dotev needs to be required as early as possible. no constant needed
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// require three packages 
const session = require("express-session");
const passport = require ("passport");
const passportLocalMongoose = require ("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
//order is important
//important to use app.use(session) above mongoose connect
app.use(session({
    secret: process.env.SESSION_SECRET,//this is how you hide secret string with .env
    resave: false,
    saveUninitialized: false
})); //set up session to set a secret

app.use(passport.initialize());
app.use(passport.session()); //use passport to manage our session


mongoose.connect("mongodb://localhost:27017/userDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

mongoose.set('useCreateIndex', true); //use for third party library


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);//set up user schema to use passortlocal as a plugin

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //use passport to create local (User) login stratety
 
//seialized and deserialize == create cookies and destroy cookies
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.post("/register", function (req, res) {
    //This method comes from passportlocalmongoose package
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            }); //once you register, typing "/secrets"in your brower automatically bring you to the secrets page without authentication as long as your session lasts
        }
    }); //it's a middle man to handle all creating saving new user, interacting with mongoose directly
});

app.post("/login", function (req, res) {
    //create new user
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //login method is from passport user is from user credential above
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    });
});

//logout and  deauthenticated 
app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
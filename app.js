//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const {Schema} = mongoose;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/userDB', {useNewUrlParser: true});
const userSchema = new Schema({
    email: String,
    password: String,
    secrets:String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", function (req, res) {
    res.render("home");
});

app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })
    .post(function (req, res) {

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                })
            }
        })

    });

app.get("/secrets", function (req, res) {

    User.find({"secrets":{$ne:null}}, function (err,found) {
        if (err){
            console.log(err);
        }else {
            res.render("secrets",{contentSecret:found});
        }
    });

});
app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");

    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req,res) {
    const submitedSecret = req.body.secret;

    User.findById(req.user._id ,function (err,found) {
        if (err){
            console.log(err);
        } else {
            if (found){
                found.secrets = submitedSecret;
                found.save(function () {
                    if (!err){
                        res.redirect("/secrets")
                    }
                })
            }
        }
    })



});

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (!err) {
            console.log(err);
        }
    });
    res.redirect("/secrets");
});

app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })
    .post(function (req, res) {

        User.register({username: req.body.username, active: false}, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                })

            }


        });



    });


app.listen(3000, function () {
    console.log("Server started on port 3000");
});


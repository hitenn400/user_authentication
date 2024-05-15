const express = require('express');
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

// regular middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// cookie  and file middleware
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles:true,
    tempFileDir:"/tmp/"
}));
app.set("view engine","ejs");
// morgan middleware
app.use(morgan("tiny"));
// import all routes here
const home = require('./routes/home');
const user = require('./routes/user');
const product = require('./routes/product');
const payment = require('./routes/payment');
const order = require('./routes/order');
// router middleware
app.use("/api/v1",home);
app.use("/api/v1",user);
app.use("/api/v1",product);
app.use("/api/v1",payment);
app.use("/api/v1",order);
app.get("/signuptest",(req,res)=>{
    res.render('signuptest');
})
// export app js
module.exports=app;
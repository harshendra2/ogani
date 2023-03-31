const mongoose=require("mongoose");
const logger=require("morgan")

mongoose.connect("mongodb+srv://harshendra:Narayana20Ha@cluster0.misnwgb.mongodb.net/user_management_appu");

const express=require("express");
const app=express();

app.use(function(req, res, next) { 
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
     next();
   });

   const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))    

app.set('view engine', 'ejs')


app.use(logger('dev'))
//for user route
const userRoute=require("./routes/userRoute")
app.use("/",userRoute);

//admin router
const adminRoute= require("./routes/adminRoute");
app.use("/admin",adminRoute);

app.use((req, res, next) => {
    res.status(404).render('404')
    })


app.listen(3000,function(){
    console.log("server running");

})
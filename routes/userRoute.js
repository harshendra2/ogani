const express=require("express");
const user_route=express();
const session=require("express-session");
const config=require("../config/config");
user_route.use(session({secret:config.sessionSecret,resave:true,saveUninitialized:true}))

const auth=require('../middleware/auth');
const Razorpay = require('razorpay');
var instance = new Razorpay({
  key_id: 'rzp_test_FXi0DRSxpwhUmY',
  key_secret: '5SfFvBIu2TSffn9xUViPGp7K',
});


user_route.set('view engine','ejs');
user_route.set('views','./views/users');
const bodyParser=require('body-parser');
 user_route.use(bodyParser.json());
 user_route.use(bodyParser.urlencoded({extended:true}));



const path=require("path");
user_route.use(express.static("public"))
user_route.use("/css",express.static(__dirname +"public/css"))
user_route.use("/img",express.static(__dirname+ "public/img"))
user_route.use("/fonts",express.static(__dirname +"public/fonts"))
user_route.use("/js",express.static(__dirname+ "public/js"))
user_route.use("/sass",express.static(__dirname +"public/sass"))




const userController=require("../controllers/userContraoller");
user_route.get("/signup",auth.isLogout,userController.loadRegister);


user_route.post("/signup",userController.loadotp);
user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.get("/login",auth.isLogout,userController.loginLoad);
user_route.post("/login",userController.verifylogin);
user_route.get("/home",userController.loadhome)
user_route.get('/',userController.loadhome)
 
 user_route.get("/signup",userController.directhomepage);
 user_route.get("/shop",auth.isLogin,userController.loadshop);
 user_route.get("/details",auth.isLogin,userController.loadproductdetails);

 user_route.post("/otp",userController.verifyOtp)
 user_route.get("/forget",userController.forgetLoad)
 user_route.post("/forget",userController.forgetVerify)
 user_route.get("/mailreset",userController.forgetPasswordLoad)
 user_route.post("/mailreset",userController.postnewpassword)

 user_route.get("/userlogin",userController.secondlogin);
 
 user_route.get("/logout",auth.isLogin,userController.userLogout);
 user_route.get("/userprofile",auth.isLogin,userController.loaduserprofile)
 user_route.get("/edituseraddress",auth.isLogin,userController.loadeditaddress)
 user_route.post("/edituseraddress",auth.isLogin,userController.posteditaddress)
 user_route.get("/deleteuseraddress",auth.isLogin,userController.loaddeleteaddress)
 
 user_route.get("/addaddress",auth.isLogin,userController.loadaddaddress)
 user_route.post("/addaddress",auth.isLogin,userController.postaddaddress)
 user_route.post("/addtocart",auth.isLogin,userController.addtocart)
 user_route.post("/addtocart-in-wishlist",auth.isLogin,userController.addtocartinwishlist)
 user_route.get("/cart",auth.isLogin,userController.loadcart);
 user_route.post("/cart",auth.isLogin,userController.postcart);
 
 user_route.post('/removeproduct',userController.removeCartProduct)		
 user_route.get("/checkout",auth.isLogin,userController.loadcheckout);
 user_route.post("/checkout",auth.isLogin,userController.postcheckout);
 
 user_route.post("/checkoutpage",userController.postcheckoutpage)
 user_route.get("/checkoutpage",userController.loadcheckoutpage)
 user_route.get("/checkout-addadress",userController.loadaddnewaddresscheckoutpage)
 user_route.post("/checkout-addadress",userController.addnewaddresscheckoutpage)
 user_route.post("/removeaddress-checkoutpage",userController.removeaddresscheckoutpage)
 user_route.get("/edit-address-checkoutpage",userController.loadeditaddresscheckoutpage)
 user_route.post("/edit-address-checkoutpage",userController.posteditaddresscheckoutpage)

 user_route.post('/place-order',userController.placeOrder)
user_route.get('/success',userController.successorder);
user_route.get('/order',userController.loadOrder);
user_route.get('/cancel-order',userController.cancelOrder)
user_route.get('/single-order',userController.loadSingleOrder);
user_route.post('/validateCoupon',userController.coupon)
user_route.post("/addtowishlist",userController.addtowishlist)		
user_route.get('/wishlist',userController.loadwishlist);	
user_route.post('/removeproduct-wishlist',userController.removeproductinwishlist)
user_route.get('/download-Invoice',auth.isLogin,userController.invoiceDownload);																											



user_route.post('/create/orderId',(req,res)=>{
  console.log("Create OrderId Request",req.body)
  var options = {
    amount: req.body.amount,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "rcp1"
  };
  instance.orders.create(options, function(err, order) {
    console.log(order);
    res.send({orderId:order.id});//EXTRACT5NG ORDER ID AND SENDING IT TO CHECKOUT
  });
});


user_route.post("/api/payment/verify",(req,res)=>{

  let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
 
   var crypto = require("crypto");
   var expectedSignature = crypto.createHmac('sha256','5SfFvBIu2TSffn9xUViPGp7K')
                                   .update(body.toString())
                                   .digest('hex');
                                   console.log("sig received " ,req.body.response.razorpay_signature);
                                   console.log("sig generated " ,expectedSignature);
   var response = {"signatureIsValid":"false"}
   if(expectedSignature === req.body.response.razorpay_signature)
    response={"signatureIsValid":"true"}
       res.send(response);
   });





module.exports=user_route;
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const PDFDocument = require('pdfkit');

const User = require("../models/usermodel");
const Product = require("../models/productModel");
const Category = require("../models/category");

const Order = require("../models/orderModel");
const Coupon = require("../models/couponmodel");
const banner = require('../models/bannermodel')
const ordaraddress = require("../models/address");


const randomstring = require("randomstring");
const moment = require("moment");

const config = require("../config/config");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

const nodemailer = require("nodemailer");

const bcrypt = require("bcrypt");
const { name } = require("ejs");
const { render } = require("../routes/userRoute");
const address = require("../models/address");

var saavedOtp;
var naame;
var emaill;
var moobile;
var paassword;

function generateOTP() {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10);
  }

  return otp;
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error.message);
  }
};

//login user methods started
const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifylogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    console.log(userData);
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_varified == 0) {
          res.render("login", { message: "Please verify your mail" });
        }else if(userData.block== true) {
         
          res.render("login", { message: "Your account is blocked.Please contact customer care" });
        }else{
          req.session.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("login", { message: "Email are password incorrect" });
      }
    } else {
      res.render("login", { message: "Email password incorrect" });
    }
  } catch (error) {
    console.log(error, message);
  }
};

//registration
const directhomepage = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,

      password: spassword,
      is_admin: 0,
    });
    const userData = await user.save();
    if (userData) {
      res.render("/home");
    } else {
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadhome = async (req, res) => {
  try {
    const userData = req.session.user_id;

    const productData = await Product.find();
    const bannerData = await banner.find();
    res.render("home", { products: productData, userData: userData , banner:bannerData});
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy();
   
    res.redirect("/login");

  } catch (error) {
    console.log(error.message);
  }
};
//user profile edeit & update
const editLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render("edit", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};



const loadshop = async (req, res) => {
  try {
    const id = req.query.id;
    let filter = { isDeleted: false };
    if (id) {
      filter.category = id;
    }

    const userData = await User.findById({ _id: req.session.user_id });
    const cartcount = userData.cart;
    const length = cartcount.length;
    console.log("cartcount" + length);

    var page = 1;
    if(req.query.page){
      page = req.query.page;
    }

    const limit = 6;

    let sort = { }; // Default sorting
    if (req.query.name) {
      const sortBy = req.query.name;
      switch (sortBy) {
        case "priceLowToHigh":
          console.log("price low to high")
          sort = { price: -1 };
          break;
        case "priceHighToLow":
          sort = { price: 1 };
          break;
        default:
          sort = { price: -1 };
          break;
      }
    }

    let searchQuery = {};
    if (req.query.search) {
      searchQuery = {
        $or: [
          { productName: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
          { description: { $regex: `.*${req.query.search}.*`, $options: 'i' } }
        ]
      };
    }
    if (id) {
      searchQuery.category = id;
    }

    const productData = await Product.find({ $and: [filter, searchQuery] })
      .populate('category')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const count = await Product.find({ $and: [filter, searchQuery] }).countDocuments();

    const categoryData = await Category.find();

    if (req.xhr) { // Check if the request is an AJAX request
      res.json({ // Send the JSON data to the client
        products: productData,
        totalpage: Math.ceil(count / limit),
        currentpage: page,
        sortBy: req.query.sortBy || "priceLowToHigh", // Pass the selected sort option to the view
        search: req.query.search || '' // Pass the search query to the view
      });
    } else {
      // Render the HTML page normally for non-AJAX requests
      res.render("shop", {
        products: productData,
        category: categoryData,
        userData: userData,
        length,
        totalpage: Math.ceil(count / limit),
        currentpage: page,
        category_id: id, // Pass the category ID to the view
        sortBy: req.query.sortBy || "priceLowToHigh", // Pass the selected sort option to the view
        search: req.query.search || '' // Pass the search query to the view
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};



const loadproductdetails = async (req, res) => {
  try {
    const id = req.query.id;
    const productName = req.query.productName;
    const productData = await Product.find({
      $or: [{ _id: id }, { productName: productName }],
    });
    const userData = await User.findById({ _id: req.session.user_id });
    const cartcount = userData.cart;
    const lenght = cartcount.length;
    console.log("cartcount" + lenght);

    res.render("product-details", { products: productData, lenght });
  } catch (error) {
    console.log(error.message);
  }
};

const OTPLOAD = async (req, res) => {
  console.log("kkkkkkkkkkkkkkkkkkkk")
  try {
    console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm")
    const otp = generateOTP();
    
    console.log(otp);
    req.session.otp = otp; // Store OTP in session
    naame = req.body.name;
    emaill = req.body.email;
    moobile = req.body.mobile;
     paassword = req.body.password;
   


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: emaill,
      subject: "OTP for Sign In",
      text: `Your OTP is ${otp}. Please don't share it with anyone.`,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email has been sent: ", info.response);
    console.log("mnnnnnnnnnnnnnnnnnjdhhhhhhhhhhhhhhhhhhhhhhhhhhhhh")
    res.render("otp");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error sending OTP");
  }
};

const verifyOtp = async (req, res) => {
  const otp = req.body.otp;
  const storedOtp = req.session.otp;
  console.log("i am here");
  if (otp == storedOtp) {
    console.log("OTP verified");
    const name = naame;
    const email = emaill;
    const mobile = moobile;
    const password = paassword;

    const userEmail = await User.findOne({ email: email });
    if (!userEmail) {
      const hashedPassword = await securePassword(password);
      const user = new User({
        name,
        email,
        mobile,
        password: hashedPassword,
        blockStatus: false,
        is_admin: 0,
      });
      const userData = await user.save();
      console.log(userData);
      if (userData) {
        res.render("login", {
          message: "Your registration has been successful,Please verify your mail..",
        });
      } else {
        res.render("signup", { message: "Your registration has been failed" });
      }
    } else {
      res.render("signup", { message: "Entered Email is already Exists" });
    }
  } else {
    res.render("otp", { error: "Invalid OTP", name, email, mobile, password });
  }
};

const secondlogin = async (req, res) => {
  try {
    res.render("userlogin");
  } catch (error) {
    console.log(error.message);
  }
};

const loaduserprofile = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const id = req.query.id;

    const userAddress = await User.findOne({
      Address: { $elemMatch: { _id: id } },
    });

    res.render("userprofile", { userData: userData, Address: userAddress });
  } catch (error) {
    console.log(error.message);
  }
};

//for reset password send mail

//for send mail
const sendResetPasswordMail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "For reset Password",
      html:
        "<p>Hii, please click here to <a href=http://127.0.0.1:3000/mailreset?token="+token+">Reset</a> your password</p>"
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent :-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

//froget pass word code start
const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const randomString = randomstring.generate();
      const updatedData = await User.updateOne(
        { email: email },
        { $set: { token: randomString } }
      );
      sendResetPasswordMail(userData.email, randomString);
      res.render("forget", {
        message: "Please check your mail to Reset your password.",
      });
    } else {
      res.render("forget", { message: "Email is incorrect , user not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//froget password load
const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("mailreset", { user_id: tokenData._id });
    } else {
      res.render("404");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const postnewpassword=async(req,res)=>{
  try{
    const password = await securePassword( req.body.password,);
    const userData = await User.findByIdAndUpdate(
      { _id: req.query.id},
      {
        $set: {
          password: password,
         
        },
      }
    );
if(userData){
  res.redirect("/login")
}
  }catch(error){
    console.log(error.message);
  }
}

const loadeditaddress = async (req, res) => {
  try {
    res.render("profileeditaddress");
  } catch (error) {
    console.log(error.message);
  }
};

//edit the user profile address
const posteditaddress = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("testing delete num" + id);
    const userId = req.session.user_id;

    const updateResult = await User.updateOne(
      {
        _id: userId,
        "Address._id": id,
      },
      {
        $set: {
          "Address.$.name": req.body.name,
          "Address.$.country": req.body.country,
          "Address.$.address": req.body.address,
          "Address.$.city": req.body.city,
          "Address.$.state": req.body.state,
          "Address.$.postcode": req.body.postcode,
          "Address.$.phone": req.body.phone,
          "Address.$.email": req.body.email,
        },
      }
    );

    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};

//delete the user profile address
const loaddeleteaddress = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("testing delete num" + id);
    const userId = req.session.user_id;

    const updateResult = await User.updateOne(
      {
        _id: userId,
        "Address._id": id,
      },
      {
        $pull: {
          Address: { _id: id },
        },
      }
    );
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};

const loadaddaddress = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("addaddress", { user: userData });
    } else {
      res.redirect("/userprofile");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const postaddaddress = async (req, res) => {
  try {
    const id = req.query.id;
    const addaddress = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { address: req.body.address } }
    );
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};

//add to cart
const addtocart = async (req, res) => {
  try {
    const abc = req.body.productId;
    const cartData = await User.updateOne(
      {
        _id: req.session.user_id,
      },
      {
        $addToSet: {
          cart: {
            productId: abc,
          },
        },
      }
    );

    res.json({
      res: "success"
    
    });
  } catch (error) {
    console.log(error.message);
  }
};




//load the cart page
const loadcart = async (req, res) => {
  try {
    const userData = req.session.user_id;

    const cartData = await User.aggregate([
      { $match: { _id: new ObjectId(userData) } },
      {
        $lookup: {
          from: "products",
          let: { cartItems: { $ifNull: ["$cart", []] } },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$cartItems.productId"] } } },
            {
              $project: {
                _id: 1,
                productName: 1,
                price: 1,
                img1: 1,
                stock: 1,
                quantity: {
                  $arrayElemAt: [
                    "$$cartItems.quantity",
                    { $indexOfArray: ["$$cartItems.productId", "$_id"] }
                  ]
                }
              }
            }
          ],
          as: "productcartData",
        },
      },
    ]);
    
   
    const productDat = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "products",
        },
      },
    ]);
    console.log("second reached");

    const cartProducts = cartData[0].productcartData;
   
    let subtotal = 0;
    cartProducts.forEach((cartProduct) => {
      subtotal = subtotal + Number(cartProduct.price);
    });

    const length = cartProducts.length;
    const cartlenght = req.session.length;
    console.log(subtotal);
    console.log(length);

    res.render("cart", {
      cartProducts,
      subtotal,
      length,
      cartData
    });
  } catch (error) {
    console.log(error.message);
  }
};


const postcart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.productId;
    const quantity = parseInt(req.body.quantityss);
     
      const stocks=await Product.findOne({_id:productId})
     
console.log("stock checking"+stocks.stock)
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const cartItem = user.cart.find(item => item.productId.toString() === productId);
    
    if (!cartItem) {
      throw new Error('Product not found in cart');
    }
     
    const currentQuantity = parseInt(cartItem.quantity);
      
      const newQuantity = currentQuantity + quantity;
    
    if (newQuantity < 1) {
      throw new Error('Quantity cannot be negative');
    }
    if(stocks.stock>=newQuantity){
    const updateResult = await User.updateOne(
      {
        _id: userId,
        "cart.productId": productId,
      },
      {
        $set: {
          "cart.$.quantity": newQuantity.toString(),
        },
      }
    );
    }

    if (updateResult.nModified === 0) {
      throw new Error('Update failed');
    }

    res.send({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ success: false, message: error.message });
  }
};

//delete cart items
const removeCartProduct = async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(
      { _id: req.session.user_id },
      {
        $pull: {
          cart: {
            productId: req.body.addressId,
          },
        },
      },
    );

    if (result) {
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ success: false });
  }
};



  


//load checkout page
const loadcheckout = async (req, res) => {
  try {
    res.render("checkout");
  } catch (error) {
    console.log(error.message);
  }
};

const postcheckout = async (req, res) => {
  try {
    const address = await User.findByIdAndUpdate(
      {
        _id: req.session.user_id,
      },
      {
        $addToSet: {
          Address: req.body,
        },
      }
    );
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};

//load order page
const quantitys=[];

const postcheckoutpage = async (req, res) => {
  try {
    const address = await User.find({ _id: req.session.user_id }).lean();
    const cartData = await User.aggregate([
      {
        $match: { _id: new ObjectId(req.session.user_id) },
      },
      {
        $lookup: {
          from: "products",
          let: { cartItems: "$cart" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$cartItems.productId"] } } },
          ],
          as: "Cartproducts",
        },
      },
    ]);
    let subtotal = 0;

    const cartProducts = cartData[0].Cartproducts;
    cartProducts.map((cartProduct, i) => {
      cartProduct.quantity = req.body.quantity[i];
      subtotal = subtotal + cartProduct.price * req.body.quantity[i];
      quantitys[i]=req.body.quantity[i];
    });
    
   
    res.render("checkoutpage", {
      productDetails: cartData[0].Cartproducts,
      subtotal: subtotal,
      address: address[0].Address,
      logged: 1,
      total: subtotal,
      offer: 0,
    });
  } catch (error) {
    console.log(error);
  }
};


//load checkout page
const loadcheckoutpage = async (req, res) => {
  try {
    const address = await User.find({ _id: req.session.user_id }).lean();
    const cartData = await User.aggregate([
      {
        $match: { _id: new ObjectId(req.session.user_id) },
      },
      {
        $lookup: {
          from: "products",
          let: { cartItems: "$cart" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$cartItems.productId"] } } },
          ],
          as: "Cartproducts",
        },
      },
    ]);
    let subtotal = 0;

    const cartProducts = cartData[0].Cartproducts;
    cartProducts.map((cartProduct, i) => {
      cartProduct.quantity =quantitys[i];
      subtotal = subtotal + cartProduct.price *quantitys[i];
      
    });
    
    console.log("temperarry quantity store"+req.session.storquantity)
    res.render("checkoutpage", {
      productDetails: cartData[0].Cartproducts,
      subtotal: subtotal,
      address: address[0].Address,
      logged: 1,
      total: subtotal,
      offer: 0,
    });
  } catch (error) {
    console.log(error);
  }
};



const loadaddnewaddresscheckoutpage=async(req,res)=>{
  try{
    res.render("addadresscheckoutpage")

  }catch(error){
    console.log(error.message)
  }
}



const addnewaddresscheckoutpage = async (req, res) => {
  try {
    const addres = await User.findByIdAndUpdate(
      {
        _id: req.session.user_id,
      },
      {
        $addToSet: {
          Address: req.body,
        },
      }
    );
    if(addres){
      res.redirect("/checkoutpage")
    }
   
  } catch (error) {
    console.log(error);
  }
};

const removeaddresscheckoutpage = async(req,res)=>{
try{
  const id = req.body.addressId;
    console.log("testing delete num" + id);
    const userId = req.session.user_id;

    const updateResult = await User.updateOne(
      {
        _id: userId,
        "Address._id": id,
      },
      {
        $pull: {
          Address: { _id: id },
        },
      }
    )
    res.json({
      res: "success"
    
    });
}catch(error){
  console.log(error.message)
}
}

const loadeditaddresscheckoutpage=async(req,res)=>{
  try{
 
    id=req.query.id;
    const userAddress = await User.findOne({Address:{$elemMatch:{_id:id}}},{"Address.$":1,_id:0});
    
  console.log("edite address cheching"+userAddress)
    res.render("edit-address-checkout",{address:userAddress})

  }catch(error){
    console.log(error.message);
  }
}

const posteditaddresscheckoutpage =async(req,res)=>{
  try{
    const id = req.query.id;
    console.log("testing delete num" + id);
    const userId = req.session.user_id;

    const updateResult = await User.updateOne(
      {
        _id: userId,
        "Address._id": id,
      },
      {
        $set: {
          "Address.$.name": req.body.name,
          "Address.$.country": req.body.country,
          "Address.$.address": req.body.address,
          "Address.$.city": req.body.city,
          "Address.$.state": req.body.state,
          "Address.$.postcode": req.body.postcode,
          "Address.$.phone": req.body.phone,
          "Address.$.email": req.body.email,
        },
      }
    );

    res.redirect("/checkoutpage");

  }catch(error){
    console.log(error.message);
  }
}




const placeOrder = async (req, res) => {
  try {
    const {
      productid,
      productname,
      price,
      quantity,
      addressId,
      payment,
      subtotal,
    } = req.body;

    const result = Math.random().toString(36).substring(2, 7);
    const id = Math.floor(100000 + Math.random() * 900000);
    const orderId = result + id;

    const date = new Date();

    const organiproduct = productid.map((item, i) => ({
      id: productid[i],
      name: productname[i],
      price: price[i],
      quantity: quantity[i],
    }));

    let data = {
      userId: new ObjectId(req.session.user_id),
      product: organiproduct,
      orderId: orderId,
      date: date,
      status: "processing",
      payment_method: String(payment),
      addressId: addressId,
      subtotal: subtotal,
    };

    const orderPlacement = await Order.insertMany(data);

    if (!orderPlacement) {
      throw new Error("Error placing order");
    }

    const clearCart = await User.updateOne(
      {
        _id: req.session.user_id,
      },
      {
        $set: {
          cart: [],
        },
      }
    );

    if (!clearCart) {
      throw new Error("Error clearing cart");
    }

    quantity.forEach(async (item, i) => {
      const reduceStock = await Product.updateOne(
        {
          _id: new ObjectId(productid[i]),
        },
        {
          $inc: {
            stock: -Number(item),
          },
        }
      );

      if (!reduceStock) {
        throw new Error("Error reducing stock");
      }
    });

    req.session.page = "fghnjm";

    res.json({
      res: "success",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.json("try again");
  }
};

const successorder = async (req, res, next) => {
  try {
    if (req.session.page) {
      delete req.session.page;
      const orderData = await Order.find({}).sort({ _id: -1 }).limit(1);
      console.log(orderData);
      res.render("successorder", { logged: 1, order: orderData });
    } else {
      res.redirect("/");
    }
  } catch (error) {}
};

const loadOrder = async (req, res) => {
  try {
    const orderData = await Order.find({ userId: req.session.user_id }).sort({
      _id: -1,
    });
    res.render("myOrders", { order: orderData });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const id = req.query.id;
    const orderData = await Order.findById({ _id: id }).lean();
    const pID = orderData.product;
    pID.forEach(async (elem, i) => {
      const reduceStock = await Product.updateOne(
        { _id: elem.id },
        {
          $inc: {
            quantity: +elem.quantity,
          },
        }
      );
    });

    await User.updateOne(
      { _id: req.session.user_id },
      { $inc: { wallet:orderData.subtotal} }
    );
    
    if (orderData.status === "Delivered") {
      const returnOrder = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "Returned",
          },
        }
      );
    } else if (orderData.status === "processing") {
      const CancelOrder = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "Cancelled",
          },
        }
      );
    } else if (orderData.status === "Shipped") {
      const CancelOrder = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "Cancelled",
          },
        }
      );
    }
    res.redirect("/order");
  } catch (error) {
    console.log(error);
  }
};

const loadSingleOrder = async (req, res) => {
  try {
    const orderData = await Order.find({ orderId: req.query.id }).lean();
    // const pID=orderData[0].product[0].id
    // console.log(pID,"line 17 orderController")
    res.render("singleorder", { order: orderData }); //pwer:pID
  } catch (error) {
    console.log(error);
  }
};

let offerPrice;
const coupon = async (req, res, next) => {
  try {
    const codeId = req.body.code;
    const total = req.body.total;
    const couponData = await Coupon.findOne({ code: codeId }).lean();
   
    const userData = await Coupon.findOne({
      code: codeId,
      userId: req.session.user_id,
    }).lean();

    let minamount=100;
    let maxamount=1000;

    if (couponData && couponData.date > moment().format("YYYY-MM-DD")) {
      offerPrice = couponData.percentage;
      console.log("jhbaksjdjlhbsd");

      if (userData) {
        res.json("fail");
      } else {
        if(total>=minamount){


         if(total<=maxamount){
          const amount = (total * offerPrice) / 100;
        var gtotal = total - amount;
         
              

         }else{
          const amount = (1000 * offerPrice) / 100;
          var gtotal = total - amount;
        
         }


        }else{
         gtotal=amount;
         
        }

        if(total<100){
res.render("checkoutpage",{message:"please buy more than"})
        }
        
        console.log("after coupon" + gtotal);
        res.json({ offerPrice: offerPrice,gtotal:gtotal});
        const userupdate = await Coupon.updateOne(
          { code: codeId },
          { $push: { userId: req.session.user_id } }
        );
      }
    } else {
      res.json("fail");
    }
  } catch (error) {
    next(error);
  }
};

const addtowishlist = async (req, res) => {
  try {

    const abc = req.body.productId;
    const cartData = await User.updateOne(
      {
        _id: req.session.user_id,
      },
      {
        $addToSet: {
          wishlist: {
            productId: abc,
          },
        },
      }
    );

    res.json({
      res: "success"
    
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadwishlist = async (req, res) => {
  try {
    const userData = req.session.user_id;

    const wishlistData = await User.aggregate([
      { $match: { _id: new ObjectId(userData) } },
      {
        $lookup: {
          from: "products",
          localField: "wishlist.productId",
          foreignField: "_id",
          as: "productcartData",
        },
      },
    ]);

    const wishlistProducts = wishlistData[0]?.productcartData || [];
    const subtotal = wishlistProducts.reduce(
      (acc, wishlistProduct) => acc + Number(wishlistProduct.price),
      0
    );
    const length = wishlistProducts.length;
    const cartlength = req.session.length;
    
    res.render("wishlist", {
      wishlistProducts,
      subtotal,
      length,
      cartlength,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


const removeproductinwishlist=async(req,res)=>{
  try{
    const data= await User.findByIdAndUpdate(
      { _id: req.session.user_id },
      {
        $pull: {
          wishlist: {
            productId: req.body.productId,
          },
        },
      },
    );

    res.json({
      res: "success"
    
    });

  }catch(error){
    console.log(error.message);
  }
}

const addtocartinwishlist = async (req, res) => {
  try {
    const abc = req.body.productId;
    const cartData = await User.updateOne(
      {
        _id: req.session.user_id,
      },
      {
        $addToSet: {
          cart: {
            productId: abc,
          },
        },
      }
    );


    if(cartData){
      const result = await User.findByIdAndUpdate({
        _id: req.session.user_id
    }, {
        $pull: {
          wishlist: {
                productId:abc
            }
        }
    });

    }

    res.json({
      res: "success"
    
    });
   
  } catch (error) {
    console.log(error.message);
  }
};



const invoiceDownload = async (req, res) => {
  try {
    
    const order = await Order.findOne({ orderId:req.query.id });

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Create a new PDF document
    const doc = new PDFDocument({ font: 'Helvetica' });

    // Set the response headers for downloading the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderId}.pdf"`);

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add the order details to the PDF document
    doc.fontSize(18).text(`OGANI INVOICE`,{ align: 'center' })
    doc.moveDown();
    doc.moveDown();
    doc.fontSize(16).text(`Order Summary - Order ID: ${order.orderId}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Product Name', { width: 200, continued: true });
    doc.fontSize(12).text('Price', { width: 100, align: 'center', continued: true });
    doc.fontSize(12).text('Qty', { width: 50, align: 'right' });
    doc.moveDown();
    
    let totalPrice = 0;
    order.product.forEach((product, index) => {
      doc.fontSize(12).text(`${index + 1}. ${product.name}`, { width: 200, continued: true });
      const totalCost = product.price * product.quantity;
      doc.fontSize(12).text(`${totalCost}`, { width: 100, align: 'center', continued: true });
    
      doc.fontSize(12).text(`${product.quantity}`, { width: 50, align: 'right' });
      doc.moveDown();
      totalPrice += totalCost;
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ${totalPrice}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(12).text(`Total Amount with discount: ${order.total}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(12).text(`Ordered Date: ${order.date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})} ${order.date.toLocaleTimeString('en-US', {hour: 'numeric', minute:'numeric'})}`);
    doc.moveDown();
    doc.fontSize(12).text(`Payment Method: ${order.payment_method === '1' ? 'Cash on Delivery' : 'Razor Pay'}`);
    doc.moveDown();
    doc.fontSize(12).text(`Shipping Address: ${order.addressId}`);
    doc.moveDown();
    doc.fontSize(12).text(`Order Status: ${order.status}`);
    
    // Add a "Thank you" message at the end of the invoice
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.fontSize(14).text('Thank you for purchasing with us!', { align: 'center' });

    // End the PDF document
    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  loadRegister,
  loginLoad,
  verifylogin,
  loadhome,
  userLogout,
  editLoad,
  // updateProfile,
  directhomepage,
  loadshop,
  loadproductdetails,
  OTPLOAD,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  postnewpassword,

  sendResetPasswordMail,
  verifyOtp,
  secondlogin,
  loaduserprofile,
  posteditaddress,
  loadaddaddress,
  loadeditaddress,
  postaddaddress,
  loaddeleteaddress,
  addtocart,
  addtocartinwishlist,
  loadcart,
  postcart,
  removeCartProduct,
  loadcheckout,
  postcheckout,

  postcheckoutpage,
  loadcheckoutpage,
  loadaddnewaddresscheckoutpage,
  addnewaddresscheckoutpage,
  removeaddresscheckoutpage ,
  loadeditaddresscheckoutpage,
  posteditaddresscheckoutpage,
  placeOrder,
  successorder,
  loadOrder,
  cancelOrder,
  loadSingleOrder,
  coupon,
  addtowishlist,
  loadwishlist,
  removeproductinwishlist,
  invoiceDownload
};

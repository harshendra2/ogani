const User = require("../models/usermodel");
const Product = require("../models/productModel");
const Category = require("../models/category");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponmodel");
const banner = require('../models/bannermodel')
const bcrypt = require("bcrypt");
const { response } = require("../routes/userRoute");
const ObjectId = require("mongodb").ObjectId;
const moment = require("moment");
//const {findById}= require("../models/usermodel")
//const randomstring =require ('randomstring');

//for send mail
const addUserMail = async (name, email, password, admin_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "appu.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: defaultConfiguration.emailUser,
        pass: defaultConfiguration.emailPassword,
      },
    });
    const mailOption = {
      from: config.emailUser,
      to: email,
      subject: "Admin add you and your mail",
      html:
        "<p>Hii " +
        name +
        ',please click here to <a href="http://127.0.0.1:27017/verify?id=' +
        admin_id +
        '">Verify</a> your mail.</p> <br> <b>Email:-</b>' +
        email +
        "<b><b>Password:-</b>" +
        password +
        "",
    };
    transporter.senMail(mailOption, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin == 1) {
          res.render("login", { message: "Email and password is incorrect" });
        } else {
          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", { message: "Email and Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and Password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const orderData = await Order.find({}).sort({
      _id: -1,
    });
    
    
    res.render("home", { adminlog: 1, order: orderData })
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.admin_id = false;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
const adminDashboard = async (req, res) => {
  try {
    const userData = await User.find({ is_admin: 0 });

    res.render("dashboard", { users: userData });
  } catch (error) {
    console.log(error.message);
  }
};
//edite functionality
const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit-user", { user: userData });
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const updateUsers = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          is_varified: req.body.verify,
        },
      }
    );
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

//delete users
const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.deleteOne({ _id: id });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const newUserLoad = async (req, res) => {
  try {
    res.render("new-user");
  } catch (error) {
    console.log(error.message);
  }
};

const blockuser = async (req, res) => {
  const id = req.query.id;

  req.session.adminMessage = "";
  User.findByIdAndUpdate({ _id: id }, { $set: { blockStatus: true } })
    .then((response) => {
      const message = "User blocked successfully";
      req.session.adminMessage = message;
      res.json(response);
      res.redirect("/admin/dashboard");
    })
    .catch((err) => {
      console.log(err.message);
    });
};

const unblockuser = async (req, res) => {
  const id = req.query.id;

  req.session.adminMessage = "";
  User.findByIdAndUpdate({ _id: id }, { $set: { blockStatus: false } })
    .then((response) => {
      const message = "User blocked successfully";
      req.session.adminMessage = message;
      res.json(response);
      res.redirect("/admin/dashboard");
    })
    .catch((err) => {
      console.log(err.message);
    });
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const addUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const password = req.body.password;

    //const password =randomstring.generate(8);

    const spassword = await securePassword(password);

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      password: spassword,
      is_admin: 0,
    });
    const userData = await user.save();
    if (userData) {
      //addUserMail(name,email,password,userData._id)
      res.redirect("/admin/dashboard");
    } else {
      res.render("new-user", { message: "Something wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadproducts = async (req, res) => {
  try {
    
    const productData = await Product.find();
    res.render("products", { products: productData });
  } catch (error) {
    console.log(error.message);
  }
};
const newproductLoad = async (req, res) => {
  try {
    const productData = await Product.findById();
    const categoryData = await Category.find();
    res.render("new-product",{product:productData,categoryData:categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const addproduct = async (req, res) => {
  const images = req.files.map((file) => {
    return file.filename;
  });
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  if (
    req.body.name != "" &&
    req.body.price != "" &&
    req.body.description != "" &&
    req.body.stock != ""&&
    req.body.category!=""&&
    req.body.rating !=""&&
    req.body.numReviews !=""

  ) {
    const productData = new Product({
      productName: req.body.name,
      price: req.body.price,
      description: req.body.description,
      stock: req.body.stock,
      img1: images,
      category: req.body.category,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isDeleted: false,
    });
    productData
      .save()
      .then(() => {
        res.redirect("/admin/products");
      })
      
  } else {
    const message = "fields don't be blank";
    req.session.messager = message;
   
    res.redirect(`/admin/new-product?messagge=${message}`)
    res.re;
  }
};

//edite functionality
const editproductLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });
    const categoryData = await Category.find();
    console.log("category data this appu"+ categoryData);
    if (productData) {
      res.render("edit-product",{product:productData,categoryData:categoryData });
    } else {
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const updateproduct = async (req, res) => {
  const images=req.files.map((file)=>{
    return file.filename
  })
  const id = req.query.id;
  const updation = {
    $set: {
      productName: req.body.name,
      price: req.body.price,
      description: req.body.description,
      stock: req.body.stock,
      category: req.body.category,
      brand: req.body.brand,
      numReviews: req.body.numReviews,
      rating: req.body.rating,
      
    },
  };
  if (images.length>0) {
    updation.$push = { img1: { $each: images } };
  }
  

  try {
    await Product.updateOne({ _id: id }, updation);
    res.redirect("/admin/products");
  } catch (err) {
    console.log(err.message);
  }
};

const deletproducts = async (req, res) => {
  try {
    const id = req.body.productId;
    console.log(id);
    await Product.deleteOne({ _id:id });
    res.json({
      res: "success"
    
    });
  } catch (error) {
    console.log(error.message);
  }
};


const deleteProductImage = async(req,res)=>{
  try {
    
    const product = await Product.findById(req.body.productId);
    console.log("delete image recied backend"+req.body.productId)
    if (!product) {
      
      return res.status(404).json({ message: "Product not found"})
    }
    const index = product.img1.findIndex(img => img === req.body.imageId);
    console.log("its reched seconde line");
    if (index !== -1) {
      product.img1.splice(index, 1);
      await product.save();
    }
    res.json({
      res: "success"
    
    });
  } catch (error) {
    console.log(error.message);
  }
}

const blockUseruser = async (req, res) => {
  try {
    const id = req.body.id;

    const block = await User.findById(id);
    if (block.block) {
      const userData = await User.findByIdAndUpdate(id, {
        $set: {
          block: false,
        },
      });
    } else {
      const userData = await User.findByIdAndUpdate(id, {
        $set: {
          block: true,
        },
      });
      req.session.user_id = false;
    }

    res.redirect("/admin/user_list");
  } catch (error) {
    console.log(error.message);
  }
};

const loadcategory = async (req, res) => {
  try {
    res.render("category", { message: req.session.messager });
  } catch (error) {
    console.log(error.message);
  }
};

const postcategory = async (req, res) => {
  if (req.body.name && req.body.icon && req.body.color) {
    const category = new Category({
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    });
   const categoryData = await category.save();
    if (categoryData) {
      req.session.messager = "";
      res.redirect("/admin/categorylist");
    }
  }else if(req.body.name == " "||req.body.icon==" "||req.body.color ==" ") {
    const message = "fields don't be blank";
    req.session.messager = message;
    res.redirect(`/admin/add-category?message=${message}`);
  }else{
    const message = "fields don't be blank";
    req.session.messager = message;
    res.redirect(`/admin/add-category?message=${message}`);
  }
};

const loadcategorylist = async (req, res) => {
  try {
    const id = req.query.id;

    let filter = {};
    filter = { category: id };
    const productss = await Product.find(filter).populate("category");
    console.log("harshendra raja aprk" + productss);

    const categoryData = await Category.find();
    if (categoryData) {
      res.render("categorylist", { Category: categoryData, productss });
    } else {
      res.render("categorylist");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deletecategory = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    await Category.deleteOne({ _id: id });
    res.redirect("/admin/categorylist");
  } catch (error) {
    console.log(error.message);
  }
};

const blockCategory = async (req, res) => {
  try {
    const id = req.body.id;

    const block = await Category.findById(id);
    if (block.block) {
      const CategoryData = await Category.findByIdAndUpdate(id, {
        $set: {
          block: false,
        },
      });
    } else {
      const CategoryData = await Category.findByIdAndUpdate(id, {
        $set: {
          block: true,
        },
      });
    }
    
  
    res.json({
      res: "success"
    
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadeditcategory = async (req, res) => {
  try {
    const id =req.query.id;
    const categoryData = await Category.findById({ _id: id });
    if (categoryData) {
      res.render("edit-categary", { category: categoryData });
    } else {
      res.redirect("/admin/categorylist");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const posteditcategory = async (req, res) => {
  try {
    const id = req.query.id;
   
   
    console.log("edite user address" + id);
    if(req.body.name&& req.body.icon&&req.body.color){
    const categoryData = await Category.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: req.body.name,
          icon: req.body.icon,
          color: req.body.color,
        },
      }
    );
    if(categoryData){
    res.redirect("/admin/categorylist");
    }
    }else if(req.body.name==""||req.body.icon==""||req.body.color==""){
      const categoryData = await Category.findByIdAndUpdate(
        { _id: id })
      res.render("edit-categary",{message:"fields don't be blank",category:categoryData})
      
      
    }else{
      const categoryData = await Category.findByIdAndUpdate(
        { _id: id })
      res.render("edit-categary",{message:"fields don't be blank",category:categoryData})
    }
  } catch (error) {
    console.log(error.message);
  }
};

const orderList = async (req, res) => {
  try {
    const orderData = await Order.find({}).sort({ _id: -1 }).limit();

    res.render("order", { order: orderData });
  } catch (error) {
    console.log(error.message);
  }
};

//view product in the admin order management
const viewproduct = async (req, res) => {
  try {
    const id = req.query.id;
    const orderData = await Order.find({ _id: id });
    console.log("order view product" + orderData);

    res.render("orderviewproduct", { adminlog: 1, order: orderData });
  } catch (error) {
    console.log(error.message);
  }
};

// admin order
const changestatus = async (req, res) => {
  try {
    const id = req.query.id;
    const orderData = await Order.findOne({ _id: id });
    if (orderData.status === "processing") {
      const shipOrder = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "Shipped",
          },
        }
      );
    } else if (orderData.status === "Shipped") {
      const deliverOrder = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "Out for Delivery",
          },
        }
      );
    } else if (orderData.status === "Out for Delivery") {
      const deliverOrder = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "Delivered",
          },
        }
      );
    }
    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error.message);
  }
};

const loadcoupons = async (req, res) => {
  try {
    const couponData = await Coupon.find();

    res.render("coupon", { adminlog: true, coupon: couponData });
  } catch (error) {
    console.log(error);
  }
};

//add new coupon
const addCoupon = async (req, res) => {
  try {
    res.render("add-coupon", { adminlog: true });
  } catch (error) {
    console.log(error);
  }
};

const insertcoupon = async (req, res) => {
  try {
    const coupon = new Coupon({
      code: req.body.code,
      date: req.body.date,
      percentage: req.body.percent,
    });
    const couponData = await coupon.save();

    if (couponData) {
      res.redirect("/admin/coupon");
    } else {
      res.redirect("/admin/add-coupon");
    }
  } catch (error) {
    console.log(error);
  }
};

const removecoupon=async(req,res)=>{
  try{
    
    const id = req.body.couponId;
    console.log(id);
    await Coupon.deleteOne({ _id:id });
    res.json({
      res: "success"
    
    });
  }catch(error){
    console.log(error.message);
  }
}

const dashboardData = async (req,res,next) => {
  try {
    const orders = await Order.find();

    // Group orders by date and calculate total sales for each day
    const salesByDay = {};
    orders.forEach((order) => {
      const date = moment(order.date).format('YYYY-MM-DD');
      if (!salesByDay[date]) {
        salesByDay[date] = 0;
      }
      order.product.forEach((product) => {
        salesByDay[date] += product.price * product.quantity;
      });
    });

    // Create the data for the line graph
    const data = {
      labels: Object.keys(salesByDay),
      datasets: [
        {
          label: 'Sales',
          data: Object.values(salesByDay),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };


    //Bar chart
    const Cancelorder = await Order.aggregate([
      {
        $match: {
          $or: [
            {
              status: "Returned",
            },
            {
              status: "Delivered",
            },
            {
              status: "Cancelled",
            },
          ],
        },
      },
      {
        $group: {
          _id: {
            status: "$status",
            date: {
              $month: "$date",
            },
          },
          sum: {
            $sum: 1,
          },
        },
      },
    ]);

    let months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    let Delivered = [];
    let delivered = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let Returned = [];
    let returned = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let Cancelled = [];
    let cancelled = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    Cancelorder.forEach((item) => {
      if (item._id.status == "Delivered") Delivered.push(item);

      if (item._id.status == "Returned") Returned.push(item);

      if (item._id.status == "Cancelled") Cancelled.push(item);
    });

    for (let index = 0; index < 12; index++) {
      months.forEach((item) => {
        if (Delivered[index]) {
          if (item == Delivered[index]._id.date)
            delivered[item - 1] = Delivered[index].sum;
        }

        if (Returned[index]) {
          if (item == Returned[index]._id.date)
            returned[item - 1] = Returned[index].sum;
        }

        if (Cancelled[index]) {
          if (item == Cancelled[index]._id.date)
            cancelled[item - 1] = Cancelled[index].sum;
        }
      });
    }



    // yearly and monthly chart
    const monthlyOrders = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          count: 1
        }
      }
    ]);

    const yearlyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $year: "$date" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          count: 1
        }
      }
    ]);

    
    // Send the data as JSON
    res.json(
      {chart:{delivered,
        cancelled,
        returned},
       data:data,
       monthlyOrders:monthlyOrders,
       yearlyOrders:yearlyOrders
       }

      );

  } catch (error) {
    console.error(error);
    next(error);
    res.status(500).send('Server error');
  }
};

const salesreport=async(req,res)=>{
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    const orders = await Order.find({ date: { $gte: startDate, $lte: endDate } }).lean();

    const orderData = [];
    const productData = [];

    orders.forEach(order => {
      const { orderId, date, payment_method, status, subtotal } = order;

      orderData.push({ orderId, date, payment_method, status, subtotal });

      order.product.forEach(product => {
        const { id, name, price, quantity } = product;

        productData.push({ orderId, id, name, price, quantity });
      });
    });

    res.json({ orders: orderData, products: productData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve sales report data' });
  }
}











const loadBanner = async (req, res) => {

    try {
        const bannerData = await banner.find({})
        res.render('banner', { banner: bannerData, adminlog: 1 });
    } catch (error) {
        console.log(error);
    }
}

const loadaddBanner = async (req, res) => {

    try {
        res.render('add-banner', { adminlog: 1 });
    } catch (error) {
        console.log(error);
    }
}

const insertBanner = async (req, res) => {

    try {
      const images = req.files.map((file) => {
        return file.filename;
      });
        const Banner = new banner({

            name: req.body.name,
            image:images
        });

        const bannerData = await Banner.save();
        res.redirect('/admin/banner');
    } catch (error) {
        console.log(error);
    }
}


const deleteBanner = async (req, res) => {
  try {

    const banners = req.body.banner
    const deletebanner = await banner.findByIdAndDelete({_id:banners})

    if (deletebanner) {
      res.json('success')
    }

  } catch (error) {
    console.log(error.message);
  }
}


module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  adminDashboard,
  editUserLoad,
  updateUsers,
  deleteUser,
  newUserLoad,
  addUser,
  blockuser,
  loadproducts,
  newproductLoad,
  addproduct,
  unblockuser,
  editproductLoad,
  updateproduct,
  deleteProductImage,
  blockUseruser,
  loadcategory,
  postcategory,
  loadcategorylist,
  deletecategory,
  blockCategory,
  loadeditcategory,
  posteditcategory,
  deletproducts,
  orderList,
  viewproduct,
  changestatus,
  loadcoupons,
  addCoupon,
  insertcoupon,
  removecoupon,
  dashboardData,
  salesreport,
  loadBanner,
  loadaddBanner,
  insertBanner,
  deleteBanner
};

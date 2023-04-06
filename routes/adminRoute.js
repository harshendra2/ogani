const express = require("express");
const admin_route = express();
const session = require("express-session");
const config = require("../config/config");
admin_route.use(session({ secret: config.sessionSecret }));

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

const upload = require("../helpers/multer");

admin_route.use(express.static("public"));

const auth = require("../middleware/adminAuth");

const adminController = require("../controllers/adminController");

const path = require("path");
admin_route.use(express.static("public"));
admin_route.use("/css", express.static(__dirname + "public/css"));
admin_route.use("/img", express.static(__dirname + "public/img"));
admin_route.use("/fonts", express.static(__dirname + "public/fonts"));
admin_route.use("/js", express.static(__dirname + "public/js"));
admin_route.use("/sass", express.static(__dirname + "public/sass"));
const { isLogin } = require("../middleware/auth");

admin_route.get("/", auth.isLogout, adminController.loadLogin);

admin_route.post("/", adminController.verifyLogin);
admin_route.get("/home", auth.isLogin, adminController.loadDashboard);
admin_route.get("/dashboard", auth.isLogin, adminController.adminDashboard);

admin_route.get("/edit-user", auth.isLogin, adminController.editUserLoad);
admin_route.post("/blockuser", adminController.blockuser);
admin_route.post("/unblockuser", adminController.unblockuser);

admin_route.get("/products", auth.isLogin, adminController.loadproducts);
admin_route.get("/new-product", auth.isLogin, adminController.newproductLoad);
admin_route.post("/new-product", upload.array("image", 4),adminController.addproduct);
admin_route.get("/edit-product", auth.isLogin, adminController.editproductLoad);
admin_route.post("/edit-product",upload.array("image", 4), adminController.updateproduct);

admin_route.post('/deleteProductImage',adminController.deleteProductImage)



admin_route.post("/delete-product", adminController.deletproducts);
admin_route.post("/block_user", auth.isLogin, adminController.blockUseruser);
admin_route.get("/categorylist",auth.isLogin,adminController.loadcategorylist);
admin_route.get("/add-category", auth.isLogin, adminController.loadcategory);
admin_route.post("/add-category", auth.isLogin, adminController.postcategory);
admin_route.get("/delete-Category", adminController.deletecategory);
admin_route.post("/block_Category",auth.isLogin,adminController.blockCategory);
admin_route.get("/editcategory", adminController.loadeditcategory);
admin_route.post("/editcategory", adminController.posteditcategory);
admin_route.get("/Logout", auth.isLogin, adminController.logout);
admin_route.get("/orders", adminController.orderList);
admin_route.get("/view-product", adminController.viewproduct);
admin_route.get("/change-status", adminController.changestatus);
admin_route.get("/coupon", adminController.loadcoupons);
admin_route.get("/add-coupon", adminController.addCoupon);
admin_route.post("/add-coupon", adminController.insertcoupon);
admin_route.post("/removecoupon",auth.isLogin,adminController.removecoupon);
admin_route.get("/admin-dash", adminController.dashboardData);
admin_route.get("/salesreport",adminController.salesreport)

admin_route.get('/banner',adminController.loadBanner)
admin_route.get('/add-banner',adminController.loadaddBanner)
admin_route.post('/add-banner', upload.array("image",1),adminController.insertBanner);
admin_route.post('/removebanner',adminController.deleteBanner)																								

admin_route.get("*", function (req, res) {
  res.redirect("/admin");
});

module.exports = admin_route;

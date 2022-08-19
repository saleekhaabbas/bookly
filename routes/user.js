const express = require("express");
const { response } = require("../app");
const router = express.Router();
const userHelper = require("../helpers/user-helper");
const categoryHelpers = require("../helpers/category-helpers");
const twilio = require("twilio");
const twilioHelpers = require("../helpers/twilio-helper");
const twilioHelper = require("../helpers/twilio-helper");
const productHelper = require("../helpers/product-helper");
const moment=require("moment");
const bannerHelper = require("../helpers/banner-helper");
let userData;
const verifyLogin = (req, res, next) => {
  if (req.session.userloggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};
/* GET home page. */
router.get("/", async function (req, res, next) {
  let userData = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let wishCount=null;
  if(req.session.user){
    wishCount=await userHelper.getWishCount(req.session.user._id);
  }
  bannerHelper.getAllBanner().then((banner)=>{
  categoryHelpers.getAllCategory().then((category) => {
    res.render("user/user-page", {
      layout: "layout",
      user: true,
      userData,
      category,
      cartCount,
      wishCount,
      banner
    });
  });
})
});

router.get("/login", (req, res) => {
  if (req.session.userloggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", {
      layout: "layout",
      loginErr: req.session.loginErr,
    });
    req.session.loginErr = false;
  }
});

router.get("/signup", (req, res) => {
  if (req.session.userloggedIn) {
    res.redirect("/");
  } else {
    res.render("user/signup", { layout: "layout" });
    req.session.loginErr = false;
  }
});

router.get("/otp", (req, res) => {
  res.render("user/otp", { layout: "layout" });
});

router.get("/verifyotp", (req, res) => {
  res.render("user/verifyOtp", { layout: "layout", userData });
});

router.post("/otpmobile", (req, res) => {
  twilioHelper.dosms(req.body).then((data) => {
    if (data.status) {
      userData = data.data;
      res.redirect("/verifyotp");
    } else {
      res.redirect("/otp");
    }
  });
});

router.post("/verifyotp", (req, res) => {
  twilioHelpers.otpVerify(req.body, req.session.body).then((response) => {
    const { resp, user } = response;
    req.session.userloggedIn = true;
    req.session.user = user;
    if (resp.valid) {
      res.redirect("/");
    } else {
      res.redirect("/otp");
    }
  });
});

router.post("/signup", (req, res) => {
  req.session.body = req.body;
  userHelper.doSignup(req.body).then((response) => {
    if (response.user) {
      res.redirect("/signup");
    } else {
      res.redirect("/login");
    }
  });
});

router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userloggedIn = true;
      req.session.user = response.user;

      res.redirect("/");
    } else {
      req.session.loginErr = "Invalid Email or Password";

      res.redirect("/login");
    }
  });
});

router.get("/selected-category", verifyLogin, async function (req, res) {
  let userData = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let wishCount=null;
  if(req.session.user){
    wishCount=await userHelper.getWishCount(req.session.user._id);
  }
  const catItem = req.query.category;
  const category = await categoryHelpers.getAllCategory();
  categoryHelpers.getSelectedCategory(catItem).then((selectedCat) => {
    res.render("user/view-category", {
      selectedCat,
      category,
      user: true,
      cartCount,
      wishCount,
      userData,
    });
  });
});

router.get("/view-category", verifyLogin, function (req, res) {
  categoryHelpers.getAllCategory().then((category) => {
    res.render("user/view-category", { category, user: true });
  });
});

router.get("/view-product", verifyLogin, async function (req, res) {
  let userData = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let wishCount=null;
  if(req.session.user){
    wishCount=await userHelper.getWishCount(req.session.user._id);
  }
  productHelper.getAllProduct().then((product) => {
    res.render("user/view-product", {
      product,
      user: true,
      userData,
      cartCount,
      wishCount
    });
  });
});

//user profile
router.get("/profile/:id", async (req, res) => {
  const userData = await userHelper.getUserDetails(req.params.id);
  console.log("user profile", req.params.id, userData);
  res.render("user/profile", { userData, user: true });
});
// router.get("/profile/:id", async (req, res) => {
//   let userData = await userHelper.getUserDetails(req.params.id);
//   res.render("user/profile", { userData, user: true });
// });
router.post("/profile/:id", async (req, res) => {
  await userHelper.updateUser(req.params.id, req.body);
  res.redirect("/");
});

//cart
router.get("/cart", verifyLogin, async (req, res) => {
  let userData = req.session.user;
  let total = await userHelper.getTotalAmount(req.session.user._id);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let wishCount=null;
  if(req.session.user){
    wishCount=await userHelper.getWishCount(req.session.user._id);
  }
  let products = await userHelper.getCartProducts(req.session.user._id);
  res.render("user/cart", {
    products,
    user: req.session.user._id,
    cartCount,
    wishCount,
    userData,
    total,
  });
});

router.get("/add-to-cart/:id", (req, res) => {
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    // res.json({ status: true });
    res.redirect('/view-product')
  });
});

router.get("/deleteCartProduct/:id/:ik", function (req, res) {
  let cartId = req.params.id;
  let proId = req.params.ik;
  let userId = req.session.user._id;
  userHelper.deleteCartProduct(cartId, proId, userId).then((response) => {
    res.render("/cart");
  });
});
router.post("/change-product-quantity", (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user);
    res.json(response);
  });
});

//place order

router.get("/place-order", verifyLogin, async (req, res) => {
  const userData = await userHelper.getUserDetails(req.params.id);
  let total = await userHelper.getTotalAmount(req.session.user._id);
  let savedAddress= await userHelper.getSavedAddress(req.session.user._id);
  res.render("user/place-order", { total, user: req.session.user,userData,savedAddress });
});

router.post("/place-order", async (req, res) => {
  if(req.body.saveAddress=='on'){
    await userHelper.addNewAddress(req.body,req.session.user._id)
  }
  let products = await userHelper.getCartProductList(req.body.userId);
  let totalPrice = await userHelper.getTotalAmount(req.body.userId);
  userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body["Payment_Method"] == "COD") {
      res.json({ codSuccess: true });
    } else {
      userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response);
      });
    }
  });
});

router.get("/order-success", (req, res) => {
  res.render("user/order-success", { user: req.session.user });
});

router.get("/orders", async (req, res) => {
  let userData = req.session.user;
  let orders = await userHelper.getUserOrders(req.session.user._id);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  orders.forEach(element => {
    element.date = moment(element.date).format("DD-MM-YY")

});
  res.render("user/orders", { user: req.session.user, orders,cartCount,userData });
});

router.get("/view-order-products/:id", async (req, res) => {
  let products = await userHelper.getOrderProducts(req.params.id);
  let orderBill=await userHelper.getUserOrderBill(req.params.id)
  console.log('====================================');
  console.log(req.params.id);
  console.log(orderBill);
  console.log('====================================');
  res.render("user/view-order-products", {
    user: req.session.user,
    products,
    orderBill,
    user: true,
  });
});

router.get("/cancel-order/:id", (req, res) => {
  console.log(req.params);
  userHelper.cancelOrder(req.params.id);
  res.redirect("/orders");
});
router.post("/verify-payment", (req, res) => {
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: "" });
    });
});

//wishlist
router.get("/wishlist",async(req,res)=>{
  let userData = req.session.user;
  let products = await userHelper.getWishProducts(req.session.user._id);
  let wishCount=null;
  if(req.session.user){
    wishCount=await userHelper.getWishCount(req.session.user._id);
  }
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  res.render('user/wishlist',{products,user:true,wishCount,cartCount,userData})
})


router.get("/add-to-wishlist/:id",(req,res)=>{
  userHelper.addToWishlist(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/view-product')
  })
})

router.get("/deleteWishProduct/:id/:pId",(req, res)=> {
  console.log(req.params);
  let wId = req.params.id;
  let proId=req.params.pId;
  userHelper.deleteWishProduct(wId, proId).then((response) => {
    res.redirect("/wishlist");
  });
});

router.post('/check-coupon',async(req,res,next)=>{
  let userId = req.session.user._id
  let couponCode = req.body.coupon
  let totalAmount = await userHelper.getTotalAmount(userId)
  userHelper.checkCoupon(couponCode, totalAmount).then((response) => {
      res.json(response)
  }).catch((response) => {
      res.json(response)
  })
})


//logout
router.get("/logout", (req, res) => {
  req.session.userloggedIn = null;
  req.session.user = null;
  res.redirect("/");
});

module.exports = router;

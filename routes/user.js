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
const messageHelper = require("../helpers/message-helper");
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

  try {
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
  } catch (error) {
    next(error);
  }
});

router.get("/login", (req, res, next) => {
try {
    if (req.session.userloggedIn) {
      res.redirect("/");
    } else {
      res.render("user/login", {
        layout: "layout",
        loginErr: req.session.loginErr,
      });
      req.session.loginErr = false;
    }
} catch (error) {
  next(error);
}
});

router.get("/signup", (req, res,next) => {
 try {
   if (req.session.userloggedIn) {
     res.redirect("/");
   } else {
     res.render("user/signup", { layout: "layout" });
     req.session.loginErr = false;
   }
 } catch (error) {
  next(error);
 }
});

router.get("/otp", (req, res,next) => {
 try {
   res.render("user/otp", { layout: "layout" });
 } catch (error) {
  next(error);
 }
});

router.get("/verifyotp", (req, res,next) => {
try {
    res.render("user/verifyOtp", { layout: "layout", userData });
} catch (error) {
  next(error);
}
});

router.post("/otpmobile", (req, res,next) => {
 try {
   twilioHelper.dosms(req.body).then((data) => {
     if (data.status) {
       userData = data.data;
       res.redirect("/verifyotp");
     } else {
       res.redirect("/otp");
     }
   });
 } catch (error) {
  next(error);
 }
});

router.post("/verifyotp", (req, res,next) => {
 try {
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
 } catch (error) {
  next(error);
 }
});

router.post("/signup", (req, res,next) => {
 try {
   req.session.body = req.body;
   userHelper.doSignup(req.body).then((response) => {
     if (response.user) {
       res.redirect("/signup");
     } else {
       res.redirect("/login");
     }
   });
 } catch (error) {
  next(error);
 }
});

router.post("/login", (req, res,next) => {
 try {
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
 } catch (error) {
  next(error);
 }
});

router.get("/selected-category", verifyLogin, async function (req, res,next) {
 try {
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
 } catch (error) {
  next(error);
 }
});

router.get("/view-category", verifyLogin, function (req, res,next) {
  try {
    categoryHelpers.getAllCategory().then((category) => {
      res.render("user/view-category", { category, user: true });
    });
  } catch (error) {
    next(error);
  }
});

router.get("/view-product", verifyLogin, async function (req, res,next) {
  try {
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
  } catch (error) {
    next(error);
  }
});

//user profile
router.get("/profile/:id", async (req, res,next) => {
 try {
   const userData = await userHelper.getUserDetails(req.params.id);
   res.render("user/profile", { userData,user:true });
 } catch (error) {
  next(error);
 }
});

router.post("/profile/:id", async (req, res,next) => {
 try {
   await userHelper.updateUser(req.params.id, req.body);
   res.redirect("/");
 } catch (error) {
  next(error);
 }
});

//cart
router.get("/cart", verifyLogin, async (req, res,next) => {
  try {
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
      user:true
    });
  } catch (error) {
    next(error);
  }
});

router.get("/add-to-cart/:id", (req, res,next) => {
 try {
   userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
     res.json({ status: true });
     // res.redirect('/view-product')
   });
 } catch (error) {
  next(error);
 }
});

router.get("/deleteCartProduct/:id/:ik", function (req, res,next) {
 
 try {
   let cartId = req.params.id;
   let proId = req.params.ik;
   let userId = req.session.user._id;
   userHelper.deleteCartProduct(cartId, proId, userId).then((response) => {
     res.redirect("/cart");
   });
 } catch (error) {
  next(error);
 }
});
router.post("/change-product-quantity", (req, res, next) => {
 try {
   userHelper.changeProductQuantity(req.body).then(async (response) => {
     response.total = await userHelper.getTotalAmount(req.body.user);
     res.json(response);
   });
 } catch (error) {
  next(error);
 }
});

//place order

router.get("/place-order", verifyLogin, async (req, res,next) => {
  try {
    let userdata = req.session.user;
    const userData = await userHelper.getUserDetails(req.params.id);
    let total = await userHelper.getTotalAmount(req.session.user._id);
    let savedAddress= await userHelper.getSavedAddress(req.session.user._id);
    let message= await messageHelper.getAllMessage()
   
    res.render("user/place-order", { total, user: req.session.user,userData,savedAddress,user:true,userdata, message});
  } catch (error) {
    next(error);
  }
});

router.post("/place-order", async (req, res,next) => {
 try {
   if(req.body.saveAddress=='on'){
     await userHelper.addNewAddress(req.body,req.session.user._id)
   }
  
   let products = await userHelper.getCartProductList(req.session.user._id);
   let totalPrice = await userHelper.getTotalAmount(req.session.user._id);
   let discountData = null;
   if (req.body.Coupon_Code) {
     await userHelper
       .checkCoupon(req.body.Coupon_Code, totalPrice)
       .then((response) => {
         discountData = response;
       })
       .catch(() => (discountData = null));
   }
   userHelper.placeOrder(req.session.user._id,req.body, products, totalPrice,discountData).then((orderId) => {
     if (req.body["Payment_Method"] == "COD") {
       res.json({ codSuccess: true });
     } else {
       let netAmount = discountData ? discountData.amount : totalPrice;
       userHelper.generateRazorpay(orderId, netAmount).then((response) => {
         res.json(response);
       });
     }
   });
 } catch (error) {
  next(error);
 }
});

router.get("/order-success", (req, res,next) => {
 try {
   res.render("user/order-success", { user: req.session.user });
 } catch (error) {
  next(error);
 }
});

router.get("/orders",verifyLogin, async (req, res,next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

router.get("/view-order-products/:id", async (req, res,next) => {
 try {
   let products = await userHelper.getOrderProducts(req.params.id);
   let orderBill=await userHelper.getUserOrderBill(req.params.id)
   let orderId=req.params.id
   res.render("user/view-order-products", {
     user: req.session.user,
     products,
     orderId,
     orderBill,
     user:true,
   });
 } catch (error) {
  next(error);
 }
});

router.get("/bill",verifyLogin,async(req,res,next)=>{
 try {
   let user=req.session.user;  let products=await userHelper.getOrderProducts(req.query.id)
 
   let orderBill=await userHelper.getUserOrderBill(req.query.id)
 
   res.render("user/bill",{user,products,orderBill})
 } catch (error) {
  next(error);
 }

})

router.get("/cancel-order/:id", (req, res,next) => {
 
 try {
   userHelper.cancelOrder(req.params.id);
   res.redirect("/orders");
 } catch (error) {
  next(error);
 }
});
router.post("/verify-payment", (req, res,next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

//wishlist
router.get("/wishlist",async(req,res,next)=>{
 try {
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
 } catch (error) {
  next(error);
 }
})


router.get("/add-to-wishlist/:id",(req,res,next)=>{
try {
    userHelper.addToWishlist(req.params.id,req.session.user._id).then(()=>{
      res.json({ status: true });
    })
} catch (error) {
  next(error);
}
})

router.get("/deleteWishProduct/:id/:pId",(req, res,next)=> {
 
  try {
    let wId = req.params.id;
    let proId=req.params.pId;
    userHelper.deleteWishProduct(wId, proId).then((response) => {
      res.redirect("/wishlist");
    });
  } catch (error) {
    next(error);
  }
});

router.post('/check-coupon',async(req,res,next)=>{
 try {
   let userId = req.session.user._id
   let couponCode = req.body.coupon
   let totalAmount = await userHelper.getTotalAmount(userId)
   userHelper.checkCoupon(couponCode, totalAmount).then((response) => {
       res.json(response)
   }).catch((response) => {
       res.json(response)
   })
 } catch (error) {
  next(error);
 }
})


//logout
router.get("/logout", (req, res,next) => {
try {
    req.session.userloggedIn = null;
    req.session.user = null;
    res.redirect("/");
} catch (error) {
  next(error);
}
});

module.exports = router;

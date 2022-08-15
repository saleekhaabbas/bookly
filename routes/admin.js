const express = require("express");
const router = express.Router();
var uniqid = require("uniqid");
const adminHelper = require("../helpers/admin-helper");
const categoryHelpers = require("../helpers/category-helpers");
const productHelper = require("../helpers/product-helper");
const userHelper = require("../helpers/user-helper");
const moment=require("moment")
// const categoryHelper = require("../helpers/category-helpers");
const verifyLogin = (req, res, next) => {
  if (req.session.admin.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};
/* GET users listing. */
//admin login
router.get("/", function (req, res, next) {
  const adminData = req.session.adminloggedIn;
  if (adminData) {
    res.render("admin/admin-page", { layout: "layout-admin" });
  } else {
    res.redirect("/admin/login");
  }
});

router.get("/login", (req, res) => {
  if (req.session.adminloggedIn) {
    res.redirect("/admin");
  } else {
    res.render("admin/login", {
      layout: "layout-admin",
      admin: true,
      loginErr: req.session.loginErr,
    });

    req.session.loginErr = false;
  }
});
router.post("/login", (req, res) => {
  console.log(req.body);
  adminHelper.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminloggedIn = true;
      res.redirect("/admin");
    } else {
      req.session.loginErr = "Invalid Email or Password";
      res.redirect("/admin/login");
    }
  });
});
//admin logout
router.get("/logout", (req, res) => {
  req.session.adminloggedIn = null;
  res.redirect("/admin");
});
//view category
router.get("/view-category", (req, res) => {
  categoryHelpers.getAllCategory().then((category) => {
    console.log(category);
    res.render("admin/view-category", { layout: "layout-admin", category });
  });
});
//add category
router.get("/add-category", (req, res) => {
  res.render("admin/add-category", { layout: "layout-admin" });
});
router.post("/add-category", async (req, res) => {
  console.log(req.body);
  console.log(req.files);
  const id = uniqid();
  console.log("uniqid check", id);
  req.body.image = id + ".jpg";
  await categoryHelpers.addCategory(req.body);
  let image = req.files.image;
  image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
    if (!err) {
      res.render("admin/add-category");
    } else {
      console.log(err);
    }
  });
  res.redirect("/admin/view-category");
});

// router.post("/add-category", async (req, res) => {
//   console.log("cat check", req.body);
//   await categoryHelpers.addCategory(req.body);
//   res.redirect("/admin/view-category");
// });
//delete category
router.get("/delete-category/:id", (req, res) => {
  let catId = req.params.id;
  console.log(catId);
  console.log(catId);
  categoryHelpers.deleteCategory(catId).then((response) => {
    res.redirect("/admin/view-category");
  });
});
//edit category
router.get("/edit-category/:id", async (req, res) => {
  let category = await categoryHelpers.getCategoryDetails(req.params.id);
  res.render("admin/edit-category", { layout: "layout-admin", category });
  console.log(req.body);
});

router.post("/edit-category/:id", async (req, res) => {
  console.log("post started", req.params.id);
  console.log("post body", req.body);
  console.log("post files", req.files);
  const id = uniqid();
  req.body.image = id + ".jpg";
  await categoryHelpers.updateCategory(req.params.id, req.body);
  let image = req?.files?.image;
  image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
    if (!err) {
      res.redirect("/admin/view-category");
    } else {
      console.log(err);
    }
  });
});
router.get("/user-management", (req, res, next) => {
  if (req.session.adminloggedIn) {
    adminHelper.getUserDetails().then((userDetails) => {
      console.log("User details", userDetails);
      res.render("admin/user-management", {
        title: "Admin",
        userDetails,
        layout: "layout-admin",
      });
    });
  } else {
    res.redirect("/admin/login");
  }
});

// block user
router.get("/user-management/block-users/:id", (req, res) => {
  if (req.session.adminloggedIn) {
    adminHelper.blockUsers(req.params.id).then(() => {
      res.redirect("/admin/user-management");
    });
  } else {
    res.redirect("/admin/login");
  }
});

//unblock user
router.get("/user-management/unblock-users/:id", (req, res) => {
  if (req.session.adminloggedIn) {
    adminHelper.unBlockUsers(req.params.id).then(() => {
      res.redirect("/admin/user-management");
    });
  } else {
    res.redirect("/admin/login");
  }
});

//view products
router.get("/view-product", (req, res) => {

  productHelper.getAllProduct().then((product) => {
   
    res.render("admin/view-product", { layout: "layout-admin", product });
  });
});

//add product

router.get("/add-product", (req, res) => {
  categoryHelpers.getAllCategory().then((category) => {
    res.render("admin/add-product", { layout: "layout-admin", category });
  });
});

router.post("/add-product", async (req, res) => {
  console.log(req.body);
  console.log(req.files);
  const id = uniqid();
  console.log("uniqid check", id);
  req.body.image = id + ".jpg";
  await productHelper.addProduct(req.body);
  let image = req.files.image;
  image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
    if (!err) {
      res.render("admin/add-product");
    } else {
      console.log(err);
    }
  });
  res.redirect("/admin/view-product");
});

//edit product
router.get("/edit-product/:id", async (req, res) => {
  categoryHelpers.getAllCategory().then(async (category) => {
    let product = await productHelper.getProductDetails(req.params.id);
    console.log("get product", product);
    res.render("admin/edit-product", {
      layout: "layout-admin",
      product,
      category,
    });
    console.log(req.body);
  });
});
router.post("/edit-product/:id", async (req, res) => {
  console.log("post started", req.params.id);
  console.log("post body", req.body);
  console.log("post files", req.files);
  const id = uniqid();
  req.body.image = id + ".jpg";
  await productHelper.updateProduct(req.params.id, req.body);
  let image = req?.files?.image;
  image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
    if (!err) {
      res.redirect("/admin/view-product");
    } else {
      console.log(err);
    }
  });
});

router.get("/delete-product/:id", (req, res) => {
  let proId = req.params.id;
  productHelper.deleteproduct(proId).then((response) => {
    res.redirect("/admin/view-product");
  });
});
router.get('/view-order/:id',async(req,res)=>{
  let userId=req.params.id

  console.log(userId);

  let userOrders= await userHelper.getUserOrders(userId)

  userOrders.forEach(element => {
    element.date = moment(element.date).format("DD-MM-YY")

});
    res.render("admin/view-order",{layout: "layout-admin",userOrders})

  })

// router.get("/vieworder", async (req, res) => {
//   let userId=req.params.userId;
//   let orders = await userHelper.getUserOrders(userId);
//   res.render("user/orders", {layout:"layout-admin",orders});
// });


router.get('/*',(req,res)=>{
  res.render("admin/error")
})



router.get('/status-shipped',(req,res,next)=>{
  let orderId=req.query.id
console.log('====================================');
console.log(orderId);
console.log('====================================');

  let userId=req.query.userId
  let status='shipped'
  adminHelper.changeStatus(orderId,status).then((response)=>{
    res.redirect('/admin/view-order/'+userId)
  })
})

router.get('/status-delivered',(req,res,next)=>{
  let orderId=req.query.id
  let userId=req.query.userId
  let status='delivered'
  adminHelper.changeStatus(orderId,status).then((response)=>{
    res.redirect('/admin/view-order/'+userId)
  })
})

router.get('/status-cancelled',(req,res,next)=>{
  let orderId=req.query.id
  let userId=req.query.userId
  userHelper.cancelOrder(orderId).then(()=>{
    res.redirect('/admin/view-order/'+userId)
  })
})


// router.get('/status-shipped',(req,res,next)=>{
//   let orderId = req.query.id
//   console.log(orderId);
//   console.log("asdfghjk");
// })




module.exports = router;

const express = require("express");
const router = express.Router();
var uniqid = require("uniqid");
const adminHelper = require("../helpers/admin-helper");
const categoryHelpers = require("../helpers/category-helpers");
const productHelper = require("../helpers/product-helper");
const userHelper = require("../helpers/user-helper");
const moment = require("moment");
const bannerHelper = require("../helpers/banner-helper");
const messageHelper = require("../helpers/message-helper");
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
router.get("/", async function (req, res, next) {
  try {
    const adminData = req.session.adminloggedIn;
    if (adminData) {
      try {
        let delivery = {};
        delivery.pending = "pending";
        delivery.Placed = "placed";
        delivery.Shipped = "shipped";

        delivery.Deliverd = "delivered";
        delivery.Cancelled = "cancelled";
        const allData = await Promise.all([
          adminHelper.onlinePaymentCount(),
          adminHelper.totalUsers(),
          adminHelper.totalOrder(),
          adminHelper.cancelOrder(),
          adminHelper.totalCOD(),
          adminHelper.totalDeliveryStatus(delivery.pending),
          adminHelper.totalDeliveryStatus(delivery.Placed),
          adminHelper.totalDeliveryStatus(delivery.Shipped),
          adminHelper.totalDeliveryStatus(delivery.Deliverd),
          adminHelper.totalDeliveryStatus(delivery.Cancelled),
          adminHelper.totalCost(),
        ]);
        res.render("admin/admin-page", {
          layout: "layout-admin",

          OnlinePymentcount: allData[0],
          totalUser: allData[1],
          totalOrder: allData[2],
          cancelOrder: allData[3],
          totalCod: allData[4],
          pending: allData[5],
          Placed: allData[6],
          Shipped: allData[7],

          Deliverd: allData[8],
          Cancelled: allData[9],
          totalCost: allData[10],
        });
      } catch (err) {
        next(err);
      }

      // res.render("admin/admin-page", { layout: "layout-admin" });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    next(error);
  }
});

router.get("/login", (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});
router.post("/login", (req, res, next) => {
  try {
    adminHelper.doAdminLogin(req.body).then((response) => {
      if (response.status) {
        req.session.adminloggedIn = true;
        res.redirect("/admin");
      } else {
        req.session.loginErr = "Invalid Email or Password";
        res.redirect("/admin/login");
      }
    });
  } catch (error) {
    next(error);
  }
});
//admin logout
router.get("/logout", (req, res, next) => {
  try {
    req.session.adminloggedIn = null;
    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
});
//view category
router.get("/view-category", (req, res, next) => {
  try {
    categoryHelpers.getAllCategory().then((category) => {
      res.render("admin/view-category", { layout: "layout-admin", category });
    });
  } catch (error) {
    next(error);
  }
});
//add category
router.get("/add-category", (req, res, next) => {
  try {
    res.render("admin/add-category", { layout: "layout-admin" });
  } catch (error) {
    next(error);
  }
});
router.post("/add-category", async (req, res, next) => {
  try {
    const id = uniqid();

    req.body.image = id + ".jpg";
    const response = await categoryHelpers.addCategory(req.body);
    console.log("check one", response);
    let image = req.files.image;
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-category");
      } else {
        console.log(err);
      }
    });
    if (response.success) {
      res.redirect("/admin/view-category");
    } else {
      res.render("admin/add-category", {
        layout: "layout-admin",
        message: response.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

//delete category
router.get("/delete-category/:id", (req, res, next) => {
  try {
    let catId = req.params.id;

    categoryHelpers.deleteCategory(catId).then((response) => {
      res.redirect("/admin/view-category");
    });
  } catch (error) {
    next(error);
  }
});
//edit category
router.get("/edit-category/:id", async (req, res, next) => {
  try {
    let category = await categoryHelpers.getCategoryDetails(req.params.id);
    res.render("admin/edit-category", { layout: "layout-admin", category });
  } catch (error) {
    next(error);
  }
});

router.post("/edit-category/:id", async (req, res, next) => {
  try {
    const id = uniqid();
    req.body.image = id + ".jpg";
    await categoryHelpers.updateCategory(req.params.id, req.body);
    let image = req.files.image;
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.redirect("/admin/view-category");
      } else {
        console.log(err);
      }
    });
  } catch (error) {
    next(error);
  }
});
router.get("/user-management", (req, res, next) => {
  try {
    if (req.session.adminloggedIn) {
      adminHelper.getUserDetails().then((userDetails) => {
        res.render("admin/user-management", {
          title: "Admin",
          userDetails,
          layout: "layout-admin",
        });
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    next(error);
  }
});

// block user
router.get("/user-management/block-users/:id", (req, res, next) => {
  try {
    if (req.session.adminloggedIn) {
      adminHelper.blockUsers(req.params.id).then(() => {
        res.redirect("/admin/user-management");
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    next(error);
  }
});

//unblock user
router.get("/user-management/unblock-users/:id", (req, res, next) => {
  try {
    if (req.session.adminloggedIn) {
      adminHelper.unBlockUsers(req.params.id).then(() => {
        res.redirect("/admin/user-management");
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    next(error);
  }
});

//view products
router.get("/view-product", (req, res, next) => {
  try {
    productHelper.getAllProduct().then((product) => {
      res.render("admin/view-product", { layout: "layout-admin", product });
    });
  } catch (error) {
    next(error);
  }
});

//add product

router.get("/add-product", (req, res, next) => {
  try {
    categoryHelpers.getAllCategory().then((category) => {
      res.render("admin/add-product", { layout: "layout-admin", category });
    });
  } catch (error) {
    next(error);
  }
});

router.post("/add-product", async (req, res, next) => {
  try {
    const id = uniqid();

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
  } catch (error) {
    next(error);
  }
});

//edit product
router.get("/edit-product/:id", async (req, res, next) => {
  try {
    categoryHelpers.getAllCategory().then(async (category) => {
      let product = await productHelper.getProductDetails(req.params.id);
      res.render("admin/edit-product", {
        layout: "layout-admin",
        product,
        category,
      });
    });
  } catch (error) {
    next(error);
  }
});
router.post("/edit-product/:id", async (req, res, next) => {
  try {
    const id = uniqid();
    req.body.image = id + ".jpg";
    await productHelper.updateProduct(req.params.id, req.body);
    let image = req.files.image;
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.redirect("/admin/view-product");
      } else {
        console.log(err);
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/delete-product/:id", (req, res, next) => {
  try {
    let proId = req.params.id;
    productHelper.deleteproduct(proId).then((response) => {
      res.redirect("/admin/view-product");
    });
  } catch (error) {
    next(error);
  }
});
router.get("/view-order/:id", async (req, res, next) => {
  try {
    let userId = req.params.id;

    let userOrders = await userHelper.getUserOrders(userId);

    userOrders.forEach((element) => {
      element.date = moment(element.date).format("DD-MM-YY");
    });
    res.render("admin/view-order", { layout: "layout-admin", userOrders });
  } catch (error) {
    next(error);
  }
});

router.get("/view-fullorder", async (req, res, next) => {
  try {
    let orders = await userHelper.getFullOrder();
    orders.forEach((element) => {
      element.date = moment(element.date).format("DD-MM-YY");
    });
    res.render("admin/view-fullorder", { layout: "layout-admin", orders });
  } catch (error) {
    next(error);
  }
});
router.get("/view-order-product/:id", async (req, res, next) => {
  try {
    let products = await userHelper.getOrderProducts(req.params.id);
    res.render("admin/view-order-product", {
      layout: "layout-admin",
      products,
    });
  } catch (error) {
    next(error);
  }
});
router.get("/view-coupon", (req, res, next) => {
  try {
    adminHelper.getCoupons().then((coupons) => {
      res.render("admin/view-coupon", { layout: "layout-admin", coupons });
    });
  } catch (error) {
    next(error);
  }
});

router.get("/generate-coupon", (req, res, next) => {
  try {
    res.render("admin/generate-coupon", { layout: "layout-admin" });
  } catch (error) {
    next(error);
  }
});

router.post("/generate-coupon", (req, res, next) => {
  try {
    adminHelper.generateCoupon(req.body).then((response) => {
      res.redirect("/admin/view-coupon");
    });
  } catch (error) {
    next(error);
  }
});

router.get("/delete-coupon/:id", (req, res, next) => {
  try {
    let couponId = req.params.id;
    adminHelper.deleteCoupon(couponId).then((response) => {
      res.redirect("/admin/view-coupon");
    });
  } catch (error) {
    next(error);
  }
});

router.get("/status-shipped", (req, res, next) => {
  try {
    let orderId = req.query.id;

    let userId = req.query.userId;
    let status = "shipped";
    adminHelper.changeStatus(orderId, status).then((response) => {
      res.redirect("/admin/view-order/" + userId);
    });
  } catch (error) {
    next(error);
  }
});

router.get("/status-delivered", (req, res, next) => {
  try {
    let orderId = req.query.id;
    let userId = req.query.userId;
    let status = "delivered";
    adminHelper.changeStatus(orderId, status).then((response) => {
      res.redirect("/admin/view-order/" + userId);
    });
  } catch (error) {
    next(error);
  }
});

router.get("/status-cancelled", (req, res, next) => {
  try {
    let orderId = req.query.id;
    let userId = req.query.userId;
    userHelper.cancelOrder(orderId).then(() => {
      res.redirect("/admin/view-order/" + userId);
    });
  } catch (error) {
    next(error);
  }
});

router.get("/view-banner", (req, res, next) => {
  try {
    bannerHelper.getAllBanner().then((banner) => {
      res.render("admin/view-banner", { layout: "layout-admin", banner });
    });
  } catch (error) {
    next(error);
  }
});
//add banner
router.get("/add-banner", (req, res, next) => {
  try {
    res.render("admin/add-banner", { layout: "layout-admin" });
  } catch (error) {
    next(error);
  }
});
router.post("/add-banner", async (req, res, next) => {
  try {
    const id = uniqid();

    req.body.image = id + ".jpg";
    await bannerHelper.addBanner(req.body);
    let image = req.files.image;
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-banner");
      } else {
        console.log(err);
      }
    });
    res.redirect("/admin/view-banner");
  } catch (error) {
    next(error);
  }
});

router.get("/delete-banner/:id", (req, res, next) => {
  try {
    let banId = req.params.id;
    bannerHelper.deletebanner(banId).then((response) => {
      res.redirect("/admin/view-banner");
    });
  } catch (error) {
    next(error);
  }
});

router.get("/view-message", (req, res, next) => {
  try {
    messageHelper.getAllMessage().then((message) => {
      res.render("admin/view-message", { layout: "layout-admin", message });
    });
  } catch (error) {
    next(error);
  }
});
//add message
router.get("/add-message", (req, res, next) => {
  try {
    res.render("admin/add-message", { layout: "layout-admin" });
  } catch (error) {
    next(error);
  }
});
router.post("/add-message", async (req, res, next) => {
  try {
    await messageHelper.addMessage(req.body);

    res.redirect("/admin/view-message");
  } catch (error) {
    next(error);
  }
});

router.get("/delete-message/:id", (req, res, next) => {
  try {
    let msgId = req.params.id;
    messageHelper.deleteMessage(msgId).then((response) => {
      res.redirect("/admin/view-message");
    });
  } catch (error) {
    next(error);
  }
});

router.get("/*", (req, res) => {
  res.render("admin/error");
});

module.exports = router;

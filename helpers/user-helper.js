const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");
const { response } = require("../app");
const { PRODUCT_COLLECTION } = require("../config/collection");
const objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { resolve } = require("path");
const { v4: uuidv4 } = require("uuid");
var instance = new Razorpay({
  key_id: "rzp_test_iK644BVab4Z1Yg",
  key_secret: "ebFwPdYVMLwS1R7kdaCkEBwv",
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const isUser = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: userData.number })
        .then((data) => {
          resolve({ data, status: false });
          return data;
        });
      if (!isUser) {
        userData.password = await bcrypt.hash(userData.password1, 10);
        const user = {
          name: userData.name,
          email: userData.email,
          mobile: userData.number,
          password: userData.password,
          blockUsers: false,
        };
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(user)
          .then((data) => {
            resolve(data.insertedId);
          });
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      const loginStatus = false;
      const response = {};
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email, blockUsers: false });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) })
        .then((user) => {
          resolve(user);
        });
    });
  },

  updateUser: (userId, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              name: userDetails.name,
              email: userDetails.email,
              number: userDetails.number,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $addFields: {
              productTotal: {
                $sum: {
                  $multiply: ["$quantity", "$product.price"],
                },
              },
            },
          },
        ])
        .toArray();
      console.log(cartItems[0].products);
      if (cartItems.length == 0) {
        resolve(cartItems);
      } else {
        resolve(cartItems);
      }
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  deleteCartProduct: (cartId, proId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(cartId) },
          {
            $pull: {
              product: { item: objectId(proId) },
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();
      if (total.length == 0) {
        resolve(total);
      } else {
        resolve(total[0].total);
      }
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let status = order["Payment_Method"] === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          mobile: order.Phone,
          address: order.Street_Address,
          pincode: order.Post_Code,
          action: true,
        },
        userId: objectId(order.userId),
        paymentMethod: order["Payment_Method"],
        products: products,
        totalAmount: parseInt(total),
        status: status,
        date: new Date(),
      };

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      resolve(cart.products);
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .toArray();
      resolve(orders);
    });
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: `${orderId}`,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "ebFwPdYVMLwS1R7kdaCkEBwv");

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    console.log(orderId);
    return new Promise((resolve, reject) => {
      console.log(123);
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  cancelOrder: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              "deliveryDetails.action": false,
              status: "cancelled",
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  addToWishlist: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userWishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userWishlist) {
        let proExist = userWishlist.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $pull: {
                  products: { item: objectId(proId) },
                },
              }
            );
        } else {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getWishProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      // console.log(wishItems[0].products);
      if (wishItems.length == 0) {
        resolve(wishItems);
      } else {
        resolve(wishItems);
      }
    });
  },
  getWishCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wish = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (wish) {
        count = wish.products.length;
      }
      resolve(count);
    });
  },
  deleteWishProduct: (wId, proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { _id: objectId(wId) },
          {
            $pull: {
              products: { item: objectId(proId) },
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  addNewAddress: (address, userId) => {
    let addressData = {
      addressId: uuidv4(),
      First_Name: address.First_Name,
      Last_Name: address.Last_Name,
      Company_Name: address.Company_Name,
      Street_Address: address.Street_Address,
      Extra_Details: address.Extra_Details,
      Town_City: address.Town_City,
      Country_State: address.Country_State,
      Post_Code: address.Post_Code,
      Phone: address.Phone,
      Alt_Phone: address.Alt_Phone,
    };

    console.log(addressData);

    return new Promise(async (resolve, reject) => {
      let getAddress = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ user: objectId(userId) });
      console.log(getAddress);
      if (getAddress) {
        db.get()
          .collection(collection.ADDRESS_COLLECTION)
          .updateOne(
            { user: objectId(userId) },
            {
              $push: {
                address: addressData,
              },
            }
          )
          .then((response) => {
            resolve(response);
          });
      } else {
        let addressObj = {
          user: objectId(userId),
          address: [addressData],
        };

        db.get()
          .collection(collection.ADDRESS_COLLECTION)
          .insertOne(addressObj)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },
  getSavedAddress: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ user: objectId(userId) })
        .then((savedAddress) => {
          if (savedAddress) {
            let addressArray = savedAddress.address;
            if (addressArray.length > 0) {
              resolve(savedAddress);
            } else {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        });
    });
  },
  checkCoupon: (code, amount) => {
    const coupon = code.toString().toUpperCase();

    console.log(coupon);

    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ Name: coupon })
        .then((response) => {
          console.log(response);
          console.log("from db");
          if (response == null) {
            // let response = {status : false}
            console.log(response + "          null resp");
            reject({ status: false });
          } else {
            let offerPrice = parseFloat(amount * response.Offer);
            // let discountPrice = amount - offerPrice
            let newTotal = parseInt(amount - offerPrice);
            // response = {
            //     amount: newTotal,
            //     discount: discountPrice
            // }
            console.log("          Nonnull resp");
            resolve(
              (response = {
                couponCode: coupon,
                status: true,
                amount: newTotal,
                discount: offerPrice,
              })
            );
          }
        });
    });
  },
  getUserOrderBill: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderBill = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: objectId(orderId) })
        .toArray();

      resolve(orderBill);
    });
  },
};

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
    try {
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
    } catch (error) {
      reject(error);
    }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
    });
  },
  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
     try {
       db.get()
         .collection(collection.USER_COLLECTION)
         .findOne({ _id: objectId(userId) })
         .then((user) => {
           resolve(user);
         });
     } catch (error) {
      reject(error);
     }
    });
  },

  updateUser: (userId, userDetails) => {
    return new Promise((resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
     try {
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
 
       resolve(cartItems);
     } catch (error) {
      reject(error);
     }
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
     try {
       let count = 0;
       let cart = await db
         .get()
         .collection(collection.CART_COLLECTION)
         .findOne({ user: objectId(userId) });
       if (cart) {
         count = cart.products.length;
       }
       resolve(count);
     } catch (error) {
      reject(error);
     }
    });
  },
  deleteCartProduct: (cartId, proId) => {
    return new Promise((resolve, reject) => {
     try {
       db.get()
         .collection(collection.CART_COLLECTION)
         .updateOne(
           { _id: objectId(cartId) },
           {
             $pull: {
               products: { item: objectId(proId) },
             },
           }
         )
         .then((response) => {
           resolve(response);
         });
     } catch (error) {
      reject(error);
     }
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      try {
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
      } catch (error) {
        reject(error);
      }
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
    });
  },
  placeOrder: (userId,order, products, total, discountData) => {
    let orderData = {
      Total_Amount: total,
      discountData: discountData,
    };
    let invoice = parseInt(Math.random() * 9999);
    return new Promise((resolve, reject) => {
      try {
        let status = order["Payment_Method"] === "COD" ? "placed" : "pending";
        let orderObj = {
          deliveryDetails: {
            name: order.First_Name,
            mobile: order.Phone,
            address: order.Street_Address,
            pincode: order.Post_Code,
            action: true,
          },
          userId: objectId(userId),
          paymentMethod: order["Payment_Method"],
          products: products,
          orderData: orderData,
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
              .deleteOne({ user: objectId(userId) });
            resolve(response.insertedId);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
     try {
       let cart = await db
         .get()
         .collection(collection.CART_COLLECTION)
         .findOne({ user: objectId(userId) });
       resolve(cart.products);
     } catch (error) {
      reject(error);
     }
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ userId: objectId(userId) })
          .sort({ _id: -1 })
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
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
      } catch (error) {
        reject(error);
      }
    });
  },
  getFullOrder: () => {
    return new Promise((resolve, reject) => {
      try {
        let orders = db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find()
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      try {
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
      } catch (error) {
        reject(error);
      }
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
    });
  },
  cancelOrder: (proId) => {
    return new Promise((resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
    });
  },
  addToWishlist: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      try {
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
      } catch (error) {
        reject(error);
      }
    });
  },
  getWishProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
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
  
        if (wishItems.length == 0) {
          resolve(wishItems);
        } else {
          resolve(wishItems);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  getWishCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = 0;
        let wish = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .findOne({ user: objectId(userId) });
        if (wish) {
          count = wish.products.length;
        }
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
  },
  deleteWishProduct: (wId, proId) => {
    return new Promise((resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
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

    return new Promise(async (resolve, reject) => {
      try {
        let getAddress = await db
          .get()
          .collection(collection.ADDRESS_COLLECTION)
          .findOne({ user: objectId(userId) });
  
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
      } catch (error) {
        reject(error);
      }
    });
  },
  getSavedAddress: (userId) => {
    return new Promise((resolve, reject) => {
     try {
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
     } catch (error) {
      reject(error);
     }
    });
  },
  checkCoupon: (code, amount) => {
    const coupon = code.toString().toUpperCase();

    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.COUPON_COLLECTION)
          .findOne({ Name: coupon })
          .then((response) => {
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
      } catch (error) {
        reject(error);
      }
    });
  },

  getUserOrderBill: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        try {
          let orderBill = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .find({ _id: objectId(orderId) })
            .toArray();
  
          resolve(orderBill);
        } catch (error) {
          reject(error);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  getUser: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.USER_COLLECTION)
          .findOne({ _id: objectId(userId) })
          .then((user) => {
            resolve(user);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
};

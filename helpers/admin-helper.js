const db = require("../config/connection");
const collection = require("../config/collection");
const { Collection } = require("mongo");
const { response } = require("../app");
const objectId = require("mongodb").ObjectId;

const loginCred = {
  name: "saleekha.ashar@gmail.com",
  password: "1",
};
module.exports = {
  doAdminLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      const { username, password } = adminData;
      const loginStatus = false;
      const response = {};
      console.log(loginCred);
      if (
        loginCred.name === adminData.email &&
        loginCred.password === adminData.password
      ) {
        console.log("login successfully");
        response.status = true;
        resolve(response);
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },

  getUserDetails: () => {
    return new Promise(async (resolve, reject) => {
      const users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  blockUsers: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              blockUsers: true,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  unBlockUsers: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              blockUsers: false,
            },
          }
        )
        .then(() => {
          resolve();
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
  changeStatus: (orderId, status) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: status,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  

  getCoupons: () => {
    return new Promise(async (resolve, reject) => {
      const response = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      console.log("coupons", response);
      resolve(response);
    });
  },
  generateCoupon: (couponData) => {
    console.log({ couponData });
    const oneDay = 1000 * 60 * 60 * 24;
    let couponObj = {
      Name: couponData.name.toUpperCase(),
      Offer: parseFloat(couponData.offer / 100),
      validity: new Date(
        new Date().getTime() + (oneDay + parseInt(couponData.validity))
      ),
    };
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray()
        .then((result) => {
          if (result[0] == null) {
            db.get()
              .collection(collection.COUPON_COLLECTION)
              .createIndex({ Name: 1 }, { unique: true });
            db.get()
              .collection(collection.COUPON_COLLECTION)
              .createIndex({ validity: 1 }, { expireAfterSeconds: 0 });
            db.get()
              .collection(collection.COUPON_COLLECTION)
              .insertOne(couponObj)
              .then((response) => {
                resolve(response);
              });
          } else {
            db.get()
              .collection(collection.COUPON_COLLECTION)
              .insertOne(couponObj)
              .then((respnse) => {
                resolve(response);
              });
          }
        });
    });
  },
  deleteCoupon: (couponId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .deleteOne({ _id: objectId(couponId) })
        .then((response) => {
          resolve();
        });
    });
  },
  onlinePaymentCount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find({ paymentMethod
          : "Razorpay" }).count()
        resolve(count)
        console.log(count)
      } catch (err) {
        reject(err)
      }

    })
  },
  totalUsers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.USER_COLLECTION).find().count()
        resolve(count)
        console.log(" total user count")
        console.log(count)
      } catch (err) {
        reject(err)
      }
    })
  },
  totalOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find().count()
        resolve(count)
        console.log("total order");
        console.log(count);
      } catch (err) {
        reject(err)
      }
    })
  },
  cancelOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              status: "pending"
            }
          },

        {
            $count: 'number'
          }

        ]).toArray()
        resolve(count)
        console.log('cancel count')
        console.log(count);
      } catch (err) {
        reject(err)
      }

    })
  },
  totalCOD: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find({ paymentMethod: "COD", }).count()
        resolve(count)
        console.log("cod");
        console.log(count);
      } catch (err) {
        reject(err)
      }
    })
  },
  totalDeliveryStatus: (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        let statusCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              status: data
            }
          },

          {
            $count: 'number'
          }

        ]).toArray()
        resolve(statusCount)

        console.log("status count");
        console.log(statusCount);
      } catch (err) {
        reject(err)
      }
    })
  },
  
  totalCost: () => {
    return new Promise(async (resolve, reject) => {
      try {
     let total= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        

          {
            $project: {
              'orderData.Total_Amount': 1
            }
          },
          {
            $group: {
              _id: null,
              sum: { $sum: '$orderData.Total_Amount' }
            }
          }
        ]).toArray()
        resolve(total)
        console.log("total amnt");
        console.log(total);
        console.log('hhhhhhhhhhhhhhhh');
      
      } catch (err) {
        reject(err)
      }
    })
  },
};

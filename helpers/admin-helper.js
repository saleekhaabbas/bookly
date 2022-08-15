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
  changeStatus:(orderId,status)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
      {
        $set:{
          status:status
        }
      }
      ).then((response)=>{
        resolve(response)
      })
    })
  }
};

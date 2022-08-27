const db = require("../config/connection");
const collection = require("../config/collection");
const objectId = require("mongodb").ObjectId;

module.exports = {
  addMessage: (message) => {
    return new Promise(async (resolve, reject) => {
     try {
         await db
           .get()
           .collection("message")
           .insertOne(message)
           .then((data) => {
             resolve(data);
           });
     } catch (error) {
        reject(error);
     }
    });
  },
  getAllMessage: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const message = await db
          .get()
          .collection(collection.MESSAGE_COLLECTION)
          .find()
          .sort({ _id: -1 })
          .toArray();
        resolve(message);
      } catch (error) {
        reject(error);
      }
      
    });
  },
  getMessageDetails: (msgId) => {
    return new Promise((resolve, reject) => {
     try {
         db.get()
           .collection(collection.MESSAGE_COLLECTION)
           .findOne({ _id: objectId(msgId) })
           .then((message) => {
             resolve(message);
           });
     } catch (error) {
        reject(error);
     }
    });
  },
  updateMessage: (msgId, msgDetails) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.MESSAGE_COLLECTION)
          .updateOne(
            { _id: objectId(msgId) },
            {
              $set: {
                name:msgDetails.message1,
                definition:msgDetails.message2,
                heading:msgDetails.message3,
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
  deleteMessage: (msgId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.MESSAGE_COLLECTION)
          .deleteOne({ _id: objectId(msgId) })
          .then((response) => {
            resolve(response);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
};

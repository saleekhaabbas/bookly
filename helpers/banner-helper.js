const db = require("../config/connection");
const collection = require("../config/collection");
const objectId = require("mongodb").ObjectId;

module.exports = {
  addBanner: (banner) => {
    return new Promise(async (resolve, reject) => {
      console.log("addProduct", banner);
      await db
        .get()
        .collection("banner")
        .insertOne(banner)
        .then((data) => {
          resolve(data);
        });
    });
  },
  getAllBanner: () => {
    return new Promise(async (resolve, reject) => {
      const banner = await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(banner);
    });
  },
  getBannerDetails: (banId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .findOne({ _id: objectId(banId) })
        .then((banner) => {
          resolve(banner);
        });
    });
  },

  updateBanner: (banId, banDetails) => {
    
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .updateOne(
          { _id: objectId(banId) },
          {
            $set: {
              name:banDetails.name,
              heading:banDetails.heading,
              definition:banDetails.definition,
              image:banDetails.image,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deletebanner: (banId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .deleteOne({ _id: objectId(banId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
};

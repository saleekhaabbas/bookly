const db = require("../config/connection");
const collection = require("../config/collection");
const objectId = require("mongodb").ObjectId;
module.exports = {
  addCategory: async (category) => {
    console.log(category);
    const isCategory = await db
      .get()
      .collection("category")
      .findOne({ category: category.category });
    if (!isCategory) {
      db.get()
        .collection("category")
        .insertOne(category)
        .then((data) => {});
    }
  },
  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      const category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(category);
    });
  },
  getSelectedCategory: (catItem) => {
    return new Promise(async (resolve, reject) => {
      const category = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: catItem })
        .sort({ _id: -1 })
        .toArray();
      resolve(category);
    });
  },

  deleteCategory: (catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: objectId(catId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getCategoryDetails: (catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: objectId(catId) })
        .then((category) => {
          resolve(category);
        });
    });
  },
  updateCategory: (catId, catDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(catId) },
          {
            $set: {
              category: catDetails.category,
              description: catDetails.description,
              image: catDetails.image,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
};

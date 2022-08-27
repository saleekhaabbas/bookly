const db = require("../config/connection");
const collection = require("../config/collection");
const objectId = require("mongodb").ObjectId;

module.exports = {
  addProduct: (product) => {
    product.price=parseInt(product.price)
    return new Promise(async (resolve, reject) => {
      
     try {
       await db
         .get()
         .collection("product")
         .insertOne(product)
         .then((data) => {
           resolve(data);
         });
     } catch (error) {
      reject(error);
     }
    });
  },
  getAllProduct: () => {
    return new Promise(async (resolve, reject) => {
     try {
       const products = await db
         .get()
         .collection(collection.PRODUCT_COLLECTION)
         .find()
         .sort({ _id: -1 })
         .toArray();
       resolve(products);
     } catch (error) {
      reject(error);
     }
    });
  },
  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ _id: objectId(proId) })
          .then((product) => {
            resolve(product);
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  updateProduct: (proId, proDetails) => {
    proDetails.price=parseInt(proDetails.price)
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(proId) },
            {
              $set: {
                product: proDetails.product,
                Category: proDetails.Category,
                author: proDetails.author,
                price: proDetails.price,
                image: proDetails.image,
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

  deleteproduct: (proId) => {
    return new Promise((resolve, reject) => {
     try {
       db.get()
         .collection(collection.PRODUCT_COLLECTION)
         .deleteOne({ _id: objectId(proId) })
         .then((response) => {
           resolve(response);
         });
     } catch (error) {
      reject(error);
     }
    });
  },
};

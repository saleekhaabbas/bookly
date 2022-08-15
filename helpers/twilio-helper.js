const db = require("../config/connection");
const collection = require("../config/collection");
const client = require("twilio")(
  "ACb64196ee52edb251cac1f7b22a64abc2",
  "149ef1cb9339a65981aece8a107147ff "
);
const serviceSid = "VA4abc2a3a969d55c5e82e7f055657af5f";

module.exports = {
  dosms: (noData) => {
    console.log("otp number", noData);
    let resp;
    return new Promise(async (resolve, reject) => {
      const isUser = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: noData.mobile })
        .then((data) => {
          if (data) {
            client.verify
              .services(serviceSid)
              .verifications.create({
                to: `+91${noData.mobile}`,
                channel: "sms",
              })
              .then((res) => {
                resp.valid = true;
                console.log(res);
                resolve({ res, data, status: true });
              });
            resolve({ data, status: true });
          } else {
            resolve({ status: false });
          }
          return data;
        });
      // console.log("otp number is user", isUser);
    });
  },
  otpVerify: (otpData, nuData) => {
    let resp = {};
    return new Promise(async (resolve, reject) => {
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: otpData.mobile });
      client.verify
        .services(serviceSid)
        .verificationChecks.create({
          to: `+91${otpData.mobile}`,
          code: otpData.otp,
        })
        .then((resp) => {
          console.log("verification success");
          console.log(resp, user);
          resolve({ resp, user });
        });
    });
  },
};

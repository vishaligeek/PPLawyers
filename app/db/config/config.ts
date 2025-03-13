import mongoose from "mongoose";
require("dotenv").config();

exports.connect = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to Database!");
    })
    .catch((e) => {
      console.log("Error Connecting to database ", e);
    });
};

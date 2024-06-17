require("dotenv").config();
var mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const option = {
  socketTimeoutMS: 30000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
};

let dbURI = process.env.MONGODB_CONNECT_URI;
console.log(`dbURI=${dbURI}`);

mongoose.connect(dbURI, option);

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB Cluster");
});

mongoose.connection.on("error", function (err) {
  if (err) {
    console.log(err.message);
    throw err;
  }
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

module.exports = {
  mongoose,
  models: {
    Users: require("./schemas/users"),
    Message: require("./schemas/message"),
  },
};

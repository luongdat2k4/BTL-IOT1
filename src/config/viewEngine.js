const express = require("express");
const app = express();
const path = require("path");

const configViewEngine = (app) => {
  //   console.log("check >>>>", path.join("./src", "public"));

  //static file
  app.use(express.static(path.join("./src", "public")));

  //config template engine
  app.set("view engine", "ejs");
  app.set("views", ["./src/views", "./frontend"]);
};

module.exports = configViewEngine;

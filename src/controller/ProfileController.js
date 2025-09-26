const { render } = require("ejs");
const { json } = require("express");

const getProfile = (req, res) => {
  res.render("profile.ejs");
};

module.exports = { getProfile };

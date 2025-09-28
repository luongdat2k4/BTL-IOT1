const express = require("express");
const router = express.Router();
const { getHome } = require("../controller/HomeController");
const { getDataRes, findDB } = require("../controller/DataResController");
const { getProfile } = require("../controller/ProfileController");
const { getHis, findHis } = require("../controller/HistoryController");

router.get("/", (req, res) => {
  res.send("Hello");
});

router.get("/home", getHome);

router.get("/data-requets", getDataRes);

router.get("/history", getHis);

router.get("/profile", getProfile);

router.get("/data-requets/:sensor", async (req, res) => {
  const sensor = req.params.sensor;
  const key = req.query.key;
  await findDB(req, res, key, sensor);
});

router.get("/history/:sensor", async (req, res) => {
  const sensor = req.params.sensor;
  const key = req.query.key;
  await findHis(req, res, key, sensor);
});

router.post("/test", (req, res) => {
  console.log(">>> check req:", req.body);
  res.send("Hello test");
});

router.get("/tmp", (req, res) => {
  res.render("test.ejs");
});

module.exports = router;

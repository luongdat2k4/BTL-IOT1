const express = require("express");
const router = express.Router();
const { getHome } = require("../controller/HomeController");
const { getDataRes, findDB } = require("../controller/DataResController");
const { getProfile } = require("../controller/ProfileController");
const { getHis, selectDropdown } = require("../controller/HistoryController");

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

router.get("/history/:device", (req, res) => {
  const tmp = req.params.device;
  const [device, status, key] = tmp.split("&");
  selectDropdown(req, res, key, device, status);
});

module.exports = router;

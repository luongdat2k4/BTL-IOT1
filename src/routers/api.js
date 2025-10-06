const express = require("express");
const router = express.Router();
const {
  controlDevice,
  getStatusDevice,
} = require("../controller/LedController");

const { getLastSensor } = require("../models/IotDataRequets");
const e = require("express");

router.post("/controll/light", (req, res) => {
  console.log("Dữ liệu nhận từ frontend:", req.body);

  const { device, status, values } = req.body;
  controlDevice(device, status);
  getStatusDevice(device);
  res.json({
    message: "Đèn đã được điều khiển!",
    data: req.body,
  });
});

router.post("/controll/humi", (req, res) => {
  console.log("Dữ liệu nhận từ frontend:", req.body);

  const { device, status, values } = req.body;
  controlDevice(device, status);
  getStatusDevice(device);
  res.json({
    message: "Đèn đã được điều khiển!",
    data: req.body,
  });
});

router.post("/controll/temp", (req, res) => {
  console.log("Dữ liệu nhận từ frontend:", req.body);

  const { device, status } = req.body;
  controlDevice(device, status);
  getStatusDevice(device);
  res.json({
    message: "Đèn đã được điều khiển!",
    data: req.body,
  });
});

router.get("/getAllDB", async (req, res) => {
  const rawData = await getLastSensor();
  const db = rawData.map((item) => ({
    humidity: item[0],
    light: item[1],
    temperature: item[2],
    time: item[3],
  }));
  res.json(db);
});

router.post("/insertHis", (req, res) => {
  console.log("Dữ liệu nhận từ frontend:", req.body);
  res.json(req.body);
});

router.post("/findData", (req, res) => {
  console.log("Dữ liệu nhận từ frontend:", req.body);
  const key = req.body.key;
  const sensor = req.body.sensor;
  const encodedKey = encodeURIComponent((key ?? "").toString());
  res.redirect(`/data-requets/${sensor}?key=${encodedKey}`);
});

router.post("/findHistory", (req, res) => {
  console.log("Dữ liệu nhận từ frontend:", req.body);
  const encodedKey = encodeURIComponent(req.body.key || "");
  res.redirect(`/history/${req.body.device}&${req.body.status}&${encodedKey}`);
});

router.post("/dropdown", (req, res) => {
  console.log(">>> dropdown body:", req.body);
  const device = (req.body.device || "").toString().trim();
  const status = (req.body.status || "").toString().trim().toUpperCase();
  res.json({ message: "ok", device, status });
});

router.post("/sortDB", (req, res) => {
  console.log(">>> sortDB body:", req.body);
  const sort = (req.body.sort || "DESC").toString().trim().toUpperCase();
  if (sort !== "ASC" && sort !== "DESC") {
    return res.status(400).json({ message: "Invalid sort value" });
  }
  res.json({ message: "ok", sort });
});

module.exports = router;

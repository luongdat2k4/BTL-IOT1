const express = require("express");
const router = express.Router();
const {
  controlDevice,
  getStatusDevice,
} = require("../controller/LedController");

const { getLastSensor } = require("../models/IotDataRequets");

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
  const key = req.body.key;
  const sensor = req.body.sensor;
  console.log("key, sensor >>>", key, sensor);
  const encodedKey = encodeURIComponent((key ?? "").toString());
  res.redirect(`/history/${sensor}?key=${encodedKey}`);
});

router.post("/sortDB", (req, res) => {
  console.log(">>> sortDB body:", req.body);
  const sort = (req.body.sort || "DESC").toString().trim().toUpperCase();
  if (sort !== "ASC" && sort !== "DESC") {
    return res.status(400).json({ message: "Invalid sort value" });
  }
  res.json({ message: "ok", sort });
});

router.post("/sortHis", (req, res) => {
  console.log(">>> sortHis body:", req.body);
  const sort = (req.body.sort || "DESC").toString().trim().toUpperCase();
  if (sort !== "ASC" && sort !== "DESC") {
    return res.status(400).json({ message: "Invalid sort value" });
  }
  res.json({ message: "ok", sort });
});

module.exports = router;

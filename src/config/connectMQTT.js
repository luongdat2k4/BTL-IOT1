const mqtt = require("mqtt");
require("dotenv").config();
const { inHIS } = require("../controller/HistoryController");
const { createNewData } = require("../models/MQTT");

const client = mqtt.connect(process.env.MQTT_BROKER, {
  port: process.env.MQTT_PORT,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  protocol: "mqtts", // Bắt buộc dùng TLS
  rejectUnauthorized: false, // Chấp nhận chứng chỉ self-signed
  reconnectPeriod: 1000, // Thử reconnect mỗi 1s nếu mất kết nối
});

const topics = ["sensor", "status/light", "status/temp", "status/humi"];

client.on("connect", () => {
  console.log("MQTT Connected");
  client.subscribe(topics, (err) => {
    if (err) {
      console.error("Lỗi subscribe:", err);
    } else {
      console.log("Đã subscribe:", topics.join(", "));
    }
  });
});

const topicHandlers = new Map();

function registerHandler(device, values) {
  const tmp = `status/${device}`;
  topicHandlers.set(tmp, async (message) => {
    const data = JSON.parse(message.toString());
    console.log(`Trạng thái ${device}:`, data);
    await inHIS(device, data.status, values);
  });
}

client.on("message", async (topic, message) => {
  try {
    if (topicHandlers.has(topic)) {
      await topicHandlers.get(topic)(message);
    } else if (topic === "sensor") {
      const data = JSON.parse(message.toString());
      console.log("Sensor data:", data);
      await createNewData(data);
    } else {
      console.log("Không có handler cho:", topic);
    }
  } catch (err) {
    console.error("Lỗi xử lý MQTT:", err.message);
    console.log("Dữ liệu thô:", message.toString());
  }
});

module.exports = { client, registerHandler };

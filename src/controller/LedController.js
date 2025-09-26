const { client, registerHandler } = require("../config/connectMQTT");
const { inHIS } = require("./HistoryController");
const connection = require("../config/connectDB");

const controlDevice = (device, status) => {
  const topic = `control/${device}`;
  client.publish(topic, status, { qos: 1, retain: false }, (err) => {
    if (err) {
      console.error(`Gửi lệnh thất bại (${device}):`, err);
    } else {
      console.log(`Gửi lệnh thành công: ${device} -> ${status}`);
    }
  });
};

const getStatusDevice = async (device, values) => {
  registerHandler(device, values);
};

// controlDevice("light", "ON"); //green
// getStatusDevice("light", true);
// controlDevice("humi", "OFF"); //red
// getStatusDevice("humi");
// controlDevice("temp", "OFF"); //yellow

module.exports = { controlDevice, getStatusDevice };

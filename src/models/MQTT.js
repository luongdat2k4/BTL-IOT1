const { getLastSensor, insertDBrequest } = require("../models/IotDataRequets");

const createNewData = async (data) => {
  const newData = data;
  console.log("Dữ liệu từ MQTT.js:", newData);
  try {
    const getlast = await getLastSensor();
    await insertDBrequest(
      getlast,
      newData.humidity,
      newData.light,
      newData.temperature,
      newData.HumidityLed,
      newData.LightLed,
      newData.TemperatureLed
    );
  } catch (e) {
    console.error("Lỗi :", e);
    throw e;
  }
};

module.exports = { createNewData };

const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

const { getLastDB } = require("./models/IotDataRequets");
const { setSocketIO } = require("./config/connectMQTT");

// config socket
const server = http.createServer(app);
const io = socketIO(server);

// Set Socket.IO instance cho MQTT
setSocketIO(io);

// config viewEngine
const viewEngine = require("./config/viewEngine");
viewEngine(app);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Swagger UI (serves generated src/swagger.json)
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
try {
  const swaggerDocument = require("../src/swagger.json");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn(
    "Swagger UI: could not load swagger.json - skipping /api-docs",
    err.message
  );
}

// Router
const webRouter = require("./routers/router");
const API = require("./routers/api");
app.use("/", webRouter);
app.use("/api", API);
app.use(
  "/chartjs",
  express.static(path.join(__dirname, "../node_modules/chart.js/dist"))
);

io.on("connection", async (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Lấy dữ liệu cuối cùng từ DB
  const lastDB = await getLastDB();
  const lastData = lastDB[lastDB.length - 1]; // Bản ghi mới nhất

  const initialData = {
    humidity: lastData[0],
    light: lastData[1],
    temperature: lastData[2],
    time: lastData[3],
  };

  // Gửi dữ liệu ban đầu cho client
  socket.emit("sensorData", initialData);

  // Gửi dữ liệu mới mỗi 3 giây
  setInterval(async () => {
    const newDB = await getLastDB();
    const lastData = newDB[newDB.length - 1];

    const newData = {
      humidity: lastData[0],
      light: lastData[1],
      temperature: lastData[2],
      time: lastData[3],
    };

    // Gửi dữ liệu mới cho tất cả client
    io.emit("sensorUpdate", newData);
  }, 3000);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

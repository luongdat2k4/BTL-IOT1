const connection = require("../config/connectDB");
const dayjs = require("dayjs");

const getLastSensor = async () => {
  try {
    const [rows] = await connection.query(
      `SELECT RequestID
       FROM iot.DataRequest
       ORDER BY CAST(SUBSTRING(RequestID, 4) AS UNSIGNED) DESC
       LIMIT 1;`
    );

    if (rows.length === 0) {
      console.log("Không có dữ liệu trong bảng → Bắt đầu từ REQ001");
      return "REQ001";
    }
    const lastID = rows[0][0];
    console.log("lastID >>>", lastID);
    const numericPart = parseInt(lastID.replace("REQ", ""), 10);
    console.log("numericPart >>>", numericPart);
    const nextID = `REQ${String(numericPart + 1).padStart(3, "0")}`;
    return nextID;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu cuối cùng:", error);
    throw error;
  }
};

const insertDBrequest = async (
  requestId,
  humidity,
  light,
  temperature,
  humLed,
  lightLed,
  temLed
) => {
  try {
    const [result] = await connection.query(
      `INSERT INTO iot.DataRequest 
       (RequestID, Humidity, Light, Temperature, HumidityLed, LightLed, TemperatureLed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [requestId, humidity, light, temperature, humLed, lightLed, temLed]
    );

    console.log("Đã chèn dữ liệu thành công! RequestID:", requestId);
    return result;
  } catch (error) {
    console.error("Lỗi khi insert vào DataRequest:", error);
    throw error;
  }
};

const getLastDB = async () => {
  try {
    const [result] = await connection.query(
      `SELECT Humidity,Light,Temperature,Time FROM iot.datarequest
       ORDER BY time DESC
      LIMIT 1`
    );
    return result;
  } catch (error) {
    console.log("Lỗi lấy dữ liệu: ", error);
    throw error; // Throw error thay vì sử dụng res
  }
};

const getAllDB = async (sort) => {
  try {
    const [result] = await connection.query(
      `SELECT Humidity,Light,Temperature,Time
      FROM iot.datarequest
      ORDER BY RequestID ${sort};`
    );
    return result;
  } catch (error) {
    console.log("Lỗi lấy dữ liệu: ", error);
    throw error;
  }
};

const findREQ = async (key, sensor, sort = "DESC") => {
  try {
    sort = (sort || "DESC").toString().trim().toUpperCase();
    if (sort !== "ASC" && sort !== "DESC") sort = "DESC";

    if (["Humidity", "Light", "Temperature"].includes(sensor)) {
      const numKey = Number(key);
      if (Number.isNaN(numKey)) {
        return [];
      }
      const query = `
      SELECT Humidity,Light,Temperature,Time 
      FROM iot.datarequest 
      WHERE ${sensor} > ? AND ${sensor} < ?
      ORDER BY RequestID ${sort};
    `;
      const [rows] = await connection.query(query, [
        numKey - 0.01,
        numKey + 0.01,
      ]);
      return rows;
    } else if (["all"].includes(sensor)) {
      const numKey = Number(key);
      if (Number.isNaN(numKey)) return [];

      const query = `
        SELECT Humidity, Light, Temperature, Time
        FROM iot.datarequest
        WHERE (Humidity BETWEEN ? AND ?)
           OR (Light BETWEEN ? AND ?)
           OR (Temperature BETWEEN ? AND ?)
        ORDER BY RequestID ${sort};
      `;
      const [rows] = await connection.query(query, [
        numKey - 0.01,
        numKey + 0.01,
        numKey - 0.01,
        numKey + 0.01,
        numKey - 0.01,
        numKey + 0.01,
      ]);
      return rows;
    } else if ((sensor || "").toLowerCase() === "time") {
      if (!key || typeof key !== "string") {
        const [rows] = await connection.query(
          `SELECT Humidity,Light,Temperature,Time FROM iot.datarequest ORDER BY RequestID ${sort}`
        );
        return rows;
      }

      const s = key.trim();
      const timeOnlyRegex = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/;
      const timeMatch = s.match(timeOnlyRegex);
      if (timeMatch) {
        const hh = String(Number(timeMatch[1])).padStart(2, "0");
        const mm = timeMatch[2]
          ? String(Number(timeMatch[2])).padStart(2, "0")
          : null;
        const ss = timeMatch[3]
          ? String(Number(timeMatch[3])).padStart(2, "0")
          : null;
        let startTime, endTime;
        if (ss) {
          startTime = `${hh}:${mm}:${ss}`;
          endTime = startTime;
        } else if (mm) {
          startTime = `${hh}:${mm}:00`;
          endTime = `${hh}:${mm}:59`;
        } else {
          startTime = `${hh}:00:00`;
          endTime = `${hh}:59:59`;
        }

        const query = `
          SELECT Humidity,Light,Temperature,Time
          FROM iot.datarequest
          WHERE TIME(Time) BETWEEN ? AND ?
          ORDER BY RequestID ${sort};
        `;
        const [rows] = await connection.query(query, [startTime, endTime]);
        return rows;
      }
      const formatsToTry = [
        "DD/MM/YYYY HH:mm:ss",
        "DD/MM/YYYY HH:mm",
        "DD/MM/YYYY HH",
        "DD/MM/YYYY",
        "YYYY-MM-DD HH:mm:ss",
        "YYYY-MM-DD HH:mm",
        "YYYY-MM-DD HH",
        "YYYY-MM-DD",
      ];

      let start = null;
      let end = null;
      const dayjs = require("dayjs");
      const customParseFormat = require("dayjs/plugin/customParseFormat");
      dayjs.extend(customParseFormat);

      for (const fmt of formatsToTry) {
        const parsed = dayjs(s, fmt, true);
        if (parsed.isValid && parsed.isValid()) {
          if (fmt.endsWith("ss")) {
            start = parsed.startOf("second").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("second").format("YYYY-MM-DD HH:mm:ss");
          } else if (fmt.endsWith("mm")) {
            start = parsed.startOf("minute").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("minute").format("YYYY-MM-DD HH:mm:ss");
          } else if (fmt.endsWith("HH")) {
            start = parsed.startOf("hour").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("hour").format("YYYY-MM-DD HH:mm:ss");
          } else {
            start = parsed.startOf("day").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("day").format("YYYY-MM-DD HH:mm:ss");
          }
          break;
        }
      }

      if (!start) {
        const alt = s.replace(/\//g, "-");
        const parsed = dayjs(alt);
        if (parsed.isValid && parsed.isValid()) {
          const parts = s.split(/\s+/);
          if (parts.length === 2 && parts[1].split(":").length === 3) {
            start = parsed.startOf("second").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("second").format("YYYY-MM-DD HH:mm:ss");
          } else if (parts.length === 2 && parts[1].split(":").length === 2) {
            start = parsed.startOf("minute").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("minute").format("YYYY-MM-DD HH:mm:ss");
          } else if (parts.length === 2 && parts[1].split(":").length === 1) {
            start = parsed.startOf("hour").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("hour").format("YYYY-MM-DD HH:mm:ss");
          } else {
            start = parsed.startOf("day").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("day").format("YYYY-MM-DD HH:mm:ss");
          }
        }
      }

      if (start && end) {
        const query = `
          SELECT Humidity,Light,Temperature,Time
          FROM iot.datarequest
          WHERE Time BETWEEN ? AND ?
          ORDER BY RequestID ${sort};
        `;
        const [rows] = await connection.query(query, [start, end]);
        return rows;
      }
      const likeKey = `%${s}%`;
      const query = `
        SELECT Humidity,Light,Temperature,Time
        FROM iot.datarequest
        WHERE DATE_FORMAT(Time, '%d/%m/%Y %H:%i:%s') LIKE ?
        ORDER BY RequestID ${sort};
      `;
      const [rows] = await connection.query(query, [likeKey]);
      return rows;
    }
  } catch (error) {
    console.error("Lỗi findDB:", error);
    throw error;
  }
};

module.exports = {
  getLastSensor,
  insertDBrequest,
  getLastDB,
  getAllDB,
  findREQ,
};

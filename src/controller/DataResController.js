const { render } = require("ejs");
const { json } = require("express");
const dayjs = require("dayjs");
const { getAllDB, getLastDB, findREQ } = require("../models/IotDataRequets");
const connection = require("../config/connectDB");

const getDataRes = async (req, res) => {
  try {
    let sort = (req.query.sort || "DESC").toString().trim().toUpperCase();
    if (sort !== "ASC" && sort !== "DESC") sort = "DESC";

    const data = await getAllDB(sort);

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    if (isNaN(limit) || limit <= 0) limit = 10;

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const allData = data.slice(startIndex, endIndex).map((item) => ({
      humidity: item[0],
      light: item[1],
      temperature: item[2],
      time: dayjs(item[3]).format("DD/MM/YYYY HH:mm:ss"),
    }));

    res.render("dataRequets.ejs", {
      allData,
      currentPage: page,
      totalPages,
      key: null,
      sensor: null,
      sort,
      limit,
      startIndex,
    });
  } catch (error) {
    console.error("Lỗi getDataRes:", error);
    res.status(500).send("Lỗi server");
  }
};

const findDB = async (req, res, key, sensor) => {
  try {
    let sort = (req.query.sort || "DESC").toString().trim().toUpperCase();
    if (sort !== "ASC" && sort !== "DESC") sort = "DESC";

    const data = await findREQ(key, sensor, sort);
    const redata = data.reverse();

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    if (isNaN(limit) || limit <= 0) limit = 10;
    const totalItems = redata.length;
    const totalPages = Math.ceil(totalItems / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const allData = redata.slice(startIndex, endIndex).map((item) => ({
      humidity: item[0],
      light: item[1],
      temperature: item[2],
      time: dayjs(item[3]).format("DD/MM/YYYY HH:mm:ss"),
    }));
    res.render("dataRequets.ejs", {
      allData,
      currentPage: page,
      totalPages,
      key,
      sensor,
      sort,
      limit,
      startIndex,
    });
  } catch (error) {
    console.error("Lỗi getDataRes:", error);
    res.status(500).send("Lỗi server");
  }
};
module.exports = { getDataRes, findDB };

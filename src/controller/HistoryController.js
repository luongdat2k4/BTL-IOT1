const { render } = require("ejs");
const { json } = require("express");
const dayjs = require("dayjs");
const connection = require("../config/connectDB");

const {
  getLastHis,
  insertDBhistory,
  getAllHistory,
  dropdown,
} = require("../models/IotHistory");

const inHIS = async (device, status, values) => {
  try {
    const hisID = await getLastHis();
    console.log("hisID >>>", hisID);
    await insertDBhistory(hisID, `${device}Led`, status);
  } catch (err) {
    console.error("Lỗi inHIS:", err);
    throw err;
  }
};

const getHis = async (req, res) => {
  try {
    const his = await getAllHistory();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const totalItems = his.length;
    const totalPages = Math.ceil(totalItems / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);

    const allHis = his.slice(startIndex, endIndex).map((item) => ({
      hisID: item[0],
      device: item[1],
      status: item[2],
      time: dayjs(item[3]).format("DD/MM/YYYY HH:mm:ss"),
    }));

    res.render("history.ejs", {
      allHis,
      currentPage: page,
      totalPages,
      key: null,
      device: null,
      status: null,
    });
  } catch (err) {
    console.error("Lỗi getHis:", err);
  }
};

const selectDropdown = async (req, res, key, device, status) => {
  try {
    const his = await dropdown(device, key, status);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const totalItems = his.length;
    const totalPages = Math.ceil(totalItems / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);

    const allHis = his.slice(startIndex, endIndex).map((item) => ({
      hisID: item[0],
      device: item[1],
      status: item[2],
      time: dayjs(item[3]).format("DD/MM/YYYY HH:mm:ss"),
    }));

    res.render("history.ejs", {
      allHis,
      currentPage: page,
      totalPages,
      key,
      device,
      status,
    });
  } catch (err) {
    console.error("Lỗi getHis:", err);
  }
};

module.exports = { getHis, inHIS, selectDropdown };

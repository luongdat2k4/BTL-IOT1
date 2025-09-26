const { render } = require("ejs");
const { json } = require("express");
const connection = require("../config/connectDB");

const getHome = async (req, res) => {
  try {
    const [rows] = await connection.query(
      `SELECT * FROM iot.datarequest ORDER BY Time DESC LIMIT 1`
    );
    const data = {
      humiLed: rows[0][5],
      lightLed: rows[0][6],
      tempLed: rows[0][7],
    };
    res.render("home.ejs", { data: data });
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = { getHome };

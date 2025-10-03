## BTL-IOT1 — IoT System (Node.js + MQTT + MySQL)

This README documents the project, how to set it up locally, environment variables, database schema, MQTT topics, routes, and quick smoke tests.

Overview
--------

BTL-IOT1 is a demo IoT platform built with Node.js (Express). It receives sensor data via MQTT, stores it in a MySQL database, and serves a web UI rendered with EJS. Socket.IO is used to push real-time sensor updates to connected clients.

Key features
- Receives sensor messages on the `sensor` MQTT topic and stores data in the `datarequest` table.
- Receives device status messages on `status/light`, `status/temp`, `status/humi` and logs events to the `history` table.
- Web UI (EJS) shows data tables, history and charts. Socket.IO emits updates every 3 seconds.
- Simple internal API endpoints to control devices from the frontend.

Requirements
------------

- Node.js (LTS recommended: 16+ or 18+)
- npm
- MySQL or MariaDB

Quick start
-----------

1. Clone the repository and enter the project folder:

```powershell
# run in PowerShell
git clone <repo-url> .
cd "e:\kì 1 năm 4\BTL-IOT1"
```

2. Install dependencies:

```powershell
npm install
```

3. Create a `.env` file in the project root (see example below).

4. Start the app in development mode (uses nodemon):

```powershell
npm run dev
```

By default the server listens on port 3000 (see `src/app.js`).

Environment variables (.env example)
----------------------------------

Create a `.env` file with the following variables (replace values):

```
# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_PORT=3306
DB_DATABASE=iot

# MQTT
MQTT_BROKER=tcp://broker.example.com  # or mqtts://...
MQTT_PORT=8883
MQTT_USERNAME=your_mqtt_user
MQTT_PASSWORD=your_mqtt_password
```

Notes:
- `src/config/connectMQTT.js` configures the MQTT client with `protocol: 'mqtts'` and `rejectUnauthorized: false` (accepts self-signed certificates). Adjust if your broker uses plain TCP.
- The code queries the `iot` schema by default (queries like `FROM iot.datarequest`). Either create a database named `iot` or change `DB_DATABASE` accordingly.

Database schema (summary)
-------------------------

Main tables (from `InsertSQL.sql`):

- `datarequest` — sensor data
  - `RequestID` VARCHAR(50) PRIMARY KEY
  - `Humidity` FLOAT
  - `Light` FLOAT
  - `Temperature` FLOAT
  - `Time` DATETIME
  - `HumidityLed`, `LightLed`, `TemperatureLed` (VARCHAR) — device statuses

- `user`
  - `UserID` VARCHAR(50) PRIMARY KEY
  - `name` VARCHAR(100)
  - `phoneNumber` VARCHAR(15)

- `history`
  - `HistoryID` VARCHAR(50) PRIMARY KEY
  - `Subject` VARCHAR(255)
  - `Status` VARCHAR(50)
  - `UserID` (FK -> `user.UserID`)
  - `RequestID` (FK -> `datarequest.RequestID`)
  - `Time` DATETIME

MQTT topics and flow
---------------------

The application subscribes to these topics (see `src/config/connectMQTT.js`):

- `sensor` — payload expected as JSON, example:
  ```json
  { "humidity": 60, "light": 120, "temperature": 25.4, "HumidityLed": "ON", "LightLed": "OFF", "TemperatureLed": "OFF" }
  ```
- `status/light`, `status/temp`, `status/humi` — JSON messages indicating device status; handlers will insert entries into the history table.

When `sensor` messages arrive, `src/models/MQTT.js` calls `createNewData()` which inserts rows into `datarequest` (via the model `src/models/IotDataRequets.js`).

Socket.IO realtime behavior
---------------------------

- When a client connects the server emits `sensorData` with the latest record.
- The server emits `sensorUpdate` to all connected clients every 3 seconds with the newest data (see `src/app.js`).

API & Routes
------------

API routes are mounted under `/api` (see `src/app.js`). Key endpoints in `src/routers/api.js`:

- POST `/api/controll/light` — control light device (body: `{ device, status, values }`)
- POST `/api/controll/humi` — control humidity device
- POST `/api/controll/temp` — control temperature device
- GET `/api/getAllDB` — return latest sensor record(s)
- POST `/api/findData` — redirect to data request route

Frontend routes in `src/routers/router.js`:

- GET `/home` — home page
- GET `/data-requets` and `/data-requets/:sensor` — view sensor data
- GET `/history` and `/history/:sensor` — view history
- GET `/profile` — profile page

Swagger
-------

If `src/swagger.json` exists the app will serve Swagger UI at `/api-docs` using `swagger-ui-express`.

Quick smoke test
----------------

1. Start the app: `npm run dev`.
2. Open `http://localhost:3000/home`.
3. Confirm DB connection log: `Kết nối MySQL thành công!` appears in console on startup.
4. Confirm MQTT connected log: `MQTT Connected` and subscribed topics.

Notes & next steps
------------------

- Consider adding a `.env.example` file for contributors.
- Optionally add a SQL script that creates the `iot` schema and the tables using `InsertSQL.sql`.
- If you want, I can add a `create_database.sql` script or a `.env.example` file now and mark this task done.

Contributing
------------

Fork the repo, create a feature branch, implement changes and open a pull request. Please describe the purpose of your changes in the PR.

License
-------

No license is specified in `package.json`. Add a LICENSE file if you want to publish this project with a specific license.


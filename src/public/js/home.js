//dk anh sang
const LightId = document.querySelector("#LightId").value;
if (LightId === "ON") {
  document.querySelector("#light-switch").dataset.status = "true";
  document.querySelector("#light-bulb").dataset.status = "true";
} else {
  document.querySelector("#light-switch").dataset.status = "false";
  document.querySelector("#light-bulb").dataset.status = "false";
}
const onLight = document.querySelector("#light-switch");
const statusLightBulb = document.querySelector("#light-bulb");
onLight.addEventListener("click", async () => {
  const currentStatus = onLight.dataset.status === "true";
  const newStatus = !currentStatus;
  onLight.dataset.status = String(newStatus);

  const currentBulb = statusLightBulb.dataset.status === "true";
  const newBulb = !currentBulb;
  statusLightBulb.dataset.status = String(newBulb);

  const response = await fetch("http://localhost:3000/api/controll/light", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device: "light",
      status: newStatus ? "ON" : "OFF",
      value: newStatus,
    }),
  });

  const result = await response.json();
  console.log("Phản hồi từ server:", result);
});

// dk nhiet do
const HumiId = document.querySelector("#HumiId").value;
if (HumiId === "ON") {
  document.querySelector("#air-switch").dataset.status = "true";
} else {
  document.querySelector("#air-switch").dataset.status = "false";
}
const onHumi = document.querySelector("#air-switch");
onHumi.addEventListener("click", async () => {
  const currentStatus = onHumi.dataset.status === "true";
  const newStatus = !currentStatus;
  onHumi.dataset.status = String(newStatus);
  console.log(newStatus);

  const response = await fetch("http://localhost:3000/api/controll/humi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device: "humi",
      status: newStatus ? "ON" : "OFF",
      value: newStatus,
    }),
  });

  const result = await response.json();
  console.log("Phản hồi từ server:", result);
});

// dk do am
const TempId = document.querySelector("#TempId").value;
if (TempId === "ON") {
  document.querySelector("#fan-switch").dataset.status = "true";
} else {
  document.querySelector("#fan-switch").dataset.status = "false";
}
const onTemp = document.querySelector("#fan-switch");
onTemp.addEventListener("click", async () => {
  const currentStatus = onTemp.dataset.status === "true";
  const newStatus = !currentStatus;
  onTemp.dataset.status = String(newStatus);

  const response = await fetch("http://localhost:3000/api/controll/temp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device: "temp",
      status: newStatus ? "ON" : "OFF",
      value: newStatus,
    }),
  });

  const result = await response.json();
  console.log("Phản hồi từ server:", result);
});

// Setup: single multi-series chart (light, temperature, humidity)
const multiCtx = document.getElementById("multiChart").getContext("2d");
// create canvas gradients for nicer fills
const _multiCanvas = multiCtx.canvas;
const gradientLight = multiCtx.createLinearGradient(
  0,
  0,
  0,
  _multiCanvas.height
);
gradientLight.addColorStop(0, "rgba(255,153,51,0.30)");
gradientLight.addColorStop(1, "rgba(255,153,51,0.04)");
const gradientTemp = multiCtx.createLinearGradient(
  0,
  0,
  0,
  _multiCanvas.height
);
gradientTemp.addColorStop(0, "rgba(255,69,58,0.20)");
gradientTemp.addColorStop(1, "rgba(255,69,58,0.02)");
const gradientHumi = multiCtx.createLinearGradient(
  0,
  0,
  0,
  _multiCanvas.height
);
gradientHumi.addColorStop(0, "rgba(54,113,255,0.20)");
gradientHumi.addColorStop(1, "rgba(54,113,255,0.04)");

// Hàm gọi API để lấy dữ liệu ban đầu (optional, used for initial fill)
async function fetchInitialData() {
  try {
    const response = await fetch("http://localhost:3000/api/getAllDB");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    return [];
  }
}

const initialData = await fetchInitialData();

const multiChart = new Chart(multiCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Ánh sáng (%)",
        data: [],
        borderColor: "rgba(255,153,51,1)",
        backgroundColor: gradientLight,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        yAxisID: "y",
      },
      {
        label: "Nhiệt độ (°C)",
        data: [],
        borderColor: "rgba(255,69,58,1)",
        backgroundColor: gradientTemp,
        tension: 0.35,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        yAxisID: "y1",
      },
      {
        label: "Độ ẩm (%)",
        data: [],
        borderColor: "rgba(54,113,255,1)",
        backgroundColor: gradientHumi,
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        yAxisID: "y",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: { duration: 900, easing: "easeOutQuint" },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: { usePointStyle: true, padding: 12 },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (!label) return "";
            // left axis datasets (Ánh sáng / Độ ẩm) use percent
            if (label.includes("Ánh sáng") || label.includes("Độ ẩm")) {
              return label + ": " + value + " %";
            }
            // temperature
            if (label.includes("Nhiệt độ")) {
              return label + ": " + value + " °C";
            }
            return label + ": " + value;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Thời gian (HH:mm:ss)" },
        ticks: { autoSkip: true, maxTicksLimit: 8, color: "#334155" },
        grid: { color: "rgba(200,200,200,0.08)" },
      },
      y: {
        position: "left",
        title: { display: true, text: "Ánh sáng (%) / Độ ẩm (%)" },
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function (value) {
            return value + "%";
          },
        },
      },
      y1: {
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Nhiệt độ (°C)" },
      },
    },
  },
});

// Prefill chart with last up to 10 points (if available)
if (Array.isArray(initialData) && initialData.length) {
  const last = initialData.slice(-10);
  last.forEach((d) => {
    const dt = new Date(d.time);
    const time = dt.toLocaleTimeString("en-GB", { hour12: false }); // HH:mm:ss
    multiChart.data.labels.push(time);
    const lightPct = Math.max(0, Math.min(100, (d.light / 2000) * 100));
    multiChart.data.datasets[0].data.push(Number(lightPct.toFixed(2)));
    multiChart.data.datasets[1].data.push(d.temperature);
    multiChart.data.datasets[2].data.push(d.humidity);
  });
  multiChart.update();
  // Update displayed sensor values (name1, name2, name3)
  const latest = last[last.length - 1];
  if (latest) {
    const el1 = document.getElementById("name1");
    const el2 = document.getElementById("name2");
    const el3 = document.getElementById("name3");
    // display raw lux in the UI; chart still shows percent
    if (el1) el1.textContent = `${latest.light} lux`;
    if (el2) el2.textContent = `${latest.temperature} °C`;
    if (el3) el3.textContent = `${latest.humidity} %`;
  }
}

const socket = io(); // kết nối tới server socket

// Helper to push new point and keep only last 10 points
function pushData(time, light, temp, humi) {
  // maintain labels array as time strings
  const maxPoints = 10;
  if (multiChart.data.labels.length >= maxPoints)
    multiChart.data.labels.shift();
  multiChart.data.labels.push(time);

  // datasets (numeric arrays aligned with labels)
  const ds0 = multiChart.data.datasets[0].data; // light
  const ds1 = multiChart.data.datasets[1].data; // temp
  const ds2 = multiChart.data.datasets[2].data; // humi

  if (ds0.length >= maxPoints) ds0.shift();
  if (ds1.length >= maxPoints) ds1.shift();
  if (ds2.length >= maxPoints) ds2.shift();

  // convert raw light -> percent
  const lightPct = Math.max(0, Math.min(100, (light / 2000) * 100));
  ds0.push(Number(lightPct.toFixed(2)));
  ds1.push(temp);
  ds2.push(humi);

  multiChart.update();
}

socket.on("sensorData", (data) => {
  updateMultiChart(data);
});
socket.on("sensorUpdate", (data) => {
  updateMultiChart(data);
});

// Sequential update: update datasets one-by-one so each animates separately
async function updateMultiChart(data) {
  const dt = new Date(data.time);
  const time = dt.toLocaleTimeString("en-GB", { hour12: false }); // HH:mm:ss

  const maxPoints = 10;
  // push label
  if (multiChart.data.labels.length >= maxPoints)
    multiChart.data.labels.shift();
  multiChart.data.labels.push(time);

  // Batch update: update all datasets and labels, then call update once for smooth transition
  const ds0 = multiChart.data.datasets[0].data;
  const ds1 = multiChart.data.datasets[1].data;
  const ds2 = multiChart.data.datasets[2].data;

  if (ds0.length >= maxPoints) ds0.shift();
  if (ds1.length >= maxPoints) ds1.shift();
  if (ds2.length >= maxPoints) ds2.shift();

  // map raw light to percent (0-100) for the chart dataset
  const dataLightPct = Math.max(0, Math.min(100, (data.light / 2000) * 100));
  ds0.push(Number(dataLightPct.toFixed(2)));
  ds1.push(data.temperature);
  ds2.push(data.humidity);

  // update UI labels with raw units
  const el1 = document.getElementById("name1");
  const el2 = document.getElementById("name2");
  const el3 = document.getElementById("name3");
  if (el1) el1.textContent = `${data.light} lux`;
  if (el2) el2.textContent = `${data.temperature} °C`;
  if (el3) el3.textContent = `${data.humidity} %`;

  // single smooth update
  multiChart.update();
}

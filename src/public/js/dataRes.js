const tmp = document.querySelector("#tmp");
const sortBtn = document.querySelector("#sort-button");
const sensor = document.querySelector("#sensor");
const key = document.querySelector("#key");
sortBtn.addEventListener("click", async () => {
  const currentStatus = sortBtn.dataset.status === "true";
  const newStatus = !currentStatus;
  sortBtn.dataset.status = newStatus;
  if (newStatus) {
    tmp.value = "ASC";
  } else {
    tmp.value = "DESC";
  }
  const response = await fetch("/api/sortDB", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sort: tmp.value.trim() }),
  });
  if (response.ok) {
    const data = await response.json();
    console.log("Sort response data:", data);
    const params = new URLSearchParams(window.location.search);
    // preserve limit and key/sensor if present; just set sort
    params.set("sort", tmp.value.trim());
    window.location.search = params.toString();
  } else {
    console.error("Sort request failed");
  }
});

// submit form when limit selection changes
const limitSelect = document.querySelector("#limit-select");
if (limitSelect) {
  limitSelect.addEventListener("change", (e) => {
    // find nearest form and submit
    const form = limitSelect.closest("form");
    if (form) form.submit();
  });
}

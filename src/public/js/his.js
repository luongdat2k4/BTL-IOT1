// const tmp = document.querySelector("#tmp");
// const sortBtn = document.querySelector("#sort-button");
// sortBtn.addEventListener("click", async () => {
//   const currentStatus = sortBtn.dataset.status === "true";
//   const newStatus = !currentStatus;
//   sortBtn.dataset.status = newStatus;
//   if (newStatus) {
//     tmp.value = "ASC";
//   } else {
//     tmp.value = "DESC";
//   }
//   const response = await fetch("/api/sortHis", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ sort: tmp.value.trim() }),
//   });
//   if (response.ok) {
//     const params = new URLSearchParams(window.location.search);
//     params.set("sort", tmp.value.trim());
//     window.location.search = params.toString();
//   } else {
//     console.error("Sort request failed");
//   }
// });

const hisLimitSelect = document.querySelector("#limit-select");
if (hisLimitSelect) {
  hisLimitSelect.addEventListener("change", () => {
    const form = hisLimitSelect.closest("form");
    if (form) form.submit();
  });
}

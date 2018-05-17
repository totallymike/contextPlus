function saveOptions(e) {
  e.preventDefault();

  const filterRegex = document.querySelector("#filter_regex").value.trim();
  browser.storage.sync.set({ filterRegex });
  document.querySelector("#saved_regex").innerText = filterRegex || "none set";
}

// Loads and displays the user's setting in the options UI
async function restoreOptions() {
  const filterStore = await browser.storage.sync.get("filterRegex");
  const filterRegex = filterStore.filterRegex;

  document.querySelector("#filter_regex").value = filterRegex || "";
  document.querySelector("#saved_regex").innerText = filterRegex || "none set";
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

(function () {
  "use strict";

  var loginScreen = document.getElementById("loginScreen");
  var dashScreen = document.getElementById("dashScreen");
  var passwordInput = document.getElementById("dashPassword");
  var loginBtn = document.getElementById("dashLoginBtn");
  var loginError = document.getElementById("dashLoginError");

  var groomBody = document.getElementById("groomTableBody");
  var brideBody = document.getElementById("brideTableBody");
  var groomEmpty = document.getElementById("groomEmpty");
  var brideEmpty = document.getElementById("brideEmpty");
  var statAttending = document.getElementById("statAttending");
  var statNotAttending = document.getElementById("statNotAttending");
  var exportGroomBtn = document.getElementById("exportGroomBtn");
  var exportBrideBtn = document.getElementById("exportBrideBtn");

  var currentData = { groom: [], bride: [] };
  var currentPassword = "";

  function responseLabel(value) {
    return value === "attending" ? "Attending" : "Not Attending";
  }

  function renderTable(tbody, emptyEl, rows) {
    tbody.innerHTML = "";
    if (!rows.length) {
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";
    rows.forEach(function (row) {
      var tr = document.createElement("tr");

      var nameTd = document.createElement("td");
      nameTd.textContent = row.name;
      tr.appendChild(nameTd);

      var dateTd = document.createElement("td");
      dateTd.textContent = row.dateTime;
      tr.appendChild(dateTd);

      var respTd = document.createElement("td");
      respTd.textContent = responseLabel(row.response);
      tr.appendChild(respTd);

      tbody.appendChild(tr);
    });
  }

  function loadDashboard(password) {
    loginError.textContent = "";
    loginBtn.disabled = true;

    fetch("/api/rsvp", {
      method: "GET",
      headers: { "x-dashboard-password": password },
    })
      .then(function (res) {
        if (res.status === 401) {
          throw new Error("unauthorized");
        }
        if (!res.ok) {
          throw new Error("failed");
        }
        return res.json();
      })
      .then(function (data) {
        currentPassword = password;
        currentData.groom = data.groom || [];
        currentData.bride = data.bride || [];

        renderTable(groomBody, groomEmpty, currentData.groom);
        renderTable(brideBody, brideEmpty, currentData.bride);

        statAttending.textContent = data.counts ? data.counts.attending : 0;
        statNotAttending.textContent = data.counts ? data.counts.notAttending : 0;

        loginScreen.hidden = true;
        dashScreen.hidden = false;
      })
      .catch(function (err) {
        if (err.message === "unauthorized") {
          loginError.textContent = "Incorrect password.";
        } else {
          loginError.textContent = "Something went wrong. Please try again.";
        }
      })
      .finally(function () {
        loginBtn.disabled = false;
      });
  }

  loginBtn.addEventListener("click", function () {
    var pwd = passwordInput.value;
    if (!pwd) {
      loginError.textContent = "Please enter the password.";
      return;
    }
    loadDashboard(pwd);
  });

  passwordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      loginBtn.click();
    }
  });

  function exportExcel(rows, filename) {
    if (typeof XLSX === "undefined") {
      window.alert("Excel export library failed to load. Check your connection and try again.");
      return;
    }
    var sheetData = rows.map(function (row) {
      return {
        Name: row.name,
        "Date & Time": row.dateTime,
        Response: responseLabel(row.response),
      };
    });
    var worksheet = XLSX.utils.json_to_sheet(sheetData);
    var workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    XLSX.writeFile(workbook, filename);
  }

  exportGroomBtn.addEventListener("click", function () {
    exportExcel(currentData.groom, "groom-side-responses.xlsx");
  });

  exportBrideBtn.addEventListener("click", function () {
    exportExcel(currentData.bride, "bride-side-responses.xlsx");
  });
})();

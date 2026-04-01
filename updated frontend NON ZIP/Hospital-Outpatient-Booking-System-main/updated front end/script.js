document.addEventListener("DOMContentLoaded", () => {
  setupProfileMenu();
  setupCalendar();
  setupTimeSelection();

  if (document.getElementById("appointments-list")) {
    loadAppointments();
  }

  if (document.getElementById("confirm-email")) {
    loadConfirmationDetails();
  }

  if (document.getElementById("change-date")) {
    loadChangeForm();
  }
});

function setupProfileMenu() {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", () => {
      profileMenu.style.display =
        profileMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.style.display = "none";
      }
    });
  }
}

function setupTimeSelection() {
  const timeList = document.getElementById("time-list");

  if (timeList) {
    timeList.addEventListener("click", (e) => {
      if (!e.target.classList.contains("slot-time")) return;

      document.querySelectorAll(".slot-time")
        .forEach(btn => btn.classList.remove("selected"));

      e.target.classList.add("selected");
    });
  }
}

function setupCalendar() {
  const days = document.querySelectorAll(".calendar-day");
  const dateOutput = document.getElementById("selected-date");
  const calendarTitle = document.getElementById("calendar-title");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (calendarTitle) {
    calendarTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  }

  if (dateOutput) {
    const defaultDate = `${String(currentDay).padStart(2, "0")}.${String(currentMonth + 1).padStart(2, "0")}.${currentYear}`;
    dateOutput.textContent = defaultDate;
  }

  if (days.length > 0 && dateOutput) {
    days.forEach(day => {
      day.addEventListener("click", () => {
        days.forEach(d => d.classList.remove("selected"));
        day.classList.add("selected");

        const dayNumber = day.textContent.trim();
        dateOutput.textContent = `${String(dayNumber).padStart(2, "0")}.${String(currentMonth + 1).padStart(2, "0")}.${currentYear}`;
      });
    });
  }
}

async function register() {
  const name = document.getElementById("name")?.value || "";
  const email = document.getElementById("email")?.value || "";
  const password = document.getElementById("password")?.value || "";

  const response = await fetch("https://localhost:7156/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password })
  });

  if (response.ok) {
    alert("Registered successfully");
    window.location.href = "login.html";
  } else {
    alert("Error registering");
  }
}

async function login() {
  const email = document.getElementById("login-email")?.value || "";
  const password = document.getElementById("login-password")?.value || "";

  const response = await fetch("https://localhost:7156/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    localStorage.setItem("loggedInEmail", email);
    alert("Login successful");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid login");
  }
}

function saveAppointmentDetails() {
  const reason = document.getElementById("booking-reason")?.value || "General appointment";
  localStorage.setItem("appointmentReason", reason);
  window.location.href = "book-appointment.html";
}

async function bookAppointment() {
  const email = localStorage.getItem("loggedInEmail") || "";
  const date = document.getElementById("selected-date")?.innerText || "";
  const selectedTime = document.querySelector(".slot-time.selected");
  const time = selectedTime ? selectedTime.innerText : "";
  const reason = localStorage.getItem("appointmentReason") || "General appointment";
  const hospital = "Imperial College Healthcare NHS Trust";

  if (!email) {
    alert("No logged in user found");
    return;
  }

  if (!date || !time) {
    alert("Please select a date and time");
    return;
  }

  const response = await fetch("https://localhost:7156/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      date,
      time,
      reason,
      hospital
    })
  });

  if (response.ok) {
    localStorage.setItem("lastAppointmentEmail", email);
    localStorage.setItem("lastAppointmentDate", date);
    localStorage.setItem("lastAppointmentTime", time);
    localStorage.setItem("lastAppointmentReason", reason);
    localStorage.setItem("lastAppointmentHospital", hospital);

    alert("Appointment booked");
    window.location.href = "confirm-appointment.html";
  } else {
    alert("Error booking appointment");
  }
}

function loadConfirmationDetails() {
  document.getElementById("confirm-email").innerText =
    localStorage.getItem("lastAppointmentEmail") || "-";

  document.getElementById("confirm-date").innerText =
    localStorage.getItem("lastAppointmentDate") || "-";

  document.getElementById("confirm-time").innerText =
    localStorage.getItem("lastAppointmentTime") || "-";

  document.getElementById("confirm-reason").innerText =
    localStorage.getItem("lastAppointmentReason") || "-";
}

async function loadAppointments() {
  const email = localStorage.getItem("loggedInEmail") || "";
  const container = document.getElementById("appointments-list");

  if (!email || !container) {
    return;
  }

  const response = await fetch(`https://localhost:7156/api/appointments/user/${encodeURIComponent(email)}`);

  if (!response.ok) {
    container.innerHTML = "<p>Could not load appointments.</p>";
    return;
  }

  const appointments = await response.json();

  if (!appointments || appointments.length === 0) {
    container.innerHTML = "<p>No appointments found.</p>";
    return;
  }

  container.innerHTML = appointments.map(app => `
    <div class="appointment-item" style="margin-bottom: 20px;">
      <div class="detail-label">APPOINTMENT:</div>
      <div class="detail-value">${app.date} — ${app.time}</div>
      <div class="detail-value">Hospital: ${app.hospital || "-"}</div>
      <div class="detail-value" style="margin-bottom: 10px;">Reason: ${app.reason}</div>

      <button type="button" class="btn btn-primary"
        onclick="openChangePage(${app.appointmentID}, '${escapeJs(app.date)}', '${escapeJs(app.time)}', '${escapeJs(app.hospital || "")}')">
        CHANGE
      </button>

      <button type="button" class="btn btn-danger" onclick="cancelAppointment(${app.appointmentID})">
        CANCEL
      </button>
    </div>
  `).join("");
}

function openChangePage(id, date, time, hospital) {
  localStorage.setItem("changeAppointmentId", id);
  localStorage.setItem("changeAppointmentDate", date);
  localStorage.setItem("changeAppointmentTime", time);
  localStorage.setItem("changeAppointmentHospital", hospital);
  window.location.href = "change.html";
}

function loadChangeForm() {
  const savedDate = localStorage.getItem("changeAppointmentDate") || "";
  const savedTime = localStorage.getItem("changeAppointmentTime") || "";
  const savedHospital = localStorage.getItem("changeAppointmentHospital") || "";

  const dateInput = document.getElementById("change-date");
  const timeInput = document.getElementById("change-time");
  const hospitalInput = document.getElementById("change-hospital");

  if (dateInput && savedDate) {
    const parts = savedDate.split(".");
    if (parts.length === 3) {
      dateInput.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  if (timeInput && savedTime) {
    timeInput.value = savedTime;
  }

  if (hospitalInput && savedHospital) {
    hospitalInput.value = savedHospital;
  }
}

async function updateAppointment() {
  const id = localStorage.getItem("changeAppointmentId");
  const dateValue = document.getElementById("change-date")?.value || "";
  const time = document.getElementById("change-time")?.value || "";
  const hospital = document.getElementById("change-hospital")?.value || "";

  if (!id) {
    alert("No appointment selected");
    return;
  }

  if (!dateValue || !time || !hospital) {
    alert("Please fill in all fields");
    return;
  }

  const parts = dateValue.split("-");
  const date = `${parts[2]}.${parts[1]}.${parts[0]}`;

  const response = await fetch(`https://localhost:7156/api/appointments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      date,
      time,
      hospital
    })
  });

  if (response.ok) {
    alert("Appointment updated");
    window.location.href = "manage-appointments.html";
  } else {
    alert("Error updating appointment");
  }
}

async function cancelAppointment(id) {
  const response = await fetch(`https://localhost:7156/api/appointments/${id}`, {
    method: "DELETE"
  });

  if (response.ok) {
    alert("Appointment cancelled");
    loadAppointments();
  } else {
    alert("Error cancelling appointment");
  }
}

function escapeJs(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}
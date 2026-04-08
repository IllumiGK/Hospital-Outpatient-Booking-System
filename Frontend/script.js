document.addEventListener("DOMContentLoaded", () => {
    // Core UI setup
    setupProfileMenu();
    setupCalendar();
    setupTimeSelection();
    setupChatbot();
    autofillPatientDetailsFromServer();

    // Page-specific initialisation
    if (document.getElementById("appointments-list")) {
        loadAppointments();
    }

    if (document.getElementById("confirm-email")) {
        loadConfirmationDetails();
    }

    if (document.getElementById("change-date")) {
        loadChangeForm();
    }

    if (document.getElementById("selected-hospital")) {
        loadSelectedHospitalDetails();
    }

    if (document.getElementById("health-record-name")) {
        loadHealthRecord();
    }
});

// All possible appointment times
const ALL_APPOINTMENT_TIMES = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00"
];

function setupProfileMenu() {
    const profileBtn = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");

    // Toggle profile dropdown
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            profileMenu.style.display =
                profileMenu.style.display === "block" ? "none" : "block";
        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {
            if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.style.display = "none";
            }
        });
    }
}

function setupTimeSelection() {
    const timeList = document.getElementById("time-list");

    // Highlight selected time slot
    if (timeList) {
        timeList.addEventListener("click", (e) => {
            if (!e.target.classList.contains("slot-time")) return;
            if (e.target.disabled) return;

            document.querySelectorAll(".slot-time").forEach((btn) => {
                btn.classList.remove("selected");
            });

            e.target.classList.add("selected");
        });
    }
}

// Get hospital chosen earlier in the flow
function getSelectedHospital() {
    return localStorage.getItem("appointmentHospital") ||
        "Imperial College Healthcare NHS Trust";
}

// Fetch booked times for a specific date + hospital
async function getBookedTimesForDate(date, hospital) {
    try {
        const res = await fetch(
            `http://localhost:5015/api/appointments/times/${encodeURIComponent(date)}?hospital=${encodeURIComponent(hospital)}`
        );

        if (!res.ok) {
            console.error(`Could not fetch booked times for ${date}. Status:`, res.status);
            return [];
        }

        const bookedTimes = await res.json();
        return Array.isArray(bookedTimes) ? bookedTimes : [];
    } catch (err) {
        console.error(`Could not fetch booked times for ${date}`, err);
        return [];
    }
}

// Format date as DD/MM/YYYY
function formatDate(day, month, year) {
    return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
}

// Weekend check
function isWeekend(day, month, year) {
    const jsDay = new Date(year, month, day).getDay();
    return jsDay === 0 || jsDay === 6;
}

// Prevent selecting past dates
function isPastDate(day, month, year) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDate = new Date(year, month, day);
    currentDate.setHours(0, 0, 0, 0);

    return currentDate < today;
}

// Build calendar HTML for a month
function buildMonthTable(month, year, monthName) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `
        <div class="calendar-header">
            <h2 class="section-title">${monthName} ${year}</h2>
        </div>

        <table class="calendar-table" style="margin-bottom: 24px;">
            <thead>
                <tr>
                    <th>SUNDAY</th><th>MONDAY</th><th>TUESDAY</th>
                    <th>WEDNESDAY</th><th>THURSDAY</th>
                    <th>FRIDAY</th><th>SATURDAY</th>
                </tr>
            </thead>
            <tbody>
    `;

    let day = 1;

    for (let row = 0; row < 6; row++) {
        html += "<tr>";

        for (let col = 0; col < 7; col++) {
            if ((row === 0 && col < firstDay) || day > daysInMonth) {
                html += "<td></td>";
            } else {
                html += `<td class="calendar-day" data-day="${day}" data-month="${month}" data-year="${year}">${day}</td>`;
                day++;
            }
        }

        html += "</tr>";

        if (day > daysInMonth) break;
    }

    html += `
            </tbody>
        </table>
    `;

    return html;
}

async function setupCalendar() {
    const calendarContainer = document.getElementById("calendar-container");
    const dateOutput = document.getElementById("selected-date");

    // Only run on pages with a calendar
    if (!calendarContainer || !dateOutput) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const hospital = getSelectedHospital();

    // Build current + next month
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    const nextMonth = nextMonthDate.getMonth();
    const nextMonthYear = nextMonthDate.getFullYear();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    calendarContainer.innerHTML =
        buildMonthTable(currentMonth, currentYear, monthNames[currentMonth]) +
        buildMonthTable(nextMonth, nextMonthYear, monthNames[nextMonth]);

    const days = document.querySelectorAll(".calendar-day");

    let defaultDate = "";

    // Assign availability + click handlers
    for (const dayCell of days) {
        const day = Number(dayCell.dataset.day);
        const month = Number(dayCell.dataset.month);
        const year = Number(dayCell.dataset.year);

        const formatted = formatDate(day, month, year);

        // Reset classes
        dayCell.classList.remove(
            "slot-none", "slot-limited", "slot-available",
            "selected", "weekend-day", "past-day"
        );

        // Disable weekends
        if (isWeekend(day, month, year)) {
            dayCell.classList.add("weekend-day");
            dayCell.onclick = null;
            continue;
        }

        // Disable past dates
        if (isPastDate(day, month, year)) {
            dayCell.classList.add("past-day");
            dayCell.onclick = null;
            continue;
        }

        // Fetch availability
        const bookedTimes = await getBookedTimesForDate(formatted, hospital);
        const bookedCount = bookedTimes.length;
        const availableCount = ALL_APPOINTMENT_TIMES.length - bookedCount;

        // Colour-code availability
        if (availableCount === 0) {
            dayCell.classList.add("slot-none");
        } else if (availableCount <= 5) {
            dayCell.classList.add("slot-limited");
        } else {
            dayCell.classList.add("slot-available");
        }

        // Select date
        dayCell.onclick = async () => {
            if (
                dayCell.classList.contains("slot-none") ||
                dayCell.classList.contains("weekend-day") ||
                dayCell.classList.contains("past-day")
            ) return;

            document.querySelectorAll(".calendar-day").forEach(d => d.classList.remove("selected"));
            dayCell.classList.add("selected");

            dateOutput.textContent = formatted;
            await updateAvailableTimes(formatted);
        };
    }

    // Auto-select today or first available date
    const todayCell = Array.from(days).find(cell =>
        Number(cell.dataset.day) === currentDay &&
        Number(cell.dataset.month) === currentMonth &&
        Number(cell.dataset.year) === currentYear &&
        !cell.classList.contains("weekend-day") &&
        !cell.classList.contains("past-day") &&
        !cell.classList.contains("slot-none")
    );

    if (todayCell) {
        todayCell.classList.add("selected");
        defaultDate = formatDate(currentDay, currentMonth, currentYear);
    } else {
        const firstAvailableCell = Array.from(days).find(cell =>
            !cell.classList.contains("weekend-day") &&
            !cell.classList.contains("past-day") &&
            !cell.classList.contains("slot-none")
        );

        if (firstAvailableCell) {
            firstAvailableCell.classList.add("selected");
            defaultDate = formatDate(
                Number(firstAvailableCell.dataset.day),
                Number(firstAvailableCell.dataset.month),
                Number(firstAvailableCell.dataset.year)
            );
        }
    }

    // Load times for default date
    if (defaultDate) {
        dateOutput.textContent = defaultDate;
        await updateAvailableTimes(defaultDate);
    } else {
        dateOutput.textContent = "No available date";
    }
}

async function updateAvailableTimes(date) {
    const timeButtons = document.querySelectorAll(".slot-time");
    const hospital = getSelectedHospital();

    // Reset all times
    timeButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove("slot-none", "selected");
    });

    try {
        const res = await fetch(
            `http://localhost:5015/api/appointments/times/${encodeURIComponent(date)}?hospital=${encodeURIComponent(hospital)}`
        );

        if (!res.ok) return;

        const bookedTimes = await res.json();

        // Disable booked times
        timeButtons.forEach(btn => {
            if (bookedTimes.includes(btn.innerText)) {
                btn.disabled = true;
                btn.classList.add("slot-none");
            }
        });
    } catch (err) {
        console.error("Could not fetch booked times", err);
    }
}

// LocalStorage helpers
function getRegisteredUser() {
    return JSON.parse(localStorage.getItem("registeredUser") || "null");
}

function getAppointments() {
    return JSON.parse(localStorage.getItem("appointments") || "[]");
}

function saveAppointments(appointments) {
    localStorage.setItem("appointments", JSON.stringify(appointments));
}

// Simple ID generator
function generateAppointmentId() {
    return Date.now();
}

// Create or reuse message box
function getOrCreateMessageBox() {
    let msgBox = document.getElementById("form-message");

    if (msgBox) return msgBox;

    msgBox = document.getElementById("page-message");
    if (msgBox) return msgBox;

    // Create fallback message box
    msgBox = document.createElement("div");
    msgBox.id = "page-message";
    msgBox.style.display = "none";
    msgBox.style.marginBottom = "16px";
    msgBox.style.padding = "12px 16px";
    msgBox.style.borderRadius = "8px";
    msgBox.style.fontWeight = "600";
    msgBox.style.textAlign = "center";

    const target =
        document.querySelector(".card") ||
        document.querySelector(".slot-details-card") ||
        document.querySelector(".calendar-wrapper") ||
        document.querySelector(".app-main");

    if (target) {
        target.insertBefore(msgBox, target.firstChild);
    } else {
        document.body.prepend(msgBox);
    }

    return msgBox;
}

// Display success/error/info messages
function showMessage(message, type = "error") {
    const msgBox = getOrCreateMessageBox();

    msgBox.textContent = message;
    msgBox.className = type;
    msgBox.style.display = "block";

    if (type === "success") {
        msgBox.style.backgroundColor = "#e6ffed";
        msgBox.style.color = "#1f7a3d";
        msgBox.style.border = "1px solid #b7ebc6";
    } else if (type === "info") {
        msgBox.style.backgroundColor = "#eaf4ff";
        msgBox.style.color = "#0b5cab";
        msgBox.style.border = "1px solid #b9d8ff";
    } else {
        msgBox.style.backgroundColor = "#fff1f0";
        msgBox.style.color = "#c53030";
        msgBox.style.border = "1px solid #f5c2c0";
    }
}

// ===============================
// USER REGISTRATION
// ===============================
async function register() {
    const name = document.getElementById("name")?.value.trim() || "";
    const dob = document.getElementById("dob")?.value || "";
    const gender = document.getElementById("gender")?.value || "";
    const address = document.getElementById("address")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";

    if (!name || !dob || !gender || !address || !email || !password) {
        showMessage("Please fill in all fields.");
        return;
    }

    if (!email.includes("@") || !email.includes(".")) {
        showMessage("Please enter a valid email address.");
        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters long.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5015/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, dob, gender, address })
        });

        const result = await response.text();

        if (response.ok) {
            showMessage("Registration successful. Redirecting...", "success");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            showMessage(result || "Registration failed.");
        }
    } catch (error) {
        console.error("Register error:", error);
        showMessage("Could not connect to the server.");
    }
}

// ===============================
// USER LOGIN
// ===============================
async function login() {
    const email = document.getElementById("login-email")?.value.trim() || "";
    const password = document.getElementById("login-password")?.value || "";

    if (!email || !password) {
        showMessage("Please enter email and password.");
        return;
    }

    if (!email.includes("@") || !email.includes(".")) {
        showMessage("Please enter a valid email address.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5015/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const result = await response.json();

            localStorage.setItem("loggedInEmail", result.email || email);
            localStorage.setItem("loggedInName", result.name || "");

            showMessage(result.message || "Login successful. Redirecting...", "success");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);
        } else {
            const errorText = await response.text();
            showMessage(errorText || "Invalid email or password.");
        }
    } catch (err) {
        console.error(err);
        showMessage("Could not connect to server.");
    }
}

// ===============================
// AUTO-FILL PATIENT DETAILS
// ===============================
async function autofillPatientDetailsFromServer() {
    const email = localStorage.getItem("loggedInEmail") || "";
    if (!email) return;

    try {
        const response = await fetch(`http://localhost:5015/api/auth/user/${encodeURIComponent(email)}`);

        if (!response.ok) {
            console.error("Could not load user details from server.");
            return;
        }

        const user = await response.json();

        const nameInput = document.getElementById("patient-name");
        const dobInput = document.getElementById("patient-dob");

        if (nameInput) nameInput.value = user.name || "";

        if (dobInput && user.dob) {
            if (user.dob.includes("/")) {
                const parts = user.dob.split("/");
                if (parts.length === 3) {
                    dobInput.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            } else {
                dobInput.value = user.dob;
            }
        }
    } catch (error) {
        console.error("Autofill error:", error);
    }
}

// ===============================
// LOGOUT
// ===============================
function logout() {
    localStorage.removeItem("loggedInEmail");
    localStorage.removeItem("loggedInName");
    window.location.href = "index.html";
}

// ===============================
// SAVE APPOINTMENT DETAILS (STEP 1)
// ===============================
function saveAppointmentDetails() {
    const fullName = document.getElementById("patient-name")?.value.trim() || "";
    const dob = document.getElementById("patient-dob")?.value || "";
    const nhukNumber = document.getElementById("patient-nhuk")?.value.trim() || "";
    const reason = document.getElementById("booking-reason")?.value.trim() || "";
    const hospital =
        document.getElementById("hospital")?.value ||
        "Imperial College Healthcare NHS Trust";

    if (!fullName || !dob || !reason || !hospital) {
        showMessage("Please fill in all required details before continuing.");
        return;
    }

    localStorage.setItem("appointmentPatientName", fullName);
    localStorage.setItem("appointmentPatientDob", dob);
    localStorage.setItem("appointmentPatientNhuk", nhukNumber);
    localStorage.setItem("appointmentReason", reason);
    localStorage.setItem("appointmentHospital", hospital);

    window.location.href = "book-appointment.html";
}

// ===============================
// BOOK APPOINTMENT (FINAL STEP)
// ===============================
async function bookAppointment() {
    const email = localStorage.getItem("loggedInEmail") || "";
    const date = document.getElementById("selected-date")?.innerText || "";
    const selectedTime = document.querySelector(".slot-time.selected");
    const time = selectedTime ? selectedTime.innerText : "";

    const reason = localStorage.getItem("appointmentReason") || "General appointment";
    const hospital = localStorage.getItem("appointmentHospital") || "Imperial College Healthcare NHS Trust";
    const fullName = localStorage.getItem("appointmentPatientName") || "";
    const dob = localStorage.getItem("appointmentPatientDob") || "";
    const nhukNumber = localStorage.getItem("appointmentPatientNhuk") || "";

    if (!email) {
        showMessage("No logged in user found");
        return;
    }

    if (!date || !time) {
        showMessage("Please select a date and time");
        return;
    }

    try {
        const response = await fetch("http://localhost:5015/api/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                date,
                time,
                reason,
                hospital,
                fullName,
                dob,
                nhukNumber
            })
        });

        const result = await response.text();

        if (response.ok) {
            localStorage.setItem("lastAppointmentEmail", email);
            localStorage.setItem("lastAppointmentDate", date);
            localStorage.setItem("lastAppointmentTime", time);
            localStorage.setItem("lastAppointmentReason", reason);
            localStorage.setItem("lastAppointmentHospital", hospital);

            showMessage(result || "Appointment booked", "success");

            await updateAvailableTimes(date);
            await setupCalendar();

            setTimeout(() => {
                window.location.href = "confirm-appointment.html";
            }, 1200);
        } else {
            showMessage(result || "Error booking appointment");
            await updateAvailableTimes(date);
            await setupCalendar();
        }
    } catch (error) {
        console.error("Book appointment error:", error);
        showMessage("Could not connect to server.");
    }
}

// ===============================
// LOAD CONFIRMATION PAGE DETAILS
// ===============================
function loadConfirmationDetails() {
    const confirmEmail = document.getElementById("confirm-email");
    const confirmDate = document.getElementById("confirm-date");
    const confirmTime = document.getElementById("confirm-time");
    const confirmReason = document.getElementById("confirm-reason");
    const confirmHospital = document.getElementById("confirm-hospital");
    const confirmName = document.getElementById("confirm-name");

    if (confirmEmail) confirmEmail.innerText = localStorage.getItem("lastAppointmentEmail") || "-";
    if (confirmDate) confirmDate.innerText = localStorage.getItem("lastAppointmentDate") || "-";
    if (confirmTime) confirmTime.innerText = localStorage.getItem("lastAppointmentTime") || "-";
    if (confirmReason) confirmReason.innerText = localStorage.getItem("lastAppointmentReason") || "-";
    if (confirmHospital) confirmHospital.innerText = localStorage.getItem("lastAppointmentHospital") || "-";

    if (confirmName) {
        confirmName.innerText =
            localStorage.getItem("appointmentPatientName") ||
            localStorage.getItem("loggedInName") ||
            "-";
    }
}

// ===============================
// LOAD SELECTED HOSPITAL DETAILS
// ===============================
function loadSelectedHospitalDetails() {
    const hospital =
        localStorage.getItem("appointmentHospital") ||
        "Imperial College Healthcare NHS Trust";

    const hospitalElement = document.getElementById("selected-hospital");
    const addressElement = document.getElementById("hospital-address");
    const phoneElement = document.getElementById("hospital-phone");

    if (hospitalElement) {
        hospitalElement.innerText = hospital;
    }

    const hospitalDetails = {
        "Imperial College Healthcare NHS Trust": {
            address: "The Bays, S Wharf Rd, London W2 1NY",
            phone: "020 3311 3311"
        },
        "St Mary's Hospital": {
            address: "Praed St, London W2 1NY",
            phone: "020 3312 6666"
        },
        "Chelsea and Westminster Hospital": {
            address: "369 Fulham Rd, London SW10 9NH",
            phone: "020 3315 8000"
        },
        "Royal London Hospital": {
            address: "Whitechapel Rd, London E1 1FR",
            phone: "020 7377 7000"
        },
        "Guy's and St Thomas' Hospital": {
            address: "Great Maze Pond, London SE1 9RT",
            phone: "020 7188 7188"
        }
    };

    const selectedDetails =
        hospitalDetails[hospital] ||
        hospitalDetails["Imperial College Healthcare NHS Trust"];

    if (addressElement) {
        addressElement.innerText = selectedDetails.address;
    }

    if (phoneElement) {
        phoneElement.innerText = selectedDetails.phone;
    }
}

// ===============================
// GENERATE CONSISTENT RANDOM HEALTH DATA
// ===============================
function createSeedFromText(text) {
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
        seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
    }
    return seed;
}

function seededPick(items, seed, offset = 0) {
    if (!items.length) return "";
    const index = (seed + offset) % items.length;
    return items[index];
}

function generateUserHealthProfile(userKey) {
    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const allergyOptions = [
        "No known allergies",
        "Penicillin",
        "Dust",
        "Pollen",
        "Peanuts",
        "Seafood",
        "Latex",
        "Ibuprofen"
    ];

    const seed = createSeedFromText(userKey || "default-user");

    return {
        bloodGroup: seededPick(bloodGroups, seed, 3),
        allergies: seededPick(allergyOptions, seed, 7)
    };
}

// ===============================
// LOAD HEALTH RECORD
// ===============================
async function loadHealthRecord() {
    const email = localStorage.getItem("loggedInEmail") || "";
    const loggedInName = localStorage.getItem("loggedInName") || "";

    const nameElement = document.getElementById("health-record-name");
    const dobElement = document.getElementById("health-record-dob");
    const bloodGroupElement = document.getElementById("health-record-blood-group");
    const allergiesElement = document.getElementById("health-record-allergies");

    if (!nameElement || !dobElement || !bloodGroupElement || !allergiesElement) return;

    const generatedHealth = generateUserHealthProfile(email || loggedInName);

    nameElement.innerText = loggedInName || "-";
    dobElement.innerText = localStorage.getItem("appointmentPatientDob") || "-";
    bloodGroupElement.innerText = generatedHealth.bloodGroup;
    allergiesElement.innerText = generatedHealth.allergies;

    if (!email) return;

    try {
        const response = await fetch(`http://localhost:5015/api/auth/user/${encodeURIComponent(email)}`);

        if (!response.ok) {
            console.error("Could not load health record details from server.");
            return;
        }

        const user = await response.json();

        nameElement.innerText = user.name || loggedInName || "-";
        dobElement.innerText = user.dob || localStorage.getItem("appointmentPatientDob") || "-";

        if (user.bloodGroup) {
            bloodGroupElement.innerText = user.bloodGroup;
        }

        if (user.allergies) {
            allergiesElement.innerText = user.allergies;
        }
    } catch (error) {
        console.error("Health record load error:", error);
    }
}

// ===============================
// LOAD USER'S APPOINTMENTS
// ===============================
async function loadAppointments() {
    const email = localStorage.getItem("loggedInEmail") || "";
    const container = document.getElementById("appointments-list");

    if (!email || !container) return;

    try {
        const response = await fetch(`http://localhost:5015/api/appointments/user/${encodeURIComponent(email)}`);

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

              <button type="button" class="btn btn-danger" onclick="openConfirmModal(${app.appointmentID})">
                CANCEL
              </button>
            </div>
        `).join("");
    } catch (error) {
        console.error("Load appointments error:", error);
        container.innerHTML = "<p>Could not load appointments.</p>";
    }
}

// Track which appointment is being cancelled
let pendingCancelAppointmentId = null;

// ===============================
// OPEN CANCEL CONFIRMATION MODAL
// ===============================
function openConfirmModal(id) {
    console.log("Cancel clicked for appointment:", id);

    pendingCancelAppointmentId = id;

    const modal = document.getElementById("confirmModal");
    const confirmBtn = document.getElementById("confirmYesBtn");

    if (!modal || !confirmBtn) {
        console.log("Modal elements not found");
        return;
    }

    confirmBtn.onclick = async () => {
        await performCancelAppointment();
    };

    modal.classList.add("open");
}

// Close modal + reset state
function closeConfirmModal() {
    const modal = document.getElementById("confirmModal");
    if (modal) modal.classList.remove("open");
    pendingCancelAppointmentId = null;
}

// ===============================
// CANCEL APPOINTMENT
// ===============================
async function performCancelAppointment() {
    if (!pendingCancelAppointmentId) return;

    try {
        const response = await fetch(`http://localhost:5015/api/appointments/${pendingCancelAppointmentId}`, {
            method: "DELETE"
        });

        const result = await response.text();

        if (response.ok) {
            showMessage(result || "Appointment cancelled", "success");
            closeConfirmModal();
            loadAppointments();
        } else {
            showMessage(result || "Error cancelling appointment");
            closeConfirmModal();
        }
    } catch (error) {
        console.error("Cancel appointment error:", error);
        showMessage("Could not connect to server.");
        closeConfirmModal();
    }
}

// ===============================
// OPEN CHANGE APPOINTMENT PAGE
// ===============================
function openChangePage(id, date, time, hospital) {
    localStorage.setItem("changeAppointmentId", String(id));
    localStorage.setItem("changeAppointmentDate", date);
    localStorage.setItem("changeAppointmentTime", time);
    localStorage.setItem("changeAppointmentHospital", hospital);

    window.location.href = "change-appointment.html";
}

// ===============================
// LOAD CHANGE FORM WITH SAVED DATA
// ===============================
function loadChangeForm() {
    const savedDate = localStorage.getItem("changeAppointmentDate") || "";
    const savedTime = localStorage.getItem("changeAppointmentTime") || "";
    const savedHospital = localStorage.getItem("changeAppointmentHospital") || "";

    const dateInput = document.getElementById("change-date");
    const timeInput = document.getElementById("change-time");
    const hospitalInput = document.getElementById("change-hospital");

    if (dateInput && savedDate) {
        const parts = savedDate.split("/");
        if (parts.length === 3) {
            dateInput.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }

    if (timeInput && savedTime) timeInput.value = savedTime;
    if (hospitalInput && savedHospital) hospitalInput.value = savedHospital;
}

// ===============================
// UPDATE APPOINTMENT
// ===============================
async function updateAppointment() {
    const id = localStorage.getItem("changeAppointmentId");
    const dateValue = document.getElementById("change-date")?.value || "";
    const time = document.getElementById("change-time")?.value || "";
    const hospital = document.getElementById("change-hospital")?.value || "";

    if (!id) {
        showMessage("No appointment selected");
        return;
    }

    if (!dateValue || !time || !hospital) {
        showMessage("Please fill in all fields");
        return;
    }

    const parts = dateValue.split("-");
    const date = `${parts[2]}/${parts[1]}/${parts[0]}`;

    try {
        const response = await fetch(`http://localhost:5015/api/appointments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, time, hospital })
        });

        const result = await response.text();

        if (response.ok) {
            showMessage(result || "Appointment updated", "success");

            setTimeout(() => {
                window.location.href = "manage-appointments.html";
            }, 1200);
        } else {
            showMessage(result || "Error updating appointment");
        }
    } catch (error) {
        console.error("Update appointment error:", error);
        showMessage("Could not connect to server.");
    }
}

// ===============================
// REPEAT PRESCRIPTION REQUEST
// ===============================
function requestRepeatPrescription() {
    showMessage("Prescription request submitted successfully.", "success");
}

// ===============================
// ESCAPE STRINGS FOR INLINE JS
// ===============================
function escapeJs(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

// ===============================
// CHATBOT SETUP + MESSAGE HANDLING
// ===============================
function setupChatbot() {
    const chatbotToggle = document.getElementById("chatbotToggle");
    const chatbotWindow = document.getElementById("chatbotWindow");
    const chatbotClose = document.getElementById("chatbotClose");
    const chatbotSend = document.getElementById("chatbotSend");
    const chatbotInput = document.getElementById("chatbotInput");
    const chatbotMessages = document.getElementById("chatbotMessages");

    if (!chatbotToggle || !chatbotWindow || !chatbotClose || !chatbotSend || !chatbotInput || !chatbotMessages) {
        return;
    }

    const loggedInName = localStorage.getItem("loggedInName") || "there";
    let chatbotWelcomed = false;

    chatbotToggle.addEventListener("click", () => {
        chatbotWindow.classList.toggle("open");

        if (chatbotWindow.classList.contains("open") && !chatbotWelcomed) {
            chatbotWelcomed = true;

            chatbotMessages.innerHTML = "";

            setTimeout(() => {
                addMessage(getWelcomeMessage(loggedInName), "bot");
                addQuickReplies();
            }, 250);
        }
    });

    chatbotClose.addEventListener("click", () => {
        chatbotWindow.classList.remove("open");
    });

    chatbotSend.addEventListener("click", sendChatMessage);

    chatbotInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendChatMessage();
        }
    });

    function sendChatMessage(prefilledMessage = "") {
        const message = prefilledMessage || chatbotInput.value.trim();
        if (!message) return;

        addMessage(message, "user");
        chatbotInput.value = "";
        removeQuickReplies();
        showTyping();

        setTimeout(() => {
            removeTyping();
            addMessage(getBotReply(message), "bot");
            addQuickReplies();
        }, 700);
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `chatbot-message ${sender}`;
        messageDiv.textContent = text;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function showTyping() {
        removeTyping();

        const typingDiv = document.createElement("div");
        typingDiv.className = "chatbot-message bot chatbot-typing";
        typingDiv.id = "chatbotTyping";
        typingDiv.textContent = "Typing...";
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function removeTyping() {
        const existingTyping = document.getElementById("chatbotTyping");
        if (existingTyping) {
            existingTyping.remove();
        }
    }

    function removeQuickReplies() {
        const existingReplies = document.getElementById("chatbotQuickReplies");
        if (existingReplies) {
            existingReplies.remove();
        }
    }

    function addQuickReplies() {
        removeQuickReplies();

        const repliesWrapper = document.createElement("div");
        repliesWrapper.className = "chatbot-quick-replies";
        repliesWrapper.id = "chatbotQuickReplies";

        const replies = getQuickReplies();

        replies.forEach(replyText => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chatbot-quick-reply";
            button.textContent = replyText;
            button.addEventListener("click", () => {
                sendChatMessage(replyText);
            });
            repliesWrapper.appendChild(button);
        });

        chatbotMessages.appendChild(repliesWrapper);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function getQuickReplies() {
        if (document.getElementById("user-name")) {
            return [
                "Book appointment",
                "Health record",
                "Prescription",
                "Manage appointments"
            ];
        }

        if (document.getElementById("patient-name")) {
            return [
                "What should I fill in?",
                "Hospital help",
                "Booking reason"
            ];
        }

        if (document.getElementById("selected-date")) {
            return [
                "Selected hospital",
                "Choose time",
                "How to confirm?"
            ];
        }

        if (document.getElementById("appointments-list")) {
            return [
                "Change appointment",
                "Cancel appointment",
                "Back to dashboard"
            ];
        }

        if (document.getElementById("health-record-name")) {
            return [
                "Explain blood group",
                "Explain allergies",
                "Back to dashboard"
            ];
        }

        return [
            "Book appointment",
            "Log in help",
            "Register help"
        ];
    }

    function getWelcomeMessage(name) {
        if (document.getElementById("user-name")) {
            return `👋 Hi ${name}! Welcome back. What would you like to do today?`;
        }

        if (document.getElementById("patient-name")) {
            return `👋 Hi ${name}! I can help you complete your appointment details.`;
        }

        if (document.getElementById("selected-date")) {
            const hospital = localStorage.getItem("appointmentHospital") || "your selected hospital";
            return `👋 Hi ${name}! Please choose a date and time for ${hospital}.`;
        }

        if (document.getElementById("appointments-list")) {
            return `👋 Hello ${name}! You can review, change, or cancel your appointments here.`;
        }

        if (document.getElementById("health-record-name")) {
            return `👋 Hello ${name}! Here is your health record summary.`;
        }

        if (document.getElementById("confirm-email")) {
            return `👋 Great news ${name}! Your appointment details are ready to review.`;
        }

        return `👋 Hello ${name}! I’m your healthcare assistant. How can I help you today?`;
    }

    function getBotReply(message) {
        const lower = message.toLowerCase();
        const selectedHospital = localStorage.getItem("appointmentHospital") || "your selected hospital";
        const selectedDate = document.getElementById("selected-date")?.innerText || "";
        const selectedTime = document.querySelector(".slot-time.selected")?.innerText || "";

        if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
            return "👋 Hello! How can I help you today?";
        }

        if (lower.includes("register")) {
            return "To register, go to the Register page, fill in your personal details, and click Register.";
        }

        if (lower.includes("login") || lower.includes("log in")) {
            return "To log in, enter your email and password on the Login page, then click Log In.";
        }

        if (lower.includes("book")) {
            return `To book an appointment, first complete your details, then choose a date and time for ${selectedHospital}.`;
        }

        if (lower.includes("hospital")) {
            return `Your selected hospital is currently ${selectedHospital}.`;
        }

        if (lower.includes("date") || lower.includes("time")) {
            if (selectedDate && selectedTime) {
                return `You currently selected ${selectedDate} at ${selectedTime}.`;
            }

            if (selectedDate) {
                return `You selected ${selectedDate}. Please choose a time as well.`;
            }

            return "Please select a date first, then choose an available time slot.";
        }

        if (lower.includes("how to confirm") || lower.includes("confirm")) {
            return "After selecting a date and time, click the Confirm button to finish your booking.";
        }

        if (lower.includes("what should i fill in")) {
            return "Please fill in your full name, date of birth, reason for booking, and hospital before continuing.";
        }

        if (lower.includes("booking reason")) {
            return "Your booking reason can be something like check up, consultation, follow-up, pain, or prescription review.";
        }

        if (lower.includes("manage appointments")) {
            return "Open Manage Appointments to review, change, or cancel your existing bookings.";
        }

        if (lower.includes("change appointment")) {
            return "To change an appointment, open Manage Appointments and click Change next to the appointment.";
        }

        if (lower.includes("cancel appointment") || lower.includes("cancel")) {
            return "To cancel an appointment, open Manage Appointments and click Cancel next to the appointment.";
        }

        if (lower.includes("prescription")) {
            return "You can open the Prescription page from the dashboard to view prescription details or request a repeat prescription.";
        }

        if (lower.includes("health record")) {
            return "You can open the Health Record page from the dashboard to view your saved health details.";
        }

        if (lower.includes("explain blood group")) {
            return "Your blood group is part of your health record and can be important for treatment and emergencies.";
        }

        if (lower.includes("explain allergies")) {
            return "Your allergy information helps avoid medicines or substances that may cause a reaction.";
        }

        if (lower.includes("back to dashboard")) {
            return "You can return to the dashboard using the Back to Home button.";
        }

        if (lower.includes("thank")) {
            return "You’re welcome. I’m here whenever you need help.";
        }

        return "I can help with booking appointments, choosing dates and times, checking your hospital, managing appointments, prescriptions, and health records.";
    }
}
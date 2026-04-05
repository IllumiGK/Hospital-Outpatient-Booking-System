document.addEventListener("DOMContentLoaded", () => {
    setupProfileMenu();
    setupCalendar();
    setupTimeSelection();
    setupChatbot();

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

const ALL_APPOINTMENT_TIMES = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"
];

function setupProfileMenu() {
    const profileBtn = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
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
            if (e.target.disabled) return;

            document.querySelectorAll(".slot-time").forEach((btn) => {
                btn.classList.remove("selected");
            });

            e.target.classList.add("selected");
        });
    }
}

function getSelectedHospital() {
    return localStorage.getItem("appointmentHospital") || "Imperial College Healthcare NHS Trust";
}

async function getBookedTimesForDate(date, hospital) {
    try {
        const res = await fetch(
            `https://localhost:5015/api/appointments/times/${encodeURIComponent(date)}?hospital=${encodeURIComponent(hospital)}`
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

function formatDate(day, month, year) {
    return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
}

function isWeekend(day, month, year) {
    const jsDay = new Date(year, month, day).getDay();
    return jsDay === 0 || jsDay === 6;
}

function isPastDate(day, month, year) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDate = new Date(year, month, day);
    currentDate.setHours(0, 0, 0, 0);

    return currentDate < today;
}

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
                    <th>SUNDAY</th>
                    <th>MONDAY</th>
                    <th>TUESDAY</th>
                    <th>WEDNESDAY</th>
                    <th>THURSDAY</th>
                    <th>FRIDAY</th>
                    <th>SATURDAY</th>
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

        if (day > daysInMonth) {
            break;
        }
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

    if (!calendarContainer || !dateOutput) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const hospital = getSelectedHospital();

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

    for (const dayCell of days) {
        const day = Number(dayCell.dataset.day);
        const month = Number(dayCell.dataset.month);
        const year = Number(dayCell.dataset.year);

        const formatted = formatDate(day, month, year);

        dayCell.classList.remove(
            "slot-none",
            "slot-limited",
            "slot-available",
            "selected",
            "weekend-day",
            "past-day"
        );

        if (isWeekend(day, month, year)) {
            dayCell.classList.add("weekend-day");
            dayCell.onclick = null;
            continue;
        }

        if (isPastDate(day, month, year)) {
            dayCell.classList.add("past-day");
            dayCell.onclick = null;
            continue;
        }

        const bookedTimes = await getBookedTimesForDate(formatted, hospital);
        const bookedCount = bookedTimes.length;
        const availableCount = ALL_APPOINTMENT_TIMES.length - bookedCount;

        if (availableCount === 0) {
            dayCell.classList.add("slot-none");
        } else if (availableCount <= 5) {
            dayCell.classList.add("slot-limited");
        } else {
            dayCell.classList.add("slot-available");
        }

        dayCell.onclick = async () => {
            if (
                dayCell.classList.contains("slot-none") ||
                dayCell.classList.contains("weekend-day") ||
                dayCell.classList.contains("past-day")
            ) {
                return;
            }

            document.querySelectorAll(".calendar-day").forEach(d => d.classList.remove("selected"));
            dayCell.classList.add("selected");

            dateOutput.textContent = formatted;
            await updateAvailableTimes(formatted);
        };
    }

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

    timeButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove("slot-none", "selected");
    });

    try {
        const res = await fetch(
            `https://localhost:5015/api/appointments/times/${encodeURIComponent(date)}?hospital=${encodeURIComponent(hospital)}`
        );

        if (!res.ok) return;

        const bookedTimes = await res.json();

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

function getRegisteredUser() {
    return JSON.parse(localStorage.getItem("registeredUser") || "null");
}

function getAppointments() {
    return JSON.parse(localStorage.getItem("appointments") || "[]");
}

function saveAppointments(appointments) {
    localStorage.setItem("appointments", JSON.stringify(appointments));
}

function generateAppointmentId() {
    return Date.now();
}

function getOrCreateMessageBox() {
    let msgBox = document.getElementById("form-message");

    if (msgBox) return msgBox;

    msgBox = document.getElementById("page-message");
    if (msgBox) return msgBox;

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
        const response = await fetch("https://localhost:5015/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const result = await response.text();

        if (response.ok) {
            localStorage.setItem("registeredEmail", email);

            const user = { name, dob, gender, address, email, password };
            localStorage.setItem("registeredUser", JSON.stringify(user));

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
        const response = await fetch("https://localhost:5015/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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

function logout() {
    localStorage.removeItem("loggedInEmail");
    localStorage.removeItem("loggedInName");
    window.location.href = "index.html";
}

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
        const response = await fetch("https://localhost:5015/api/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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

function loadConfirmationDetails() {
    const confirmEmail = document.getElementById("confirm-email");
    const confirmDate = document.getElementById("confirm-date");
    const confirmTime = document.getElementById("confirm-time");
    const confirmReason = document.getElementById("confirm-reason");
    const confirmHospital = document.getElementById("confirm-hospital");
    const confirmName = document.getElementById("confirm-name");

    if (confirmEmail) {
        confirmEmail.innerText = localStorage.getItem("lastAppointmentEmail") || "-";
    }

    if (confirmDate) {
        confirmDate.innerText = localStorage.getItem("lastAppointmentDate") || "-";
    }

    if (confirmTime) {
        confirmTime.innerText = localStorage.getItem("lastAppointmentTime") || "-";
    }

    if (confirmReason) {
        confirmReason.innerText = localStorage.getItem("lastAppointmentReason") || "-";
    }

    if (confirmHospital) {
        confirmHospital.innerText = localStorage.getItem("lastAppointmentHospital") || "-";
    }

    if (confirmName) {
        confirmName.innerText =
            localStorage.getItem("appointmentPatientName") ||
            localStorage.getItem("loggedInName") ||
            "-";
    }
}

async function loadAppointments() {
    const email = localStorage.getItem("loggedInEmail") || "";
    const container = document.getElementById("appointments-list");

    if (!email || !container) {
        return;
    }

    try {
        const response = await fetch(`https://localhost:5015/api/appointments/user/${encodeURIComponent(email)}`);

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
    } catch (error) {
        console.error("Load appointments error:", error);
        container.innerHTML = "<p>Could not load appointments.</p>";
    }
}

function openChangePage(id, date, time, hospital) {
    localStorage.setItem("changeAppointmentId", String(id));
    localStorage.setItem("changeAppointmentDate", date);
    localStorage.setItem("changeAppointmentTime", time);
    localStorage.setItem("changeAppointmentHospital", hospital);
    window.location.href = "change-appointment.html";
}

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
        const response = await fetch(`https://localhost:5015/api/appointments/${id}`, {
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

async function cancelAppointment(id) {
    try {
        const response = await fetch(`https://localhost:5015/api/appointments/${id}`, {
            method: "DELETE"
        });

        const result = await response.text();

        if (response.ok) {
            showMessage(result || "Appointment cancelled", "success");
            loadAppointments();
        } else {
            showMessage(result || "Error cancelling appointment");
        }
    } catch (error) {
        console.error("Cancel appointment error:", error);
        showMessage("Could not connect to server.");
    }
}

function requestRepeatPrescription() {
    showMessage("Prescription request submitted successfully.", "success");
}

function escapeJs(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

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

    chatbotToggle.addEventListener("click", () => {
        chatbotWindow.classList.toggle("open");
    });

    chatbotClose.addEventListener("click", () => {
        chatbotWindow.classList.remove("open");
    });

    chatbotSend.addEventListener("click", sendChatMessage);

    chatbotInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            sendChatMessage();
        }
    });

    function sendChatMessage() {
        const message = chatbotInput.value.trim();
        if (!message) return;

        addMessage(message, "user");
        chatbotInput.value = "";

        const reply = getBotReply(message);
        setTimeout(() => {
            addMessage(reply, "bot");
        }, 500);
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `chatbot-message ${sender}`;
        messageDiv.textContent = text;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function getBotReply(message) {
        const lower = message.toLowerCase();

        if (lower.includes("register")) {
            return "To register, go to the Register page, fill in your details, then click Register.";
        }

        if (lower.includes("login") || lower.includes("log in")) {
            return "To log in, enter your email and password on the Login page, then click Log In.";
        }

        if (lower.includes("book")) {
            return "To book an appointment, first enter your details, then choose a date and time on the booking page.";
        }

        if (lower.includes("change")) {
            return "To change an appointment, go to Manage Appointments and select the Change option.";
        }

        if (lower.includes("cancel")) {
            return "To cancel an appointment, go to Manage Appointments and select the Cancel option.";
        }

        if (lower.includes("prescription")) {
            return "You can use the Prescription section from the dashboard to view prescription-related information.";
        }

        if (lower.includes("health record")) {
            return "You can open the Health Record section from the dashboard to view your health details.";
        }

        return "I can help with registration, login, booking appointments, changing appointments, cancelling appointments, prescriptions, and health records.";
    }
}
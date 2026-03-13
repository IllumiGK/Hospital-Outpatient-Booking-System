document.addEventListener("DOMContentLoaded", () => {

  /* -----------------------------------------
     SLOT TIME SELECTION
  ----------------------------------------- */
  const timeList = document.getElementById("time-list");

  if (timeList) {
    timeList.addEventListener("click", (e) => {
      if (!e.target.classList.contains("slot-time")) return;

      document.querySelectorAll(".slot-time")
        .forEach(btn => btn.classList.remove("selected"));

      e.target.classList.add("selected");
    });
  }

  /* -----------------------------------------
     PROFILE DROPDOWN
  ----------------------------------------- */
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

  /* -----------------------------------------
     CALENDAR DATE SELECTION
  ----------------------------------------- */
  const days = document.querySelectorAll(".calendar-day");
  const dateOutput = document.getElementById("selected-date");

  if (days && dateOutput) {
    days.forEach(day => {
      day.addEventListener("click", () => {

        days.forEach(d => d.classList.remove("selected"));
        day.classList.add("selected");

        const dayNumber = day.textContent.trim();
        dateOutput.textContent = `${dayNumber}.12.2024`;
      });
    });
  }

});


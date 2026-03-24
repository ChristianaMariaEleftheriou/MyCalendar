function autoLoginIfUserExists(){
  const userId = localStorage.getItem("currentUserId");
  const userEmail = localStorage.getItem("currentUserEmail");

  if(userId && userEmail){
    document.getElementById("authPage").style.display = "none";
    document.getElementById("calendarPage").style.display = "block";
    loadUserEvents();
    renderWeek();
  }
}

async function signUpUser(){
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if(email === "" || password === ""){
    alert("Please fill in email and password.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if(response.ok){
      localStorage.setItem("currentUserEmail", data.email);
      localStorage.setItem("currentUserId", data.userId);
      alert("Account created successfully");
      showCalendar();
      loadUserEvents();
    } else {
      alert(data.message);
    }

  } catch (error) {
    console.error(error);
    alert("Signup failed.");
  }
}

async function logInUser(){
  console.log("logInUser started");

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if(email === "" || password === ""){
    alert("Please fill in email and password.");
    return;
  }

  try{

    const response = await fetch("http://localhost:3000/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if(response.ok){

      localStorage.setItem("currentUserEmail", data.email);
      localStorage.setItem("currentUserId", data.userId);

      alert("Login successful");
      showCalendar();
      loadUserEvents();

    }else{

      alert(data.message);

    }

  }catch(error){

    console.error(error);
    alert("Login failed");

  }
}

async function loadUserEvents(){
  const userId = localStorage.getItem("currentUserId");

  if(!userId){
    return;
  }

  try{
    const response = await fetch(`http://localhost:3000/events/${userId}`);
    const data = await response.json();

    events = data.map(event => ({
      id: event.id,
      title: event.title,
      date: String(event.event_date).split("T")[0],
      time: event.time_range || "",
      repeat: event.repeat_rule || "",
      until: event.until_date ? String(event.until_date).split("T")[0] : "",
      exclude: event.exclude_rule || "",
      flexible: event.flexible,
      color: event.color || "#f7d7ec"
    }));

    renderWeek();

  }catch(error){
    console.error("LOAD EVENTS FRONTEND ERROR:", error);
  }
}

async function saveEventToDatabase(eventObj){
  const userId = localStorage.getItem("currentUserId");

  if(!userId){
    alert("No logged-in user found.");
    return null;
  }

  try{
    const response = await fetch("http://localhost:3000/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: Number(userId),
        title: eventObj.title,
        eventDate: eventObj.date,
        timeRange: eventObj.time || "",
        repeatRule: eventObj.repeat || "",
        untilDate: eventObj.until || null,
        excludeRule: eventObj.exclude || "",
        flexible: !!eventObj.flexible,
        color: eventObj.color || "#f7d7ec"
      })
    });

    const data = await response.json();

    if(!response.ok){
      alert(data.message || "Failed to save event");
      return null;
    }

    return data.eventId;

  }catch(error){
    console.error("SAVE EVENT FRONTEND ERROR:", error);
    alert("Failed to save event");
    return null;
  }
}

let visibleStartMinutes = 8 * 60;   // 08:00
    let visibleEndMinutes = 20 * 60;    // 20:00

function updateVisibleTimeRange(){
  visibleStartMinutes = 8 * 60;
  visibleEndMinutes = 20 * 60;

  const weekDates = [];

  for(let i = 0; i < 7; i++){
    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentWeekStart.getDate() + i);
    weekDates.push(formatDateKey(currentDate));
  }

  const eventsThisWeek = events.filter(event => weekDates.includes(event.date));

  eventsThisWeek.forEach(event => {
    if(event.time && event.time.includes("-")){
      const parsed = parseTimeRange(event.time);

      if(parsed){
        const startMinutes = parsed.startMinutes;
        const endMinutes = parsed.endMinutes;

        if(startMinutes < visibleStartMinutes){
          visibleStartMinutes = Math.floor(startMinutes / 15) * 15;
        }

        if(endMinutes > visibleEndMinutes){
          visibleEndMinutes = Math.ceil(endMinutes / 15) * 15;
        }
      }
    }
  });
}
    let events = [];

    let editingEventId = null;

    let weekendHidden = false;

    function showLogin(){
      document.getElementById("welcome").style.display = "none";
      document.getElementById("signup").style.display = "none";
      document.getElementById("login").style.display = "block";
    }

    function showSignup(){
      document.getElementById("welcome").style.display = "none";
      document.getElementById("login").style.display = "none";
      document.getElementById("signup").style.display = "block";
    }

    function goBack(){
      document.getElementById("login").style.display = "none";
      document.getElementById("signup").style.display = "none";
      document.getElementById("welcome").style.display = "block";
    }

    function showCalendar(){
        document.getElementById("authPage").style.display = "none";
        document.getElementById("calendarPage").style.display = "block";
        renderWeek();
    }

    function toggleWeekend(){
      const saturday = document.getElementById("saturdayColumn");
      const sunday = document.getElementById("sundayColumn");
      const weekView = document.getElementById("weekView");
      const toggleBtn = document.getElementById("toggleWeekendBtn");

      weekendHidden = !weekendHidden;

      if (weekendHidden) {
        saturday.classList.add("hidden-day");
        sunday.classList.add("hidden-day");
        weekView.classList.add("weekdays-only");
        toggleBtn.textContent = "Show Weekend";
      } else {
        saturday.classList.remove("hidden-day");
        sunday.classList.remove("hidden-day");
        weekView.classList.remove("weekdays-only");
        toggleBtn.textContent = "Weekdays Only";
      }
    }

    function openAddPanel(){
  document.getElementById("addEventPanel").style.display = "block";
}

function closeAddPanel(){
  document.getElementById("addEventPanel").style.display = "none";
}

function openEditSearch(){
  document.getElementById("editSearchPanel").style.display = "block";
  document.getElementById("editSearchInput").value = "";
  renderEditSearchResults();
}

function closeEditSearch(){
  document.getElementById("editSearchPanel").style.display = "none";
}

function renderEditSearchResults(){
  const resultsBox = document.getElementById("editSearchResults");
  const searchValue = document.getElementById("editSearchInput").value.trim().toLowerCase();

  resultsBox.innerHTML = "";

  let filteredEvents = events;

  if(searchValue !== ""){
    filteredEvents = events.filter(event =>
      (event.title && event.title.toLowerCase().includes(searchValue)) ||
      (event.date && event.date.toLowerCase().includes(searchValue)) ||
      (event.time && event.time.toLowerCase().includes(searchValue))
    );
  }

  if(filteredEvents.length === 0){
    resultsBox.innerHTML = `<div class="input-hint">No matching events found.</div>`;
    return;
  }

  filteredEvents.forEach(event => {
    const item = document.createElement("div");
    item.classList.add("edit-search-item");
    item.style.background = event.color || "#f7d7ec";

    item.innerHTML = `
      <div class="event-title">${event.title}</div>
      <div class="event-time">${event.date}${event.time ? " | " + event.time : ""}</div>
    `;

    item.onclick = () => {
      closeEditSearch();
      openEditModal(event.id);
    };

    resultsBox.appendChild(item);
  });
}

function toggleHint(inputId, hintId){
  const input = document.getElementById(inputId);
  const hint = document.getElementById(hintId);

  if(input.value.trim() !== ""){
    hint.style.display = "none";
  } else {
    hint.style.display = "block";
  }
}

/*THIS function was added for the exclude button */
function parseExcludeDates(excludeText, startDateObj) {
  if (!excludeText.trim()) return [];

  return excludeText
    .split(",")
    .map(item => item.trim())
    .map(item => {
      const parsed = parseUntilDate(item, startDateObj);
      return parsed ? formatDateKey(parsed) : null;
    })
    .filter(Boolean);
}
/*the function was just updated(17/3) for the exclude button */
async function addEvent(){
  const title = document.getElementById("eventTitle").value.trim();
  const when = document.getElementById("eventWhen").value.trim();
  const time = document.getElementById("eventTime").value.trim();
  const repeat = document.getElementById("eventRepeat").value.trim().toLowerCase();
  const until = document.getElementById("eventUntil").value.trim();
  const exclude = document.getElementById("eventExclude").value.trim();
  const flexible = document.getElementById("flexibleEvent").checked;
  const color = document.getElementById("eventColor").value;

  if(title === "" || when === ""){
    alert("Please fill in Add and When.");
    return;
  }

  console.log("UNTIL VALUE:", until);

  const matchedDates = findMatchingDates(when);

  if(matchedDates.length === 0){
    alert("Please type a valid day or date.");
    return;
  }

  for (const dateString of matchedDates) {
    const startDateObj = dateKeyToDate(dateString);
    const untilDateObj = parseUntilDate(until, startDateObj);
    const repeatedDates = getRepeatedDates(dateString, repeat, until);

    const excludedDates = parseExcludeDates(exclude, startDateObj);

    for (const repeatedDate of repeatedDates) {
      if (excludedDates.includes(repeatedDate)) {
        continue;
      }

      const alreadyExists = events.some(event =>
        event.title === title &&
        event.date === repeatedDate &&
        event.time === time
      );

      if(!alreadyExists){
        const newEvent = {
          title: title,
          date: repeatedDate,
          time: time,
          repeat: repeat,
          until: untilDateObj ? formatDateKey(untilDateObj) : null,
          exclude: exclude,
          flexible: flexible,
          color: color
        };

        const savedId = await saveEventToDatabase(newEvent);

        if(savedId){
          newEvent.id = savedId;
          events.push(newEvent);
        }
      }
    }
  }

  clearEventForm();
  renderWeek();
  closeAddPanel();
}

async function deleteEventFromDatabase(event){
  const userId = localStorage.getItem("currentUserId");

  if(!userId){
    alert("No logged-in user found.");
    return false;
  }

  try{
    const response = await fetch(`http://localhost:3000/events/${event.id}?userId=${userId}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if(!response.ok){
      alert(data.message || "Failed to delete event");
      return false;
    }

    return true;

  }catch(error){
    console.error("DELETE EVENT FRONTEND ERROR:", error);
    alert("Failed to delete event");
    return false;
  }
}

function formatDateKey(dateObj){
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function findMatchingDates(userInput){
  const normalized = userInput
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\band\b/g, ",");

  if (
    normalized === "everyday" ||
    normalized === "every day" ||
    normalized === "week" ||
    normalized === "this week"
  ) {
    return getDatesForCurrentWeek([0, 1, 2, 3, 4, 5, 6]);
  }

  if (
    normalized === "weekdays" ||
    normalized === "weekday"
  ) {
    return getDatesForCurrentWeek([0, 1, 2, 3, 4]);
  }

  if (
    normalized === "weekend" ||
    normalized === "weekends"
  ) {
    return getDatesForCurrentWeek([5, 6]);
  }

  const expandedInput = expandSharedDateInput(normalized);

  const parts = expandedInput
    .split(",")
    .map(part => part.trim())
    .filter(part => part !== "");

  const matchedDates = [];

  parts.forEach(part => {
    const specificDate = parseSpecificDate(part);

    if (specificDate) {
      const dateKey = formatDateKey(specificDate);
      if (!matchedDates.includes(dateKey)) {
        matchedDates.push(dateKey);
      }
      return;
    }

    const matchedDay = findMatchingDay(part);

    if (matchedDay) {
      const index = dayNames.indexOf(matchedDay);

      if (index !== -1) {
        const dateObj = new Date(currentWeekStart);
        dateObj.setDate(currentWeekStart.getDate() + index);

        const dateKey = formatDateKey(dateObj);
        if (!matchedDates.includes(dateKey)) {
          matchedDates.push(dateKey);
        }
      }
    }
  });

  return matchedDates;
}

function clearEventForm(){
  document.getElementById("eventTitle").value = "";
  document.getElementById("eventWhen").value = "";
  document.getElementById("eventTime").value = "";
  document.getElementById("eventRepeat").value = "";
  document.getElementById("eventUntil").value = "";
  document.getElementById("eventExclude").value = "";
  document.getElementById("flexibleEvent").checked = false;

  const hints = document.querySelectorAll(".input-hint");
  hints.forEach(hint => {
    hint.style.display = "block";
  });
}

function renderEvents(){
  for(let i = 0; i < 7; i++){
    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentWeekStart.getDate() + i);

    const dateKey = formatDateKey(currentDate);
    const dayBox = document.getElementById(dayNames[i]);

    const eventsForThisDay = events.filter(event => event.date === dateKey);

    eventsForThisDay.forEach(event => {
      if(event.time && event.time.includes("-")){
        paintEventTime(dayBox, event);
      } else {
        const eventCard = document.createElement("div");
        eventCard.classList.add("calendar-event");
        eventCard.onclick = () => openEditModal(event.id);
        eventCard.style.background = event.color || "#f7d7ec";

        eventCard.innerHTML = `
          <button class="delete-event-btn">×</button>
          <div class="event-title">${event.title}</div>
          ${event.time ? `<div class="event-time">${event.time}</div>` : ""}
`         ;

        const deleteBtn = eventCard.querySelector(".delete-event-btn");

        deleteBtn.onclick = async (e) => {
          e.stopPropagation();

          const confirmed = confirm("Delete this event?");
          if(!confirmed) return;

          const deleted = await deleteEventFromDatabase(event);

          if(deleted){
            events = events.filter(ev => ev.id !== event.id);
            renderWeek();
          }
        };

        dayBox.appendChild(eventCard);
      }
    });
  }
}

function findMatchingDays(userInput){
  const normalized = userInput
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\band\b/g, ",");

  if (
    normalized === "weekdays" ||
    normalized === "weekday"
  ) {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  }

  if (
    normalized === "all" ||
    normalized === "all days" ||
    normalized === "week" ||
    normalized === "this week"
  ) {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  }

  const expandedInput = expandSharedDateInput(normalized);

  const parts = expandedInput
    .split(",")
    .map(part => part.trim())
    .filter(part => part !== "");

  const matchedDays = [];

  parts.forEach(part => {
    const matchedDay = findMatchingDay(part);

    if(matchedDay && !matchedDays.includes(matchedDay)){
      matchedDays.push(matchedDay);
    }
  });

  return matchedDays;
}

function expandSharedDateInput(input){
  let text = input;

  text = expandSharedMonthWords(text);
  text = expandSharedNumericDates(text);

  return text;
}

function expandSharedMonthWords(input){
  const monthPattern = "(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)";

  const regex = new RegExp(`\\b((?:\\d{1,2}\\s*,\\s*)*\\d{1,2})\\s+${monthPattern}\\b`, "gi");

  return input.replace(regex, (match, dayList, month) => {
    const days = dayList.split(",").map(d => d.trim()).filter(Boolean);
    return days.map(day => `${day} ${month}`).join(", ");
  });
}

function expandSharedNumericDates(input){
  let text = input;

  const slashRegex = /\b((?:\d{1,2}\s*,\s*)*\d{1,2})\/(\d{1,2})(\/\d{2,4})?\b/g;
  text = text.replace(slashRegex, (match, dayList, month, year = "") => {
    const days = dayList.split(",").map(d => d.trim()).filter(Boolean);
    return days.map(day => `${day}/${month}${year}`).join(", ");
  });

  const dotRegex = /\b((?:\d{1,2}\s*,\s*)*\d{1,2})\.(\d{1,2})(\.\d{2,4})?\b/g;
  text = text.replace(dotRegex, (match, dayList, month, year = "") => {
    const days = dayList.split(",").map(d => d.trim()).filter(Boolean);
    return days.map(day => `${day}.${month}${year}`).join(", ");
  });

  return text;
}

function normalizeText(text){
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\./g, "/");
}

function getMonthVariants(monthIndex){
  const shortMonths = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const longMonths = ["january","february","march","april","may","june","july","august","september","october","november","december"];

  return {
    short: shortMonths[monthIndex],
    long: longMonths[monthIndex]
  };
}

function getAcceptedFormats(dateObj, dayName){
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const yearFull = dateObj.getFullYear();
  const yearShort = String(yearFull).slice(-2);

  const monthNames = getMonthVariants(month);

  const dayFull = dayName.toLowerCase();
  const dayShort = dayFull.slice(0,3);

  const formats = [
  dayFull,
  dayShort,

    `${day} ${monthNames.short}`,
    `${day} ${monthNames.long}`,

    `${monthNames.short} ${day}`,
    `${monthNames.long} ${day}`,

    `${day}/${month + 1}`,
    `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}`,

    `${day}/${month + 1}/${yearShort}`,
    `${day}/${month + 1}/${yearFull}`,

    `${day}/${month + 1}/${yearShort}`,
    `${day}/${month + 1}/${yearFull}`,

    `${day}/${month + 1}`,
    `${day}/${String(month + 1).padStart(2, "0")}`,
    `${String(day).padStart(2, "0")}/${month + 1}`,
    `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}`,

    `${day}/${month + 1}/${yearShort}`,
    `${day}/${month + 1}/${yearFull}`,
    `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${yearShort}`,
    `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${yearFull}`
  ];

  return [...new Set(formats.map(normalizeText))];
}

function findMatchingDay(userInput){
  const normalizedInput = normalizeText(userInput);

  for(let i = 0; i < 7; i++){
    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentWeekStart.getDate() + i);

    const acceptedFormats = getAcceptedFormats(currentDate, dayNames[i]);

    if(acceptedFormats.includes(normalizedInput)){
      return dayNames[i];
    }
  }

  return null;
}

let currentWeekStart = getMondayOfCurrentWeek();
const minWeekStart = new Date(2020, 0, 1);
const maxWeekStart = new Date(2030, 11, 31);

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(date){
  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
}

function getMondayOfCurrentWeek(){
  const today = new Date();
  const day = today.getDay(); 
  const diff = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

function renderWeek(){
  for(let i = 0; i < 7; i++){
    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentWeekStart.getDate() + i);

    document.getElementById(`dayName${i}`).textContent = dayNames[i];
    document.getElementById(`dayDate${i}`).textContent = formatDate(currentDate);
  }

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  document.getElementById("weekRange").textContent =
    `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)} ${weekEnd.getFullYear()}`;

    updateVisibleTimeRange();
    createTimeSlots();
    renderEvents();
}

function nextWeek(){
  const testDate = new Date(currentWeekStart);
  testDate.setDate(currentWeekStart.getDate() + 7);

  if(testDate <= maxWeekStart){
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderWeek();
  }
}

function previousWeek(){
  const testDate = new Date(currentWeekStart);
  testDate.setDate(currentWeekStart.getDate() - 7);

  if(testDate >= minWeekStart){
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderWeek();
  }
}

function parseSpecificDate(input){
  const text = input.trim().toLowerCase();

  const monthMap = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  let match;

  match = text.match(/^(\d{1,2})\s+([a-z]+)$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = monthMap[match[2]];
    if (month !== undefined) {
      return createValidDate(2026, month, day);
    }
  }

  match = text.match(/^([a-z]+)\s+(\d{1,2})$/);
  if (match) {
    const month = monthMap[match[1]];
    const day = parseInt(match[2]);
    if (month !== undefined) {
      return createValidDate(2026, month, day);
    }
  }

  match = text.match(/^(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    let year = match[3] ? parseInt(match[3]) : 2026;

    if (year < 100) {
      year = 2000 + year;
    }

    return createValidDate(year, month, day);
  }

  return null;
}

function createValidDate(year, month, day){
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getRepeatedDates(startDateString, repeatText, untilText){
  const startDate = dateKeyToDate(startDateString);
  if(!startDate){
    return [startDateString];
  }

  const untilDate = parseUntilDate(untilText, startDate);
  const text = repeatText ? repeatText.trim().toLowerCase() : "";

  if(!text){
    if(untilDate){
      return buildRepeatedDatesUntil(startDate, "week", 1, untilDate, 100);
    }
    return [startDateString];
  }

  if(text === "forever"){
    return buildRepeatedDatesUntil(startDate, "week", 1, untilDate, 100);
  }
  if(text === "every week"){
  return buildRepeatedDatesUntil(startDate, "week", 1, untilDate, 100);
 }
  if(text === "everyday" || text === "every day"){
    return buildRepeatedDatesUntil(startDate, "day", 1, untilDate, 1000);
  }

  if(text === "this week and every other week"){
    return buildRepeatedDatesUntil(startDate, "week", 2, untilDate, 100);
  }
  if(text === "every other week"){
  return buildRepeatedDatesUntil(startDate, "week", 2, untilDate, 100);
}

const everyXWeeksMatch = text.match(/^every (\d+) weeks?$/);
if(everyXWeeksMatch){
  const interval = parseInt(everyXWeeksMatch[1]);

  if(interval >= 2 && interval <= 5){
    return buildRepeatedDatesUntil(startDate, "week", interval, untilDate, 100);
  }
}
const thisWeekEveryXMatch = text.match(/^this week and every (\d+) weeks?$/);
  if(thisWeekEveryXMatch){
    const interval = parseInt(thisWeekEveryXMatch[1]);

    if(interval >= 2 && interval <= 5){
      return buildRepeatedDatesUntil(startDate, "week", interval, untilDate, 100);
    }
  }

  const match = text.match(/^(\d+)\s*(week|weeks|month|months|year|years)$/);
  if(match){
    const amount = parseInt(match[1]);
    const unit = match[2];

    if(unit.startsWith("week")){
      return buildFixedCountDates(startDate, "week", 1, amount, untilDate);
    }

    if(unit.startsWith("month")){
      return buildFixedCountDates(startDate, "month", 1, amount, untilDate);
    }

    if(unit.startsWith("year")){
      return buildFixedCountDates(startDate, "year", 1, amount, untilDate);
    }
  }
   // Fallback: if Until exists but Repeat text not recognized
  if(untilDate){
    return buildRepeatedDatesUntil(startDate, "week", 1, untilDate, 100);
  }
  return [startDateString];
}

function buildRepeatedDates(startDate, amount, unit){
  const results = [];

  for(let i = 0; i < amount; i++){
    const newDate = new Date(startDate);

    if(unit === "week"){
      newDate.setDate(startDate.getDate() + (i * 7));
    }

    if(unit === "month"){
      newDate.setMonth(startDate.getMonth() + i);
    }

    if(unit === "year"){
      newDate.setFullYear(startDate.getFullYear() + i);
    }

    results.push(formatDateKey(newDate));
  }

  return results;
}

function buildDailyDatesUntilEndOfYear(startDate){
  const results = [];
  const year = startDate.getFullYear();
  const endDate = new Date(year, 11, 31);

  const current = new Date(startDate);

  while(current <= endDate){
    results.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return results;
}

function dateKeyToDate(dateKey){
  const parts = dateKey.split("-");
  if(parts.length !== 3){
    return null;
  }

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);

  const date = new Date(year, month, day);

  if(
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ){
    return null;
  }

  return date;
}

function getDatesForCurrentWeek(indexes){
  const dates = [];

  indexes.forEach(index => {
    const dateObj = new Date(currentWeekStart);
    dateObj.setDate(currentWeekStart.getDate() + index);
    dates.push(formatDateKey(dateObj));
  });

  return dates;
}

function buildIntervalWeekDates(startDate, intervalWeeks, occurrences){
  const results = [];

  for(let i = 0; i < occurrences; i++){
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + (i * intervalWeeks * 7));
    results.push(formatDateKey(newDate));
  }

  return results;
}

function parseUntilDate(untilText, startDate){
  if(!untilText || untilText.trim() === ""){
    return null;
  }

  const text = untilText.trim().toLowerCase();

  if(text === "end of week"){
    const endOfWeek = new Date(startDate);
    const day = endOfWeek.getDay(); // Sunday = 0
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
    return endOfWeek;
  }

  if(text === "end of month"){
    return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  }

  if(text === "end of next month"){
    return new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0);
  }

  if(text === "end of year"){
    return new Date(startDate.getFullYear(), 11, 31);
  }

  const parsed = parseSpecificDate(text);
  return parsed ? parsed : null;
}

function buildRepeatedDatesUntil(startDate, unit, step, untilDate, maxOccurrences){
  const results = [];
  let current = new Date(startDate);

  for(let i = 0; i < maxOccurrences; i++){
    if(untilDate && current > untilDate){
      break;
    }

    results.push(formatDateKey(current));

    current = addToDate(current, unit, step);
  }

  return results;
}

function buildFixedCountDates(startDate, unit, step, count, untilDate){
  const results = [];
  let current = new Date(startDate);

  for(let i = 0; i < count; i++){
    if(untilDate && current > untilDate){
      break;
    }

    results.push(formatDateKey(current));
    current = addToDate(current, unit, step);
  }

  return results;
}

function handleUntilSelectChange(){
  const untilSelect = document.getElementById("untilSelect");
  const untilInput = document.getElementById("eventUntil");
  const untilHint = document.getElementById("hintUntil");

  if(untilSelect.value === "custom"){
    untilInput.style.display = "block";
    untilInput.value = "";
    untilHint.style.display = "block";
  } else {
    untilInput.style.display = "none";
    untilInput.value = untilSelect.value;

    if(untilSelect.value === ""){
      untilHint.style.display = "block";
    } else {
      untilHint.style.display = "none";
    }
  }
}

function addToDate(dateObj, unit, amount){
  const newDate = new Date(dateObj);

  if(unit === "day"){
    newDate.setDate(newDate.getDate() + amount);
  }

  if(unit === "week"){
    newDate.setDate(newDate.getDate() + (amount * 7));
  }

  if(unit === "month"){
    newDate.setMonth(newDate.getMonth() + amount);
  }

  if(unit === "year"){
    newDate.setFullYear(newDate.getFullYear() + amount);
  }

  return newDate;
}

function createTimeSlots(){
  const dayContents = document.querySelectorAll(".day-content");
  const totalSlots = (visibleEndMinutes - visibleStartMinutes) / 15;

  dayContents.forEach(dayBox => {
    dayBox.innerHTML = "";

    for(let i = 0; i < totalSlots; i++){
      const slot = document.createElement("div");
      slot.classList.add("time-slot");
      slot.dataset.slot = i;
      dayBox.appendChild(slot);
    }
  });
}

async function paintEventTime(dayBox, event){
  const parsed = parseTimeRange(event.time);

  if(!parsed){
    const eventCard = document.createElement("div");
    eventCard.classList.add("calendar-event");
    eventCard.style.background = event.color || "#f7d7ec";

    eventCard.innerHTML = `
      <button class="delete-event-btn">×</button>
      <div class="event-title">${event.title}</div>
      <div class="event-time">${event.time}</div>
    `;

    const deleteBtn = eventCard.querySelector(".delete-event-btn");

    deleteBtn.onclick = async (e) => {
      e.stopPropagation();

      const confirmed = confirm("Delete this event?");
      if(!confirmed) return;

      const deleted = await deleteEventFromDatabase(event);

      if(deleted){
        events = events.filter(ev => ev.id !== event.id);
        renderWeek();
      }
    };

    dayBox.appendChild(eventCard);
    return;
  }

  const { startMinutes, endMinutes } = parsed;

  const topOffset = ((startMinutes - visibleStartMinutes) / 15) * 16;
  const blockHeight = ((endMinutes - startMinutes) / 15) * 16;

  const eventBlock = document.createElement("div");
  eventBlock.onclick = () => openEditModal(event.id);
  eventBlock.classList.add("timed-event");
  eventBlock.onclick = () => openEditModal(event.id);
  eventBlock.style.background = event.color || "#f7d7ec";

  eventBlock.style.top = `${topOffset}px`;
  eventBlock.style.height = `${blockHeight}px`;

  eventBlock.innerHTML = `
    <button class="delete-event-btn">×</button>
    <div class="timed-event-title">${event.title}</div>
    <div class="timed-event-time">${event.time}</div>
  `;

  const deleteBtn = eventBlock.querySelector(".delete-event-btn");

  deleteBtn.onclick = async (e) => {
    e.stopPropagation();

    const confirmed = confirm("Delete this event?");
    if(!confirmed) return;

    const deleted = await deleteEventFromDatabase(event);

    if(deleted){
      events = events.filter(ev => ev.id !== event.id);
      renderWeek();
    }
  };

  dayBox.appendChild(eventBlock);
}

function parseTimeRange(timeText){
  const parts = timeText.split("-").map(part => part.trim());

  if(parts.length !== 2){
    return null;
  }

  const startMinutes = parseSingleTime(parts[0]);
  const endMinutes = parseSingleTime(parts[1]);

  if(startMinutes === null || endMinutes === null || endMinutes <= startMinutes){
    return null;
  }

  return {
    startMinutes: startMinutes,
    endMinutes: endMinutes,
    startSlot: Math.floor(startMinutes / 15),
    endSlot: Math.ceil(endMinutes / 15)
  };
}

function parseSingleTime(text){
  let value = text.trim().toLowerCase().replace(/\s+/g, "");

  const match = value.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
  if(!match){
    return null;
  }

  let hour = parseInt(match[1]);
  let minute = match[2] ? parseInt(match[2]) : 0;
  const period = match[3] || null;

  if(minute < 0 || minute > 59){
    return null;
  }

  if(period){
    if(hour < 1 || hour > 12){
      return null;
    }

    if(period === "am"){
      if(hour === 12) hour = 0;
    } else if(period === "pm"){
      if(hour !== 12) hour += 12;
    }
  } else {
    if(hour < 0 || hour > 23){
      return null;
    }
  }

  return hour * 60 + minute;
}

const whenSuggestionOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "weekdays",
  "weekend",
  "this week",
  "week",
  "everyday"
];

const repeatSuggestionOptions = [
  "every week",
  "every 2 weeks",
  "every 3 weeks",
  "every 4 weeks",
  "every 5 weeks",
  "everyday",
  "4 weeks",
  "4 months",
  "4 years",
  "forever"
];

function renderSuggestions(containerId, suggestions, inputId){
  const box = document.getElementById(containerId);
  box.innerHTML = "";

  if(suggestions.length === 0){
    box.style.display = "none";
    return;
  }

  suggestions.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("suggestion-item");
    div.textContent = item;

    div.onclick = () => {
      document.getElementById(inputId).value = item;
      box.style.display = "none";

      if(inputId === "eventWhen"){
        toggleHint("eventWhen","hintWhen");
      }

      if(inputId === "eventRepeat"){
        toggleHint("eventRepeat","hintRepeat");
      }
    };

    box.appendChild(div);
  });

  box.style.display = "block";
}

function handleWhenInput(){
  toggleHint("eventWhen","hintWhen");

  const value = document.getElementById("eventWhen").value.trim().toLowerCase();

  if(value === ""){
    document.getElementById("whenSuggestions").style.display = "none";
    return;
  }

  const filtered = whenSuggestionOptions.filter(option =>
    option.toLowerCase().includes(value)
  );

  renderSuggestions("whenSuggestions", filtered, "eventWhen");
}

function handleRepeatInput(){
  toggleHint("eventRepeat","hintRepeat");

  const value = document.getElementById("eventRepeat").value.trim().toLowerCase();

  if(value === ""){
    document.getElementById("repeatSuggestions").style.display = "none";
    return;
  }

  const filtered = repeatSuggestionOptions.filter(option =>
    option.toLowerCase().includes(value)
  );

  renderSuggestions("repeatSuggestions", filtered, "eventRepeat");
}

document.addEventListener("click", function(e){
  const whenInput = document.getElementById("eventWhen");
  const repeatInput = document.getElementById("eventRepeat");
  const whenBox = document.getElementById("whenSuggestions");
  const repeatBox = document.getElementById("repeatSuggestions");

  if(whenInput && whenBox && !whenInput.contains(e.target) && !whenBox.contains(e.target)){
    whenBox.style.display = "none";
  }

  if(repeatInput && repeatBox && !repeatInput.contains(e.target) && !repeatBox.contains(e.target)){
    repeatBox.style.display = "none";
  }
});

function handleRepeatSelectChange(){
  const repeatSelect = document.getElementById("repeatSelect");
  const repeatInput = document.getElementById("eventRepeat");
  const repeatHint = document.getElementById("hintRepeat");

  if(repeatSelect.value === "custom"){
    repeatInput.style.display = "block";
    repeatInput.value = "";
    repeatHint.style.display = "block";
  } else {
    repeatInput.style.display = "none";
    repeatInput.value = repeatSelect.value;
    
    if(repeatSelect.value === ""){
      repeatHint.style.display = "block";
    } else {
      repeatHint.style.display = "none";
    }
  }
}

function signOutUser(){
  localStorage.removeItem("currentUserId");
  localStorage.removeItem("currentUserEmail");

  document.getElementById("calendarPage").style.display = "none";
  document.getElementById("authPage").style.display = "flex";

  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
}

function selectEventColor(button){
  document.querySelectorAll(".color-option").forEach(option => {
    option.classList.remove("selected");
  });

  button.classList.add("selected");
  document.getElementById("eventColor").value = button.dataset.color;
}

function selectEditEventColor(button){
  document.querySelectorAll(".edit-color-option").forEach(option => {
    option.classList.remove("selected");
  });

  button.classList.add("selected");
  document.getElementById("editEventColor").value = button.dataset.color;
}

//Στο τελος να υπαρχει αυτο:
window.onload = function(){
  autoLoginIfUserExists();
};

function openEditModal(eventId){
  const event = events.find(e => e.id === eventId);

  if(!event){
    alert("Event not found");
    return;
  }

  editingEventId = eventId;

  document.getElementById("editTitle").value = event.title || "";
  document.getElementById("editDate").value = event.date || "";
  document.getElementById("editTime").value = event.time || "";
  document.getElementById("editRepeat").value = event.repeat || "";
  document.getElementById("editUntil").value = event.until || "";
  document.getElementById("editExclude").value = event.exclude || "";
  document.getElementById("editFlexible").checked = event.flexible || false;

  document.getElementById("editEventPanel").style.display = "block";
  document.getElementById("editEventColor").value = event.color || "#f7d7ec";

  document.querySelectorAll(".edit-color-option").forEach(option => {
  option.classList.remove("selected");

  if(option.dataset.color === (event.color || "#f7d7ec")){
    option.classList.add("selected");
  }
});
}

function closeEditPanel(){
  document.getElementById("editEventPanel").style.display = "none";
  editingEventId = null;
}

async function saveEditedEvent(){
  const event = events.find(e => e.id === editingEventId);

  if(!event){
    alert("Event not found");
    return;
  }

  const updated = {
    ...event,
    title: document.getElementById("editTitle").value.trim(),
    date: document.getElementById("editDate").value.trim(),
    time: document.getElementById("editTime").value.trim(),
    repeat: document.getElementById("editRepeat").value.trim(),
    until: document.getElementById("editUntil").value.trim(),
    exclude: document.getElementById("editExclude").value.trim(),
    flexible: document.getElementById("editFlexible").checked,
    color: document.getElementById("editEventColor").value
  };

  // 🔴 IMPORTANT: send update to backend
  try{
    const userId = localStorage.getItem("currentUserId");

    const response = await fetch(`http://localhost:3000/events/${event.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: Number(userId),
        title: updated.title,
        eventDate: updated.date,
        timeRange: updated.time,
        repeatRule: updated.repeat,
        untilDate: updated.until || null,
        excludeRule: updated.exclude,
        flexible: updated.flexible,
        color: updated.color
      })
    });

    if(!response.ok){
      alert("Failed to update event");
      return;
    }

    // update locally
    Object.assign(event, updated);

    closeEditPanel();
    renderWeek();

  }catch(error){
    console.error(error);
    alert("Update failed");
  }
}

function openEditSearch(){
  alert("Not implemented yet");
}
const DEFAULT_CONFIG = {
    semesterName: "Year 2 Semester 1",
    startDate: "",
    endDate: "",
    midtermDate: "",
    finalDate: "",
    courses: [
        { name: "General", color: "#64748b", bg: "#f1f5f9" },
        { name: "Operating Systems", color: "#1d4ed8", bg: "#dbeafe" },
        { name: "Web Integration", color: "#7e22ce", bg: "#f3e8ff" }
    ]
};

// 当前日历正在查看的月份
let calDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
    loadSemesterConfig();
    populateCourseDropdowns();
    renderAssignments();
    renderStudyTasks();
    renderCalendar();
    renderExpenses();
});

/* ================= 选项卡切换 ================= */
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const tabMap = {
        'assignments': 0,
        'study': 1,
        'calendar': 2,
        'expenses': 3
    };

    document.querySelectorAll('.tab-btn')[tabMap[tabName]].classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'calendar') {
        renderCalendar();
    }
}

/* ================= ⚙️ 学期配置逻辑 ================= */
function getConfig() {
    let cfg = localStorage.getItem("planner_semester_cfg_v1");
    return cfg ? JSON.parse(cfg) : DEFAULT_CONFIG;
}

function saveConfig(cfg) {
    localStorage.setItem("planner_semester_cfg_v1", JSON.stringify(cfg));
}

function loadSemesterConfig() {
    const cfg = getConfig();
    document.getElementById("semesterTitleDisplay").textContent = cfg.semesterName || "Academic Sprint Planner";

    const sub = document.getElementById("semesterDatesDisplay");
    if (cfg.startDate && cfg.endDate) {
        sub.textContent = `📅 ${cfg.startDate} ~ ${cfg.endDate}`;
    } else {
        sub.textContent = "Click ⚙️ to set up your semester timeline";
    }
}

function openSettings() {
    const cfg = getConfig();
    document.getElementById("cfgSemName").value = cfg.semesterName || "";
    document.getElementById("cfgStartDate").value = cfg.startDate || "";
    document.getElementById("cfgEndDate").value = cfg.endDate || "";
    document.getElementById("cfgMidtermDate").value = cfg.midtermDate || "";
    document.getElementById("cfgFinalDate").value = cfg.finalDate || "";

    renderConfigChips();
    document.getElementById("settingsModal").style.display = "flex";
}

function closeSettings() {
    document.getElementById("settingsModal").style.display = "none";
}

function renderConfigChips() {
    const cfg = getConfig();
    const container = document.getElementById("cfgCourseChips");
    container.innerHTML = "";

    cfg.courses.forEach((c, idx) => {
        const chip = document.createElement("span");
        chip.className = "course-chip";
        chip.style.backgroundColor = c.bg;
        chip.style.color = c.color;
        chip.innerHTML = `${c.name} <span class="chip-del" onclick="deleteCourseFromModal(${idx})">&times;</span>`;
        container.appendChild(chip);
    });
}

function addCourseFromModal() {
    const input = document.getElementById("cfgCourseInput");
    const name = input.value.trim();
    if (!name) return;

    const cfg = getConfig();
    const colorPairs = [
        { color: "#0369a1", bg: "#e0f2fe" },
        { color: "#b45309", bg: "#fef3c7" },
        { color: "#047857", bg: "#d1fae5" },
        { color: "#be185d", bg: "#fce7f3" },
        { color: "#4338ca", bg: "#e0e7ff" }
    ];
    const picked = colorPairs[Math.floor(Math.random() * colorPairs.length)];

    cfg.courses.push({ name: name, color: picked.color, bg: picked.bg });
    saveConfig(cfg);
    input.value = "";
    renderConfigChips();
    populateCourseDropdowns();
}

function deleteCourseFromModal(idx) {
    const cfg = getConfig();
    cfg.courses.splice(idx, 1);
    saveConfig(cfg);
    renderConfigChips();
    populateCourseDropdowns();
}

function saveSemesterSettings() {
    const cfg = getConfig();
    cfg.semesterName = document.getElementById("cfgSemName").value.trim();
    cfg.startDate = document.getElementById("cfgStartDate").value;
    cfg.endDate = document.getElementById("cfgEndDate").value;
    cfg.midtermDate = document.getElementById("cfgMidtermDate").value;
    cfg.finalDate = document.getElementById("cfgFinalDate").value;

    saveConfig(cfg);
    loadSemesterConfig();
    closeSettings();
    renderAssignments();
    renderStudyTasks();
    renderCalendar();
}

function populateCourseDropdowns() {
    const cfg = getConfig();
    const assignSelect = document.getElementById("assignSubjectSelect");
    const studySelect = document.getElementById("studySubjectSelect");
    const assignFilter = document.getElementById("assignFilterSelect");
    const studyFilter = document.getElementById("studyFilterSelect");

    assignSelect.innerHTML = "";
    studySelect.innerHTML = "";
    assignFilter.innerHTML = '<option value="ALL">All Courses</option>';
    studyFilter.innerHTML = '<option value="ALL">All Courses</option>';

    cfg.courses.forEach(c => {
        const opt1 = document.createElement("option");
        opt1.value = c.name;
        opt1.textContent = c.name;
        assignSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = c.name;
        opt2.textContent = c.name;
        studySelect.appendChild(opt2);

        const fOpt1 = document.createElement("option");
        fOpt1.value = c.name;
        fOpt1.textContent = c.name;
        assignFilter.appendChild(fOpt1);

        const fOpt2 = document.createElement("option");
        fOpt2.value = c.name;
        fOpt2.textContent = c.name;
        studyFilter.appendChild(fOpt2);
    });
}

/* ================= 🎯 Assignments ================= */
function getStoredAssignments() {
    let data = localStorage.getItem("planner_assign_v1");
    return data ? JSON.parse(data) : [];
}

function saveAssignments(data) {
    localStorage.setItem("planner_assign_v1", JSON.stringify(data));
}

function renderAssignments() {
    const list = document.getElementById("assignmentList");
    list.innerHTML = "";
    const items = getStoredAssignments();
    const cfg = getConfig();
    const filter = document.getElementById("assignFilterSelect").value;
    const todayStr = new Date().toISOString().split('T')[0];

    items.forEach((item, index) => {
        if (filter !== "ALL" && item.subject !== filter) return;

        const li = document.createElement("li");
        const isHardOverdue = item.hardDate && item.hardDate < todayStr && !item.completed;
        const isFreezeWarning = !isHardOverdue && item.targetDate && item.targetDate < todayStr && !item.completed;

        if (isHardOverdue) li.className = "status-overdue";
        else if (isFreezeWarning) li.className = "status-freeze";
        if (item.completed) li.classList.add("completed");

        const leftDiv = document.createElement("div");
        leftDiv.className = "task-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;
        checkbox.onchange = () => toggleAssignment(index);

        const infoDiv = document.createElement("div");
        infoDiv.className = "task-info";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = item.text;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const matchedCourse = cfg.courses.find(c => c.name === item.subject) || { color: "#64748b", bg: "#f1f5f9" };
        const tag = document.createElement("span");
        tag.className = "tag-badge";
        tag.style.color = matchedCourse.color;
        tag.style.backgroundColor = matchedCourse.bg;
        tag.textContent = item.subject;
        meta.appendChild(tag);

        if (item.targetDate) {
            const tBadge = document.createElement("span");
            tBadge.className = `date-badge ${isFreezeWarning ? 'freeze-warning' : ''}`;
            tBadge.textContent = isFreezeWarning ? `⚠️ Freeze Passed: ${item.targetDate}` : `🎯 Freeze: ${item.targetDate}`;
            meta.appendChild(tBadge);
        }

        if (item.hardDate) {
            const hBadge = document.createElement("span");
            hBadge.className = `date-badge ${isHardOverdue ? 'hard-overdue' : ''}`;
            hBadge.textContent = isHardOverdue ? `🚨 Overdue: ${item.hardDate}` : `🚨 Hard Due: ${item.hardDate}`;
            meta.appendChild(hBadge);
        }

        infoDiv.appendChild(title);
        infoDiv.appendChild(meta);
        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(infoDiv);

        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.innerHTML = "&times;";
        delBtn.onclick = () => deleteAssignment(index);

        li.appendChild(leftDiv);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function addAssignment() {
    const input = document.getElementById("assignInput");
    const subject = document.getElementById("assignSubjectSelect").value;
    const targetDate = document.getElementById("assignTargetDate").value;
    const hardDate = document.getElementById("assignHardDate").value;

    const text = input.value.trim();
    if (!text) return;

    const items = getStoredAssignments();
    items.push({ text, subject, targetDate, hardDate, completed: false });
    items.sort((a, b) => (a.targetDate || a.hardDate || '9999').localeCompare(b.targetDate || b.hardDate || '9999'));

    saveAssignments(items);
    input.value = "";
    document.getElementById("assignTargetDate").value = "";
    document.getElementById("assignHardDate").value = "";
    renderAssignments();
    renderCalendar();
}

function toggleAssignment(idx) {
    const items = getStoredAssignments();
    items[idx].completed = !items[idx].completed;
    saveAssignments(items);
    renderAssignments();
}

function deleteAssignment(idx) {
    const items = getStoredAssignments();
    items.splice(idx, 1);
    saveAssignments(items);
    renderAssignments();
    renderCalendar();
}

/* ================= 📚 Study Tasks (课业负债与拖延计算) ================= */
function getStoredStudyTasks() {
    let data = localStorage.getItem("planner_study_v2");
    return data ? JSON.parse(data) : [];
}

function saveStudyTasks(data) {
    localStorage.setItem("planner_study_v2", JSON.stringify(data));
}

// 计算两日期间隔天数 (YYYY-MM-DD)
function calculateDaysDiff(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = end - start;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function renderStudyTasks() {
    const list = document.getElementById("studyList");
    list.innerHTML = "";
    const items = getStoredStudyTasks();
    const cfg = getConfig();
    const filter = document.getElementById("studyFilterSelect").value;
    const todayStr = new Date().toISOString().split('T')[0];

    items.forEach((item, index) => {
        if (filter !== "ALL" && item.subject !== filter) return;

        const li = document.createElement("li");

        // 计算拖延天数
        let delayDays = 0;
        let isDelayed = false;

        if (item.originalDate) {
            const compareDate = item.completed ? (item.completedDate || todayStr) : todayStr;
            delayDays = calculateDaysDiff(item.originalDate, compareDate);
            if (delayDays > 0) isDelayed = true;
        }

        if (!item.completed && isDelayed) {
            li.className = delayDays >= 4 ? "status-overdue" : "status-freeze";
        }
        if (item.completed) li.classList.add("completed");

        const leftDiv = document.createElement("div");
        leftDiv.className = "task-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;
        checkbox.onchange = () => toggleStudyTask(index);

        const infoDiv = document.createElement("div");
        infoDiv.className = "task-info";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = item.text;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        // 科目标签
        const matchedCourse = cfg.courses.find(c => c.name === item.subject) || { color: "#64748b", bg: "#f1f5f9" };
        const tag = document.createElement("span");
        tag.className = "tag-badge";
        tag.style.color = matchedCourse.color;
        tag.style.backgroundColor = matchedCourse.bg;
        tag.textContent = item.subject;
        meta.appendChild(tag);

        // 原上课日期
        if (item.originalDate) {
            const dateBadge = document.createElement("span");
            dateBadge.className = "date-badge";
            dateBadge.textContent = `Ended: ${item.originalDate}`;
            meta.appendChild(dateBadge);
        }

        // 拖延天数徽章 (核心负债指标)
        if (item.originalDate) {
            const delayBadge = document.createElement("span");
            if (item.completed) {
                delayBadge.className = "delay-badge delay-completed";
                delayBadge.textContent = delayDays > 0 ? `✓ 迟了 ${delayDays} 天补完` : "✓ 准时补完";
            } else {
                if (delayDays > 0) {
                    delayBadge.className = `delay-badge ${delayDays >= 4 ? 'delay-severe' : 'delay-mild'}`;
                    delayBadge.textContent = `⏳ 拖欠了 ${delayDays} 天`;
                } else if (delayDays === 0) {
                    delayBadge.className = "delay-badge delay-mild";
                    delayBadge.textContent = "⚡ 今天刚结束";
                } else {
                    delayBadge.className = "delay-badge delay-completed";
                    delayBadge.textContent = "未到期课程";
                }
            }
            meta.appendChild(delayBadge);
        }

        infoDiv.appendChild(title);
        infoDiv.appendChild(meta);
        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(infoDiv);

        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.innerHTML = "&times;";
        delBtn.onclick = () => deleteStudyTask(index);

        li.appendChild(leftDiv);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function addStudyTask() {
    const input = document.getElementById("studyTaskInput");
    const subject = document.getElementById("studySubjectSelect").value;
    const originalDate = document.getElementById("studyOriginalDate").value;

    const text = input.value.trim();
    if (!text) return;

    const items = getStoredStudyTasks();
    items.push({
        text,
        subject,
        originalDate,
        completed: false,
        completedDate: null
    });

    // 智能排序：优先把未完成且拖延最久的排在最前面
    const todayStr = new Date().toISOString().split('T')[0];
    items.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const delayA = a.originalDate ? calculateDaysDiff(a.originalDate, todayStr) : -999;
        const delayB = b.originalDate ? calculateDaysDiff(b.originalDate, todayStr) : -999;
        return delayB - delayA; // 拖延天数多的置顶
    });

    saveStudyTasks(items);
    input.value = "";
    document.getElementById("studyOriginalDate").value = "";
    renderStudyTasks();
    if (typeof renderCalendar === "function") renderCalendar();
}

function toggleStudyTask(idx) {
    const items = getStoredStudyTasks();
    const todayStr = new Date().toISOString().split('T')[0];
    items[idx].completed = !items[idx].completed;
    items[idx].completedDate = items[idx].completed ? todayStr : null;
    saveStudyTasks(items);
    renderStudyTasks();
    if (typeof renderCalendar === "function") renderCalendar();
}

function deleteStudyTask(idx) {
    const items = getStoredStudyTasks();
    items.splice(idx, 1);
    saveStudyTasks(items);
    renderStudyTasks();
    if (typeof renderCalendar === "function") renderCalendar();
}

/* ================= 📅 日历渲染与 Google Calendar 导出 ================= */
function changeMonth(delta) {
    calDate.setMonth(calDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById("calendarMonthYearDisplay").textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    // 聚合所有事件
    const cfg = getConfig();
    const assigns = getStoredAssignments();
    const studyTasks = getStoredStudyTasks();

    const eventMap = {}; // 'YYYY-MM-DD' => [{ text, type }]

    const addEvent = (dStr, text, type) => {
        if (!dStr) return;
        if (!eventMap[dStr]) eventMap[dStr] = [];
        eventMap[dStr].push({ text, type });
    };

    if (cfg.midtermDate) addEvent(cfg.midtermDate, "Midterm Start", "exam");
    if (cfg.finalDate) addEvent(cfg.finalDate, "Final Exam Start", "exam");

    assigns.forEach(a => {
        if (!a.completed) {
            if (a.targetDate) addEvent(a.targetDate, `🎯 ${a.text}`, "freeze");
            if (a.hardDate) addEvent(a.hardDate, `🚨 ${a.text}`, "hard");
        }
    });

    studyTasks.forEach(s => {
        if (!s.completed && s.date) addEvent(s.date, `📚 ${s.text}`, "freeze");
    });

    // 填补前置空白格
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "cal-day empty";
        grid.appendChild(emptyCell);
    }

    // 渲染每一天
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement("div");
        cell.className = "cal-day";

        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        const currDateStr = `${year}-${mStr}-${dStr}`;

        if (currDateStr === todayStr) cell.classList.add("today");

        const numDiv = document.createElement("div");
        numDiv.className = "cal-day-num";
        numDiv.textContent = day;
        cell.appendChild(numDiv);

        const eventsDiv = document.createElement("div");
        eventsDiv.className = "cal-events";

        if (eventMap[currDateStr]) {
            eventMap[currDateStr].forEach(ev => {
                const pill = document.createElement("div");
                pill.className = `cal-event-pill cal-pill-${ev.type}`;
                pill.textContent = ev.text;
                pill.title = ev.text;
                eventsDiv.appendChild(pill);
            });
        }

        cell.appendChild(eventsDiv);
        grid.appendChild(cell);
    }
}

// 导出为标准 iCalendar (.ics) 文件，供 Google Calendar 直接导入
function exportToICS() {
    const cfg = getConfig();
    const assigns = getStoredAssignments();

    let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Academic Sprint Planner//EN"
    ];

    const formatDateICS = (dStr) => dStr.replace(/-/g, "") + "T090000Z";

    const addVEvent = (title, dStr, desc) => {
        if (!dStr) return;
        const dt = formatDateICS(dStr);
        icsContent.push("BEGIN:VEVENT");
        icsContent.push(`SUMMARY:${title}`);
        icsContent.push(`DESCRIPTION:${desc}`);
        icsContent.push(`DTSTART:${dt}`);
        icsContent.push(`DTEND:${dt}`);
        icsContent.push("STATUS:CONFIRMED");
        icsContent.push("END:VEVENT");
    };

    if (cfg.midtermDate) addVEvent("Midterm Exam Week", cfg.midtermDate, "Midterm examination week starts.");
    if (cfg.finalDate) addVEvent("Final Exam Week", cfg.finalDate, "Final examination week starts.");

    assigns.forEach(a => {
        if (a.targetDate) addVEvent(`[Target Freeze] ${a.text}`, a.targetDate, `v1.0 Done. Course: ${a.subject}`);
        if (a.hardDate) addVEvent(`[Hard Deadline] ${a.text}`, a.hardDate, `Official Deadline. Course: ${a.subject}`);
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${cfg.semesterName || 'Semester'}_Schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ================= 💰 记账功能 ================= */
function getStoredExpenses() {
    let expenses = localStorage.getItem("planner_expenses_v1");
    return expenses ? JSON.parse(expenses) : [];
}

function saveExpenses(expenses) {
    localStorage.setItem("planner_expenses_v1", JSON.stringify(expenses));
}

function renderExpenses() {
    const list = document.getElementById("expenseList");
    list.innerHTML = "";
    const expenses = getStoredExpenses();
    let total = 0;

    expenses.forEach((item, index) => {
        total += parseFloat(item.amount) || 0;
        const li = document.createElement("li");

        const infoDiv = document.createElement("div");
        infoDiv.className = "task-info";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = item.title;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const tag = document.createElement("span");
        tag.className = "tag-badge";
        tag.style.backgroundColor = "#f1f5f9";
        tag.style.color = "#64748b";
        tag.textContent = item.category;
        meta.appendChild(tag);

        infoDiv.appendChild(title);
        infoDiv.appendChild(meta);

        const rightDiv = document.createElement("div");
        rightDiv.style.display = "flex";
        rightDiv.style.alignItems = "center";

        const amountSpan = document.createElement("span");
        amountSpan.className = "expense-amount";
        amountSpan.textContent = `- RM ${parseFloat(item.amount).toFixed(2)}`;

        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.innerHTML = "&times;";
        delBtn.onclick = () => deleteExpense(index);

        rightDiv.appendChild(amountSpan);
        rightDiv.appendChild(delBtn);

        li.appendChild(infoDiv);
        li.appendChild(rightDiv);
        list.appendChild(li);
    });

    document.getElementById("totalExpenseDisplay").textContent = `Total Spent: RM ${total.toFixed(2)}`;
}

function addExpense() {
    const titleInput = document.getElementById("expenseTitleInput");
    const categoryInput = document.getElementById("expenseCategoryInput");
    const amountInput = document.getElementById("expenseAmountInput");

    const title = titleInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!title || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid expense description and amount!");
        return;
    }

    const expenses = getStoredExpenses();
    expenses.unshift({ title, category: categoryInput.value, amount });
    saveExpenses(expenses);
    titleInput.value = "";
    amountInput.value = "";
    renderExpenses();
}

function deleteExpense(index) {
    const expenses = getStoredExpenses();
    expenses.splice(index, 1);
    saveExpenses(expenses);
    renderExpenses();
}
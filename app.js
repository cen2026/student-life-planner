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
    ],
    weeklyTimetable: []
};

let calDate = new Date();
let activeLoggingClass = null;

document.addEventListener("DOMContentLoaded", () => {
    loadSemesterConfig();
    populateCourseDropdowns();
    renderStudyHub();
    renderAssignments();
    renderCalendar();
    renderExpenses();
});

/* ================= 选项卡切换 ================= */
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const tabMap = {
        'study-hub': 0,
        'assignments': 1,
        'calendar': 2,
        'expenses': 3
    };

    document.querySelectorAll('.tab-btn')[tabMap[tabName]].classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'calendar') renderCalendar();
    if (tabName === 'study-hub') renderStudyHub();
}

function renderStudyHub() {
    renderTodayClasses();
    renderStudyDebts();
    renderLectureNotes();
}

/* ================= ⚙️ 学期与课表配置 ================= */
function getConfig() {
    let cfg = localStorage.getItem("planner_semester_cfg_v2");
    return cfg ? JSON.parse(cfg) : DEFAULT_CONFIG;
}
function saveConfig(cfg) {
    localStorage.setItem("planner_semester_cfg_v2", JSON.stringify(cfg));
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
    renderWeeklyRoutineList();
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

function addWeeklyClass() {
    const day = document.getElementById("ttDaySelect").value;
    const course = document.getElementById("ttCourseSelect").value;
    const time = document.getElementById("ttTimeInput").value.trim();
    const room = document.getElementById("ttRoomInput").value.trim();

    if (!course || !time) {
        alert("Please select a course and enter time!");
        return;
    }

    const cfg = getConfig();
    if (!cfg.weeklyTimetable) cfg.weeklyTimetable = [];
    cfg.weeklyTimetable.push({
        id: "tt_" + Date.now(),
        day, course, time, room
    });

    saveConfig(cfg);
    document.getElementById("ttTimeInput").value = "";
    document.getElementById("ttRoomInput").value = "";
    renderWeeklyRoutineList();
    renderTodayClasses();
}

function deleteWeeklyClass(idx) {
    const cfg = getConfig();
    cfg.weeklyTimetable.splice(idx, 1);
    saveConfig(cfg);
    renderWeeklyRoutineList();
    renderTodayClasses();
}

function renderWeeklyRoutineList() {
    const cfg = getConfig();
    const container = document.getElementById("weeklyClassList");
    container.innerHTML = "";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    (cfg.weeklyTimetable || []).forEach((c, idx) => {
        const item = document.createElement("div");
        item.className = "routine-item";
        item.innerHTML = `
            <span><strong>${dayNames[c.day]}</strong> | ${c.course} (${c.time}${c.room ? ' - ' + c.room : ''})</span>
            <span class="chip-del" onclick="deleteWeeklyClass(${idx})">&times;</span>
        `;
        container.appendChild(item);
    });
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
    populateCourseDropdowns();
    renderStudyHub();
    renderAssignments();
    renderCalendar();
}

function populateCourseDropdowns() {
    const cfg = getConfig();
    const selects = ["assignSubjectSelect", "replaceCourseSelect", "ttCourseSelect", "manualDebtSubjectSelect"];

    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = "";
            cfg.courses.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.name;
                opt.textContent = c.name;
                el.appendChild(opt);
            });
        }
    });

    const filterSelects = ["assignFilterSelect", "notesFilterSelect"];
    filterSelects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<option value="ALL">All Subjects</option>';
            cfg.courses.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.name;
                opt.textContent = c.name;
                el.appendChild(opt);
            });
        }
    });
}

/* ================= 1. 今日课程与灵活调整 ================= */
function getOverrides() {
    let ov = localStorage.getItem("planner_class_overrides");
    return ov ? JSON.parse(ov) : { cancelled: [], replacements: [] };
}
function saveOverrides(ov) {
    localStorage.setItem("planner_class_overrides", JSON.stringify(ov));
}

function renderTodayClasses() {
    const list = document.getElementById("todayClassesList");
    list.innerHTML = "";
    const cfg = getConfig();
    const ov = getOverrides();

    const today = new Date();
    const dayOfWeek = String(today.getDay());
    const todayStr = today.toISOString().split('T')[0];

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    document.getElementById("todayHeading").textContent = `Today's Classes (${dayNames[today.getDay()]}, ${todayStr})`;

    const regularClasses = (cfg.weeklyTimetable || []).filter(c => c.day === dayOfWeek);
    const todaysReplacements = (ov.replacements || []).filter(r => r.date === todayStr);

    if (regularClasses.length === 0 && todaysReplacements.length === 0) {
        list.innerHTML = '<div style="font-size:12px; color:#64748b; padding:8px 0;">🎉 No classes scheduled for today! Great time to clear study debts.</div>';
        return;
    }

    regularClasses.forEach(c => {
        const isCancelled = (ov.cancelled || []).includes(`${todayStr}_${c.id}`);
        const card = document.createElement("div");
        card.className = `class-card ${isCancelled ? 'cancelled' : ''}`;
        const matchedCourse = cfg.courses.find(x => x.name === c.course) || { color: "#64748b", bg: "#f1f5f9" };

        card.innerHTML = `
            <div class="class-details">
                <div class="class-title">${c.course} ${isCancelled ? '<span style="color:#ef4444; font-size:11px;">(Cancelled)</span>' : ''}</div>
                <div class="class-meta">
                    <span class="tag-badge" style="background:${matchedCourse.bg}; color:${matchedCourse.color};">${c.time}</span>
                    <span>📍 ${c.room || 'TBA'}</span>
                </div>
            </div>
            <div class="class-actions">
                ${!isCancelled ? `<button class="btn-sm" onclick="openNoteModal('${c.course}')">📝 Log Takeaway</button>` : ''}
                <button class="btn-sm btn-cancel" onclick="toggleCancelClass('${todayStr}_${c.id}')">
                    ${isCancelled ? 'Restore' : 'Cancel'}
                </button>
            </div>
        `;
        list.appendChild(card);
    });

    todaysReplacements.forEach((r, idx) => {
        const card = document.createElement("div");
        card.className = "class-card replacement";
        const matchedCourse = cfg.courses.find(x => x.name === r.course) || { color: "#64748b", bg: "#f1f5f9" };

        card.innerHTML = `
            <div class="class-details">
                <div class="class-title">⚡ [Replacement] ${r.course}</div>
                <div class="class-meta">
                    <span class="tag-badge" style="background:${matchedCourse.bg}; color:${matchedCourse.color};">${r.time}</span>
                    <span>📍 ${r.room || 'TBA'}</span>
                </div>
            </div>
            <div class="class-actions">
                <button class="btn-sm" onclick="openNoteModal('${r.course}')">📝 Log Takeaway</button>
                <button class="btn-sm btn-cancel" onclick="deleteReplacement(${idx})">&times;</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function toggleCancelClass(cancelKey) {
    const ov = getOverrides();
    if (!ov.cancelled) ov.cancelled = [];
    if (ov.cancelled.includes(cancelKey)) {
        ov.cancelled = ov.cancelled.filter(k => k !== cancelKey);
    } else {
        ov.cancelled.push(cancelKey);
    }
    saveOverrides(ov);
    renderTodayClasses();
}

function openReplacementModal() {
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById("replaceDateInput").value = todayStr;
    document.getElementById("replacementModal").style.display = "flex";
}
function closeReplacementModal() {
    document.getElementById("replacementModal").style.display = "none";
}
function saveReplacementClass() {
    const course = document.getElementById("replaceCourseSelect").value;
    const date = document.getElementById("replaceDateInput").value;
    const time = document.getElementById("replaceTimeInput").value.trim();
    const room = document.getElementById("replaceRoomInput").value.trim();

    if (!date || !time) {
        alert("Please fill in date and time!");
        return;
    }
    const ov = getOverrides();
    if (!ov.replacements) ov.replacements = [];
    ov.replacements.push({ course, date, time, room });
    saveOverrides(ov);

    document.getElementById("replaceTimeInput").value = "";
    document.getElementById("replaceRoomInput").value = "";
    closeReplacementModal();
    renderTodayClasses();
}
function deleteReplacement(idx) {
    const ov = getOverrides();
    ov.replacements.splice(idx, 1);
    saveOverrides(ov);
    renderTodayClasses();
}

/* ================= 2. 课堂笔记与课后债务核心联动 ================= */
function getLectureNotes() {
    let notes = localStorage.getItem("planner_lecture_notes_v2");
    return notes ? JSON.parse(notes) : [];
}
function saveLectureNotes(notes) {
    localStorage.setItem("planner_lecture_notes_v2", JSON.stringify(notes));
}

function calculateDaysDiff(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function openNoteModal(courseName) {
    activeLoggingClass = courseName;
    document.getElementById("logNoteModalTitle").textContent = `📝 Log Takeaway: ${courseName}`;
    document.getElementById("noteTopicInput").value = "";
    document.getElementById("noteContentInput").value = "";
    document.getElementById("noteCreateDebtCheckbox").checked = false;
    document.getElementById("logNoteModal").style.display = "flex";
}
function closeNoteModal() {
    document.getElementById("logNoteModal").style.display = "none";
    activeLoggingClass = null;
}

function saveLectureNote() {
    const topic = document.getElementById("noteTopicInput").value.trim();
    const content = document.getElementById("noteContentInput").value.trim();
    const needsDebt = document.getElementById("noteCreateDebtCheckbox").checked;

    if (!topic || !content) {
        alert("Please enter a topic and takeaway notes!");
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const notes = getLectureNotes();
    notes.unshift({
        id: "note_" + Date.now(),
        course: activeLoggingClass,
        date: todayStr,
        topic,
        content,
        hasDebt: needsDebt,
        debtResolved: false,
        resolvedDate: null
    });

    saveLectureNotes(notes);
    closeNoteModal();
    renderStudyHub();
}

function toggleDebtResolved(noteId) {
    const notes = getLectureNotes();
    const target = notes.find(n => n.id === noteId);
    if (target) {
        target.debtResolved = !target.debtResolved;
        target.resolvedDate = target.debtResolved ? new Date().toISOString().split('T')[0] : null;
        saveLectureNotes(notes);
        renderStudyHub();
    }
}

function deleteLectureNote(idx) {
    const notes = getLectureNotes();
    notes.splice(idx, 1);
    saveLectureNotes(notes);
    renderStudyHub();
}

/* 手动录入额外债务 (Manual Debt) */
function toggleManualDebtForm() {
    const box = document.getElementById("manualDebtBox");
    box.style.display = box.style.display === "none" ? "block" : "none";
}

function addManualStudyDebt() {
    const text = document.getElementById("manualDebtInput").value.trim();
    const course = document.getElementById("manualDebtSubjectSelect").value;
    const date = document.getElementById("manualDebtDateInput").value;

    if (!text) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const notes = getLectureNotes();
    notes.unshift({
        id: "note_" + Date.now(),
        course,
        date: date || todayStr,
        topic: text,
        content: "Manual study debt / assignment follow-up.",
        hasDebt: true,
        debtResolved: false,
        resolvedDate: null
    });

    saveLectureNotes(notes);
    document.getElementById("manualDebtInput").value = "";
    document.getElementById("manualDebtDateInput").value = "";
    toggleManualDebtForm();
    renderStudyHub();
}

/* 渲染中部债务列表 (Active Debts) */
function renderStudyDebts() {
    const list = document.getElementById("studyDebtList");
    list.innerHTML = "";
    const notes = getLectureNotes();
    const cfg = getConfig();
    const todayStr = new Date().toISOString().split('T')[0];

    // 只筛选带有债务的条目
    const debtItems = notes.filter(n => n.hasDebt);

    if (debtItems.length === 0) {
        list.innerHTML = '<li style="color:#64748b; font-size:12px; padding:10px;">✨ No pending study debts! You are all caught up.</li>';
        return;
    }

    // 智能排序：未解决的排前，且拖延时间最久的置顶
    debtItems.sort((a, b) => {
        if (a.debtResolved !== b.debtResolved) return a.debtResolved ? 1 : -1;
        const delayA = calculateDaysDiff(a.date, todayStr);
        const delayB = calculateDaysDiff(b.date, todayStr);
        return delayB - delayA;
    });

    debtItems.forEach(item => {
        const li = document.createElement("li");
        const delayDays = calculateDaysDiff(item.date, item.debtResolved ? (item.resolvedDate || todayStr) : todayStr);

        if (!item.debtResolved && delayDays > 0) {
            li.className = delayDays >= 4 ? "status-overdue" : "status-freeze";
        }
        if (item.debtResolved) li.classList.add("completed");

        const leftDiv = document.createElement("div");
        leftDiv.className = "task-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.debtResolved;
        checkbox.onchange = () => toggleDebtResolved(item.id);

        const infoDiv = document.createElement("div");
        infoDiv.className = "task-info";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = `${item.topic}`;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const matchedCourse = cfg.courses.find(c => c.name === item.course) || { color: "#64748b", bg: "#f1f5f9" };
        const tag = document.createElement("span");
        tag.className = "tag-badge";
        tag.style.color = matchedCourse.color;
        tag.style.backgroundColor = matchedCourse.bg;
        tag.textContent = item.course;
        meta.appendChild(tag);

        const dateBadge = document.createElement("span");
        dateBadge.className = "date-badge";
        dateBadge.textContent = `Occurred: ${item.date}`;
        meta.appendChild(dateBadge);

        const delayBadge = document.createElement("span");
        if (item.debtResolved) {
            delayBadge.className = "delay-badge delay-completed";
            delayBadge.textContent = delayDays > 0 ? `✓ 迟了 ${delayDays} 天补完` : "✓ 准时补完";
        } else {
            if (delayDays > 0) {
                delayBadge.className = `delay-badge ${delayDays >= 4 ? 'delay-severe' : 'delay-mild'}`;
                delayBadge.textContent = `⏳ 拖欠了 ${delayDays} 天`;
            } else {
                delayBadge.className = "delay-badge delay-mild";
                delayBadge.textContent = "⚡ 今天刚发生";
            }
        }
        meta.appendChild(delayBadge);

        infoDiv.appendChild(title);
        infoDiv.appendChild(meta);
        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(infoDiv);

        li.appendChild(leftDiv);
        list.appendChild(li);
    });
}

/* 渲染底部知识点归档库 (Lecture Knowledge Base) */
function renderLectureNotes() {
    const list = document.getElementById("lectureNotesList");
    list.innerHTML = "";
    const notes = getLectureNotes();
    const filter = document.getElementById("notesFilterSelect").value;
    const cfg = getConfig();

    if (notes.length === 0) {
        list.innerHTML = '<li style="color:#64748b; font-size:12px; padding:10px;">📖 No lecture takeaways logged yet.</li>';
        return;
    }

    notes.forEach((n, idx) => {
        if (filter !== "ALL" && n.course !== filter) return;

        const matchedCourse = cfg.courses.find(x => x.name === n.course) || { color: "#64748b", bg: "#f1f5f9" };
        const li = document.createElement("li");
        li.className = "note-item";
        li.innerHTML = `
            <div class="note-header">
                <div>
                    <span class="tag-badge" style="background:${matchedCourse.bg}; color:${matchedCourse.color};">${n.course}</span>
                    <span class="note-title" style="margin-left:6px;">${n.topic}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:11px; color:#64748b;">${n.date}</span>
                    <button class="delete-btn" onclick="deleteLectureNote(${idx})">&times;</button>
                </div>
            </div>
            <div class="note-body">${n.content}</div>
        `;
        list.appendChild(li);
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

    const cfg = getConfig();
    const assigns = getStoredAssignments();
    const eventMap = {}; // 空字典，用于按日期聚集事件

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

    for (let i = 0; i < firstDayIndex; i++) {
        const cell = document.createElement("div");
        cell.className = "cal-day empty";
        grid.appendChild(cell);
    }

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

function exportToICS() {
    const cfg = getConfig();
    const assigns = getStoredAssignments();

    let icsContent = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Academic Sprint Planner//EN"];
    const formatDateICS = (dStr) => dStr.replace(/-/g, "") + "T090000Z";

    const addVEvent = (title, dStr, desc) => {
        if (!dStr) return;
        const dt = formatDateICS(dStr);
        icsContent.push("BEGIN:VEVENT", `SUMMARY:${title}`, `DESCRIPTION:${desc}`, `DTSTART:${dt}`, `DTEND:${dt}`, "STATUS:CONFIRMED", "END:VEVENT");
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
    if (!list) return;
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

    const display = document.getElementById("totalExpenseDisplay");
    if (display) display.textContent = `Total Spent: RM ${total.toFixed(2)}`;
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
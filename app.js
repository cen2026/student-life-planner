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

// ================= 全局状态管理变量 =================
let calDate = new Date();
let currentBaseWeekDate = new Date();
let selectedDateStr = getLocalDateString(new Date());
let activeLoggingClass = null;
let activeLoggingDate = null;
let editingWeeklyClassIndex = null; // 必须是全局变量，null 表示当前处于新增模式

function getLocalDateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
    renderWeeklyBoard();
    if (selectedDateStr) {
        renderSelectedDayClasses();
    }
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
    cancelEditWeeklyClass();
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

/* ================= 课表排课添加与编辑更新 ================= */
function submitWeeklyClass() {
    const day = document.getElementById("ttDaySelect").value;
    const course = document.getElementById("ttCourseSelect").value;
    const type = document.getElementById("ttTypeSelect").value;
    const startTime = document.getElementById("ttStartTimeInput").value;
    const endTime = document.getElementById("ttEndTimeInput").value;

    if (!course || !startTime || !endTime) {
        alert("Please select a course, start time, and end time!");
        return;
    }

    if (startTime >= endTime) {
        alert("End time must be later than start time!");
        return;
    }

    const timeRange = `${startTime} - ${endTime}`;
    const cfg = getConfig();
    if (!cfg.weeklyTimetable) cfg.weeklyTimetable = [];

    if (editingWeeklyClassIndex !== null) {
        // 编辑更新分支
        const existingId = cfg.weeklyTimetable[editingWeeklyClassIndex].id || ("tt_" + Date.now());
        cfg.weeklyTimetable[editingWeeklyClassIndex] = {
            id: existingId,
            day,
            course,
            type: type || "Lecture",
            time: timeRange
        };
    } else {
        // 全新添加分支
        cfg.weeklyTimetable.push({
            id: "tt_" + Date.now(),
            day,
            course,
            type: type || "Lecture",
            time: timeRange
        });
    }

    // 重新按开始时间排序
    cfg.weeklyTimetable.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    saveConfig(cfg);
    cancelEditWeeklyClass(); // 重置输入框与按钮状态
    renderWeeklyRoutineList();
    renderStudyHub();
}

function deleteWeeklyClass(idx) {
    const cfg = getConfig();
    cfg.weeklyTimetable.splice(idx, 1);
    saveConfig(cfg);
    renderWeeklyRoutineList();
    renderStudyHub();
}

function renderWeeklyRoutineList() {
    const cfg = getConfig();
    const container = document.getElementById("weeklyClassList");
    if (!container) return;
    container.innerHTML = "";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    (cfg.weeklyTimetable || []).forEach((c, idx) => {
        const item = document.createElement("div");
        item.className = "routine-item";
        item.innerHTML = `
            <span><strong>${dayNames[c.day]}</strong> | ${c.course} <span style="color:var(--primary); font-weight:600;">[${c.type || 'Lecture'}]</span> <span style="color:#64748b;">(${c.time})</span></span>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="icon-btn" onclick="startEditWeeklyClass(${idx})" style="padding: 2px 6px; font-size: 12px; border:none; background:transparent; cursor:pointer;" title="Edit this class">✏️</button>
                <span class="chip-del" onclick="deleteWeeklyClass(${idx})">&times;</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function startEditWeeklyClass(idx) {
    const cfg = getConfig();
    const target = cfg.weeklyTimetable[idx];
    if (!target) return;

    editingWeeklyClassIndex = idx;

    // 回填输入框
    document.getElementById("ttDaySelect").value = target.day;
    document.getElementById("ttCourseSelect").value = target.course;
    document.getElementById("ttTypeSelect").value = target.type || "Lecture";

    const times = (target.time || "").split("-").map(t => t.trim());
    document.getElementById("ttStartTimeInput").value = times[0] || "";
    document.getElementById("ttEndTimeInput").value = times[1] || "";

    // 切换按钮外观
    const submitBtn = document.getElementById("ttSubmitBtn");
    const cancelBtn = document.getElementById("ttCancelEditBtn");
    if (submitBtn) {
        submitBtn.textContent = "Update Class";
        submitBtn.style.backgroundColor = "var(--primary)";
        submitBtn.style.color = "#ffffff";
    }
    if (cancelBtn) {
        cancelBtn.style.display = "inline-block";
    }
}

function cancelEditWeeklyClass() {
    editingWeeklyClassIndex = null;

    document.getElementById("ttStartTimeInput").value = "";
    document.getElementById("ttEndTimeInput").value = "";

    const submitBtn = document.getElementById("ttSubmitBtn");
    const cancelBtn = document.getElementById("ttCancelEditBtn");
    if (submitBtn) {
        submitBtn.textContent = "Add Class";
        submitBtn.style.backgroundColor = "";
        submitBtn.style.color = "";
    }
    if (cancelBtn) {
        cancelBtn.style.display = "none";
    }
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

/* ================= 1. 周导航与 6 列周看板渲染 ================= */
function getMondayOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

function changeWeek(deltaWeeks) {
    currentBaseWeekDate.setDate(currentBaseWeekDate.getDate() + deltaWeeks * 7);
    renderStudyHub();
}

function resetToCurrentWeek() {
    currentBaseWeekDate = new Date();
    selectedDateStr = getLocalDateString(new Date());
    renderStudyHub();
}

function getOverrides() {
    let ov = localStorage.getItem("planner_class_overrides");
    return ov ? JSON.parse(ov) : { cancelled: [], replacements: [] };
}
function saveOverrides(ov) {
    localStorage.setItem("planner_class_overrides", JSON.stringify(ov));
}

function renderWeeklyBoard() {
    const board = document.getElementById("weeklyBoard");
    if (!board) return;
    board.innerHTML = "";

    const monday = getMondayOfWeek(currentBaseWeekDate);
    const cfg = getConfig();
    const ov = getOverrides();
    const assigns = getStoredAssignments();
    const actualTodayStr = getLocalDateString(new Date());

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
    }

    const mStr1 = days[0].toLocaleString('en-US', { month: 'short' });
    const mStr2 = days[6].toLocaleString('en-US', { month: 'short' });
    const rangeText = mStr1 === mStr2
        ? `${mStr1} ${days[0].getDate()} - ${days[6].getDate()}, ${days[0].getFullYear()}`
        : `${mStr1} ${days[0].getDate()} - ${mStr2} ${days[6].getDate()}, ${days[0].getFullYear()}`;

    // 计算 Week X
    let weekPrefix = "";
    if (cfg.startDate) {
        const semStartMonday = getMondayOfWeek(new Date(cfg.startDate + "T00:00:00"));
        const currentMonday = getMondayOfWeek(monday);
        const diffWeeks = Math.floor((currentMonday - semStartMonday) / (7 * 24 * 60 * 60 * 1000)) + 1;
        if (diffWeeks > 0) {
            weekPrefix = `Week ${diffWeeks}: `;
        } else {
            weekPrefix = "Pre-Semester: ";
        }
    }
    document.getElementById("weekRangeDisplay").textContent = `${weekPrefix}${rangeText}`;

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const getItemsHtmlForDate = (dateObj, isWeekendHalf = false) => {
        const dStr = getLocalDateString(dateObj);
        const dayOfWeek = String(dateObj.getDay());
        const regulars = (cfg.weeklyTimetable || []).filter(c => c.day === dayOfWeek);
        const replacements = (ov.replacements || []).filter(r => r.date === dStr);

        let html = '<div class="day-pills-container">';
        let hasItem = false;

        // 1. 常规课胶囊
        regulars.forEach(c => {
            hasItem = true;
            const isCancelled = (ov.cancelled || []).includes(`${dStr}_${c.id}`);
            const match = cfg.courses.find(x => x.name === c.course) || { color: '#475569', bg: '#f1f5f9' };
            const typeBadge = c.type ? `[${c.type.substring(0, 4)}]` : '';

            html += `
                <div class="mini-class-pill ${isCancelled ? 'cancelled' : ''}" 
                     style="background-color: ${match.bg}; color: ${match.color};"
                     title="${c.course} (${c.type || 'Lecture'}) - ${c.time}">
                    <span style="font-size: 9px; opacity: 0.85;">${c.time}</span>
                    <span style="font-weight: 700;">${typeBadge} ${c.course}</span>
                </div>
            `;
        });

        // 2. 补课胶囊
        replacements.forEach(r => {
            hasItem = true;
            const match = cfg.courses.find(x => x.name === r.course) || { color: '#b45309', bg: '#fef3c7' };
            const typeBadge = r.type ? `[${r.type.substring(0, 4)}]` : '';

            html += `
                <div class="mini-class-pill replacement" 
                     style="background-color: ${match.bg}; color: ${match.color};"
                     title="[Replacement] ${r.course} (${r.type || 'Lecture'}) - ${r.time}">
                    <span style="font-size: 9px; opacity: 0.85;">⚡ ${r.time}</span>
                    <span style="font-weight: 700;">${typeBadge} ${r.course}</span>
                </div>
            `;
        });

        // 3. 作业与死线胶囊
        assigns.forEach(a => {
            if (a.completed) return;
            if (a.hardDate === dStr) {
                hasItem = true;
                html += `<div class="mini-deadline-pill mini-deadline-hard" title="Hard Due: ${a.text}">🚨 ${a.text}</div>`;
            } else if (a.targetDate === dStr) {
                hasItem = true;
                html += `<div class="mini-deadline-pill mini-deadline-freeze" title="Target Freeze: ${a.text}">🎯 ${a.text}</div>`;
            }
        });

        if (!hasItem) {
            html += `<div class="empty-day-hint">${isWeekendHalf ? 'Off' : 'No classes'}</div>`;
        }

        html += '</div>';
        return html;
    };

    // 渲染 Mon ~ Fri
    for (let i = 0; i < 5; i++) {
        const d = days[i];
        const dStr = getLocalDateString(d);
        const isSelected = dStr === selectedDateStr;
        const isToday = dStr === actualTodayStr;

        // 获取这一天的累计专注分钟数
        const focusMins = getFocusMinutesByDate(dStr);
        const focusBadgeHtml = focusMins > 0
            ? `<span class="col-focus-badge">🔥 ${focusMins >= 60 ? Math.floor(focusMins / 60) + 'h ' + (focusMins % 60) + 'm' : focusMins + 'm'}</span>`
            : '';

        const col = document.createElement("div");
        col.className = `week-col-day ${isSelected ? 'selected' : ''} ${isToday ? 'today-marker' : ''}`;
        col.onclick = () => selectDay(dStr);

        col.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div class="day-name">${dayLabels[i]}</div>
                    <div class="day-number">${d.getDate()}</div>
                </div>
                ${focusBadgeHtml}
            </div>
            ${getItemsHtmlForDate(d, false)}
        `;
        board.appendChild(col);
    }

    // 渲染 Sat / Sun 垂直切半
    const weekendCol = document.createElement("div");
    weekendCol.className = "week-col-weekend";

    [5, 6].forEach(idx => {
        const d = days[idx];
        const dStr = getLocalDateString(d);
        const isSelected = dStr === selectedDateStr;
        const isToday = dStr === actualTodayStr;

        const focusMins = getFocusMinutesByDate(dStr);
        const focusBadgeHtml = focusMins > 0
            ? `<span class="col-focus-badge" style="font-size: 9px; padding: 1px 4px;">🔥 ${focusMins >= 60 ? Math.floor(focusMins / 60) + 'h ' + (focusMins % 60) + 'm' : focusMins + 'm'}</span>`
            : '';

        const subDay = document.createElement("div");
        subDay.className = `weekend-sub-day ${isSelected ? 'selected' : ''} ${isToday ? 'today-marker' : ''}`;
        subDay.onclick = () => selectDay(dStr);

        subDay.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="day-name">${dayLabels[idx]}</span>
                <div style="display: flex; align-items: center; gap: 4px;">
                    ${focusBadgeHtml}
                    <span class="day-number" style="font-size:11px;">${d.getDate()}</span>
                </div>
            </div>
            ${getItemsHtmlForDate(d, true)}
        `;
        weekendCol.appendChild(subDay);
    });
    board.appendChild(weekendCol);
}

function selectDay(dStr) {
    selectedDateStr = dStr;
    renderWeeklyBoard();
    renderSelectedDayClasses();

    const drawer = document.getElementById("dayDetailContainer");
    if (drawer) {
        drawer.style.display = "block";
        drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function closeDayDetail() {
    const drawer = document.getElementById("dayDetailContainer");
    if (drawer) {
        drawer.style.display = "none";
    }
    selectedDateStr = null;
    renderWeeklyBoard();
}

/* ================= 2. 选定日期的课程列表 ================= */
function renderSelectedDayClasses() {
    const list = document.getElementById("todayClassesList");
    if (!list) return;
    list.innerHTML = "";

    const cfg = getConfig();
    const ov = getOverrides();
    const dateObj = new Date(selectedDateStr + "T00:00:00");
    const dayOfWeek = String(dateObj.getDay());
    const actualTodayStr = getLocalDateString(new Date());

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const isToday = selectedDateStr === actualTodayStr;

    document.getElementById("selectedDayHeading").textContent = `${dayNames[dateObj.getDay()]}, ${selectedDateStr}${isToday ? ' (Today)' : ''}`;

    const regularClasses = (cfg.weeklyTimetable || []).filter(c => c.day === dayOfWeek);
    const selectedReplacements = (ov.replacements || []).filter(r => r.date === selectedDateStr);

    if (regularClasses.length === 0 && selectedReplacements.length === 0) {
        list.innerHTML = `<div style="font-size:12px; color:#64748b; padding:8px 0;">🎉 No classes scheduled for this day!</div>`;
        return;
    }

    regularClasses.forEach(c => {
        const isCancelled = (ov.cancelled || []).includes(`${selectedDateStr}_${c.id}`);
        const card = document.createElement("div");
        card.className = `class-card ${isCancelled ? 'cancelled' : ''}`;
        const matchedCourse = cfg.courses.find(x => x.name === c.course) || { color: "#64748b", bg: "#f1f5f9" };

        card.innerHTML = `
            <div class="class-details">
                <div class="class-title">${c.course} <span style="font-size:11px; color:var(--primary); font-weight:600;">[${c.type || 'Lecture'}]</span> ${isCancelled ? '<span style="color:#ef4444; font-size:11px;">(Cancelled)</span>' : ''}</div>
                <div class="class-meta">
                    <span class="tag-badge" style="background:${matchedCourse.bg}; color:${matchedCourse.color}; font-weight:700;">🕒 ${c.time}</span>
                </div>
            </div>
            <div class="class-actions">
                ${!isCancelled ? `<button class="btn-sm" onclick="openNoteModal('${c.course}', '${selectedDateStr}')">📝 Log Takeaway</button>` : ''}
                <button class="btn-sm btn-cancel" onclick="toggleCancelClass('${selectedDateStr}_${c.id}')">
                    ${isCancelled ? 'Restore' : 'Cancel'}
                </button>
            </div>
        `;
        list.appendChild(card);
    });

    selectedReplacements.forEach((r, idx) => {
        const card = document.createElement("div");
        card.className = "class-card replacement";
        const matchedCourse = cfg.courses.find(x => x.name === r.course) || { color: "#64748b", bg: "#f1f5f9" };

        card.innerHTML = `
            <div class="class-details">
                <div class="class-title">⚡ [Replacement] ${r.course} <span style="font-size:11px; color:var(--primary); font-weight:600;">[${r.type || 'Lecture'}]</span></div>
                <div class="class-meta">
                    <span class="tag-badge" style="background:${matchedCourse.bg}; color:${matchedCourse.color}; font-weight:700;">🕒 ${r.time}</span>
                </div>
            </div>
            <div class="class-actions">
                <button class="btn-sm" onclick="openNoteModal('${r.course}', '${selectedDateStr}')">📝 Log Takeaway</button>
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
    renderStudyHub();
}

function openReplacementModal() {
    document.getElementById("replaceDateInput").value = selectedDateStr || getLocalDateString(new Date());
    document.getElementById("replacementModal").style.display = "flex";
}

function closeReplacementModal() {
    document.getElementById("replacementModal").style.display = "none";
}

function saveReplacementClass() {
    const course = document.getElementById("replaceCourseSelect").value;
    const type = document.getElementById("replaceTypeSelect").value;
    const date = document.getElementById("replaceDateInput").value;
    const startTime = document.getElementById("replaceStartTimeInput").value;
    const endTime = document.getElementById("replaceEndTimeInput").value;

    if (!date || !startTime || !endTime) {
        alert("Please select date, start time, and end time!");
        return;
    }

    if (startTime >= endTime) {
        alert("End time must be later than start time!");
        return;
    }

    const timeRange = `${startTime} - ${endTime}`;

    const ov = getOverrides();
    if (!ov.replacements) ov.replacements = [];
    ov.replacements.push({
        course,
        type: type || "Lecture",
        date,
        time: timeRange
    });
    saveOverrides(ov);

    document.getElementById("replaceStartTimeInput").value = "";
    document.getElementById("replaceEndTimeInput").value = "";
    closeReplacementModal();
    renderStudyHub();
}

function deleteReplacement(idx) {
    const ov = getOverrides();
    ov.replacements.splice(idx, 1);
    saveOverrides(ov);
    renderStudyHub();
}

/* ================= 3. 笔记与课业负债数据隔离 ================= */
function getLectureNotes() {
    let notes = localStorage.getItem("planner_lecture_notes_v3");
    return notes ? JSON.parse(notes) : [];
}
function saveLectureNotes(notes) {
    localStorage.setItem("planner_lecture_notes_v3", JSON.stringify(notes));
}

function getStudyDebts() {
    let debts = localStorage.getItem("planner_study_debts_v3");
    return debts ? JSON.parse(debts) : [];
}
function saveStudyDebts(debts) {
    localStorage.setItem("planner_study_debts_v3", JSON.stringify(debts));
}

function calculateDaysDiff(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function openNoteModal(courseName, dateStr) {
    activeLoggingClass = courseName;
    activeLoggingDate = dateStr || selectedDateStr;
    document.getElementById("logNoteModalTitle").textContent = `📝 Log Takeaway: ${courseName} (${activeLoggingDate})`;
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

    const targetDate = activeLoggingDate || selectedDateStr;

    // 1. 存入笔记知识库
    const notes = getLectureNotes();
    notes.unshift({
        id: "note_" + Date.now(),
        course: activeLoggingClass,
        date: targetDate,
        topic,
        content
    });
    saveLectureNotes(notes);

    // 2. 勾选后派生到债务表
    if (needsDebt) {
        const debts = getStudyDebts();
        debts.unshift({
            id: "debt_" + Date.now(),
            course: activeLoggingClass,
            date: targetDate,
            topic: `[Review] ${topic}`,
            resolved: false,
            resolvedDate: null
        });
        saveStudyDebts(debts);
    }

    closeNoteModal();
    renderStudyHub();
}

function toggleManualDebtForm() {
    const box = document.getElementById("manualDebtBox");
    box.style.display = box.style.display === "none" ? "block" : "none";
}

function addManualStudyDebt() {
    const text = document.getElementById("manualDebtInput").value.trim();
    const course = document.getElementById("manualDebtSubjectSelect").value;
    const date = document.getElementById("manualDebtDateInput").value;

    if (!text) return;
    const todayStr = getLocalDateString(new Date());

    const debts = getStudyDebts();
    debts.unshift({
        id: "debt_" + Date.now(),
        course,
        date: date || todayStr,
        topic: text,
        resolved: false,
        resolvedDate: null
    });
    saveStudyDebts(debts);

    document.getElementById("manualDebtInput").value = "";
    document.getElementById("manualDebtDateInput").value = "";
    toggleManualDebtForm();
    renderStudyDebts();
}

function toggleDebtResolved(debtId) {
    const debts = getStudyDebts();
    const target = debts.find(d => d.id === debtId);
    if (target) {
        target.resolved = !target.resolved;
        target.resolvedDate = target.resolved ? getLocalDateString(new Date()) : null;
        saveStudyDebts(debts);
        renderStudyDebts();
    }
}

function deleteStudyDebt(debtId) {
    let debts = getStudyDebts();
    debts = debts.filter(d => d.id !== debtId);
    saveStudyDebts(debts);
    renderStudyDebts();
}

function renderStudyDebts() {
    const list = document.getElementById("studyDebtList");
    const badge = document.getElementById("debtSummaryBadge");
    if (!list) return;
    list.innerHTML = "";
    const debts = getStudyDebts();
    const cfg = getConfig();
    const todayStr = getLocalDateString(new Date());

    const pendingDebts = debts.filter(d => !d.resolved);
    if (badge) {
        const count = pendingDebts.length;
        badge.textContent = count === 0 ? "✨ 0 Pending" : `🚨 ${count} Pending`;
        badge.classList.toggle("zero", count === 0);
    }

    if (debts.length === 0) {
        list.innerHTML = '<li style="color:#64748b; font-size:12px; padding:10px;">✨ No pending study debts! You are all caught up.</li>';
        return;
    }

    debts.sort((a, b) => {
        if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
        const delayA = calculateDaysDiff(a.date, todayStr);
        const delayB = calculateDaysDiff(b.date, todayStr);
        return delayB - delayA;
    });

    debts.forEach(item => {
        const li = document.createElement("li");
        const delayDays = calculateDaysDiff(item.date, item.resolved ? (item.resolvedDate || todayStr) : todayStr);

        if (!item.resolved && delayDays > 0) {
            li.className = delayDays >= 4 ? "status-overdue" : "status-freeze";
        }
        if (item.resolved) li.classList.add("completed");

        const leftDiv = document.createElement("div");
        leftDiv.className = "task-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.resolved;
        checkbox.onchange = () => toggleDebtResolved(item.id);

        const infoDiv = document.createElement("div");
        infoDiv.className = "task-info";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = item.topic;

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
        if (item.resolved) {
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

        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.innerHTML = "&times;";
        delBtn.onclick = () => deleteStudyDebt(item.id);

        li.appendChild(leftDiv);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function toggleAllDebtsModal() {
    const drawer = document.getElementById("dayDetailContainer");
    if (drawer) {
        drawer.style.display = "block";
        const debtSection = document.getElementById("studyDebtList");
        if (debtSection) {
            debtSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function deleteLectureNoteById(noteId) {
    let notes = getLectureNotes();
    notes = notes.filter(n => n.id !== noteId);
    saveLectureNotes(notes);
    renderLectureNotes();
}

function renderLectureNotes() {
    const list = document.getElementById("lectureNotesList");
    if (!list) return;
    list.innerHTML = "";
    const notes = getLectureNotes();
    const filter = document.getElementById("notesFilterSelect").value;
    const cfg = getConfig();

    if (notes.length === 0) {
        list.innerHTML = '<li style="color:#64748b; font-size:12px; padding:10px;">📖 No lecture takeaways logged yet.</li>';
        return;
    }

    notes.forEach(n => {
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
                    <button class="delete-btn" onclick="deleteLectureNoteById('${n.id}')">&times;</button>
                </div>
            </div>
            <div class="note-body">${n.content}</div>
        `;
        list.appendChild(li);
    });
}

/* ================= 4. 🎯 Assignments ================= */
function getStoredAssignments() {
    let data = localStorage.getItem("planner_assign_v1");
    return data ? JSON.parse(data) : [];
}
function saveAssignments(data) {
    localStorage.setItem("planner_assign_v1", JSON.stringify(data));
}

function renderAssignments() {
    const list = document.getElementById("assignmentList");
    if (!list) return;
    list.innerHTML = "";
    const items = getStoredAssignments();
    const cfg = getConfig();
    const filter = document.getElementById("assignFilterSelect").value;
    const todayStr = getLocalDateString(new Date());

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

/* ================= 5. 📅 日历 ================= */
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
    const todayStr = getLocalDateString(new Date());

    const cfg = getConfig();
    const assigns = getStoredAssignments();
    const eventMap = {};

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

/* ================= 6. 💰 Expenses ================= */
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

/* ================= ⏱️ 专注计时器功能逻辑 ================= */
let timerInterval = null;
let timerMode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'stopwatch'
let timerSecondsLeft = 25 * 60;
let stopwatchSeconds = 0;
let isTimerRunning = false;

function toggleTimerPanel() {
    const card = document.getElementById("timerCard");
    const pill = document.getElementById("timerPill");
    const isShowing = card.style.display !== "none";
    card.style.display = isShowing ? "none" : "flex";
    pill.style.display = isShowing ? "flex" : "none";
}

function formatTimerTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const timeText = timerMode === 'stopwatch'
        ? formatTimerTime(stopwatchSeconds)
        : formatTimerTime(timerSecondsLeft);

    document.getElementById("timerBigDisplay").textContent = timeText;
    document.getElementById("timerPillDisplay").textContent = timeText;

    const pill = document.getElementById("timerPill");
    if (isTimerRunning) {
        pill.classList.add("running");
    } else {
        pill.classList.remove("running");
    }
}

function setTimerMode(mode) {
    if (isTimerRunning) toggleTimerStart(); // 切换模式时自动先暂停
    timerMode = mode;

    document.querySelectorAll('.timer-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(mode));
    });

    const statusLabel = document.getElementById("timerStatusLabel");
    if (mode === 'pomodoro') {
        timerSecondsLeft = 25 * 60;
        statusLabel.textContent = "Focus Sprint (25m)";
    } else if (mode === 'shortBreak') {
        timerSecondsLeft = 5 * 60;
        statusLabel.textContent = "Short Break (5m)";
    } else if (mode === 'stopwatch') {
        stopwatchSeconds = 0;
        statusLabel.textContent = "Free Flow Focus";
    }

    updateTimerDisplay();
}

function toggleTimerStart() {
    const btn = document.getElementById("timerToggleBtn");
    const statusLabel = document.getElementById("timerStatusLabel");

    if (isTimerRunning) {
        // 暂停计时
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.textContent = "Start";
        btn.style.backgroundColor = "var(--primary)";
        statusLabel.textContent = "Paused";
    } else {
        // 开始计时
        isTimerRunning = true;
        btn.textContent = "Pause";
        btn.style.backgroundColor = "#e11d48"; // 运行中高亮提示
        statusLabel.textContent = timerMode === 'shortBreak' ? "Resting..." : "Focusing...";

        timerInterval = setInterval(() => {
            if (timerMode === 'stopwatch') {
                stopwatchSeconds++;
                updateTimerDisplay();
            } else {
                if (timerSecondsLeft > 0) {
                    timerSecondsLeft--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    btn.textContent = "Start";
                    btn.style.backgroundColor = "var(--primary)";
                    alert("🎉 Sprint session completed!");
                    resetTimer();
                }
            }
        }, 1000);
    }
    updateTimerDisplay();
}

function resetTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById("timerToggleBtn").textContent = "Start";
        document.getElementById("timerToggleBtn").style.backgroundColor = "var(--primary)";
    }

    if (timerMode === 'pomodoro') timerSecondsLeft = 25 * 60;
    else if (timerMode === 'shortBreak') timerSecondsLeft = 5 * 60;
    else if (timerMode === 'stopwatch') stopwatchSeconds = 0;

    document.getElementById("timerStatusLabel").textContent = "Ready to sprint";
    updateTimerDisplay();
}

// ================= 专注时长读取与记录工具 =================
function getFocusMinutesByDate(dateStr) {
    const key = `planner_focus_${dateStr}`;
    return parseInt(localStorage.getItem(key) || "0", 10);
}

function addFocusMinutes(mins, dateStr = null) {
    if (mins <= 0) return;
    const targetDate = dateStr || getLocalDateString(new Date());
    const key = `planner_focus_${targetDate}`;
    const current = getFocusMinutesByDate(targetDate);
    localStorage.setItem(key, current + mins);
    renderWeeklyBoard(); // 记录后刷新看版
}
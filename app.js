document.addEventListener("DOMContentLoaded", () => {
    renderTasks();
    renderExpenses();
});

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tabName === 'tasks') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('tab-tasks').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('tab-expenses').classList.add('active');
    }
}

/* 待办任务逻辑 */
function getStoredTasks() {
    let tasks = localStorage.getItem("planner_tasks_v2");
    return tasks ? JSON.parse(tasks) : [];
}

function saveTasks(tasks) {
    localStorage.setItem("planner_tasks_v2", JSON.stringify(tasks));
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";
    const tasks = getStoredTasks();
    const filter = document.getElementById("filterSelect").value;
    const todayStr = new Date().toISOString().split('T')[0];

    tasks.forEach((task, index) => {
        if (filter !== "ALL" && task.subject !== filter) return;

        const li = document.createElement("li");
        const isOverdue = task.dueDate && task.dueDate < todayStr && !task.completed;
        if (isOverdue) li.classList.add("overdue");
        if (task.completed) li.classList.add("completed");

        const leftDiv = document.createElement("div");
        leftDiv.className = "task-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.onchange = () => toggleTask(index);

        const infoDiv = document.createElement("div");
        infoDiv.className = "task-info";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = task.text;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = task.subject;
        meta.appendChild(tag);

        if (task.dueDate) {
            const due = document.createElement("span");
            due.className = `due-text ${isOverdue ? 'is-overdue' : ''}`;
            due.textContent = isOverdue ? `Overdue: ${task.dueDate}` : `Due: ${task.dueDate}`;
            meta.appendChild(due);
        }

        infoDiv.appendChild(title);
        infoDiv.appendChild(meta);
        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(infoDiv);

        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.innerHTML = "&times;";
        delBtn.onclick = () => deleteTask(index);

        li.appendChild(leftDiv);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function addTask() {
    const taskInput = document.getElementById("taskInput");
    const subjectInput = document.getElementById("subjectInput");
    const dateInput = document.getElementById("dateInput");

    const text = taskInput.value.trim();
    if (!text) return;

    const tasks = getStoredTasks();
    tasks.push({
        text: text,
        subject: subjectInput.value,
        dueDate: dateInput.value,
        completed: false
    });

    tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
    });

    saveTasks(tasks);
    taskInput.value = "";
    dateInput.value = "";
    renderTasks();
}

function toggleTask(index) {
    const tasks = getStoredTasks();
    tasks[index].completed = !tasks[index].completed;
    saveTasks(tasks);
    renderTasks();
}

function deleteTask(index) {
    const tasks = getStoredTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
}

/* 记账逻辑 */
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
        tag.className = "tag";
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
    expenses.unshift({
        title: title,
        category: categoryInput.value,
        amount: amount
    });

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
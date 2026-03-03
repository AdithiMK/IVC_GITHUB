const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const clearAllBtn = document.getElementById('clearAllBtn');

const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const pendingCount = document.getElementById('pendingCount');
const overdueCount = document.getElementById('overdueCount');
const mediumCount = document.getElementById('mediumCount');

const categorySelect = document.getElementById('categorySelect');
const hoursInput = document.getElementById('hoursInput');
const minutesInput = document.getElementById('minutesInput');

const colorInput = document.getElementById('colorInput');
const customColorBtn = document.getElementById('customColorBtn');
const colorBtns = document.querySelectorAll('.color-btn');

const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');

const darkModeToggle = document.getElementById('darkModeToggle');

const timerModal = document.getElementById('timerModal');
const timerHoursElem = document.getElementById('timerHours');
const timerMinutesElem = document.getElementById('timerMinutes');
const timerTaskName = document.getElementById('timerTaskName');
const timerStopBtn = document.getElementById('timerStopBtn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

tasks = tasks.map(t => ({
    text: t.text || '',
    completed: t.completed || false,
    priority: 'medium',
    category: t.category || 'General',
    color: t.color || '#667eea',
    hours: t.hours ?? 0,
    minutes: t.minutes ?? 0,
    timerActive: false,
    createdDate: t.createdDate || new Date().toISOString()
}));

let selectedColor = '#667eea';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let timerIntervals = {};
let currentRunningTaskIndex = null;

function initializeDarkMode() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDarkMode);
}

function setSelectedColor(color) {
    selectedColor = color;
    colorInput.value = color;

    colorBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

colorBtns.forEach(btn =>
    btn.addEventListener('click', e => {
        if (btn.id === 'customColorBtn') {
            colorInput.click();
        } else {
            setSelectedColor(btn.dataset.color);
        }
    })
);

colorInput.addEventListener('change', e => {
    setSelectedColor(e.target.value);
});

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;

    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = total - completed;
    overdueCount.textContent = 0;
    mediumCount.textContent = total;

    clearAllBtn.style.display = completed ? 'block' : 'none';
}

function formatTimeDisplay(h, m) {
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function startTaskTimer(index) {
    const task = tasks[index];
    timerModal.style.display = 'flex';
    timerTaskName.textContent = task.text;

    timerIntervals[index] = setInterval(() => {
        if (!task.timerActive) return;

        if (task.minutes > 0) task.minutes--;
        else if (task.hours > 0) {
            task.hours--;
            task.minutes = 59;
        } else {
            task.timerActive = false;
            clearInterval(timerIntervals[index]);
            timerModal.style.display = 'none';
            alert(`Timer finished: ${task.text}`);
        }

        updateTimerDisplay(index);
        saveTasks();
        renderTasks();
    }, 60000);

    updateTimerDisplay(index);
}

function updateTimerDisplay(i) {
    timerHoursElem.textContent =
        String(tasks[i].hours).padStart(2,'0');
    timerMinutesElem.textContent =
        String(tasks[i].minutes).padStart(2,'0');
}

function toggleTaskTimer(i) {
    const task = tasks[i];
    task.timerActive = !task.timerActive;

    if (task.timerActive) startTaskTimer(i);
    else timerModal.style.display = 'none';

    saveTasks();
    renderTasks();
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return alert("Enter a task!");

    tasks.push({
        text,
        completed:false,
        priority:'medium',
        category:categorySelect.value,
        color:selectedColor,
        hours:+hoursInput.value || 0,
        minutes:+minutesInput.value || 0,
        timerActive:false,
        createdDate:new Date().toISOString()
    });

    taskInput.value='';
    hoursInput.value=0;
    minutesInput.value=0;

    saveTasks();
    renderTasks();
}

function deleteTask(i){
    if(confirm("Delete task?")){
        tasks.splice(i,1);
        saveTasks();
        renderTasks();
    }
}

function toggleTask(i){
    tasks[i].completed=!tasks[i].completed;
    saveTasks();
    renderTasks();
}

function clearCompleted(){
    tasks = tasks.filter(t=>!t.completed);
    saveTasks();
    renderTasks();
}

function renderTasks(){
    taskList.innerHTML='';
    const search = searchInput.value.toLowerCase();

    const filtered = tasks.filter(t=>{
        if(filterSelect.value==="completed") return t.completed;
        if(filterSelect.value==="pending") return !t.completed;
        return true;
    }).filter(t =>
        t.text.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
    );

    emptyState.style.display =
        filtered.length ? 'none':'block';

    filtered.forEach(task=>{
        const i = tasks.indexOf(task);

        const li=document.createElement('li');
        li.className=`task-item ${task.completed?'completed':''}`;

        li.innerHTML=`
            <input type="checkbox"
                ${task.completed?'checked':''}
                onchange="toggleTask(${i})">

            <div class="color-indicator"
                style="background:${task.color}"></div>

            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <div class="task-meta">
                    <span class="tag">${task.category}</span>
                    <span class="timer-badge"
                        onclick="toggleTaskTimer(${i})">
                        ⏱️ ${formatTimeDisplay(task.hours,task.minutes)}
                    </span>
                </div>
            </div>

            <button class="delete-btn"
                onclick="deleteTask(${i})">Delete</button>
        `;

        taskList.appendChild(li);
    });

    updateStats();
}

addBtn.onclick=addTask;
taskInput.onkeypress=e=>{ if(e.key==="Enter") addTask(); };
clearAllBtn.onclick=clearCompleted;
searchInput.oninput=renderTasks;
filterSelect.onchange=renderTasks;
darkModeToggle.onclick=toggleDarkMode;

timerStopBtn.onclick=()=>{
    if(currentRunningTaskIndex!==null)
        toggleTaskTimer(currentRunningTaskIndex);
};

initializeDarkMode();
setSelectedColor('#667eea');
renderTasks();
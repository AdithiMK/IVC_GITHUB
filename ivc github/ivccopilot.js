const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const clearAllBtn = document.getElementById('clearAllBtn');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const pendingCount = document.getElementById('pendingCount');
const overdueCount = document.getElementById('overdueCount');
const prioritySelect = document.getElementById('prioritySelect');
const categorySelect = document.getElementById('categorySelect');
const hoursInput = document.getElementById('hoursInput');
const minutesInput = document.getElementById('minutesInput');
const colorInput = document.getElementById('colorInput');
const customColorBtn = document.getElementById('customColorBtn');
const colorBtns = document.querySelectorAll('.color-btn');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const highCount = document.getElementById('highCount');
const mediumCount = document.getElementById('mediumCount');
const lowCount = document.getElementById('lowCount');
const timerModal = document.getElementById('timerModal');
const timerHoursElem = document.getElementById('timerHours');
const timerMinutesElem = document.getElementById('timerMinutes');
const timerDisplay = document.getElementById('timerDisplay');
const timerTaskName = document.getElementById('timerTaskName');
const timerStopBtn = document.getElementById('timerStopBtn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
// ensure tasks from older versions have required properties
tasks = tasks.map(t => ({
    priority: (t.priority || 'medium').toString().toLowerCase(),
    category: t.category || 'General',
    color: t.color || '#667eea',
    hours: (t.hours !== undefined ? t.hours : 0),
    minutes: (t.minutes !== undefined ? t.minutes : 0),
    timerActive: t.timerActive || false,
    createdDate: t.createdDate || new Date().toISOString().split('T')[0],
    completed: t.completed || false,
    text: t.text || ''
}));
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let selectedColor = '#667eea';
let timerIntervals = {};
let today = new Date().toISOString().split('T')[0];
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
    
    // Update active button styling
    colorBtns.forEach(btn => {
        if (btn.id === 'customColorBtn') {
            btn.classList.remove('active');
        } else if (btn.dataset.color === color) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function handleColorButtonClick(e) {
    const btn = e.target.closest('.color-btn');
    if (!btn) return;
    
    if (btn.id === 'customColorBtn') {
        // Show the color picker for custom color
        colorInput.click();
    } else {
        // Select predefined color
        const color = btn.dataset.color;
        setSelectedColor(color);
    }
}

function handleColorInputChange(e) {
    const color = e.target.value;
    setSelectedColor(color);
    
    // Mark custom button as active
    colorBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    customColorBtn.classList.add('active');
}

function formatTimeDisplay(hours, minutes) {
    const h = String(hours || 0).padStart(2, '0');
    const m = String(minutes || 0).padStart(2, '0');
    return `${h}:${m}`;
}

function startTaskTimer(taskIndex) {
    // Clear existing interval if any
    if (timerIntervals[taskIndex]) {
        clearInterval(timerIntervals[taskIndex]);
    }

    currentRunningTaskIndex = taskIndex;
    
    // Show the timer modal
    timerModal.style.display = 'flex';
    timerTaskName.textContent = tasks[taskIndex].text;
    updateTimerDisplay(taskIndex);

    // tick every minute
    timerIntervals[taskIndex] = setInterval(() => {
        const task = tasks[taskIndex];
        if (!task || !task.timerActive) {
            clearInterval(timerIntervals[taskIndex]);
            delete timerIntervals[taskIndex];
            timerModal.style.display = 'none';
            currentRunningTaskIndex = null;
            return;
        }

        // Decrement by minute
        if (task.minutes > 0) {
            task.minutes--;
        } else if (task.hours > 0) {
            task.hours--;
            task.minutes = 59;
        } else {
            // Timer finished
            task.timerActive = false;
            clearInterval(timerIntervals[taskIndex]);
            delete timerIntervals[taskIndex];
            timerModal.style.display = 'none';
            currentRunningTaskIndex = null;
            alert(`Timer finished for task: ${task.text}`);
            saveTasks();
            renderTasks();
            return;
        }

        saveTasks();
        updateTimerDisplay(taskIndex);
    }, 60000); // 60,000 ms = 1 minute
}

function updateTimerDisplay(taskIndex) {
    const task = tasks[taskIndex];
    timerHoursElem.textContent = String(task.hours || 0).padStart(2,'0');
    timerMinutesElem.textContent = String(task.minutes || 0).padStart(2,'0');
}

function toggleTaskTimer(taskIndex) {
    const task = tasks[taskIndex];
    
    // Show confirmation dialog
    if (!task.timerActive) {
        const confirmed = confirm(`Task Start: ${task.text}\n\nDo you want to start this task?`);
        if (!confirmed) return;
    }
    
    task.timerActive = !task.timerActive;

    if (task.timerActive) {
        startTaskTimer(taskIndex);
    } else {
        if (timerIntervals[taskIndex]) {
            clearInterval(timerIntervals[taskIndex]);
            delete timerIntervals[taskIndex];
        }
        timerModal.style.display = 'none';
        currentRunningTaskIndex = null;
    }

    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;

    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
    overdueCount.textContent = '0';
    highCount.textContent = highPriority;
    mediumCount.textContent = mediumPriority;
    lowCount.textContent = lowPriority;

    clearAllBtn.style.display = completed > 0 ? 'block' : 'none';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFilteredAndSearchedTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;

    return tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm) || 
                            task.category.toLowerCase().includes(searchTerm);
        
        let matchesFilter = true;
        if (filterValue === 'pending') {
            matchesFilter = !task.completed;
        } else if (filterValue === 'completed') {
            matchesFilter = task.completed;
        } else if (filterValue === 'high') {
            matchesFilter = task.priority === 'high';
        } else if (filterValue === 'medium') {
            matchesFilter = task.priority === 'medium';
        } else if (filterValue === 'low') {
            matchesFilter = task.priority === 'low';
        }

        return matchesSearch && matchesFilter;
    });
}

function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = getFilteredAndSearchedTasks();

    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filteredTasks.forEach((task, index) => {
            const originalIndex = tasks.indexOf(task);
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
            
            let metaHtml = '';
            if (task.priority) {
                metaHtml += `<span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>`;
            }
            if (task.category) {
                metaHtml += `<span class="tag">${escapeHtml(task.category)}</span>`;
            }
            if (task.createdDate) {
                metaHtml += `<span class="date-badge">${formatDate(task.createdDate)}</span>`;
            }
            if (task.hours !== undefined || task.minutes !== undefined) {
                const timerActive = task.timerActive ? 'active' : '';
                metaHtml += `<span class="timer-badge ${timerActive}" onclick="toggleTaskTimer(${originalIndex})" style="cursor: pointer;" title="Click to start/stop timer">⏱️ ${formatTimeDisplay(task.hours, task.minutes)}</span>`;
            }

            li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    onchange="toggleTask(${originalIndex})"
                >
                <div class="color-indicator" style="background-color: ${escapeHtml(task.color || '#667eea')}"></div>
                <div class="task-content">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <div class="task-meta">${metaHtml}</div>
                </div>
                <div class="task-actions">
                    <button class="delete-btn" onclick="deleteTask(${originalIndex})">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    updateStats();
}

function addTask() {
    const text = taskInput.value.trim();
    if (text === '') {
        alert('Please enter a task!');
        taskInput.focus();
        return;
    }

    tasks.push({
        text: text,
        completed: false,
        priority: prioritySelect.value.toLowerCase(),
        createdDate: today,
        category: categorySelect.value,
        color: selectedColor,
        hours: parseInt(hoursInput.value) || 0,
        minutes: parseInt(minutesInput.value) || 0,
        timerActive: false
    });

    taskInput.value = '';
    prioritySelect.value = 'medium';
    categorySelect.value = 'General';
    hoursInput.value = '0';
    minutesInput.value = '0';
    setSelectedColor('#667eea');
    taskInput.focus();
    saveTasks();
    renderTasks();
}

function deleteTask(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Clear timer if running
        if (timerIntervals[index]) {
            clearInterval(timerIntervals[index]);
            delete timerIntervals[index];
        }
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

function clearCompleted() {
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Event listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});
clearAllBtn.addEventListener('click', clearCompleted);
searchInput.addEventListener('input', renderTasks);
filterSelect.addEventListener('change', renderTasks);
darkModeToggle.addEventListener('click', toggleDarkMode);
colorBtns.forEach(btn => btn.addEventListener('click', handleColorButtonClick));
colorInput.addEventListener('change', handleColorInputChange);

// Keyboard shortcuts for timer inputs
hoursInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
minutesInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Timer stop button
timerStopBtn.addEventListener('click', () => {
    if (currentRunningTaskIndex !== null) {
        toggleTaskTimer(currentRunningTaskIndex);
    }
});

// Initial render
initializeDarkMode();
setSelectedColor('#667eea');
renderTasks();

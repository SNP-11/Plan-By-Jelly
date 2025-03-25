document.addEventListener('DOMContentLoaded', function() {
    let isMenuOpen = false;
    let currentWeekStart = new Date();
    let taskCount = 0;
    let autoCompleteCount = 5;
    let tasks = [];
    let savedTasks = []; // Define savedTasks array
    let weekOffset = 0;

    function getSundayStartOfWeek() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diff = dayOfWeek; // Days to subtract to reach Sunday
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - diff);
        sunday.setHours(0, 0, 0, 0); // Start of the day

        return Math.floor(sunday.getTime() / 1000); // Convert to Unix timestamp in seconds
    }
    let startDay = getSundayStartOfWeek();

    if (localStorage.getItem('weekOffset')) {
        // weekOffset = parseInt(localStorage.getItem('weekOffset'));
        changeWeek(parseInt(localStorage.getItem('weekOffset')) * 7);
        localStorage.removeItem('weekOffset');
    }
    if (localStorage.getItem('startDay')) {
        startDay = parseInt(localStorage.getItem('startDay'));
        localStorage.removeItem('startDay');
    }
    
    // Function to update the days of the week displayed on the page
    function updateWeekdays() {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const todayDayIndex = today.getDay();
        console.log(todayDayIndex);
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - todayDayIndex);

        for (let i = 0; i < 7; i++) {
            const date = new Date(sunday);
            date.setDate(sunday.getDate() + i);
            let currentDate = new Date();
            let currentDay = currentDate.getUTCDate();
            const dayLabel = document.getElementById(`day${i + 1}`);
            const dayColumn = document.getElementById(`column${i + 1}`);
            if (dayLabel) {
                dayLabel.innerText = `${daysOfWeek[date.getDay()]} ${date.getDate()}`;
                dayColumn.dataset.date = Date.parse(date) / 1000;
                console.log(currentDay, date.getDate());
                if (currentDay == date.getDate()) {
                    dayColumn.parentNode.style.border = "1px solid white";
                    dayLabel.parentNode.style.border = "1px solid white";
                }
            }
        }
    }

    // Call updateWeekdays and set intervals for updating days
    updateWeekdaysWithWeek(startDay);
    setInterval(updateWeekdays, 24 * 60 * 60 * 1000);

    const now = new Date();
    const timeToMidnight = (24 * 60 * 60 * 1000) - (now.getHours() * 60 * 60 * 1000) - (now.getMinutes() * 60 * 1000) - (now.getSeconds() * 1000);
    setTimeout(function() {
        updateWeekdays();
        setInterval(updateWeekdays, 24 * 60 * 60 * 1000);
    }, timeToMidnight);

    // Function to update weekdays and tasks based on the current week's start date
    function updateWeekdaysWithWeek(startingDate) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const sunday = new Date(startingDate);
        sunday.setDate(sunday.getDate() - sunday.getDay()); // Get the Sunday of the selected week

        for (let i = 0; i < 7; i++) {
            const date = new Date(sunday);
            date.setDate(sunday.getDate() + i); // Get each day of the week

            const dayLabel = document.getElementById(`day${i + 1}`);
            const dayColumn = document.getElementById(`column${i + 1}`);

            if (dayLabel && dayColumn) {
                // Update the label to show weekday and date
                dayLabel.innerText = `${daysOfWeek[date.getDay()]} ${date.getDate()}`;
                dayColumn.dataset.date = Math.floor(date.getTime() / 1000); // Store timestamp

                // Clear old tasks before loading new ones
                dayColumn.innerHTML = "";

                // Load smallDivs for the selected week
                loadTasksForDate(date, dayColumn);
            }
        }
    }

    // Function to load smallDivs (tasks) for a given date
    function loadTasksForDate(date, column) {
        const timestamp = Math.floor(date.getTime() / 1000); // Convert date to Unix timestamp
        const tasksForDay = tasks[timestamp] || []; // Fetch tasks from stored task list

        tasksForDay.forEach(task => {
            let taskDiv = document.createElement("div");
            taskDiv.className = "smallDiv";
            taskDiv.innerText = task.label; // Display task name
            taskDiv.dataset.startTime = task.start_time;
            taskDiv.dataset.endTime = task.end_time;
            column.appendChild(taskDiv);
        });
    }

    // Function to navigate weeks
    function changeWeek(days) {
        currentWeekStart.setDate(currentWeekStart.getDate() + days);
        updateWeekdaysWithWeek(currentWeekStart);
        getTasks();
    }

    // Initialize the week on page load
    updateWeekdaysWithWeek(currentWeekStart);

    // Event listeners for week navigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        changeWeek(-7);
        weekOffset--;
    });
    document.getElementById('nextWeek').addEventListener('click', () => {
        changeWeek(7);
        weekOffset++;
    });

    // Function to create and display smallDiv
    function createSmallDiv() {
        var smallDiv = document.createElement("div");
        smallDiv.className = "smallDiv";

        smallDiv.addEventListener("mouseenter", function() {
            smallDiv.style.width = "70px";
            smallDiv.style.height = "70px";
        });

        smallDiv.addEventListener("mouseleave", function() {
            smallDiv.style.width = "50px";
            smallDiv.style.height = "50px";
        });

        var wrapper = document.querySelector('.wrapper');
        var content = wrapper.querySelector('.content');
        if (content) {
            content.appendChild(smallDiv);
        } else {
            console.error('Content area not found');
        }
    }

    // Function to send task text to the server and update smallDiv
    function sendTaskText(taskText) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/update_task_text", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                console.log("XHR Status:", xhr.status);
                if (xhr.status == 200) {
                    var response = JSON.parse(xhr.responseText);
                    console.log("Server response:", response);
                } else {
                    console.error("Error:", xhr.statusText);
                }
            }
        };

        xhr.send("task_text=" + encodeURIComponent(taskText));
    }

    function getTaskText() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/fetch_task_text", true);

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                console.log("XHR Status:", xhr.status);
                if (xhr.status == 200) {
                    var response = JSON.parse(xhr.responseText);
                    updateSmallDiv(response.task_text);
                } else {
                    console.error("Error:", xhr.statusText);
                }
            }
        };
        xhr.send();
    }
    
    // Function to update the smallDiv with the response text
    function updateSmallDiv(data) {
        var smallDiv = document.querySelector('.smallDiv');
        if (smallDiv) {
            smallDiv.innerText = text;
        } else {
            console.error('No .smallDiv element found');
        }
    }

    // Create smallDiv when DOM is loaded
    createSmallDiv();

    // Modal-related logic

    // Open the modal when the button is clicked
    document.getElementById("openModalBtn").addEventListener('click', () => openTaskM());

    document.getElementById("closeBtn").addEventListener('click', () => closeTaskModal());

    // Close the modal if the user clicks anywhere outside of the modal content
    window.onclick = function(event) {
        const modal = document.getElementById("myModal");
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Allow dragging the modal
    let isDragging = false, offsetX, offsetY;
    const modalContent = document.getElementById("modalContent");

    modalContent.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - modalContent.offsetLeft;
        offsetY = e.clientY - modalContent.offsetTop;
    });

    window.addEventListener('mousemove', function(e) {
        if (isDragging) {
            modalContent.style.left = (e.clientX - offsetX) + 'px';
            modalContent.style.top = (e.clientY - offsetY) + 'px';
        }
    });

    window.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    document.getElementById("addButton").addEventListener('click', (event) => addTask(event));
    document.getElementById("removeButton").addEventListener('click', (event) => removeTask(event));


    function addTask(event) { 
        var start_time = $("input[name = 'start_time']").val()
        start_time = new Date(new Date(start_time).toLocaleString('en-US')).getTime() / 1000
        var end_time = $("input[name = 'end_time']").val()
        end_time = new Date(new Date(end_time).toLocaleString('en-US')).getTime() / 1000
        $.post('/add_task', {
            label: $("input[name = 'label']").val(),
            start_time: start_time,
            end_time: end_time,
            urgency: $("select#urgency").val(),
            save_task: $("input#save_task").is(":checked") == true ? 1 : 0
        }, function(response){
            taskCount++;
            add_taskDiv(response, taskCount - 1); 
        });
    }

    function removeTask(event) {
        console.log(event.srcElement.dataset.task_id);
        $.post('/delete_task', {
            id: event.srcElement.dataset.task_id
        }, function(response){
            getTasks();
            console.log(response);
        });
    }
    
    // Function to toggle the sidebar menu
    function toggleMenu() {
        const sideMenu = document.getElementById("sideMenu");
        const toggleButton = document.getElementById("toggleButton");

        if (isMenuOpen) {
            sideMenu.style.display = "none"; // Hide sidebar
            toggleButton.innerHTML = "&#9681;"; // Change icon to hamburger
        } else {
            sideMenu.style.display = "block"; // Show sidebar
            // toggleButton.innerHTML = "&times;"; // Change icon to close
        }

        isMenuOpen = !isMenuOpen; // Toggle the state
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("sideMenu").style.display = "none";
        document.getElementById("toggleButton").innerHTML = "&#9681;";
    });
    
    // Attach the toggleMenu function to the toggle button
    document.getElementById("toggleButton").onclick = toggleMenu;

    // Existing logic for AJAX request to fetch tasks
    function getTasks() {
        $('.smallDiv').remove();
        $.ajax({
            type: "POST",
            url: "/get_tasks",
            success: function(data) {
                console.log(data); 
                tasks = data;
                taskCount = data.length;
                let startOfWeek = new Date();
                startOfWeek.setDate((startOfWeek.getDate() - startOfWeek.getDay())+weekOffset*7); // Get the start of the current week
                startOfWeek.setHours(0, 0, 0, 0);
                let endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                let savedTasksToShow = tasks.filter(task => task.save_task && task.start_time >= startOfWeek.getTime() / 1000 && task.start_time <= endOfWeek.getTime() / 1000); // Get tasks for the current week
                savedTasksToShow.forEach((task, i) => {
                    task.start_time = (new Date(new Date(task.start_time).toLocaleString('en-US'))).getTime();
                    task.end_time = (new Date(new Date(task.end_time).toLocaleString('en-US'))).getTime();
                    console.log(task.start_time + " >= " + startOfWeek.getTime() / 1000);
                    add_taskDiv(task, i);
                    calculateTaskDuration(task, i);
                });
                let unsavedTasksToShow = tasks.filter(task => !task.save_task && task.start_time >= startOfWeek.getTime() / 1000 && task.start_time <= endOfWeek.getTime() / 1000); // Get unsaved tasks
                unsavedTasksToShow.forEach((task, i) => {
                    task.start_time = (new Date(new Date(task.start_time).toLocaleString('en-US'))).getTime();
                    task.end_time = (new Date(new Date(task.end_time).toLocaleString('en-US'))).getTime();
                    console.log(task.start_time + " >= " + startOfWeek.getTime() / 1000);
                    add_taskDiv(task, i);
                    calculateTaskDuration(task, i);
                });
                
            }
        });
    }
    getTasks();

    function calculateTaskDuration(task, i){
        let start = parseInt(task.start_time);
        let end = parseInt(task.end_time);
        let duration = end-start;
        tasks[i].duration = duration;
    }

    function add_taskDiv(date, i){
        let start = parseInt(date.start_time);
        let end = parseInt(date.end_time);
        start = new Date(start * 1000).toUTCString();
        end = new Date(end * 1000).toUTCString();
        if (date.save_task) {
            let autoCompleteContainer = document.getElementById('autoCompletes');
            let dummyAutoCompleteDiv = document.getElementById('dummyAccordion');
            if (!dummyAutoCompleteDiv) {
                console.error('dummyAccordion element not found');
                return;
            }
            let autoCompleteDiv = dummyAutoCompleteDiv.cloneNode(true);
            autoCompleteDiv.classList.remove('d-none');
            autoCompleteDiv.id = 'autoComplete' + i;
            autoCompleteContainer.appendChild(autoCompleteDiv);

            // Update content of the accordion item
            let label = autoCompleteDiv.querySelector('div.accordion-item h2.accordion-header button');
            label.innerText = date.label;
            label.dataset.bsTarget = '#autoCompleteCollapse' + i;
            let collapse = autoCompleteDiv.querySelector('div.accordion-item div#collapseOne');
            collapse.id = 'autoCompleteCollapse' + i;
    
            let dateLabel = autoCompleteDiv.querySelector('div.accordion-item .accordion-collapse .accordion-body .date-label');
            dateLabel.innerText = start.toLocaleString() + " ~ " + end.toLocaleString();

            let dateUrgency = autoCompleteDiv.querySelector('div.accordion-item .accordion-collapse .accordion-body .date-urgency');
            dateUrgency.innerText = date.urgency;

            let autoCompleteButton = autoCompleteDiv.querySelector('div.accordion-item .accordion-collapse .accordion-body button.autoCompleteButton');
            autoCompleteButton.addEventListener('click', () => {
                let start_locale = start.toLocaleString('en-US');
                console.log(start_locale);
                document.getElementById('start_time').value = (new Date(start_locale)).toISOString().slice(0, 16);
                document.getElementById('end_time').value = end.toISOString().slice(0, 16);
                document.getElementById('label-input').value = date.label;
                document.getElementById('urgency').value = date.urgency;
            });

            // Remove reminder box and reminder text
            let reminderBox = autoCompleteDiv.querySelector('.reminder-box');
            if (reminderBox) {
                reminderBox.remove();
            }
            let reminderText = autoCompleteDiv.querySelector('.reminder-text');
            if (reminderText) {
                reminderText.remove();
            }

            // Add the task to the list of savedTasks
            savedTasks.push(autoCompleteDiv);

            // If there are more than 5 saved tasks, remove the oldest one
            if (savedTasks.length > autoCompleteCount) {
                let taskToRemove = savedTasks.shift();
                taskToRemove.remove();
            }
        }


        $(".content").each(function () {
            //first find start day and end day
            let columnDate = $(this).data("date");
            let isEventInColumn = isSameDayEvent(columnDate, date.start_time, date.end_time);
            if (isEventInColumn){
                let newTaskDiv = document.createElement('div');
                newTaskDiv.className = 'smallDiv';
                newTaskDiv.setAttribute('data-id', date.id);
                newTaskDiv.setAttribute('data-uid', date.uid);
                newTaskDiv.setAttribute('data-label', date.label);
                newTaskDiv.setAttribute('data-start_time', date.start_time);
                newTaskDiv.setAttribute('data-end_time', date.end_time);
                newTaskDiv.setAttribute('data-urgency', date.urgency);
                newTaskDiv.addEventListener("mouseenter", (event) => clickDiv(event));
                newTaskDiv.addEventListener("mouseleave", (event) => clickDiv(event));
                newTaskDiv.addEventListener('click', (event) => dblClickDiv(event));
                loadE(newTaskDiv);
                $(this).append(newTaskDiv);
            }
        });
    }


    /**
     * Check if event_start or event_end fall on the same day as day_compare
     * @param {number} day_compare - Unix timestamp of the day to compare (drop hrs, mins, secs)
     * @param {number} event_start - Unix timestamp of the event start
     * @param {number} event_end - Unix timestamp of the event end
     * @return {boolean} - True if either event_start or event_end fit on day_compare
     */
    function isSameDayEvent(day_compare, event_start, event_end) {
        // Helper function to get the start of the day (0 hrs, 0 mins, 0 secs) for a timestamp
        const getStartOfDay = (timestamp) => {
            const date = new Date(timestamp * 1000); // Convert Unix timestamp to milliseconds
            date.setHours(0, 0, 0, 0); // Set time to start of the day
            return date.getTime() / 1000; // Return as Unix timestamp
        };

        // Compare days by getting start of the day for each timestamp
        const dayTimestamp = getStartOfDay(day_compare);
        const startTimestamp = getStartOfDay(event_start);
        const endTimestamp = getStartOfDay(event_end);

        // Check if either event start or event end matches day_compare
        return dayTimestamp >= startTimestamp && dayTimestamp <= endTimestamp;
    }

    function openTaskModal(taskDiv) {
        // Get the task data from the data attributes
        const taskId = taskDiv.getAttribute('data-id');
        const taskUid = taskDiv.getAttribute('data-uid');
        const taskLabel = taskDiv.getAttribute('data-label');
        const taskStartTime = taskDiv.getAttribute('data-start_time');
        const taskEndTime = taskDiv.getAttribute('data-end_time');

        selected_id = taskId;
        
        // Populate modal fields with task data
        document.getElementById('taskLabelInput').value = taskLabel;
        document.getElementById('taskStartTimeInput').value = new Date(parseInt(taskStartTime) * 1000).toISOString().slice(0, 16); // format for datetime-local input
        document.getElementById('taskEndTimeInput').value = new Date(parseInt(taskEndTime) * 1000).toISOString().slice(0, 16);

        // Show the modal
        modal.style.display = 'block';

        // Add a listener to save changes
        document.getElementById('saveButton').onclick = function () {
            // Get updated values from modal fields
            const updatedLabel = document.getElementById('taskLabelInput').value;
            const updatedStartTime = new Date(document.getElementById('taskStartTimeInput').value).getTime() / 1000;
            const updatedEndTime = new Date(document.getElementById('taskEndTimeInput').value).getTime() / 1000;

            // Update the taskDiv attributes with new values
            taskDiv.setAttribute('data-label', updatedLabel);
            taskDiv.setAttribute('data-start_time', updatedStartTime);
            taskDiv.setAttribute('data-end_time', updatedEndTime);
            taskDiv.innerText = new Date(updatedStartTime * 1000).toLocaleString() + " - " + new Date(updatedEndTime * 1000).toLocaleString();

            // Close the modal
            modal.style.display = 'none';
        };

        
    }

    
});
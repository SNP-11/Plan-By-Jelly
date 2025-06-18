document.addEventListener('DOMContentLoaded', function() {
    let isMenuOpen = false;
    let currentWeekStart = new Date();
    let taskCount = 0;
    let autoCompleteCount = 5;
    let tasks = [];
    let savedTasks = []; // Define savedTasks array
    let weekOffset = 0;
    let comp_points = localStorage.getItem("comp_points") ? parseInt(localStorage.getItem("comp_points")) : 0;
    let streaks = localStorage.getItem("streaks") ? parseInt(localStorage.getItem("streaks")) : 0;


    $("#comp_points").text(comp_points);
    $("#streaks").text(streaks);
    
  
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
                if (currentDay == date.getDate() && weekOffset == 0) {
                    dayColumn.parentNode.style.border = "1px solid white";
                    dayLabel.parentNode.style.border = "1px solid white";
                }
            }
        }
    }

    // Call updateWeekdays and set intervals for updating days
    updateWeekdays();
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
    
        const today = new Date(); // Recalculate today's date
        today.setHours(0, 0, 0, 0); // Normalize to midnight for comparison
    
        console.log("Today:", today); // Log today's normalized date
        console.log("Week Offset:", weekOffset); // Log the current week offset
    
        for (let i = 0; i < 7; i++) {
            const date = new Date(sunday);
            date.setDate(sunday.getDate() + i); // Get each day of the week
            date.setHours(0, 0, 0, 0); // Normalize to midnight for comparison
    
            const dayLabel = document.getElementById(`day${i + 1}`);
            const dayColumn = document.getElementById(`column${i + 1}`);
    
            if (dayLabel && dayColumn) {
                // Update the label to show weekday and date
                dayLabel.innerText = `${daysOfWeek[date.getDay()]} ${date.getDate()}`;
                dayColumn.dataset.date = Math.floor(date.getTime() / 1000); // Store timestamp
                console.log(`Day ${i + 1}: ${date}, Label: ${dayLabel.innerText}`);
    
                // Clear old tasks before loading new ones
                dayColumn.innerHTML = "";
    
                // Highlight the current day only if it matches today's date and the current week
                if (date.getTime() === today.getTime() && weekOffset === 0) {
                    console.log("Highlighting current day:", dayLabel.innerText);
                    dayColumn.parentNode.style.border = "1px solid white";
                    dayLabel.parentNode.style.border = "1px solid white";
                } else {
                    console.log("Removing highlight for:", dayLabel.innerText);
                    dayColumn.parentNode.style.border = "none";
                    dayLabel.parentNode.style.border = "none";
                }
    
                // Load smallDivs for the selected week
                loadTasksForDate(date, dayColumn);
            } else {
                console.error("Day label or column not found for index:", i);
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
        weekOffset += days / 7; // Update weekOffset based on the number of days
    
        console.log("Week Offset after change:", weekOffset); // Debugging log
    
        // Reset weekOffset to 0 if we're back to the current week
        if (weekOffset === 0) {
            currentWeekStart = new Date(); // Reset to the current week's start
            currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
            currentWeekStart.setHours(0, 0, 0, 0);
    
            console.log("Resetting to current week. Current Week Start:", currentWeekStart);
        }
    
        // Update the weekdays displayed on the page
        updateWeekdaysWithWeek(currentWeekStart);
    
        // Fetch and display tasks for the new week
        console.log("Reloading tasks for the new week...");
        getTasks();
    }

    // Initialize the week on page load
    updateWeekdaysWithWeek(currentWeekStart);

    // Event listeners for week navigation
    // Event listeners for week navigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        weekOffset--; // Decrement weekOffset when navigating back
        console.log("Navigating to previous week. Week Offset:", weekOffset);

        // Store the updated weekOffset in localStorage
        localStorage.setItem("weekOffset", weekOffset);

        // Reload the page
        window.location.replace(window.location.href.split('?')[0] + "?weekOffset=" + weekOffset);
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        weekOffset++; // Increment weekOffset when navigating forward
        console.log("Navigating to next week. Week Offset:", weekOffset);

        // Store the updated weekOffset in localStorage
        localStorage.setItem("weekOffset", weekOffset);

        // Reload the page
        window.location.replace(window.location.href.split('?')[0] + "?weekOffset=" + weekOffset);
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
    document.getElementById("openModalBtn").addEventListener('click', () => {
        openTaskM();
        isModalOpen = true; // Set modal state to open
    });

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
        const start_time = convertToUTC($("input[name='start_time']").val());
        const end_time = convertToUTC($("input[name='end_time']").val());
    
        $.post('/add_task', {
            label: $("input[name='label']").val(),
            start_time: start_time,
            end_time: end_time,
            urgency: $("select#urgency").val(),
            save_task: $("input#save_task").is(":checked") ? 1 : 0
        }, function(response) {
            if ($("input#save_task").is(":checked")) {
                let routines = localStorage.getItem("routines") ? parseInt(localStorage.getItem("routines")) : 0;
                localStorage.setItem("routines", routines + 1);
            }

            console.log("Raw server response:", response);
    
            if (response.id && response.label && response.start_time && response.end_time) {
                taskCount++;
                add_taskDiv(response, taskCount - 1);
            } else {
                console.error("Failed to add task: Missing required response properties");
            }
        });
    }

    function removeTask(event) {
        const taskId = event.currentTarget.dataset.task_id; // Use currentTarget instead of srcElement
        console.log("Removing task with ID:", taskId);
    
        if (!taskId) {
            console.error("Task ID is missing. Cannot delete task.");
            return;
        }
    
        // Remove the task from the savedTasks array
        const taskIndex = savedTasks.findIndex(task => task.id === `autoComplete${taskId}`);
        if (taskIndex !== -1) {
            savedTasks.splice(taskIndex, 1); // Remove the task from the array
        }
    
        // Remove the task element from the DOM
        const taskElement = document.getElementById(`autoComplete${taskId}`);
        if (taskElement) {
            taskElement.remove();
        }
    
        // Send a request to the server to delete the task
        $.post('/delete_task', { id: taskId }, function (response) {
            console.log("Task removed:", response);

            window.location.reload(); // Reload the page to reflect changes
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
        $('.smallDiv').remove(); // Clear all existing task elements
        $.ajax({
            type: "POST",
            url: "/get_tasks",
            success: function(data) {
                console.log("Retrieved tasks:", data); 
                tasks = data;
                taskCount = data.length;
    
                // Calculate the start and end of the selected week
                let startOfWeek = new Date();
                startOfWeek.setDate((startOfWeek.getDate() - startOfWeek.getDay()) + weekOffset * 7); // Adjust for weekOffset
                startOfWeek.setHours(0, 0, 0, 0);
    
                let endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6); // End of the week
                endOfWeek.setHours(23, 59, 59, 999);
    
                console.log("Start of Week:", startOfWeek);
                console.log("End of Week:", endOfWeek);
    
                // Clear all task columns before adding new tasks
                for (let i = 1; i <= 7; i++) {
                    const dayColumn = document.getElementById(`column${i}`);
                    if (dayColumn) {
                        dayColumn.innerHTML = ""; // Clear all tasks in the column
                    }
                    console.log(`Cleared tasks for column ${i}`);
                }
    
                // Filter tasks for the selected week
                let tasksToShow = tasks.filter(task => {
                    const taskStartTime = task.start_time * 1000; // Convert to milliseconds
                    return taskStartTime >= startOfWeek.getTime() && taskStartTime <= endOfWeek.getTime();
                });
    
                console.log("Tasks to show for the selected week:", tasksToShow);
    
                // Display the filtered tasks
                tasksToShow.forEach((task, i) => {
                    add_taskDiv(task, i);
                    calculateTaskDuration(task, i);
                });
            },
            error: function(error) {
                console.error("Failed to retrieve tasks:", error);
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
    /**
     * Convert a UTC timestamp to Eastern Time (ET)
     * @param {number} utcTime - The UTC timestamp in seconds
     * @return {string} - The formatted date and time in ET
     */
    function convertToET(utcTime) {
        if (!utcTime) {
            console.error("Invalid UTC timestamp:", utcTime);
            return "Invalid Time";
        }
        return new Date(utcTime * 1000).toLocaleString("en-US", { timeZone: "America/New_York" });
    }

    /**
     * Convert a UTC timestamp to a format suitable for datetime-local input
     * @param {number} utcTime - The UTC timestamp in seconds
     * @return {string} - The formatted date and time for datetime-local input
     */
    function convertToDatetimeLocal(utcTime) {
        const date = new Date(utcTime * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    /**
     * Convert a datetime-local input value to a UTC timestamp
     * @param {string} localTime - The datetime-local input value (e.g., "2025-03-31T16:02")
     * @return {number} - The UTC timestamp in seconds
     */
    function convertToUTC(localTime) {
        const localDate = new Date(localTime); // Parse the input as local time
        return localDate.getTime() / 1000; // Convert to Unix timestamp in seconds
    }

    function add_taskDiv(date, i) {
        console.log(`Adding Task: ${date.label}, Start: ${date.start_time}, End: ${date.end_time}`);
        console.log("add_taskDiv called with:", date);
        console.log(`Start Time (UTC): ${date.start_time}`);
        console.log(`End Time (UTC): ${date.end_time}`);
        const startTimeET = convertToET(date.start_time);
        const endTimeET = convertToET(date.end_time);
        if (!startTimeET || !endTimeET) {
            console.error("Failed to convert times:", { startTimeET, endTimeET });
        } else {
            console.log(`Converted Start Time (ET): ${startTimeET}`);
            console.log(`Converted End Time (ET): ${endTimeET}`);
        }

        const checkmark = document.getElementById('checkmark'); 
        checkmark.setAttribute('data-task_id', date.id);
        checkmark.addEventListener('click', function(event) {
            let comp_points = localStorage.getItem("comp_points") ? parseInt(localStorage.getItem("comp_points")) : 0;
            let streaks  = localStorage.getItem("streaks") ? parseInt(localStorage.getItem("streaks")) : 0;
            let tasksCompleted = localStorage.getItem("completed_tasks") ? parseInt(localStorage.getItem("completed_tasks")) : 0;
            localStorage.setItem("completed_tasks", tasksCompleted + 1);
            let last_streak = localStorage.getItem("last_streak") ? localStorage.getItem("last_streak") : 0;
            let current_time = Math.floor(Date.now() / 1000); // Current time in seconds
            let last_streak_time = parseInt(last_streak);
            localStorage.setItem("comp_points", comp_points + 10);
            console.log(current_time);
            if (last_streak_time < (current_time - 86400)){
                localStorage.setItem("streaks", streaks + 1);
                localStorage.setItem("last_streak", current_time);
                $("#streaks").text(streaks + 1);
            }

            
            $("#comp_points").text(comp_points + 10);
            removeTask(event);
            const modal = document.getElementById("myModal");
            if (modal) {
                modal.style.display = "none";
            }
        });

        // Check if the task should be saved
        if (date.save_task) {
            const autoCompleteContainer = document.getElementById('autoCompletes');
            const existingTask = document.getElementById(`autoComplete${i}`);
            const dummyAutoCompleteDiv = document.getElementById('dummyAccordion');
            if (!dummyAutoCompleteDiv) {
                console.error('dummyAccordion element not found');
                return;
            }
    
            // Clone the dummy accordion and update its content
            const autoCompleteDiv = dummyAutoCompleteDiv.cloneNode(true);
            autoCompleteDiv.classList.remove('d-none'); // Ensure it's visible
            autoCompleteDiv.id = `autoComplete${i}`; // Assign a unique ID
            autoCompleteContainer.appendChild(autoCompleteDiv);
    
            // Update the accordion header and content
            const label = autoCompleteDiv.querySelector('div.accordion-item h2.accordion-header button');
            label.innerText = date.label;
            label.dataset.bsTarget = `#autoCompleteCollapse${i}`; // Update the target for collapse
            label.setAttribute('aria-controls', `autoCompleteCollapse${i}`);
    
            const collapse = autoCompleteDiv.querySelector('div.accordion-item div.accordion-collapse');
            collapse.id = `autoCompleteCollapse${i}`; // Assign a unique ID for the collapse
            collapse.setAttribute('aria-labelledby', `autoComplete${i}`);
    
            const dateLabel = autoCompleteDiv.querySelector('div.accordion-item .accordion-body .date-label');
    
            // Convert UTC timestamps to local time for display
            const startTimeLocal = new Date(date.start_time * 1000).toLocaleString();
            const endTimeLocal = new Date(date.end_time * 1000).toLocaleString();
    
            dateLabel.innerText = `${startTimeLocal} ~ ${endTimeLocal}`;
    
            const dateUrgency = autoCompleteDiv.querySelector('div.accordion-item .accordion-body .date-urgency');
            dateUrgency.innerText = date.urgency;
    
            // Add event listener for the save button inside the accordion
            const autoCompleteButton = autoCompleteDiv.querySelector('div.accordion-item .accordion-body button.autoCompleteButton');
            autoCompleteButton.onclick = function () {
                // Convert the saved task's start and end times to datetime-local format for the modal
                document.getElementById('start_time').value = convertToDatetimeLocal(date.start_time);
                document.getElementById('end_time').value = convertToDatetimeLocal(date.end_time);
                document.getElementById('label-input').value = date.label;
                document.getElementById('urgency').value = date.urgency;
            
                // Save the updated task when the save button is clicked
                document.getElementById('saveButton').onclick = function () {
                    const updatedLabel = document.getElementById('label-input').value;
                    const updatedStartTime = convertToUTC(document.getElementById('start_time').value);
                    const updatedEndTime = convertToUTC(document.getElementById('end_time').value);
            
                    // Update the task's data attributes
                    taskDiv.setAttribute('data-label', updatedLabel);
                    taskDiv.setAttribute('data-start_time', updatedStartTime);
                    taskDiv.setAttribute('data-end_time', updatedEndTime);
            
                    // Update the task on the server
                    $.post('/update_task', {
                        id: date.id,
                        label: updatedLabel,
                        start_time: updatedStartTime,
                        end_time: updatedEndTime,
                        urgency: document.getElementById('urgency').value
                    }, function (response) {
                        console.log("Task updated successfully:", response);
                        // Optionally refresh the task list or UI
                    });
                };
            };
            if (!existingTask) {
                let isADup = false
                savedTasks.forEach(task => {
                    let taskLabel = task.getAttribute('data-id');
                    if (taskLabel == date.id) {
                        isADup = true;
                    }
                    console.log("Task Label:", taskLabel, "Current Label:", date.label, "Is Duplicate:", isADup);
                });
                if (!isADup) {
                    savedTasks.push(autoCompleteDiv);
                } else {
                    console.log("Duplicate task found, not adding to savedTasks.");
                }

            }
            if (savedTasks.length > autoCompleteCount) {
                const taskToRemove = savedTasks.shift();
                taskToRemove.remove();
            }
        }

        $(".content").each(function () {
            let columnDate = $(this).data("date");
            const normalizedColumnDate = getStartOfDay(columnDate); // Normalize columnDate to start of the day in UTC
            console.log(`Column Date (Raw): ${columnDate}`);
            console.log(`Column Date (Start of Day UTC): ${normalizedColumnDate}`);
            let isEventInColumn = isSameDayEvent(normalizedColumnDate, date.start_time, date.end_time);
            if (isEventInColumn) {
                console.log(`Appending Task: ${date.label} to Column: ${normalizedColumnDate}`);
                console.log(`Column Date: ${normalizedColumnDate}, Task Start: ${date.start_time}, Task End: ${date.end_time}`);
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
     * Normalize a timestamp to the start of the day in UTC
     * @param {number} timestamp - The Unix timestamp in seconds
     * @return {number} - The normalized timestamp at the start of the day in UTC
     */
    function getStartOfDay(timestamp) {
        const date = new Date(timestamp * 1000); // Convert Unix timestamp to milliseconds
        date.setUTCHours(0, 0, 0, 0); // Set time to start of the day in UTC
        return date.getTime() / 1000; // Return as Unix timestamp in seconds
    }


    /**
     * Check if event_start or event_end fall on the same day as day_compare
     * @param {number} day_compare - Unix timestamp of the day to compare (start of the day)
     * @param {number} event_start - Unix timestamp of the event start
     * @param {number} event_end - Unix timestamp of the event end
     * @return {boolean} - True if the event overlaps with the day_compare
     */
    function isSameDayEvent(day_compare, event_start, event_end) {
        // Normalize day_compare to the start of the day in UTC
        const dayStart = getStartOfDay(day_compare);
        const dayEnd = dayStart + 24 * 60 * 60 - 1; // End of the day in UTC

        console.log(`Comparing Day Start: ${dayStart}, Day End: ${dayEnd}, Start: ${event_start}, End: ${event_end}`);

        // Check if the event overlaps with the day
        return (event_start >= dayStart && event_start <= dayEnd) || 
            (event_end >= dayStart && event_end <= dayEnd) || 
            (event_start <= dayStart && event_end >= dayEnd);
    }

    function openTaskModal(taskDiv) {
        // Get the task data from the data attributes
        const taskId = taskDiv.getAttribute('data-id');
        const taskLabel = taskDiv.getAttribute('data-label');
        const taskStartTime = taskDiv.getAttribute('data-start_time');
        const taskEndTime = taskDiv.getAttribute('data-end_time');

        selected_id = taskId;

        // Populate modal fields with task data
        document.getElementById('taskLabelInput').value = taskLabel;
        document.getElementById('taskStartTimeInput').value = convertToDatetimeLocal(parseInt(taskStartTime));
        document.getElementById('taskEndTimeInput').value = convertToDatetimeLocal(parseInt(taskEndTime));

        // Show the modal
        modal.style.display = 'block';

        // Add a listener to save changes
        document.getElementById('saveButton').onclick = function () {
            const updatedLabel = document.getElementById('taskLabelInput').value;
            const updatedStartTime = convertToUTC(document.getElementById('taskStartTimeInput').value);
            const updatedEndTime = convertToUTC(document.getElementById('taskEndTimeInput').value);

            taskDiv.setAttribute('data-label', updatedLabel);
            taskDiv.setAttribute('data-start_time', updatedStartTime);
            taskDiv.setAttribute('data-end_time', updatedEndTime);
            taskDiv.innerText = `${convertToET(updatedStartTime)} - ${convertToET(updatedEndTime)}`;

            modal.style.display = 'none';
        };
    }

    document.addEventListener("click", function(event) {
        // Check if the clicked element or its parent has the "day" class
        const dayElement = event.target.classList.contains("day")
            ? event.target
            : event.target.closest(".day");
    
        if (dayElement) {
            const selectedDate = parseInt(dayElement.dataset.date); // Get the timestamp from the clicked day
            const currentSunday = getSundayStartOfWeek(); // Get the current week's Sunday
            const daysDifference = (selectedDate - currentSunday) / (24 * 60 * 60); // Difference in days
            const calculatedWeekOffset = Math.floor(daysDifference / 7); // Convert to week offset
    
            console.log("Selected Date:", selectedDate);
            console.log("Calculated Week Offset:", calculatedWeekOffset);
    
            // Store the calculated week offset in localStorage
            localStorage.setItem("weekOffset", calculatedWeekOffset);
    
            // Redirect to the home page without the date query parameter
        }
    });
    document.getElementById('start_time').value = '';
    document.getElementById('end_time').value = '';

    // Attach click event listener to all .task-input-group elements
    const taskInputGroups = document.querySelectorAll('.task-input-group');
    console.log("Found .task-input-group elements:", taskInputGroups); // Debugging log

    taskInputGroups.forEach(group => {
        console.log("Attaching click event to:", group); // Debugging log

        group.addEventListener('click', function (event) {
            console.log("Click event triggered on .task-input-group"); // Debugging log

            // Check if the click is directly on an input
            if (event.target.tagName === 'INPUT' && event.target.type === 'datetime-local') {
                console.log("Direct click on input:", event.target.id); // Debugging log
                event.target.focus(); // Focus the clicked input
                try {
                    event.target.showPicker(); // Use showPicker() if supported
                } catch (e) {
                    console.warn("showPicker() is not supported in this browser.");
                }
                return;
            }

            // If the click is not directly on an input, find the closest input
            const input = event.target.closest('.task-input-group').querySelector('input[type="datetime-local"]');
            if (input) {
                console.log("Opening calendar for:", input.id); // Debugging log
                input.focus(); // Focus the input
                try {
                    input.showPicker(); // Use showPicker() if supported
                } catch (e) {
                    console.warn("showPicker() is not supported in this browser.");
                }
            } else {
                console.error("No datetime-local input found inside the group.");
            }
        });
    });
});
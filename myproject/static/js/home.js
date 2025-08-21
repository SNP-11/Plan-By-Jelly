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

    // Check for pending completion notification
    checkForCompletionNotification();

    // AI Integration Setup
    setupAIIntegration();

    // Check for pending completion notification after page reload
    function checkForCompletionNotification() {
        const pendingNotification = localStorage.getItem('pending_completion_notification');
        if (pendingNotification) {
            try {
                const completionData = JSON.parse(pendingNotification);

                // Check if notification is recent (within last 10 seconds to avoid stale notifications)
                const timeDiff = Date.now() - completionData.timestamp;
                if (timeDiff < 10000) {
                    // Show the completion notification
                    setTimeout(() => {
                        showTaskCompletionNotification(
                            completionData.taskName,
                            completionData.earnedXP,
                            completionData.suggestion
                        );
                    }, 500); // Small delay to ensure page is fully loaded
                }

                // Remove the pending notification
                localStorage.removeItem('pending_completion_notification');
            } catch (error) {
                console.error('Error parsing completion notification:', error);
                localStorage.removeItem('pending_completion_notification');
            }
        }
    }

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
    // Note: completeTask is called from the checkmark click handler in the modal


    function addTask(event) {
        // Debug: Check if elements are found
        console.log("Label input element:", $("input[name='label']"));
        console.log("Start time input element:", $("input[name='start_time']"));
        console.log("End time input element:", $("input[name='end_time']"));
        console.log("Urgency select element:", $("select#urgency"));
        console.log("Save task checkbox element:", $("input#save_task"));

        const start_time = convertToUTC($("input[name='start_time']").val());
        const end_time = convertToUTC($("input[name='end_time']").val());
        const label = $("input[name='label']").val();
        const urgency = $("select#urgency").val();
        const save_task = $("input#save_task").is(":checked") ? 1 : 0;

        // Debug logging with detailed values
        console.log("Form field values:");
        console.log("- Label input value:", label);
        console.log("- Start time input value:", $("input[name='start_time']").val());
        console.log("- End time input value:", $("input[name='end_time']").val());
        console.log("- Start time converted:", start_time);
        console.log("- End time converted:", end_time);
        console.log("- Urgency:", urgency);
        console.log("- Save task:", save_task);

        console.log("Adding task with data:", {
            label: label,
            start_time: start_time,
            end_time: end_time,
            urgency: urgency,
            save_task: save_task
        });

        // Validate required fields
        if (!label || !start_time || !end_time) {
            alert("Please fill in all required fields (label, start time, end time)");
            return;
        }

        $.post('/add_task', {
            label: label,
            start_time: start_time,
            end_time: end_time,
            urgency: urgency,
            save_task: save_task
        }, function(response) {
            if ($("input#save_task").is(":checked")) {
                let routines = localStorage.getItem("routines") ? parseInt(localStorage.getItem("routines")) : 0;
                localStorage.setItem("routines", routines + 1);
            }

            console.log("Task added successfully:", response);

            // Reload page immediately (consistent with removeTask/completeTask)
            window.location.reload();
        }).fail(function(xhr, status, error) {
            console.error("Failed to add task:", error);
            console.error("Response:", xhr.responseText);
            alert("Failed to add task. Please try again.");
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

    function completeTask(taskId) {
        console.log("Completing task with ID:", taskId);

        if (!taskId) {
            console.error("Task ID is missing. Cannot complete task.");
            return;
        }

        // Find the task data for time analysis
        const currentTask = savedTasks.find(task => task.id === `autoComplete${taskId}`) ||
                           tasks.find(task => task.id == taskId);

        if (!currentTask) {
            console.error("Task not found for completion analysis:", taskId);
            return;
        }

        // Calculate time metrics
        const currentTime = Math.floor(Date.now() / 1000);
        const estimatedDuration = currentTask.end_time - currentTask.start_time; // in seconds
        const actualDuration = currentTime - currentTask.start_time; // in seconds
        const estimatedMinutes = Math.round(estimatedDuration / 60);
        const actualMinutes = Math.round(actualDuration / 60);
        const actualHours = Math.floor(actualMinutes / 60);
        const remainingMinutes = actualMinutes % 60;

        // Calculate XP based on task difficulty and performance
        const baseXP = Math.max(5, Math.min(estimatedMinutes, 50)); // 5-50 XP based on estimated time
        const timeRatio = actualDuration / estimatedDuration;
        let xpMultiplier = 1.0;

        if (timeRatio <= 0.8) {
            xpMultiplier = 1.2; // Bonus for efficiency
        } else if (timeRatio <= 1.2) {
            xpMultiplier = 1.0; // Normal XP
        } else {
            xpMultiplier = 0.8; // Reduced XP for taking too long
        }

        const earnedXP = Math.round(baseXP * xpMultiplier);

        // Generate time analysis suggestion
        let suggestion = "";
        if (timeRatio < 0.5) {
            suggestion = "You may have completed this task too fast. Make sure you did your best work!";
        } else if (timeRatio < 0.8) {
            suggestion = "Great time management! You finished efficiently.";
        } else if (timeRatio <= 1.2) {
            suggestion = "Perfect timing! You completed this task as expected.";
        } else if (timeRatio <= 2.0) {
            const timeText = actualHours > 0 ? `${actualHours}h ${remainingMinutes}m` : `${actualMinutes}m`;
            suggestion = `This task took you ${timeText}. Consider breaking larger tasks into smaller parts next time.`;
        } else {
            const timeText = actualHours > 0 ? `${actualHours}h ${remainingMinutes}m` : `${actualMinutes}m`;
            suggestion = `This task took you ${timeText}. You might want to plan more time for similar tasks in the future.`;
        }

        // Store time tracking data for AI learning
        storeTimeTrackingData(currentTask, estimatedDuration, actualDuration, earnedXP);

        // Show completion notification
        showTaskCompletionNotification(currentTask.label, earnedXP, suggestion);

        // Remove the task from the savedTasks array
        const taskIndex = savedTasks.findIndex(task => task.id === `autoComplete${taskId}`);
        if (taskIndex !== -1) {
            savedTasks.splice(taskIndex, 1);
        }

        // Remove the task element from the DOM
        const taskElement = document.getElementById(`autoComplete${taskId}`);
        if (taskElement) {
            taskElement.remove();
        }

        // Remove any task divs in the schedule
        const taskDivs = document.querySelectorAll('.task-div');
        taskDivs.forEach(div => {
            if (div.getAttribute('data-id') == taskId) {
                div.remove();
            }
        });

        // Update points and streaks with earned XP
        let comp_points = localStorage.getItem("comp_points") ? parseInt(localStorage.getItem("comp_points")) : 0;
        let streaks = localStorage.getItem("streaks") ? parseInt(localStorage.getItem("streaks")) : 0;
        let tasksCompleted = localStorage.getItem("completed_tasks") ? parseInt(localStorage.getItem("completed_tasks")) : 0;
        let last_streak = localStorage.getItem("last_streak") ? localStorage.getItem("last_streak") : 0;
        let last_streak_time = parseInt(last_streak);

        localStorage.setItem("comp_points", comp_points + earnedXP);
        localStorage.setItem("completed_tasks", tasksCompleted + 1);
        $("#comp_points").text(comp_points + earnedXP);

        if (last_streak_time < (currentTime - 86400)) {
            localStorage.setItem("streaks", streaks + 1);
            localStorage.setItem("last_streak", currentTime);
            $("#streaks").text(streaks + 1);
        }

        // Send completion data to server
        $.post('/complete_task', {
            id: taskId,
            actual_duration: actualDuration,
            estimated_duration: estimatedDuration,
            earned_xp: earnedXP
        }, function (response) {
            console.log("Task completed:", response);

            // Delay reload to show notification for 5 seconds
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        });
    }

    // Remove task from UI immediately (Step 2 of completion flow)
    function removeTaskFromUI(taskId) {
        console.log("Removing task from UI:", taskId);

        // Remove from savedTasks array
        const taskIndex = savedTasks.findIndex(task => task.id === `autoComplete${taskId}`);
        if (taskIndex !== -1) {
            savedTasks.splice(taskIndex, 1);
        }

        // Remove the task element from the DOM
        const taskElement = document.getElementById(`autoComplete${taskId}`);
        if (taskElement) {
            taskElement.remove();
        }

        // Remove any task divs in the schedule
        const taskDivs = document.querySelectorAll('.task-div');
        taskDivs.forEach(div => {
            if (div.getAttribute('data-id') == taskId) {
                div.remove();
            }
        });
    }

    // Complete task with notification (Step 3 of completion flow)
    function completeTaskWithNotification(taskId) {
        console.log("Processing completion for task:", taskId);

        // Find the task data for time analysis
        const currentTask = savedTasks.find(task => task.id === `autoComplete${taskId}`) ||
                           tasks.find(task => task.id == taskId);

        if (!currentTask) {
            console.error("Task not found for completion analysis:", taskId);
            // Still proceed with basic completion
            basicTaskCompletion(taskId);
            return;
        }

        // Calculate time metrics and show notification
        const currentTime = Math.floor(Date.now() / 1000);
        const estimatedDuration = currentTask.end_time - currentTask.start_time;
        const actualDuration = currentTime - currentTask.start_time;
        const estimatedMinutes = Math.round(estimatedDuration / 60);
        const actualMinutes = Math.round(actualDuration / 60);
        const actualHours = Math.floor(actualMinutes / 60);
        const remainingMinutes = actualMinutes % 60;

        // Calculate XP
        const baseXP = Math.max(5, Math.min(estimatedMinutes, 50));
        const timeRatio = actualDuration / estimatedDuration;
        let xpMultiplier = 1.0;

        if (timeRatio <= 0.8) {
            xpMultiplier = 1.2;
        } else if (timeRatio <= 1.2) {
            xpMultiplier = 1.0;
        } else {
            xpMultiplier = 0.8;
        }

        const earnedXP = Math.round(baseXP * xpMultiplier);

        // Generate suggestion
        let suggestion = "";
        if (timeRatio < 0.5) {
            suggestion = "You may have completed this task too fast. Make sure you did your best work!";
        } else if (timeRatio < 0.8) {
            suggestion = "Great time management! You finished efficiently.";
        } else if (timeRatio <= 1.2) {
            suggestion = "Perfect timing! You completed this task as expected.";
        } else if (timeRatio <= 2.0) {
            const timeText = actualHours > 0 ? `${actualHours}h ${remainingMinutes}m` : `${actualMinutes}m`;
            suggestion = `This task took you ${timeText}. Consider breaking larger tasks into smaller parts next time.`;
        } else {
            const timeText = actualHours > 0 ? `${actualHours}h ${remainingMinutes}m` : `${actualMinutes}m`;
            suggestion = `This task took you ${timeText}. You might want to plan more time for similar tasks in the future.`;
        }

        // Store time tracking data
        storeTimeTrackingData(currentTask, estimatedDuration, actualDuration, earnedXP);

        // Show notification immediately after task removal
        showTaskCompletionNotification(currentTask.label, earnedXP, suggestion);

        // Update points and streaks
        updatePointsAndStreaks(earnedXP);

        // Send to server
        $.post('/complete_task', {
            id: taskId,
            actual_duration: actualDuration,
            estimated_duration: estimatedDuration,
            earned_xp: earnedXP
        }, function (response) {
            console.log("Task completed:", response);

            // Reload page after 5 seconds (after notification finishes)
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        });
    }

    // Basic task completion fallback
    function basicTaskCompletion(taskId) {
        updatePointsAndStreaks(10); // Default 10 XP

        $.post('/complete_task', { id: taskId }, function (response) {
            console.log("Task completed (basic):", response);

            // Reload page after 5 seconds
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        });
    }

    // Update points and streaks helper
    function updatePointsAndStreaks(earnedXP) {
        const currentTime = Math.floor(Date.now() / 1000);
        let comp_points = localStorage.getItem("comp_points") ? parseInt(localStorage.getItem("comp_points")) : 0;
        let streaks = localStorage.getItem("streaks") ? parseInt(localStorage.getItem("streaks")) : 0;
        let tasksCompleted = localStorage.getItem("completed_tasks") ? parseInt(localStorage.getItem("completed_tasks")) : 0;
        let last_streak = localStorage.getItem("last_streak") ? localStorage.getItem("last_streak") : 0;
        let last_streak_time = parseInt(last_streak);

        localStorage.setItem("comp_points", comp_points + earnedXP);
        localStorage.setItem("completed_tasks", tasksCompleted + 1);
        $("#comp_points").text(comp_points + earnedXP);

        if (last_streak_time < (currentTime - 86400)) {
            localStorage.setItem("streaks", streaks + 1);
            localStorage.setItem("last_streak", currentTime);
            $("#streaks").text(streaks + 1);
        }
    }

    // Complete task immediately and reload (new flow)
    function completeTaskImmediately(taskId) {
        console.log("Completing task immediately:", taskId);

        // Find the task data for completion analysis
        const currentTask = savedTasks.find(task => task.id === `autoComplete${taskId}`) ||
                           tasks.find(task => task.id == taskId);

        if (currentTask) {
            // Calculate completion data
            const currentTime = Math.floor(Date.now() / 1000);
            const estimatedDuration = currentTask.end_time - currentTask.start_time;
            const actualDuration = currentTime - currentTask.start_time;
            const estimatedMinutes = Math.round(estimatedDuration / 60);
            const actualMinutes = Math.round(actualDuration / 60);
            const actualHours = Math.floor(actualMinutes / 60);
            const remainingMinutes = actualMinutes % 60;

            // Calculate XP (max 15 XP)
            const baseXP = Math.max(3, Math.min(estimatedMinutes / 4, 15)); // Scale down base XP
            const timeRatio = actualDuration / estimatedDuration;
            let xpMultiplier = 1.0;

            if (timeRatio <= 0.5) {
                // Completed way too fast - might have rushed
                xpMultiplier = 0.2; // Very low XP (1-3 XP)
            } else if (timeRatio <= 0.8) {
                // Efficient completion
                xpMultiplier = 1.0;
            } else if (timeRatio <= 1.2) {
                // Normal completion
                xpMultiplier = 0.9;
            } else {
                // Took longer than expected
                xpMultiplier = 0.7;
            }

            const earnedXP = Math.max(1, Math.min(Math.round(baseXP * xpMultiplier), 15));

            // Generate suggestion
            let suggestion = "";
            if (timeRatio < 0.5) {
                suggestion = "You may have completed this task too fast. Make sure you did your best work!";
            } else if (timeRatio < 0.8) {
                suggestion = "Great time management! You finished efficiently.";
            } else if (timeRatio <= 1.2) {
                suggestion = "Perfect timing! You completed this task as expected.";
            } else if (timeRatio <= 2.0) {
                const timeText = actualHours > 0 ? `${actualHours}h ${remainingMinutes}m` : `${actualMinutes}m`;
                suggestion = `This task took you ${timeText}. Consider breaking larger tasks into smaller parts next time.`;
            } else {
                const timeText = actualHours > 0 ? `${actualHours}h ${remainingMinutes}m` : `${actualMinutes}m`;
                suggestion = `This task took you ${timeText}. You might want to plan more time for similar tasks in the future.`;
            }

            // Store completion data in localStorage to show after reload
            const completionData = {
                taskName: currentTask.label,
                earnedXP: earnedXP,
                suggestion: suggestion,
                timestamp: Date.now()
            };
            localStorage.setItem('pending_completion_notification', JSON.stringify(completionData));

            // Store time tracking data
            storeTimeTrackingData(currentTask, estimatedDuration, actualDuration, earnedXP);

            // Update points and streaks immediately
            updatePointsAndStreaks(earnedXP);

            // Send to server (don't wait for response)
            $.post('/complete_task', {
                id: taskId,
                actual_duration: actualDuration,
                estimated_duration: estimatedDuration,
                earned_xp: earnedXP
            });
        } else {
            // Fallback for missing task data
            const completionData = {
                taskName: "Task",
                earnedXP: 10,
                suggestion: "Great job completing your task!",
                timestamp: Date.now()
            };
            localStorage.setItem('pending_completion_notification', JSON.stringify(completionData));
            updatePointsAndStreaks(10);
            $.post('/complete_task', { id: taskId });
        }

        // Remove task from UI
        removeTaskFromUI(taskId);

        // Reload immediately
        window.location.reload();
    }

    // Store time tracking data for AI learning
    function storeTimeTrackingData(task, estimatedDuration, actualDuration, earnedXP) {
        const timeTrackingData = {
            taskLabel: task.label,
            subject: categorizeTaskAdvanced(task.label),
            estimatedDuration: estimatedDuration,
            actualDuration: actualDuration,
            timeRatio: actualDuration / estimatedDuration,
            earnedXP: earnedXP,
            timestamp: Date.now(),
            urgency: task.urgency || 'medium'
        };

        // Store in localStorage for AI learning
        let trackingHistory = JSON.parse(localStorage.getItem("time_tracking_history") || "[]");
        trackingHistory.push(timeTrackingData);

        // Keep only last 100 entries to prevent storage bloat
        if (trackingHistory.length > 100) {
            trackingHistory = trackingHistory.slice(-100);
        }

        localStorage.setItem("time_tracking_history", JSON.stringify(trackingHistory));
        console.log("Time tracking data stored:", timeTrackingData);
    }

    // Show task completion notification
    function showTaskCompletionNotification(taskName, xp, suggestion) {
        const notification = document.createElement('div');
        notification.className = 'task-completion-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="completion-header">
                    <span class="task-name">"${taskName}"</span> task completed!
                </div>
                <div class="xp-earned">+${xp} XP</div>
                <div class="suggestion">${suggestion}</div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
            z-index: 2000;
            max-width: 350px;
            font-family: Arial, sans-serif;
            animation: slideInRight 0.5s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500);
        }, 5000);
    }

    // Advanced task categorization function
    function categorizeTaskAdvanced(taskDescription) {
        if (!taskDescription) return 'general';

        const taskLower = taskDescription.toLowerCase();

        // Expanded categorization with comprehensive subjects
        const categories = {
            // Core Academic - Math
            'math': ['math', 'algebra', 'geometry', 'calculus', 'statistics', 'arithmetic', 'trigonometry', 'precalculus'],

            // Core Academic - Science
            'biology': ['biology', 'bio', 'life science', 'anatomy', 'genetics', 'ecology'],
            'chemistry': ['chemistry', 'chem', 'chemical', 'molecules', 'reactions', 'periodic table'],
            'physics': ['physics', 'mechanics', 'thermodynamics', 'electricity', 'magnetism', 'waves'],
            'science': ['science', 'earth science', 'environmental science', 'scientific method'],

            // Core Academic - Language Arts
            'english': ['english', 'language arts', 'literature', 'grammar', 'vocabulary', 'spelling'],
            'writing': ['writing', 'essay', 'composition', 'creative writing', 'journal', 'story'],
            'reading': ['reading', 'novel', 'book', 'comprehension', 'analysis'],

            // Core Academic - Social Studies
            'history': ['history', 'world history', 'american history', 'civil war', 'revolution'],
            'social_studies': ['social studies', 'government', 'civics', 'politics', 'democracy'],
            'geography': ['geography', 'maps', 'countries', 'capitals', 'continents'],
            'economics': ['economics', 'personal finance', 'money', 'budget', 'investment'],

            // Core Academic - Other
            'computer_science': ['computer science', 'coding', 'programming', 'python', 'java', 'html', 'css', 'javascript'],
            'foreign_language': ['spanish', 'french', 'latin', 'mandarin', 'chinese', 'german', 'italian', 'language'],
            'health': ['health', 'nutrition', 'wellness', 'safety', 'first aid'],

            // Arts & Creative
            'art': ['art', 'drawing', 'painting', 'sculpture', 'digital art', 'sketch', 'design'],
            'music': ['music', 'band', 'orchestra', 'choir', 'piano', 'guitar', 'violin', 'drums', 'music theory'],
            'theater': ['theater', 'drama', 'acting', 'play', 'performance', 'script'],

            // Physical & Sports
            'physical_education': ['pe', 'gym', 'physical education', 'fitness', 'exercise'],
            'sports_practice': ['soccer practice', 'basketball practice', 'tennis practice', 'track practice',
                              'swimming practice', 'baseball practice', 'football practice', 'practice'],
            'sports_game': ['soccer game', 'basketball game', 'tennis match', 'swim meet', 'track meet',
                          'baseball game', 'football game', 'game', 'match', 'meet', 'competition'],
            'dance': ['dance', 'ballet', 'jazz dance', 'hip hop', 'choreography', 'cheerleading'],
            'martial_arts': ['martial arts', 'karate', 'taekwondo', 'judo', 'kung fu', 'boxing'],

            // Clubs & Activities
            'debate': ['debate', 'model un', 'speech', 'public speaking', 'argumentation'],
            'robotics': ['robotics', 'robot', 'engineering', 'stem', 'coding club'],
            'student_government': ['student government', 'student council', 'leadership', 'class president'],
            'volunteering': ['volunteering', 'community service', 'volunteer', 'service work', 'charity'],
            'club_meeting': ['club meeting', 'chess club', 'coding club', 'cultural club', 'meeting'],

            // Academic Tasks
            'homework': ['homework', 'hw', 'assignment', 'worksheet', 'problem set'],
            'studying': ['studying', 'study', 'review', 'memorize', 'flashcards', 'notes'],
            'test_prep': ['test', 'quiz', 'exam', 'midterm', 'final', 'sat', 'act', 'standardized test'],
            'project': ['project', 'group project', 'science project', 'research project'],
            'essay_writing': ['essay', 'paper', 'research paper', 'report', 'thesis'],
            'presentation': ['presentation', 'present', 'powerpoint', 'slides', 'speech'],
            'lab_work': ['lab', 'laboratory', 'experiment', 'lab report'],
            'extra_credit': ['extra credit', 'bonus', 'additional work'],

            // Personal Development
            'tutoring': ['tutoring', 'tutor', 'help session', 'study group'],
            'college_prep': ['college application', 'scholarship', 'college prep', 'university'],
            'internship': ['internship', 'job shadowing', 'work experience'],
            'personal_growth': ['journaling', 'reflection', 'meditation', 'mindfulness'],

            // General Tasks
            'chores': ['chores', 'clean', 'organize', 'tidy', 'laundry', 'dishes'],
            'general': ['task', 'work', 'activity', 'assignment']
        };

        // Find the most specific match
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => taskLower.includes(keyword))) {
                return category;
            }
        }

        return 'general';
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
     * Convert a Flatpickr formatted time to a UTC timestamp
     * @param {string} localTime - The Flatpickr formatted time (e.g., "8/21--12:00 PM" or "2025-03-31T16:02")
     * @return {number} - The UTC timestamp in seconds
     */
    function convertToUTC(localTime) {
        if (!localTime) {
            console.error("convertToUTC: No time provided");
            return NaN;
        }

        console.log("Converting time:", localTime);

        // Handle Flatpickr format: "8/21--12:00 PM"
        if (localTime.includes('--')) {
            const [datePart, timePart] = localTime.split('--');
            const [month, day] = datePart.split('/');
            const currentYear = new Date().getFullYear();

            // Validate the time part
            console.log("Time part to parse:", timePart);

            // Check for invalid formats like "15:49 PM"
            const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (!timeMatch) {
                console.error("Invalid time format:", timePart);
                return NaN;
            }

            let [, hours, minutes, ampm] = timeMatch;
            hours = parseInt(hours);
            minutes = parseInt(minutes);

            // Validate hour range for 12-hour format
            if (hours < 1 || hours > 12) {
                console.error("Invalid hour for 12-hour format:", hours);
                return NaN;
            }

            // Convert to standard format: "8/21/2025 12:00 PM"
            const standardFormat = `${month}/${day}/${currentYear} ${hours}:${minutes.toString().padStart(2, '0')} ${ampm.toUpperCase()}`;
            console.log("Converted to standard format:", standardFormat);

            const localDate = new Date(standardFormat);
            if (isNaN(localDate.getTime())) {
                console.error("Failed to parse date:", standardFormat);
                return NaN;
            }

            const timestamp = localDate.getTime() / 1000;
            console.log("Final timestamp:", timestamp);
            return timestamp;
        }

        // Handle standard datetime-local format: "2025-03-31T16:02"
        const localDate = new Date(localTime);
        const timestamp = localDate.getTime() / 1000;
        console.log("Standard format timestamp:", timestamp);
        return timestamp;
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
            // Get the correct task ID from the modal's current task data
            const modal = document.getElementById("myModal");
            const taskId = modal.getAttribute('data-current-task-id');

            if (!taskId) {
                console.error("No task ID found in modal");
                return;
            }

            // Step 1: Close modal immediately
            modal.style.display = "none";

            // Step 2: Process completion and reload immediately
            completeTaskImmediately(taskId);
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

        // Store the task ID in the modal for the completion handler
        const modal = document.getElementById("myModal");
        modal.setAttribute('data-current-task-id', taskId);

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

            // Check if the click is directly on a text input (Flatpickr)
            if (event.target.tagName === 'INPUT' && event.target.type === 'text' && event.target.classList.contains('datetime-input')) {
                console.log("Direct click on datetime input:", event.target.id); // Debugging log
                event.target.focus(); // Focus the clicked input (Flatpickr will handle opening)
                return;
            }

            // If the click is not directly on an input, find the closest datetime input
            const input = event.target.closest('.task-input-group').querySelector('input.datetime-input');
            if (input) {
                console.log("Opening calendar for:", input.id); // Debugging log
                input.focus(); // Focus the input (Flatpickr will handle opening)
            } else {
                console.log("No datetime input found inside the group.");
            }
        });
    });

    // AI Integration Functions
    function setupAIIntegration() {
        // Add event listener for AI suggestion button
        const aiSuggestBtn = document.getElementById('ai-suggest-btn');
        if (aiSuggestBtn) {
            aiSuggestBtn.addEventListener('click', async function() {
                const labelInput = document.getElementById('label-input');
                const taskDescription = labelInput.value.trim();

                if (!taskDescription) {
                    alert('Please enter a task description first!');
                    return;
                }

                // Show loading state
                aiSuggestBtn.innerHTML = '🤖 Getting suggestion...';
                aiSuggestBtn.disabled = true;

                try {
                    // Get AI suggestion
                    const suggestion = await taskAI.getDurationSuggestion(taskDescription);

                    if (suggestion) {
                        // Show the suggestion in the UI
                        taskAI.showDurationSuggestion(suggestion, labelInput);
                    } else {
                        alert('Sorry, could not get AI suggestion. Please set times manually.');
                    }
                } catch (error) {
                    console.error('AI suggestion error:', error);
                    alert('Error getting AI suggestion. Please try again.');
                } finally {
                    // Reset button state
                    aiSuggestBtn.innerHTML = '🤖 Get AI Time Suggestion';
                    aiSuggestBtn.disabled = false;
                }
            });
        }
    }




});
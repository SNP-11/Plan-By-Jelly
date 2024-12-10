document.addEventListener('DOMContentLoaded', function() {
    // Initialize the sidebar state
    let isMenuOpen = true;

    // Function to update the days of the week displayed on the page
    function updateWeekdays() {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const todayDayIndex = today.getDay();
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
    updateWeekdays();
    setInterval(updateWeekdays, 24 * 60 * 60 * 1000);

    const now = new Date();
    const timeToMidnight = (24 * 60 * 60 * 1000) - (now.getHours() * 60 * 60 * 1000) - (now.getMinutes() * 60 * 1000) - (now.getSeconds() * 1000);
    setTimeout(function() {
        updateWeekdays();
        setInterval(updateWeekdays, 24 * 60 * 60 * 1000);
    }, timeToMidnight);

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
            modal.style.display = "none";
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

    function addTask(event) { 
        var start_time = $("input[name = 'start_time']").val()
        start_time = new Date(start_time).getTime() / 1000
        var end_time = $("input[name = 'end_time']").val()
        end_time = new Date(end_time).getTime() / 1000
        $.post('/add_task', {
            label: $("input[name = 'label']").val(),
            start_time: start_time,
            end_time: end_time,
            urgency: $("select#urgency").val(),
        }, function(response){
            alert(response);
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

    // Attach the toggleMenu function to the toggle button
    document.getElementById("toggleButton").onclick = toggleMenu;

    // Existing logic for AJAX request to fetch tasks
    $.ajax({
        type: "POST",
        url: "/get_tasks",
        success: function(data) {
            console.log(data); 
            
            data.forEach((task, index)=>{
                add_taskDiv(task);
            });
        }
    });

    function add_taskDiv(date){
        let start = parseInt(date.start_time);
        let end = parseInt(date.end_time);
        start = new Date(start *1000);
        end = new Date(end * 1000);
        $(".content").each(function () {
            //first find start day and end day
            let columnDate = $(this).data("date");
            // console.log(columnDate);
            let isEventInColumn = isSameDayEvent(columnDate, date.start_time, date.end_time)
            if (isEventInColumn){
                let newTaskDiv = document.createElement('div');
                newTaskDiv.className = 'smallDiv';
                newTaskDiv.setAttribute('data-id', date.id);
                newTaskDiv.setAttribute('data-uid', date.uid);
                newTaskDiv.setAttribute('data-label', date.label);
                newTaskDiv.setAttribute('data-start_time', date.start_time);
                newTaskDiv.setAttribute('data-end_time', date.end_time);
                newTaskDiv.setAttribute('data-urgency', date.urgency);
                // newTaskDiv.innerText = start.toLocaleString() + " ~ " + end.toLocaleString();
                newTaskDiv.addEventListener("mouseover", (event) => clickDiv(event));
                newTaskDiv.addEventListener("mouseleave", (event) => clickDiv(event));
                newTaskDiv.addEventListener('dblclick', (event) => dblClickDiv(event));
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
            taskDiv.innerText = new Date(updatedStartTime * 1000).toLocaleString() + " ~ " + new Date(updatedEndTime * 1000).toLocaleString();
    
            // Close the modal
            modal.style.display = 'none';
        };
    }

});  

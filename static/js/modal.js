document.addEventListener('DOMContentLoaded', function() {
    const plusButton = document.querySelector('.plus-button');
    const addButton = document.querySelector('.add-button');
    const reminderBox = document.querySelector('.reminder-box');
    const rectangleContainer = document.querySelector('.left-column');
    const editButton = document.querySelector('.edit-button');
    const displayBox = document.querySelector('.display-box');
    let editingMode = true;

    // Adding a new task
    plusButton.addEventListener('click', () => {
        const newTask = document.createElement('div');
        newTask.classList.add('rectangle');
        newTask.textContent = 'New Task';
        newTask.contentEditable = false;
        rectangleContainer.insertBefore(newTask, plusButton);

        // Attach modal opening event to the new task
        newTask.addEventListener('click', (event) => {
            if (!editingMode) {
                modal.style.display = 'block';
            }
        });
    });
    
    document.getElementById("addButton").addEventListener('click', () => {
        $.post('add_task', {
            label: $("input['label']"),
            start_time: $("input['start_time']"),
            end_time: $("input['end_time']"),
            urgency: $("select#urgency"),
        }, function(response){
            alert(response)
        });
    });

    // Toggle edit mode
    editButton.addEventListener('click', () => {
        editingMode = !editingMode;
        const rectangles = document.querySelectorAll('.rectangle');
        if (editingMode) {
            editButton.textContent = 'Save';
            rectangles.forEach(rectangle => {
                rectangle.contentEditable = true;
                rectangle.classList.add('editable');
            });
        } else {
            editButton.textContent = 'Edit';
            rectangles.forEach(rectangle => {
                rectangle.contentEditable = false;
                rectangle.classList.remove('editable');
            });
        }
    });

    // Display the text of the clicked button (if not in edit mode)
    rectangleContainer.addEventListener('click', (event) => {
        if (!editingMode && event.target.classList.contains('rectangle')) {
            displayBox.textContent = `Button Pressed: ${event.target.textContent}`;
        }
    });

    // JavaScript for input label animation
    const inputs = document.querySelectorAll(".input-container input");
    inputs.forEach(input => {
        input.addEventListener("focus", () => {
            input.previousElementSibling.classList.add("active");
        });
        input.addEventListener("blur", () => {
            if (input.value === "") {
                input.previousElementSibling.classList.remove("active");
            }
        });
    });

    // Function to send task text to the server and update smallDiv
    function sendTaskText(taskText) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/update_task_text", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                console.log("Server response:", response);
                // Optionally update the UI here
            } else if (xhr.readyState == 4) {
                console.error("Error:", xhr.statusText);
            }
        };

        xhr.send("task_text=" + encodeURIComponent(taskText));
    }

    // Modal functionality
    let modal = document.getElementById("myModal");
    let modalContent = document.getElementById("modalContent");
    let closeBtn = document.getElementById("closeBtn");

    // Event delegation to handle dynamically created tasks
    rectangleContainer.addEventListener('click', function(event) {
        if (!editingMode && event.target.classList.contains('rectangle')) {
            modal.style.display = "block";
        }
    });

    // Close the modal
    closeBtn.onclick = function() {
        modal.style.display = "none";
    };

    // Allow dragging
    let isDragging = false, offsetX, offsetY;

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
});

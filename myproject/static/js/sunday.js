document.addEventListener('DOMContentLoaded', function() {
    const plusButton = document.querySelector('.plus-button');
    const addButton = document.querySelector('.add-button');
    const reminderBox = document.querySelector('.reminder-box');
    const rectangleContainer = document.querySelector('.left-column');
    const editButton = document.querySelector('.edit-button');
    const displayBox = document.querySelector('.display-box');
    let editingMode = false;

    // Adding a new task
    plusButton.addEventListener('click', () => {
        const newTask = document.createElement('div');
        newTask.classList.add('rectangle');
        newTask.textContent = 'New Task';
        newTask.contentEditable = false;
        rectangleContainer.insertBefore(newTask, plusButton);
    });

    // Toggle edit mode
    editButton.addEventListener('click', () => {
        editingMode = !editingMode;
        const rectangles = document.querySelectorAll('.rectangle');
        if (editingMode) {
            sendTaskText(); // input.value as param
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

    // Display the text of the clicked button
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
            if (xhr.readyState == 4) {
                console.log("XHR Status:", xhr.status);
                if (xhr.status == 200) {
                    var response = JSON.parse(xhr.responseText);
                    console.log("Server response:", response);
                    //updateSmallDiv(response.task_text);
                } else {
                    console.error("Error:", xhr.statusText);
                }
            }
        };

        xhr.send("task_text=" + encodeURIComponent(taskText));
    }    
});

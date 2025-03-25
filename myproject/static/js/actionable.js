const colordict = {
    "Very Urgent": "red",
    "Urgent": "orange",
    "Not Urgent": "green"
}

let clickTimeout = null;
let isDblClick = false;

function loadE(elem){
    let start = parseInt(elem.dataset.start_time);
    let end = parseInt(elem.dataset.end_time);

    elem.addEventListener('mouseenter', function () {
        elem.style.zIndex = '1'; // Bring the smallDiv to the front
    });

    elem.addEventListener('mouseleave', function () {
        if (!elem.classList.contains('expanded')) {
            elem.style.zIndex = '0'; // Reset the smallDiv's z-index
            elem.classList.remove('expanded'); // Ensure the smallDiv collapses
        }
    });

    const label = document.createElement('div');
    label.classList.add("label");
    label.textContent=elem.dataset.label;
    elem.appendChild(label);



    const start_time = document.createElement('div');
    start_time.classList.add("start_time");
    start_time.textContent="start: " + convertUnixToReadable(start);
    elem.appendChild(start_time);

    const end_time = document.createElement('div');
    end_time.classList.add("end_time");
    end_time.textContent=" end: " + convertUnixToReadable(end);
    elem.appendChild(end_time);

    const urgent = document.createElement('div');
    urgent.classList.add("urgency");
    urgent.textContent= elem.dataset.urgency;
    elem.appendChild(urgent);
    elem.classList.add(colordict[elem.dataset.urgency]);

    const save_task = document.createElement('div');
    urgent.classList.add("save_task");
    urgent.textContent= elem.dataset.save_task;
    elem.appendChild(save_task);

    elem.addEventListener('dblclick', dblClickDiv);

}

function clickDiv(event){
    clickTimeout = setTimeout(() => {
        if (!isDblClick){
            const elem = event.srcElement;
            toggleDiv(elem);
            isDblClick = false;}
    }, 0);
}

function dblClickDiv(event) {
    clearTimeout(clickTimeout);

    // Use event.currentTarget to ensure the parent div is used
    const elem = event.currentTarget;

    // Explicitly collapse the div before opening the modal
    elem.classList.remove('expanded');
    elem.style.zIndex = '0';


    let start = parseInt(elem.dataset.start_time);
    let end = parseInt(elem.dataset.end_time);

    // Adjust Unix timestamps to local time
    const startLocal = new Date(start * 1000);
    const endLocal = new Date(end * 1000);

    // Format the local time as "YYYY-MM-DDTHH:MM" for input fields
    const startISO = `${startLocal.getFullYear()}-${String(startLocal.getMonth() + 1).padStart(2, '0')}-${String(startLocal.getDate()).padStart(2, '0')}T${String(startLocal.getHours()).padStart(2, '0')}:${String(startLocal.getMinutes()).padStart(2, '0')}`;
    const endISO = `${endLocal.getFullYear()}-${String(endLocal.getMonth() + 1).padStart(2, '0')}-${String(endLocal.getDate()).padStart(2, '0')}T${String(endLocal.getHours()).padStart(2, '0')}:${String(endLocal.getMinutes()).padStart(2, '0')}`;

    openTaskM();

    // Populate modal fields with task data
    $("#label-input").val(elem.dataset.label);
    $("#start_time").val(startISO);
    $("#end_time").val(endISO);
    $("#urgency").val(elem.dataset.urgency);
    $("#save_task").prop("checked", elem.dataset.save_task === "true");
    document.getElementById('removeButton').dataset.task_id = elem.dataset.id;

    toggleDiv(elem);
}

const convertUnixToReadable = (unixTimestamp) => {
    const date = new Date(unixTimestamp * 1000);

    const formatter = new Intl.DateTimeFormat('en-US', {
        hour:'2-digit',
        minute:'2-digit',
        hour12: true
    });
    return (formatter.format(date))

    // Get day of the week and month name using arrays
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()];
    
    // Extract year, day, and time components
    const year = date.getFullYear();
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(formatter.format(date).getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    // Format the full readable date as "Day DD Month YYYY HH:MM:SS"
    // return `${dayOfWeek} ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds}`;
    return `${hours}:${minutes}`;


}



function toggleDiv(elem) {
    elem.classList.toggle("expanded");
}

function openTaskM() {
    // Clear the form fields
    $("#label-input").val(""); // Clear the label input
    $("#start_time").val(""); // Clear the start time input
    $("#end_time").val(""); // Clear the end time input
    $("#urgency").val(""); // Clear the urgency dropdown
    $("#save_task").prop("checked", false); // Uncheck the save task checkbox
    document.getElementById('removeButton').dataset.task_id = ""; // Clear the task ID

    // Display the modal
    document.getElementById("myModal").style.display = "block";

    // Collapse all smallDivs
    document.querySelectorAll('div.smallDiv').forEach(function (elem) {
        elem.classList.remove('expanded');
    });
}

function closeTaskModal() {
    document.getElementById("myModal").style.display = "none";
};

document.getElementById("addButton").addEventListener("click", function () {
    // Perform the add task logic here
    closeTaskModal(); // Close the modal after adding the task
});

document.getElementById("removeButton").addEventListener("click", function () {
    // Perform the delete task logic here
    closeTaskModal(); // Close the modal after deleting the task
});

// newTaskDiv.setAttribute('data-id', date.id);
//                 newTaskDiv.setAttribute('data-uid', date.uid);
//                 newTaskDiv.setAttribute('data-label', date.label);
//                 newTaskDiv.setAttribute('data-start_time', date.start_time);
//                 newTaskDiv.setAttribute('data-end_time', date.end_time);
function loadE(elem){
    let start = parseInt(elem.dataset.start_time);
    let end = parseInt(elem.dataset.end_time);

    const urgent = document.createElement('div');
    urgent.classList.add("urgency");
    elem.appendChild(urgent);

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
}

function hoverE(event){
    const elem = event.srcElement;
    toggleDiv(elem);
}

function clickDiv(event) { 
    const elem = event.srcElement;
    let start = parseInt(elem.dataset.start_time);
    let end = parseInt(elem.dataset.end_time);
    start = new Date(start *1000);
    end = new Date(end * 1000);
    start = start.toISOString().slice(0, 16);
    end = end.toISOString().slice(0, 16);
    openTaskM();
    $("#label-input").val(elem.dataset.label);
    $("#start_time").val(start);
    $("#end_time").val(end);
    $("#urgency").val(elem.dataset.urgency);
}

// function convertUnixToReadable(unixTimestamp) {
//     const date = new Date(unixTimestamp * 1000);

//     // Extract individual date and time components
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
//     const day = String(date.getDate()).padStart(2, '0');
//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     const seconds = String(date.getSeconds()).padStart(2, '0');

//     // Format the date and time as "YYYY-MM-DD HH:MM:SS"
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
// }

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
    document.getElementById("myModal").style.display = "block";
}

function closeTaskModal() {
    document.getElementById("myModal").style.display = "none";
};


// newTaskDiv.setAttribute('data-id', date.id);
//                 newTaskDiv.setAttribute('data-uid', date.uid);
//                 newTaskDiv.setAttribute('data-label', date.label);
//                 newTaskDiv.setAttribute('data-start_time', date.start_time);
//                 newTaskDiv.setAttribute('data-end_time', date.end_time);
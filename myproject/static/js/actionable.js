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

      elem.addEventListener('mouseenter', function() {
        console.log('Mouse entered:', this);
        const wrapper = this.closest('.wrapper');
        if (wrapper) {
          wrapper.style.zIndex = '1';
        }
      });
  
      elem.addEventListener('mouseleave', function() {
        console.log('Mouse left:', this);
        const wrapper = this.closest('.wrapper');
        if (wrapper) {
          wrapper.style.zIndex = '0';
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
    isDblClick = true;
    setTimeout(() => {
        isDblClick = false;
    },200);
    clearTimeout(clickTimeout);
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
    $("#save_task").val(true);
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
    document.getElementById("myModal").style.display = "block";
    document.querySelectorAll('div.smallDiv').forEach(function(elem){
        elem.classList.remove('expanded');
    });       
}

function closeTaskModal() {
    document.getElementById("myModal").style.display = "none";
};

// newTaskDiv.setAttribute('data-id', date.id);
//                 newTaskDiv.setAttribute('data-uid', date.uid);
//                 newTaskDiv.setAttribute('data-label', date.label);
//                 newTaskDiv.setAttribute('data-start_time', date.start_time);
//                 newTaskDiv.setAttribute('data-end_time', date.end_time);
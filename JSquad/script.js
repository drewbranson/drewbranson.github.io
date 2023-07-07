// script.js

// Function to read and parse the CSV file
function readCSV(file, callback) {
    const rawFile = new XMLHttpRequest();
    rawFile.open('GET', file, true);
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4 && rawFile.status === 200) {
        const allText = rawFile.responseText;
        const rows = allText.split('\n');
        const eventsData = [];
  
        for (let i = 0; i < rows.length; i++) {
          const columns = rows[i].split(',');
          if (columns.length >= 2) {
            const date = columns[0].trim();
            const event = columns[1].trim();
            eventsData.push({ date, event });
          }
        }
  
        callback(eventsData);
      }
    };
    rawFile.send(null);
  }
  
  // Function to generate the calendar with events
  function generateCalendar(events) {
    const calendarContainer = document.getElementById('calendar');
    calendarContainer.innerHTML = '';
  
    // Get the current month and year
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
  
    // Create the calendar header
    const header = document.createElement('h2');
    header.textContent = `${new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    calendarContainer.appendChild(header);
  
    // Create the table for the calendar
    const calendarTable = document.createElement('table');
  
    // Create the table header with day names
    const tableHeader = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(dayName => {
      const th = document.createElement('th');
      th.textContent = dayName;
      headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);
    calendarTable.appendChild(tableHeader);
  
    // Create the table body with calendar days
    const tableBody = document.createElement('tbody');
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let day = 1;
  
    // Create the calendar rows and cells
    for (let i = 0; i < 6; i++) {
      const row = document.createElement('tr');
  
      for (let j = 0; j < 7; j++) {
        const cell = document.createElement('td');
        cell.classList.add('day-box');
  
        if (i === 0 && j < firstDayOfMonth) {
          // Empty cells before the first day of the month
          cell.textContent = '';
        } else if (day > daysInMonth) {
          // Empty cells after the last day of the month
          cell.textContent = '';
        } else {
          // Calendar day cells
          cell.textContent = day;
  
          // Check if there are events for the current day
          const eventsForDay = events.filter(event => {
            const eventDate = new Date(`${day}-${currentMonth + 1}-${currentYear}`).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
            return event.date === eventDate;
          });
  
          // Display events for the current day
          if (eventsForDay.length > 0) {
            const eventList = document.createElement('ul');
            eventsForDay.forEach(event => {
              const eventItem = document.createElement('li');
              eventItem.textContent = event.event;
              eventList.appendChild(eventItem);
            });
            cell.appendChild(eventList);
          }
  
          day++;
        }
  
        row.appendChild(cell);
      }
  
      tableBody.appendChild(row);
    }
  
    calendarTable.appendChild(tableBody);
    calendarContainer.appendChild(calendarTable);
  }
  
  function showDayActivities(day) {
    alert(`Activities for day ${day}`);
  }
  
  function setupNavigation(events) {
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
  
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
  
    prevMonthButton.addEventListener('click', function () {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      generateCalendar(events);
    });
  
    nextMonthButton.addEventListener('click', function () {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      generateCalendar(events);
    });
  
    generateCalendar(events);
  }
  
  // Read and parse the CSV file, then setup the calendar with events
  readCSV('./eventsData/MusicInThePark.csv', function (events) {
    setupNavigation(events);
  });
  
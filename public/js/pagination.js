window.currentPage = 1;
let totalPages = 1;

function getCurrentPage() {
  return (typeof window.currentPage !== 'undefined' && window.currentPage) ? window.currentPage : 1;
}

function loadStudents(page = 1) {
  fetch(`/table/students?page=${page}`)
    .then(response => response.json())
    .then(data => {
      updateTableRows(data.students); // You must implement this to render the table
      window.currentPage = data.current_page;
      totalPages = data.total_pages;
      updatePagination();
    });
}

function updateTableRows(students) {
  const studentsTable = document.querySelector('.students-table');
  // Remove all rows except the header
  studentsTable.querySelectorAll('tr:not(:first-child)').forEach(row => row.remove());

  students.forEach(student => {
    const tr = document.createElement('tr');
    tr.dataset.student_id = student.id;
    tr.dataset.username = student.username;

    // Checkbox cell
    const tdCheckbox = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', 'Select student');
    tdCheckbox.appendChild(checkbox);

    // Group cell
    const tdGroup = document.createElement('td');
    tdGroup.textContent = student.group;

    // Name cell
    const tdName = document.createElement('td');
    tdName.textContent = `${student.first_name} ${student.last_name}`;

    // Gender cell
    const tdGender = document.createElement('td');
    tdGender.textContent = student.gender;

    // Birthday cell
    const tdBirthday = document.createElement('td');
    // Format date as DD.MM.YYYY
    const dateObj = new Date(student.birthdate);
    const formattedDate = dateObj.toLocaleDateString('en-GB').split('/').join('.');
    tdBirthday.textContent = formattedDate;

    // Status cell
    const tdStatus = document.createElement('td');
    const statusMarker = document.createElement('div');
    statusMarker.className = 'status-marker';
    if (student.status === 'active') {
      statusMarker.classList.add('active');
      statusMarker.setAttribute('aria-label', 'User is logged in');
    } else {
      statusMarker.classList.add('inactive');
      statusMarker.setAttribute('aria-label', 'User is logged out');
    }
    tdStatus.appendChild(statusMarker);

    // Options cell
    const tdOptions = document.createElement('td');
    tdOptions.className = 'student-options';

    // Edit button
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'student-options-button edit-icon';
    editButton.setAttribute('aria-label', 'Edit student');
    editButton.onclick = window.studentOperations.editStudent;

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'student-options-button delete-icon';
    deleteButton.setAttribute('aria-label', 'Delete student');
    deleteButton.onclick = window.studentOperations.deleteStudent;

    tdOptions.appendChild(editButton);
    tdOptions.appendChild(deleteButton);

    // Append all cells to row
    tr.appendChild(tdCheckbox);
    tr.appendChild(tdGroup);
    tr.appendChild(tdName);
    tr.appendChild(tdGender);
    tr.appendChild(tdBirthday);
    tr.appendChild(tdStatus);
    tr.appendChild(tdOptions);

    studentsTable.appendChild(tr);
  });

  // Re-initialize checkboxes and option buttons if needed
  if (window.studentOperations && window.studentOperations.initializeButtons) {
    window.studentOperations.initializeButtons();
  }
}

function updatePagination() {
  const pageNumbers = document.getElementById('pageNumbers');
  if (!pageNumbers) return;
  pageNumbers.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.classList.add('table-navigation-button');
    if (i === getCurrentPage()) {
      btn.classList.add('active');
      btn.disabled = true;
    }
    btn.onclick = () => loadStudents(i);
    pageNumbers.appendChild(btn);
  }

  document.getElementById('prevPageBtn').disabled = getCurrentPage() === 1;
  document.getElementById('nextPageBtn').disabled = getCurrentPage() === totalPages;
}

document.getElementById('prevPageBtn').onclick = () => {
  if (getCurrentPage() > 1) loadStudents(getCurrentPage() - 1);
};

document.getElementById('nextPageBtn').onclick = () => {
  if (getCurrentPage() < totalPages) loadStudents(getCurrentPage() + 1);
};

window.loadStudents = loadStudents;
window.getCurrentPage = getCurrentPage;
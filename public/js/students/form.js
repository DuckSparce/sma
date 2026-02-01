let students = [];
let nextId = 5;

document.addEventListener('DOMContentLoaded', function() {
  const addStudentBtn = document.getElementById('addStudentBtn');

  // Form items
  const closeFormBtn = document.getElementById('closeFormBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const studentForm = document.getElementById('studentForm');
  const form = studentForm.querySelector('form');
  const studentsTable = document.querySelector('.students-table');
  const formTitle = studentForm.querySelector('.form-header h3');
  const submitBtn = form.querySelector('.submit-btn');
  
  let isEditMode = false; 
  let currentEditRow = null;
  
  let selectAllCheckbox = studentsTable.querySelector('tr')
      .querySelector('th:first-child').querySelector('input[type="checkbox"]');
  
  // function reloadStudentsTable() {
  //   fetch('/table/students')
  //     .then(response => {
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! Status: ${response.status}`);
  //       }
  //       return response.json();
  //     })
  //     .then(data => {
  //       console.log('Students reloaded');
        
  //       // Clear existing table rows (except header)
  //       const rows = studentsTable.querySelectorAll('tr:not(:first-child)');
  //         rows.forEach(row => row.remove());
          
  //         data.forEach(student => {
  //           addStudentToTable(student);
  //       });
        
  //       // Reinitialize buttons and checkboxes
  //       initializeButtons();
  //     })
  //     .catch(error => {
  //       console.error('Error loading students data:', error);
  //     });
  // }

  window.loadStudents(window.getCurrentPage());

  // Handle select all checkbox
  selectAllCheckbox.addEventListener('change', function() {
    const checkboxes = studentsTable.querySelectorAll('td input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  });
  
  function updateSelectAllCheckbox() {
    const checkboxes = studentsTable.querySelectorAll('td input[type="checkbox"]');
    const checkedBoxes = studentsTable.querySelectorAll('td input[type="checkbox"]:checked');
    
    selectAllCheckbox.checked = checkboxes.length > 0 && checkboxes.length === checkedBoxes.length;
    selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
  }
  
  function initializeCheckboxes() {
    const checkboxes = studentsTable.querySelectorAll('td input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateSelectAllCheckbox);
    });
  }

  function openForm(mode = 'add', studentData = null) {
    modalOverlay.classList.add('visible');
    studentForm.classList.add('open');
    
    isEditMode = mode === 'edit';
    
    formTitle.textContent = isEditMode ? 'Edit Student' : 'Add New Student';
    submitBtn.textContent = isEditMode ? 'Update' : 'Create';
    
    if (isEditMode && studentData) {
      fillFormWithStudentData(studentData, true);
    }
  }

  function closeForm() {
    studentForm.classList.remove('open');
    modalOverlay.classList.remove('visible');
    
    form.reset();
    isEditMode = false;
    currentEditRow = null;
  }
  
  function fillFormWithStudentData(studentData, isEditMode = false) {
    form.querySelector('#studentGroup').value = studentData.group;
    form.querySelector('#studentFirstName').value = studentData.first_name;
    form.querySelector('#studentLastName').value = studentData.last_name;
    form.querySelector('#studentGender').value = studentData.gender;
    form.querySelector('#studentBirthdate').value = studentData.birthdate;
    form.querySelector('#studentUsername').value = studentData.username;

    const usernameInput = form.querySelector('#studentUsername');
    usernameInput.value = studentData.username || '';
    usernameInput.readOnly = isEditMode;
  }
  
  function extractStudentDataFromRow(row) {
    const cells = row.querySelectorAll('td');
    const nameCell = cells[2].textContent.trim();
    const nameParts = nameCell.split(' ');
    
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    const birthdayText = cells[4].textContent.trim();
    const [day, month, year] = birthdayText.split('.');
    const formattedBirthday = `${year}-${month}-${day}`;
    
    return {
      id: row.dataset.student_id,
      group: cells[1].textContent.trim(),
      first_name: firstName,
      last_name: lastName,
      gender: cells[3].textContent.trim(),
      birthdate: formattedBirthday,
      username: row.dataset.username
    };
  }

  function formatDate(inputDate) {
    const date = new Date(inputDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  }

  function createStudentRow(studentData) {
    const tr = document.createElement('tr');
    // Add student_id as a data attribute to the row
    tr.dataset.student_id = studentData.id;
    
    const tdCheckbox = document.createElement('td');
    const checkbox = document.createElement('input');
    
    checkbox.setAttribute('aria-label', 'Select student');
    checkbox.addEventListener('change', updateSelectAllCheckbox);
    
    const checkboxName = 'student' + studentData.id + '-checkbox';
    checkbox.setAttribute('id', checkboxName);

    tdCheckbox.appendChild(checkbox);
    
    const tdGroup = document.createElement('td');
    tdGroup.textContent = studentData.group;
    tdGroup.setAttribute('aria-label', 'Student group');

    const tdName = document.createElement('td');
    tdName.textContent = `${studentData.first_name} ${studentData.last_name}`;
    tdName.setAttribute('aria-label', 'Student name');

    const tdGender = document.createElement('td');
    tdGender.textContent = studentData.gender;
    tdGender.setAttribute('aria-label', 'Student gender');

    const tdBirthday = document.createElement('td');
    tdBirthday.textContent = formatDate(studentData.birthdate);
    tdBirthday.setAttribute('aria-label', 'Student birthday');

    const tdStatus = document.createElement('td');
    tdStatus.setAttribute('aria-label', 'Student status');
    const statusMarker = document.createElement('div');
    statusMarker.className = 'status-marker';
    
    if (studentData.status === 'active') {
      statusMarker.classList.add('active');   // green
      statusMarker.setAttribute('aria-label', 'You are logged in');
    } else {
      statusMarker.classList.add('inactive'); // red
      statusMarker.setAttribute('aria-label', 'Not logged in');
    }
    
    tdStatus.appendChild(statusMarker);
    
    // Options cell
    const tdOptions = document.createElement('td');
    tdOptions.className = 'student-options';
    tdOptions.setAttribute('aria-label', 'Student options');
    
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'student-options-button edit-icon';
    editButton.setAttribute('aria-label', 'Edit student');
    
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'student-options-button delete-icon';
    deleteButton.setAttribute('aria-label', 'Delete student');
    
    tdOptions.appendChild(editButton);
    tdOptions.appendChild(deleteButton);
    
    // Add all cells to row
    tr.appendChild(tdCheckbox);
    tr.appendChild(tdGroup);
    tr.appendChild(tdName);
    tr.appendChild(tdGender);
    tr.appendChild(tdBirthday);
    tr.appendChild(tdStatus);
    tr.appendChild(tdOptions);
    
    return tr;
  }

  function addStudentToTable(studentData) {
    if (isEditMode && currentEditRow) {
      // Update the existing row
      const cells = currentEditRow.querySelectorAll('td');
      
      if (studentData.id) {
        currentEditRow.dataset.student_id = studentData.id;
      }
      
      cells[1].textContent = studentData.group;
      cells[2].textContent = `${studentData.first_name} ${studentData.last_name}`;
      cells[3].textContent = studentData.gender;
      cells[4].textContent = formatDate(studentData.birthdate);
      
      return;
    }
    
    const newRow = createStudentRow(studentData);
    studentsTable.appendChild(newRow);
  }
  
  async function editStudent(event) {
    if (!window.isLoggedIn) {
      window.location.href = '/login';
      return;
    }

    const editButton = event.currentTarget;
    const row = editButton.closest('tr');
    currentEditRow = row;

    const studentId = row.dataset.student_id;
    
    const response = await fetch(`/api/student/${studentId}`);
    const studentData = await response.json();
    
    openForm('edit', studentData);
  }
  
  function initializeDeleteButtons() {
    // Initialize delete buttons for existing students when page loads
    document.querySelectorAll('.delete-icon').forEach(button => {
      // Remove existing event listeners to prevent duplicates
      button.removeEventListener('click', window.studentOperations.deleteStudent);
      button.addEventListener('click', window.studentOperations.deleteStudent);
    });
  }

  function initializeButtons() {
    const editButtons = document.querySelectorAll('.edit-icon');
    editButtons.forEach(button => {
      // Remove existing event listeners to prevent duplicates
      button.removeEventListener('click', editStudent);
      // Add fresh event listener
      button.addEventListener('click', editStudent);
    });
    
    initializeCheckboxes();
    
    initializeDeleteButtons();
  }
  
  if(addStudentBtn) {
    addStudentBtn.addEventListener('click', () => openForm('add'));
  }

  closeFormBtn.addEventListener('click', closeForm);
  cancelBtn.addEventListener('click', closeForm);
  
  // Update the overlay click listener to close form
  modalOverlay.addEventListener('click', function() {
    if (studentForm.classList.contains('open')) {
      closeForm();
    }
  });

  // Prevent closing when clicking on the form itself
  studentForm.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Remove previous error messages
    form.querySelectorAll('.validation-error').forEach(el => el.remove());

    // Collect form data
    const formData = new FormData(form);
    const studentData = {};
    formData.forEach((value, key) => {
      studentData[key] = value;
    });
    
    if (isEditMode && currentEditRow) {
      // Add the student ID for edit operations
      studentData.id = currentEditRow.dataset.student_id;
    }

    // console.log(isEditMode ? 'Updating student:' : 'New student data:', studentData);
    
    if (isEditMode && currentEditRow) {
      fetch('/edit-student', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(studentData)
      })
      .then(async response => {
        if (response.status === 422) {
          // Validation error
          const data = await response.json();
          if (data.errors) {
            // Clear any previous general errors
            const generalErrorsDiv = document.getElementById('generalErrors');
            if (generalErrorsDiv) {
              generalErrorsDiv.textContent = '';
            }
            
            // Display errors under each field
            Object.entries(data.errors).forEach(([field, messages]) => {
              if (field === 'duplicate' && generalErrorsDiv) {
                // Handle duplicate student error specially
                generalErrorsDiv.textContent = messages.join(' ');
              } else {
                const input = form.querySelector(`[name="${field}"]`);
                if (input) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'validation-error';
                  errorDiv.style.color = 'red';
                  errorDiv.style.fontSize = '13px';
                  errorDiv.textContent = messages.join(' ');
                  input.parentNode.appendChild(errorDiv);
                }
              }
            });
          }
          throw new Error('Validation failed');
        }
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        closeForm();
        window.loadStudents(window.getCurrentPage());
      })
      .catch(error => {
        // Only log unexpected errors
        if (error.message !== 'Validation failed') {
          console.error('Error:', error);
        }
      });
    } else {
      fetch('/add-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(studentData)
      })
      .then(async response => {
        if (response.status === 422) {
          // Validation error
          const data = await response.json();
          if (data.errors) {
            // Clear any previous general errors
            const generalErrorsDiv = document.getElementById('generalErrors');
            if (generalErrorsDiv) {
              generalErrorsDiv.textContent = '';
            }
            
            // Display errors under each field
            Object.entries(data.errors).forEach(([field, messages]) => {
              if (field === 'duplicate' && generalErrorsDiv) {
                console.log('Found duplicate error, setting message');
                generalErrorsDiv.textContent = messages.join(' ');
              } else {
                const input = form.querySelector(`[name="${field}"]`);
                if (input) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'validation-error';
                  errorDiv.style.color = 'red';
                  errorDiv.style.fontSize = '13px';
                  errorDiv.textContent = messages.join(' ');
                  input.parentNode.appendChild(errorDiv);
                }
              }
            });
          }
          throw new Error('Validation failed');
        }
        if (!response.ok) {
          throw new Error('Network response was not ok. Error ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        closeForm();
        window.loadStudents(window.getCurrentPage());
      })
      .catch(error => {
        // Only log unexpected errors
        if (error.message !== 'Validation failed') {
          console.error(error);
        }
      }); 
    }
  });
  
  if (!window.studentOperations) {
    window.studentOperations = {};
  }

  // window.studentOperations.reloadStudentsTable = reloadStudentsTable;
  window.studentOperations.initializeButtons = initializeButtons;
  window.studentOperations.closeForm = closeForm;
});

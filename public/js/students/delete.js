document.addEventListener('DOMContentLoaded', function() {
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteModal = document.getElementById('deleteModal');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteConfirmationMessage = document.getElementById('deleteConfirmationMessage');
  const modalOverlay = document.getElementById('modalOverlay');
  const studentsTable = document.querySelector('.students-table');
  
  let selectedRowsForDeletion = [];

  // Reference to the select all checkbox for resetting after deletion
  const selectAllCheckbox = document.querySelector('#selectAllStudents');

  function closeDeleteModal() {
    deleteModal.classList.remove('open');
    modalOverlay.classList.remove('visible');
    
    document.body.style.overflow = '';
    selectedRowsForDeletion = [];
  }

  function confirmDelete() {
    selectedRowsForDeletion.forEach(row => {
      const studentId = parseInt(row.dataset.student_id);
      
      fetch('/delete-student', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ id: studentId })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        return response.json();
      })
      .then(data => {
        console.log('Success. Deleted:', data);
        window.loadStudents(window.getCurrentPage());
        window.studentOperations.closeForm();
      })
      .catch(error => {
        console.error('Error:', error);
      });

    });
    
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }
    
    closeDeleteModal();
  }

  function openDeleteModal(event) {
    const checkboxes = studentsTable.querySelectorAll('td input[type="checkbox"]:checked');
    selectedRowsForDeletion = []; // Reset the array
    
    if (checkboxes.length > 0) {
      checkboxes.forEach(checkbox => {
        selectedRowsForDeletion.push(checkbox.closest('tr'));
      });
      
      deleteConfirmationMessage.textContent = `Are you sure you want to delete ${checkboxes.length} selected student(s)?`;
    } else {
      const targetRow = event.currentTarget.closest('tr');
      if (targetRow) {
        selectedRowsForDeletion.push(targetRow);
        
        const studentName = targetRow.querySelector('td:nth-child(3)')?.textContent;
        deleteConfirmationMessage.textContent = `Are you sure you want to delete student "${studentName}"?`;
      }
    }
    
    modalOverlay.classList.add('visible');
    deleteModal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }

  function deleteStudent(event) {
    if (!window.isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    
    openDeleteModal(event);
  }

  // Add buttons functionality
  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', confirmDelete);
  modalOverlay.addEventListener('click', function() {
    if (deleteModal.classList.contains('open')) {
      closeDeleteModal();
    }
  });
  
  // Prevent closing when clicking on the modal itself
  deleteModal.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Expose functions to global scope for use in other scripts
  if (!window.studentOperations) {
    window.studentOperations = {};
  }

  window.studentOperations.deleteStudent = deleteStudent;
});

let sessionId = Date.now(); // Simple session ID
let allStudents = [
    'Raushan Sharma', 'Qareena sadaf', 'Rohit Rathod', 'deval Gupta', 
    'Indrajeet','Arijit Singh', 'Balaji', 'Rajesh Yadav', 'Kavya Nair',
    'Aditya Joshi', 'Riya Malhotra', 'Sanjay Thakur', 'Arjun Reddy',
    'Harsh Agarwal', 'Megha Kapoor', 'Nikhil Sharma', 'Shreya Ghosal'
];

let presentStudents = [];
let selectedStudents = [];
let filteredStudents = [...allStudents];

// Mock attendance data in localStorage
function getAttendanceData() {
    const data = localStorage.getItem('attendanceData');
    return data ? JSON.parse(data) : {};
}

function saveAttendanceData(data) {
    localStorage.setItem('attendanceData', JSON.stringify(data));
}

// Check if this is a new session
function checkSessionVersion() {
    const storedSession = localStorage.getItem('sessionId');
    const currentSession = sessionId.toString();
    
    if (storedSession !== currentSession) {
        console.log("🌀 New session detected. Clearing attendance submission flag.");
        localStorage.removeItem('attendanceSubmitted');
        localStorage.setItem('sessionId', currentSession);
        return true;
    }
    return false;
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    
    // Authentication check for faculty page only
    if (currentPage.includes('index.html') || currentPage === '/' || currentPage === '') {
        if(localStorage.getItem('isAuthenticated') !== 'true') {
            window.location.href = 'login.html';
            return;
        }
        console.log('👨‍🏫 Initializing Faculty View');
        initFacultyView();
    } else if (currentPage.includes('student.html')) {
        console.log('🎓 Initializing Student View');
        initStudentView();
    }
});

// Faculty view initialization
function initFacultyView() {
    loadStudentList();
    generateQR();
    loadAttendanceFromStorage();
    
    // Refresh attendance every 5 seconds
    setInterval(loadAttendanceFromStorage, 5000);
    
    console.log('✅ Faculty view initialized');
}

// Fixed QR code generation
function generateQR() {
    const qrCode = document.getElementById('qr-code');
    if (!qrCode) return;

    // Use current domain or GitHub Pages URL
    const baseUrl = window.location.origin;
    const studentUrl = baseUrl.includes('github.io') 
        ? 'https://rkd8787.github.io/Mini-Project/student.html'
        : baseUrl + '/student.html';

    qrCode.innerHTML = '';

    const canvas = document.createElement('canvas');
    qrCode.appendChild(canvas);

    new QRious({
        element: canvas,
        value: studentUrl,
        size: 280,
        background: 'white',
        foreground: 'black',
        level: 'H'
    });

    const urlDisplay = document.createElement('p');
    urlDisplay.style.marginTop = '10px';
    urlDisplay.style.fontSize = '14px';
    urlDisplay.style.wordBreak = 'break-word';
    urlDisplay.textContent = `URL: ${studentUrl}`;
    qrCode.appendChild(urlDisplay);

    console.log('✅ QR code generated for:', studentUrl);
}

// Student view initialization
function initStudentView() {
    checkSessionVersion();
    loadStudentList();
    populateStudentList();
    setupStudentEventListeners();
    setupStudentSearch();
    
    // Show selection page, hide success page
    const selectionPage = document.getElementById('student-selection-page');
    const successPage = document.getElementById('success-page');
    
    if (selectionPage) selectionPage.style.display = 'block';
    if (successPage) {
        successPage.style.display = 'none';
        successPage.classList.add('hidden');
    }
    
    console.log('✅ Student view initialized');
}

// Setup student search
function setupStudentSearch() {
    const searchInput = document.getElementById('student-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredStudents = [...allStudents];
        } else {
            filteredStudents = allStudents.filter(student => 
                student.toLowerCase().includes(searchTerm)
            );
        }
        
        populateStudentList();
    });
}

// Populate student list with radio buttons
function populateStudentList() {
    const studentList = document.getElementById('student-list');
    if (!studentList) return;

    studentList.innerHTML = '';

    if (filteredStudents.length === 0) {
        studentList.innerHTML = `
            <div class="no-results">
                <p>No students found matching your search.</p>
            </div>
        `;
        return;
    }

    filteredStudents.forEach((student, index) => {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'student-checkbox';

        studentDiv.innerHTML = `
            <input type="radio" name="student" id="student-${index}" value="${student}">
            <label for="student-${index}">${student}</label>
        `;

        studentDiv.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                const radio = studentDiv.querySelector('input');
                radio.checked = true;
                updateStudentSelection();
            }
        });

        const radio = studentDiv.querySelector('input');
        radio.addEventListener('change', updateStudentSelection);

        studentList.appendChild(studentDiv);
    });
}

// Update student selection
function updateStudentSelection() {
    const selectedRadio = document.querySelector('input[name="student"]:checked');
    const submitBtn = document.getElementById('submit-attendance');
    
    document.querySelectorAll('.student-checkbox').forEach(div => {
        div.classList.remove('selected');
    });
    
    if (selectedRadio) {
        selectedStudents = [selectedRadio.value];
        selectedRadio.closest('.student-checkbox').classList.add('selected');
        if (submitBtn) submitBtn.disabled = false;
    } else {
        selectedStudents = [];
        if (submitBtn) submitBtn.disabled = true;
    }
}

// Setup student event listeners
function setupStudentEventListeners() {
    const submitBtn = document.getElementById('submit-attendance');
    const closeSuccessBtn = document.getElementById('close-success');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', submitAttendance);
    }
    
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function() {
            resetStudentSelection();
            document.getElementById('success-page').style.display = 'none';
            document.getElementById('success-page').classList.add('hidden');
            document.getElementById('student-selection-page').style.display = 'block';
        });
    }
}

// Fixed submit attendance function
function submitAttendance() {
    checkSessionVersion();
    
    if (localStorage.getItem('attendanceSubmitted') === 'true') {
        alert("Attendance already submitted from this device!");
        return;
    }

    if (selectedStudents.length === 0) {
        alert("Please select your name first!");
        return;
    }

    const student = selectedStudents[0];
    const attendanceData = getAttendanceData();
    
    // Check if student already submitted
    if (attendanceData[student]) {
        alert("You have already submitted attendance!");
        return;
    }

    const submitBtn = document.getElementById('submit-attendance');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    try {
        // Save attendance
        attendanceData[student] = new Date().toLocaleString();
        saveAttendanceData(attendanceData);
        
        // Mark as submitted
        localStorage.setItem('attendanceSubmitted', 'true');
        
        console.log('✅ Attendance submitted for:', student);
        showSuccessPage();

    } catch (err) {
        console.error("❌ Submission error:", err);
        alert("Failed to submit attendance. Please try again.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Attendance';
        }
    }
}

// Show success page
function showSuccessPage() {
    const selectionPage = document.getElementById('student-selection-page');
    const successPage = document.getElementById('success-page');
    
    if (selectionPage) selectionPage.style.display = 'none';
    if (successPage) {
        successPage.style.display = 'block';
        successPage.classList.remove('hidden');
    }
}

// Reset student selection
function resetStudentSelection() {
    selectedStudents = [];
    document.querySelectorAll('input[name="student"]').forEach(radio => {
        radio.checked = false;
    });
    document.querySelectorAll('.student-checkbox').forEach(div => {
        div.classList.remove('selected');
    });
    
    const submitBtn = document.getElementById('submit-attendance');
    if (submitBtn) submitBtn.disabled = true;
    
    const searchInput = document.getElementById('student-search');
    if (searchInput) searchInput.value = '';
    filteredStudents = [...allStudents];
}

// Load attendance from storage
function loadAttendanceFromStorage() {
    const attendanceData = getAttendanceData();
    presentStudents = Object.keys(attendanceData);
    updatePresentStudentsList();
    updatePresentCount();
}

// Update present students list
function updatePresentStudentsList() {
    const listContainer = document.getElementById('present-students-list');
    if (!listContainer) return;
    
    if (presentStudents.length === 0) {
        listContainer.innerHTML = `
            <div class="student-item" style="opacity: 0.5; font-style: italic;">
                No students marked present yet
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = '';
    presentStudents.forEach((student) => {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'student-item';
        studentDiv.innerHTML = `
            <span>${student}</span>
            <button class="remove-btn" onclick="removeStudent('${student}')">Remove</button>
        `;
        listContainer.appendChild(studentDiv);
    });
}

// Update present count
function updatePresentCount() {
    const countElement = document.getElementById('present-count');
    if (countElement) {
        countElement.textContent = presentStudents.length;
    }
}

// Remove student
function removeStudent(student) {
    if (!confirm(`Remove ${student} from attendance?`)) return;

    const attendanceData = getAttendanceData();
    delete attendanceData[student];
    saveAttendanceData(attendanceData);
    
    loadAttendanceFromStorage();
    alert(`${student} removed from attendance.`);
}

// Start fresh attendance
function startFreshAttendance() {
    if (!confirm("⚠️ This will clear all attendance. Continue?")) return;

    // Clear all attendance data
    localStorage.removeItem('attendanceData');
    localStorage.removeItem('attendanceSubmitted');
    
    // Generate new session
    sessionId = Date.now();
    localStorage.setItem('sessionId', sessionId);
    
    loadAttendanceFromStorage();
    alert("✅ Fresh attendance session started!");
}

// Export attendance CSV
function exportAttendanceCSV() {
    const attendanceData = getAttendanceData();
    const csvRows = ['Name,Timestamp'];
    
    for (const student in attendanceData) {
        csvRows.push(`"${student}","${attendanceData[student]}"`);
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
}

// Add student manually
function addStudentManually(studentName) {
    if (!studentName) return;

    const attendanceData = getAttendanceData();
    
    if (attendanceData[studentName]) {
        alert('Student is already marked present!');
        return;
    }

    attendanceData[studentName] = new Date().toLocaleString();
    saveAttendanceData(attendanceData);
    
    loadAttendanceFromStorage();
    closeAddManuallyModal();
    alert(`${studentName} added successfully!`);
}

// Modal functions and student list management
let facultyFilteredStudents = [...allStudents];

function showAddManuallyModal() {
    facultyFilteredStudents = [...allStudents];
    document.getElementById('add-manually-modal').style.display = 'block';
    populateFacultyStudentDropdown();
    
    const searchInput = document.getElementById('student-search');
    if (searchInput) {
        searchInput.focus();
        searchInput.value = '';
    }
}

function closeAddManuallyModal() {
    document.getElementById('add-manually-modal').style.display = 'none';
    const searchInput = document.getElementById('student-search');
    if (searchInput) searchInput.value = '';
    facultyFilteredStudents = [...allStudents];
}

function populateFacultyStudentDropdown() {
    const dropdown = document.getElementById('student-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '';

    if (facultyFilteredStudents.length === 0) {
        dropdown.innerHTML = `
            <div class="dropdown-item no-results">
                No students found matching your search
            </div>
        `;
        return;
    }

    facultyFilteredStudents.forEach(student => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = student;
        
        if (presentStudents.includes(student)) {
            item.style.opacity = '0.5';
            item.style.color = '#999';
            item.innerHTML = `${student} <small>(Already Present)</small>`;
            item.style.cursor = 'not-allowed';
        } else {
            item.onclick = () => addStudentManually(student);
        }
        
        dropdown.appendChild(item);
    });
}

// Student list management functions
function showStudentListModal() {
    document.getElementById('student-list-modal').style.display = 'block';
    populateStudentListDisplay();
    updateStudentCount();
    
    const searchInput = document.getElementById('student-list-search');
    if (searchInput) searchInput.value = '';
}

function closeStudentListModal() {
    document.getElementById('student-list-modal').style.display = 'none';
    
    const addInput = document.getElementById('new-student-name');
    if (addInput) addInput.value = '';
    
    const searchInput = document.getElementById('student-list-search');
    if (searchInput) searchInput.value = '';
}

function addNewStudent() {
    const input = document.getElementById('new-student-name');
    const studentName = input.value.trim();
    
    if (!studentName) {
        alert('Please enter a student name');
        return;
    }
    
    if (allStudents.includes(studentName)) {
        alert('Student already exists in the list');
        input.value = '';
        return;
    }
    
    allStudents.push(studentName);
    allStudents.sort();
    
    filteredStudents = [...allStudents];
    facultyFilteredStudents = [...allStudents];
    
    input.value = '';
    
    populateStudentListDisplay();
    updateStudentCount();
    
    if (typeof populateStudentList === 'function') {
        populateStudentList();
    }
    
    localStorage.setItem('studentList', JSON.stringify(allStudents));
    alert(`${studentName} added successfully!`);
}

function deleteStudent(studentName) {
    if (!confirm(`Delete ${studentName} from the student list?`)) {
        return;
    }
    
    const index = allStudents.indexOf(studentName);
    if (index > -1) {
        allStudents.splice(index, 1);
    }
    
    filteredStudents = [...allStudents];
    facultyFilteredStudents = [...allStudents];
    
    // Remove from attendance if present
    const attendanceData = getAttendanceData();
    if (attendanceData[studentName]) {
        delete attendanceData[studentName];
        saveAttendanceData(attendanceData);
        loadAttendanceFromStorage();
    }
    
    populateStudentListDisplay();
    updateStudentCount();
    
    if (typeof populateStudentList === 'function') {
        populateStudentList();
    }
    
    localStorage.setItem('studentList', JSON.stringify(allStudents));
    alert(`${studentName} deleted successfully!`);
}

function populateStudentListDisplay() {
    const display = document.getElementById('student-list-display');
    if (!display) return;
    
    const searchTerm = document.getElementById('student-list-search')?.value.toLowerCase().trim() || '';
    
    let studentsToShow = allStudents;
    if (searchTerm) {
        studentsToShow = allStudents.filter(student => 
            student.toLowerCase().includes(searchTerm)
        );
    }
    
    display.innerHTML = '';
    
    if (studentsToShow.length === 0) {
        display.innerHTML = `
            <div class="no-students-message">
                ${searchTerm ? 'No students found matching your search' : 'No students in the list'}
            </div>
        `;
        return;
    }
    
    studentsToShow.forEach(student => {
        const item = document.createElement('div');
        item.className = 'student-list-item';
        
        item.innerHTML = `
            <span class="student-name">${student}</span>
            <button class="delete-student-btn" onclick="deleteStudent('${student}')">
                🗑️ Delete
            </button>
        `;
        
        display.appendChild(item);
    });
}

function updateStudentCount() {
    const countElement = document.getElementById('total-student-count');
    if (countElement) {
        countElement.textContent = allStudents.length;
    }
}

function loadStudentList() {
    const savedList = localStorage.getItem('studentList');
    if (savedList) {
        try {
            const parsedList = JSON.parse(savedList);
            if (Array.isArray(parsedList) && parsedList.length > 0) {
                allStudents.length = 0;
                allStudents.push(...parsedList.sort());
                filteredStudents = [...allStudents];
                console.log('✅ Student list loaded:', allStudents.length, 'students');
            }
        } catch (error) {
            console.error('❌ Error loading student list:', error);
        }
    }
}

// Event listeners for modals and search
document.addEventListener('DOMContentLoaded', function() {
    loadStudentList();
    
    // Faculty search
    const facultySearchInput = document.getElementById('student-search');
    if (facultySearchInput && !window.location.pathname.includes('student.html')) {
        facultySearchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                facultyFilteredStudents = [...allStudents];
            } else {
                facultyFilteredStudents = allStudents.filter(student => 
                    student.toLowerCase().includes(searchTerm)
                );
            }
            
            populateFacultyStudentDropdown();
        });
    }
    
    // Student list modal search
    const studentListSearchInput = document.getElementById('student-list-search');
    if (studentListSearchInput) {
        studentListSearchInput.addEventListener('input', function(e) {
            populateStudentListDisplay();
        });
    }
    
    // Add student on Enter key
    const addStudentInput = document.getElementById('new-student-name');
    if (addStudentInput) {
        addStudentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addNewStudent();
            }
        });
    }
    
    // Close modals on outside click
    window.onclick = function(event) {
        const addModal = document.getElementById('add-manually-modal');
        const studentListModal = document.getElementById('student-list-modal');
        
        if (event.target === addModal) {
            closeAddManuallyModal();
        }
        
        if (event.target === studentListModal) {
            closeStudentListModal();
        }
    };
});

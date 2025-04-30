// Professor Dashboard JavaScript - Complete code with notifications

document.addEventListener("DOMContentLoaded", function() {
    console.log("Professor dashboard loaded");
    
    // Try to load student request data
    loadStudentRequest();
    
    // Set up button event handlers
    setupButtonHandlers();
    
    // General navigation
    setupNavigation();
    
    // Load notifications on page load if on home section
    if (document.getElementById('home').classList.contains('active')) {
        loadNotifications();
    }
    
    // Initial check for new requests
    checkForNewRequests();
    
    // Periodically check for new requests
    setInterval(checkForNewRequests, 5000);
    
    // Load confirmed requests
    loadConfirmedRequests();
});

// Load the student request data from localStorage
function loadStudentRequest() {
    const requestData = JSON.parse(localStorage.getItem("labEquipmentRequest"));
    console.log("Retrieved request data:", requestData);
    
    if (!requestData) {
        console.log("No request data found in localStorage");
        return;
    }
    
    // First, temporarily remove readonly attribute to allow setting values
    document.querySelectorAll('#request-form input[readonly]').forEach(input => {
        input.removeAttribute('readonly');
    });
    
    // Get input fields by name attributes
    const nameInput = document.querySelector('input[name="studentName"]');
    const labInput = document.querySelector('input[name="laboratory"]');
    const studentNumberInput = document.querySelector('input[name="studentNumber"]');
    const dateFiledInput = document.querySelector('input[name="dateFiled"]');
    const timeNeededInput = document.querySelector('input[name="timeNeeded"]');
    
    console.log("Found form fields:", { 
        nameInput, 
        labInput, 
        studentNumberInput, 
        dateFiledInput, 
        timeNeededInput 
    });
    
    // Set form values if elements exist
    if (nameInput) nameInput.value = requestData.studentName || "";
    if (labInput) labInput.value = requestData.laboratory || "";
    if (studentNumberInput) studentNumberInput.value = requestData.studentNumber || "";
    if (dateFiledInput) dateFiledInput.value = requestData.dateFiled || "";
    if (timeNeededInput) timeNeededInput.value = requestData.timeNeeded || "";
    
    // Re-add readonly attribute after setting values
    document.querySelectorAll('#request-form input').forEach(input => {
        input.setAttribute('readonly', 'readonly');
    });
    
    // Display the requested items
    displayRequestedItems(requestData.items);
    
    // Update button states based on status
    updateButtonStates(requestData.status);
}

// Display the requested items in a table
function displayRequestedItems(items) {
    if (!items || items.length === 0) return;
    
    // Find the table body for equipment items
    const itemsTable = document.getElementById('equipment-list-body');
    
    if (!itemsTable) {
        console.log("Could not find items container");
        return;
    }
    
    // Clear existing content first
    itemsTable.innerHTML = '';
    
    // Add each item to the table
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
        `;
        itemsTable.appendChild(row);
    });
    
    console.log(`Displayed ${items.length} requested items`);
}

// Set up event handlers for buttons
function setupButtonHandlers() {
    // Approve button
    const approveBtn = document.querySelector('.approve-btn');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', function() {
            const requestData = JSON.parse(localStorage.getItem("labEquipmentRequest"));
            if (requestData) {
                requestData.status = 'approved';
                localStorage.setItem("labEquipmentRequest", JSON.stringify(requestData));
                
                // Add to confirmed requests
                addToConfirmedRequests(requestData);
                
                // Add notification about approval
                addNotification(
                    `You approved ${requestData.studentName}'s equipment request`, 
                    'approved', 
                    requestData.timestamp
                );
                
                // Update button states
                updateButtonStates('approved');
                
                alert('Request approved successfully!');
            } else {
                alert('No request data found.');
            }
        });
    }
    
    // Decline button
    const declineBtn = document.querySelector('.decline-btn');
    
    if (declineBtn) {
        declineBtn.addEventListener('click', function() {
            const reason = prompt('Please provide a reason for declining:');
            if (reason) {
                const requestData = JSON.parse(localStorage.getItem("labEquipmentRequest"));
                if (requestData) {
                    requestData.status = 'declined';
                    requestData.declineReason = reason;
                    localStorage.setItem("labEquipmentRequest", JSON.stringify(requestData));
                    
                    // Add notification about declining
                    addNotification(
                        `You declined ${requestData.studentName}'s equipment request. Reason: ${reason}`, 
                        'declined', 
                        requestData.timestamp
                    );
                    
                    // Update button states
                    updateButtonStates('declined');
                    
                    alert('Request declined.');
                } else {
                    alert('No request data found.');
                }
            }
        });
    }
}

// Add the approved request to the confirmed requests list
function addToConfirmedRequests(requestData) {
    const confirmedList = document.getElementById('confirmed-list');
    
    if (!confirmedList) {
        console.log("Could not find confirmed requests container");
        return;
    }
    
    // Create a new confirmed request item
    const confirmedItem = document.createElement('div');
    confirmedItem.className = 'confirmed-item';
    confirmedItem.innerHTML = `
        <span class="student-name">${requestData.studentName}'s Approved Request</span>
        <span class="date">${requestData.dateFiled}</span>
        <span class="check-mark">✓</span>
    `;
    confirmedList.appendChild(confirmedItem);
    
    // Also save to localStorage for persistence
    let confirmedRequests = JSON.parse(localStorage.getItem('confirmedRequests')) || [];
    confirmedRequests.push({
        name: requestData.studentName,
        date: requestData.dateFiled,
        items: requestData.items,
        approvedDate: new Date().toLocaleDateString()
    });
    localStorage.setItem('confirmedRequests', JSON.stringify(confirmedRequests));
    
    console.log("Added to confirmed requests");
}

// Setup navigation functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            
            if (section) {
                e.preventDefault();
                showSection(section);
                updateActiveNav(this);
            }
        });
    });
}

// Show a specific section
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load notifications if we're showing the home section
        if (sectionId === 'home') {
            loadNotifications();
        }
    }
}

// Update active navigation link
function updateActiveNav(activeLink) {
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Load saved confirmed requests when the page loads
function loadConfirmedRequests() {
    const confirmedList = document.getElementById('confirmed-list');
    
    if (!confirmedList) return;
    
    const savedConfirmed = JSON.parse(localStorage.getItem('confirmedRequests')) || [];
    
    savedConfirmed.forEach(({name, date, approvedDate}) => {
        const confirmedItem = document.createElement('div');
        confirmedItem.className = 'confirmed-item';
        confirmedItem.innerHTML = `
            <span class="student-name">${name}'s Approved Request</span>
            <span class="date">${date}</span>
            <span class="approved-date">${approvedDate || 'Unknown'}</span>
            <span class="check-mark">✓</span>
        `;
        confirmedList.appendChild(confirmedItem);
    });
}

// Load and display notifications 
function loadNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) {
        console.log("Notifications list container not found");
        return;
    }
    
    // Clear existing notifications
    notificationsList.innerHTML = '';
    
    // Get notifications from localStorage
    const notifications = JSON.parse(localStorage.getItem('professorNotifications')) || [];
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<div class="empty-notification">No pending notifications</div>';
        return;
    }
    
    // Add each notification to the list
    notifications.forEach((notification, index) => {
        const notificationItem = document.createElement('div');
        notificationItem.classList.add('notification-item');
        if (!notification.read) {
            notificationItem.classList.add('unread');
        }
        
        // Format timestamp
        const date = new Date(notification.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        
        // Create notification based on type
        notificationItem.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formattedDate}</div>
            </div>
            <div class="notification-actions">
                <button class="view-btn" data-request-id="${notification.requestId || ''}">View</button>
                <button class="mark-read" data-index="${index}">${notification.read ? 'Mark unread' : 'Mark read'}</button>
            </div>
        `;
        
        notificationsList.appendChild(notificationItem);
        
        // Add event listeners
        const viewBtn = notificationItem.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', function() {
                const requestId = this.getAttribute('data-request-id');
                if (requestId) {
                    viewRequest(requestId);
                } else {
                    alert("Request ID not found. Cannot view this request.");
                }
            });
        }
        
        const markReadBtn = notificationItem.querySelector('.mark-read');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                toggleNotificationRead(index);
            });
        }
    });
}

// Add a notification to the system
function addNotification(message, type = 'info', requestId = null) {
    // Get existing notifications
    let notifications = JSON.parse(localStorage.getItem('professorNotifications')) || [];
    
    // Add new notification to beginning of array
    notifications.unshift({
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        read: false,
        requestId: requestId
    });
    
    // Limit to 20 notifications
    if (notifications.length > 20) {
        notifications = notifications.slice(0, 20);
    }
    
    // Save back to localStorage
    localStorage.setItem('professorNotifications', JSON.stringify(notifications));
    
    // Update notifications display if on home section
    if (document.getElementById('home').classList.contains('active')) {
        loadNotifications();
    }
}

// View a specific request when clicking the "View" button in notifications
function viewRequest(requestId) {
    // Get the request data from localStorage
    const requestData = JSON.parse(localStorage.getItem("labEquipmentRequest"));
    
    if (!requestData || requestData.timestamp.toString() !== requestId.toString()) {
        alert("Request data not found or no longer available.");
        return;
    }
    
    // Switch to request form section
    showSection('request-form');
    updateActiveNav(document.querySelector('nav a[data-section="request-form"]'));
    
    // Fill the form with the request data
    const nameInput = document.querySelector('input[name="studentName"]');
    const labInput = document.querySelector('input[name="laboratory"]');
    const studentNumberInput = document.querySelector('input[name="studentNumber"]');
    const dateFiledInput = document.querySelector('input[name="dateFiled"]');
    const timeNeededInput = document.querySelector('input[name="timeNeeded"]');
    
    // Temporarily remove readonly to set values
    if (nameInput) {
        nameInput.removeAttribute('readonly');
        nameInput.value = requestData.studentName || "";
        nameInput.setAttribute('readonly', 'readonly');
    }
    
    if (labInput) {
        labInput.removeAttribute('readonly');
        labInput.value = requestData.laboratory || "";
        labInput.setAttribute('readonly', 'readonly');
    }
    
    if (studentNumberInput) {
        studentNumberInput.removeAttribute('readonly');
        studentNumberInput.value = requestData.studentNumber || "";
        studentNumberInput.setAttribute('readonly', 'readonly');
    }
    
    if (dateFiledInput) {
        dateFiledInput.removeAttribute('readonly');
        dateFiledInput.value = requestData.dateFiled || "";
        dateFiledInput.setAttribute('readonly', 'readonly');
    }
    
    if (timeNeededInput) {
        timeNeededInput.removeAttribute('readonly');
        timeNeededInput.value = requestData.timeNeeded || "";
        timeNeededInput.setAttribute('readonly', 'readonly');
    }
    
    // Display the requested items
    displayRequestedItems(requestData.items);
    
    // Update button states based on status
    updateButtonStates(requestData.status);
}

// Update button states based on request status
function updateButtonStates(status) {
    const approveBtn = document.querySelector('.approve-btn');
    const declineBtn = document.querySelector('.decline-btn');
    
    if (!approveBtn || !declineBtn) return;
    
    if (status === 'approved') {
        approveBtn.disabled = true;
        approveBtn.classList.add('disabled');
        approveBtn.textContent = '✓ ALREADY APPROVED';
        
        declineBtn.disabled = true;
        declineBtn.classList.add('disabled');
    } else if (status === 'declined') {
        approveBtn.disabled = true;
        approveBtn.classList.add('disabled');
        
        declineBtn.disabled = true;
        declineBtn.classList.add('disabled');
        declineBtn.textContent = 'ALREADY DECLINED';
    } else {
        // Reset to normal state if pending
        approveBtn.disabled = false;
        approveBtn.classList.remove('disabled');
        approveBtn.textContent = '✓ APPROVE';
        
        declineBtn.disabled = false;
        declineBtn.classList.remove('disabled');
        declineBtn.textContent = 'DECLINE';
    }
}

// Toggle read status of a notification
function toggleNotificationRead(index) {
    const notifications = JSON.parse(localStorage.getItem('professorNotifications')) || [];
    
    if (index >= 0 && index < notifications.length) {
        notifications[index].read = !notifications[index].read;
        localStorage.setItem('professorNotifications', JSON.stringify(notifications));
        loadNotifications();
    }
}

// Check for new student requests
function checkForNewRequests() {
    const requestData = JSON.parse(localStorage.getItem('labEquipmentRequest'));
    
    if (requestData) {
        // Get the last request ID we've seen
        const lastRequestId = localStorage.getItem('lastSeenRequestId');
        const currentRequestId = requestData.timestamp; // Using timestamp as ID
        
        if (lastRequestId !== currentRequestId.toString() && requestData.status === 'pending') {
            // This is a new request we haven't notified about
            addNotification(
                `New equipment request from ${requestData.studentName} (${requestData.studentNumber})`, 
                'new', 
                currentRequestId
            );
            
            // Update last seen request ID
            localStorage.setItem('lastSeenRequestId', currentRequestId);
        }
    }
}
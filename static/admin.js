
// Add this to your admin.js file
document.addEventListener('DOMContentLoaded', function() {
    // Show section based on navigation click
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('data-section')) {
                e.preventDefault();
                showSection(this.getAttribute('data-section'));
            }
        });
    });
    
    // Load equipment data when the equipment section is shown
    document.querySelector('a[data-section="equipment-management"]').addEventListener('click', loadEquipmentData);
    
    // Add equipment button functionality
    document.getElementById('add-equipment-btn').addEventListener('click', function() {
        // Implement add equipment functionality
    });
});

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update active class in navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
}

function loadEquipmentData() {
    fetch('/get_inventory_items')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('equipment-table-body');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="4">No equipment items found</td>';
                tableBody.appendChild(row);
                return;
            }
            
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.item_description || 'N/A'}</td>
                    <td>${item.item_quantity || 'N/A'}</td>
                    <td>${item.lab_location || 'N/A'}</td>
                    <td>${item.item_status || 'Available'}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading equipment data:', error));
}


// Modified approveRequest function
function approveRequest(requestId) {
    const requestData = findRequestById(requestId);
    if (!requestData) {
        showNotification('Request not found!', 'error');
        return;
    }

    // Get current equipment
    let equipment = JSON.parse(localStorage.getItem(equipmentStorageKey)) || [];
    let canApprove = true;
    const errors = [];

    // Check inventory first
    requestData.items.forEach(requestItem => {
        const equipmentItem = equipment.find(e => e.name === requestItem.name);
        if (!equipmentItem) {
            errors.push(`${requestItem.name} not found in inventory`);
            canApprove = false;
        } else if (equipmentItem.quantity < requestItem.quantity) {
            errors.push(`Not enough ${requestItem.name} (Available: ${equipmentItem.quantity})`);
            canApprove = false;
        }
    });

    if (!canApprove) {
        showNotification(`Cannot approve: ${errors.join(', ')}`, 'error');
        return;
    }

    // Deduct quantities
    requestData.items.forEach(requestItem => {
        const equipmentItem = equipment.find(e => e.name === requestItem.name);
        if (equipmentItem) {
            equipmentItem.quantity -= requestItem.quantity;
            if (equipmentItem.quantity < 0) equipmentItem.quantity = 0;
        }
    });

    // Save updated equipment
    localStorage.setItem(equipmentStorageKey, JSON.stringify(equipment));

    const notes = prompt('Enter admin approval notes (optional):');

    // Update request status
    const updatedRequest = {
        ...requestData,
        status: 'admin_approved',
        adminApprovedBy: 'Admin',
        adminApprovalNotes: notes || '',
        adminApprovalDate: new Date().toISOString()
    };

    // Save updated request
    updateRequestInStorage(updatedRequest);

    // Send notifications
    sendApprovalNotifications(updatedRequest);

    // Add system log
    addSystemLog(
        `Admin approved request from ${updatedRequest.studentName}`,
        'admin_approval'
    );

    // Reload data
    loadAllRequests();
    loadEquipment(); // Refresh equipment table
    
    // Refresh confirmed section if active
    if (document.getElementById('confirmed').classList.contains('active')) {
        loadConfirmedRequests();
    }

    showNotification('Request approved successfully!', 'success');
}

// Modified handleEquipmentEdit to prevent negative quantities
function handleEquipmentEdit(id) {
    const equipment = JSON.parse(localStorage.getItem(equipmentStorageKey));
    const index = equipment.findIndex(e => e.id === id);
    
    const newQuantity = parseInt(prompt('New quantity:', equipment[index].quantity));
    if (isNaN(newQuantity) || newQuantity < 0) {
        showNotification('Invalid quantity entered', 'error');
        return;
    }

    equipment[index] = {
        ...equipment[index],
        name: prompt('New name:', equipment[index].name),
        quantity: newQuantity,
        laboratory: prompt('New laboratory:', equipment[index].laboratory),
        status: prompt('New status:', equipment[index].status)
    };
    
    localStorage.setItem(equipmentStorageKey, JSON.stringify(equipment));
    loadEquipment();
}

document.addEventListener("DOMContentLoaded", function() {
    // Initialize the dashboard
    initAdminDashboard();
});

function initAdminDashboard() {
    // Load initial data
    loadAllRequests();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for new requests every 5 seconds
    setInterval(checkForNewRequests, 5000);
}

function loadAllRequests() {
    try {
        // Get all requests from localStorage
        const allRequests = getAllRequests();
        
        // Display requests in the table
        displayRequests(allRequests);
        
        // Attach event listeners to buttons
        attachButtonHandlers();
    } catch (error) {
        console.error("Error loading requests:", error);
        showNotification("Error loading requests", "error");
    }
}

function getAllRequests() {
    const requests = [];
    
    // Get pending/student requests
    const studentRequest = getRequestFromStorage('labEquipmentRequest');
    if (studentRequest) requests.push(createRequestObject(studentRequest));
    
    // Get confirmed requests (approved by professor)
    const confirmedRequests = getRequestFromStorage('confirmedRequests') || [];
    requests.push(...confirmedRequests.map(req => createRequestObject(req)));
    
    // Add professor-declined requests
    const professorDeclinedRequests = getRequestFromStorage('professorDeclinedRequests') || [];
    requests.push(...professorDeclinedRequests.map(req => createRequestObject(req)));
    
    // Sort by timestamp (newest first)
    return requests.sort((a, b) => b.timestamp - a.timestamp);
}

function getRequestFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function createRequestObject(requestData) {
    return {
        studentName: requestData.name || requestData.studentName || 'Pending',
        studentNumber: requestData.studentNumber || 'N/A',
        laboratory: requestData.laboratory || 'N/A',
        dateFiled: requestData.date || requestData.dateFiled || 'N/A',
        items: requestData.items || [],
        status: requestData.status || 'professor_approved',
        timestamp: requestData.timestamp || new Date(requestData.approvedDate || requestData.dateFiled || requestData.date).getTime(),
        professorNotes: requestData.approvalNotes || requestData.professorNotes
    };
}

function displayRequests(requests) {
    const tableBody = document.getElementById('requests-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (requests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No requests found</td></tr>';
        return;
    }
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', request.timestamp);
        row.setAttribute('data-status', request.status);
        row.setAttribute('data-date', request.dateFiled);
        
        const statusClass = getStatusClass(request.status);
        const statusText = formatStatus(request.status);
        
        row.innerHTML = `
            <td>${request.studentName}</td>
            <td>${request.studentNumber}</td>
            <td>${request.laboratory}</td>
            <td>${request.dateFiled}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="view-btn" data-id="${request.timestamp}">View</button>
                ${request.status === 'professor_approved' ? 
                    `<button class="approve-btn" data-id="${request.timestamp}">Approve</button>
                    <button class="decline-btn" data-id="${request.timestamp}">Decline</button>` : ''}
                    </td>
        `;
        
        tableBody.appendChild(row);
    });
    
}


function attachButtonHandlers() {
    // View button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', handleViewRequest);
    });
    
    // Approve button
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', handleApproveRequest);
    });
    
    // Decline button
    document.querySelectorAll('.decline-btn').forEach(btn => {
        btn.addEventListener('click', handleDeclineRequest);
    });
}

function handleViewRequest(event) {
    const requestId = event.target.getAttribute('data-id');
    viewRequestDetails(requestId);
}

function handleApproveRequest(event) {
    const requestId = event.target.getAttribute('data-id');
    approveRequest(requestId);
}

function handleDeclineRequest(event) {
    const requestId = event.target.getAttribute('data-id');
    declineRequest(requestId);
}

function viewRequestDetails(requestId) {
    const requestData = findRequestById(requestId);
    if (!requestData) {
        showNotification('Request not found!', 'error');
        return;
    }
    
    // Create and display modal
    const modal = createRequestModal(requestData);
    document.body.appendChild(modal);
    
    // Add event listeners for modal buttons
    if (requestData.status === 'professor_approved') {
        const approveBtn = modal.querySelector('.approve-btn-modal');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                approveRequest(requestId);
                modal.remove();
            });
        }
        
        const declineBtn = modal.querySelector('.decline-btn-modal');
        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                declineRequest(requestId);
                modal.remove();
            });
        }
    }
    
    const closeBtn = modal.querySelector('.close-btn-modal') || modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.remove());
    }
}

function createRequestModal(requestData) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Request Details</h2>
            <div class="request-info">
                <div><strong>Student Name:</strong> ${requestData.studentName}</div>
                <div><strong>Student Number:</strong> ${requestData.studentNumber}</div>
                <div><strong>Laboratory:</strong> ${requestData.laboratory}</div>
                <div><strong>Date Filed:</strong> ${requestData.dateFiled}</div>
                <div><strong>Status:</strong> <span class="status-badge ${getStatusClass(requestData.status)}">${formatStatus(requestData.status)}</span></div>
                ${requestData.professorNotes ? `<div><strong>Professor Notes:</strong> ${requestData.professorNotes}</div>` : ''}
            </div>
            
            <h3>Requested Equipment</h3>
            <table class="equipment-table">
                <thead>
                    <tr>
                        <th>Equipment</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody id="request-equipment-list">
                    ${requestData.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="2">No equipment requested</td></tr>'}
                </tbody>
            </table>
            
            <div class="modal-actions">
                ${requestData.status === 'professor_approved' ? `
                    <button class="approve-btn-modal">Approve</button>
                    <button class="decline-btn-modal">Decline</button>
                ` : ''}
                <button class="close-btn-modal">Close</button>
            </div>
        </div>
    `;
    
    return modal;
}

function findRequestById(requestId) {
    if (!requestId) return null;
    requestId = requestId.toString();
    
    // Check all possible storage locations
    const sources = [
        getRequestFromStorage('labEquipmentRequest'),
        ...(getRequestFromStorage('confirmedRequests') || []),
        ...(getRequestFromStorage('professorDeclinedRequests') || [])
    ].filter(Boolean);
    
    // Find the matching request
    for (const req of sources) {
        if (!req) continue;
        
        // Check different possible ID fields
        const idFields = [
            req.timestamp,
            req.approvedDate && new Date(req.approvedDate).getTime(),
            req.date && new Date(req.date).getTime(),
            req.dateFiled && new Date(req.dateFiled).getTime()
        ];
        
        for (const id of idFields) {
            if (id && id.toString() === requestId) {
                return req;
            }
        }
    }
    
    return null;
}

function approveRequest(requestId) {
    const requestData = findRequestById(requestId);
    if (!requestData) {
        showNotification('Request not found!', 'error');
        return;
    }
    
    const notes = prompt('Enter admin approval notes (optional):');
    
    // Update request status
    const updatedRequest = {
        ...requestData,
        status: 'admin_approved',
        adminApprovedBy: 'Admin',
        adminApprovalNotes: notes || '',
        adminApprovalDate: new Date().toISOString()
    };
    
    // Save updated request
    updateRequestInStorage(updatedRequest);
    
    // Send notifications
    sendApprovalNotifications(updatedRequest);
    
    // Add system log
    addSystemLog(
        `Admin approved request from ${updatedRequest.studentName}`,
        'admin_approval'
    );
    
    // Reload requests
    loadAllRequests();
    
    showNotification('Request approved successfully!', 'success');
}

function declineRequest(requestId) {
    const requestData = findRequestById(requestId);
    if (!requestData) {
        showNotification('Request not found!', 'error');
        return;
    }
    
    const reason = prompt('Please enter reason for declining:');
    if (!reason) return;
    
    // Update request status
    const updatedRequest = {
        ...requestData,
        status: 'declined',
        declinedBy: 'Admin',
        declineReason: reason,
        declineDate: new Date().toISOString()
    };
    
    // Save updated request
    updateRequestInStorage(updatedRequest);
    
    // Send notifications
    sendDeclineNotifications(updatedRequest, reason);
    
    // Add system log
    addSystemLog(
        `Admin declined request from ${updatedRequest.studentName}. Reason: ${reason}`,
        'admin_decline'
    );
    
    // Reload requests
    loadAllRequests();
    
    showNotification('Request declined.', 'info');
}

function updateRequestInStorage(updatedRequest) {
    // Check if it's the main student request
    const studentRequest = getRequestFromStorage('labEquipmentRequest');
    if (studentRequest && studentRequest.timestamp === updatedRequest.timestamp) {
        localStorage.setItem('labEquipmentRequest', JSON.stringify(updatedRequest));
        return;
    }
    
    // Update in confirmed requests
    const confirmedRequests = getRequestFromStorage('confirmedRequests') || [];
    let updated = false;
    
    for (let i = 0; i < confirmedRequests.length; i++) {
        const req = confirmedRequests[i];
        const reqId = req.timestamp || new Date(req.approvedDate || req.date || req.dateFiled).getTime();
        
        if (reqId == updatedRequest.timestamp) {
            confirmedRequests[i] = updatedRequest;
            updated = true;
            break;
        }
    }
    
    if (updated) {
        localStorage.setItem('confirmedRequests', JSON.stringify(confirmedRequests));
    }
    
    // If not found in confirmed requests, check declined requests
    if (!updated) {
        const declinedRequests = getRequestFromStorage('professorDeclinedRequests') || [];
        
        for (let i = 0; i < declinedRequests.length; i++) {
            const req = declinedRequests[i];
            const reqId = req.timestamp || new Date(req.approvedDate || req.date || req.dateFiled).getTime();
            
            if (reqId == updatedRequest.timestamp) {
                declinedRequests[i] = updatedRequest;
                localStorage.setItem('professorDeclinedRequests', JSON.stringify(declinedRequests));
                break;
            }
        }
    }
}

function sendApprovalNotifications(requestData) {
    // Notification to admin
    addAdminNotification(
        `You approved ${requestData.studentName}'s request`,
        'admin_approval',
        requestData.timestamp
    );
    
    // Notification to student
    addNotification(
        'studentNotifications',
        `Your request has been approved by admin`,
        'admin_approval'
    );
    
    // Notification to professor
    addNotification(
        'professorNotifications',
        `Request from ${requestData.studentName} has been approved by admin`,
        'admin_approval',
        requestData.timestamp
    );
}

function sendDeclineNotifications(requestData, reason) {
    // Notification to admin
    addAdminNotification(
        `You declined ${requestData.studentName}'s request. Reason: ${reason}`,
        'admin_decline',
        requestData.timestamp
    );
    
    // Notification to student
    addNotification(
        'studentNotifications',
        `Your request has been declined by admin. Reason: ${reason}`,
        'admin_decline'
    );
    
    // Notification to professor
    addNotification(
        'professorNotifications',
        `Request from ${requestData.studentName} has been declined by admin. Reason: ${reason}`,
        'admin_decline',
        requestData.timestamp
    );
}

function addNotification(storageKey, message, type, requestId = null) {
    let notifications = getRequestFromStorage(storageKey) || [];
    notifications.unshift({
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false,
        requestId
    });
    localStorage.setItem(storageKey, JSON.stringify(notifications));
}

function addAdminNotification(message, type, requestId) {
    addNotification('adminNotifications', message, type, requestId);
}

function addSystemLog(message, action, type = 'info') {
    let logs = getRequestFromStorage('systemLogs') || [];
    logs.push({
        timestamp: new Date().toISOString(),
        message,
        action,
        type
    });
    localStorage.setItem('systemLogs', JSON.stringify(logs));
}

function setupEventListeners() {
    // Navigation click handler
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            if (!sectionId) return;

            // Hide all sections
            document.querySelectorAll('.section').forEach(s => {
                s.classList.remove('active');
            });

            // Show selected section
            const activeSection = document.getElementById(sectionId);
            if (activeSection) {
                activeSection.classList.add('active');
                
                // Load data for confirmed requests
                if (sectionId === 'confirmed') {
                    loadConfirmedRequests();
                }
            }
        });
    });

    // ... rest of your existing event listeners ...
}

function filterRequests(searchTerm) {
    const rows = document.querySelectorAll('#requests-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterRequestsByStatus(status) {
    const rows = document.querySelectorAll('#requests-table-body tr');
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const rowStatus = row.getAttribute('data-status');
            row.style.display = rowStatus === status ? '' : 'none';
        }
    });
}

// Add to setupEventListeners()
function setupEventListeners() {
    // Navigation handler
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = document.getElementById(link.dataset.section);
        if (section) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            section.classList.add('active');
            if (link.dataset.section === 'confirmed') {
            loadConfirmedRequests();
        }
        }
    });
    });
    const DEFAULT_EQUIPMENT = [
        { 
            id: 1,
            name: "Huion Kamvas Pro 16 Interactive Pen",
            quantity: 20,
            laboratory: "Multimedia Lab",
            status: "available"
        },
        {
            id: 2,
            name: "DC Power Supply 127V (0-12V)",
            quantity: 35,
            laboratory: "Electronics Lab",
            status: "available"
        },
        {
            id: 3,
            name: "Digital Multimeter (Alexan AC650)",
            quantity: 40,
            laboratory: "Electrical Lab",
            status: "available"
        },
        {
            id: 4,
            name: "Analog Multitester (SANWA YX360TRF)",
            quantity: 35,
            laboratory: "Electrical Lab",
            status: "available"
        },
        {
            id: 5,
            name: "AC Panel Meter (300V); Unix",
            quantity: 30,
            laboratory: "Power Systems Lab",
            status: "available"
        },
        {
            id: 6,
            name: "LAN Tester RJ45/RJ11; Generic",
            quantity: 40,
            laboratory: "Networking Lab",
            status: "available"
        }
    ];

    // Confirmed requests search
    const confirmedSearch = document.getElementById('confirmed-search');
    if (confirmedSearch) {
        confirmedSearch.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('#confirmed-table-body tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
        });
    });
    }
}

  // Add new function to load confirmed requests
function loadConfirmedRequests() {
    try {
        const confirmedRequests = JSON.parse(localStorage.getItem('confirmedRequests')) || [];
        const tableBody = document.getElementById('confirmed-table-body');
        tableBody.innerHTML = confirmedRequests
        .filter(req => req.status === 'admin_approved')
        .map(request => `
            <tr>
            <td>${request.studentName}</td>
            <td>${request.studentNumber}</td>
            <td>${request.laboratory}</td>
            <td>${new Date(request.adminApprovalDate).toLocaleDateString()}</td>
            <td>${request.adminApprovalNotes || '-'}</td>
            <td><span class="status-badge status-admin_approved">Approved</span></td>
            </tr>
        `).join('') || '<tr><td colspan="6">No confirmed requests found</td></tr>';
    } catch (error) {
        console.error("Error loading confirmed requests:", error);
        showNotification("Error loading confirmed requests", "error");
    }
}

function approveRequest(requestId) {
    // ... existing approval logic ...
    // After saving
    loadAllRequests();
    
    // Refresh confirmed section if active
    if (document.getElementById('confirmed').classList.contains('active')) {
        loadConfirmedRequests();
    }
    
    showNotification('Request approved successfully!', 'success');
}

function filterRequestsByDate(range) {
    const rows = document.querySelectorAll('#requests-table-body tr');
    const now = new Date();
    
    rows.forEach(row => {
        if (range === 'all') {
            row.style.display = '';
            return;
        }
        
        const dateStr = row.getAttribute('data-date');
        if (!dateStr) {
            row.style.display = 'none';
            return;
        }
        
        const date = new Date(dateStr);
        let show = false;
        
        switch(range) {
            case 'today':
                show = isSameDay(date, now);
                break;
            case 'week':
                show = isSameWeek(date, now);
                break;
            case 'month':
                show = isSameMonth(date, now);
                break;
        }
        
        row.style.display = show ? '' : 'none';
    });
}
function checkForNewRequests() {
    const confirmedRequests = getRequestFromStorage('confirmedRequests') || [];
    const lastChecked = localStorage.getItem('adminLastChecked') || 0;
    let newRequests = false;
    
    confirmedRequests.forEach(req => {
        const requestTime = req.timestamp || new Date(req.date || req.dateFiled).getTime();
        if (requestTime > lastChecked && req.status === 'professor_approved') {
            newRequests = true;
            addAdminNotification(
                `New professor-approved request from ${req.name || req.studentName}`,
                'new_request',
                requestTime
            );
        }
    });
    
    if (newRequests) {
        showNotification('New professor-approved requests available!', 'info');
        localStorage.setItem('adminLastChecked', Date.now());
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

function formatStatus(status) {
    switch(status) {
        case 'pending': return 'Pending';
        case 'professor_approved': return 'Professor Approved';
        case 'admin_approved': return 'Admin Approved';
        case 'declined': return 'Declined';
        default: return 'Pending';
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'pending': return 'status-pending';
        case 'professor_approved': return 'status-professor_approved';
        case 'admin_approved': return 'status-admin_approved';
        case 'declined': return 'status-declined';
        default: return 'status-pending';
    }
}

// -----------------------Equipment Management Functions//-----------------------


const equipmentStorageKey = 'equipmentList';

function loadEquipment() {
    const equipment = JSON.parse(localStorage.getItem(equipmentStorageKey)) || [];
    const tbody = document.getElementById('equipment-table-body');
    tbody.innerHTML = equipment.map(equip => `
    <tr data-id="${equip.id}">
    <td>${equip.name}</td>
    <td>${equip.quantity}</td>
    <td>${equip.laboratory}</td>
    <td class="status-${equip.status}">${equip.status}</td>
    <td>
        <button class="edit-equipment">Edit</button>
        <button class="delete-equipment">Delete</button>
        </td>
    </tr>
    `).join('');
}

function handleEquipmentAdd() {
const newEquipment = {
    id: Date.now(),
    name: prompt('Equipment name:'),
    quantity: parseInt(prompt('Quantity:')),
    laboratory: prompt('Laboratory:'),
    status: 'available'
};

const equipment = JSON.parse(localStorage.getItem(equipmentStorageKey)) || [];
equipment.push(newEquipment);
localStorage.setItem(equipmentStorageKey, JSON.stringify(equipment));
loadEquipment();
}

function handleEquipmentEdit(id) {
    const equipment = JSON.parse(localStorage.getItem(equipmentStorageKey));
    const index = equipment.findIndex(e => e.id === id);
    equipment[index] = {
    ...equipment[index],
    name: prompt('New name:', equipment[index].name),
    quantity: parseInt(prompt('New quantity:', equipment[index].quantity)),
    laboratory: prompt('New laboratory:', equipment[index].laboratory),
    status: prompt('New status:', equipment[index].status)
};

localStorage.setItem(equipmentStorageKey, JSON.stringify(equipment));
loadEquipment();
}

function handleEquipmentDelete(id) {
    if (confirm('Delete this equipment?')) {
    const equipment = JSON.parse(localStorage.getItem(equipmentStorageKey))
    .filter(e => e.id !== id);
    localStorage.setItem(equipmentStorageKey, JSON.stringify(equipment));
    loadEquipment();
}
}

// Add to setupEventListeners()
document.getElementById('add-equipment-btn').addEventListener('click', handleEquipmentAdd);
document.querySelector('#equipment-table-body').addEventListener('click', (e) => {
    const id = Number(e.target.closest('tr').dataset.id);
    if (e.target.classList.contains('edit-equipment')) handleEquipmentEdit(id);
    if (e.target.classList.contains('delete-equipment')) handleEquipmentDelete(id);
});

// Initialize equipment on page load
loadEquipment();


document.addEventListener('DOMContentLoaded', function() {
    // Section switching logic
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('nav a[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            // Update active nav link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
        });
    });
    
    // Form validation for equipment management
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const inputs = this.querySelectorAll('input[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = 'red';
                    isValid = false;
                } else {
                    input.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields');
            }
        });
    });
});
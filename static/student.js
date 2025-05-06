// Student Form JavaScript - Complete code with notifications

document.addEventListener("DOMContentLoaded", function () {
    // Item selection functionality
    const itemList = document.querySelector(".item-list");
    const confirmedItems = document.querySelector(".confirmed-items");

    if (itemList) {
        itemList.addEventListener("change", function (event) {
            if (event.target.type === "checkbox") {
                const itemName = event.target.dataset.item;
                
                if (event.target.checked) {
                    addItemToConfirmed(itemName);
                } else {
                    removeItemFromConfirmed(itemName);
                }
            }
        });
    }

    function addItemToConfirmed(itemName) {
        if (!confirmedItems) return;
        
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("confirmed-item");
        itemDiv.dataset.item = itemName;
        
        itemDiv.innerHTML = `
            <span>${itemName}</span>
            <div class="quantity-controls">
                <button class="decrease">-</button>
                <span class="quantity">1</span>
                <button class="increase">+</button>
            </div>
        `;
        
        confirmedItems.appendChild(itemDiv);
        
        const decreaseBtn = itemDiv.querySelector(".decrease");
        const increaseBtn = itemDiv.querySelector(".increase");
        const quantitySpan = itemDiv.querySelector(".quantity");
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener("click", function() {
                let quantity = parseInt(quantitySpan.textContent);
                if (quantity > 1) {
                    quantitySpan.textContent = quantity - 1;
                }
            });
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener("click", function() {
                let quantity = parseInt(quantitySpan.textContent);
                quantitySpan.textContent = quantity + 1;
            });
        }
    }

    function removeItemFromConfirmed(itemName) {
        if (!confirmedItems) return;
        
        const itemDiv = confirmedItems.querySelector(`.confirmed-item[data-item="${itemName}"]`);
        if (itemDiv) {
            itemDiv.remove();
        }
    }

    // Notification functionality
    function showNotification(message) {
        let notification = document.getElementById("notification");
        if (!notification) {
            // Create notification element if it doesn't exist
            notification = document.createElement("div");
            notification.id = "notification";
            notification.classList.add("notification");
            document.body.appendChild(notification);
        }
        
        notification.innerText = message;
        notification.classList.add("show");
        
        setTimeout(() => {
            notification.classList.remove("show");
        }, 3000);
    }

    // Handle send approval button
    const sendApprovalBtn = document.querySelector('.send-approval');
    
    if (sendApprovalBtn) {
        sendApprovalBtn.addEventListener('click', function() {
            // Get all the input fields
            const nameInput = document.querySelector('input[placeholder="Enter your Name"]');
            const subjectInput = document.querySelector('input[placeholder="Enter your Course"]');
            const numberInput = document.querySelector('input[placeholder="Enter student number"]');
            const labInput = document.querySelector('input[placeholder="Enter Subject"]');
            const dateInput = document.querySelector('input[type="date"]');
            const timeInput = document.querySelector('input[type="time"]');
            
            // Get all confirmed items
            const confirmedItems = document.querySelectorAll('.confirmed-item');
            const selectedItems = [];
            
            confirmedItems.forEach(item => {
                const itemName = item.dataset.item;
                const quantityElement = item.querySelector('.quantity');
                const quantity = quantityElement ? parseInt(quantityElement.textContent) : 1;
                
                selectedItems.push({
                    name: itemName,
                    quantity: quantity
                });
            });
            
            // Create request data object with all collected information
            const requestData = {
                studentName: nameInput ? nameInput.value : "",
                subject: subjectInput ? subjectInput.value : "",
                studentNumber: numberInput ? numberInput.value : "",
                laboratory: labInput ? labInput.value : "",
                dateFiled: dateInput ? dateInput.value : "",
                timeNeeded: timeInput ? timeInput.value : "",
                items: selectedItems,
                status: "pending",
                timestamp: new Date().getTime()
            };
            
            console.log("Saving request data:", requestData);
            
            // Save to localStorage with a consistent key name
            localStorage.setItem("labEquipmentRequest", JSON.stringify(requestData));
            
            // Show notification
            showNotification("Request sent for approval!");
            
            // Add to notifications
            addNotification("Your equipment request has been sent for approval.", "info");
            
            alert("Request submitted successfully!");
        });
    }

    // Other UI functionality
    const profileIcon = document.getElementById("profile-icon");
    const profileDropdown = document.getElementById("profile-dropdown");
    
    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener("click", function(event) {
            event.stopPropagation();
            profileDropdown.classList.toggle("active");
        });
        
        document.addEventListener("click", function(event) {
            if (!profileIcon.contains(event.target) && !profileDropdown.contains(event.target)) {
                profileDropdown.classList.remove("active");
            }
        });
    }

    // Add logout functionality
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            // Clear any user-related data if needed
            // localStorage.removeItem("userSession");
            
            // Redirect to sign-in page
            window.location.href = "/login"; 
        });
    }

    // Create a notification dropdown in the HTML
    function createNotificationDropdown() {
        // Check if it already exists
        if (document.getElementById('notification-dropdown')) return;
        
        const notificationBtn = document.getElementById('notification-btn');
        if (!notificationBtn) return;
        
        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.id = 'notification-dropdown';
        dropdown.classList.add('notification-dropdown');
        
        // Create header with title and mark all as read button
        const header = document.createElement('div');
        header.classList.add('notification-header');
        header.innerHTML = `
            <span>Notifications</span>
            <button id="mark-all-read">Mark all as read</button>
        `;
        
        // Create notification list
        const list = document.createElement('div');
        list.classList.add('notification-list');
        list.id = 'notification-list';
        
        // Append elements
        dropdown.appendChild(header);
        dropdown.appendChild(list);
        
        // Insert after notification button
        notificationBtn.parentNode.insertBefore(dropdown, notificationBtn.nextSibling);
        
        // Add badge to notification button for unread count
        const badge = document.createElement('span');
        badge.id = 'notification-badge';
        badge.classList.add('notification-badge');
        badge.style.display = 'none';
        notificationBtn.appendChild(badge);
        
        // Setup event handlers
        notificationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.classList.toggle('active');
            loadNotifications();
        });
        
        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target) && e.target !== notificationBtn) {
                dropdown.classList.remove('active');
            }
        });
        
        // Mark all as read button
        document.getElementById('mark-all-read').addEventListener('click', function() {
            markAllNotificationsAsRead();
        });
    }

    // Add a notification to the system
    function addNotification(message, type = 'info') {
        // Get existing notifications
        let notifications = JSON.parse(localStorage.getItem('studentNotifications')) || [];
        
        // Add new notification to beginning of array
        notifications.unshift({
            message: message,
            type: type,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Limit to 20 notifications
        if (notifications.length > 20) {
            notifications = notifications.slice(0, 20);
        }
        
        // Save back to localStorage
        localStorage.setItem('studentNotifications', JSON.stringify(notifications));
        
        // Update badge count
        updateNotificationBadge();
        
        // Also show toast notification
        showNotification(message);
    }

    // Load and display notifications in the dropdown
    function loadNotifications() {
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;
        
        // Clear existing notifications
        notificationList.innerHTML = '';
        
        // Get notifications from localStorage
        const notifications = JSON.parse(localStorage.getItem('studentNotifications')) || [];
        
        if (notifications.length === 0) {
            notificationList.innerHTML = '<div class="empty-notification">No notifications</div>';
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
            
            notificationItem.innerHTML = `
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formattedDate}</div>
                </div>
                <div class="notification-actions">
                    <button class="mark-read" data-index="${index}">${notification.read ? 'Mark unread' : 'Mark read'}</button>
                </div>
            `;
            
            notificationList.appendChild(notificationItem);
            
            // Add event listener to mark read button
            notificationItem.querySelector('.mark-read').addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                toggleNotificationRead(index);
            });
        });
    }

    // Update the notification badge with unread count
    function updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        
        const notifications = JSON.parse(localStorage.getItem('studentNotifications')) || [];
        const unreadCount = notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    // Toggle read status of a notification
    function toggleNotificationRead(index) {
        const notifications = JSON.parse(localStorage.getItem('studentNotifications')) || [];
        
        if (index >= 0 && index < notifications.length) {
            notifications[index].read = !notifications[index].read;
            localStorage.setItem('studentNotifications', JSON.stringify(notifications));
            loadNotifications();
            updateNotificationBadge();
        }
    }

    // Mark all notifications as read
    function markAllNotificationsAsRead() {
        const notifications = JSON.parse(localStorage.getItem('studentNotifications')) || [];
        
        notifications.forEach(notification => {
            notification.read = true;
        });
        
        localStorage.setItem('studentNotifications', JSON.stringify(notifications));
        loadNotifications();
        updateNotificationBadge();
    }

    // Check for updates in reservation status
    function checkRequestStatus() {
        const requestData = JSON.parse(localStorage.getItem('labEquipmentRequest'));
        
        if (requestData) {
            // Get the last known status
            const lastStatus = localStorage.getItem('lastKnownStatus') || 'unknown';
            
            if (requestData.status !== lastStatus && lastStatus !== 'unknown') {
                // Status has changed
                if (requestData.status === 'approved') {
                    addNotification('Your equipment request has been approved!', 'success');
                } else if (requestData.status === 'declined') {
                    addNotification(`Your equipment request was declined. Reason: ${requestData.declineReason || 'Not provided'}`, 'error');
                }
            }
            
            // Update last known status
            localStorage.setItem('lastKnownStatus', requestData.status);
        }
    }

    // Create notification dropdown when page loads
    createNotificationDropdown();

    // Update notification badge on page load
    updateNotificationBadge();

    // Check for status changes periodically
    setInterval(checkRequestStatus, 5000);

    // Initial check for request status
    checkRequestStatus();
});

const sendApprovalBtn = document.querySelector('.send-approval');
if (sendApprovalBtn) {
  sendApprovalBtn.addEventListener('click', async () => {
    // Collect inputs
    const name    = document.querySelector('input[placeholder="Enter your Name"]')?.value || "";
    const course  = document.querySelector('input[placeholder="Enter your Course"]')?.value || "";
    const number  = document.querySelector('input[placeholder="Enter student number"]')?.value || "";
    const lab     = document.querySelector('input[placeholder="Enter Subject"]')?.value || "";
    const date    = document.querySelector('input[type="date"]')?.value || "";
    const time    = document.querySelector('input[type="time"]')?.value || "";
    const items   = Array.from(document.querySelectorAll('.confirmed-item')).map(item => ({
      name: item.dataset.item,
      quantity: parseInt(item.querySelector('.quantity')?.textContent) || 1
    }));

    const payload = {
      student_name:  name,
      student_number: number,
      subject:        lab,
      course:         course,
      laboratory:     lab,
      date_filed:     date,
      time_needed:    time,
      items:          items,
      status:         "pending"
    };

    try {
      const res = await fetch('/student/submit-request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      alert('Request submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('Error submitting request.');
    }
  });
}

fetch('/api/inventory')
.then(response => response.json())
.then(data => {
  console.log("Inventory Data:", data);
  // You can now dynamically render it into your HTML
})
.catch(error => {
  console.error('Error fetching inventory:', error);
});
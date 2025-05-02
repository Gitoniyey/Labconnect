document.addEventListener('DOMContentLoaded', function() {
    const userTypeBtns = document.querySelectorAll('.user-type-btn');
    const loginForm = document.getElementById('loginForm');
    let currentUserType = 'student';

    // Handle user type selection
    userTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            userTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentUserType = btn.dataset.type;
        });
    });

    // Handle login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple validation
        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Store user data in localStorage
        const userData = {
            username: username,
            type: currentUserType,
            name: username // You can modify this based on your user data
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // Redirect based on user type
        switch(currentUserType) {
            case 'student':
                window.location.href = 'Student.html';
                break;
            case 'professor':
                window.location.href = 'professor.html';
                break;
            case 'admin':
                window.location.href = 'admin.html';
                break;
        }
    });
});
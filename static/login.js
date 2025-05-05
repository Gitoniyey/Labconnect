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

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            alert('Username and password are required.');
            return;
        }

        const userData = {
            username: username,
            type: currentUserType
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // Dynamic redirection via Jinja (rendered in HTML)
        window.location.href = window.routes[currentUserType];

    });
});

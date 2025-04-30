document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", function () {
        navLinks.classList.toggle("show");
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contactForm");
    const formMessage = document.getElementById("form-message");

    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();

        formMessage.textContent = "Thank you for your message! We will get back to you soon.";
        formMessage.style.color = "white";

        contactForm.reset();
    });
});


function openModal(formType) {
    document.getElementById("authModal").style.display = "flex";
    
    if (formType === "signup") {
        document.getElementById("signupForm").style.display = "block";
        document.getElementById("signinForm").style.display = "none";
    } else {
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("signinForm").style.display = "block";
    }
}
function closeModal() {
    document.getElementById('authModal').style.display = 'none';
}


function toggleForms(formType) {
    if (formType === "signup") {
        document.getElementById("signupForm").style.display = "block";
        document.getElementById("signinForm").style.display = "none";
    } else {
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("signinForm").style.display = "block";
    }
}
document.addEventListener("DOMContentLoaded", function () {
    const signinForm = document.getElementById("signinForm");

    if (signinForm) {
        signinForm.addEventListener("submit", function (event) {
            event.preventDefault();

            // Get input values and clean them up
            const email = document.getElementById("email").value.trim().toLowerCase();
            const password = document.getElementById("password").value.trim();

            // Dummy users (use a real database in production)
            const users = {
                "student@example.com": { role: "student", password: "student123" },
                "admin@example.com": { role: "admin", password: "admin123" }
            };

            // Check if the email exists
            if (users[email]) {
                if (users[email].password === password) {
                    // Redirect based on user role
                    if (users[email].role === "student") {
                        window.location.href = "student.html";
                    } else if (users[email].role === "admin") {
                        window.location.href = "admin.html";
                    }
                } else {
                    alert("Incorrect password. Please try again.");
                }
            } else {
                alert("Email not found. Please check your email or sign up.");
            }
        });
    } else {
        console.error("Error: signinForm not found in the DOM.");
    }
});
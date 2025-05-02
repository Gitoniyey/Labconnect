function editItem(button) {
    let row = button.parentElement.parentElement;
    let itemCell = row.cells[0];
    let currentText = itemCell.innerText;
    let newText = prompt("Edit Item:", currentText);
    if (newText) {
        itemCell.innerText = newText;
    }
}

function openPopup(name) {
    document.getElementById("popup-text").innerText = name + "'s request details go here.";
    document.getElementById("popup").style.display = "block";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// Get elements
const modal = document.getElementById("requestModal");
const btn = document.getElementById("viewRequestBtn");
const closeBtn = document.querySelector(".close");
const formDataContainer = document.getElementById("formData");

// Sample data (Replace with actual data from your form or database)
const studentFormData = {
    name: "Shane Ramirez",
    email: "shaneramirez@gmail.com",
    course: "Computer Engineering",
    year: "2nd Year"
};

// Function to populate the modal with form data
function populateFormData() {
    formDataContainer.innerHTML = `
        <p><strong>Name:</strong> ${studentFormData.name}</p>
        <p><strong>Email:</strong> ${studentFormData.email}</p>
        <p><strong>Course:</strong> ${studentFormData.course}</p>
        <p><strong>Year:</strong> ${studentFormData.year}</p>
    `;
}

// Open modal when button is clicked
btn.addEventListener("click", function () {
    populateFormData(); // Fill the modal with form data
    modal.style.display = "block";
});

// Close modal when 'X' is clicked
closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
});

// Close modal if user clicks outside of it
window.addEventListener("click", function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});
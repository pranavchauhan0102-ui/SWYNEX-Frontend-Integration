
// Backend API URL
const API_URL = "http://localhost:5000/api/applications";
// Stores the ID of the application being edited
let editingApplicationId = null;

// Get HTML elements
const applicationsList = document.getElementById("applicationsList");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

// Fetch applications from backend
async function fetchApplications() {

    // Show loading message
    loadingMessage.textContent = "Loading applications...";
    loadingMessage.style.display = "block";
    errorMessage.textContent = "";

    try {
        // Send GET request to backend
        const response = await fetch(API_URL);

        // Check whether request was successful
        if (!response.ok) {
            throw new Error("Failed to fetch applications");
        }

        // Convert response into JavaScript data
        const result = await response.json();

        // Display applications
        displayApplications(result.data);
        updateDashboardStats(result.data);

    } catch (error) {

        // Display error
        errorMessage.textContent =
            "Unable to load applications. Please check your backend.";

        console.error("Error:", error);

    } finally {

        // Hide loading message
        loadingMessage.style.display = "none";
    }
}

// Display applications on webpage
function displayApplications(applications) {

    applicationsList.innerHTML = "";

    if (applications.length === 0) {
        applicationsList.innerHTML =
            "<p>No applications found. Add your first application!</p>";
        return;
    }

    applications.forEach(application => {

        const card = document.createElement("div");
        card.className = "application-card";

        const details = document.createElement("div");

        const heading = document.createElement("h3");
        heading.textContent = application.company;

        const role = document.createElement("p");
        role.textContent = "Role: " + application.role;

        const location = document.createElement("p");
        location.textContent = "Location: " + application.location;

        const status = document.createElement("span");

        status.className =
            "status-badge status-" + application.status.toLowerCase();

        status.textContent = application.status;
        details.append(heading, role, location, status);

        // Create Edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-button";

        editButton.addEventListener("click", function() {
            editApplication(application);
        });
        // Create Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function() {
            deleteApplication(application._id);
        });

        // Group action buttons together
        const actions = document.createElement("div");
        actions.className = "application-actions";

        actions.append(editButton, deleteButton);

        card.append(details, actions);
        applicationsList.appendChild(card);
        
    });

}
    
function updateDashboardStats(applications) {

    // Total applications
    document.getElementById("totalApplications").textContent =
        applications.length;

    // Count interviews
    document.getElementById("totalInterviews").textContent =
        applications.filter(app => app.status === "Interview").length;

    // Count offers
    document.getElementById("totalOffers").textContent =
        applications.filter(app => app.status === "Offer").length;

    // Count rejected applications
    document.getElementById("totalRejected").textContent =
        applications.filter(app => app.status === "Rejected").length;
}



// Load applications when page opens
fetchApplications();



// Get the application form
const applicationForm = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");
const cancelEditButton = document.getElementById("cancelEdit");

// Handle form submission
applicationForm.addEventListener("submit", async function(event) {

    // Prevent page from refreshing
    event.preventDefault();

    // Get values entered by the user
    const applicationData = {
        company: document.getElementById("company").value.trim(),
        role: document.getElementById("role").value.trim(),
        location: document.getElementById("location").value.trim(),
        status: document.getElementById("status").value,
        jobLink: document.getElementById("jobLink").value.trim(),
        notes: document.getElementById("notes").value.trim()
    };

    // Show loading message
    formMessage.textContent = "Adding application...";
    formMessage.style.color = "blue";

    try {

        const url = editingApplicationId
            ? `${API_URL}/${editingApplicationId}`
            : API_URL;

        const method = editingApplicationId ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(applicationData)
        });

        const result = await response.json();

        // Handle unsuccessful response
        if (!response.ok) {
            throw new Error(result.message || "Failed to add application");
        }

        // Show success message
        formMessage.textContent = editingApplicationId
            ? "Application updated successfully!"
            : "Application added successfully!";
        formMessage.style.color = "green";

        // Clear the form
        applicationForm.reset();
        cancelEditButton.style.display = "none";
        editingApplicationId = null;
        applicationForm.querySelector('button[type="submit"]').textContent =
            "Add Application";

        // Refresh application list
        await fetchApplications();

    } catch (error) {

        // Show error message
        formMessage.textContent = error.message;
        formMessage.style.color = "red";

        console.error("Submission Error:", error);
    }
});


// Search and filter applications
const searchCompany = document.getElementById("searchCompany");
const filterStatus = document.getElementById("filterStatus");

// Fetch applications based on search and status
async function filterApplications() {

    const company = searchCompany.value.trim();
    const status = filterStatus.value;

    // Build API URL with query parameters
    const params = new URLSearchParams();

    if (company) {
        params.append("company", company);
    }

    if (status) {
        params.append("status", status);
    }

    const url = `${API_URL}?${params.toString()}`;

    try {
        loadingMessage.style.display = "block";
        errorMessage.textContent = "";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to filter applications");
        }

        const result = await response.json();

        // Update application list and dashboard
        displayApplications(result.data);
        updateDashboardStats(result.data);

    } catch (error) {

        errorMessage.textContent = error.message;
        console.error(error);

    } finally {
        loadingMessage.style.display = "none";
    }
}

// Run filtering whenever the user types or changes status
searchCompany.addEventListener("input", filterApplications);
filterStatus.addEventListener("change", filterApplications);


// Delete an application
async function deleteApplication(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this application?"
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to delete application");
        }

        alert("Application deleted successfully!");

        // Refresh the application list
        await filterApplications();

    } catch (error) {
        alert(error.message);
        console.error("Delete Error:", error);
    }
}

// Load application details into the form for editing
function editApplication(application) {

    editingApplicationId = application._id;
    applicationForm.querySelector('button[type="submit"]').textContent =
        "Update Application";
    cancelEditButton.style.display = "inline-block";

    document.getElementById("company").value = application.company;
    document.getElementById("role").value = application.role;
    document.getElementById("location").value = application.location;
    document.getElementById("status").value = application.status;
    document.getElementById("jobLink").value = application.jobLink || "";
    document.getElementById("notes").value = application.notes || "";

    formMessage.textContent = "Editing application: " + application.company;
    formMessage.style.color = "blue";

    // Scroll to the form
    applicationForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Cancel editing
cancelEditButton.addEventListener("click", function() {

    editingApplicationId = null;

    applicationForm.reset();
    applicationForm.querySelector('button[type="submit"]').textContent =
        "Add Application";

    cancelEditButton.style.display = "none";

    formMessage.textContent = "Editing cancelled.";
    formMessage.style.color = "blue";
});
from flask import Flask, render_template, request, redirect, url_for
from supabase import create_client, Client

app = Flask(__name__)

# Supabase connection details
url = "https://jkcvqfbdvcnuhzxqtwii.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprY3ZxZmJkdmNudWh6eHF0d2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NDgxODEsImV4cCI6MjA2MTIyNDE4MX0.M9HyWsUOTZY3HGTHX8BosizBfao09huIHFyF8NOKqRY"
supabase: Client = create_client(url, key)

# Admin Dashboard Route
@app.route("/admin")
def admin_dashboard():
    student_requests = supabase.table("student_requests").select("*").execute().data
    return render_template("admin_dashboard.html", student_requests=student_requests)

# Update Request Status Route (Admin)
@app.route("/admin/update-status", methods=["POST"])
def update_status():
    request_id = request.form.get("request_id")
    action = request.form.get("action")

    new_status = "Approved" if action == "approve" else "Declined"

    supabase.table("student_requests").update({
        "status": new_status
    }).eq("request_id", request_id).execute()

    return redirect(url_for("admin_dashboard"))

# Update Inventory Route (Admin)
@app.route("/admin/update-inventory", methods=["POST"])
def update_inventory():
    item_id = request.form.get("item_id")
    action = request.form.get("action")

    if action == "update":
        # Update inventory logic here
        pass
    elif action == "delete":
        # Delete inventory logic here
        pass

    return redirect(url_for("admin_dashboard"))

# Student Dashboard Route
@app.route("/student")
def student_dashboard():
    student_id = "example_student_id"  # Fetch dynamically based on session or login system
    student_requests = supabase.table("student_requests").select("*").eq("student_id", student_id).execute().data
    return render_template("student_dashboard.html", student_requests=student_requests)

# Submit Student Request Route
@app.route("/student/submit-request", methods=["POST"])
def submit_request():
    subject = request.form.get("subject")
    description = request.form.get("description")
    student_id = "example_student_id"  # Replace with the student’s actual ID from the session or login system

    supabase.table("student_requests").insert({
        "subject": subject,
        "description": description,
        "student_id": student_id,
        "status": "Pending"
    }).execute()

    return redirect(url_for("student_dashboard"))

# Professor Dashboard Route
@app.route("/professor")
def professor_dashboard():
    professor_id = "example_professor_id"  # Replace with actual professor ID from session or login system
    student_requests = supabase.table("student_requests").select("*").eq("professor_id", professor_id).execute().data
    return render_template("professor_dashboard.html", student_requests=student_requests)

# Approve Student Request Route (Professor)
@app.route("/professor/approve-request/<int:request_id>")
def approve_request(request_id):
    supabase.table("student_requests").update({"status": "Approved"}).eq("request_id", request_id).execute()
    return redirect(url_for("professor_dashboard"))

# Decline Student Request Route (Professor)
@app.route("/professor/decline-request/<int:request_id>")
def decline_request(request_id):
    supabase.table("student_requests").update({"status": "Declined"}).eq("request_id", request_id).execute()
    return redirect(url_for("professor_dashboard"))

# Routes for Static Pages
@app.route("/")
def labconnect():
    return render_template("Labconnect.html")

@app.route("/learnmore")
def learnmore():
    return render_template("learnmore.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/privacy-policy")
def privacy_policy():
    return render_template("privacy-policy.html")

@app.route("/terms-of-service")
def terms_of_service():
    return render_template("terms-of-service.html")

# Routes for Student and Professor Pages
@app.route("/student")
def student():
    return render_template("Student.html")

@app.route("/professor")
def professor():
    return render_template("professor.html")

# Run Flask App
if __name__ == "__main__":
    app.run(debug=True)

from flask import Flask, render_template, request, redirect, url_for, jsonify
from supabase import create_client, Client
from postgrest import APIError

app = Flask(__name__)

# Supabase connection details
url = "https://jkcvqfbdvcnuhzxqtwii.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprY3ZxZmJkdmNudWh6eHF0d2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NDgxODEsImV4cCI6MjA2MTIyNDE4MX0.M9HyWsUOTZY3HGTHX8BosizBfao09huIHFyF8NOKqRY"
supabase: Client = create_client(url, key)



# Admin Dashboard Route
@app.route("/admin/dashboard")
def admin_dashboard():
    student_requests = supabase.table("student_requests").select("*").execute().data
    return render_template("admin_dashboard.html", student_requests=student_requests)

@app.route("/admin/update-status", methods=["POST"])
def update_status():
    request_id = request.form.get("request_id")
    action = request.form.get("action")
    new_status = "Approved" if action == "approve" else "Declined"
    supabase.table("student_requests").update({
        "status": new_status
    }).eq("request_id", request_id).execute()
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/update-inventory", methods=["POST"])
def update_inventory():
    item_id = request.form.get("item_id")
    action = request.form.get("action")
    # Placeholder for logic
    return redirect(url_for("admin_dashboard"))

# === Student Dashboard ===
@app.route("/student/dashboard")
def student_dashboard():
    student_id = "example_student_id"  # Replace with real student ID if using login/session
    student_requests = supabase.table("student_requests").select("*").eq("student_id", student_id).execute().data
    return render_template("student_dashboard.html", student_requests=student_requests)



@app.route("/student/submit-request", methods=["POST"])
def submit_request():
    data = request.get_json() or {}
    items = data.get("items", [])

    # 1) Insert main row inside try/except
    try:
        main_resp = supabase.table("student_requests") \
            .insert({
                "student_name":   data.get("student_name", ""),
                "student_number": data.get("student_number", ""),
                "subject":        data.get("subject", ""),
                "course":         data.get("course", ""),
                "laboratory":     data.get("laboratory", ""),
                "date_filed":     data.get("date_filed", ""),
                "time_needed":    data.get("time_needed", ""),
                "status":         data.get("status", "pending")
            }).execute()
    except APIError as err:
        return jsonify({"error": err.message}), 400

    # 2) Grab the generated request_id
    request_id = main_resp.data[0].get("request_id")
    if not request_id:
        return jsonify({"error": "Failed to retrieve request_id"}), 500

    # 3) Insert each item
    inserted_items = []
    for item in items:
        try:
            item_resp = supabase.table("request_items") \
                .insert({
                    "request_id":        request_id,
                    "item_name":         item.get("name"),
                    "confirmed":         item.get("confirmed", False),
                    "inventory_item_id": item.get("inventory_item_id")
                }).execute()
            inserted_items.append(item_resp.data[0])
        except APIError:
            # Optionally log or handle partial failures
            continue

    return jsonify({
        "success": True,
        "request": main_resp.data[0],
        "items":   inserted_items
    }), 200

# === Professor Dashboard ===
@app.route("/professor/dashboard")
def professor_dashboard():
    professor_id = "example_professor_id"  # Replace with real professor ID
    student_requests = supabase.table("student_requests").select("*").eq("professor_id", professor_id).execute().data
    return render_template("professor_dashboard.html", student_requests=student_requests)

@app.route("/professor/approve-request/<int:request_id>")
def approve_request(request_id):
    supabase.table("student_requests").update({"status": "Approved"}).eq("request_id", request_id).execute()
    return redirect(url_for("professor_dashboard"))

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


@app.route("/privacy-policy")
def privacy_policy():
    return render_template("privacy-policy.html")

@app.route("/terms-of-service")
def terms_of_service():
    return render_template("terms-of-service.html")

# Routes for Student and Professor Pages
@app.route('/student')
def student():
    return render_template('student.html')

@app.route('/professor')
def professor():
    return render_template('professor.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route("/login")
def login():
    return render_template("login.html")


# Run Flask App
if __name__ == "__main__":
    app.run(debug=True)

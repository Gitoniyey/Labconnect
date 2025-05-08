from flask import Flask, jsonify, render_template, request, redirect, url_for
from supabase import create_client, Client
from datetime import datetime
from postgrest import APIError


app = Flask(__name__)

# Supabase connection details
url = "https://jkcvqfbdvcnuhzxqtwii.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprY3ZxZmJkdmNudWh6eHF0d2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NDgxODEsImV4cCI6MjA2MTIyNDE4MX0.M9HyWsUOTZY3HGTHX8BosizBfao09huIHFyF8NOKqRY"
supabase: Client = create_client(url, key)


@app.route("/admin/dashboard")
def admin_dashboard():
    student_requests = supabase.table("student_requests").select("*").execute().data
    inventory_items = supabase.table("inventory_items").select("*").execute().data
    return render_template("admin_dashboard.html", 
                         student_requests=student_requests, 
                         inventory_items=inventory_items)

@app.route("/admin/update-inventory", methods=["POST"])
def update_inventory():
    item_id = request.form.get("item_id")
    updates = {
        "name": request.form.get("name"),
        "quantity": request.form.get("quantity"),
        "price": request.form.get("price"),
        "category": request.form.get("category")
    }
    
    # Update in Supabase
    supabase.table("inventory_items").update(updates).eq("id", item_id).execute()
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/add-inventory", methods=["POST"])
def add_inventory():
    new_item = {
        "name": request.form.get("name"),
        "quantity": request.form.get("quantity"),
        "price": request.form.get("price"),
        "category": request.form.get("category")
    }
    
    # Insert into Supabase
    supabase.table("inventory_items").insert(new_item).execute()
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/delete-inventory/<item_id>", methods=["POST"])
def delete_inventory(item_id):
    supabase.table("inventory_items").delete().eq("id", item_id).execute()
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

    # Extract request fields
    student_name   = data.get("student_name", "")
    student_number = data.get("student_number", "")
    subject        = data.get("subject", "")
    course         = data.get("course", "")
    laboratory     = data.get("laboratory", "")
    date_filed     = data.get("date_filed", "")
    time_needed    = data.get("time_needed", "")
    status         = data.get("status", "Pending")
    items          = data.get("items", [])  # items = list of dicts like {item_name, inventory_item_id}

    # 1. Insert the main student request
    response = supabase.table("student_requests").insert({
        "student_name": student_name,
        "student_number": student_number,
        "subject": subject,
        "course": course,
        "laboratory": laboratory,
        "date_filed": date_filed,
        "time_needed": time_needed,
        "status": status
    }).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    # 2. Get the new request_id
    request_id = response.data[0]["request_id"]

    # 3. Insert each item into request_items
    request_items = []
    for item in items:
        request_items.append({
            "request_id": request_id,
            "item_name": item.get("item_name", ""),
            "inventory_item_id": item.get("inventory_item_id")  # this should match the FK in request_items
        })

    if request_items:
        item_response = supabase.table("request_items").insert(request_items).execute()
        if item_response.error:
            return jsonify({"error": item_response.error.message}), 400

    return jsonify({"message": "Request submitted successfully"}), 200


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

@app.route('/student')
def student():
    try:
        response = supabase.table('inventory_items').select("*").execute()
        items = response.data  # Get the data from the response
        return render_template('Student.html', inventory=items)
    except Exception as e:
        return f"Error fetching data: {str(e)}", 500


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

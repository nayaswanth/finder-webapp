
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Add request logging
@app.before_request
def log_request_info():
    print(f"🔍 {request.method} {request.url} - Data: {request.get_json() if request.is_json else 'No JSON'}")

DATA_FILE = 'employees.json'
OPP_FILE = 'opportunities.json'

def load_opportunities():
    if not os.path.exists(OPP_FILE):
        with open(OPP_FILE, 'w') as f:
            json.dump([], f)
    with open(OPP_FILE, 'r') as f:
        return json.load(f)

def save_opportunities(opps):
    with open(OPP_FILE, 'w') as f:
        json.dump(opps, f, indent=2)

# Helper: get opportunity by index (id)
def get_opp_by_id(idx):
    opps = load_opportunities()
    if 0 <= idx < len(opps):
        return opps[idx]
    return None

# Helper: save opportunity by index
def save_opp_by_id(idx, opp):
    opps = load_opportunities()
    if 0 <= idx < len(opps):
        opps[idx] = opp
        save_opportunities(opps)
        return True
    return False

# Get single opportunity by id (index)
@app.route('/opportunities/<int:opp_id>', methods=['GET'])
def get_opportunity(opp_id):
    opp = get_opp_by_id(opp_id)
    if not opp:
        return jsonify({'success': False, 'message': 'Opportunity not found'}), 404
    employees = load_employees()
    email_to_name = {emp['email']: emp['name'] for emp in employees}
    opp_copy = opp.copy()
    opp_copy['id'] = opp_id  # Add the ID to the opportunity
    # Add default status if not present
    if 'status' not in opp_copy:
        opp_copy['status'] = 'open'
    poster_email = opp.get('email')
    opp_copy['postedBy'] = email_to_name.get(poster_email, 'Unknown')
    return jsonify({'success': True, 'opportunity': opp_copy})

# Apply to an opportunity
@app.route('/opportunities/<int:opp_id>/apply', methods=['POST'])
def apply_opportunity(opp_id):
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'success': False, 'message': 'Email required'}), 400
    opp = get_opp_by_id(opp_id)
    if not opp:
        return jsonify({'success': False, 'message': 'Opportunity not found'}), 404
    if 'applied' not in opp:
        opp['applied'] = []
    if email not in opp['applied']:
        opp['applied'].append(email)
    save_opp_by_id(opp_id, opp)
    return jsonify({'success': True, 'message': 'Applied successfully'})

# Mark not interested
@app.route('/opportunities/<int:opp_id>/not_interested', methods=['POST'])
def not_interested_opportunity(opp_id):
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'success': False, 'message': 'Email required'}), 400
    opp = get_opp_by_id(opp_id)
    if not opp:
        return jsonify({'success': False, 'message': 'Opportunity not found'}), 404
    if 'not_interested' not in opp:
        opp['not_interested'] = []
    if email not in opp['not_interested']:
        opp['not_interested'].append(email)
    save_opp_by_id(opp_id, opp)
    return jsonify({'success': True, 'message': 'Marked as not interested'})

# Close an opportunity
@app.route('/opportunities/<int:opp_id>/close', methods=['POST'])
def close_opportunity(opp_id):
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'success': False, 'message': 'Email required'}), 400
    opp = get_opp_by_id(opp_id)
    if not opp:
        return jsonify({'success': False, 'message': 'Opportunity not found'}), 404
    # Check if the user is the poster of this opportunity
    if opp.get('email') != email:
        return jsonify({'success': False, 'message': 'Only the poster can close this opportunity'}), 403
    opp['status'] = 'closed'
    save_opp_by_id(opp_id, opp)
    return jsonify({'success': True, 'message': 'Opportunity closed successfully'})

# Reopen an opportunity
@app.route('/opportunities/<int:opp_id>/reopen', methods=['POST'])
def reopen_opportunity(opp_id):
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'success': False, 'message': 'Email required'}), 400
    opp = get_opp_by_id(opp_id)
    if not opp:
        return jsonify({'success': False, 'message': 'Opportunity not found'}), 404
    # Check if the user is the poster of this opportunity
    if opp.get('email') != email:
        return jsonify({'success': False, 'message': 'Only the poster can reopen this opportunity'}), 403
    opp['status'] = 'open'
    save_opp_by_id(opp_id, opp)
    return jsonify({'success': True, 'message': 'Opportunity reopened successfully'})

# Accept an applicant
@app.route('/opportunities/<int:opp_id>/accept', methods=['POST'])
def accept_applicant(opp_id):
    print(f"🎯 ACCEPT ENDPOINT CALLED - opp_id: {opp_id}")
    data = request.json
    print(f"🎯 ACCEPT DATA: {data}")
    applicant_email = data.get('applicantEmail')
    if not applicant_email:
        return jsonify({'success': False, 'message': 'Applicant email required'}), 400
    
    opp = get_opp_by_id(opp_id)
    if not opp:
        return jsonify({'success': False, 'message': 'Opportunity not found'}), 404
    
    # Initialize application statuses if not present
    if 'application_statuses' not in opp:
        opp['application_statuses'] = {}
    
    # Set the applicant's status to accepted
    opp['application_statuses'][applicant_email] = 'accepted'
    print(f"🎯 ACCEPT SUCCESS - Set {applicant_email} to accepted for opp {opp_id}")
    
    save_opp_by_id(opp_id, opp)
    return jsonify({'success': True, 'message': 'Applicant accepted successfully'})

# Reject an applicant
@app.route('/opportunities/<int:opp_id>/reject', methods=['POST'])
def reject_applicant(opp_id):
    print(f"❌ REJECT ENDPOINT CALLED - opp_id: {opp_id}")
    data = request.json
    print(f"❌ REJECT DATA: {data}")
    applicant_email = data.get('applicantEmail')
    if not applicant_email:
        return jsonify({'success': False, 'message': 'Applicant email required'}), 400
    
    opp = get_opp_by_id(opp_id)
    if not opp:
        return jsonify({'success': False, 'message': 'Opportunity not found'}), 404
    
    # Initialize application statuses if not present
    if 'application_statuses' not in opp:
        opp['application_statuses'] = {}
    
    # Set the applicant's status to rejected
    opp['application_statuses'][applicant_email] = 'rejected'
    
    save_opp_by_id(opp_id, opp)
    return jsonify({'success': True, 'message': 'Applicant rejected successfully'})

# Endpoint to post a new opportunity
@app.route('/opportunities', methods=['POST'])
def post_opportunity():
    data = request.json
    # Only require mandatory fields (marked with * in frontend)
    required_fields = ['title', 'description', 'type', 'startDate', 'endDate', 'hoursPerWeek', 'email']
    
    # Check for required fields
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field] or str(data[field]).strip() == '':
            missing_fields.append(field)
    
    if missing_fields:
        return jsonify({'success': False, 'message': f'Required fields missing: {", ".join(missing_fields)}'}), 400
    
    # Ensure optional fields have default values if not provided
    if 'domain' not in data or not data['domain']:
        data['domain'] = ''
    if 'industry' not in data or not data['industry']:
        data['industry'] = ''
    if 'roles' not in data:
        data['roles'] = []
    if 'skills' not in data:
        data['skills'] = []
    
    # Add default status if not provided
    if 'status' not in data:
        data['status'] = 'open'
    
    opps = load_opportunities()
    opps.append(data)
    save_opportunities(opps)
    return jsonify({'success': True, 'message': 'Opportunity posted successfully'})

# Endpoint to get all opportunities
@app.route('/opportunities', methods=['GET'])
def get_opportunities():
    opps = load_opportunities()
    employees = load_employees()
    email_to_name = {emp['email']: emp['name'] for emp in employees}
    # Add postedBy field and index-based ID to each opportunity
    opps_with_names = []
    for i, opp in enumerate(opps):
        opp_copy = opp.copy()
        opp_copy['id'] = i  # Add index as ID
        # Add default status if not present
        if 'status' not in opp_copy:
            opp_copy['status'] = 'open'
        poster_email = opp.get('email')
        opp_copy['postedBy'] = email_to_name.get(poster_email, 'Unknown')
        opps_with_names.append(opp_copy)
    return jsonify({'success': True, 'opportunities': opps_with_names})


def load_employees():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_employees(employees):
    with open(DATA_FILE, 'w') as f:
        json.dump(employees, f, indent=2)

@app.route('/employees', methods=['GET'])
def get_employees():
    employees = load_employees()
    # Return employees without passwords for security
    safe_employees = []
    for emp in employees:
        safe_emp = emp.copy()
        safe_emp.pop('password', None)  # Remove password field
        safe_employees.append(safe_emp)
    return jsonify({'success': True, 'employees': safe_employees})

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    required_fields = ['name', 'email', 'password', 'industry', 'domain', 'role']
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({'success': False, 'message': 'All fields are required: name, email, password, industry, domain, role'}), 400
    employees = load_employees()
    if any(emp['email'] == data['email'] for emp in employees):
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    employees.append({
        'name': data['name'],
        'email': data['email'],
        'password': data['password'],  # In production, hash passwords!
        'industry': data['industry'],
        'domain': data['domain'],
        'role': data['role']  # Role is now required
    })
    save_employees(employees)
    return jsonify({'success': True, 'message': 'Employee registered successfully'})

@app.route('/employees/<email>', methods=['PUT'])
def update_employee(email):
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    employees = load_employees()
    employee_found = False
    
    for i, emp in enumerate(employees):
        if emp['email'] == email:
            employee_found = True
            # Update only the fields that are provided
            if 'name' in data:
                employees[i]['name'] = data['name']
            if 'role' in data:
                employees[i]['role'] = data['role']
            if 'industry' in data:
                employees[i]['industry'] = data['industry']
            if 'domain' in data:
                employees[i]['domain'] = data['domain']
            break
    
    if not employee_found:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    save_employees(employees)
    
    # Return the updated employee without password
    updated_emp = employees[i].copy()
    updated_emp.pop('password', None)
    return jsonify({'success': True, 'message': 'Employee updated successfully', 'employee': updated_emp})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
    employees = load_employees()
    for emp in employees:
        if emp['email'] == data['email'] and emp['password'] == data['password']:
            return jsonify({'success': True, 'message': 'Login successful', 'employee': emp})
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

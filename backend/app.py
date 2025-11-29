from dotenv import load_dotenv
import os

load_dotenv()   # Loads .env automatically

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")


from flask import Flask, redirect, request, jsonify, session, send_file
from flask_cors import CORS
import requests
import tempfile
import os
import io
from config import CLIENT_ID, CLIENT_SECRET, SECRET_KEY

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.secret_key = SECRET_KEY

MICROSERVICE_URL = "http://microservice:5000/predict-file"

GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
GOOGLE_CONFIG = requests.get(GOOGLE_DISCOVERY_URL).json()
AUTH_URL = GOOGLE_CONFIG["authorization_endpoint"]
TOKEN_URL = GOOGLE_CONFIG["token_endpoint"]
USERINFO_URL = GOOGLE_CONFIG["userinfo_endpoint"]

REDIRECT_URI = "http://localhost:5001/auth/callback"


# -------------------------------------------
# GOOGLE LOGIN (REDIRECT)
# -------------------------------------------
@app.route("/auth/login")
def login():
    google_auth_url = (
        f"{AUTH_URL}?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    return redirect(google_auth_url)


# -------------------------------------------
# GOOGLE CALLBACK
# -------------------------------------------
@app.route("/auth/callback")
def callback():
    if "code" not in request.args:
        return "Missing authorization code", 400

    code = request.args["code"]

    token_data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    token_res = requests.post(TOKEN_URL, data=token_data)
    token_json = token_res.json()

    if "access_token" not in token_json:
        return f"Token error: {token_json}", 400

    session["access_token"] = token_json["access_token"]

    # Fetch user info
    headers = {"Authorization": f"Bearer {session['access_token']}"}
    user_info = requests.get(USERINFO_URL, headers=headers).json()

    session["user"] = {
        "name": user_info.get("name"),
        "email": user_info.get("email"),
        "picture": user_info.get("picture"),
    }

    # Redirect back to React frontend
    return redirect("http://localhost:5174")


# -------------------------------------------
# USERINFO ENDPOINT
# -------------------------------------------
@app.route("/auth/userinfo")
def userinfo():
    if "user" not in session:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(session["user"])


# -------------------------------------------
# LOGOUT
# -------------------------------------------
@app.route("/auth/logout")
def logout():
    session.clear()
    return jsonify({"status": "logged out"})


# -------------------------------------------
# PROTECTED FILE UPLOAD (requires login)
# -------------------------------------------
@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]

        files = {"file": (file.filename, file.stream, file.mimetype)}
        micro_res = requests.post(MICROSERVICE_URL, files=files)

        if micro_res.status_code != 200:
            return jsonify({"error": "Microservice error", "details": micro_res.text}), 500

        temp_dir = tempfile.mkdtemp()
        output_path = os.path.join(temp_dir, "prediction_output.csv")

        with open(output_path, "wb") as f:
            f.write(micro_res.content)

        return send_file(
            output_path,
            mimetype="text/csv",
            as_attachment=True,
            download_name="prediction_output.csv"
        )

    except Exception as e:
        return jsonify({"error": "Server error", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=True)

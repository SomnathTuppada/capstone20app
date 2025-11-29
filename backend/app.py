# Backend (auth gateway) - app.py
from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, redirect, request, jsonify, session, send_file
from flask_cors import CORS
import requests
import tempfile
import io
import traceback

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY")

app = Flask(__name__)
app.secret_key = SECRET_KEY

# ----------------------------
# IMPORTANT: change this if your microservice is reachable at a different host
# If microservice runs locally use 127.0.0.1:5000; if you run in docker-compose use the service name.
MICROSERVICE_URL = "http://127.0.0.1:5000/predict-file"
# ----------------------------

# Allow only the frontend origin (required when using credentials)
FRONTEND_ORIGIN = "http://localhost:5174"  # change if your frontend runs on different port

CORS(app, supports_credentials=True, resources={r"/*": {"origins": [FRONTEND_ORIGIN]}})

# Google endpoints
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
GOOGLE_CONFIG = requests.get(GOOGLE_DISCOVERY_URL).json()
AUTH_URL = GOOGLE_CONFIG["authorization_endpoint"]
TOKEN_URL = GOOGLE_CONFIG["token_endpoint"]
USERINFO_URL = GOOGLE_CONFIG["userinfo_endpoint"]

REDIRECT_URI = "http://localhost:5001/auth/callback"

# ----------------------------
# Authentication endpoints
# ----------------------------
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

    headers = {"Authorization": f"Bearer {session['access_token']}"}
    user_info = requests.get(USERINFO_URL, headers=headers).json()

    session["user"] = {
        "name": user_info.get("name"),
        "email": user_info.get("email"),
        "picture": user_info.get("picture"),
    }

    return redirect("http://localhost:5174")  # frontend address


@app.route("/auth/userinfo")
def userinfo():
    if "user" not in session:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(session["user"])


@app.route("/auth/logout")
def logout():
    session.clear()
    return jsonify({"status": "logged out"})


# ----------------------------
# Protected upload that forwards to microservice
# ----------------------------
@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]

        # Rewind stream to start (defensive)
        try:
            file.stream.seek(0)
        except Exception:
            pass

        # Use file.read() to get bytes (safer) or forward file.stream directly
        file_bytes = file.read()
        files = {"file": (file.filename, file_bytes, file.mimetype)}

        # call microservice with timeout and proper error handling
        try:
            micro_res = requests.post(MICROSERVICE_URL, files=files, timeout=30)
        except requests.RequestException as e:
            # return the actual error to frontend for debugging (connection refused, DNS error etc.)
            return jsonify({"error": "Microservice connection failed", "details": str(e)}), 502

        if micro_res.status_code != 200:
            # forward microservice error body & status code
            return (micro_res.content, micro_res.status_code, {"Content-Type": micro_res.headers.get("Content-Type", "text/plain")})

        # Save to temp file and send as attachment
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
        tb = traceback.format_exc()
        return jsonify({"error": "Server error", "details": str(e), "traceback": tb}), 500


if __name__ == "__main__":
    # Bind to 127.0.0.1:5001 as you had before
    app.run(host="127.0.0.1", port=5001, debug=True)

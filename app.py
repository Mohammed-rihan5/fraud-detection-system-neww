"""
Veritas — Flask Backend
Serves: /signup, /login, /predict, /history/<user>

Requirements:
    pip install flask flask-cors transformers torch safetensors
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import json, os, re
from datetime import datetime

app = Flask(__name__)
CORS(app)  # allow requests from your frontend

# ─────────────────────────────────────────
#  CONFIG — adjust paths if needed
# ─────────────────────────────────────────
MODEL_DIR   = "../model"          # folder containing all 5 model files
DB_FILE     = "./db.json"        # simple JSON "database"

# Label map — change if your training used different labels
# 0 = FAKE, 1 = REAL  (most common convention)
ID2LABEL = { 0: "FAKE", 1: "REAL" }

# ─────────────────────────────────────────
#  LOAD MODEL (once at startup)
# ─────────────────────────────────────────
print("Loading DistilBert model…")
tokenizer = DistilBertTokenizer.from_pretrained(MODEL_DIR)
model     = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()
print("Model ready.")

# ─────────────────────────────────────────
#  SIMPLE JSON DATABASE
# ─────────────────────────────────────────
def load_db():
    if not os.path.exists(DB_FILE):
        return {"users": {}, "history": {}}
    with open(DB_FILE) as f:
        return json.load(f)

def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=2)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Serve all frontend files statically
@app.route('/frontend/<path:filename>')
def frontend(filename):
    return send_from_directory('../frontend', filename)

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

# ─────────────────────────────────────────
#  PREDICTION HELPERS
# ─────────────────────────────────────────
def predict_text(text: str) -> dict:
    """Run DistilBert inference. Returns label + confidence score."""
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True
    )
    with torch.no_grad():
        logits = model(**inputs).logits

    probs     = torch.softmax(logits, dim=1)[0]
    pred_id   = int(torch.argmax(probs))
    label     = ID2LABEL.get(pred_id, str(pred_id))
    # confidence that the article is REAL (label 1)
    real_conf = float(probs[1]) if len(probs) > 1 else float(probs[0])
    return {"label": label, "real_confidence": real_conf, "probs": probs.tolist()}


def build_report(text: str, source: str, country: str) -> dict:
    """Turn raw prediction into a full report the frontend expects."""
    result = predict_text(text)
    label  = result["label"]          # "REAL" or "FAKE"
    conf   = result["real_confidence"] # 0.0 → 1.0

    # Credibility score: 0-100 (how likely the article is real)
    credibility = round(conf * 100)

    # Verdict string
    if credibility >= 75:
        verdict = "✅ Likely Credible"
    elif credibility >= 45:
        verdict = "⚠️ Potentially Misleading"
    else:
        verdict = "🚫 Likely Fake / Unreliable"

    # Bias score: simple heuristic (50 = center; you can improve this)
    bias_score, bias_label = detect_bias(text)

    # Red flags
    flags = detect_flags(text, credibility)

    return {
        "verdict":     verdict,
        "credibility": credibility,
        "bias_score":  bias_score,
        "bias_label":  bias_label,
        "flags":       flags,
        "label":       label,
        "source":      source,
        "country":     country,
        "timestamp":   datetime.utcnow().isoformat()
    }


def detect_bias(text: str):
    """
    Very lightweight keyword bias heuristic.
    Returns (position 0-100, label string).
    Replace with a real bias model if you have one.
    """
    text_lower = text.lower()

    left_words  = ["progressive", "socialist", "inequality", "systemic", "climate crisis",
                   "gun control", "universal healthcare", "defund", "marginalized"]
    right_words = ["conservative", "traditional", "patriot", "border security", "freedom",
                   "second amendment", "deep state", "mainstream media", "radical left"]

    l_count = sum(text_lower.count(w) for w in left_words)
    r_count = sum(text_lower.count(w) for w in right_words)
    total   = l_count + r_count

    if total == 0:
        return 50, "Center / Unknown"

    # 0 = far left, 100 = far right
    score = round((r_count / total) * 100)

    if score < 30:
        label = "Left-leaning"
    elif score > 70:
        label = "Right-leaning"
    else:
        label = "Center"

    return score, label


def detect_flags(text: str, credibility: int) -> list:
    """Rule-based red flag detector."""
    flags = []
    t = text.lower()

    patterns = [
        (r"\b(breaking|urgent|exclusive)\b",        "Sensationalist language detected"),
        (r"\b(they don'?t want you to know)\b",     "Conspiracy framing detected"),
        (r"[A-Z]{5,}",                               "Excessive use of capital letters"),
        (r"(!{2,}|\?{2,})",                          "Excessive punctuation"),
        (r"\b(anonymous source|sources say)\b",      "Unverified anonymous sources"),
        (r"\b(miracle|shocking|you won'?t believe)\b","Clickbait phrasing detected"),
        (r"\b(hoax|plandemic|deep state|cabal)\b",   "Known misinformation terms found"),
        (r"\b(share this|spread the word|wake up)\b","Viral manipulation language"),
    ]

    for pattern, message in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            flags.append(message)

    if credibility < 40:
        flags.append("Model confidence in credibility is very low")

    return flags if flags else []


# ─────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────

@app.route("/signup", methods=["POST"])
def signup():
    body     = request.get_json()
    username = body.get("username", "").strip()
    email    = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    db = load_db()
    if email in db["users"]:
        return jsonify({"error": "Email already registered"}), 400

    db["users"][email] = {"username": username, "password": password}
    db["history"][email] = []
    save_db(db)

    return jsonify({"username": username, "email": email})


@app.route("/login", methods=["POST"])
def login():
    body     = request.get_json()
    email    = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db   = load_db()
    user = db["users"].get(email)

    if not user:
        return jsonify({"error": "No account found with that email"}), 404
    if user["password"] != password:
        return jsonify({"error": "Incorrect password"}), 401

    return jsonify({"username": user["username"], "email": email})


@app.route("/predict", methods=["POST"])
def predict():
    body     = request.get_json()
    username = body.get("username", "")
    text     = body.get("text", "").strip()
    source   = body.get("source", "")
    country  = body.get("country", "")

    if len(text) < 30:
        return jsonify({"error": "Text too short (min 30 characters)"}), 400

    report = build_report(text, source, country)

    # Save to history (keyed by username)
    db = load_db()
    if username not in db["history"]:
        db["history"][username] = []

    db["history"][username].insert(0, {   # newest first
        "text":        text[:500],         # store first 500 chars
        "source":      source,
        "country":     country,
        "credibility": report["credibility"],
        "verdict":     report["verdict"],
        "bias_label":  report["bias_label"],
        "bias_score":  report["bias_score"],
        "flags":       report["flags"],
        "timestamp":   report["timestamp"]
    })

    # Keep last 50 reports per user
    db["history"][username] = db["history"][username][:50]
    save_db(db)

    return jsonify(report)


@app.route("/history/<username>", methods=["GET"])
def history(username):
    db      = load_db()
    records = db["history"].get(username, [])
    return jsonify(records)


# ─────────────────────────────────────────
#  RUN
# ─────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
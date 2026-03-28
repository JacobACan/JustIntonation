"""
yt-dlp audio extraction microservice.
Accepts a YouTube URL, extracts audio-only, returns the audio file.
"""

import base64
import os
import tempfile
import uuid

from flask import Flask, request, jsonify, send_file

import yt_dlp

app = Flask(__name__)

API_KEY = os.environ.get("API_KEY", "")
MAX_DURATION = int(os.environ.get("MAX_DURATION", "600"))  # 10 min default

# Write cookies from env var (base64-encoded cookies.txt) to a file on startup
COOKIES_FILE = None
COOKIES_B64 = os.environ.get("YOUTUBE_COOKIES_B64", "")
if COOKIES_B64:
    COOKIES_FILE = "/tmp/cookies.txt"
    with open(COOKIES_FILE, "w") as f:
        f.write(base64.b64decode(COOKIES_B64).decode("utf-8"))


def require_api_key(f):
    """Simple API key auth middleware."""
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        if API_KEY:
            key = request.headers.get("X-API-Key", "")
            if key != API_KEY:
                return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)

    return decorated


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/extract", methods=["POST"])
@require_api_key
def extract_audio():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "Missing 'url' field"}), 400

    # Basic YouTube URL validation
    if not any(
        host in url
        for host in ["youtube.com", "youtu.be", "music.youtube.com"]
    ):
        return jsonify({"error": "Only YouTube URLs are supported"}), 400

    try:
        # First, get video info to check duration
        info_opts = {"quiet": True, "no_warnings": True}
        if COOKIES_FILE:
            info_opts["cookiefile"] = COOKIES_FILE
        with yt_dlp.YoutubeDL(info_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            duration = info.get("duration", 0)
            title = info.get("title", "audio")

            if duration and duration > MAX_DURATION:
                return (
                    jsonify(
                        {
                            "error": f"Video too long ({duration}s). Max is {MAX_DURATION}s."
                        }
                    ),
                    400,
                )

        # Download audio only
        tmp_dir = tempfile.mkdtemp()
        output_path = os.path.join(tmp_dir, f"{uuid.uuid4().hex}")

        ydl_opts = {
            "format": "bestaudio[ext=m4a]/bestaudio/best",
            "outtmpl": output_path + ".%(ext)s",
            "quiet": True,
            "no_warnings": True,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "m4a",
                    "preferredquality": "128",
                }
            ],
        }
        if COOKIES_FILE:
            ydl_opts["cookiefile"] = COOKIES_FILE

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the output file
        audio_file = None
        for f in os.listdir(tmp_dir):
            if f.startswith(os.path.basename(output_path)):
                audio_file = os.path.join(tmp_dir, f)
                break

        if not audio_file or not os.path.exists(audio_file):
            return jsonify({"error": "Failed to extract audio"}), 500

        # Sanitize title for filename
        safe_title = "".join(
            c for c in title if c.isalnum() or c in " -_"
        ).strip()[:80]
        ext = os.path.splitext(audio_file)[1] or ".m4a"

        return send_file(
            audio_file,
            mimetype="audio/mp4",
            as_attachment=True,
            download_name=f"{safe_title}{ext}",
        )

    except yt_dlp.utils.DownloadError as e:
        return jsonify({"error": f"Download failed: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

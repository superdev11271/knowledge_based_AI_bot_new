from flask import Blueprint, request, jsonify, current_app
from utils import client

chat = Blueprint("chat", __name__)

@chat.route("/", methods=["POST"])
def question():
    payload = request.json or {}
    qeury = payload.get('query')

    response = client.chat.completions.create(
        model="gpt-5",
        messages=[{"role": "user", "content": qeury}]
    )
    result_msg = response.choices[0].message.content

    return jsonify({"message": result_msg})

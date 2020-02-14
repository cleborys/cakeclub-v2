from flask import render_template, url_for
from app.members import blueprint
from flask_socketio import emit
from app import socketio
from flask_login import current_user, login_required
import app.users as users


@blueprint.route("/members")
@login_required
def members():
    return render_template("members.html")


@socketio.on("request_members")
def send_sessions():
    members = users.read_all()

    stripped_members = [
        {
            "username": member["username"],
            "eaten": len(member["sessions"]) + member["eaten_offset"],
            "baked": len(member["baker_sessions"]) + member["baked_offset"],
        }
        for member in members
    ]
    for member in stripped_members:
        member["quota"] = member["baked"] / max(member["eaten"], 1)
    stripped_members.sort(key=lambda x: x["quota"])

    emit("member_list", {"data": stripped_members})

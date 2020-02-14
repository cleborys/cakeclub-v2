from flask import render_template, url_for
from app.admin import blueprint
from flask_socketio import emit
from app import socketio
from flask_login import current_user, login_required
import app.clubsessions as clubsessions

import app.lobby.routes as lobbyroutes

@blueprint.route("/admin")
@login_required
def admin():
    return render_template("admin.html")


@socketio.on("create_session")
def create_session(data):
    new_session = clubsessions.create()
    broadcast_session_update()


@socketio.on("delete_session")
def delete_session(session_id):
    clubsessions.delete(session_id, current_user)
    broadcast_session_update()


def broadcast_session_update():
    emit("sessions_updated", broadcast=True)


@socketio.on("request_sessions")
def send_sessions():
    return lobbyroutes.send_sessions()

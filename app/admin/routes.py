from flask import render_template, url_for
from app.admin import blueprint
from flask_socketio import emit
from app import socketio
from flask_login import current_user, login_required
import app.clubsessions as clubsessions
import app.lobby.routes as lobbyroutes
from app.errors.flashed import FlashedError, flashed_errors_forwarded

import datetime


@blueprint.route("/admin")
@login_required
def admin():
    return render_template("admin.html")


@socketio.on("create_session")
@flashed_errors_forwarded
def create_session(data):
    date = None
    if "date" in data:
        date = datetime.datetime.strptime(data["date"], "%Y-%m-%d").date()
    if date is not None and date < datetime.date.today():
        raise InvalidDateError

    new_session = clubsessions.create(date=date)
    broadcast_session_update()


@socketio.on("create_next_session")
@flashed_errors_forwarded
def create_next_session(data):
    clubsessions.create_next_session()
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


class InvalidDateError(FlashedError):
    user_description = "You can only create sessions in the future."

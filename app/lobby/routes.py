from flask import render_template, url_for
from app.lobby import blueprint
from flask_socketio import emit
from app import socketio
from flask_login import current_user, login_required
import app.clubsessions as clubsessions
from app.errors.flashed import UnauthorisedError, FlashedError, flashed_errors_forwarded


@blueprint.route("/lobby")
@login_required
def lobby():
    return render_template("lobby.html")


@socketio.on("create_session")
def create_session(data):
    new_session = clubsessions.create()
    broadcast_session_update()


@socketio.on("join_session")
def join_session(session_id):
    clubsessions.join(session_id, current_user)
    broadcast_session_update()


@socketio.on("become_baker")
def become_baker(session_id):
    clubsessions.join(session_id, current_user)
    clubsessions.become_baker(session_id, current_user)
    broadcast_session_update()


@socketio.on("leave_session")
def leave_session(session_id):
    clubsessions.leave(session_id, current_user)
    broadcast_session_update()


def broadcast_session_update():
    emit("sessions_updated", broadcast=True)


@socketio.on("request_sessions")
def send_sessions():
    open_clubsessions = clubsessions.read_all()

    for session in open_clubsessions:
        session.update(
            {
                "i_am_participating": current_user.user_id
                in map(lambda user_dict: user_dict["user_id"], session["participants"]),
                "i_am_baking": session["baker"]
                and current_user.user_id == session["baker"]["user_id"],
                "has_a_baker": session["baker"] is not None,
            }
        )

    emit("open_sessions", {"data": open_clubsessions})


class NondescriptError(FlashedError):
    user_description = "Something went wrong."

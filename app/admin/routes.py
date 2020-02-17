from flask import render_template, url_for, current_app, redirect, flash
from app.admin import blueprint
from flask_socketio import emit
from app import socketio
from flask_login import current_user, login_required
import app.clubsessions as clubsessions
import app.users as users_module
import app.lobby.routes as lobbyroutes
from app.email import send_email
from app.errors.flashed import FlashedError, flashed_errors_forwarded

from sqlalchemy.exc import SQLAlchemyError
import datetime


@blueprint.route("/admin/<string:token>")
@login_required
def admin(token):
    if token != current_app.config["ADMIN_KEY"]:
        flash("authorization invalid")
        return redirect(url_for("lobby.lobby"))
    return render_template("admin.html")


@socketio.on("create_user")
@flashed_errors_forwarded
def create_user(data):
    user_data = {
        "username": data["username"],
        "email": data["email"],
        "eaten_offset": int(data.get("eaten_offset", 0)),
        "baked_offset": int(data.get("baked_offset", 0)),
    }
    try:
        new_user = users_module.create(user_data, data["password"])
    except SQLAlchemyError:
        raise DatabaseError

    if data.get("future"):
        clubsessions.join_all_future_sessions(new_user)

    if data.get("send_welcome_email") is not False:
        send_email(
            "Your Cakeclub Account",
            current_app.config["ADMIN_EMAIL"],
            recipients=[new_user.email],
            body=welcome_email_body(new_user, data["password"]),
        )
    broadcast_session_update()


def welcome_email_body(user, password):
    render_template("email/welcome.txt", user=new_user, password=password)


@socketio.on("force_baker")
@flashed_errors_forwarded
def force_baker(data):
    baker = users_module.get_user_by_id(data["baker_id"])
    clubsessions.become_baker(data["session_id"], baker)
    broadcast_session_update()


@socketio.on("remove_bakers")
@flashed_errors_forwarded
def remove_bakers(session_id):
    clubsessions.remove_bakers(session_id)
    broadcast_session_update()


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


@blueprint.route("/api/schedule/<string:token>", methods=["GET"])
def schedule_next_session_via_api(token):
    if token != current_app.config["ADMIN_KEY"]:
        return "authorization invalid"
    new_session = clubsessions.create_next_session()
    return f"scheduled new session {new_session}"


@socketio.on("delete_session")
def delete_session(session_id):
    clubsessions.delete(session_id)
    broadcast_session_update()


def broadcast_session_update():
    emit("sessions_updated", broadcast=True)


@socketio.on("request_sessions")
def send_sessions():
    return lobbyroutes.send_sessions()


@socketio.on("request_members")
def send_member_table():
    stripped_members = users_module.read_quota_list()
    emit("member_list", {"data": stripped_members})


class InvalidDateError(FlashedError):
    user_description = "You can only create sessions in the future."


class DatabaseError(FlashedError):
    user_description = "Your request upset the database."

from app.email import send_email
from flask import render_template, current_app


def send_bake_reminder_email(session):
    send_email(
        subject="Cakeclub: bake reminder",
        sender=current_app.config["ADMIN_EMAIL"],
        recipients=[current_app.config["ADMIN_EMAIL"]],
        body="bake reminder",
    )

def send_session_reminder_email(session):
    send_email(
        subject="Cakeclub: session reminder",
        sender=current_app.config["ADMIN_EMAIL"],
        recipients=[current_app.config["ADMIN_EMAIL"]],
        body="session reminder",
    )

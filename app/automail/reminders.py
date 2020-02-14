from app.email import send_email
from flask import render_template, current_app


def send_bake_reminder_email(session):
    send_email(
        subject="Cakeclub: bake reminder",
        sender=current_app.config["ADMIN_EMAIL"],
        recipients=[current_app.config["ADMIN_EMAIL"]],
        body=render_template(
            "email/bake_reminder.txt", session=session
        ),
    )

def send_session_reminder_email(user, phrase):
    send_email(
        subject="Cakeclub: session reminder",
        sender=current_app.config["ADMIN_EMAIL"],
        recipients=[current_app.config["ADMIN_EMAIL"]],
        next_bakeday = user.next_bakeday()
        body=render_template(
            "email/session_reminder.txt", user=user, secret_phrase=phrase,
            next_bakeday=next_bakeday,
        ),
    )

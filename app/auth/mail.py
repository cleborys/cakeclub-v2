from app.email import send_email
from flask import render_template, current_app


def send_password_reset_email(user):
    token = user.get_password_reset_token()
    send_email(
        "Cakeclub: Reset Your Password",
        current_app.config["ADMIN_EMAIL"],
        recipients=[user.email],
        body=render_template("email/password_reset.html", user=user, token=token),
        plain=render_template("email/password_reset.txt", user=user, token=token),
    )

from app.email import send_email
from flask import render_template, current_app


def send_bake_reminder_email(session):
    baker_emails = [baker.email for baker in session.bakers]
    baker_names = ", ".join(baker.username for baker in session.bakers)
    send_email(
        subject="Cakeclub: bake reminder",
        sender=current_app.config["ADMIN_EMAIL"],
        recipients=baker_emails,
        body=render_template(
            "email/bake_reminder.html",
            session=session,
            names=baker_names,
            participant_nbr=len(session.participants.all()),
        ),
        plain=render_template(
            "email/bake_reminder.txt",
            session=session,
            names=baker_names,
            participant_nbr=len(session.participants.all()),
        ),
    )


def send_session_reminder_email(user, phrase):
    send_email(
        subject="Cakeclub: session reminder",
        sender=current_app.config["ADMIN_EMAIL"],
        recipients=[user.email],
        body=render_template(
            "email/session_reminder.html",
            user=user,
            secret_phrase=phrase,
            next_bakeday=user.next_bakeday(),
        ),
        plain=render_template(
            "email/session_reminder.txt",
            user=user,
            secret_phrase=phrase,
            next_bakeday=user.next_bakeday(),
        ),
    )

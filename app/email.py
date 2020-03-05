from app import mail
from flask import current_app
from flask_mail import Message

from threading import Thread


def send_email_async(app, message):
    with app.app_context():
        mail.send(message)
    app.logger.info(f"Sent email to {message.recipients} about '{message.subject}'.")


def send_email(subject, sender, recipients, body, plain=None):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.html = body
    if plain is None:
        msg.body = body
    else:
        msg.body = plain
    current_app.logger.info(f"Scheduling email to {recipients} about '{subject}'.")
    Thread(
        target=send_email_async, args=(current_app._get_current_object(), msg)
    ).start()

from app import mail
from flask import current_app
from flask_mail import Message

from threading import Thread


def send_email_async(app, message):
    with app.app_context():
        mail.send(message)


def send_email(subject, sender, recipients, body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = body
    Thread(
        target=send_email_async, args=(current_app._get_current_object(), msg)
    ).start()

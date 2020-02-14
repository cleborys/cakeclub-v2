from app.automail import blueprint
from app.automail import reminders
from app.models import ClubSession
import app.clubsessions as clubsessions

import datetime
import username_generator

BAKE_REMINDER_ADVANCE = 3

@blueprint.route("/bakereminder/<string:token>", methods=["GET"])
def send_bake_reminder(token):
    target_sessions = get_sessions_in_n_days(BAKE_REMINDER_ADVANCE)
    for session in target_sessions:
        reminders.send_bake_reminder_email(session)
    
    return f"sent bake reminders for {len(target_sessions)} sessions."


@blueprint.route("/sessionreminder/<string:token>", methods=["GET"])
def send_session_reminder(token):
    target_sessions = get_sessions_in_n_days(0)
    secret_phrase = username_generator.get_uname(3, 64, False)

    users = set()
    for session in target_sessions:
        if session.baker is not None:
            users |= set(session.participants)
        else:
            clubsessions.delete(session.session_id)

    for user in users:
        reminders.send_session_reminder_email(user, secret_phrase)
    
    return f"sent session reminders for {len(target_sessions)} sessions."


def get_sessions_in_n_days(in_n_days):
    target_date = datetime.date.today() + datetime.timedelta(days=in_n_days)
    return ClubSession.query.filter(ClubSession.date == target_date).all()

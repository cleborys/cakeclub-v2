from app.models import ClubSession, ClubSessionSchema, User
from app import db
from app.errors.flashed import FlashedError

import datetime


def create(date=None):
    schema = ClubSessionSchema()
    new_clubsession = schema.load(dict(), session=db.session)

    active_users = User.query.filter(User.is_active == True).all()
    new_clubsession.participants.extend(active_users)

    if date is not None:
        new_clubsession.date = date

    db.session.add(new_clubsession)
    db.session.commit()

    return new_clubsession


def create_next_session():
    last_session = _get_most_future_scheduled_session()
    if last_session is None:
        raise NoLastSessionError
    next_date = last_session.date + datetime.timedelta(days=7)
    create(date=next_date)


def delete(session_id, user):
    session = get_by_id(session_id)
    db.session.delete(session)
    db.session.commit()


def join(session_id, user):
    clubsession = get_by_id(session_id)
    if user not in clubsession.participants:
        clubsession.participants.append(user)

    db.session.commit()


def become_baker(session_id, user):
    clubsession = get_by_id(session_id)
    if clubsession.needs_bakers():
        user.baker_sessions.append(clubsession)

    db.session.commit()


def leave(session_id, user):
    clubsession = get_by_id(session_id)
    if user in clubsession.participants:
        clubsession.participants.remove(user)
    if clubsession in user.baker_sessions:
        user.baker_sessions.remove(clubsession)

    db.session.commit()


def read_all(only_future=True):
    query = ClubSession.query
    if only_future:
        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        query = query.filter(ClubSession.date >= yesterday)
    sessions = query.order_by(ClubSession.date).all()
    session_schema = ClubSessionSchema(many=True)
    return session_schema.dump(sessions)


def get_by_id(session_id, error_if_not_found=False):
    query = ClubSession.query.filter(ClubSession.session_id == session_id)
    if error_if_not_found:
        return query.one()
    else:
        return query.one_or_none()


def _get_most_future_scheduled_session():
    today = datetime.date.today()
    query = ClubSession.query.filter(ClubSession.date >= today)
    return query.order_by(ClubSession.date.desc()).first()


class NoLastSessionError(FlashedError):
    user_description: "Did not find a session in the future."

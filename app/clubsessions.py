from app.models import ClubSession, ClubSessionSchema, User
from app import db
from app.errors.flashed import FlashedError
import app.users as user_module

import datetime


def create(date=None, auto_assign=True):
    schema = ClubSessionSchema()
    new_clubsession = schema.load(dict(), session=db.session)

    active_users = User.query.filter(User.is_active == True).all()
    new_clubsession.participants.extend(active_users)

    if date is not None:
        new_clubsession.date = date

    db.session.add(new_clubsession)

    if auto_assign:
        assign_bakers_by_quota(new_clubsession)

    db.session.commit()

    return new_clubsession


def create_next_session(auto_assign=True):
    last_session = _get_most_future_scheduled_session()
    if last_session is None:
        raise NoLastSessionError
    next_date = last_session.date + datetime.timedelta(days=7)
    return create(next_date, auto_assign)


def delete(session_id):
    session = get_by_id(session_id)
    db.session.delete(session)
    db.session.commit()


def join(session_id, user):
    clubsession = get_by_id(session_id)
    if user not in clubsession.participants:
        clubsession.participants.append(user)

    db.session.commit()


def join_all_future_sessions(user):
    future_sessions = read_all(only_future=True)
    for session in future_sessions:
        join(session["session_id"], user)


def become_baker(session_id, user):
    clubsession = get_by_id(session_id)
    if user not in clubsession.participants.all():
        user.sessions.append(clubsession)
    if clubsession.needs_bakers():
        user.baker_sessions.append(clubsession)

    db.session.commit()


def remove_bakers(session_id):
    clubsession = get_by_id(session_id)
    for user in clubsession.bakers.all():
        user.baker_sessions.remove(clubsession)

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


def assign_bakers_by_quota(session):
    baker_generator = (x for x in user_module.read_quota_list())

    while session.needs_bakers():
        try:
            next_baker_id = next(baker_generator)["user_id"]
        except StopIteration:
            raise InsufficientBakersError
        baker = user_module.get_user_by_id(next_baker_id)
        baker.baker_sessions.append(session)

    db.session.commit()


class NoLastSessionError(FlashedError):
    user_description: "Did not find a session in the future."


class InsufficientBakersError(FlashedError):
    user_description: "Not enough bakers to assign to session."

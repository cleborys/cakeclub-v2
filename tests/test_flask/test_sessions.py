import app.clubsessions as clubsessions
import app.users as user_module
from config import TestCaseWithApp

import pytest
import datetime


class TestClubsessions(TestCaseWithApp):
    def test_create(self):
        new_session = clubsessions.create(auto_assign=False)

        assert new_session.date == datetime.date.today()
        assert new_session.max_bakers == 2

    def test_create_at_date(self):
        date = datetime.datetime.strptime("2020-02-01", "%Y-%m-%d").date()
        new_session = clubsessions.create(date=date, auto_assign=False)

        assert new_session.date == date

    def test_create_autoassign(self, several_users):
        new_session = clubsessions.create()

        assert len(new_session.bakers.all()) == new_session.max_bakers
        assert new_session.needs_bakers() is False

    def test_create_autoassign_insufficient_bakers(self):
        with pytest.raises(clubsessions.InsufficientBakersError):
            new_session = clubsessions.create()

    def test_create_adds_users_as_participants(self, several_users):
        new_session = clubsessions.create()
        participants = new_session.participants.all()

        assert several_users[0] in participants
        assert len(participants) == len(several_users)

    def test_create_next_session(self):
        first_session = clubsessions.create(auto_assign=False)
        next_session = clubsessions.create_next_session(auto_assign=False)

        period_between = next_session.date - first_session.date

        assert period_between == datetime.timedelta(days=7)

    def test_create_next_session_without_future_session(self):
        past = datetime.date.today() - datetime.timedelta(days=1)
        past_session = clubsessions.create(date=past, auto_assign=False)

        with pytest.raises(clubsessions.NoLastSessionError):
            clubsessions.create_next_session(auto_assign=False)

    def test_get_by_id(self, test_session):
        get_session = clubsessions.get_by_id(test_session.session_id)

        assert get_session is test_session

    def test_get_by_id_error_not_found(self):
        with pytest.raises(Exception):
            get_session = clubsessions.get_by_id(9999, error_if_not_found=True)

    def test_delete_session(self):
        new_session = clubsessions.create(auto_assign=False)
        session_id = new_session.session_id

        clubsessions.delete(session_id)

        assert clubsessions.get_by_id(session_id) is None

    def test_leave(self, test_user, test_session):
        assert test_user in test_session.participants.all()

        clubsessions.leave(test_session.session_id, test_user)
        assert test_user not in test_session.participants.all()

    def test_leaving_removes_baker(self, test_user, test_session):
        clubsessions.become_baker(test_session.session_id, test_user)
        assert test_user in test_session.bakers.all()

        clubsessions.leave(test_session.session_id, test_user)

        assert test_user not in test_session.bakers.all()

    def test_join(self, test_session, test_user):
        assert test_user not in test_session.participants.all()

        clubsessions.join(test_session.session_id, test_user)
        assert test_user in test_session.participants.all()

    def test_become_baker(self, test_user, test_session):
        assert test_user not in test_session.bakers.all()

        clubsessions.become_baker(test_session.session_id, test_user)

        assert test_user in test_session.bakers.all()

    def test_become_baker_joins_session(self, test_session, test_user):
        assert test_user not in test_session.bakers.all()
        assert test_user not in test_session.participants.all()

        clubsessions.become_baker(test_session.session_id, test_user)

        assert test_user in test_session.participants.all()

    def test_become_baker_twice(self, test_user, test_session):
        clubsessions.become_baker(test_session.session_id, test_user)
        clubsessions.become_baker(test_session.session_id, test_user)
        assert test_user in test_session.bakers.all()

    def test_join_all_future_sessions(self):
        today = datetime.date.today()
        past = today - datetime.timedelta(days=7)
        future = today + datetime.timedelta(days=7)

        today_session = clubsessions.create(date=today, auto_assign=False)
        past_session = clubsessions.create(date=past, auto_assign=False)
        future_session = clubsessions.create(date=future, auto_assign=False)

        user_dict = dict(username="test-user", email="test@notanemailprovider.really")
        new_user = user_module.create(user_dict, "password")

        clubsessions.join_all_future_sessions(new_user)

        assert new_user not in past_session.participants.all()
        assert new_user in today_session.participants.all()
        assert new_user in future_session.participants.all()

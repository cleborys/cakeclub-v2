from config import TestCaseWithApp, TestingConfig
import app.admin.routes as admin
import app.clubsessions as clubsessions
import app.users as users

from flask import render_template

import pytest
from pytest_mock import mocker


class TestAdmin(TestCaseWithApp):
    @pytest.mark.skip
    def test_get_admin(self, logged_in_client):
        client = logged_in_client
        token = self.app.config["ADMIN_KEY"]
        response = client.get(f"/admin/{token}")
        assert response.status_code == 302

    def test_create_session(self, several_users, mocker):
        data = {"date": "3020-02-01"}
        admin.broadcast_session_update = mocker.stub(name="broadcast")
        admin.create_session(data)

        admin.broadcast_session_update.assert_called_once()

        all_sessions = clubsessions.read_all()
        assert data["date"] in [session["date"] for session in all_sessions]

    @pytest.mark.skip
    def test_cannot_create_past_session(self, several_users, mocker):
        data = {"date": "2020-02-01"}
        admin.broadcast_session_update = mocker.stub(name="broadcast")
        with pytest.raises(admin.InvalidDateError):
            admin.create_session(data)

    def test_create_user(self, mocker):
        data = {
            "username": "test_user",
            "email": "cakeclub-test@mailinator.com",
            "eaten_offset": 1,
            "password": "test password",
            "send_welcome_email": False,
        }
        admin.broadcast_session_update = mocker.stub()

        admin.create_user(data)

        admin.broadcast_session_update.assert_called_once()
        new_user = users.get_user_by_email(data["email"])
        assert new_user.username == data["username"]

    def test_remove_bakers(self, several_users, test_session, mocker):
        admin.broadcast_session_update = mocker.stub()

        admin.remove_bakers(test_session.session_id)

        assert len(test_session.bakers.all()) == 0

    def test_force_baker(self, test_session, test_user, mocker):
        admin.broadcast_session_update = mocker.stub()
        assert test_user not in test_session.bakers

        data = {"baker_id": test_user.user_id, "session_id": test_session.session_id}
        admin.force_baker(data)

        assert test_user in test_session.bakers

    def test_delete_session(self, test_session, mocker):
        admin.broadcast_session_update = mocker.stub()
        session_id = test_session.session_id

        admin.delete_session(session_id)

        assert clubsessions.get_by_id(session_id) is None

    def test_next_session(self, several_users, test_session, mocker):
        admin.broadcast_session_update = mocker.stub()
        assert len(clubsessions.read_all()) == 1

        admin.schedule_next_session_via_api(TestingConfig.ADMIN_KEY)

        assert len(clubsessions.read_all()) == 2

    def test_next_session_needs_key(self, test_session):
        response = admin.schedule_next_session_via_api("bad key")

        assert response == "authorization invalid"

    @pytest.mark.skip
    def test_render_welcome_email(self, test_user):
        admin.welcome_email_body(test_user, "test_password")

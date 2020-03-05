from config import TestCaseWithApp, TestingConfig
from app.automail import reminders
import app.email as emails
import app.clubsessions as clubsessions

import datetime

from pytest_mock import mocker


class TestReminders(TestCaseWithApp):
    def test_session_reminder(self, test_user, test_session, client, mocker):
        test_session.bakers.append(test_user)

        reminders.send_email = mocker.stub()
        email_spy = mocker.spy(reminders, "send_session_reminder_email")

        token = TestingConfig.ADMIN_KEY
        response = client.get(f"/api/sessionreminder/{token}")

        assert "1" in str(response.data)
        email_spy.assert_called_once()
        reminders.send_email.assert_called_once()

    def test_session_reminder_needs_token(self, client, mocker):
        reminders.send_email = mocker.stub()

        token = "bad_key"
        response = client.get(f"/api/sessionreminder/{token}")

        assert response.data == b"authorization invalid"
        reminders.send_email.assert_not_called()

    def test_session_reminder_deletes_if_no_bakers(self, test_session, client, mocker):
        reminders.send_email = mocker.stub()
        session_id = test_session.session_id

        token = TestingConfig.ADMIN_KEY
        response = client.get(f"/api/sessionreminder/{token}")

        assert clubsessions.get_by_id(session_id) is None
        reminders.send_email.assert_not_called()

    def test_bake_reminder(self, several_users, client, mocker):
        upcoming_date = datetime.date.today() + datetime.timedelta(days=3)
        clubsessions.create(date=upcoming_date)

        reminders.send_email = mocker.stub()
        email_spy = mocker.spy(reminders, "send_bake_reminder_email")

        token = TestingConfig.ADMIN_KEY
        response = client.get(f"/api/bakereminder/{token}")

        assert "1" in str(response.data)
        email_spy.assert_called_once()
        reminders.send_email.assert_called_once()

    def test_bake_reminder_needs_token(self, client, mocker):
        reminders.send_email = mocker.stub()

        token = "bad_key"
        response = client.get(f"/api/bakereminder/{token}")

        assert response.data == b"authorization invalid"
        reminders.send_email.assert_not_called()

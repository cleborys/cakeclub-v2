import app.lobby.routes as routes
from config import TestCaseWithApp

from pytest_mock import mocker


class TestLobby(TestCaseWithApp):
    def test_join(self, test_session, test_user, mocker):
        routes.broadcast_session_update = mocker.stub()

        assert test_user not in test_session.participants

        routes.current_user = test_user
        routes.join_session(test_session.session_id)

        assert test_user in test_session.participants
        routes.broadcast_session_update.assert_called_once()

    def test_become_baker(self, test_session, test_user, mocker):
        routes.broadcast_session_update = mocker.stub()

        assert test_user not in test_session.bakers

        routes.current_user = test_user
        routes.become_baker(test_session.session_id)

        assert test_user in test_session.bakers
        assert test_user in test_session.participants
        routes.broadcast_session_update.assert_called_once()

    def test_leave(self, test_user, test_session, mocker):
        routes.broadcast_session_update = mocker.stub()

        routes.current_user = test_user
        routes.leave_session(test_session.session_id)

        assert test_user not in test_session.participants
        routes.broadcast_session_update.assert_called_once()

    def test_send_sessions(self, test_user, test_session, mocker):
        routes.current_user = test_user
        routes.emit = mocker.stub()

        routes.send_sessions()

        routes.emit.assert_called_once()

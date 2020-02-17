import app.lobby.routes as routes
from config import TestCaseWithApp

from pytest_mock import mocker


class TestLobby(TestCaseWithApp):
    def test_create(self, test_user):
        new_lobby = lobbies.create(test_user)

        assert new_lobby is not None
        assert isinstance(new_lobby, GameLobby)

    def test_creation_sets_host(self, test_user):
        new_lobby = lobbies.create(test_user)

        assert new_lobby.host.user_id == test_user.user_id
        assert new_lobby in test_user.hosted_games

    def test_creation_makes_host_a_member(self, test_user):
        new_lobby = lobbies.create(test_user)

        assert new_lobby in test_user.lobbies
        assert test_user in new_lobby.members

    def test_joining_a_lobby(self, test_user, game_lobby):
        lobbies.join(game_lobby.lobby_id, test_user)

        assert game_lobby in test_user.lobbies
        assert test_user in game_lobby.members

    def test_joining_a_lobby_twice(self, test_user, game_lobby):
        lobbies.join(game_lobby.lobby_id, test_user)
        lobbies.join(game_lobby.lobby_id, test_user)

        assert game_lobby in test_user.lobbies
        assert test_user in game_lobby.members

    def test_leaving_a_lobby(self, test_user, game_lobby):
        lobbies.join(game_lobby.lobby_id, test_user)
        lobbies.leave(game_lobby.lobby_id, test_user)

        assert game_lobby not in test_user.lobbies
        assert test_user not in game_lobby.members

    def test_leaving_before_joining(self, test_user, game_lobby):
        lobbies.leave(game_lobby.lobby_id, test_user)

        assert game_lobby not in test_user.lobbies
        assert test_user not in game_lobby.members

    def test_leaving_a_lobby_twice(self, test_user, game_lobby):
        lobbies.join(game_lobby.lobby_id, test_user)
        lobbies.leave(game_lobby.lobby_id, test_user)
        lobbies.leave(game_lobby.lobby_id, test_user)

        assert game_lobby not in test_user.lobbies
        assert test_user not in game_lobby.members

    def test_host_leaving_deletes_session(self, test_user):
        new_lobby = lobbies.create(test_user)
        lobbies.leave(new_lobby.lobby_id, test_user)

        assert lobbies.get_by_id(new_lobby.lobby_id) is None

    def test_cannot_join_a_full_lobby(self, test_user, game_lobby):
        game_lobby.max_members = 1
        lobbies.join(game_lobby.lobby_id, test_user)
        assert test_user not in game_lobby.members

    def test_read_all(self, game_lobby):
        read_lobbies = lobbies.read_all()
        assert isinstance(read_lobbies, list)
        assert "lobby_id" in read_lobbies[0]

    def test_lobby_schema_lists_members(self, game_lobby):
        members = lobbies.read_all()[0]["members"]
        assert isinstance(members, list)
        assert "username" in members[0]

    def test_get_by_id(self, game_lobby):
        retrieved_lobby = lobbies.get_by_id(game_lobby.lobby_id)
        assert retrieved_lobby.lobby_id == game_lobby.lobby_id

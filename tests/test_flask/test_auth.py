import pytest
from config import TestCaseWithApp

auth_url_prefix = "/auth"


class TestAuth(TestCaseWithApp):
    def test_get_login(self, client):
        response = client.get(auth_url_prefix + "/login")
        assert response.status_code == 200

    def test_login(self, client, test_user):
        client.post(
            auth_url_prefix + "/login",
            data=dict(username=test_user.username, password="test-password"),
            follow_redirects=True,
        )

    def test_get_logout(self, client):
        client.get(auth_url_prefix + "/logout", follow_redirects=True)

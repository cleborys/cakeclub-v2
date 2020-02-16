from app.models import User
import app.users as users
from config import TestCaseWithApp

import pytest


class TestUser(TestCaseWithApp):
    def test_password_hashing(self):
        user = User(username="test_user")
        password = "test_password"
        user.set_password(password)
        assert user.check_password("wrong password") is False
        assert user.check_password(password) is True
        assert user.password_hash != password

    def test_create(self):
        user = dict(username="test-user", email="test@notanemailprovider.really")
        password = "test-password"

        new_user = users.create(user, password)

        assert new_user is not None
        assert new_user.username == user["username"]
        assert isinstance(new_user, User)

    def test_get_by_name(self, test_user):
        retrieved_user = users.get_user_by_name(test_user.username)
        assert retrieved_user.user_id == test_user.user_id

    def test_get_by_email(self, test_user):
        retrieved_user = users.get_user_by_email(test_user.email)
        assert retrieved_user.user_id == test_user.user_id

    def test_password_reset_token(self, test_user):
        token = test_user.get_password_reset_token()
        assert isinstance(token, str)

        retrieved_user = users.verify_password_reset_token(token)
        assert retrieved_user.user_id == test_user.user_id

    @pytest.mark.skip
    def test_password_reset_token_expiry(self, test_user):
        test_user.get_password_reset_token()

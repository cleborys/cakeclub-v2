from config import TestCaseWithApp, TestingConfig
import app.auth.mail as emails
import app.models as models

import pytest
from pytest_mock import mocker

auth_url_prefix = "/auth"


class TestAuth(TestCaseWithApp):
    def test_get_registration(self, client):
        response = client.get(auth_url_prefix + "/register")
        assert response.status_code == 200

    def test_register(self, client):
        response = client.post(
            auth_url_prefix + "/register",
            data=dict(
                username="test-name",
                email="test@notanactualprovider.really",
                password="test-password",
                password_repeat="test-password",
                registration_token=TestingConfig.REGISTRATION_KEY,
            ),
            follow_redirects=True,
        )
        assert b"Thank you for signing up" in response.data

    def test_register_wrong_token(self, client):
        response = client.post(
            auth_url_prefix + "/register",
            data=dict(
                username="test-name",
                email="test@notanactualprovider.really",
                password="test-password",
                password_repeat="test-password",
                registration_token="bad_token",
            ),
            follow_redirects=True,
        )
        print(response.data)
        assert b"Thank you for signing up" not in response.data

    def test_get_login(self, client):
        response = client.get(auth_url_prefix + "/login")
        assert response.status_code == 200

    def test_login(self, client, test_user):
        response = client.post(
            auth_url_prefix + "/login",
            data=dict(email=test_user.email, password="test-password"),
            follow_redirects=True,
        )
        assert b"Welcome" in response.data

    def test_login_wrong_email(self, client, test_user):
        response = client.post(
            auth_url_prefix + "/login",
            data=dict(email=test_user.email + "x", password="test-password"),
            follow_redirects=True,
        )
        assert b"Welcome" not in response.data

    def test_login_wrong_password(self, client, test_user):
        response = client.post(
            auth_url_prefix + "/login",
            data=dict(email=test_user.email, password="test-password" + "x"),
            follow_redirects=True,
        )
        assert b"Welcome" not in response.data

    def test_get_logout(self, client):
        client.get(auth_url_prefix + "/logout", follow_redirects=True)

    def test_get_password_reset(self, client):
        response = client.get(auth_url_prefix + "/request_password_reset")
        assert response.status_code == 200

    def test_token_email(self, test_user, mocker, client):
        emails.send_email = mocker.stub()

        response = client.post(
            auth_url_prefix + "/request_password_reset",
            data=dict(email=test_user.email),
            follow_redirects=True,
        )

        emails.send_email.assert_called_once()
        assert b"We sent you an email to reset your password!" in response.data

    def test_password_token_generation(self, test_user):
        token = test_user.get_password_reset_token()
        assert models.User.verify_password_reset_token(token) is test_user

    def test_password_reset_token_works(self, test_user, client, mocker):
        emails.send_email = mocker.stub()

        response = client.post(
            auth_url_prefix + "/request_password_reset",
            data=dict(email=test_user.email),
            follow_redirects=True,
        )

        emails.send_email.assert_called_once()
        email_body = emails.send_email.call_args[1]["body"]
        address_with_token = email_body.split("localhost")[1].split("\n\nIf")[0]

        new_password = "new_password"
        assert test_user.check_password(new_password) is False

        client.get(address_with_token, follow_redirects=True)
        response = client.post(
            address_with_token,
            data=dict(password=new_password, password_repeat=new_password),
            follow_redirects=True,
        )

        assert test_user.check_password(new_password) is True

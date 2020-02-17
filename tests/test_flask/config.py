import pytest
from app import DevelopmentConfig
from app import create_app, db
import app.users as users
import app.clubsessions as clubsessions


class TestingConfig(DevelopmentConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"


class TestCaseWithApp:
    def setup_method(self):
        self.app = create_app(TestingConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def teardown_method(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @pytest.fixture
    def test_user(self):
        user = dict(username="test-user", email="test@notanemailprovider.really")
        password = "test-password"
        return users.create(user, password)

    @pytest.fixture
    def several_users(self):
        def user(n):
            return dict(
                username=f"test-user-{n}",
                email=f"test{n}@notanemailprovider.really",
                eaten_offset=2 * n * n,
                baked_offset=n,
            )

        password = "test-password"

        new_users = [users.create(user(i), password) for i in range(10)]
        return new_users

    @pytest.fixture
    def test_session(self):
        return clubsessions.create(auto_assign=False)

    @pytest.fixture
    def client(self):
        return self.app.test_client()

    @pytest.fixture
    def logged_in_client(self):
        user = dict(username="test-user", email="test@notanemailprovider.really")
        password = "test-password"
        test_user = users.create(user, password)

        client = self.app.test_client()
        client.post(
            "/auth/login",
            data=dict(username=test_user.username, password="test-password"),
            follow_redirects=True,
        )

        return client

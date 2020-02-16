from config import TestCaseWithApp
import app.admin.routes as admin

import pytest

class TestAdmin(TestCaseWithApp):
    @pytest.mark.skip
    def test_get_admin(self, logged_in_client):
        client = logged_in_client
        token = self.app.config["ADMIN_KEY"]
        response = client.get(f"/admin/{token}")
        assert response.status_code == 302

    @pytest.mark.skip
    def test_create_session(self, logged_in_client):
        client = logged_in_client
        data = {"date": "2020-02-01"}
        with self.app.test_request_context("/admin"):
            self.app.preprocess_request()
            admin.create_session(data)

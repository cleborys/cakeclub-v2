from config import TestCaseWithApp


class TestErrors(TestCaseWithApp):
    def test_get_404(self, client):
        response = client.get("/not-a-valid-url")
        assert response.status_code == 404
        assert b"We couldn't find what you were looking for" in response.data

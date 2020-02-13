from app import create_app, db, HerokuConfig
from app.models import User

app = create_app(HerokuConfig)


@app.shell_context_processor
def make_shell_context():
    return {"db": db, "User": User}

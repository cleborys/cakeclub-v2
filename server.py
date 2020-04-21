from app import create_app, db, DeploymentConfig
from app.models import User

app = create_app(DeploymentConfig)


@app.shell_context_processor
def make_shell_context():
    return {"db": db, "User": User}

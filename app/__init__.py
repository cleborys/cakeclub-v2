from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_bootstrap import Bootstrap
from flask_login import LoginManager
from flask_mail import Mail
from flask_socketio import SocketIO

import os
from dotenv import load_dotenv

import logging
from logging.handlers import RotatingFileHandler, SMTPHandler

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, ".env"))


class Config:
    MAIL_SERVER = os.environ.get("MAIL_SERVER") or None
    MAIL_PORT = int(os.environ.get("MAIL_PORT") or 25)
    MAIL_USE_TLS = 1
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME") or None
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD") or None
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL") or None

    LOG_TO_STDOUT = os.environ.get("LOG_TO_STDOUT")


class DevelopmentConfig(Config):
    SECRET_KEY = os.environ.get("SECRET_KEY") or "replace insecure secret"
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(basedir, "app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class HerokuConfig(Config):
    SECRET_KEY = os.environ["SECRET_KEY"]
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL"
    ) or "sqlite:///" + os.path.join(basedir, "app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False


db = SQLAlchemy()
ma = Marshmallow()
migrate = Migrate()
bootstrap = Bootstrap()
login = LoginManager()
login.login_view = "auth.login"
login.login_message = ""
mail = Mail()
socketio = SocketIO()


def create_app(config_object=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    bootstrap.init_app(app)
    login.init_app(app)
    mail.init_app(app)
    socketio.init_app(app)

    if not app.debug and not app.testing:  # pragma: no cover
        if app.config["LOG_TO_STDOUT"]:
            stdout_handler = logging.StreamHandler()
            stdout_handler.setLevel(logging.INFO)
            app.logger.addHandler(stdout_handler)
        else:
            if not os.path.exists("logs"):
                os.mkdir("logs")
            file_handler = RotatingFileHandler(
                "logs/cakeclub.log", maxBytes=10_000, backupCount=5
            )
            file_handler.setFormatter(
                logging.Formatter(
                    "%(asctime)s - %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
                )
            )
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info("Starting up...")

        if app.config["MAIL_SERVER"]:
            mail_handler = SMTPHandler(
                mailhost=(app.config["MAIL_SERVER"], app.config["MAIL_PORT"]),
                fromaddr="no-reply@cakeclub.com",
                toaddrs=[app.config["ADMIN_EMAIL"]],
                subject="Cakeclub Error Report",
                credentials=(
                    app.config["MAIL_USERNAME"],
                    app.config["MAIL_PASSWORD"],
                ),
                secure=(),
            )
            mail_handler.setLevel(logging.ERROR)
            app.logger.addHandler(mail_handler)
            app.logger.info("Added SMTP Error handler")

    from app.routes import blueprint as main_blueprint
    from app.errors import blueprint as error_blueprint
    from app.auth import blueprint as auth_blueprint
    from app.lobby import blueprint as lobby_blueprint
    from app.admin import blueprint as admin_blueprint
    from app.members import blueprint as members_blueprint
    from app.automail import blueprint as automail_blueprint

    app.register_blueprint(main_blueprint)
    app.register_blueprint(error_blueprint)
    app.register_blueprint(auth_blueprint, url_prefix="/auth")
    app.register_blueprint(lobby_blueprint)
    app.register_blueprint(admin_blueprint)
    app.register_blueprint(members_blueprint)
    app.register_blueprint(automail_blueprint)

    from app import models

    return app

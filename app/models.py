from app import db, ma, login
from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from flask import current_app

from time import time
import jwt
from jwt.exceptions import InvalidTokenError

clubsession_membership = db.Table(
    "clubsession_membership",
    db.Column("user_id", db.Integer, db.ForeignKey("user.user_id")),
    db.Column("session_id", db.Integer, db.ForeignKey("club_session.session_id")),
)


class User(UserMixin, db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    is_guest = db.Column(db.Boolean, default=False)
    password_hash = db.Column(db.String(128))
    timestamp = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    is_active = db.Column(db.Boolean, default=True)

    baked_offset = db.Column(db.Integer, default=0)
    eaten_offset = db.Column(db.Integer, default=0)


    baker_sessions = db.relationship("ClubSession", backref="baker", lazy="dynamic")

    sessions = db.relationship(
        "ClubSession",
        secondary=clubsession_membership,
        backref=db.backref("participants", lazy="dynamic"),
    )

    def __repr__(self):
        return (
            f"<User {self.username} with id {self.user_id}>"
        )  # pragma: no cover

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return self.user_id  # pragma: no cover

    def get_quota(self):
        baked = self.baked_offset + len(self.baker_sessions)
        eaten = self.eaten_offset + len(self.sessions)
        return baked / min(eaten, 1)

    def get_password_reset_token(self, expiry_time=600):
        return jwt.encode(
            {"reset_password": self.user_id, "exp": time() + expiry_time},
            current_app.config["SECRET_KEY"],
            algorithm="HS256",
        ).decode("utf-8")

    @staticmethod
    def verify_password_reset_token(token):
        try:
            user_id = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )["reset_password"]
        except (KeyError, InvalidTokenError):
            return

        return User.query.get(user_id)


@login.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class ClubSession(db.Model):
    session_id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=date.today)
    timestamp = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    baker_id = db.Column(db.Integer, db.ForeignKey("user.user_id"))

    def __repr__(self):
        return (
            f"<ClubSession with id {self.lobby_id}"
            f"hosted by {self.host.username}>"
        )  # pragma: no cover

    def is_full(self):
        return len(self.members.all()) >= self.max_members

    def close(self):
        self.is_open = False



class FakeUserSchema(ma.ModelSchema):
    user_id = ma.Int()
    username = ma.Str()


class ClubSessionSchema(ma.ModelSchema):
    class Meta:
        model = ClubSession
        sqla_session = db.session

    baker = ma.Nested(FakeUserSchema, default=None)

    participants = ma.Nested(FakeUserSchema, default=[], many=True)


class UserSchema(ma.ModelSchema):
    class Meta:
        model = User
        model_fields_kwargs = {"password_hash": {"load_only": True}}
        sqla_session = db.session

    baker_sessions = ma.Nested(
        ClubSessionSchema,
        default=[],
        many=True,
        only=("session_id", "date"),
    )

    sessions = ma.Nested(
        ClubSessionSchema,
        default=[],
        many=True,
        only=("session_id", "date"),
    )

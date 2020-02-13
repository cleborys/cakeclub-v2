from flask import Blueprint

blueprint = Blueprint("automail", __name__)

from app.automail import routes

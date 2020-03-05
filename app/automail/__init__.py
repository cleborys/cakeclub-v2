from flask import Blueprint

blueprint = Blueprint("automail", __name__, template_folder="templates")

from app.automail import routes

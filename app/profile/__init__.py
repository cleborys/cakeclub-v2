from flask import Blueprint

blueprint = Blueprint("profile", __name__, template_folder="templates")

from app.profile import routes

from flask import Blueprint

blueprint = Blueprint("auth", __name__, template_folder="templates")

from app.auth import routes

from flask import Blueprint

blueprint = Blueprint("lobby", __name__, template_folder="templates")

from app.lobby import routes

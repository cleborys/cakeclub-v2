from flask import Blueprint

blueprint = Blueprint("members", __name__, template_folder="templates")

from app.members import routes

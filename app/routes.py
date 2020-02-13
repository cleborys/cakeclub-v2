from flask import Blueprint, redirect, url_for

blueprint = Blueprint("main", __name__)


@blueprint.route("/")
def index():
    return redirect(url_for("lobby.lobby"))

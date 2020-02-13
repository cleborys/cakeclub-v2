from flask_socketio import emit


class FlashedError(Exception):
    user_description = "An error has occurred."


class NotFoundError(FlashedError):
    user_description = "Resource not found."


class UnauthorisedError(FlashedError):
    user_description = "Unauthorised."


def flashed_errors_forwarded(f):
    def wrapped(*args, **kwargs):
        try:
            f(*args, **kwargs)
        except Exception as e:
            if isinstance(e, FlashedError):
                emit("error_msg", {"data": e.user_description})
            else:
                raise e

    return wrapped


def errors_forwarded(f):
    def wrapped(*args, **kwargs):
        try:
            f(*args, **kwargs)
        except Exception as e:
            if hasattr(e, "user_description"):
                emit("error_msg", {"data": e.user_description})
            else:
                emit("error_msg", {"data": "An error has occurred."})
                raise e

    return wrapped

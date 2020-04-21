FROM python:3.6-alpine

RUN adduser -D cakelover

WORKDIR /home/cakelover

COPY requirements.txt requirements.txt
RUN python -m venv venv
RUN \
 apk add --no-cache postgresql-libs && \
 apk add --no-cache --virtual .build-deps gcc musl-dev postgresql-dev && \
 venv/bin/pip install -r requirements.txt --no-cache-dir && \
 apk --purge del .build-deps

COPY app app
COPY migrations migrations
COPY server.py boot.sh ./
RUN chmod +x boot.sh

ENV FLASK_APP server.py
ENV IS_DEVELOPMENT 0
ENV PROFILE 0
ENV LOG_TO_STDOUT 1

RUN chown -R cakelover:cakelover ./
USER cakelover

EXPOSE 5000
ENTRYPOINT ["./boot.sh"]

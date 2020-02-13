rm -r migrations;
rm app/app.db;
flask db init;
flask db migrate;
flask db upgrade;

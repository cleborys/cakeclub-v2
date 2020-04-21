# Deployment
Start a postgres container:
```
docker run --name postgres -d \
-e POSTGRES_PASSWORD=<your-database-key> \
-e POSTGRES_USER=cakelover \
postgres:12
```
and connect it to a server container:
```
docker run --name cakeclub -d \
-p 8000:5000 \
-e SECRET_KEY=<your-secret-key> \
-e ADMIN_KEY=<your-admin-key> \
-e REGISTRATION_KEY=<your-registration-token> \
-e MAIL_SERVER=smtp.googlemail.com \
-e MAIL_PORT=587 \
-e MAIL_USE_TLS=1 \
-e MAIL_USERNAME=<gmail-newsletter-account> \
-e MAIL_PASSWORD=<gmail-password> \
-e ADMIN_EMAIL=<admin-email> \
--link postgres:dbserver \
-e DATABASE_URL=postgres://cakelover:<your-database-key>@dbserver/cakelover \
cleborys/cakeclub:latest
```

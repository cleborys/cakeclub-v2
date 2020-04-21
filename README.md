# Deployment
```
docker run --name cakeclub -d --rm \
-p 8000:5000 \
-e SECRET_KEY=deployment-key \
-e ADMIN_KEY=admin-key \
-e REGISTRATION_KEY=registration-key \
-e MAIL_SERVER=smtp.googlemail.com \
-e MAIL_PORT=587 \
-e MAIL_USE_TLS=1 \
-e MAIL_USERNAME=gmail-account \
-e MAIL_PASSWORD=gmail-password \
-e ADMIN_EMAIL=admin-email \
cleborys/cakeclub:latest
```

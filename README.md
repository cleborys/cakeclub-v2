# Cakeclub
This is the source code for Copenhagen university [cake club](https://cakeclub.borys.dk).

## Development Setup
```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
You can leave the virtual environment via `deactivate`
and re-enter it by running `source venv/bin/activate`.

## Tests
Run
```
pytest .
```
from inside your virtual environment

## Deployment
To deploy with a postgres database,
add your credentials to `web-variables.env`
and run
```
docker-compose up
```
Note that this will deploy the public cakeclub image on dockerhub,
not including any local modifications.
The service will listen internally on port 8000.
To make it publicly accessible, 
it is recommended to run an nginx reverse proxy
with the configuration provided in `nginx_config`,
filling in the appropriate details.

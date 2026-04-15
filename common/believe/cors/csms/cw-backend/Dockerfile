FROM devopsartifact.jio.com/jpf-cwms__dev__dcr/python:3.8.5-slim_v1
ENV http_proxy=http://azureproxy.jio.com:8080
ENV https_proxy=http://azureproxy.jio.com:8080
ENV HTTP_PROXY=http://azureproxy.jio.com:8080
ENV HTTPS_PROXY=http://azureproxy.jio.com:8080
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY requirements.txt /code/
RUN pip install --upgrade setuptools
RUN pip install -r requirements.txt
COPY . /code/
ENV http_proxy=""
ENV https_proxy=""
ENV HTTP_PROXY=""
ENV HTTPS_PROXY=""
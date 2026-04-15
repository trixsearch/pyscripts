FROM python:3.8.5-slim
RUN apt update && apt install gcc -y
RUN apt install -y curl nginx libcairo2 libpq5 libaom0 libsqlite3-0 libssl1.1 libtasn1-6 openssl python3-pip python3-cffi python3-brotli libpango-1.0-0 libpangoft2-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 fonts-liberation ca-certificates
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY requirements.txt /code/
RUN pip install --upgrade setuptools
RUN pip install -r requirements.txt
COPY . /code/
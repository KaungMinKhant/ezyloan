FROM python:3.10-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    build-essential \
    cpanminus \
    perl \
    && cpanm --notest App::Sqitch \
    && cpanm DBD::Pg

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app/backend
COPY db /app/db

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE USER ezy_loan WITH PASSWORD 'bZDIpcGg';
    CREATE DATABASE ezy_loan;
    GRANT ALL PRIVILEGES ON DATABASE ezy_loan TO ezy_loan;
EOSQL

-- Deploy ezy_loan:add_users to pg

BEGIN;

CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

COMMIT;

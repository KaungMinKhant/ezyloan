-- Deploy ezy_loan:user_loan_data to pg

BEGIN;

CREATE TABLE user_loan_data (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) NOT NULL,
    loan_amount NUMERIC NOT NULL,
    token TEXT NOT NULL,
    age INT NOT NULL,
    occupation TEXT NOT NULL
);

COMMIT;

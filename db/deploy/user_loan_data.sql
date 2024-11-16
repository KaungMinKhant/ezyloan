-- Deploy ezy_loan:user_loan_data to pg

BEGIN;

CREATE TABLE user_loan_data (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    amount NUMERIC NOT NULL,
    token TEXT NOT NULL,
    age INT NOT NULL,
    occupation TEXT NOT NULL,
    monthly_income NUMERIC NOT NULL,
    income_currency TEXT NOT NULL,
    monthly_expense NUMERIC NOT NULL,
    expene_currency TEXT NOT NULL,
    purpose_of_loan TEXT NOT NULL,
    collateral_type TEXT NOT NULL,
    loan_duration TEXT NOT NULL
);

COMMIT;

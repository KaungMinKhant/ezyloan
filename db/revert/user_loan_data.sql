-- Revert ezy_loan:user_loan_data from pg

BEGIN;

DROP TABLE user_loan_data;

COMMIT;

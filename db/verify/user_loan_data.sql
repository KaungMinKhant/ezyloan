-- Verify ezy_loan:user_loan_data on pg

BEGIN;

SELECT id, user_id, loan_amount, token, age, occupation
FROM user_loan_data
WHERE FALSE;

ROLLBACK;

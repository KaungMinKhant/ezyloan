-- Verify ezy_loan:user_loan_data on pg

BEGIN;

SELECT id, user_id, amount, token, age, occupation,
    monthly_income,
    income_currency,
    monthly_expense,
    expene_currency,
    purpose_of_loan,
    collateral_type,
    loan_duration
FROM user_loan_data
WHERE FALSE;

ROLLBACK;

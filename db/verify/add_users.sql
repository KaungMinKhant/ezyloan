-- Verify ezy_loan:add_users on pg

BEGIN;

SELECT id, name, email
FROM users
WHERE FALSE;

ROLLBACK;

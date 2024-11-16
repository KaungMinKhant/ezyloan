-- Revert ezy_loan:add_users from pg

BEGIN;

DROP TABLE users;

COMMIT;

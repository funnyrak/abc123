-- Track how each question was paid for, so credit/free-quota
-- accounting can be derived without a separate ledger table.
alter table questions
  add column funded_by text check (funded_by in ('free', 'credit', 'subscription'));

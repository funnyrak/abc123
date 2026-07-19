-- One running settlement row per mentor per project (Phase 3), so
-- markProjectCompleted() can upsert instead of accumulating duplicates
-- as a project's schedule keeps getting updated.

alter table mentor_settlements
  add constraint mentor_settlements_mentor_project_unique unique (mentor_id, project_id);

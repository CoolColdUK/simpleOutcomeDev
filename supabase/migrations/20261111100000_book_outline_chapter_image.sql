-- Book pod: optional chapter header image per outline entry (chapters).
alter table public.bk_outline_entry
  add column if not exists chapter_image_storage_path text;

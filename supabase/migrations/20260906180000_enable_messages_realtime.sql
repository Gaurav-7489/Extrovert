begin;

-- Realtime delivery is required for the live chat thread. Keep message bodies encrypted
-- in the database; Realtime only transports the encrypted row to authorized clients.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

commit;

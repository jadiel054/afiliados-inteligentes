create or replace function vault_rpc_wrapper_create_secret(p_value text)
returns uuid language plpgsql security definer set search_path = vault as $$
declare v_id uuid;
begin
  select id into v_id from vault.create_secret(p_value);
  return v_id;
end $$;

create or replace function vault_rpc_wrapper_get_secret(p_id uuid)
returns text language plpgsql security definer set search_path = vault as $$
  select decrypted_secret from vault.decrypted_secrets where id = p_id;
$$;

create or replace function vault_rpc_wrapper_delete_secret(p_id uuid)
returns void language plpgsql security definer set search_path = vault as $$
  delete from vault.secrets where id = p_id;
$$;

grant execute on function vault_rpc_wrapper_create_secret(text) to service_role;
grant execute on function vault_rpc_wrapper_get_secret(uuid) to service_role;
grant execute on function vault_rpc_wrapper_delete_secret(uuid) to service_role;

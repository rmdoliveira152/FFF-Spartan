do $$
begin
	create policy "applications_admin_delete"
	on public.r4_applications for delete
	to authenticated
	using (public.is_admin());
exception
	when duplicate_object then null;
end
$$;

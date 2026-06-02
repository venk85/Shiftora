insert into education_states (
  state_code,
  state_name,
  block_unit_name,
  block_officer_title,
  district_officer_title,
  udise_block_digits
) values (
  '38',
  'DADRA & NAGAR HAVELI AND DAMAN & DIU',
  'Block',
  'Block-level education authority',
  'District-level education authority',
  2
) on conflict (state_code) do update set
  state_name = excluded.state_name,
  block_unit_name = excluded.block_unit_name,
  block_officer_title = excluded.block_officer_title,
  district_officer_title = excluded.district_officer_title,
  udise_block_digits = excluded.udise_block_digits;

delete from education_states
where state_code in ('25', '26')
  and not exists (select 1 from educational_districts where state_code in ('25', '26'))
  and not exists (select 1 from registered_schools where state_code in ('25', '26'));

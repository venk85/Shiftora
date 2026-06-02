alter table education_states
  add constraint chk_education_states_code_shape check (state_code ~ '^[0-9]{2}$') not valid;

alter table education_states
  add constraint chk_education_states_udise_block_digits check (udise_block_digits = 2) not valid;

alter table educational_districts
  add constraint chk_educational_districts_code_shape check (udise_district_code ~ '^[0-9]{4}$') not valid;

alter table educational_districts
  add constraint chk_educational_districts_state_prefix check (left(udise_district_code, 2) = state_code) not valid;

alter table education_blocks
  add constraint chk_education_blocks_code_shape check (udise_block_code ~ '^[0-9]{6}$') not valid;

alter table education_blocks
  add constraint chk_education_blocks_district_prefix check (left(udise_block_code, 4) = udise_district_code) not valid;

alter table education_blocks
  add constraint chk_education_blocks_state_prefix check (left(udise_block_code, 2) = state_code) not valid;

alter table registered_schools
  add constraint chk_registered_schools_udise_shape check (udise_code ~ '^[0-9]{11}$') not valid;

alter table registered_schools
  add constraint chk_registered_schools_state_prefix check (left(udise_code, 2) = state_code) not valid;

alter table registered_schools
  add constraint chk_registered_schools_district_prefix check (left(udise_code, 4) = udise_district_code) not valid;

alter table registered_schools
  add constraint chk_registered_schools_block_prefix check (left(udise_code, 6) = udise_block_code) not valid;

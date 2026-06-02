alter table registered_schools drop constraint if exists registered_schools_state_code_fkey;
alter table registered_schools drop constraint if exists registered_schools_udise_district_code_fkey;
alter table registered_schools drop constraint if exists registered_schools_udise_block_code_fkey;
alter table education_blocks drop constraint if exists education_blocks_state_code_fkey;
alter table education_blocks drop constraint if exists education_blocks_udise_district_code_fkey;
alter table educational_districts drop constraint if exists educational_districts_state_code_fkey;

alter table registered_schools alter column state_code type varchar(255);
alter table registered_schools alter column udise_district_code type varchar(255);
alter table registered_schools alter column udise_block_code type varchar(255);
alter table educational_districts alter column state_code type varchar(255);
alter table education_blocks alter column state_code type varchar(255);
alter table education_blocks alter column udise_district_code type varchar(255);
alter table education_states alter column state_code type varchar(255);
alter table educational_districts alter column udise_district_code type varchar(255);
alter table education_blocks alter column udise_block_code type varchar(255);

alter table educational_districts
  add constraint educational_districts_state_code_fkey foreign key (state_code) references education_states(state_code);
alter table education_blocks
  add constraint education_blocks_state_code_fkey foreign key (state_code) references education_states(state_code);
alter table education_blocks
  add constraint education_blocks_udise_district_code_fkey foreign key (udise_district_code) references educational_districts(udise_district_code);
alter table registered_schools
  add constraint registered_schools_state_code_fkey foreign key (state_code) references education_states(state_code);
alter table registered_schools
  add constraint registered_schools_udise_district_code_fkey foreign key (udise_district_code) references educational_districts(udise_district_code);
alter table registered_schools
  add constraint registered_schools_udise_block_code_fkey foreign key (udise_block_code) references education_blocks(udise_block_code);

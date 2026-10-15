create type public.app_role as enum ('admin','hr');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','hr'))
$$;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  department text not null,
  location text not null default 'Coimbatore, Tamil Nadu',
  employment_type text not null default 'Full-time',
  experience_levels text[] not null default '{fresher,0-1,1-3,3+}',
  salary_min integer,
  salary_max integer,
  highlight text,
  summary text not null,
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  status text not null default 'open' check (status in ('open','closed','draft')),
  sort_order integer not null default 0,
  date_posted date not null default current_date,
  valid_through date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;
grant all on public.jobs to service_role;
alter table public.jobs enable row level security;
create policy "public reads open jobs" on public.jobs for select to anon, authenticated using (status = 'open');
create policy "staff read all jobs" on public.jobs for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff insert jobs" on public.jobs for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update jobs" on public.jobs for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "admin delete jobs" on public.jobs for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  role_title text not null,
  full_name text not null,
  mobile text not null,
  email text not null,
  location text not null,
  experience text not null,
  message text,
  resume_path text not null,
  resume_name text,
  consent boolean not null,
  consent_at timestamptz not null default now(),
  stage text not null default 'new' check (stage in ('new','review','interview','rejected','hired')),
  hr_notes text,
  source text not null default 'direct',
  utm_source text, utm_medium text, utm_campaign text, referrer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.applications (created_at desc);
create index on public.applications (lower(email));
grant select, update, delete on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "staff read applications" on public.applications for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update applications" on public.applications for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "admin delete applications" on public.applications for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  mobile text,
  details text,
  status text not null default 'pending' check (status in ('pending','completed','rejected')),
  created_at timestamptz not null default now()
);
grant select, update on public.deletion_requests to authenticated;
grant all on public.deletion_requests to service_role;
alter table public.deletion_requests enable row level security;
create policy "staff read deletion" on public.deletion_requests for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update deletion" on public.deletion_requests for update to authenticated using (public.is_staff(auth.uid()));

create policy "staff read resumes" on storage.objects for select to authenticated using (bucket_id = 'resumes' and public.is_staff(auth.uid()));
create policy "admin delete resumes" on storage.objects for delete to authenticated using (bucket_id = 'resumes' and public.has_role(auth.uid(),'admin'));

insert into public.jobs (slug,title,department,salary_min,salary_max,highlight,summary,responsibilities,requirements,sort_order) values
('marketing-lead-coordination-executive','Marketing & Lead Coordination Executive','Marketing',13000,30000,'Priority','Handle IndiaMART and B2B enquiries, understand customer requirements, maintain fast follow-up and coordinate quotations.','{"Lead response, calling and follow-up","WhatsApp, email and CRM updates","Quotation and order coordination"}','{"English required; Tamil preferred","Hindi or other languages an added advantage","Good communication and quick response skills"}',1),
('purchase-procurement-executive','Purchase / Procurement Executive','Procurement',13000,30000,null,'Source instruments and components, compare suppliers, collect quotations, follow purchase requirements and coordinate delivery.','{"Supplier sourcing and price comparison","Purchase enquiry and PO follow-up","Delivery coordination"}','{"Excel, email and documentation skills","English required; Tamil preferred"}',2),
('data-entry-crm-executive','Data Entry & CRM Executive','CRM',13000,30000,null,'Maintain accurate customer, product and lead records in CRM, support data cleanup and keep follow-up information updated.','{"Fast and accurate data entry","Lead status and reminder maintenance","Data cleanup support"}','{"Excel / Google Sheets / CRM usage","English required; Tamil preferred"}',3),
('prompt-engineer-generative-ai-executive','Prompt Engineer / Generative AI Executive','AI / Digital',15000,25000,null,'Use Generative AI tools to improve product content, research, image prompts, internal workflows and digital marketing support.','{"Content, image and workflow support","Research using Generative AI tools","Digital marketing support"}','{"Strong prompting and research ability","Curiosity, testing and documentation"}',4),
('sales-export-support-coordinator','Sales & Export Support Coordinator','Sales / Export',null,null,null,'Support domestic and international enquiries with product details, quotations, proforma invoices and shipment coordination.','{"Customer enquiry handling","Export documentation support","Quotation, proforma invoice and shipment coordination"}','{"Good English","Clear written communication"}',5),
('general-application','General Application','Open Profile',null,null,'Future roles','If your skills match our business but your exact role is not listed, submit your profile for suitable current or future openings.','{"Profile considered for suitable current or future openings"}','{"Freshers and experienced candidates","Good communication preferred","Responsible working attitude"}',6);
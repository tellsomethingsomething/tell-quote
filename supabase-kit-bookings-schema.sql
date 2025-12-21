-- Kit Booking Schema
-- Run this in your Supabase SQL Editor

-- Booking status enum check
-- pending: Request made, awaiting confirmation
-- confirmed: Booking approved
-- checked_out: Equipment has been collected
-- returned: Equipment returned after use
-- cancelled: Booking was cancelled

-- Main kit bookings table
create table if not exists kit_bookings (
    id uuid default uuid_generate_v4() primary key,

    -- What is being booked
    kit_item_id uuid references kit_items(id) on delete cascade not null,
    quantity int default 1,

    -- When
    start_date date not null,
    end_date date not null,

    -- For what project/purpose
    project_id uuid references projects(id) on delete set null,
    project_name text, -- Denormalized for when project is deleted
    purpose text, -- If not tied to a project

    -- Status tracking
    status text default 'pending' check (status in ('pending', 'confirmed', 'checked_out', 'returned', 'cancelled')),

    -- Who
    booked_by uuid references user_profiles(id) on delete set null,
    booked_by_name text, -- Denormalized
    approved_by uuid references user_profiles(id) on delete set null,

    -- Collection/return details
    collection_location text,
    return_location text,
    checked_out_at timestamp with time zone,
    checked_out_by uuid references user_profiles(id) on delete set null,
    returned_at timestamp with time zone,
    returned_to uuid references user_profiles(id) on delete set null,
    return_condition text,

    -- Financial (optional - for internal tracking)
    quoted_rate numeric,
    quoted_total numeric,
    currency text default 'USD',

    -- Notes
    notes text,
    internal_notes text,

    -- Metadata
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

    -- Ensure end date is after start date
    constraint valid_date_range check (end_date >= start_date)
);

-- Booking conflicts view - helps detect overlapping bookings
create or replace view kit_booking_conflicts as
select
    b1.id as booking_id,
    b1.kit_item_id,
    b1.start_date,
    b1.end_date,
    b1.status,
    b2.id as conflicting_booking_id,
    b2.start_date as conflicting_start,
    b2.end_date as conflicting_end,
    b2.status as conflicting_status
from kit_bookings b1
join kit_bookings b2 on b1.kit_item_id = b2.kit_item_id
    and b1.id != b2.id
    and b1.start_date <= b2.end_date
    and b1.end_date >= b2.start_date
    and b1.status not in ('cancelled', 'returned')
    and b2.status not in ('cancelled', 'returned');

-- Extended view with kit item and project details
create or replace view kit_bookings_extended as
select
    b.*,
    k.kit_id as kit_code,
    k.name as kit_name,
    k.category_id,
    kc.name as category_name,
    kc.color as category_color,
    k.manufacturer,
    k.model,
    k.location as kit_location,
    k.quantity as kit_total_quantity,
    k.day_rate,
    k.rate_currency,
    p.name as linked_project_name,
    p.status as project_status,
    (b.end_date - b.start_date + 1) as total_days,
    case
        when b.status = 'cancelled' then 'Cancelled'
        when b.status = 'returned' then 'Completed'
        when b.status = 'checked_out' and current_date > b.end_date then 'Overdue'
        when b.status = 'checked_out' then 'In Use'
        when b.status = 'confirmed' and current_date >= b.start_date then 'Ready for Pickup'
        when b.status = 'confirmed' then 'Confirmed'
        else 'Pending'
    end as display_status,
    case
        when b.status = 'checked_out' and current_date > b.end_date then current_date - b.end_date
        else 0
    end as days_overdue
from kit_bookings b
left join kit_items k on b.kit_item_id = k.id
left join kit_categories kc on k.category_id = kc.id
left join projects p on b.project_id = p.id;

-- Calendar view for availability
create or replace view kit_availability_calendar as
with date_series as (
    select generate_series(
        current_date - interval '30 days',
        current_date + interval '90 days',
        '1 day'::interval
    )::date as booking_date
),
kit_with_bookings as (
    select
        k.id as kit_item_id,
        k.kit_id as kit_code,
        k.name as kit_name,
        k.quantity as total_quantity,
        d.booking_date,
        coalesce(sum(
            case when b.status not in ('cancelled', 'returned')
                 and b.start_date <= d.booking_date
                 and b.end_date >= d.booking_date
            then b.quantity else 0 end
        ), 0) as booked_quantity
    from kit_items k
    cross join date_series d
    left join kit_bookings b on k.id = b.kit_item_id
    group by k.id, k.kit_id, k.name, k.quantity, d.booking_date
)
select
    *,
    total_quantity - booked_quantity as available_quantity,
    case
        when booked_quantity >= total_quantity then 'unavailable'
        when booked_quantity > 0 then 'partial'
        else 'available'
    end as availability_status
from kit_with_bookings;

-- Function to check kit availability for date range
create or replace function check_kit_availability(
    p_kit_item_id uuid,
    p_start_date date,
    p_end_date date,
    p_quantity int default 1,
    p_exclude_booking_id uuid default null
) returns table (
    is_available boolean,
    available_quantity int,
    conflicting_bookings json
) as $$
declare
    v_total_quantity int;
    v_max_booked int;
    v_conflicts json;
begin
    -- Get total quantity for this kit item
    select quantity into v_total_quantity
    from kit_items
    where id = p_kit_item_id;

    if v_total_quantity is null then
        return query select false, 0, '[]'::json;
        return;
    end if;

    -- Find maximum concurrent bookings during the requested period
    with date_range as (
        select generate_series(p_start_date, p_end_date, '1 day'::interval)::date as d
    ),
    daily_bookings as (
        select
            dr.d,
            coalesce(sum(b.quantity), 0) as booked
        from date_range dr
        left join kit_bookings b on b.kit_item_id = p_kit_item_id
            and b.status not in ('cancelled', 'returned')
            and b.start_date <= dr.d
            and b.end_date >= dr.d
            and (p_exclude_booking_id is null or b.id != p_exclude_booking_id)
        group by dr.d
    )
    select max(booked) into v_max_booked from daily_bookings;

    -- Get conflicting bookings
    select json_agg(json_build_object(
        'id', b.id,
        'start_date', b.start_date,
        'end_date', b.end_date,
        'quantity', b.quantity,
        'status', b.status,
        'project_name', b.project_name
    )) into v_conflicts
    from kit_bookings b
    where b.kit_item_id = p_kit_item_id
        and b.status not in ('cancelled', 'returned')
        and b.start_date <= p_end_date
        and b.end_date >= p_start_date
        and (p_exclude_booking_id is null or b.id != p_exclude_booking_id);

    return query select
        (v_total_quantity - v_max_booked) >= p_quantity,
        v_total_quantity - v_max_booked,
        coalesce(v_conflicts, '[]'::json);
end;
$$ language plpgsql;

-- Indexes for performance
create index if not exists idx_kit_bookings_kit_item on kit_bookings(kit_item_id);
create index if not exists idx_kit_bookings_project on kit_bookings(project_id);
create index if not exists idx_kit_bookings_dates on kit_bookings(start_date, end_date);
create index if not exists idx_kit_bookings_status on kit_bookings(status);
create index if not exists idx_kit_bookings_booked_by on kit_bookings(booked_by);

-- Row Level Security
alter table kit_bookings enable row level security;

-- Allow authenticated users to manage bookings
create policy "Allow all for authenticated users" on kit_bookings
    for all using (auth.role() = 'authenticated');

-- Trigger to update updated_at
create or replace function update_kit_booking_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger kit_booking_updated_at
    before update on kit_bookings
    for each row
    execute function update_kit_booking_updated_at();

-- Trigger to update kit item availability when booking status changes
create or replace function update_kit_availability_on_booking()
returns trigger as $$
begin
    -- When a booking is checked out, decrement available quantity
    if new.status = 'checked_out' and (old.status is null or old.status != 'checked_out') then
        update kit_items
        set quantity_available = greatest(0, quantity_available - new.quantity)
        where id = new.kit_item_id;
    end if;

    -- When a booking is returned or cancelled, increment available quantity
    if new.status in ('returned', 'cancelled') and old.status = 'checked_out' then
        update kit_items
        set quantity_available = least(quantity, quantity_available + new.quantity)
        where id = new.kit_item_id;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger kit_booking_availability_update
    after insert or update on kit_bookings
    for each row
    execute function update_kit_availability_on_booking();

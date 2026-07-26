Kribb 🏠

Kribb is a full-stack, cross-platform (iOS & Android) real estate listing app built with React Native (Expo), Clerk for authentication, and Supabase (Postgres + Storage) for the backend. Users can browse, search, filter, and save property listings, while admins can create, feature, mark-as-sold, and delete listings — all secured end-to-end with Supabase Row Level Security tied directly to Clerk's auth tokens.

✨ Features

For all users

Browse Featured and Recommended property listings on the Home screen
Search properties by title or city, with live results
Filter by property type, bedroom count, and price range (with quick presets)
View full property details — image gallery, description, specs, embedded map preview, and a fullscreen map with a "Open in Google Maps" shortcut
Save/unsave properties to a personal Saved list (heart icon), synced to your account
Contact the listing agent directly via WhatsApp
Sign up / sign in with email + password and email verification (powered by Clerk)
Update profile picture, view account info, and sign out

For admins

A dedicated "Add Property" tab (hidden entirely for non-admin users)
Create new listings with title, description, price, type, bedrooms/bathrooms, area, address, city, coordinates (manual entry or auto-detect via device GPS), and up to 6 photos
Mark listings as Sold or permanently Delete them, directly from the property detail screen
Full client-side form validation, with all writes additionally enforced by database-level security policies — admin status can never be spoofed from the client
🧱 Tech Stack
Layer	Technology
App framework	Expo (React Native, Expo Router — file-based navigation)
Language	TypeScript
Authentication	Clerk (@clerk/clerk-expo)
Database & Storage	Supabase (Postgres, Row Level Security, Storage buckets)
Global state	Zustand
Navigation	Expo Router (file-based, with native iOS tabs via expo-router/unstable-native-tabs)
Maps	OpenStreetMap embeds (via react-native-webview) + Google Maps deep links
Media	expo-image-picker, expo-location
How auth + database security fit together

Clerk handles login/session state; Supabase stores the actual data. These two systems don't know about each other by default, so this app bridges them itself:

A plain, unauthenticated Supabase client (lib/supabase.ts → supabase) is used for anything public (reading property listings, images).
An authenticated client (hooks/useSupabase.ts → useSupabase()) attaches the current user's live Clerk session token to every Supabase request via Supabase's accessToken client option.
Every write-sensitive Supabase Row Level Security policy (creating/updating/deleting properties, saving properties, uploading images) checks auth.jwt()->>'sub' — the Clerk user ID embedded in that token — directly in Postgres. This means admin/ownership checks are enforced by the database itself, not just the app's UI.
hooks/useUserSync.ts keeps a mirrored users row in Supabase in sync with each Clerk account (creating it on first login), which is what carries the is_admin flag used by the RLS policies above.
📦 Getting Started
Prerequisites
Node.js (LTS recommended)
Expo CLI (npx expo — no global install required)
A Clerk account and application
A Supabase project
Expo Go app, or an iOS/Android simulator, for local testing
1. Clone and install
bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
2. Environment variables

Create a .env file in the project root with:

bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key

These are prefixed with EXPO_PUBLIC_ deliberately — only variables with this prefix are bundled into the app at build time. Never put a Supabase service role key here; only the public anon key.

Clerk ↔ Supabase integration: in your Clerk dashboard, configure Supabase as a Third-Party Auth integration (Clerk → Configure → Supabase integration) so Supabase can verify Clerk-issued JWTs. This is required for the accessToken-based Supabase client (hooks/useSupabase.ts) and the RLS policies below to work correctly.

3. Set up the Supabase database

Run the SQL below in the Supabase SQL Editor, in order.

<details> <summary><strong>Users table</strong></summary>
sql
create table users (
  id uuid default gen_random_uuid() primary key,
  clerk_id text unique not null,
  email text not null,
  first_name text,
  last_name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);
</details> <details> <summary><strong>Properties table + public read policy</strong></summary>
sql
create table properties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price numeric not null,
  type text not null, -- 'apartment' | 'house' | 'villa' | 'studio'
  bedrooms int not null default 1,
  bathrooms int not null default 1,
  area_sqft int,
  address text not null,
  city text not null,
  latitude float,
  longitude float,
  images text[] default '{}', -- array of Supabase Storage URLs
  is_featured boolean default false,
  is_sold boolean default false,
  created_at timestamp with time zone default now()
);

alter table properties enable row level security;

create policy "Properties are publicly readable"
on properties for select
using (true);
</details> <details> <summary><strong>Saved properties table + policies</strong></summary>
sql
create table saved_properties (
  id uuid default gen_random_uuid() primary key,
  user_clerk_id text not null references users(clerk_id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_clerk_id, property_id) -- prevents duplicate saves
);

alter table saved_properties enable row level security;

create policy "Users can read own saved properties"
on saved_properties for select
using (user_clerk_id = auth.jwt()->>'sub');

create policy "Users can insert saved properties"
on saved_properties for insert
with check (user_clerk_id = auth.jwt()->>'sub');

create policy "Users can delete own saved properties"
on saved_properties for delete
using (user_clerk_id = auth.jwt()->>'sub');
</details> <details> <summary><strong>Admin flag + admin-only write policies</strong></summary>
sql
alter table users
add column is_admin boolean default false;

create policy "Admin can insert properties"
on properties for insert
with check (
  exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub'
    and is_admin = true
  )
);

create policy "Admin can update properties"
on properties for update
using (
  exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub'
    and is_admin = true
  )
);

create policy "Admin can delete properties"
on properties for delete
using (
  exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub'
    and is_admin = true
  )
);

To make a user an admin, manually set is_admin = true on their row in the users table via the Supabase dashboard — there is no in-app UI for granting admin access.

</details> <details> <summary><strong>Property image storage bucket</strong></summary>
sql
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true);

create policy "Public can read property images"
on storage.objects for select
using (bucket_id = 'property-images');

create policy "Admin can upload property images"
on storage.objects for insert
with check (
  bucket_id = 'property-images'
  and exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub'
    and is_admin = true
  )
);
</details>
4. (Optional) Seed sample listings

A set of sample property listings (with Unsplash image URLs) is available in supabase/seed.sql — run it after the tables above are created if you'd like the app populated with demo data.

5. Run the app
bash
npx expo start

Scan the QR code with Expo Go, or press i / a to launch the iOS Simulator / Android Emulator.

📱 Required Packages

Installed automatically via npm install from package.json. Listed here for reference:

Core

expo — Expo SDK
expo-router — file-based navigation
react, react-native, react-dom, react-native-web

Auth

@clerk/clerk-expo — authentication (sign up/in, sessions)
expo-secure-store — secure on-device session token storage
expo-auth-session, expo-web-browser, expo-crypto — Clerk OAuth/session support

Backend

@supabase/supabase-js — Supabase client (database + storage)
@react-native-async-storage/async-storage — local storage support

State

zustand — lightweight global state (admin flag, search filters)

UI / Navigation

@react-navigation/native, @react-navigation/bottom-tabs, @react-navigation/elements
react-native-screens, react-native-safe-area-context, react-native-gesture-handler
react-native-reanimated, react-native-worklets
@expo/vector-icons — Ionicons used throughout
expo-symbols — SF Symbols for native iOS tabs
expo-image — image rendering

Media & Location

expo-image-picker — photo library access (profile picture, property photos)
expo-location — GPS coordinate detection when creating a listing
react-native-image-viewing — fullscreen photo gallery viewer
react-native-webview — embedded OpenStreetMap previews

Other

expo-constants, expo-linking, expo-splash-screen, expo-status-bar, expo-system-ui, expo-font, expo-haptics

Dev dependencies

typescript, @types/react, eslint, eslint-config-expo
📂 Project Structure
app/
  (auth)/                 # Sign-in / sign-up screens (guarded: redirects away if already signed in)
    sign-in.tsx
    sign-up.tsx
    _layout.tsx
  (root)/                 # Everything past login (guarded: redirects to sign-in if signed out)
    (tabs)/
      index.tsx           # Home — Featured carousel + Recommended list
      search.tsx          # Search + filters
      create.tsx          # Add Property (admin only)
      saved.tsx           # Saved properties
      profile.tsx         # Profile, sign out, support
      _layout.tsx         # Tab bar (native iOS tabs / Android tabs)
    property/
      [id].tsx            # Property detail screen
      map.tsx             # Fullscreen map screen
    _layout.tsx           # Auth guard + Clerk↔Supabase user sync
  _layout.tsx             # Root layout — wraps app in ClerkProvider
  index.tsx               # Entry point — redirects based on auth state

components/
  PropertyCard.tsx        # List-style property card (with save/heart button)
  FeaturedCard.tsx        # Carousel-style property card
  FilterModal.tsx         # Search filter bottom sheet

hooks/
  useSupabase.ts          # Authenticated Supabase client (Clerk token attached)
  useSavedProperty.ts     # Save/unsave logic for a single property
  useUserSync.ts          # Syncs Clerk user → Supabase `users` table

store/
  userStore.ts            # Zustand — admin flag
  filterStore.ts           # Zustand — shared search/filter state

lib/
  supabase.ts             # Supabase client factories
  utils.ts                # formatPrice (₹ lakh/crore formatting)

types/
  index.ts                # Shared Property type
🔐 Security Notes
Row Level Security is enabled on every table — there is no unrestricted table in this project.
Admin-only actions (create/update/delete listings, upload images) are enforced at the database level, independent of the app's own UI checks — the isAdmin flag in Zustand only controls what's shown, never what's allowed.
A .env file is required and is not committed to the repository (see .gitignore). Only the Clerk publishable key and Supabase anon key are used client-side — no secret/service-role keys are ever bundled into the app.
🧭 Roadmap / Known Gaps
Notifications and in-app Settings are placeholder screens ("Coming Soon") pending future work.
No in-app UI for promoting a user to admin — currently a manual step in the Supabase dashboard.
No editing of existing listings yet (only create, mark-sold, and delete).
📄 License

This project is for personal/portfolio use. Add a license of your choice here if open-sourcing.

-- Disable Row Level Security on all tables
ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies for meetings
DROP POLICY IF EXISTS "Users can view their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can create their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;

-- Drop all existing RLS policies for data_chunks
DROP POLICY IF EXISTS "Users can view their own data chunks" ON public.data_chunks;
DROP POLICY IF EXISTS "Users can create their own data chunks" ON public.data_chunks;
DROP POLICY IF EXISTS "Users can update their own data chunks" ON public.data_chunks;
DROP POLICY IF EXISTS "Users can delete their own data chunks" ON public.data_chunks;

-- Drop all existing RLS policies for action_items
DROP POLICY IF EXISTS "Users can view their own action items" ON public.action_items;
DROP POLICY IF EXISTS "Users can create their own action items" ON public.action_items;
DROP POLICY IF EXISTS "Users can update their own action items" ON public.action_items;
DROP POLICY IF EXISTS "Users can delete their own action items" ON public.action_items;

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Users can upload their own meeting documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own meeting documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own meeting documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own meeting documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on meeting documents" ON storage.objects;

-- Create open storage policies (allow all operations)
CREATE POLICY "Allow all operations on meeting documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'meeting-documents');

-- Make the storage bucket public
UPDATE storage.buckets SET public = true WHERE id = 'meeting-documents';
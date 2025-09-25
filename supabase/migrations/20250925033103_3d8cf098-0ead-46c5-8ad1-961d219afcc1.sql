-- Enable RLS on tables that are missing it
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for these tables
CREATE POLICY "Action items are viewable by everyone" 
ON public.action_items 
FOR SELECT 
USING (true);

CREATE POLICY "Action items can be created by anyone" 
ON public.action_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Action items can be updated by anyone" 
ON public.action_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Data chunks are viewable by everyone" 
ON public.data_chunks 
FOR SELECT 
USING (true);

CREATE POLICY "Data chunks can be created by anyone" 
ON public.data_chunks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Data chunks can be updated by anyone" 
ON public.data_chunks 
FOR UPDATE 
USING (true);

CREATE POLICY "Meetings are viewable by everyone" 
ON public.meetings 
FOR SELECT 
USING (true);

CREATE POLICY "Meetings can be created by anyone" 
ON public.meetings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Meetings can be updated by anyone" 
ON public.meetings 
FOR UPDATE 
USING (true);
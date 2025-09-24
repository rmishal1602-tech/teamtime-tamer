-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) VALUES ('meeting-documents', 'meeting-documents', false);

-- Create storage policies for meeting documents
CREATE POLICY "Users can upload their own meeting documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'meeting-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own meeting documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'meeting-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own meeting documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'meeting-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own meeting documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'meeting-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  participant_count INTEGER DEFAULT 0,
  meeting_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create policies for meetings
CREATE POLICY "Users can view their own meetings" 
ON public.meetings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meetings" 
ON public.meetings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings" 
ON public.meetings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings" 
ON public.meetings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create data_chunks table
CREATE TABLE public.data_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source_document TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for data_chunks
ALTER TABLE public.data_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies for data_chunks
CREATE POLICY "Users can view their own data chunks" 
ON public.data_chunks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data chunks" 
ON public.data_chunks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data chunks" 
ON public.data_chunks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data chunks" 
ON public.data_chunks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create action_items table
CREATE TABLE public.action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  action_item TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Not Started',
  due_date DATE,
  remarks TEXT,
  additional_info TEXT,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for action_items
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Create policies for action_items
CREATE POLICY "Users can view their own action items" 
ON public.action_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own action items" 
ON public.action_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action items" 
ON public.action_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action items" 
ON public.action_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
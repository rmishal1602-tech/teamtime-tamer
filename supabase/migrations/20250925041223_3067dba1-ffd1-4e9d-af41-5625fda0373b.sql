-- Create tasks table with same structure as action_items
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meeting_id UUID NOT NULL,
  action_item TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started'::text,
  priority TEXT DEFAULT 'Medium'::text,
  category TEXT,
  due_date DATE,
  remarks TEXT,
  additional_info TEXT,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table
CREATE POLICY "Tasks are viewable by everyone" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Tasks can be created by anyone" 
ON public.tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Tasks can be updated by anyone" 
ON public.tasks 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
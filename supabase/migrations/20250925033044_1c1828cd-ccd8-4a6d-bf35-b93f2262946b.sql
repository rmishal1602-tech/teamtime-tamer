-- Create projects table
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add project_id to meetings table
ALTER TABLE public.meetings 
ADD COLUMN project_id UUID REFERENCES public.projects(id);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Projects are viewable by everyone" 
ON public.projects 
FOR SELECT 
USING (true);

CREATE POLICY "Projects can be created by anyone" 
ON public.projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Projects can be updated by anyone" 
ON public.projects 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert dummy projects with proper UUIDs
INSERT INTO public.projects (id, name, description, status) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 'Product Development', 'Main product development initiatives and strategy', 'active'),
('a50e8400-e29b-41d4-a716-446655440002', 'Marketing & Sales', 'Customer acquisition and marketing campaigns', 'active'),
('a50e8400-e29b-41d4-a716-446655440003', 'Operations & Finance', 'Internal operations and financial planning', 'active');

-- Link existing meetings to projects
UPDATE public.meetings SET project_id = 'a50e8400-e29b-41d4-a716-446655440001' 
WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007');

UPDATE public.meetings SET project_id = 'a50e8400-e29b-41d4-a716-446655440002' 
WHERE id IN ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006');

UPDATE public.meetings SET project_id = 'a50e8400-e29b-41d4-a716-446655440003' 
WHERE id IN ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005');
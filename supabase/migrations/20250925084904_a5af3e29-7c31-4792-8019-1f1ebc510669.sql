-- Create table for business requirements with versioning
CREATE TABLE public.business_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.business_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business requirements are viewable by everyone" 
ON public.business_requirements 
FOR SELECT 
USING (true);

CREATE POLICY "Business requirements can be created by anyone" 
ON public.business_requirements 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Business requirements can be updated by anyone" 
ON public.business_requirements 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_business_requirements_updated_at
BEFORE UPDATE ON public.business_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_business_requirements_meeting_id ON public.business_requirements(meeting_id);
CREATE INDEX idx_business_requirements_version ON public.business_requirements(meeting_id, version DESC);
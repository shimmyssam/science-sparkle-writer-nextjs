-- Create table for storing student feedback
CREATE TABLE public.student_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  essay TEXT NOT NULL,
  feedback_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for viewing feedback)
ALTER TABLE public.student_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view feedback (no login required)
CREATE POLICY "Anyone can view feedback" 
ON public.student_feedback 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to create feedback
CREATE POLICY "Anyone can create feedback" 
ON public.student_feedback 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_feedback_updated_at
BEFORE UPDATE ON public.student_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_student_feedback_id ON public.student_feedback(id);
-- Create table for storing student profiles with dashboard UUIDs
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL UNIQUE,
  dashboard_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for viewing profiles)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view profiles
CREATE POLICY "Anyone can view profiles" 
ON public.student_profiles 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to create profiles
CREATE POLICY "Anyone can create profiles" 
ON public.student_profiles 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_profiles_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for faster lookups
CREATE INDEX idx_student_profiles_student_name ON public.student_profiles(student_name);
CREATE INDEX idx_student_profiles_dashboard_uuid ON public.student_profiles(dashboard_uuid);
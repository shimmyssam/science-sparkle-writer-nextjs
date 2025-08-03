-- Add teacher_modified_feedback column to store teacher edits
ALTER TABLE public.student_feedback
ADD COLUMN teacher_modified_feedback JSONB;

-- Create policy to allow anyone to update feedback (for teacher edits)
CREATE POLICY "Anyone can update feedback" 
ON public.student_feedback 
FOR UPDATE 
USING (true);
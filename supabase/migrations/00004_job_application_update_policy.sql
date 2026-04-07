-- Job owner can update applications (accept/reject)
CREATE POLICY "Job owner can update applications"
  ON job_applications FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN client_profiles cp ON cp.id = j.client_id
      WHERE j.id = job_applications.job_id AND cp.user_id = auth.uid()
    )
  );

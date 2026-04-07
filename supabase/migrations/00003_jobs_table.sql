-- ============================================
-- Jobs (案件・募集要項) テーブル
-- ============================================

CREATE TYPE job_status AS ENUM ('draft', 'open', 'closed', 'cancelled');

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  budget_min INTEGER,          -- JPY
  budget_max INTEGER,          -- JPY
  deadline DATE,               -- 応募締切
  delivery_deadline DATE,      -- 納品希望日
  status job_status NOT NULL DEFAULT 'open',
  application_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_genres ON jobs USING GIN(genres);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Everyone can view open jobs
CREATE POLICY "Open jobs are viewable by everyone"
  ON jobs FOR SELECT USING (status = 'open' OR (
    EXISTS (SELECT 1 FROM client_profiles WHERE id = jobs.client_id AND user_id = auth.uid())
  ));

-- Clients can create their own jobs
CREATE POLICY "Clients can create jobs"
  ON jobs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM client_profiles WHERE id = jobs.client_id AND user_id = auth.uid())
  );

-- Clients can update their own jobs
CREATE POLICY "Clients can update own jobs"
  ON jobs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM client_profiles WHERE id = jobs.client_id AND user_id = auth.uid())
  );

-- Clients can delete their own jobs
CREATE POLICY "Clients can delete own jobs"
  ON jobs FOR DELETE USING (
    EXISTS (SELECT 1 FROM client_profiles WHERE id = jobs.client_id AND user_id = auth.uid())
  );

-- Admin full access
CREATE POLICY "Admin full access on jobs"
  ON jobs FOR ALL USING (is_admin());

-- Updated_at trigger
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Job Applications (案件応募) テーブル
-- ============================================

CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  proposed_price INTEGER,      -- 提案金額
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, accepted, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, creator_id)   -- 同じ案件に二重応募不可
);

CREATE INDEX idx_job_applications_job ON job_applications(job_id);
CREATE INDEX idx_job_applications_creator ON job_applications(creator_id);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Job owner and applicant can view
CREATE POLICY "Job participants can view applications"
  ON job_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM creator_profiles WHERE id = job_applications.creator_id AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN client_profiles cp ON cp.id = j.client_id
      WHERE j.id = job_applications.job_id AND cp.user_id = auth.uid()
    )
  );

-- Creators can apply
CREATE POLICY "Creators can apply to jobs"
  ON job_applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profiles WHERE id = job_applications.creator_id AND user_id = auth.uid())
  );

-- Admin full access
CREATE POLICY "Admin full access on job_applications"
  ON job_applications FOR ALL USING (is_admin());

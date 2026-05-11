-- ============================================
-- jobs.application_count を job_applications の INSERT/DELETE で自動同期
-- 旧実装: API側で creator が UPDATE していたが、jobs の RLS が
--         「クライアントのみ UPDATE 可」のため反映されず常に 0 だったバグを修正。
-- ============================================

CREATE OR REPLACE FUNCTION sync_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs
       SET application_count = application_count + 1
     WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs
       SET application_count = GREATEST(application_count - 1, 0)
     WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS job_applications_count_sync ON job_applications;
CREATE TRIGGER job_applications_count_sync
  AFTER INSERT OR DELETE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION sync_job_application_count();

-- 既存データの不整合を修正
UPDATE jobs j SET application_count = (
  SELECT COUNT(*) FROM job_applications WHERE job_id = j.id
);

-- notifications テーブルもRealtime publicationへ（ベル等の即時更新用 / 任意）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;

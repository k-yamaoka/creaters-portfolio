-- ============================================
-- Reviews テーブル
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES client_profiles(id),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_creator ON reviews(creator_id);
CREATE INDEX idx_reviews_client ON reviews(client_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT USING (true);

-- Clients can create reviews for their completed orders
CREATE POLICY "Clients can create reviews"
  ON reviews FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_profiles WHERE id = reviews.client_id AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM orders WHERE id = reviews.order_id AND status = 'completed'
    )
  );

-- Admin full access
CREATE POLICY "Admin full access on reviews"
  ON reviews FOR ALL USING (is_admin());

-- ============================================
-- Trigger: レビュー追加時にcreator_profilesのrating/review_countを更新
-- ============================================

CREATE OR REPLACE FUNCTION update_creator_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creator_profiles
  SET
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM reviews
      WHERE creator_id = NEW.creator_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE creator_id = NEW.creator_id
    )
  WHERE id = NEW.creator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_creator_rating();

-- ============================================
-- Orders: INSERT/UPDATE policies
-- ============================================

-- Clients can create orders
CREATE POLICY "Clients can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_profiles WHERE id = orders.client_id AND user_id = auth.uid()
    )
  );

-- Order participants can update
CREATE POLICY "Order participants can update"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles WHERE id = orders.creator_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM client_profiles WHERE id = orders.client_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- Client profiles: SELECT policy (needed for order queries)
-- ============================================
CREATE POLICY "Client profiles are viewable by everyone"
  ON client_profiles FOR SELECT USING (true);

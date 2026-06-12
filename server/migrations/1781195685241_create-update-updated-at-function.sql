-- Up Migration
CREATE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END
$$;

-- Down Migration
DROP FUNCTION IF EXISTS update_updated_at;

-- ============================================================
-- Extrovert — precise area geofences
-- ============================================================
-- Keep locality verification anchored to the actual locality,
-- rather than a loose point elsewhere in the district.
--
-- Waknaghat's center is aligned to the locality coordinates used
-- by the app's supported-area geofence. Its existing 5 km radius
-- is retained so the supported area remains useful without making
-- the label drift toward Solan.
-- ============================================================

UPDATE public.extrovert_areas
SET
  center_lat = 31.00923,
  center_lng = 77.08996,
  radius_m = 5000
WHERE name = 'Waknaghat';

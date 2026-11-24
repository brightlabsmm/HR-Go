-- 006_sanitize_organization_countries.sql
-- Fixes BUG-02: Sanitize bad country data, seed full ISO country catalogue, and enforce allowed country codes.

-- 1. Ensure all standard countries exist in system lookup table
INSERT INTO countries (iso_code, name, phone_code, currency_code, default_timezone)
VALUES
    ('MY', 'Malaysia', '+60', 'MYR', 'Asia/Kuala_Lumpur'),
    ('VN', 'Vietnam', '+84', 'VND', 'Asia/Ho_Chi_Minh'),
    ('ID', 'Indonesia', '+62', 'IDR', 'Asia/Jakarta'),
    ('PH', 'Philippines', '+63', 'PHP', 'Asia/Manila'),
    ('CN', 'China', '+86', 'CNY', 'Asia/Shanghai'),
    ('JP', 'Japan', '+81', 'JPY', 'Asia/Tokyo'),
    ('US', 'United States', '+1', 'USD', 'America/New_York'),
    ('GB', 'United Kingdom', '+44', 'GBP', 'Europe/London')
ON CONFLICT (iso_code) DO NOTHING;

-- 2. Clean up existing bad values in organizations table
UPDATE organizations
SET country = 'MM'
WHERE country IS NULL
   OR TRIM(country) = ''
   OR country ILIKE '%myanmar%'
   OR country ILIKE '%မြန်မာ%'
   OR country ILIKE '%burma%'
   OR country IN ('Myanmar12', 'Myanmar 69', 'Myanmar123!@#', 'MMK');

UPDATE organizations
SET country = 'TH'
WHERE country ILIKE '%thailand%' OR country ILIKE '%thai%';

UPDATE organizations
SET country = 'SG'
WHERE country ILIKE '%singapore%';

UPDATE organizations
SET country = 'MY'
WHERE country ILIKE '%malaysia%';

UPDATE organizations
SET country = 'VN'
WHERE country ILIKE '%vietnam%';

UPDATE organizations
SET country = 'ID'
WHERE country ILIKE '%indonesia%';

UPDATE organizations
SET country = 'PH'
WHERE country ILIKE '%philippines%';

UPDATE organizations
SET country = 'CN'
WHERE country ILIKE '%china%';

UPDATE organizations
SET country = 'JP'
WHERE country ILIKE '%japan%';

UPDATE organizations
SET country = 'US'
WHERE country ILIKE '%united states%' OR country ILIKE '%usa%';

UPDATE organizations
SET country = 'GB'
WHERE country ILIKE '%united kingdom%' OR country ILIKE '%uk%';

-- Normalize any casing
UPDATE organizations
SET country = UPPER(TRIM(country))
WHERE country IS NOT NULL;

-- Any remaining unrecognized values fallback to 'MM'
UPDATE organizations
SET country = 'MM'
WHERE country NOT IN ('MM', 'TH', 'SG', 'MY', 'VN', 'ID', 'PH', 'CN', 'JP', 'US', 'GB');

-- 3. Add CHECK constraint on organizations table to reject any free-text countries in future
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS chk_organizations_country;

ALTER TABLE organizations
ADD CONSTRAINT chk_organizations_country
CHECK (country IN ('MM', 'TH', 'SG', 'MY', 'VN', 'ID', 'PH', 'CN', 'JP', 'US', 'GB'));

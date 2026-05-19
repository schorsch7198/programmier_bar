-- ************************************************
-- Additive seed: top-level categories (Drinks, Tapas, Merch) and their direct children.
-- Idempotent — safe to run repeatedly. Existing categories are preserved.
--
-- Apply against a running container:
--   docker exec -i programmier_bar_postgres psql -U barAdmin -d programmier_bar < seed_categories.sql
--
-- Or directly via psql on the host:
--   psql -h localhost -p 7777 -U barAdmin -d programmier_bar -f seed_categories.sql
-- ************************************************

-- Top-level categories
INSERT INTO assortment.category (name, ranking)
SELECT 'Drinks', 1
WHERE NOT EXISTS (SELECT 1 FROM assortment.category WHERE name = 'Drinks' AND category_ref_id IS NULL);

INSERT INTO assortment.category (name, ranking)
SELECT 'Tapas', 2
WHERE NOT EXISTS (SELECT 1 FROM assortment.category WHERE name = 'Tapas' AND category_ref_id IS NULL);

INSERT INTO assortment.category (name, ranking)
SELECT 'Merch', 3
WHERE NOT EXISTS (SELECT 1 FROM assortment.category WHERE name = 'Merch' AND category_ref_id IS NULL);


-- Drinks children
INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Cocktails', 1
FROM assortment.category parent
WHERE parent.name = 'Drinks' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Cocktails' AND category_ref_id = parent.category_id);

INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'default Drinks', 2
FROM assortment.category parent
WHERE parent.name = 'Drinks' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'default Drinks' AND category_ref_id = parent.category_id);

INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Anti-Alcoholics', 3
FROM assortment.category parent
WHERE parent.name = 'Drinks' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Anti-Alcoholics' AND category_ref_id = parent.category_id);


-- Tapas children
INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Meat', 1
FROM assortment.category parent
WHERE parent.name = 'Tapas' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Meat' AND category_ref_id = parent.category_id);

INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Fish', 2
FROM assortment.category parent
WHERE parent.name = 'Tapas' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Fish' AND category_ref_id = parent.category_id);

INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Veggie', 3
FROM assortment.category parent
WHERE parent.name = 'Tapas' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Veggie' AND category_ref_id = parent.category_id);

INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Sweeties', 4
FROM assortment.category parent
WHERE parent.name = 'Tapas' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Sweeties' AND category_ref_id = parent.category_id);


-- Merch children
INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Shirts', 1
FROM assortment.category parent
WHERE parent.name = 'Merch' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Shirts' AND category_ref_id = parent.category_id);

INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Hoodies', 2
FROM assortment.category parent
WHERE parent.name = 'Merch' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Hoodies' AND category_ref_id = parent.category_id);

INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Posters', 3
FROM assortment.category parent
WHERE parent.name = 'Merch' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Posters' AND category_ref_id = parent.category_id);

INSERT INTO assortment.category (category_ref_id, name, ranking)
SELECT parent.category_id, 'Stickers', 4
FROM assortment.category parent
WHERE parent.name = 'Merch' AND parent.category_ref_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM assortment.category
                   WHERE name = 'Stickers' AND category_ref_id = parent.category_id);


-- Verify
SELECT category_id, category_ref_id, name, ranking
FROM assortment.category
ORDER BY COALESCE(category_ref_id, category_id), category_ref_id NULLS FIRST, ranking;

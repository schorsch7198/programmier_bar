-- --COMMENT BEGIN (till line 72)
-- -- ************************************************
-- -- INSERT/UPDATE Commands after creating database for filling up each table
-- -- ************************************************
-- -- Insert example for person/user
-- INSERT INTO assortment.person (
    -- digit,
    -- surname,
    -- forename,
    -- role_number,
    -- role_text,
    -- login_name,
    -- password
-- ) VALUES (
    -- 111,
    -- 'Steiner',
    -- 'GeorgJ',
    -- 2,
    -- 'Administration',
    -- 'barAdmin',
    -- encode(digest(convert_to('barAdmin','UTF8')::bytea, 'sha512'), 'base64')
-- );
-- -- Update command for password - if needed
-- UPDATE assortment.person
   -- SET password = encode(
                     -- digest(
                       -- convert_to('barAdmin','UTF8')::bytea,
                       -- 'sha512'
                     -- ),
                     -- 'base64'
                   -- )
 -- WHERE lower(login_name) = 'baradmin';
-- -- 1) Create a “drinks” category (ranking 1)
-- INSERT INTO assortment.category (name, ranking)
-- VALUES ('drinks', 1);
-- -- 2) Create a “martini” product (insuser=CURRENT_USER, insdate=now())
-- INSERT INTO assortment.product (name)
-- VALUES ('martini');
-- -- 3) Bind “martini” into “drinks”
-- INSERT INTO assortment.product_category (product_id, category_id)
-- SELECT
  -- p.product_id,
  -- c.category_id
-- FROM
  -- assortment.product p
  -- JOIN assortment.category c ON c.name = 'drinks'
-- WHERE
  -- p.name = 'martini';
-- -- 4) Give barAdmin (person_id = 2) an initial stock of 12 martinis
-- INSERT INTO assortment.stock (product_id, person_id, amount, date_time, note)
-- SELECT
  -- p.product_id,
  -- 2,
  -- 12,
  -- now(),
  -- 'initial stock'
-- FROM
  -- assortment.product p
-- WHERE
  -- p.name = 'martini';
-- -- 5) Insert default Filedata to product
-- INSERT INTO assortment.filedata (product_id, person_id, name, media_type, content)
-- SELECT p.product_id, 2, 'placeholder.txt', 'text/plain', decode('','hex')
-- FROM assortment.product p
-- WHERE p.name = 'martini'
  -- AND NOT EXISTS (
    -- SELECT 1
    -- FROM assortment.filedata f
    -- WHERE f.product_id = p.product_id
      -- AND f.person_id = 2
  -- );
-- -- COMMENT END (from line 1)

-- -- Front-end (SPA)
-- npm run serve

-- -- Back-end (.NET WebAPI)
-- dotnet watch run --urls=http://localhost:5181

select * from assortment.product;

SELECT * FROM assortment.product
ORDER BY product_id;

-- Step 1: Delete from filedata
DELETE FROM assortment.filedata
WHERE product_id IN (31, 32);
-- Step 2: Delete from stock
DELETE FROM assortment.stock
WHERE product_id IN (31, 32);
-- Step 3: Delete from product_category
DELETE FROM assortment.product_category
WHERE product_id IN (31, 32);
-- Step 4: Now it's safe to delete from product
DELETE FROM assortment.product
WHERE product_id IN (31, 32);


-- ************************************************
-- DATABASE
-- ************************************************

DROP DATABASE IF EXISTS programmier_bar;
CREATE DATABASE programmier_bar;


-- ************************************************
-- barAdmin USER 
-- ************************************************

DO
$$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'barAdmin'
    ) THEN
        CREATE ROLE "barAdmin" WITH LOGIN PASSWORD 'barAdmin';
    END IF;
END
$$;


-- ************************************************
-- pgcrypto EXTENSION for passwords in PERSON
-- ************************************************

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ************************************************
-- SCHEMA
-- ************************************************

DROP SCHEMA IF EXISTS assortment CASCADE;
CREATE SCHEMA IF NOT EXISTS assortment;
GRANT USAGE ON SCHEMA assortment TO "barAdmin";




-- ************************************************
-- OBJECT: PERSON
-- ************************************************

DROP TABLE IF EXISTS assortment.person CASCADE;
CREATE SEQUENCE IF NOT EXISTS assortment.person_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE assortment.person
(
	person_id			integer	NOT NULL DEFAULT NEXTVAL('assortment.person_seq'),
	digit				integer,
	surname				varchar(200),
	forename			varchar(200),
	title_pre			varchar(100),
	title_post			varchar(100),
	role_number			integer,
	role_text			varchar(100),
	login_name			varchar(100),
	password			varchar(1000),
	login_token			varchar(250),
	login_until			timestamptz,
	login_last			timestamptz,
	pic					bytea,
	pic_type			varchar(100),
	CONSTRAINT person_pk	PRIMARY KEY (person_id)
);
GRANT INSERT, SELECT, UPDATE, DELETE, REFERENCES	ON TABLE assortment.person TO "barAdmin";
GRANT SELECT, USAGE, UPDATE							ON SEQUENCE assortment.person_seq TO "barAdmin";


-- ************************************************
-- OBJECT: PRODUCT
-- ************************************************

DROP TABLE IF EXISTS assortment.product CASCADE;
CREATE SEQUENCE IF NOT EXISTS assortment.product_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS assortment.product_charcode_seq START WITH 1000 INCREMENT BY 1;
CREATE TABLE assortment.product
(
	product_id			integer			NOT NULL DEFAULT NEXTVAL('assortment.product_seq'),
	product_uid			varchar(50),
	charcode			varchar(25)		NOT NULL DEFAULT 'A' || NEXTVAL('assortment.product_charcode_seq'),
	name				varchar(200),
	insuser				varchar(100)	NOT NULL DEFAULT CURRENT_USER,
	insdate				timestamptz		NOT NULL DEFAULT now(),
	upduser				varchar(100),
	upddate				timestamptz		NOT NULL DEFAULT now(),
	deluser				varchar(100),
	deldate				timestamptz,
	CONSTRAINT product_pk				PRIMARY KEY (product_id),
	CONSTRAINT product_charcode_uq		UNIQUE (charcode)
);
GRANT INSERT, SELECT, UPDATE, DELETE, REFERENCES	ON TABLE assortment.product TO "barAdmin";
GRANT SELECT, USAGE, UPDATE							ON SEQUENCE assortment.product_seq TO "barAdmin";
GRANT SELECT, USAGE, UPDATE							ON SEQUENCE assortment.product_charcode_seq TO "barAdmin";


-- ************************************************
-- OBJECT: CATEGORY
-- ************************************************

DROP TABLE IF EXISTS assortment.category CASCADE;
CREATE SEQUENCE IF NOT EXISTS assortment.category_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE assortment.category
(
	category_id			integer	NOT NULL DEFAULT NEXTVAL('assortment.category_seq'),
	category_ref_id		integer,
	name				varchar(100),
	ranking				integer,
	CONSTRAINT category_pk		PRIMARY KEY (category_id),
	CONSTRAINT category_ref_fk	FOREIGN KEY (category_ref_id) REFERENCES assortment.category(category_id)
);
GRANT INSERT, SELECT, UPDATE, DELETE, REFERENCES	ON TABLE assortment.category TO "barAdmin";
GRANT SELECT, USAGE, UPDATE 						ON SEQUENCE assortment.category_seq TO "barAdmin";


-- ************************************************
-- OBJECT: PRODUCT_CATEGORY
-- ************************************************

DROP TABLE IF EXISTS assortment.product_category CASCADE;
CREATE TABLE assortment.product_category
(
	product_id			integer			NOT NULL,
	category_id			integer			NOT NULL,
	CONSTRAINT product_category_pk		PRIMARY KEY (product_id, category_id),
	CONSTRAINT product_category_prod_fk	FOREIGN KEY (product_id)	REFERENCES assortment.product(product_id),
	CONSTRAINT product_category_cat_fk	FOREIGN KEY (category_id)	REFERENCES assortment.category(category_id)
);
GRANT INSERT, SELECT, UPDATE, DELETE, REFERENCES	ON TABLE assortment.product_category TO "barAdmin";


-- ************************************************
-- OBJECT: STOCK
-- ************************************************

DROP TABLE IF EXISTS assortment.stock CASCADE;
CREATE SEQUENCE IF NOT EXISTS assortment.stock_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE assortment.stock
(
	stock_id			integer	NOT NULL DEFAULT NEXTVAL('assortment.stock_seq'),
	product_id			integer,
	person_id			integer,
	amount				integer,
	date_time			timestamptz,
	note				varchar(1000),
	CONSTRAINT stock_pk			PRIMARY KEY (stock_id),
	CONSTRAINT stock_product_fk	FOREIGN KEY (product_id)	REFERENCES assortment.product(product_id),
	CONSTRAINT stock_person_fk	FOREIGN KEY (person_id)	REFERENCES assortment.person(person_id)
);
GRANT INSERT, SELECT, UPDATE, DELETE, REFERENCES	ON TABLE assortment.stock TO "barAdmin";
GRANT SELECT, USAGE, UPDATE							ON SEQUENCE assortment.stock_seq TO "barAdmin";


-- ************************************************
-- OBJECT: FILEDATA
-- ************************************************

DROP TABLE IF EXISTS assortment.filedata CASCADE;
CREATE SEQUENCE IF NOT EXISTS assortment.filedata_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE assortment.filedata
(
	filedata_id			integer		NOT NULL DEFAULT NEXTVAL('assortment.filedata_seq'),
	product_id			integer,
	person_id			integer,
	name				varchar(250),
	media_type			varchar(250),
	content				bytea,
	CONSTRAINT filedata_pk			PRIMARY KEY (filedata_id),
	CONSTRAINT filedata_product_fk	FOREIGN KEY (product_id)	REFERENCES assortment.product(product_id),
	CONSTRAINT filedata_person_fk	FOREIGN KEY (person_id)		REFERENCES assortment.person(person_id)
);
GRANT INSERT, SELECT, UPDATE, DELETE, REFERENCES 	ON TABLE assortment.filedata TO "barAdmin";
GRANT SELECT, USAGE, UPDATE 						ON SEQUENCE assortment.filedata_seq TO "barAdmin";



--************************************************
-- FUNCTIONS
--************************************************

-- for factoring full name at once
CREATE FUNCTION assortment.full_person_name(p assortment.person) RETURNS varchar AS 
$$
  SELECT CONCAT_WS(' ', p.title_pre, p.forename, p.surname, p.title_post);
$$
LANGUAGE SQL IMMUTABLE;



-- ************************************************
-- VIEW: PRODUCT_INFO
-- ************************************************

DROP VIEW IF EXISTS	assortment.product_info;
CREATE VIEW			assortment.product_info
(
	product_id, product_uid, charcode, name,
	insuser, insdate, upduser, upddate, deluser, deldate,
	stock, category_id, category_name
)	AS
SELECT
	a.product_id, a.product_uid, a.charcode, a.name,
	a.insuser, a.insdate, a.upduser, a.upddate, a.deluser, a.deldate,
	COALESCE(SUM(s.amount), 0)		AS stock,
	c.category_id, c.name	AS category_name
FROM assortment.product a
JOIN assortment.product_category x	ON a.product_id = x.product_id
JOIN assortment.category c			ON x.category_id = c.category_id
LEFT JOIN assortment.stock s		ON a.product_id = s.product_id
WHERE a.deldate IS NULL
GROUP BY
	a.product_id, a.product_uid, a.charcode, a.name,
	a.insuser, a.insdate, a.upduser, a.upddate, a.deluser, a.deldate,
	c.category_id, c.name;
GRANT SELECT ON		assortment.product_info TO "barAdmin";


-- ************************************************
-- VIEW: STOCK_INFO
-- ************************************************

DROP VIEW IF EXISTS	assortment.stock_info;
CREATE VIEW			assortment.stock_info
(
	stock_id, product_id, person_id,
	amount, date_time, note, person_name_full
)	AS
SELECT
	s.stock_id, s.product_id, s.person_id,
	s.amount, s.date_time, s.note,
	assortment.full_person_name(p) AS person_name_full
FROM assortment.stock s
LEFT JOIN assortment.person p ON s.person_id = p.person_id;
GRANT SELECT ON assortment.stock_info TO "barAdmin";


-- ************************************************
-- VIEW: FILEDATA_INFO
-- ************************************************

DROP VIEW IF EXISTS	assortment.filedata_info;
CREATE VIEW			assortment.filedata_info
(
	filedata_id, product_id, person_id,
	name, media_type, content, person_name_full
)	AS
SELECT
	f.filedata_id, f.product_id, f.person_id,
	f.name, f.media_type, f.content,
	assortment.full_person_name(p) AS person_name_full
FROM assortment.filedata f
LEFT JOIN assortment.person p ON f.person_id = p.person_id;
GRANT SELECT ON assortment.filedata_info TO "barAdmin";


-- ************************************************
-- VIEW: CATEGORY_INFO
-- ************************************************

DROP VIEW IF EXISTS assortment.category_info;
CREATE VIEW assortment.category_info AS
WITH RECURSIVE HierarchyCTE AS
(
	SELECT
		category_id, category_ref_id, name, ranking,
		category_id::text	|| '|' AS id_path,
		name				|| '|' AS name_path
	FROM assortment.category
	WHERE category_ref_id IS NULL

	UNION ALL

	SELECT
		k.category_id, k.category_ref_id, k.name, k.ranking,
		h.id_path	|| k.category_id	|| '|' AS id_path,
		h.name_path	|| k.name			|| '|' AS name_path
	FROM assortment.category k
	JOIN HierarchyCTE h ON h.category_id = k.category_ref_id
)
SELECT category_id, category_ref_id, name, ranking, id_path, name_path
FROM HierarchyCTE
ORDER BY ranking, category_id;
GRANT SELECT ON assortment.category_info TO "barAdmin";
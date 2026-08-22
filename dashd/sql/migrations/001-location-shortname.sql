CREATE TABLE IF NOT EXISTS locations_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS readings_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL, 
    timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    temp_c REAL NOT NULL,
    humidity_rel REAL NOT NULL,

    FOREIGN KEY (location_id) REFERENCES locations_new(id)
);

INSERT INTO locations_new (id, name, description, created_at)
SELECT
    location_id AS id,
    'encore_main' AS name,
    location_name AS description,
    created_at
FROM locations;

INSERT INTO readings_new (id, location_id, timestamp, temp_c, humidity_rel)
SELECT
    reading_id AS id,
    location_id,
    timestamp,
    temp_c,
    humidity_rel
FROM readings;

DROP INDEX idx_readings_location_time;

CREATE INDEX idx_readings_location_time
ON readings_new (location_id, timestamp);

BEGIN TRANSACTION;

ALTER TABLE locations RENAME TO locations_old;
ALTER TABLE readings RENAME TO readings_old;

ALTER TABLE locations_new RENAME TO locations;
ALTER TABLE readings_new RENAME TO readings;

COMMIT;

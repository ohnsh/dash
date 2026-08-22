-- DROP TABLE IF EXISTS readings;
-- DROP TABLE IF EXISTS locations;

CREATE TABLE IF NOT EXISTS locations (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS readings (
    reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL, 
    timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    temp_c REAL NOT NULL,
    humidity_rel REAL NOT NULL,

    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

CREATE INDEX IF NOT EXISTS idx_readings_location_time 
ON readings (location_id, timestamp);

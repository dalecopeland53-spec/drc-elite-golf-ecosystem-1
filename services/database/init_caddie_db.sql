-- ==============================================================================
-- DRC VIRTUAL GOLF ELITE - PRODUCTION STORAGE REGISTER BLUEPRINT
-- ==============================================================================

-- 1. Core Profile Records (Synchronising to App.js Profile Variables)
CREATE TABLE IF NOT EXISTS golfer_profiles (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL DEFAULT 'Dale Copeland',
    handicap_index NUMERIC(4,1) DEFAULT 12.4,
    preferred_units VARCHAR(10) DEFAULT 'YARDS',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Custom Crowd-Sourced Course Maps (Populated via Course Mapper GPS Capture)
CREATE TABLE IF NOT EXISTS community_course_maps (
    id SERIAL PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL DEFAULT 'Yeppoon Golf Club',
    hole_number INT NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
    tee_box_color VARCHAR(30) DEFAULT 'White',
    
    -- High-accuracy node variables pinned from mobile GPS hardware array
    front_node_latitude NUMERIC(9,6) NOT NULL,
    front_node_longitude NUMERIC(9,6) NOT NULL,
    center_node_latitude NUMERIC(9,6) NOT NULL,
    center_node_longitude NUMERIC(9,6) NOT NULL,
    back_node_latitude NUMERIC(9,6) NOT NULL,
    back_node_longitude NUMERIC(9,6) NOT NULL,
    
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_name, hole_number, tee_box_color)
);

-- 3. Comprehensive Round Historical Scorecards
CREATE TABLE IF NOT EXISTS historical_round_logs (
    id SERIAL PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL DEFAULT 'Yeppoon Golf Club',
    date_played DATE DEFAULT CURRENT_DATE,
    
    -- Integer arrays holding complete 18-hole score performance tracks
    strokes_per_hole INT[] NOT NULL,
    putts_per_hole INT[] NOT NULL,
    fairways_hit_boolean BOOLEAN[] NOT NULL,
    gir_success_boolean BOOLEAN[] NOT NULL,
    
    macro_strokes_total INT NOT NULL,
    macro_putts_total INT NOT NULL
);

-- Pre-populate default index register placeholder to secure seamless first-run lookups
INSERT INTO golfer_profiles (id, username, handicap_index, preferred_units)
VALUES (1, 'Dale Copeland', 12.4, 'YARDS')
ON CONFLICT (id) DO NOTHING;

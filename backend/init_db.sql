CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id_external VARCHAR(100) UNIQUE NOT NULL,
    satellite VARCHAR(20) NOT NULL,
    product_type VARCHAR(20),
    acquisition_time TIMESTAMPTZ NOT NULL,
    polarization VARCHAR(10),
    resolution_m FLOAT,
    orbit_number INTEGER,
    orbit_direction VARCHAR(15),
    footprint GEOMETRY(Polygon, 4326),
    file_path TEXT,
    file_size_bytes BIGINT,
    processing_status VARCHAR(20) DEFAULT 'raw',
    wind_gate_passed BOOLEAN,
    wind_speed_ms FLOAT,
    source VARCHAR(30) DEFAULT 'demo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mmsi VARCHAR(15),
    imo VARCHAR(15),
    name VARCHAR(100),
    call_sign VARCHAR(20),
    flag VARCHAR(50),
    vessel_type VARCHAR(50),
    vessel_type_prior FLOAT,
    length_m FLOAT,
    width_m FLOAT,
    dwt FLOAT,
    owner VARCHAR(200),
    source VARCHAR(30) DEFAULT 'demo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vessel_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID REFERENCES vessels(id),
    timestamp TIMESTAMPTZ NOT NULL,
    position GEOMETRY(Point, 4326) NOT NULL,
    sog_knots FLOAT,
    cog_degrees FLOAT,
    heading_degrees FLOAT,
    nav_status VARCHAR(30),
    source VARCHAR(30) DEFAULT 'demo'
);

CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    region VARCHAR(100),
    timestamp_range_start TIMESTAMPTZ,
    timestamp_range_end TIMESTAMPTZ,
    checksum VARCHAR(128),
    license VARCHAR(200),
    local_path TEXT,
    ingestion_status VARCHAR(20) DEFAULT 'pending',
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

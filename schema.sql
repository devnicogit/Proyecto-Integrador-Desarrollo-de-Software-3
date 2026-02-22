-- Consolidated and Expanded Schema for EcoRoute Logistics
-- Based on Hexagonal Architecture and Domain Driven Design (Bounded Context: Delivery & Tracking)

-- 1. Drivers Management
CREATE TABLE drivers (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR(50) UNIQUE, -- ID from Keycloak or Legacy system
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicles Management
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100),
    brand VARCHAR(100),
    capacity_kg DECIMAL(10,2),
    capacity_m3 DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Routes/Trips (Grouping of orders for a day/shift)
CREATE TABLE routes (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT REFERENCES drivers(id),
    vehicle_id BIGINT REFERENCES vehicles(id),
    route_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    estimated_start_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    total_distance_km DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders (The core delivery unit)
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    external_reference VARCHAR(100), -- Order ID from Retailer/ERP
    route_id BIGINT REFERENCES routes(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED, RETURNED
    
    -- Recipient Info
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(100),
    
    -- Delivery Address
    delivery_address TEXT NOT NULL,
    delivery_city VARCHAR(100),
    delivery_district VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Constraints
    priority INTEGER DEFAULT 0,
    estimated_delivery_window_start TIMESTAMP WITH TIME ZONE,
    estimated_delivery_window_end TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Status History (Audit Trail)
CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    status VARCHAR(50) NOT NULL,
    reason TEXT,
    location_lat DECIMAL(10, 8),
    location_lon DECIMAL(11, 8),
    changed_by VARCHAR(100), -- User ID or Driver ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Delivery Proofs (Evidence)
CREATE TABLE delivery_proofs (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) UNIQUE,
    image_url TEXT,
    signature_data_url TEXT, -- Base64 or URL
    receiver_name VARCHAR(255),
    receiver_dni VARCHAR(20),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- 7. GPS Tracking History (For real-time breadcrumbs)
CREATE TABLE vehicle_gps_history (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles(id),
    driver_id BIGINT REFERENCES drivers(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed_kmh DECIMAL(5,2),
    heading_degrees INTEGER,
    ping_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_route_id ON orders(route_id);
CREATE INDEX idx_gps_vehicle_time ON vehicle_gps_history(vehicle_id, ping_time DESC);
CREATE INDEX idx_status_history_order ON order_status_history(order_id);

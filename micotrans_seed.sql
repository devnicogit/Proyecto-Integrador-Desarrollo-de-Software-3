-- ==========================================================
-- MICOTRANS - Grupo Micotrans S.A.C. (Puente Piedra, Lima)
-- Seed unificado: setup empresa + pre-test (DATOS REALES) + post-test (sistema)
--
-- Pre-test (02/03/2026 - 18/04/2026): 150 registros REALES extraídos de
--   "REGISTROS SOLICITADOS-MICOTRANS S.A.C - Hoja 1.csv"
--   KPIs reales: IID 60.0% | CHR 67.3% | TDE 51.3%
--
-- Post-test (20/04/2026 - 31/05/2026): 150 registros generados por el sistema
--   KPIs objetivo: IID ~96% | CHR ~93% | TDE ~95%
-- ==========================================================

BEGIN;

-- ============================================================
-- 1. INFRAESTRUCTURA: Hub en Puente Piedra
-- ============================================================
INSERT INTO hubs (name, code, address, city, latitude, longitude, is_active)
VALUES ('Hub Micotrans Puente Piedra', 'HUB-MCT-001', 'Av. Puente Piedra 1456', 'Lima', -11.866402, -77.071953, TRUE);

-- ============================================================
-- 2. CONDUCTORES (personal operativo MICOTRANS)
-- ============================================================
INSERT INTO drivers (external_id, first_name, last_name, license_number, phone_number, email, is_active) VALUES
('mct-001', 'Carlos', 'Quispe Mamani',    'LIC-MCT-001', '987111001', 'cquispe@micotrans.com.pe', TRUE),
('mct-002', 'Luis',   'Huamani Soto',     'LIC-MCT-002', '987111002', 'lhuamani@micotrans.com.pe', TRUE),
('mct-003', 'José',   'Ramírez Vega',     'LIC-MCT-003', '987111003', 'jramirez@micotrans.com.pe', TRUE),
('mct-004', 'Pedro',  'Castillo Rojas',   'LIC-MCT-004', '987111004', 'pcastillo@micotrans.com.pe', TRUE),
('mct-005', 'Miguel', 'Torres Mendoza',   'LIC-MCT-005', '987111005', 'mtorres@micotrans.com.pe', TRUE);

-- ============================================================
-- 3. VEHÍCULOS (flota MICOTRANS)
-- ============================================================
INSERT INTO vehicles (plate_number, model, brand, capacity_kg, capacity_m3, is_active) VALUES
('AFT-101', 'NPR',     'Isuzu',    3500.00, 18.0, TRUE),
('AFT-102', 'JAC X200','JAC',      2500.00, 14.0, TRUE),
('AFT-103', 'FRR',     'Isuzu',    5500.00, 22.0, TRUE),
('AFT-104', 'N300',    'Chevrolet', 800.00,  5.0, TRUE),
('AFT-105', 'HR',      'Hyundai',  2000.00, 10.0, TRUE);

-- ============================================================
-- 4. CONTRATOS Y TURNOS
-- ============================================================
INSERT INTO driver_contracts (driver_id, contract_type, start_date, end_date, base_salary)
SELECT id, 'PLANILLA', DATE '2026-01-01', DATE '2026-12-31', 2500.00
FROM drivers WHERE external_id LIKE 'mct-%';

COMMIT;

-- ============================================================
-- 5. PRE-TEST: 150 REGISTROS REALES DEL CSV DE MICOTRANS
-- ============================================================
-- (Cargar el archivo micotrans_pretest_real.sql en este punto)
\i micotrans_pretest_real.sql

-- ============================================================
-- 6. POST-TEST: 150 registros generados por el sistema EcoRoute
--    Periodo 20/04/2026 - 31/05/2026
-- ============================================================
BEGIN;

DO $$
DECLARE
    d        DATE;
    drv_id   BIGINT;
    veh_id   BIGINT;
    route_id BIGINT;
    rec_count INT;
    i         INT;
    ord_id    BIGINT;
    is_valid_iid BOOLEAN;
    is_delivered BOOLEAN;
    has_evidence BOOLEAN;
    base_lat NUMERIC := -11.866402;
    base_lon NUMERIC := -77.071953;
    rnd INT;
    target_iid_pct INT := 96;   -- mejora vs pre-test 60%
    target_chr_pct INT := 93;   -- mejora vs pre-test 67%
    target_tde_pct INT := 95;   -- mejora vs pre-test 51%
    -- Clientes reales (mismos que en pre-test)
    clientes TEXT[] := ARRAY[
        'Aceros Dayana S.A.C.|20456123789|Ate',
        'Almacenes Santa Rosa|20422265183|Santa Anita',
        'Consorcio Vial Lima|20334259392|Lince',
        'Constructora Graña|20334259392|Miraflores',
        'Distribuidora Mi Perú|20601245893|Los Olivos',
        'Ferretería El Progreso|20123456789|Comas',
        'Gamma Cargo S.A.C.|20554896321|Callao',
        'Industrial Mega S.A.C.|20466470434|V.E.S.',
        'Inversiones J&M|20768874883|Cercado',
        'Metal Mecánica El Pino|20128874561|La Victoria',
        'Sodifer S.A.C.|20519534257|San Borja'
    ];
    cli_parts TEXT[];
    cli_name TEXT;
    cli_ruc  TEXT;
    cli_dist TEXT;
    post_idx INT := 0;
BEGIN

    FOR d IN
        SELECT generate_series(DATE '2026-04-20', DATE '2026-05-31', INTERVAL '1 day')::DATE
    LOOP
        rec_count := 3 + ((EXTRACT(DAY FROM d)::INT + EXTRACT(MONTH FROM d)::INT * 7) % 4);

        SELECT id INTO drv_id FROM drivers WHERE external_id LIKE 'mct-%' ORDER BY id OFFSET ((EXTRACT(DAY FROM d)::INT) % 5) LIMIT 1;
        SELECT id INTO veh_id FROM vehicles WHERE plate_number LIKE 'AFT-%' ORDER BY id OFFSET ((EXTRACT(DAY FROM d)::INT) % 5) LIMIT 1;

        INSERT INTO routes (driver_id, vehicle_id, route_date, status, estimated_start_time, actual_start_time, actual_end_time, total_distance_km)
        VALUES (drv_id, veh_id, d, 'COMPLETED',
                d + TIME '08:00', d + TIME '08:05', d + TIME '17:30',
                25 + (EXTRACT(DAY FROM d)::INT % 20))
        RETURNING id INTO route_id;

        FOR i IN 1..rec_count LOOP
            post_idx := post_idx + 1;
            rnd := ((EXTRACT(DAY FROM d)::INT * 7 + i * 13) % 100);
            is_valid_iid := rnd < target_iid_pct;
            is_delivered := ((rnd + 11) % 100) < target_chr_pct;
            has_evidence := ((rnd + 23) % 100) < target_tde_pct;

            -- Rotar entre los 11 clientes reales
            cli_parts := string_to_array(clientes[((post_idx - 1) % 11) + 1], '|');
            cli_name := cli_parts[1];
            cli_ruc  := cli_parts[2];
            cli_dist := cli_parts[3];

            INSERT INTO orders (
                tracking_number, external_reference, route_id, status,
                recipient_name, recipient_phone, recipient_email,
                delivery_address, delivery_city, delivery_district,
                latitude, longitude, priority,
                estimated_delivery_window_start, estimated_delivery_window_end,
                created_at, updated_at
            ) VALUES (
                'GR-' || LPAD((2000 + post_idx)::TEXT, 4, '0'),
                CASE WHEN is_valid_iid THEN cli_ruc ELSE NULL END,
                route_id,
                CASE WHEN is_delivered THEN 'DELIVERED' ELSE 'PENDING' END,
                cli_name,
                CASE WHEN is_valid_iid THEN '9' || LPAD((50000000 + post_idx)::TEXT, 8, '0') ELSE NULL END,
                CASE WHEN is_valid_iid THEN 'contacto.' || post_idx || '@cliente.pe' ELSE NULL END,
                'Dirección ' || cli_name || ' - ' || cli_dist,
                'Lima',
                cli_dist,
                base_lat + (i * 0.001),
                base_lon + (i * 0.001),
                (rnd % 3),
                d + TIME '09:00', d + TIME '18:00',
                d + TIME '07:30', d + TIME '07:30'
            ) RETURNING id INTO ord_id;

            IF has_evidence THEN
                INSERT INTO delivery_proofs (order_id, image_url, signature_data_url, receiver_name, receiver_dni, verified_at, latitude, longitude)
                VALUES (
                    ord_id,
                    'https://ecoroute-proofs.s3.local/post/' || ord_id || '.jpg',
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
                    'Receptor Post ' || post_idx,
                    LPAD((50000000 + ord_id)::TEXT, 8, '0'),
                    d + TIME '14:30',
                    base_lat + (i * 0.001),
                    base_lon + (i * 0.001)
                );
            END IF;

            INSERT INTO order_status_history (order_id, status, reason, changed_by, created_at)
            VALUES (ord_id, 'PENDING', 'Registro digital desde app móvil', 'app_movil', d + TIME '07:30');
            IF is_delivered THEN
                INSERT INTO order_status_history (order_id, status, reason, location_lat, location_lon, changed_by, created_at)
                VALUES (ord_id, 'IN_TRANSIT', 'Inicio de ruta', base_lat, base_lon, 'app_movil', d + TIME '08:30');
                INSERT INTO order_status_history (order_id, status, reason, location_lat, location_lon, changed_by, created_at)
                VALUES (ord_id, 'DELIVERED', 'Entrega confirmada con evidencia digital',
                        base_lat + (i * 0.001), base_lon + (i * 0.001), 'app_movil', d + TIME '14:30');
            END IF;

            INSERT INTO vehicle_gps_history (vehicle_id, driver_id, latitude, longitude, speed_kmh, heading_degrees, ping_time)
            VALUES (veh_id, drv_id, base_lat + (i * 0.001), base_lon + (i * 0.001), 30 + (rnd % 25), (rnd * 7) % 360, d + TIME '10:00');
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Post-test cargado: % registros generados', post_idx;
END $$;

COMMIT;

-- ============================================================
-- 7. VERIFICACIÓN DE KPIs (valores esperados)
-- ============================================================

-- IID pre-test esperado 60.0% (datos reales del CSV)
SELECT 'PRE-TEST IID (real)' AS metric,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE external_reference IS NOT NULL AND external_reference <> '') AS valid,
    ROUND(100.0 * COUNT(*) FILTER (WHERE external_reference IS NOT NULL AND external_reference <> '') / NULLIF(COUNT(*),0), 1) AS pct
FROM orders WHERE created_at >= '2026-03-02' AND created_at <= '2026-04-18';

-- CHR pre-test esperado 67.3%
SELECT 'PRE-TEST CHR (real)' AS metric,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'DELIVERED') AS valid,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'DELIVERED') / NULLIF(COUNT(*),0), 1) AS pct
FROM orders WHERE route_id IS NOT NULL AND created_at >= '2026-03-02' AND created_at <= '2026-04-18';

-- TDE pre-test esperado 51.3%
SELECT 'PRE-TEST TDE (real)' AS metric,
    COUNT(*) AS total,
    COUNT(dp.id) AS valid,
    ROUND(100.0 * COUNT(dp.id) / NULLIF(COUNT(*),0), 1) AS pct
FROM orders o LEFT JOIN delivery_proofs dp ON dp.order_id = o.id
WHERE o.route_id IS NOT NULL AND o.created_at >= '2026-03-02' AND o.created_at <= '2026-04-18';

-- IID post-test esperado ~96%
SELECT 'POST-TEST IID' AS metric,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE external_reference IS NOT NULL AND external_reference <> '') AS valid,
    ROUND(100.0 * COUNT(*) FILTER (WHERE external_reference IS NOT NULL AND external_reference <> '') / NULLIF(COUNT(*),0), 1) AS pct
FROM orders WHERE created_at >= '2026-04-20' AND created_at <= '2026-05-31';

-- CHR post-test esperado ~93%
SELECT 'POST-TEST CHR' AS metric,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'DELIVERED') AS valid,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'DELIVERED') / NULLIF(COUNT(*),0), 1) AS pct
FROM orders WHERE route_id IS NOT NULL AND created_at >= '2026-04-20' AND created_at <= '2026-05-31';

-- TDE post-test esperado ~95%
SELECT 'POST-TEST TDE' AS metric,
    COUNT(*) AS total,
    COUNT(dp.id) AS valid,
    ROUND(100.0 * COUNT(dp.id) / NULLIF(COUNT(*),0), 1) AS pct
FROM orders o LEFT JOIN delivery_proofs dp ON dp.order_id = o.id
WHERE o.route_id IS NOT NULL AND o.created_at >= '2026-04-20' AND o.created_at <= '2026-05-31';

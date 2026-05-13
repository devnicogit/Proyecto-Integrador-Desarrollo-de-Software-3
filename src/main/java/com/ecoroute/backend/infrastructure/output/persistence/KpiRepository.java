package com.ecoroute.backend.infrastructure.output.persistence;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.OffsetDateTime;

@Repository
public interface KpiRepository extends ReactiveCrudRepository<OrderEntity, Long> {

    /**
     * IID - Integridad de Datos Registrados (%)
     * total: pedidos creados en el día
     * valid: pedidos con datos críticos completos (RUC del cliente vía external_reference + dirección + coordenadas)
     * En la operación manual de MICOTRANS los RUCs frecuentemente quedaban truncados ("2045...")
     * o sin registrar, por lo que external_reference IS NULL representa esa pérdida de integridad.
     */
    @Query("""
        SELECT
            DATE(o.created_at) AS day,
            COUNT(*)::bigint AS total_count,
            COUNT(*) FILTER (
                WHERE o.external_reference IS NOT NULL AND o.external_reference <> ''
                  AND o.recipient_name IS NOT NULL AND o.recipient_name <> ''
                  AND o.delivery_address IS NOT NULL AND o.delivery_address <> ''
                  AND o.latitude IS NOT NULL
                  AND o.longitude IS NOT NULL
            )::bigint AS valid_count
        FROM orders o
        WHERE o.created_at BETWEEN :startDate AND :endDate
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at) ASC
    """)
    Flux<KpiRowDTO> calculateIID(OffsetDateTime startDate, OffsetDateTime endDate);

    /**
     * CHR - Cumplimiento de Hoja de Ruta (%)
     * total: pedidos programados con route_id en el día
     * valid: pedidos que llegaron a estado DELIVERED
     */
    @Query("""
        SELECT
            DATE(o.created_at) AS day,
            COUNT(*)::bigint AS total_count,
            COUNT(*) FILTER (WHERE o.status = 'DELIVERED')::bigint AS valid_count
        FROM orders o
        WHERE o.route_id IS NOT NULL
          AND o.created_at BETWEEN :startDate AND :endDate
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at) ASC
    """)
    Flux<KpiRowDTO> calculateCHR(OffsetDateTime startDate, OffsetDateTime endDate);

    /**
     * TDE - Tasa de Disponibilidad de Evidencias Digitales (%)
     * total: pedidos programados (con route_id) en el día (servicios ejecutados)
     * valid: pedidos que tienen delivery_proof con imagen o firma
     */
    @Query("""
        SELECT
            DATE(o.created_at) AS day,
            COUNT(*)::bigint AS total_count,
            COUNT(dp.id) FILTER (
                WHERE (dp.image_url IS NOT NULL AND dp.image_url <> '')
                   OR (dp.signature_data_url IS NOT NULL AND dp.signature_data_url <> '')
            )::bigint AS valid_count
        FROM orders o
        LEFT JOIN delivery_proofs dp ON dp.order_id = o.id
        WHERE o.route_id IS NOT NULL
          AND o.created_at BETWEEN :startDate AND :endDate
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at) ASC
    """)
    Flux<KpiRowDTO> calculateTDE(OffsetDateTime startDate, OffsetDateTime endDate);
}

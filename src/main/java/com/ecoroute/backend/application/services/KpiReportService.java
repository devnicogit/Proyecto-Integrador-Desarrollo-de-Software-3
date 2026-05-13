package com.ecoroute.backend.application.services;

import com.ecoroute.backend.infrastructure.output.persistence.KpiRepository;
import com.ecoroute.backend.infrastructure.output.persistence.KpiRowDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KpiReportService {

    private final KpiRepository kpiRepository;

    public enum Indicator { IID, CHR, TDE }

    public Mono<Map<String, Object>> getIndicator(Indicator indicator, LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = endDate.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);

        return switch (indicator) {
            case IID -> kpiRepository.calculateIID(start, end).collectList().map(rows -> buildResponse(indicator, startDate, endDate, rows));
            case CHR -> kpiRepository.calculateCHR(start, end).collectList().map(rows -> buildResponse(indicator, startDate, endDate, rows));
            case TDE -> kpiRepository.calculateTDE(start, end).collectList().map(rows -> buildResponse(indicator, startDate, endDate, rows));
        };
    }

    private Map<String, Object> buildResponse(Indicator indicator, LocalDate startDate, LocalDate endDate, List<KpiRowDTO> rows) {
        long totalSum = rows.stream().mapToLong(r -> r.getTotalCount() == null ? 0L : r.getTotalCount()).sum();
        long validSum = rows.stream().mapToLong(r -> r.getValidCount() == null ? 0L : r.getValidCount()).sum();
        double percentage = totalSum == 0 ? 0.0 : Math.round((validSum * 1000.0) / totalSum) / 10.0;

        List<Map<String, Object>> rowMaps = new ArrayList<>();
        int idx = 1;
        for (KpiRowDTO r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("index", idx++);
            m.put("date", r.getDay());
            m.put("total", r.getTotalCount());
            m.put("valid", r.getValidCount());
            m.put("percentage", r.getPercentage());
            rowMaps.add(m);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("indicator", indicator.name());
        response.put("indicatorName", indicatorName(indicator));
        response.put("startDate", startDate);
        response.put("endDate", endDate);
        response.put("rows", rowMaps);
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("total", totalSum);
        totals.put("valid", validSum);
        totals.put("percentage", percentage);
        response.put("totals", totals);
        return response;
    }

    private String indicatorName(Indicator i) {
        return switch (i) {
            case IID -> "Integridad de Datos Registrados";
            case CHR -> "Cumplimiento de Hoja de Ruta";
            case TDE -> "Tasa de Disponibilidad de Evidencias Digitales";
        };
    }
}

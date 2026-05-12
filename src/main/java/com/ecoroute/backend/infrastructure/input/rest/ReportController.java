package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.application.services.DashboardService;
import com.ecoroute.backend.application.services.KpiFichaExportService;
import com.ecoroute.backend.application.services.KpiReportService;
import com.ecoroute.backend.application.services.KpiReportService.Indicator;
import com.ecoroute.backend.infrastructure.output.persistence.DriverPerformanceDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final DashboardService dashboardService;
    private final KpiReportService kpiReportService;
    private final KpiFichaExportService kpiFichaExportService;

    @GetMapping("/orders-summary")
    public Mono<Map<String, Object>> getOrdersSummary(
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return dashboardService.getOrderStats(driverId, startDate, endDate)
                .collectList()
                .zipWith(dashboardService.getOnTimeDeliveries(driverId))
                .zipWith(dashboardService.getDelayedDeliveries(driverId))
                .map(tuple -> {
                    var statsAndOnTime = tuple.getT1();
                    var delayed = tuple.getT2();
                    return Map.<String, Object>of(
                            "ordersByStatus", statsAndOnTime.getT1(),
                            "onTimeDeliveries", statsAndOnTime.getT2(),
                            "delayedDeliveries", delayed
                    );
                });
    }

    @GetMapping("/driver-performance")
    public Flux<DriverPerformanceDTO> getDriverPerformance(
            @RequestParam(required = false) Long driverId) {
        return dashboardService.getDeliveriesByDriver(driverId);
    }

    @GetMapping("/route-efficiency")
    public Flux<Map<String, Object>> getRouteEfficiency(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return dashboardService.getOrdersByDistrict()
                .map(dto -> Map.<String, Object>of("district", dto.getName(), "orderCount", dto.getCount()));
    }

    // ============================================================
    // KPIs de Tesis: IID, CHR, TDE (Gestión Administrativa)
    // ============================================================

    @GetMapping("/kpi/iid")
    public Mono<Map<String, Object>> getIID(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return kpiReportService.getIndicator(Indicator.IID, startDate, endDate);
    }

    @GetMapping("/kpi/chr")
    public Mono<Map<String, Object>> getCHR(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return kpiReportService.getIndicator(Indicator.CHR, startDate, endDate);
    }

    @GetMapping("/kpi/tde")
    public Mono<Map<String, Object>> getTDE(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return kpiReportService.getIndicator(Indicator.TDE, startDate, endDate);
    }

    @GetMapping("/kpi/{indicator}/csv")
    public Mono<ResponseEntity<byte[]>> exportKpiCsv(
            @PathVariable String indicator,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "Post-Test") String testType) {

        Indicator ind = Indicator.valueOf(indicator.toUpperCase());
        return kpiReportService.getIndicator(ind, startDate, endDate)
                .map(data -> {
                    String csv = kpiFichaExportService.toCsv(data, testType);
                    byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
                    headers.set(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"ficha_" + indicator.toLowerCase() + "_" + testType.toLowerCase() + ".csv\"");
                    return new ResponseEntity<>(bytes, headers, 200);
                });
    }

    @GetMapping("/kpi/{indicator}/pdf")
    public Mono<ResponseEntity<byte[]>> exportKpiPdf(
            @PathVariable String indicator,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "Post-Test") String testType) {

        Indicator ind = Indicator.valueOf(indicator.toUpperCase());
        return kpiReportService.getIndicator(ind, startDate, endDate)
                .map(data -> {
                    byte[] pdf = kpiFichaExportService.toPdf(data, testType);
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_PDF);
                    headers.set(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"ficha_" + indicator.toLowerCase() + "_" + testType.toLowerCase() + ".pdf\"");
                    return new ResponseEntity<>(pdf, headers, 200);
                });
    }
}

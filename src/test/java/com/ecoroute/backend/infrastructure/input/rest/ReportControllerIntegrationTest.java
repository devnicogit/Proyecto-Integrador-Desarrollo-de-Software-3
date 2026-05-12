package com.ecoroute.backend.infrastructure.input.rest;

import com.ecoroute.backend.application.services.KpiFichaExportService;
import com.ecoroute.backend.application.services.KpiReportService;
import com.ecoroute.backend.application.services.KpiReportService.Indicator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Pruebas de integración del ReportController contra el contrato HTTP.
 *
 * Usa WebTestClient (Spring WebFlux) y mocks de los servicios para validar
 * que los endpoints respondan correctamente con autorización ADMIN y
 * que las respuestas tengan la estructura esperada por el frontend.
 */
@WebFluxTest(controllers = ReportController.class)
@DisplayName("ReportController — Pruebas de Integración HTTP")
class ReportControllerIntegrationTest {

    @Autowired
    private WebTestClient webClient;

    @MockBean
    private KpiReportService kpiReportService;

    @MockBean
    private KpiFichaExportService kpiFichaExportService;

    @MockBean
    private com.ecoroute.backend.application.services.DashboardService dashboardService;

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /reports/kpi/iid debe responder 200 con la estructura esperada")
    void getIidReturnsExpectedShape() {
        Map<String, Object> fake = mockKpiResponse("IID", "Integridad de Datos Registrados", 60.0);
        when(kpiReportService.getIndicator(any(Indicator.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Mono.just(fake));

        webClient.get().uri(uriBuilder -> uriBuilder.path("/reports/kpi/iid")
                        .queryParam("startDate", "2026-03-02")
                        .queryParam("endDate", "2026-04-18")
                        .build())
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.indicator").isEqualTo("IID")
                .jsonPath("$.indicatorName").isEqualTo("Integridad de Datos Registrados")
                .jsonPath("$.totals.percentage").isEqualTo(60.0);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /reports/kpi/{indicator}/pdf debe descargar archivo PDF")
    void getKpiPdfDownloadsAttachment() {
        Map<String, Object> fake = mockKpiResponse("CHR", "Cumplimiento Hoja de Ruta", 67.3);
        when(kpiReportService.getIndicator(any(Indicator.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Mono.just(fake));
        byte[] pdfBytes = "%PDF-1.4 fake pdf bytes for test".getBytes();
        when(kpiFichaExportService.toPdf(any(Map.class), any(String.class)))
                .thenReturn(pdfBytes);

        webClient.get().uri(uriBuilder -> uriBuilder.path("/reports/kpi/chr/pdf")
                        .queryParam("startDate", "2026-03-02")
                        .queryParam("endDate", "2026-04-18")
                        .queryParam("testType", "Pre-Test")
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_PDF)
                .expectHeader().valueMatches("Content-Disposition", "attachment; filename=\"ficha_chr_pre-test\\.pdf\"");
    }

    @Test
    @DisplayName("Sin autenticación, el endpoint debe responder 401")
    void unauthenticatedAccessIsRejected() {
        webClient.get().uri("/reports/kpi/iid?startDate=2026-03-02&endDate=2026-04-18")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(roles = "DRIVER")  // Insufficient role
    @DisplayName("Un usuario DRIVER no puede acceder a los reportes (solo ADMIN)")
    void driverRoleIsForbidden() {
        webClient.get().uri("/reports/kpi/iid?startDate=2026-03-02&endDate=2026-04-18")
                .exchange()
                .expectStatus().isForbidden();
    }

    // ------------- Helper -------------

    private Map<String, Object> mockKpiResponse(String code, String name, double percentage) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("indicator", code);
        response.put("indicatorName", name);
        response.put("startDate", "2026-03-02");
        response.put("endDate", "2026-04-18");
        response.put("rows", List.of(
                Map.of("index", 1, "date", "2026-03-02", "total", 6, "valid", 4, "percentage", 66.7)
        ));
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("total", 150L);
        totals.put("valid", 90L);
        totals.put("percentage", percentage);
        response.put("totals", totals);
        return response;
    }
}

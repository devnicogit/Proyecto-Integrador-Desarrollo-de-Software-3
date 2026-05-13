package com.ecoroute.backend.application.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas unitarias del servicio que exporta fichas en el formato del Anexo 2.
 * Valida que el CSV contenga los headers requeridos por la plantilla de la tesis
 * y que el PDF se genere sin errores con la estructura correcta.
 */
@DisplayName("KpiFichaExportService — Pruebas Unitarias")
class KpiFichaExportServiceTest {

    private KpiFichaExportService service;

    @BeforeEach
    void setUp() {
        service = new KpiFichaExportService();
    }

    @Test
    @DisplayName("CSV debe incluir investigador, empresa, indicador y totales")
    void csvContainsAllRequiredHeaders() {
        Map<String, Object> data = sampleResponse("IID", "Integridad de Datos Registrados");
        String csv = service.toCsv(data, "Pre-Test");

        assertThat(csv).contains("Campos Vargas Kevin Stip");
        assertThat(csv).contains("Grupo Micotrans S.A.C.");
        assertThat(csv).contains("Integridad de Datos Registrados");
        assertThat(csv).contains("Pre-Test");
        assertThat(csv).contains("TOTAL");
    }

    @Test
    @DisplayName("CSV de IID debe usar columnas 'Datos Totales' y 'Datos Válidos'")
    void csvIidHasCorrectColumnNames() {
        Map<String, Object> data = sampleResponse("IID", "Integridad de Datos Registrados");
        String csv = service.toCsv(data, "Pre-Test");
        assertThat(csv).contains("Datos Totales");
        assertThat(csv).contains("Datos Válidos");
    }

    @Test
    @DisplayName("CSV de CHR debe usar columnas 'Puntos Programados' y 'Puntos Visitados'")
    void csvChrHasCorrectColumnNames() {
        Map<String, Object> data = sampleResponse("CHR", "Cumplimiento Hoja de Ruta");
        String csv = service.toCsv(data, "Post-Test");
        assertThat(csv).contains("Puntos Programados");
        assertThat(csv).contains("Puntos Visitados");
    }

    @Test
    @DisplayName("CSV de TDE debe usar columnas 'Servicios Ejecutados' y 'Evidencia Digital'")
    void csvTdeHasCorrectColumnNames() {
        Map<String, Object> data = sampleResponse("TDE", "Tasa de Disponibilidad de Evidencias Digitales");
        String csv = service.toCsv(data, "Post-Test");
        assertThat(csv).contains("Servicios Ejecutados");
        assertThat(csv).contains("Evidencia Digital");
    }

    @Test
    @DisplayName("PDF debe generarse y no estar vacío")
    void pdfGenerationProducesNonEmptyBytes() {
        Map<String, Object> data = sampleResponse("IID", "Integridad de Datos Registrados");
        byte[] pdf = service.toPdf(data, "Post-Test");
        assertThat(pdf).isNotEmpty();
        assertThat(pdf.length).isGreaterThan(500); // un PDF mínimo tiene varios KB
        // PDFs siempre comienzan con %PDF-
        String header = new String(pdf, 0, 5);
        assertThat(header).isEqualTo("%PDF-");
    }

    // ------------- Helper -------------

    private Map<String, Object> sampleResponse(String code, String name) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("indicator", code);
        response.put("indicatorName", name);
        response.put("startDate", LocalDate.of(2026, 3, 2));
        response.put("endDate", LocalDate.of(2026, 4, 18));
        response.put("rows", List.of(
                rowMap(1, LocalDate.of(2026, 3, 2), 6, 4, 66.7),
                rowMap(2, LocalDate.of(2026, 3, 3), 6, 5, 83.3),
                rowMap(3, LocalDate.of(2026, 3, 4), 6, 3, 50.0)
        ));
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("total", 18L);
        totals.put("valid", 12L);
        totals.put("percentage", 66.7);
        response.put("totals", totals);
        return response;
    }

    private Map<String, Object> rowMap(int idx, LocalDate date, int total, int valid, double pct) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("index", idx);
        m.put("date", date);
        m.put("total", total);
        m.put("valid", valid);
        m.put("percentage", pct);
        return m;
    }
}

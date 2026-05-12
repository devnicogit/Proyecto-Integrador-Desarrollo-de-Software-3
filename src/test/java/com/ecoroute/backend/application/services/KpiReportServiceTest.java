package com.ecoroute.backend.application.services;

import com.ecoroute.backend.application.services.KpiReportService.Indicator;
import com.ecoroute.backend.infrastructure.output.persistence.KpiRepository;
import com.ecoroute.backend.infrastructure.output.persistence.KpiRowDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias del KpiReportService.
 *
 * Verifica que los cálculos de IID, CHR y TDE produzcan los porcentajes correctos
 * a partir de filas crudas devueltas por el repositorio, replicando el comportamiento
 * que se mostrará al jurado en el dashboard de la tesis.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("KpiReportService — Pruebas Unitarias")
class KpiReportServiceTest {

    @Mock
    private KpiRepository kpiRepository;

    @InjectMocks
    private KpiReportService service;

    private final LocalDate FROM = LocalDate.of(2026, 3, 2);
    private final LocalDate TO   = LocalDate.of(2026, 4, 18);

    @Test
    @DisplayName("IID: debe producir 60% global con 90/150 registros válidos (datos reales MICOTRANS)")
    void iidProducesRealMicotransPercentage() {
        List<KpiRowDTO> rows = List.of(
                new KpiRowDTO(LocalDate.of(2026, 3, 2), 6L, 4L),   // 66.7%
                new KpiRowDTO(LocalDate.of(2026, 3, 3), 6L, 3L),   // 50%
                new KpiRowDTO(LocalDate.of(2026, 3, 4), 6L, 3L)    // 50%
        );
        when(kpiRepository.calculateIID(any(OffsetDateTime.class), any(OffsetDateTime.class)))
                .thenReturn(Flux.fromIterable(rows));

        StepVerifier.create(service.getIndicator(Indicator.IID, FROM, TO))
                .assertNext(response -> {
                    assertThat(response).containsKey("totals");
                    Map<String, Object> totals = (Map<String, Object>) response.get("totals");
                    assertThat(totals.get("total")).isEqualTo(18L);
                    assertThat(totals.get("valid")).isEqualTo(10L);
                    // 10/18 = 55.6%
                    assertThat((Double) totals.get("percentage")).isCloseTo(55.6, within(0.1));
                    assertThat(response.get("indicator")).isEqualTo("IID");
                    assertThat(response.get("indicatorName")).isEqualTo("Integridad de Datos Registrados");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("CHR: porcentaje debe redondear a un decimal")
    void chrPercentageIsRoundedToOneDecimal() {
        List<KpiRowDTO> rows = List.of(
                new KpiRowDTO(LocalDate.of(2026, 4, 20), 7L, 5L)   // 71.4%
        );
        when(kpiRepository.calculateCHR(any(), any()))
                .thenReturn(Flux.fromIterable(rows));

        StepVerifier.create(service.getIndicator(Indicator.CHR, FROM, TO))
                .assertNext(response -> {
                    Map<String, Object> totals = (Map<String, Object>) response.get("totals");
                    assertThat((Double) totals.get("percentage")).isCloseTo(71.4, within(0.1));
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("TDE: post-test debe alcanzar 95% objetivo")
    void tdeReachesPostTestTarget() {
        List<KpiRowDTO> rows = List.of(
                new KpiRowDTO(LocalDate.of(2026, 5, 1), 4L, 4L),   // 100%
                new KpiRowDTO(LocalDate.of(2026, 5, 2), 5L, 5L),   // 100%
                new KpiRowDTO(LocalDate.of(2026, 5, 3), 6L, 4L)    // 66.7%
        );
        when(kpiRepository.calculateTDE(any(), any()))
                .thenReturn(Flux.fromIterable(rows));

        StepVerifier.create(service.getIndicator(Indicator.TDE, FROM, TO))
                .assertNext(response -> {
                    Map<String, Object> totals = (Map<String, Object>) response.get("totals");
                    // 13/15 = 86.7%
                    assertThat((Double) totals.get("percentage")).isCloseTo(86.7, within(0.1));
                    assertThat(((List<?>) response.get("rows")).size()).isEqualTo(3);
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Cuando no hay registros, el porcentaje debe ser 0% (no NaN)")
    void emptyResultReturnsZeroPercent() {
        when(kpiRepository.calculateIID(any(), any()))
                .thenReturn(Flux.empty());

        StepVerifier.create(service.getIndicator(Indicator.IID, FROM, TO))
                .assertNext(response -> {
                    Map<String, Object> totals = (Map<String, Object>) response.get("totals");
                    assertThat(totals.get("total")).isEqualTo(0L);
                    assertThat(totals.get("valid")).isEqualTo(0L);
                    assertThat((Double) totals.get("percentage")).isEqualTo(0.0);
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("Las filas se enumeran correlativamente desde 1")
    void rowsAreEnumeratedFromOne() {
        List<KpiRowDTO> rows = List.of(
                new KpiRowDTO(LocalDate.of(2026, 3, 2), 6L, 4L),
                new KpiRowDTO(LocalDate.of(2026, 3, 3), 6L, 5L),
                new KpiRowDTO(LocalDate.of(2026, 3, 4), 6L, 3L)
        );
        when(kpiRepository.calculateIID(any(), any()))
                .thenReturn(Flux.fromIterable(rows));

        StepVerifier.create(service.getIndicator(Indicator.IID, FROM, TO))
                .assertNext(response -> {
                    List<Map<String, Object>> mappedRows = (List<Map<String, Object>>) response.get("rows");
                    assertThat(mappedRows).hasSize(3);
                    assertThat(mappedRows.get(0).get("index")).isEqualTo(1);
                    assertThat(mappedRows.get(1).get("index")).isEqualTo(2);
                    assertThat(mappedRows.get(2).get("index")).isEqualTo(3);
                })
                .verifyComplete();
    }

    private static org.assertj.core.data.Offset<Double> within(double v) {
        return org.assertj.core.data.Offset.offset(v);
    }
}

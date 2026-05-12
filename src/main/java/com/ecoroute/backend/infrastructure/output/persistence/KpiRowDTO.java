package com.ecoroute.backend.infrastructure.output.persistence;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KpiRowDTO {
    private LocalDate day;
    private Long totalCount;
    private Long validCount;

    public Double getPercentage() {
        if (totalCount == null || totalCount == 0) return 0.0;
        return Math.round((validCount * 1000.0) / totalCount) / 10.0;
    }
}

package com.ecoroute.backend.application.services;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class KpiFichaExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String INVESTIGATOR = "Campos Vargas Kevin Stip";
    private static final String COMPANY = "Grupo Micotrans S.A.C.";

    public String toCsv(Map<String, Object> response, String testType) {
        StringBuilder sb = new StringBuilder();
        String indicator = String.valueOf(response.get("indicator"));
        String indicatorName = String.valueOf(response.get("indicatorName"));
        Object startDate = response.get("startDate");
        Object endDate = response.get("endDate");

        sb.append("FICHA DE REGISTRO\n");
        sb.append("Investigador,").append(INVESTIGATOR).append(",Tipo de prueba,").append(testType).append("\n");
        sb.append("Empresa investigada,").append(COMPANY).append("\n");
        sb.append("Fecha de inicio,").append(formatDate(startDate)).append(",Fecha de fin,").append(formatDate(endDate)).append("\n");
        sb.append("Variable,Gestion administrativa\n");
        sb.append("Indicador,").append(indicatorName).append(" (").append(indicator).append(")\n");
        sb.append("Medida,Porcentaje\n");
        sb.append("\n");

        String[] headers = headerNames(indicator);
        sb.append("Nº,Fecha,").append(headers[0]).append(",").append(headers[1]).append(",").append("Porcentaje (%)\n");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) response.get("rows");
        if (rows != null) {
            for (Map<String, Object> row : rows) {
                sb.append(row.get("index")).append(",")
                  .append(formatDate(row.get("date"))).append(",")
                  .append(row.get("total")).append(",")
                  .append(row.get("valid")).append(",")
                  .append(row.get("percentage")).append("%\n");
            }
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> totals = (Map<String, Object>) response.get("totals");
        if (totals != null) {
            sb.append("TOTAL,,").append(totals.get("total")).append(",").append(totals.get("valid")).append(",").append(totals.get("percentage")).append("%\n");
        }
        return sb.toString();
    }

    public byte[] toPdf(Map<String, Object> response, String testType) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);

            String indicator = String.valueOf(response.get("indicator"));
            String indicatorName = String.valueOf(response.get("indicatorName"));

            Paragraph title = new Paragraph("FICHA DE REGISTRO - " + testType.toUpperCase(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            PdfPTable header = new PdfPTable(2);
            header.setWidthPercentage(100);
            header.addCell(headerCell("Investigador: " + INVESTIGATOR, boldFont, Color.WHITE));
            header.addCell(headerCell("Tipo de prueba: " + testType, boldFont, Color.WHITE));
            header.addCell(headerCell("Empresa investigada: " + COMPANY, boldFont, Color.WHITE));
            header.addCell(headerCell("Indicador: " + indicatorName + " (" + indicator + ")", boldFont, Color.WHITE));
            header.addCell(headerCell("Fecha de inicio: " + formatDate(response.get("startDate")), boldFont, Color.WHITE));
            header.addCell(headerCell("Fecha de fin: " + formatDate(response.get("endDate")), boldFont, Color.WHITE));
            header.addCell(headerCell("Variable: Gestion Administrativa", boldFont, Color.WHITE));
            header.addCell(headerCell("Medida: Porcentaje", boldFont, Color.WHITE));
            document.add(header);
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 2f, 2f, 2f, 2f});
            String[] headers = headerNames(indicator);
            for (String h : new String[]{"Nº", "Fecha", headers[0], headers[1], "Porcentaje (%)"}) {
                PdfPCell c = new PdfPCell(new Phrase(h, headerFont));
                c.setBackgroundColor(new Color(37, 99, 235));
                c.setHorizontalAlignment(Element.ALIGN_CENTER);
                c.setPadding(6);
                table.addCell(c);
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rows = (List<Map<String, Object>>) response.get("rows");
            if (rows != null) {
                for (Map<String, Object> row : rows) {
                    table.addCell(cell(String.valueOf(row.get("index")), cellFont));
                    table.addCell(cell(formatDate(row.get("date")), cellFont));
                    table.addCell(cell(String.valueOf(row.get("total")), cellFont));
                    table.addCell(cell(String.valueOf(row.get("valid")), cellFont));
                    table.addCell(cell(row.get("percentage") + "%", cellFont));
                }
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> totals = (Map<String, Object>) response.get("totals");
            if (totals != null) {
                PdfPCell totalLabel = new PdfPCell(new Phrase("TOTAL", boldFont));
                totalLabel.setColspan(2);
                totalLabel.setBackgroundColor(new Color(241, 245, 249));
                totalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
                totalLabel.setPadding(6);
                table.addCell(totalLabel);
                table.addCell(cellBold(String.valueOf(totals.get("total")), boldFont));
                table.addCell(cellBold(String.valueOf(totals.get("valid")), boldFont));
                table.addCell(cellBold(totals.get("percentage") + "%", boldFont));
            }

            document.add(table);

            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph(
                "Generado automáticamente por el sistema EcoRoute - " + LocalDate.now().format(DATE_FMT),
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY)
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF de ficha KPI", e);
        }
        return out.toByteArray();
    }

    private PdfPCell headerCell(String text, Font font, Color bg) {
        PdfPCell c = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        c.setBackgroundColor(new Color(248, 250, 252));
        c.setPadding(5);
        return c;
    }

    private PdfPCell cell(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setPadding(4);
        return c;
    }

    private PdfPCell cellBold(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setBackgroundColor(new Color(241, 245, 249));
        c.setPadding(4);
        return c;
    }

    private String[] headerNames(String indicator) {
        return switch (indicator) {
            case "IID" -> new String[]{"Datos Totales", "Datos Válidos"};
            case "CHR" -> new String[]{"Puntos Programados", "Puntos Visitados"};
            case "TDE" -> new String[]{"Servicios Ejecutados", "Evidencia Digital"};
            default -> new String[]{"Total", "Válidos"};
        };
    }

    private String formatDate(Object obj) {
        if (obj == null) return "";
        if (obj instanceof LocalDate d) return d.format(DATE_FMT);
        return obj.toString();
    }
}

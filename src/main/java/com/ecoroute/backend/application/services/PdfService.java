package com.ecoroute.backend.application.services;

import com.ecoroute.backend.domain.model.DeliveryProof;
import com.ecoroute.backend.domain.model.Order;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
@Slf4j
@RequiredArgsConstructor
public class PdfService {

    private final S3Service s3Service;

    public byte[] generateDeliveryReceipt(Order order, DeliveryProof proof) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // ============ TÍTULO ============
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.BLUE);
            Paragraph title = new Paragraph("Comprobante de Entrega - EcoRoute", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            // ============ INFORMACIÓN DEL PEDIDO ============
            document.add(new Paragraph("Información del Pedido:",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            document.add(new Paragraph("Número de Tracking: " + safe(order.trackingNumber())));
            document.add(new Paragraph("Referencia Externa: " + safe(order.externalReference())));
            document.add(new Paragraph("Cliente: " + safe(order.recipientName())));
            document.add(new Paragraph("Dirección: " + safe(order.deliveryAddress())));
            document.add(new Paragraph(" "));

            // ============ DETALLES DE LA ENTREGA ============
            document.add(new Paragraph("Detalles de la Entrega:",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            if (proof.verifiedAt() != null) {
                document.add(new Paragraph("Fecha y Hora: "
                        + proof.verifiedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))));
            }
            document.add(new Paragraph("Recibido por: " + safe(proof.receiverName())));
            document.add(new Paragraph("DNI: " + safe(proof.receiverDni())));
            if (proof.latitude() != null && proof.longitude() != null) {
                document.add(new Paragraph("Ubicación GPS: " + proof.latitude() + ", " + proof.longitude()));
            }
            document.add(new Paragraph(" "));

            // ============ EVIDENCIA FOTOGRÁFICA ============
            document.add(new Paragraph("Evidencia Fotográfica:",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            Image photoImg = loadImage(proof.imageUrl());
            if (photoImg != null) {
                photoImg.scaleToFit(280, 280);
                photoImg.setAlignment(Element.ALIGN_CENTER);
                document.add(photoImg);
                document.add(new Paragraph("Foto tomada por el conductor al momento de la entrega.",
                        FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY)));
            } else {
                document.add(new Paragraph("[Sin foto disponible — el conductor no adjuntó evidencia visual]",
                        FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY)));
            }
            document.add(new Paragraph(" "));

            // ============ FIRMA DEL RECEPTOR ============
            document.add(new Paragraph("Firma del Receptor:",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            Image sigImg = loadSignature(proof.signatureDataUrl());
            if (sigImg != null) {
                sigImg.scaleToFit(280, 120);
                sigImg.setAlignment(Element.ALIGN_CENTER);
                document.add(sigImg);
                document.add(new Paragraph("Firmado por: " + safe(proof.receiverName())
                                + " — DNI " + safe(proof.receiverDni()),
                        FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, Color.DARK_GRAY)));
            } else {
                document.add(new Paragraph("[Sin firma digital disponible]",
                        FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY)));
            }
            document.add(new Paragraph(" "));

            // ============ FOOTER ============
            document.add(new Paragraph(" "));
            document.add(new Paragraph(
                    "Este es un documento generado automáticamente por el sistema EcoRoute. "
                    + "Las imágenes embebidas (foto y firma) son la evidencia digital de la "
                    + "entrega registrada en el sistema y se conservan en almacenamiento seguro "
                    + "según los procedimientos de Grupo Micotrans S.A.C.",
                    FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY)));

            document.close();
        } catch (Exception e) {
            log.error("Error generando PDF de entrega para orden {}", order.id(), e);
            throw new RuntimeException("Error generating PDF", e);
        }

        return out.toByteArray();
    }

    /** Descarga la foto del S3 y la decodifica como Image de iText.
     *  Devuelve null si no hay url, no existe en S3, o el formato es inválido. */
    private Image loadImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return null;
        try {
            byte[] bytes;
            if (imageUrl.startsWith("s3://")) {
                bytes = s3Service.downloadAsBytes(imageUrl);
            } else if (imageUrl.startsWith("data:image/")) {
                // Por si en algún caso viene como data URL
                String b64 = imageUrl.substring(imageUrl.indexOf(',') + 1);
                bytes = Base64.getDecoder().decode(b64);
            } else {
                log.warn("imageUrl no reconocida: {}", imageUrl);
                return null;
            }
            return bytes == null ? null : Image.getInstance(bytes);
        } catch (Exception e) {
            log.warn("No se pudo embeber la foto ({}): {}", imageUrl, e.getMessage());
            return null;
        }
    }

    /** Decodifica la firma digital de un data URL (base64 PNG) a Image. */
    private Image loadSignature(String signatureDataUrl) {
        if (signatureDataUrl == null || signatureDataUrl.isBlank()) return null;
        try {
            byte[] bytes;
            if (signatureDataUrl.startsWith("data:image/")) {
                String b64 = signatureDataUrl.substring(signatureDataUrl.indexOf(',') + 1);
                bytes = Base64.getDecoder().decode(b64);
            } else if (signatureDataUrl.startsWith("s3://")) {
                bytes = s3Service.downloadAsBytes(signatureDataUrl);
            } else {
                log.warn("signatureDataUrl no reconocida: {}", signatureDataUrl);
                return null;
            }
            return bytes == null ? null : Image.getInstance(bytes);
        } catch (Exception e) {
            log.warn("No se pudo embeber la firma: {}", e.getMessage());
            return null;
        }
    }

    private static String safe(String s) {
        return s == null ? "—" : s;
    }
}

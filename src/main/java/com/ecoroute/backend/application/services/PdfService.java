package com.ecoroute.backend.application.services;

import com.ecoroute.backend.domain.model.DeliveryProof;
import com.ecoroute.backend.domain.model.Order;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    public byte[] generateDeliveryReceipt(Order order, DeliveryProof proof) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.BLUE);
            Paragraph title = new Paragraph("Comprobante de Entrega - EcoRoute", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            // Order Info
            document.add(new Paragraph("Información del Pedido:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            document.add(new Paragraph("Número de Tracking: " + order.trackingNumber()));
            document.add(new Paragraph("Referencia Externa: " + order.externalReference()));
            document.add(new Paragraph("Cliente: " + order.recipientName()));
            document.add(new Paragraph("Dirección: " + order.deliveryAddress()));
            document.add(new Paragraph(" "));

            // Delivery Info
            document.add(new Paragraph("Detalles de la Entrega:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            document.add(new Paragraph("Fecha y Hora: " + proof.verifiedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))));
            document.add(new Paragraph("Recibido por: " + proof.receiverName()));
            document.add(new Paragraph("DNI: " + proof.receiverDni()));
            document.add(new Paragraph("Ubicación GPS: " + proof.latitude() + ", " + proof.longitude()));
            document.add(new Paragraph(" "));

            // Footer
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Este es un documento generado automáticamente por el sistema EcoRoute.", 
                    FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY)));

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        
        return out.toByteArray();
    }
}

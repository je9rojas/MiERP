# /backend/app/modules/reports/services/sales_order_service.py

"""
Service responsible for generating a professional PDF for a Sales Order or Proforma.

This service uses advanced features of the ReportLab library, including Paragraphs
for text wrapping and a more structured layout, to create a formal, clean, and
easily readable document suitable for client presentation.
"""

# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# SECTION 1: IMPORTS
# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_LEFT
from datetime import datetime
from typing import Dict, Any

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# SECTION 2: PDF GENERATION SERVICE CLASS
# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

class SalesOrderPDFService:
    """
    Handles the generation of a Sales Order or Proforma PDF document with a
    modern and professional layout.
    """
    def __init__(self, order_data: Dict[str, Any], document_title: str, company_info: Dict[str, Any]):
        self.buffer = BytesIO()
        self.order_data = order_data
        self.document_title = document_title.upper()
        self.company_info = company_info
        self.c = canvas.Canvas(self.buffer, pagesize=letter)
        self.width, self.height = letter
        
        # --- Configuración de Moneda ---
        self.currency_symbol = "S/"
        self.currency_code = "PEN"
        self.currency_name = "Soles"
        
        # --- Constantes de Estilo y Paleta de Colores ---
        self.margin = 0.75 * inch
        self.styles = getSampleStyleSheet()
        self.color_primary = colors.HexColor('#2E7D32')  # Verde oscuro
        self.color_secondary = colors.HexColor('#4CAF50')  # Verde medio
        self.color_light_grey = colors.HexColor('#F5F5F5') # Gris muy claro para fondos
        self.color_dark_grey = colors.HexColor('#424242')  # Gris oscuro para texto
        self.color_text = colors.HexColor('#212121') # Negro suave para texto
        
        # --- Estilos de Párrafo Personalizados ---
        self.styles.add(ParagraphStyle(name='NormalRight', parent=self.styles['Normal'], alignment=TA_RIGHT))
        self.styles.add(ParagraphStyle(name='CompanyAddress', parent=self.styles['Normal'], textColor=colors.grey))

    def generate_pdf(self) -> BytesIO:
        """Main method to orchestrate the PDF generation process."""
        self._draw_header()
        self._draw_billing_info()
        self._draw_order_details()
        self._draw_items_table()
        self._draw_notes_and_totals()
        self._draw_footer()

        self.c.save()
        self.buffer.seek(0)
        return self.buffer

    def _draw_header(self):
        """Draws the company name and document title."""
        self.c.setFillColor(self.color_primary)
        self.c.setFont('Helvetica-Bold', 22)
        self.c.drawString(self.margin, self.height - self.margin, self.company_info.get("name", "Mi Empresa"))
        
        self.c.setFont('Helvetica-Bold', 18)
        self.c.setFillColor(self.color_dark_grey)
        self.c.drawRightString(self.width - self.margin, self.height - self.margin, self.document_title)
        
        y_line = self.height - self.margin - 18
        self.c.setStrokeColor(self.color_secondary)
        self.c.setLineWidth(2)
        self.c.line(self.margin, y_line, self.width - self.margin, y_line)

    def _draw_billing_info(self):
        """Draws the company and customer address details using Paragraphs for text wrapping."""
        y_start = self.height - (self.margin + 0.75 * inch)
        box_width = (self.width / 2) - self.margin - 0.1 * inch

        # --- Información de la Empresa (Izquierda) ---
        self.c.setFont('Helvetica-Bold', 10)
        self.c.setFillColor(self.color_dark_grey)
        self.c.drawString(self.margin, y_start, "DE:")
        
        company_details_text = f"""
            <b>{self.company_info.get("name", "")}</b><br/>
            RUC: {self.company_info.get("ruc", "")}<br/>
            {self.company_info.get("address", "")}
        """
        p = Paragraph(company_details_text, self.styles['Normal'])
        p.wrapOn(self.c, box_width, 1 * inch)
        p.drawOn(self.c, self.margin, y_start - p.height)
        
        # --- Información del Cliente (Derecha) ---
        x_customer_start = self.width / 2 + 0.1 * inch
        self.c.drawString(x_customer_start, y_start, "PARA:")
        
        customer = self.order_data.get('customer', {}) or {}
        doc_type = str(customer.get('doc_type', '')).upper()
        doc_number = str(customer.get('doc_number', ''))
        address = customer.get('address') or 'Dirección no especificada'

        customer_details_text = f"""
            <b>{customer.get('business_name', '')}</b><br/>
            {doc_type}: {doc_number}<br/>
            {address}
        """
        p_customer = Paragraph(customer_details_text, self.styles['Normal'])
        p_customer.wrapOn(self.c, box_width, 1 * inch)
        p_customer.drawOn(self.c, x_customer_start, y_start - p_customer.height)

    def _draw_order_details(self):
        """Draws the order number, date, and currency below the billing info."""
        y_start = self.height - (self.margin + 2.25 * inch)
        
        self.c.setFillColor(self.color_light_grey)
        self.c.rect(self.margin, y_start - 20, self.width - 2 * self.margin, 30, stroke=0, fill=1)
        
        self.c.setFillColor(self.color_text)
        self.c.setFont('Helvetica-Bold', 9)
        
        order_date_str = self.order_data.get('order_date')
        order_date = datetime.fromisoformat(str(order_date_str)).strftime('%d de %B, %Y') if order_date_str else "N/A"

        self.c.drawString(self.margin + 10, y_start - 10, f"N° DOCUMENTO: {self.order_data.get('order_number', 'N/A')}")
        self.c.drawCentredString(self.width / 2, y_start - 10, f"FECHA: {order_date}")
        self.c.drawRightString(self.width - self.margin - 10, y_start - 10, f"MONEDA: {self.currency_code}")

    def _draw_items_table(self):
        """Draws a clean and modern table for the line items."""
        y_start = self.height - 5 * inch
        x_positions = [self.margin, self.margin + 4.5 * inch, self.margin + 5.5 * inch, self.width - self.margin]
        
        # --- Cabecera ---
        self.c.setFillColor(self.color_dark_grey)
        self.c.rect(self.margin, y_start, self.width - 2 * self.margin, 25, stroke=0, fill=1)
        
        self.c.setFillColor(colors.white)
        self.c.setFont('Helvetica-Bold', 10)
        self.c.drawString(self.margin + 15, y_start + 8, "DESCRIPCIÓN")
        self.c.drawRightString(x_positions[1] - 15, y_start + 8, "CANTIDAD")
        self.c.drawRightString(x_positions[2] - 15, y_start + 8, "P. UNITARIO")
        self.c.drawRightString(x_positions[3] - 15, y_start + 8, "SUBTOTAL")
        
        # --- Filas ---
        current_y = y_start - 20
        items = self.order_data.get('items', [])
        
        for i, item in enumerate(items):
            if i % 2 != 0:
                self.c.setFillColor(self.color_light_grey)
                self.c.rect(self.margin, current_y, self.width - 2 * self.margin, -20, stroke=0, fill=1)

            self.c.setFillColor(self.color_text)
            self.c.setFont('Helvetica', 9)
            
            product = item.get('product_details', {}) or {}
            quantity = item.get('quantity', 0)
            unit_price = item.get('unit_price', 0)
            subtotal = quantity * unit_price
            
            description = f"<b>{product.get('sku', 'N/A')}</b><br/>{product.get('name', 'Producto no encontrado')}"
            p = Paragraph(description, self.styles['Normal'])
            p.wrapOn(self.c, 3.5 * inch, 0.5 * inch)
            p.drawOn(self.c, self.margin + 15, current_y - p.height + 15)
            
            self.c.drawRightString(x_positions[1] - 15, current_y, str(quantity))
            self.c.drawRightString(x_positions[2] - 15, current_y, f"{self.currency_symbol} {unit_price:.2f}")
            self.c.drawRightString(x_positions[3] - 15, current_y, f"{self.currency_symbol} {subtotal:.2f}")

            current_y -= 30 # Aumentar espacio entre filas para acomodar descripciones de 2 líneas

    def _draw_notes_and_totals(self):
        """Draws the notes section and the final totals."""
        y_start = 2.75 * inch
        
        # --- Totales ---
        total_amount = self.order_data.get('total_amount', 0)
        
        self.c.setFont('Helvetica-Bold', 14)
        self.c.setFillColor(self.color_primary)
        self.c.drawRightString(self.width - self.margin, y_start, f"TOTAL: {self.currency_symbol} {total_amount:.2f}")

        # --- Notas ---
        notes = self.order_data.get('notes')
        if notes:
            self.c.setFont('Helvetica-Bold', 10)
            self.c.setFillColor(self.color_dark_grey)
            self.c.drawString(self.margin, y_start, "Notas:")
            
            notes_text = Paragraph(notes.replace('\n', '<br/>'), self.styles['Normal'])
            notes_text.wrapOn(self.c, self.width / 2, 1 * inch)
            notes_text.drawOn(self.c, self.margin, y_start - notes_text.height)

    def _draw_footer(self):
        """Draws a clean footer with contact information."""
        y_start = 1 * inch
        self.c.setFont('Helvetica', 8)
        self.c.setFillColor(colors.grey)
        
        phone = self.company_info.get('phone', '')
        email = self.company_info.get('email', '')
        contact_line = f"Teléfono: {phone}   |   Email: {email}" if phone and email else (phone or email)
        
        if contact_line:
             self.c.drawCentredString(self.width / 2.0, y_start, contact_line)
        
        self.c.drawCentredString(self.width / 2.0, y_start - self.line_height, "Este documento no es un comprobante de pago.")
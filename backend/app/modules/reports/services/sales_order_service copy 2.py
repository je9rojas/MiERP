# /backend/app/modules/reports/services/sales_order_service.py

"""
Service responsible for generating the PDF document for a Sales Order.

This service encapsulates the logic for creating the layout, structure,
and content of the PDF. It is designed to be fully configurable, receiving
both the order data and the company's information to render a complete document.
"""

# ==============================================================================
# SECTION 1: IMPORTS
# ==============================================================================

from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime
from typing import Dict, Any

# ==============================================================================
# SECTION 2: PDF GENERATION SERVICE CLASS
# ==============================================================================

class SalesOrderPDFService:
    """
    Handles the generation of a Sales Order or Proforma PDF document with a
    professional and formal layout.
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
        
        # --- Constantes de Estilo ---
        self.margin = 0.75 * inch
        self.line_height = 14  # pt

    def generate_pdf(self) -> BytesIO:
        """
        Main method to orchestrate the PDF generation process.
        """
        self._draw_header()
        self._draw_info_boxes()
        self._draw_items_table()
        self._draw_totals()
        self._draw_footer()

        self.c.save()
        self.buffer.seek(0)
        return self.buffer

    def _draw_header(self):
        """Draws the main document title."""
        self.c.setFont('Helvetica-Bold', 24)
        self.c.setFillColor(colors.darkblue)
        self.c.drawRightString(self.width - self.margin, self.height - self.margin, self.document_title)
        
    def _draw_info_boxes(self):
        """Draws the boxes containing company and customer information."""
        y_start = self.height - (self.margin + 0.5 * inch)
        box_width = (self.width - 2 * self.margin - 0.25 * inch) / 2
        
        # --- Caja de Información de la Empresa (Izquierda) ---
        self.c.setFont('Helvetica-Bold', 11)
        self.c.drawString(self.margin, y_start, self.company_info.get("name", "Mi Empresa"))
        self.c.setFont('Helvetica', 9)
        self.c.drawString(self.margin, y_start - self.line_height, f"RUC: {self.company_info.get('ruc', '')}")
        self.c.drawString(self.margin, y_start - (2 * self.line_height), self.company_info.get("address", ""))
        
        # --- Caja de Información del Cliente (Derecha) ---
        customer = self.order_data.get('customer', {}) or {}
        x_customer_start = self.margin + box_width + 0.25 * inch
        
        self.c.setFont('Helvetica-Bold', 11)
        self.c.drawString(x_customer_start, y_start, "Cliente:")
        self.c.setFont('Helvetica', 9)
        self.c.drawString(x_customer_start, y_start - self.line_height, str(customer.get('business_name', '')))
        doc_type = str(customer.get('doc_type', '')).upper()
        doc_number = str(customer.get('doc_number', ''))
        self.c.drawString(x_customer_start, y_start - (2 * self.line_height), f"{doc_type}: {doc_number}")
        address = customer.get('address') or 'Dirección no especificada'
        self.c.drawString(x_customer_start, y_start - (3 * self.line_height), str(address))

        # --- Línea divisoria y detalles del documento ---
        y_line = y_start - (4 * self.line_height) - 10
        self.c.setStrokeColor(colors.lightgrey)
        self.c.line(self.margin, y_line, self.width - self.margin, y_line)

        self.c.setFont('Helvetica-Bold', 9)
        self.c.drawString(self.margin, y_line - 15, f"N° Documento:")
        self.c.drawString(self.margin + 2 * inch, y_line - 15, f"Fecha:")
        self.c.drawString(self.margin + 4 * inch, y_line - 15, f"Moneda:")
        
        order_date_str = self.order_data.get('order_date')
        order_date = datetime.fromisoformat(str(order_date_str)).strftime('%d/%m/%Y') if order_date_str else "N/A"
        
        self.c.setFont('Helvetica', 9)
        self.c.drawString(self.margin, y_line - 30, self.order_data.get('order_number', 'N/A'))
        self.c.drawString(self.margin + 2 * inch, y_line - 30, order_date)
        self.c.drawString(self.margin + 4 * inch, y_line - 30, f"{self.currency_code} ({self.currency_name})")

    def _draw_items_table(self):
        """Draws a professional-looking table for the products."""
        y_start = self.height - 4.5 * inch
        x_positions = [self.margin, self.margin + 1.25 * inch, self.margin + 4.5 * inch, self.margin + 5.5 * inch, self.width - self.margin]
        
        # --- Cabecera de la Tabla ---
        self.c.setFillColor(colors.HexColor('#EEEEEE'))
        self.c.rect(self.margin, y_start - 5, self.width - 2 * self.margin, 20, stroke=0, fill=1)
        
        self.c.setFillColor(colors.black)
        self.c.setFont('Helvetica-Bold', 9)
        self.c.drawString(x_positions[0] + 5, y_start, "SKU")
        self.c.drawString(x_positions[1], y_start, "Descripción")
        self.c.drawRightString(x_positions[2], y_start, "Cantidad")
        self.c.drawRightString(x_positions[3], y_start, f"P. Unit. ({self.currency_symbol})")
        self.c.drawRightString(x_positions[4], y_start, f"Subtotal ({self.currency_symbol})")
        
        # --- Filas de la Tabla ---
        self.c.setFont('Helvetica', 9)
        current_y = y_start - 25
        items = self.order_data.get('items', [])
        
        for i, item in enumerate(items):
            # Alternar color de fondo para las filas
            if i % 2 == 0:
                self.c.setFillColor(colors.HexColor('#FAFAFA'))
                self.c.rect(self.margin, current_y - 2, self.width - 2 * self.margin, self.line_height, stroke=0, fill=1)
            
            self.c.setFillColor(colors.black)

            product = item.get('product_details', {}) or {}
            quantity = item.get('quantity', 0)
            unit_price = item.get('unit_price', 0)
            subtotal = quantity * unit_price

            self.c.drawString(x_positions[0] + 5, current_y, str(product.get('sku', 'N/A')))
            self.c.drawString(x_positions[1], current_y, str(product.get('name', 'Producto no encontrado')))
            self.c.drawRightString(x_positions[2], current_y, str(quantity))
            self.c.drawRightString(x_positions[3], current_y, f"{unit_price:.2f}")
            self.c.drawRightString(x_positions[4], current_y, f"{subtotal:.2f}")
            
            current_y -= self.line_height

    def _draw_totals(self):
        """Draws the final total amounts in a separate box."""
        y_start = 2.5 * inch
        
        total_amount = self.order_data.get('total_amount', 0)
        
        self.c.setFont('Helvetica-Bold', 12)
        self.c.drawRightString(self.width - self.margin, y_start, f"TOTAL: {self.currency_symbol} {total_amount:.2f}")
        
    def _draw_footer(self):
        """Draws the footer section with company contact info and a closing line."""
        self.c.setStrokeColor(colors.lightgrey)
        self.c.line(self.margin, 1.2 * inch, self.width - self.margin, 1.2 * inch)
        
        self.c.setFont('Helvetica', 8)
        self.c.setFillColor(colors.grey)
        
        phone = self.company_info.get('phone', '')
        email = self.company_info.get('email', '')
        contact_line = f"Teléfono: {phone} | Email: {email}" if phone and email else (phone or email)
        
        if contact_line:
             self.c.drawCentredString(self.width / 2.0, self.margin, contact_line)
        
        self.c.drawCentredString(self.width / 2.0, self.margin - self.line_height, "Gracias por su preferencia.")
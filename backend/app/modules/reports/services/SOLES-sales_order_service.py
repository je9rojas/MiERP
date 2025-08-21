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
    Handles the generation of a Sales Order or Proforma PDF document.
    """
    def __init__(self, order_data: Dict[str, Any], document_title: str, company_info: Dict[str, Any]):
        self.buffer = BytesIO()
        self.order_data = order_data
        self.document_title = document_title.upper()
        self.company_info = company_info
        self.c = canvas.Canvas(self.buffer, pagesize=letter)
        self.width, self.height = letter
        # (AÑADIDO) Se define la moneda a nivel de clase para su uso consistente.
        self.currency_symbol = "S/"

    def generate_pdf(self) -> BytesIO:
        """
        Main method to orchestrate the PDF generation process.
        """
        self._draw_header()
        self._draw_footer()
        self._draw_order_info()
        self._draw_customer_details()
        self._draw_items_table()
        self._draw_totals()

        self.c.save()
        self.buffer.seek(0)
        return self.buffer

    def _draw_header(self):
        """Draws the header section using the company's information."""
        self.c.setFont('Helvetica-Bold', 16)
        self.c.drawString(0.75 * inch, self.height - 0.75 * inch, self.company_info.get("name", "Mi Empresa"))

        self.c.setFont('Helvetica', 10)
        self.c.drawString(0.75 * inch, self.height - 0.95 * inch, f"RUC: {self.company_info.get('ruc', '')}")

        self.c.setFont('Helvetica-Bold', 18)
        self.c.setFillColor(colors.darkblue)
        self.c.drawRightString(self.width - 0.75 * inch, self.height - 0.75 * inch, self.document_title)
        
        self.c.setStrokeColor(colors.grey)
        self.c.line(0.75 * inch, self.height - 1.2 * inch, self.width - 0.75 * inch, self.height - 1.2 * inch)

    def _draw_order_info(self):
        """Draws the order-specific information like number, date, and currency."""
        self.c.setFont('Helvetica', 10)
        self.c.setFillColor(colors.black)
        
        y_position = self.height - 1.5 * inch
        
        order_number_text = f"N° Documento: {self.order_data.get('order_number', 'N/A')}"
        self.c.drawRightString(self.width - 0.75 * inch, y_position, order_number_text)

        order_date_str = self.order_data.get('order_date')
        if order_date_str:
            order_date = datetime.fromisoformat(str(order_date_str)).strftime('%d/%m/%Y')
        else:
            order_date = "N/A"
        date_text = f"Fecha: {order_date}"
        self.c.drawRightString(self.width - 0.75 * inch, y_position - 15, date_text)
        
        # (AÑADIDO) Se añade la moneda del documento.
        currency_text = f"Moneda: PEN (Soles)"
        self.c.drawRightString(self.width - 0.75 * inch, y_position - 30, currency_text)

    def _draw_customer_details(self):
        """Draws the customer's billing information."""
        customer = self.order_data.get('customer', {}) or {}
        y_start = self.height - 2.2 * inch
        
        self.c.setFont('Helvetica-Bold', 11)
        self.c.drawString(0.75 * inch, y_start, "Cliente:")
        
        self.c.setFont('Helvetica', 10)
        self.c.drawString(0.75 * inch, y_start - 20, str(customer.get('business_name', '')))
        
        doc_type = str(customer.get('doc_type', '')).upper()
        doc_number = str(customer.get('doc_number', ''))
        self.c.drawString(0.75 * inch, y_start - 35, f"{doc_type}: {doc_number}")
        
        address = customer.get('address') or 'Dirección no especificada'
        self.c.drawString(0.75 * inch, y_start - 50, str(address))

    def _draw_items_table(self):
        """Draws the table with the products, quantities, and prices."""
        y_start = self.height - 3.2 * inch
        
        x_positions = [0.75 * inch, 1.75 * inch, 5.0 * inch, 6.2 * inch, 7.5 * inch]
        
        self.c.setFont('Helvetica-Bold', 10)
        self.c.drawString(x_positions[0], y_start, "SKU")
        self.c.drawString(x_positions[1], y_start, "Descripción")
        self.c.drawRightString(x_positions[2], y_start, "Cantidad")
        self.c.drawRightString(x_positions[3], y_start, f"P. Unit. ({self.currency_symbol})")
        self.c.drawRightString(x_positions[4], y_start, f"Subtotal ({self.currency_symbol})")
        
        self.c.setStrokeColor(colors.black)
        self.c.line(0.75 * inch, y_start - 5, self.width - 0.75 * inch, y_start - 5)

        self.c.setFont('Helvetica', 9)
        current_y = y_start - 20
        items = self.order_data.get('items', [])
        
        for item in items:
            product = item.get('product_details', {}) or {}
            quantity = item.get('quantity', 0)
            unit_price = item.get('unit_price', 0)
            subtotal = quantity * unit_price

            self.c.drawString(x_positions[0], current_y, str(product.get('sku', 'N/A')))
            self.c.drawString(x_positions[1], current_y, str(product.get('name', 'Producto no encontrado')))
            self.c.drawRightString(x_positions[2], current_y, str(quantity))
            self.c.drawRightString(x_positions[3], current_y, f"{unit_price:.2f}")
            self.c.drawRightString(x_positions[4], current_y, f"{subtotal:.2f}")
            
            current_y -= 15

    def _draw_totals(self):
        """Draws the final total amounts of the order."""
        total_amount = self.order_data.get('total_amount', 0)
        y_start = 2.5 * inch
        
        self.c.setFont('Helvetica-Bold', 12)
        # (MODIFICADO) Se utiliza la variable de clase para el símbolo de la moneda.
        self.c.drawRightString(self.width - 0.75 * inch, y_start, f"TOTAL: {self.currency_symbol} {total_amount:.2f}")

    def _draw_footer(self):
        """Draws the footer section using the company's contact information."""
        self.c.setFont('Helvetica', 8)
        self.c.setFillColor(colors.grey)
        
        address = self.company_info.get('address', '')
        phone = self.company_info.get('phone', '')
        email = self.company_info.get('email', '')
        
        contact_line = " | ".join(filter(None, [address, phone, email]))
        
        self.c.drawCentredString(self.width / 2.0, 0.75 * inch, contact_line)
        self.c.drawCentredString(self.width / 2.0, 0.55 * inch, "Gracias por su preferencia. Este documento no es un comprobante de pago.")
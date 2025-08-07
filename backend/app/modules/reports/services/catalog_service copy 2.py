# backend/app/modules/reports/services/catalog_service.py

"""
Servicio de Generación de Catálogos en PDF.

Este módulo contiene la clase CatalogPDFGenerator, responsable de tomar una lista
de datos de productos y transformarla en un documento PDF profesional y listo
para ser distribuido. Encapsula toda la lógica de diseño, maquetación y
renderizado utilizando la librería ReportLab.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import os
import requests
from io import BytesIO
from typing import List, Dict, Any
from datetime import datetime

from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, NextPageTemplate, PageBreak
)
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF

# ==============================================================================
# SECCIÓN 2: CONSTANTES DE DISEÑO Y PALETA DE COLORES
# ==============================================================================

PRIMARY_GREEN = HexColor("#1E8449")
DARK_TEXT = HexColor("#000000")
MEDIUM_GRAY = HexColor("#D5D8DC")
LIGHT_GRAY_BG = HexColor("#F4F6F7")

# ==============================================================================
# SECCIÓN 3: CLASE PRINCIPAL DEL GENERADOR DE PDF
# ==============================================================================

class CatalogPDFGenerator:
    """
    Clase que encapsula la lógica para generar un catálogo de productos en PDF.
    """

    def __init__(self, products: List[Dict[str, Any]], buffer: BytesIO, view_type: str):
        self.products = products
        self.buffer = buffer
        self.view_type = view_type
        self.styles = getSampleStyleSheet()
        self.story = []
        self.doc = BaseDocTemplate(
            self.buffer,
            pagesize=letter,
            topMargin=0.75*inch, bottomMargin=0.75*inch,
            leftMargin=0.5*inch, rightMargin=0.5*inch
        )
        self._create_custom_styles()
        self._setup_page_templates()

    def _create_custom_styles(self):
        self.styles.add(ParagraphStyle(name='SKU', fontName='Helvetica-Bold', fontSize=16, textColor=DARK_TEXT, alignment=TA_LEFT, leading=18))
        self.styles.add(ParagraphStyle(name='SectionTitle', fontName='Helvetica-Bold', fontSize=7, textColor=DARK_TEXT, alignment=TA_LEFT, spaceAfter=2, leading=9))
        self.styles.add(ParagraphStyle(name='CodeText', fontName='Helvetica', fontSize=7, textColor=HexColor("#34495E"), alignment=TA_LEFT, leading=9))
        self.styles.add(ParagraphStyle(name='SpecText', fontName='Helvetica', fontSize=8, textColor=DARK_TEXT, alignment=TA_CENTER, leading=10))
        self.styles.add(ParagraphStyle(name='CommercialText', fontName='Helvetica-Bold', fontSize=8, textColor=PRIMARY_GREEN, alignment=TA_CENTER, leading=10))
        self.styles.add(ParagraphStyle(name='PlaceholderText', fontName='Helvetica-Oblique', fontSize=10, textColor=MEDIUM_GRAY, alignment=TA_CENTER))

    def _setup_page_templates(self):
        cover_frame = Frame(self.doc.leftMargin, self.doc.bottomMargin, self.doc.width, self.doc.height, id='cover_frame')
        content_frame = Frame(self.doc.leftMargin, self.doc.bottomMargin, self.doc.width, self.doc.height, id='content_frame')
        
        cover_template = PageTemplate(id='Cover', frames=[cover_frame], onPage=self._draw_cover_page)
        content_template = PageTemplate(id='Content', frames=[content_frame], onPage=self._draw_content_page_layout)
        
        self.doc.addPageTemplates([cover_template, content_template])

    def build(self):
        self._build_story()
        self.doc.build(self.story)

    def _build_story(self):
        self.story.append(NextPageTemplate('Content'))
        self.story.append(PageBreak())
        product_grid = self._create_product_grid()
        self.story.append(product_grid)

    def _draw_logo(self, canvas: canvas.Canvas, x: float, y: float):
        """
        Dibuja el logo de la empresa, priorizando SVG sobre PNG.
        """
        svg_path = os.path.join('static', 'logos', 'logo.svg')
        png_path = os.path.join('static', 'logos', 'logo.png')

        # Prioridad 1: Intentar renderizar el logo SVG si existe.
        if os.path.exists(svg_path):
            try:
                drawing = svg2rlg(svg_path)
                scale_factor = 1.5
                drawing.width *= scale_factor
                drawing.height *= scale_factor
                drawing.scale(scale_factor, scale_factor)
                renderPDF.draw(drawing, canvas, x - (drawing.width / 2), y - (drawing.height / 2))
                return
            except Exception:
                pass # Si el SVG falla, intenta con el PNG

        # Prioridad 2: Si no hay SVG o falla, usar el logo PNG.
        if os.path.exists(png_path):
            logo = Image(png_path, width=3*inch, height=0.75*inch)
            logo.drawOn(canvas, x - (3*inch / 2), y - (0.75*inch / 2))

    def _draw_cover_page(self, canvas: canvas.Canvas, doc):
        """Dibuja la página de portada profesional y minimalista del catálogo."""
        canvas.saveState()
        width, height = letter
        
        canvas.setFillColor(PRIMARY_GREEN)
        canvas.rect(0, 0, 0.5 * inch, height, stroke=0, fill=1)

        center_x = (width + 0.5 * inch) / 2
        self._draw_logo(canvas, center_x, height - 2.5 * inch)
        
        canvas.setFont('Helvetica-Bold', 48)
        canvas.setFillColor(DARK_TEXT)
        canvas.drawCentredString(center_x, height / 2 + 0.5 * inch, "Catálogo de Productos")
        
        canvas.setFont('Helvetica', 28)
        canvas.setFillColor(PRIMARY_GREEN)
        canvas.drawCentredString(center_x, height / 2, "DIROGSA")

        generation_date = datetime.now().strftime("%B %Y").capitalize()
        canvas.setFont('Helvetica', 14)
        canvas.setFillColor(HexColor("#5D6D7E"))
        canvas.drawCentredString(center_x, height / 2 - 1 * inch, f"Edición: {generation_date}")
        
        canvas.restoreState()

    def _draw_content_page_layout(self, canvas: canvas.Canvas, doc):
        """Dibuja la cabecera y el pie de página en cada página de contenido."""
        canvas.saveState()
        canvas.setFillColor(PRIMARY_GREEN)
        canvas.rect(doc.leftMargin, letter[1] - 0.5*inch, doc.width, 36, stroke=0, fill=1)
        canvas.setFillColor(white)
        canvas.setFont('Helvetica-Bold', 16)
        canvas.drawString(doc.leftMargin + 15, letter[1] - 0.5*inch + 12, "Catálogo de Productos DIROGSA")
        
        canvas.setFillColor(DARK_TEXT)
        canvas.setFont('Helvetica', 9)
        canvas.drawRightString(letter[0] - doc.rightMargin, doc.bottomMargin - 20, f"Página {doc.page}")
        canvas.restoreState()
        
    def _create_product_cell(self, product: Dict[str, Any]) -> Table:
        sku_paragraph = Paragraph(product.get('sku', 'N/A'), self.styles['SKU'])
        image_flowable = self._get_image_flowable(product)
        specs_paragraph = self._get_specifications_paragraph(product)
        
        references_flowables = self._get_codes_flowables("Referencias Cruzadas:", product.get('cross_references', []))
        applications_flowable = self._get_applications_flowable_as_table(product)
        
        right_column_table = Table([[references_flowables], [applications_flowable]], colWidths=['100%'], rowHeights=[None, None])
        right_column_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))

        table_data = [[sku_paragraph, None], [image_flowable, right_column_table], [specs_paragraph, None]]
        
        if self.view_type == 'seller':
            table_data.append([self._get_commercial_info_paragraph(product), None])

        container_table = Table(table_data, colWidths=['40%', '60%'])
        style_commands = [('VALIGN', (0,0), (-1,-1), 'TOP'), ('SPAN', (0,0), (1,0)), ('SPAN', (0,2), (1,2)), ('BOTTOMPADDING', (0,0), (-1,0), 6), ('TOPPADDING', (0,2), (-1,-1), 4), ('BACKGROUND', (0,0), (-1,0), LIGHT_GRAY_BG)]
        if self.view_type == 'seller':
            style_commands.append(('SPAN', (0,3), (1,3)))
        container_table.setStyle(TableStyle(style_commands))
        return container_table

    def _create_product_grid(self) -> Table:
        product_cells = [self._create_product_cell(p) for p in self.products]
        
        num_columns = 2
        table_data = []
        for i in range(0, len(product_cells), num_columns):
            row = product_cells[i:i + num_columns]
            if len(row) < num_columns:
                row.extend([Spacer(1, 1)] * (num_columns - len(row)))
            table_data.append(row)
            
        grid = Table(table_data, colWidths=[self.doc.width / num_columns] * num_columns)
        grid.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8), ('TOPPADDING', (0,0), (-1,-1), 8), ('BOTTOMPADDING', (0,0), (-1,-1), 8), ('BOX', (0,0), (-1,-1), 0.5, MEDIUM_GRAY), ('LINEAFTER', (0,0), (-2,-1), 0.5, MEDIUM_GRAY), ('LINEBELOW', (0,0), (-1,-2), 0.5, MEDIUM_GRAY)]))
        return grid

    def _get_image_flowable(self, product: Dict[str, Any]):
        img_size = 1.2 * inch
        sku = product.get('sku')
        image_url = product.get('main_image_url')

        if image_url:
            try:
                response = requests.get(image_url, stream=True, timeout=5)
                response.raise_for_status()
                return Image(BytesIO(response.content), width=img_size, height=img_size, hAlign='CENTER')
            except requests.exceptions.RequestException:
                pass
        
        if sku:
            for ext in ['.jpg', '.png', '.jpeg']:
                local_path = os.path.join('static', 'product_images', sku + ext)
                if os.path.exists(local_path):
                    return Image(local_path, width=img_size, height=img_size, hAlign='CENTER')
        
        return Paragraph("Sin Imagen", self.styles['PlaceholderText'])

    def _get_specifications_paragraph(self, product: Dict[str, Any]):
        dimensions = product.get('dimensions') or {}
        spec_parts = []
        for key, value in dimensions.items():
            if value is not None:
                if isinstance(value, float) and value.is_integer():
                    formatted_value = int(value)
                else:
                    formatted_value = value
                spec_parts.append(f"<b>{key.upper()}:</b> {formatted_value}")
        
        if not spec_parts:
            return Spacer(1, 1)

        return Paragraph(" | ".join(spec_parts), self.styles['SpecText'])
    
    def _get_codes_flowables(self, title: str, codes: List[Dict[str, Any]]):
        valid_codes = [c for c in (codes or []) if c.get('code')]
        if not valid_codes:
            return Spacer(1, 1)
            
        text = ", ".join([f"{c.get('brand', '')}: {c.get('code', '')}" for c in valid_codes])
        return [Paragraph(title, self.styles['SectionTitle']), Paragraph(text, self.styles['CodeText'])]

    def _get_applications_flowable_as_table(self, product: Dict[str, Any]):
        apps = product.get('applications', [])
        if not apps:
            return Spacer(1, 1)

        application_paragraphs = [Paragraph(f"• {app.get('brand')} {app.get('model', '')}", self.styles['CodeText']) for app in apps if app.get('brand')]
        if not application_paragraphs:
            return Spacer(1, 1)

        num_columns = 2
        num_rows = (len(application_paragraphs) + num_columns - 1) // num_columns
        table_data = []
        for i in range(num_rows):
            row = [application_paragraphs[i + j * num_rows] if i + j * num_rows < len(application_paragraphs) else "" for j in range(num_columns)]
            table_data.append(row)

        app_table = Table(table_data, colWidths=['50%', '50%'])
        app_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 2), ('TOPPADDING', (0,0), (-1,-1), 0), ('BOTTOMPADDING', (0,0), (-1,-1), 1)]))
        
        return [Paragraph("Aplicaciones:", self.styles['SectionTitle']), app_table]

    def _get_commercial_info_paragraph(self, product: Dict[str, Any]):
        info_parts = [
            f"<b>Costo:</b> S/ {product.get('average_cost', 0.0):.2f}",
            f"<b>Precio:</b> S/ {product.get('price', 0.0):.2f}",
            f"<b>Stock:</b> {product.get('stock_quantity', 0)}",
        ]
        return Paragraph(" | ".join(info_parts), self.styles['CommercialText'])
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
from reportlab.lib.colors import HexColor, white, Color
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

# ==============================================================================
# SECCIÓN 2: CONSTANTES DE DISEÑO Y PALETA DE COLORES
# ==============================================================================

PRIMARY_COLOR = HexColor("#1A237E")
DARK_TEXT = HexColor("#212121")
MEDIUM_GRAY = HexColor("#BDBDBD")
LIGHT_GRAY_BG = HexColor("#F5F5F5")
WATERMARK_COLOR = Color(0.8, 0.8, 0.8, alpha=0.3) # Gris claro con 30% de opacidad

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
        """Define y registra los estilos de párrafo personalizados para el catálogo."""
        self.styles.add(ParagraphStyle(name='SKU', fontName='Helvetica-Bold', fontSize=16, textColor=DARK_TEXT, alignment=TA_LEFT, leading=18))
        self.styles.add(ParagraphStyle(name='SectionTitle', fontName='Helvetica-Bold', fontSize=7, textColor=DARK_TEXT, alignment=TA_LEFT, spaceAfter=2, leading=9))
        self.styles.add(ParagraphStyle(name='CodeText', fontName='Helvetica', fontSize=7, textColor=HexColor("#424242"), alignment=TA_LEFT, leading=9))
        self.styles.add(ParagraphStyle(name='SpecText', fontName='Helvetica', fontSize=8, textColor=DARK_TEXT, alignment=TA_CENTER, leading=10))
        self.styles.add(ParagraphStyle(name='CommercialText', fontName='Helvetica-Bold', fontSize=8, textColor=PRIMARY_COLOR, alignment=TA_CENTER, leading=10))
        self.styles.add(ParagraphStyle(name='PlaceholderText', fontName='Helvetica-Oblique', fontSize=10, textColor=MEDIUM_GRAY, alignment=TA_CENTER))

    def _setup_page_templates(self):
        """Define las plantillas de página para la portada y el contenido principal."""
        cover_frame = Frame(self.doc.leftMargin, self.doc.bottomMargin, self.doc.width, self.doc.height, id='cover_frame')
        content_frame = Frame(self.doc.leftMargin, self.doc.bottomMargin, self.doc.width, self.doc.height, id='content_frame')
        
        cover_template = PageTemplate(id='Cover', frames=[cover_frame], onPage=self._draw_cover_page)
        content_template = PageTemplate(id='Content', frames=[content_frame], onPage=self._draw_content_page_layout)
        
        self.doc.addPageTemplates([cover_template, content_template])

    def build(self):
        """Orquesta la construcción del contenido y compila el documento PDF final."""
        self._build_story()
        self.doc.build(self.story)

    def _build_story(self):
        """Construye la secuencia de "Flowables" que componen el contenido del PDF."""
        # Se inicia en la plantilla de portada, luego se cambia a la de contenido.
        self.story.append(NextPageTemplate('Content'))
        self.story.append(PageBreak())
        product_grid = self._create_product_grid()
        self.story.append(product_grid)

    def _draw_cover_page(self, canvas: canvas.Canvas, doc):
        """Dibuja la página de portada profesional del catálogo."""
        canvas.saveState()
        width, height = letter

        # --- Logo ---
        logo_path = os.path.join('static', 'logos', 'logo.png')
        if os.path.exists(logo_path):
            logo = Image(logo_path, width=2.5*inch, height=0.625*inch)
            logo.drawOn(canvas, width / 2 - (2.5*inch / 2), height - 2*inch)

        # --- Títulos ---
        canvas.setFont('Helvetica-Bold', 36)
        canvas.setFillColor(DARK_TEXT)
        canvas.drawCentredString(width / 2, height / 2 + 1*inch, "Catálogo de Productos")
        
        canvas.setFont('Helvetica', 24)
        canvas.setFillColor(PRIMARY_COLOR)
        canvas.drawCentredString(width / 2, height / 2, "DIROGSA")

        # --- Fecha de Generación ---
        generation_date = datetime.now().strftime("%m/%Y")
        canvas.setFont('Helvetica', 12)
        canvas.setFillColor(MEDIUM_GRAY)
        canvas.drawCentredString(width / 2, height / 2 - 1*inch, f"Edición: {generation_date}")
        
        canvas.restoreState()

    def _draw_watermark(self, canvas: canvas.Canvas, doc):
        """Dibuja un sello de agua diagonal en la página."""
        canvas.saveState()
        canvas.setFillColor(WATERMARK_COLOR)
        canvas.setFont('Helvetica-Bold', 60)
        canvas.rotate(45)
        # Se dibuja en una posición calculada para que aparezca centrado diagonalmente
        canvas.drawCentredString(11 * inch / 2, 1 * inch, "DIROGSA")
        canvas.restoreState()

    def _draw_content_page_layout(self, canvas: canvas.Canvas, doc):
        """Dibuja la cabecera, pie de página y sello de agua en cada página de contenido."""
        self._draw_watermark(canvas, doc) # Se dibuja primero para que quede de fondo
        
        canvas.saveState()
        # Cabecera
        canvas.setFillColor(PRIMARY_COLOR)
        canvas.rect(doc.leftMargin, letter[1] - 0.5*inch, doc.width, 36, stroke=0, fill=1)
        canvas.setFillColor(white)
        canvas.setFont('Helvetica-Bold', 16)
        canvas.drawString(doc.leftMargin + 15, letter[1] - 0.5*inch + 12, "Catálogo de Productos DIROGSA")
        
        # Pie de página
        canvas.setFillColor(DARK_TEXT)
        canvas.setFont('Helvetica', 9)
        canvas.drawRightString(letter[0] - doc.rightMargin, doc.bottomMargin - 20, f"Página {doc.page}")
        canvas.restoreState()
        
    def _create_product_cell(self, product: Dict[str, Any]) -> Table:
        """Crea la tabla contenedora para la celda de un único producto."""
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
        """Organiza las celdas de producto en la cuadrícula principal del catálogo."""
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
        """Busca, descarga si es necesario, y prepara el objeto `Image` para un producto."""
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
        """Formatea las dimensiones del producto en un párrafo, mostrando enteros sin decimales."""
        dimensions = product.get('dimensions') or {}
        spec_parts = []
        for key, value in dimensions.items():
            if value is not None:
                # CORRECCIÓN: Lógica para formatear enteros sin el .0
                if isinstance(value, float) and value.is_integer():
                    formatted_value = int(value)
                else:
                    formatted_value = value
                spec_parts.append(f"<b>{key.upper()}:</b> {formatted_value}")
        
        if not spec_parts:
            return Spacer(1, 1)

        return Paragraph(" | ".join(spec_parts), self.styles['SpecText'])
    
    def _get_codes_flowables(self, title: str, codes: List[Dict[str, Any]]):
        """Crea una lista de `Flowables` para una sección de códigos (ej. referencias)."""
        valid_codes = [c for c in (codes or []) if c.get('code')]
        if not valid_codes:
            return Spacer(1, 1)
            
        text = ", ".join([f"{c.get('brand', '')}: {c.get('code', '')}" for c in valid_codes])
        return [Paragraph(title, self.styles['SectionTitle']), Paragraph(text, self.styles['CodeText'])]

    def _get_applications_flowable_as_table(self, product: Dict[str, Any]):
        """Formatea las aplicaciones en una tabla de dos columnas para máxima legibilidad."""
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
        """Formatea la información comercial sensible en un párrafo horizontal."""
        info_parts = [
            f"<b>Costo:</b> S/ {product.get('average_cost', 0.0):.2f}",
            f"<b>Precio:</b> S/ {product.get('price', 0.0):.2f}",
            f"<b>Stock:</b> {product.get('stock_quantity', 0)}",
        ]
        return Paragraph(" | ".join(info_parts), self.styles['CommercialText'])
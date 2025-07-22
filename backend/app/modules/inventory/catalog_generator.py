# /backend/app/modules/inventory/catalog_generator.py
# MÓDULO DE GENERACIÓN DE PDF CON DISEÑO REFINADO Y PALETA DE COLORES SUAVIZADA

import os
import requests
from io import BytesIO
from typing import List, Dict

# Importaciones de la librería ReportLab (sin cambios)
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, Image, NextPageTemplate, PageBreak
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import inch

# --- SECCIÓN DE CONSTANTES DE DISEÑO (NUEVA PALETA DE VERDES REFINADA) ---
# Paleta más suave y profesional.

PRIMARY_GREEN = HexColor("#2E7D32")  # Un verde bosque, corporativo y menos agresivo.
ACCENT_GREEN = HexColor("#66BB6A")   # Un verde claro y suave para acentos.
DARK_TEXT = HexColor("#212121")
MEDIUM_GRAY = HexColor("#BDBDBD")    # Un gris más claro para los bordes, menos imponente.

class CatalogPDFGenerator:
    """
    Clase que encapsula toda la lógica para generar un catálogo de productos
    profesional, con un diseño refinado y una distribución de espacio optimizada.
    """

    def __init__(self, products: List[Dict], buffer: BytesIO, view_type: str):
        self.products = products
        self.buffer = buffer
        self.view_type = view_type
        self.styles = getSampleStyleSheet()
        self.doc = None
        self.story = []
        self._create_custom_styles()

    def _create_custom_styles(self):
        """Define y registra los estilos de párrafo optimizados para el nuevo layout."""
        self.styles.add(ParagraphStyle(name='SKU', fontName='Helvetica-Bold', fontSize=14, textColor=DARK_TEXT, alignment=TA_LEFT, leading=14))
        self.styles.add(ParagraphStyle(name='SectionTitle', fontName='Helvetica-Bold', fontSize=6.5, textColor=DARK_TEXT, alignment=TA_LEFT, spaceAfter=1, leading=8))
        self.styles.add(ParagraphStyle(name='CodeText', fontName='Helvetica', fontSize=6.5, textColor=HexColor("#616161"), alignment=TA_LEFT, leading=8))
        self.styles.add(ParagraphStyle(name='SpecText', fontName='Helvetica', fontSize=7, textColor=DARK_TEXT, alignment=TA_CENTER, leading=9))
        self.styles.add(ParagraphStyle(name='CommercialText', fontName='Helvetica-Bold', fontSize=7, textColor=PRIMARY_GREEN, alignment=TA_CENTER, leading=9))
        self.styles.add(ParagraphStyle(name='PlaceholderText', fontName='Helvetica-Oblique', fontSize=9, textColor=MEDIUM_GRAY, alignment=TA_CENTER))

    # --- SECCIÓN DE CONSTRUCCIÓN DEL DOCUMENTO ---
    
    def build(self):
        """Orquesta la creación completa del documento PDF."""
        self.doc = BaseDocTemplate(self.buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch, leftMargin=0.5*inch, rightMargin=0.5*inch)
        self._setup_page_templates()
        self._build_story()
        self.doc.build(self.story)

    def _setup_page_templates(self):
        """Define las plantillas de página para la portada y el contenido."""
        cover_frame = Frame(0, 0, self.doc.width + self.doc.leftMargin * 2, self.doc.height + self.doc.bottomMargin * 2, id='cover')
        cover_template = PageTemplate(id='Cover', frames=[cover_frame], onPage=self._draw_cover_page)
        content_frame = Frame(self.doc.leftMargin, self.doc.bottomMargin, self.doc.width, self.doc.height, id='content')
        content_template = PageTemplate(id='Content', frames=[content_frame], onPage=self._draw_content_page_layout)
        self.doc.addPageTemplates([cover_template, content_template])

    def _build_story(self):
        """Construye la secuencia de "Flowables" que conformarán el PDF."""
        self.story.append(NextPageTemplate('Content'))
        self.story.append(PageBreak())
        product_grid = self._create_product_grid()
        self.story.append(product_grid)

    # --- SECCIÓN DE DIBUJO DE PLANTILLAS DE PÁGINA ---

    def _draw_cover_page(self, canvas, doc):
        """Dibuja la portada del catálogo con la nueva paleta de colores."""
        canvas.saveState()
        canvas.setFillColor(PRIMARY_GREEN)
        canvas.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
        canvas.setFillColor(white)
        canvas.setFont('Helvetica-Bold', 60)
        canvas.drawCentredString(letter[0] / 2, letter[1] / 2 + 100, "CATÁLOGO")
        canvas.setFont('Helvetica-Bold', 40)
        canvas.drawCentredString(letter[0] / 2, letter[1] / 2 + 40, "DE FILTROS")
        canvas.setFont('Helvetica', 20)
        canvas.drawCentredString(letter[0] / 2, doc.bottomMargin, "Mi Empresa de Filtros, S.A.")
        canvas.restoreState()

    def _draw_content_page_layout(self, canvas, doc):
        """Dibuja la cabecera y el pie de página con la nueva paleta de colores."""
        canvas.saveState()
        canvas.setFillColor(PRIMARY_GREEN)
        canvas.rect(doc.leftMargin, letter[1] - 0.5*inch, doc.width, 36, stroke=0, fill=1)
        canvas.setFillColor(white)
        canvas.setFont('Helvetica-Bold', 18)
        canvas.drawString(doc.leftMargin + 15, letter[1] - 0.5*inch + 12, "FILTROS: ACEITE / AIRE / COMBUSTIBLE / CABINA")
        canvas.setFillColor(DARK_TEXT)
        canvas.setFont('Helvetica', 9)
        canvas.drawRightString(letter[0] - doc.rightMargin, doc.bottomMargin - 20, f"Página {doc.page}")
        canvas.restoreState()

    # --- SECCIÓN DE CREACIÓN DE CELDAS Y REJILLA DE PRODUCTOS ---

    def _create_product_cell(self, product: Dict) -> Table:
        """Crea una única tabla contenedora con un layout y espaciado optimizados."""
        sku_paragraph = Paragraph(product.get('sku', 'N/A'), self.styles['SKU'])
        image_flowable = self._get_image_flowable(product)
        specs_paragraph = self._get_specifications_paragraph(product)
        
        right_column_content = []
        right_column_content.extend(self._get_codes_flowables(title="Códigos Originales:", codes=product.get('oem_codes', [])))
        right_column_content.extend(self._get_codes_flowables(title="Referencias Cruzadas:", codes=product.get('cross_references', [])))
        right_column_content.extend(self._get_applications_flowable(product))

        table_data = [
            [sku_paragraph, None],
            [image_flowable, right_column_content],
            [specs_paragraph, None],
        ]
        
        if self.view_type == 'seller':
            commercial_info_paragraph = self._get_commercial_info_paragraph(product)
            table_data.append([commercial_info_paragraph, None])

        row_heights = [0.3*inch, 1*inch, 0.2*inch]
        if self.view_type == 'seller':
            row_heights.append(0.2*inch)

        container_table = Table(table_data, colWidths=['40%', '60%'], rowHeights=row_heights)
        
        style_commands = [
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('VALIGN', (0,1), (0,1), 'MIDDLE'),
            ('SPAN', (0,0), (1,0)),
            ('SPAN', (0,2), (1,2)),
            ('BOTTOMPADDING', (0,0), (-1,0), 4),
            ('TOPPADDING', (0,2), (-1,-1), 4),
        ]
        if self.view_type == 'seller':
            style_commands.append(('SPAN', (0,3), (1,3)))

        container_table.setStyle(TableStyle(style_commands))
        return container_table

    def _create_product_grid(self) -> Table:
        """Organiza las celdas de producto en la cuadrícula final de 2x5."""
        all_cells_as_tables = [self._create_product_cell(p) for p in self.products]
        
        num_columns = 2
        table_data = []
        for i in range(0, len(all_cells_as_tables), num_columns):
            row = all_cells_as_tables[i:i + num_columns]
            if len(row) < num_columns:
                row.extend([Spacer(1, 1)] * (num_columns - len(row)))
            table_data.append(row)
            
        row_height = 1.85 * inch
        
        grid = Table(table_data, colWidths=[self.doc.width / num_columns] * num_columns, rowHeights=row_height)
        grid.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, MEDIUM_GRAY),
            ('LINEAFTER', (0,0), (-2,-1), 0.5, MEDIUM_GRAY),
            ('LINEBELOW', (0,0), (-1,-2), 0.5, MEDIUM_GRAY),
        ]))
        return grid

    # --- SECCIÓN DE MÉTODOS AUXILIARES ---

    def _get_image_flowable(self, product: Dict):
        """Busca y devuelve un objeto Image con tamaño optimizado."""
        img_size = 1 * inch
        sku = product.get('sku')
        image_url = product.get('main_image_url')
        img = None

        if image_url:
            try:
                response = requests.get(image_url, stream=True, timeout=5)
                response.raise_for_status()
                img = Image(response.raw, width=img_size, height=img_size)
            except requests.exceptions.RequestException:
                img = None
        
        if not img and sku:
            for ext in ['.jpg', '.png', '.jpeg']:
                local_path = os.path.join('static', 'product_images', sku + ext)
                if os.path.exists(local_path):
                    img = Image(local_path, width=img_size, height=img_size)
                    break
        
        if img:
            img.hAlign = 'CENTER'
            return img
        
        return Paragraph("Sin Imagen", self.styles['PlaceholderText'])

    def _get_specifications_paragraph(self, product: Dict):
        """Formatea las especificaciones del producto en un único párrafo horizontal."""
        specs = product.get('specifications', {})
        spec_parts = []
        spec_keys = ['A', 'B', 'C', 'G', 'H', 'D', 'F']
        for key in spec_keys:
            if key in specs and specs[key] is not None:
                spec_parts.append(f"<b>{key}:</b> {specs[key]}")
        
        if not spec_parts:
            return Spacer(1, 1)

        specs_text = " | ".join(spec_parts)
        return Paragraph(specs_text, self.styles['SpecText'])
    
    
    def _get_codes_flowables(self, title: str, codes: List[Dict]) -> List:
        """
        Crea una lista de Flowables para una sección de códigos,
        manejando de forma segura el caso en que la lista de códigos sea None.
        """
        # Se asegura de que `valid_codes` sea siempre una lista, incluso si `codes` es None.
        valid_codes = [c for c in (codes or []) if c.get('code')]
        if not valid_codes:
            return []
            
        elements = [Paragraph(title, self.styles['SectionTitle'])]
        text = ", ".join([f"{c.get('brand')}: {c.get('code')}" for c in valid_codes])
        elements.append(Paragraph(text, self.styles['CodeText']))
        elements.append(Spacer(1, 6))
        return elements


    def _get_applications_flowable(self, product: Dict) -> List:
        """
        Crea una lista de Flowables para las aplicaciones del vehículo,
        manejando de forma segura el caso en que el campo 'applications' no exista.
        """
        # Obtiene 'applications' con un valor por defecto de lista vacía para evitar errores.
        apps = product.get('applications', [])
        if not apps:
            return []
        
        app_text = ", ".join([f"{app.get('brand')} {app.get('model')}" for app in apps])
        return [
            Paragraph("Aplicaciones:", self.styles['SectionTitle']),
            Paragraph(app_text, self.styles['CodeText'])
        ]



    def _get_commercial_info_paragraph(self, product: Dict):
        """Formatea la información comercial sensible en un párrafo horizontal."""
        cost = product.get('cost', 0.0)
        price = product.get('price', 0.0)
        stock = product.get('stock_quantity', 0)
        points = product.get('points_on_sale', 0.0)

        info_parts = [
            f"<b>Costo:</b> S/ {cost:.2f}",
            f"<b>Precio:</b> S/ {price:.2f}",
            f"<b>Stock:</b> {stock}",
            f"<b>Puntos:</b> {points:.2f}"
        ]
        
        info_text = " | ".join(info_parts)
        return Paragraph(info_text, self.styles['CommercialText'])
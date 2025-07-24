# /backend/app/modules/inventory/catalog_generator.py

import os
import requests
from io import BytesIO
from typing import List, Dict

from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, Image, NextPageTemplate, PageBreak
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import inch


# --- SECCIÓN 1: CONSTANTES DE DISEÑO Y PALETA DE COLORES ---

PRIMARY_GREEN = HexColor("#2E7D32")
DARK_TEXT = HexColor("#212121")
MEDIUM_GRAY = HexColor("#BDBDBD")
LIGHT_GRAY_BG = HexColor("#F5F5F5")


class CatalogPDFGenerator:
    """
    Clase que encapsula toda la lógica para generar un catálogo de productos
    con un diseño profesional, enfocado en la legibilidad, la jerarquía visual
    y un layout flexible que evita la superposición de contenido.
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
        """Define y registra los estilos de párrafo optimizados para el catálogo."""
        self.styles.add(ParagraphStyle(name='SKU', fontName='Helvetica-Bold', fontSize=18, textColor=DARK_TEXT, alignment=TA_LEFT, leading=20))
        self.styles.add(ParagraphStyle(name='SectionTitle', fontName='Helvetica-Bold', fontSize=7, textColor=DARK_TEXT, alignment=TA_LEFT, spaceAfter=2, leading=9))
        self.styles.add(ParagraphStyle(name='CodeText', fontName='Helvetica', fontSize=7, textColor=HexColor("#424242"), alignment=TA_LEFT, leading=9))
        self.styles.add(ParagraphStyle(name='SpecText', fontName='Helvetica', fontSize=8, textColor=DARK_TEXT, alignment=TA_CENTER, leading=10))
        self.styles.add(ParagraphStyle(name='CommercialText', fontName='Helvetica-Bold', fontSize=8, textColor=PRIMARY_GREEN, alignment=TA_CENTER, leading=10))
        self.styles.add(ParagraphStyle(name='PlaceholderText', fontName='Helvetica-Oblique', fontSize=10, textColor=MEDIUM_GRAY, alignment=TA_CENTER))


    # --- SECCIÓN 2: ORQUESTACIÓN DE LA CONSTRUCCIÓN DEL DOCUMENTO ---
    
    def build(self):
        """Ejecuta la secuencia completa para construir y generar el PDF."""
        self.doc = BaseDocTemplate(self.buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch, leftMargin=0.5*inch, rightMargin=0.5*inch)
        self._setup_page_templates()
        self._build_story()
        self.doc.build(self.story)

    def _setup_page_templates(self):
        """Define las plantillas de página para la portada y el contenido principal."""
        cover_frame = Frame(0, 0, self.doc.width + self.doc.leftMargin * 2, self.doc.height + self.doc.bottomMargin * 2, id='cover')
        cover_template = PageTemplate(id='Cover', frames=[cover_frame], onPage=self._draw_cover_page)
        content_frame = Frame(self.doc.leftMargin, self.doc.bottomMargin, self.doc.width, self.doc.height, id='content')
        content_template = PageTemplate(id='Content', frames=[content_frame], onPage=self._draw_content_page_layout)
        self.doc.addPageTemplates([cover_template, content_template])

    def _build_story(self):
        """Construye la secuencia de "Flowables" que componen el contenido del PDF."""
        self.story.append(NextPageTemplate('Content'))
        self.story.append(PageBreak())
        product_grid = self._create_product_grid()
        self.story.append(product_grid)


    # --- SECCIÓN 3: DIBUJO DE ELEMENTOS DE PÁGINA (CABECERAS, PORTADA) ---

    def _draw_cover_page(self, canvas, doc):
        """Dibuja la página de portada del catálogo."""
        canvas.saveState()
        canvas.setFillColor(PRIMARY_GREEN)
        canvas.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
        canvas.setFillColor(white)
        canvas.setFont('Helvetica-Bold', 60)
        canvas.drawCentredString(letter[0] / 2, letter[1] / 2 + 100, "CATÁLOGO")
        canvas.setFont('Helvetica-Bold', 40)
        canvas.drawCentredString(letter[0] / 2, letter[1] / 2 + 40, "DE PRODUCTOS")
        canvas.setFont('Helvetica', 20)
        canvas.drawCentredString(letter[0] / 2, doc.bottomMargin, "Nombre de la Empresa S.A.C.")
        canvas.restoreState()

    def _draw_content_page_layout(self, canvas, doc):
        """Dibuja la cabecera y el pie de página en cada página de contenido."""
        canvas.saveState()
        canvas.setFillColor(PRIMARY_GREEN)
        canvas.rect(doc.leftMargin, letter[1] - 0.5*inch, doc.width, 36, stroke=0, fill=1)
        canvas.setFillColor(white)
        canvas.setFont('Helvetica-Bold', 18)
        canvas.drawString(doc.leftMargin + 15, letter[1] - 0.5*inch + 12, "CATÁLOGO DE PRODUCTOS")
        canvas.setFillColor(DARK_TEXT)
        canvas.setFont('Helvetica', 9)
        canvas.drawRightString(letter[0] - doc.rightMargin, doc.bottomMargin - 20, f"Página {doc.page}")
        canvas.restoreState()


    # --- SECCIÓN 4: CREACIÓN DE CELDAS Y REJILLA DE PRODUCTOS ---

    def _create_product_cell(self, product: Dict) -> Table:
        """
        Crea la tabla contenedora para un único producto con un layout profesional.
        """
        sku_paragraph = Paragraph(product.get('sku', 'N/A'), self.styles['SKU'])
        image_flowable = self._get_image_flowable(product)
        specs_paragraph = self._get_specifications_paragraph(product)
        
        references_flowables = self._get_codes_flowables(
            title="Referencias Cruzadas:",
            codes=product.get('cross_references', [])
        )
        applications_flowable = self._get_applications_flowable_as_table(product)
        
        right_column_data = [
            [references_flowables],
            [applications_flowable]
        ]
        
        right_column_table = Table(right_column_data, colWidths=['100%'], rowHeights=[None, None])
        right_column_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))

        table_data = [
            [sku_paragraph, None],
            [image_flowable, right_column_table],
            [specs_paragraph, None],
        ]
        
        if self.view_type == 'seller':
            commercial_info_paragraph = self._get_commercial_info_paragraph(product)
            table_data.append([commercial_info_paragraph, None])

        container_table = Table(table_data, colWidths=['40%', '60%'])
        
        style_commands = [
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('VALIGN', (0,1), (0,1), 'TOP'),
            ('SPAN', (0,0), (1,0)),
            ('SPAN', (0,2), (1,2)),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,2), (-1,-1), 4),
            ('BACKGROUND', (0,0), (-1,0), LIGHT_GRAY_BG),
        ]
        if self.view_type == 'seller':
            style_commands.append(('SPAN', (0,3), (1,3)))

        container_table.setStyle(TableStyle(style_commands))
        return container_table

    def _create_product_grid(self) -> Table:
        """Organiza las celdas de producto en la cuadrícula principal del catálogo."""
        all_cells_as_tables = [self._create_product_cell(p) for p in self.products]
        
        num_columns = 2
        table_data = []
        for i in range(0, len(all_cells_as_tables), num_columns):
            row = all_cells_as_tables[i:i + num_columns]
            if len(row) < num_columns:
                row.extend([Spacer(1, 1)] * (num_columns - len(row)))
            table_data.append(row)
            
        grid = Table(table_data, colWidths=[self.doc.width / num_columns] * num_columns)
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


    # --- SECCIÓN 5: MÉTODOS AUXILIARES PARA GENERAR CONTENIDO ---

    def _get_image_flowable(self, product: Dict):
        """Busca y prepara el objeto `Image` para un producto."""
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
        """Formatea las especificaciones del producto en un párrafo horizontal."""
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
        """Crea una lista de `Flowables` para una sección de códigos."""
        valid_codes = [c for c in (codes or []) if c.get('code')]
        if not valid_codes:
            return []
            
        elements = [Paragraph(title, self.styles['SectionTitle'])]
        text = ", ".join([f"{c.get('brand')}: {c.get('code')}" for c in valid_codes])
        elements.append(Paragraph(text, self.styles['CodeText']))
        return elements

    def _get_applications_flowable_as_table(self, product: Dict):
        """
        Formatea las aplicaciones en una tabla de dos columnas para máxima legibilidad.
        """
        apps = product.get('applications', [])
        if not apps:
            return Spacer(1, 1)

        application_texts = []
        for app in apps:
            brand = app.get('brand')
            model = app.get('model')
            if brand:
                text = f"• {brand} {model}" if model else f"• {brand}"
                application_texts.append(Paragraph(text, self.styles['CodeText']))

        if not application_texts:
            return Spacer(1, 1)

        num_columns = 2
        table_data = []
        num_rows = (len(application_texts) + num_columns - 1) // num_columns
        for i in range(num_rows):
            row = []
            for j in range(num_columns):
                index = i + j * num_rows
                if index < len(application_texts):
                    row.append(application_texts[index])
                else:
                    row.append("")
            table_data.append(row)

        app_table = Table(table_data, colWidths=['50%', '50%'])
        app_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ]))
        
        return [
            Paragraph("Aplicaciones:", self.styles['SectionTitle']),
            app_table
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
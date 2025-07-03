# /backend/app/services/catalog_service.py
# CÓDIGO COMPLETO CON EL CSS FINAL - LISTO PARA COPIAR Y PEGAR

from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader
import os

template_path = os.path.join(os.path.dirname(__file__), 'templates')
env = Environment(loader=FileSystemLoader(template_path))

def create_catalog_pdf(products: list, is_seller_view: bool) -> bytes:
    products_per_page = 8
    product_pages = [products[i:i + products_per_page] for i in range(0, len(products), products_per_page)]
    template = env.get_template('catalog_template.html')
    html_out = template.render(
        product_pages=product_pages,
        is_seller_view=is_seller_view,
        company_name="Mi Empresa de Filtros S.A.C"
    )
    
    css_string = """
        @page { size: A4; margin: 2cm; }
        @page :first { margin: 0; }
        body { font-family: 'Helvetica Neue', 'Arial', sans-serif; color: #333; font-size: 9pt; }
        .cover-page {
            width: 100%; height: 100%; display: flex; flex-direction: column;
            justify-content: center; align-items: center; text-align: center;
            background-color: #f0f4f8; page-break-after: always;
        }
        .cover-page .logo { font-size: 48px; font-weight: bold; color: #3498db; border: 3px solid #3498db; padding: 10px 20px; margin-bottom: 20px; }
        .cover-page h1 { font-size: 36pt; color: #2c3e50; margin-bottom: 1cm; }
        .cover-page .company-name { font-size: 18pt; color: #7f8c8d; margin-top: 1cm; }

        .product-page { page-break-before: always; }
        .product-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            grid-template-rows: repeat(4, 1fr);
            gap: 1.2cm 1cm;
        }
        .product-card {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            page-break-inside: avoid;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .product-header { 
            background-color: #f8f9fa; 
            padding: 8px 12px; 
            border-bottom: 1px solid #dee2e6; 
        }
        .product-code { font-weight: 700; font-size: 14pt; color: #0056b3; }
        .product-name { font-size: 8pt; color: #6c757d; }
        
        .product-body { 
            display: flex; 
            padding: 12px; 
            gap: 15px; 
            flex-grow: 1;
            align-items: center;
        }
        
        .product-image-container { 
            flex: 1.2;
            text-align: center;
        }
        .product-image-container img { max-width: 100%; max-height: 120px; object-fit: contain; }

        .product-info-container { 
            flex: 1; 
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 10px;
        }

        .measures-list h4, .cross-references h4 {
            margin: 0 0 5px 0;
            font-size: 9pt;
            color: #495057;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 3px;
        }
        .measures-list p, .cross-references p {
            margin: 0 0 4px 0;
            font-size: 8.5pt;
        }
        .cross-references p {
            color: #6c757d;
            word-wrap: break-word;
        }
        
        .product-footer { 
            text-align: center;
            padding: 8px; 
            background-color: #e9f5ff; 
            border-top: 1px solid #dee2e6; 
            font-size: 8.5pt;
            font-weight: bold;
            color: #004085;
            display: flex;
            justify-content: space-around;
        }
    """
    
    html = HTML(string=html_out)
    return html.write_pdf(stylesheets=[CSS(string=css_string)])
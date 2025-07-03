# /backend/app/services/catalog_service.py
# CÓDIGO COMPLETO Y CORREGIDO - LISTO PARA COPIAR Y PEGAR

from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader
import os

# --- Configuración del motor de plantillas Jinja2 (sin cambios) ---
template_path = os.path.join(os.path.dirname(__file__), 'templates')
env = Environment(loader=FileSystemLoader(template_path))


def create_catalog_pdf(products: list, is_seller_view: bool) -> bytes:
    """
    Crea el contenido en bytes de un PDF con una portada y páginas de productos.
    """
    # ==========================================================
    #           *** AJUSTE CLAVE: 8 PRODUCTOS POR PÁGINA ***
    # ==========================================================
    products_per_page = 8  # <-- CAMBIADO DE 10 a 8
    product_pages = [products[i:i + products_per_page] for i in range(0, len(products), products_per_page)]

    template = env.get_template('catalog_template.html')
    
    html_out = template.render(
        product_pages=product_pages,
        is_seller_view=is_seller_view,
        company_name="Mi Empresa de Filtros S.A.C"
    )
    
    # ========================================================================
    #       *** HOJA DE ESTILOS CSS REAJUSTADA PARA 8 PRODUCTOS/PÁGINA ***
    # ========================================================================
    css_string = """
        /* --- Estilos generales de la página A4 --- */
        @page {
            size: A4;
            /* Margen estándar para documentos profesionales: ~2.54cm (1 pulgada) */
            /* Usaremos 2cm para un poco más de espacio útil, pero es un margen seguro. */
            margin: 2cm; 
            
            @top-center { content: "Catálogo de Productos - MiERP PRO"; font-size: 10pt; color: #555; font-weight: bold; }
            @bottom-right { content: "Página " counter(page); font-size: 9pt; color: #555; }
        }
        @page :first { /* Portada sin márgenes ni encabezados */
            margin: 0;
            @top-center { content: ""; }
            @bottom-right { content: ""; }
        }

        body { font-family: 'Helvetica Neue', 'Arial', sans-serif; color: #333; font-size: 9pt; }

        /* --- Estilos de la Portada (sin cambios) --- */
        .cover-page {
            width: 100%; height: 100%; display: flex; flex-direction: column;
            justify-content: center; align-items: center; text-align: center;
            background-color: #f0f4f8; page-break-after: always;
        }
        .cover-page .logo { font-size: 48px; font-weight: bold; color: #3498db; border: 3px solid #3498db; padding: 10px 20px; margin-bottom: 20px; }
        .cover-page h1 { font-size: 36pt; color: #2c3e50; margin-bottom: 1cm; }
        .cover-page .company-name { font-size: 18pt; color: #7f8c8d; margin-top: 1cm; }

        /* --- Layout de las páginas de productos --- */
        .product-page { page-break-before: always; }
        .product-grid { 
            display: grid; 
            /* 2 columnas y 4 filas para un total de 8 productos por página */
            grid-template-columns: 1fr 1fr; 
            grid-template-rows: repeat(4, auto);
            /* Aumentamos el espacio entre filas para que no se sientan apretadas */
            gap: 1.2cm 1cm; 
            grid-auto-flow: row;
        }

        /* --- Estilo de la Tarjeta de Producto (Ajustado) --- */
        .product-card {
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            page-break-inside: avoid;
            background-color: #ffffff;
            height: 100%;
            box-sizing: border-box; /* Asegura que padding y border no aumenten el tamaño total */
        }
        
        .product-header { 
            background-color: #f5f7fa; 
            padding: 8px 10px; 
            border-bottom: 1px solid #e0e0e0; 
        }
        .product-code { font-weight: 700; font-size: 11pt; color: #2980b9; }
        .product-name { font-size: 8pt; color: #667; margin-top: 2px; }
        
        /* Cuerpo de la tarjeta */
        .product-body { 
            display: flex; 
            padding: 10px; 
            gap: 10px; 
            flex-grow: 1;
        }
        
        /* Columna Izquierda: Imagen del producto */
        .product-image-container { 
            flex: 0 0 80px; /* Reducimos ligeramente para dar más espacio a los datos */
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .product-image-container img { max-width: 100%; max-height: 80px; object-fit: contain; }

        /* Columna Derecha: Información */
        .product-info-container { flex: 1; display: flex; flex-direction: column; }
        
        .dimensions-block { display: flex; gap: 8px; }
        
        .diagram-container { flex: 1; }
        .dimension-diagram { width: 100%; border: 1px solid #f0f0f0; border-radius: 4px; }
        
        .measures-container { flex: 1; padding-left: 5px; }
        .measures-list { line-height: 1.5; font-size: 8.5pt; }
        .measures-list p { margin: 0 0 3px 0; }
        .measures-list strong { color: #000; }
        
        /* Pie de la tarjeta */
        .product-footer { 
            padding: 8px 10px; 
            background-color: #f5f7fa; 
            border-top: 1px solid #e0e0e0; 
            font-size: 7.5pt; 
            margin-top: auto;
        }
        .cross-references { color: #555; word-wrap: break-word; } /* Evita que referencias largas desborden */

        .seller-details { 
            margin-top: 5px; 
            font-weight: bold; 
            color: #c0392b; 
            display: flex;
            justify-content: space-between;
            padding-top: 5px;
            border-top: 1px dashed #ddd;
        }
    """
    
    html = HTML(string=html_out)
    return html.write_pdf(stylesheets=[CSS(string=css_string)])
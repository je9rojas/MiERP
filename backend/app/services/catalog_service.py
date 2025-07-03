# /backend/app/services/catalog_service.py

# --- Imports de las librerías necesarias ---
# WeasyPrint para convertir HTML+CSS a PDF
from weasyprint import HTML, CSS
# Jinja2 para manejar las plantillas HTML con lógica (bucles, condicionales)
from jinja2 import Environment, FileSystemLoader
# 'os' para construir rutas de archivo de forma segura, sin importar el sistema operativo
import os

# --- Configuración del motor de plantillas Jinja2 ---
# 1. Obtenemos la ruta del directorio donde se encuentra este archivo (catalog_service.py)
#    os.path.dirname(__file__) devuelve la ruta de la carpeta 'services'
# 2. Unimos esa ruta con el nombre de la carpeta 'templates' para obtener la ruta completa
template_path = os.path.join(os.path.dirname(__file__), 'templates')

# 3. Creamos un "entorno" de Jinja2, diciéndole que busque los archivos .html en esa ruta
env = Environment(loader=FileSystemLoader(template_path))


# --- La función principal que faltaba ---
def create_catalog_pdf(products: list, is_seller_view: bool) -> bytes:
    """
    Crea el contenido en bytes de un PDF a partir de una lista de productos.
    
    Args:
        products (list): Una lista de objetos de producto (validados por Pydantic).
        is_seller_view (bool): True si el catálogo debe incluir precios y stock.

    Returns:
        bytes: El contenido binario del archivo PDF generado.
    """
    
    # 1. Cargar la plantilla HTML desde la carpeta 'templates'
    template = env.get_template('catalog_template.html')
    
    # 2. Renderizar la plantilla: Jinja2 reemplazará las variables (ej. {{ product.name }})
    #    y ejecutará la lógica (ej. {% for product in products %}) con los datos que le pasamos.
    html_out = template.render(
        products=products, 
        is_seller_view=is_seller_view
    )
    
    # 3. Definir los estilos CSS para el PDF. Esto controla todo el diseño.
    css_string = """
        @page {
            size: A4;
            margin: 1.5cm;
            
            @top-center {
                content: "Catálogo de Productos - MiERP PRO";
                font-family: 'Helvetica', 'Arial', sans-serif;
                font-size: 10pt;
                color: #555;
                font-weight: bold;
            }
            @bottom-right {
                content: "Página " counter(page) " de " counter(pages);
                font-family: 'Helvetica', 'Arial', sans-serif;
                font-size: 9pt;
                color: #555;
            }
        }

        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; }
        
        h1 { 
            text-align: center; 
            color: #2c3e50; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 10px; 
            margin-bottom: 1cm; 
        }

        .product-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; /* Dos columnas por página */
            gap: 1cm; 
        }

        .product-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            page-break-inside: avoid; /* ¡Crucial! Evita que una tarjeta se corte entre páginas */
            box-shadow: 0 4px 8px rgba(0,0,0,0.05);
            transition: box-shadow 0.3s;
        }

        .product-header { 
            background-color: #f8f9fa; 
            padding: 8px 12px; 
            border-bottom: 1px solid #ddd; 
        }

        .product-code { 
            font-weight: bold; 
            font-size: 13pt; 
            color: #3498db; 
        }

        .product-name { font-size: 9pt; color: #555; }

        .product-body { 
            display: flex; 
            padding: 12px; 
            gap: 12px; 
            flex-grow: 1; /* Hace que esta sección ocupe el espacio disponible */
        }

        .product-image { 
            flex: 0 0 100px; /* No crece, no se encoge, base de 100px */
            text-align: center; 
            align-self: center; /* Centra la imagen verticalmente en su contenedor */
        }

        .product-image img { 
            max-width: 100%; 
            max-height: 80px; 
            object-fit: contain; 
        }

        .product-dimensions { flex: 1; }

        .dimension-diagram { 
            width: 100%; 
            height: auto; 
            margin-bottom: 8px; 
            border: 1px solid #eee; 
            border-radius: 4px;
        }

        .measures-list { 
            font-size: 9pt; 
            line-height: 1.5; 
            color: #2c3e50;
        }

        .measures-list strong { font-weight: 600; }

        .product-footer { 
            padding: 8px 12px; 
            background-color: #f8f9fa; 
            border-top: 1px solid #ddd; 
            font-size: 8pt; 
            margin-top: auto; /* Empuja el footer a la parte inferior de la tarjeta */
        }

        .cross-references { color: #666; }

        .seller-details { 
            margin-top: 5px; 
            font-weight: bold; 
            color: #e74c3c; /* Un rojo menos agresivo */
            background-color: #fdf2f2;
            padding: 4px 6px;
            border-radius: 4px;
            text-align: center;
        }
    """
    
    # 4. Crear el objeto HTML a partir del string renderizado
    html = HTML(string=html_out)
    
    # 5. Escribir el PDF usando el objeto HTML y la hoja de estilos CSS.
    #    Esto devuelve el contenido binario del PDF.
    return html.write_pdf(stylesheets=[CSS(string=css_string)])
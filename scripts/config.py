from pathlib import Path
import sys


def obtener_base_dir():
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent

    return Path(__file__).resolve().parent.parent


BASE_DIR = obtener_base_dir()

RUTA_EXCEL = BASE_DIR / "data" / "Excel_Maestro.xlsx"
RUTA_JSON = BASE_DIR / "data" / "productos.json"
RUTA_PROVEEDOR = BASE_DIR / "data" / "excel_proveedor.xlsx"
RUTA_IMAGENES = BASE_DIR / "img" / "productos"
RUTA_ICONO = BASE_DIR / "logo.ico"

HOJA_PRODUCTOS = "Productos"

RUTA_CONFIG = BASE_DIR / "config"
RUTA_VENTANA = RUTA_CONFIG / "ventana.json"
RUTA_NORMALIZADOR_VENTANA = RUTA_CONFIG / "normalizador_ventana.json"

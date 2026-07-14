from scripts.exportador_json import guardar_json
from scripts.lector_excel import leer_productos
from scripts.validadores import validar_productos
from scripts.utilidades import mostrar_errores
from scripts.config import RUTA_JSON


def main():

    productos = leer_productos()

    productos, errores = validar_productos(productos)

    if errores:
        mostrar_errores(errores)
        return

    guardar_json(productos, RUTA_JSON)

    print("[OK] JSON generado correctamente.")

if __name__ == "__main__":
    main()
    
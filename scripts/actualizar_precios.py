from scripts.lector_excel import leer_productos
from scripts.lector_proveedor import leer_proveedor
from scripts.indices import crear_indice_por_codigo
from scripts.actualizar_maestro import actualizar_precios
from scripts.actualizar_maestro import buscar_productos_faltantes
from scripts.escritor_excel import guardar_precios
from scripts.config import RUTA_PROVEEDOR, RUTA_EXCEL
from scripts.generar_json import main as generar_json

def main():

    print("Actualizador de precios iniciado.")

    productos_maestro = leer_productos()

    indice_maestro = crear_indice_por_codigo(productos_maestro)
    
    productos_proveedor = leer_proveedor(RUTA_PROVEEDOR)
    indice_proveedor = crear_indice_por_codigo(productos_proveedor)

    print(f"Productos Maestro: {len(productos_maestro)}")
    print(f"Productos Proveedor: {len(productos_proveedor)}")
    productos_catalogo = actualizar_precios(
    productos_proveedor,
    indice_maestro,
)
    precios_modificados, _ = guardar_precios(
    productos_maestro,
    RUTA_EXCEL,
)
    if precios_modificados is None:
        return

    productos_faltantes = buscar_productos_faltantes(
    productos_maestro,
    indice_proveedor,
)

    print("\n===================================")
    print(" ACTUALIZACIÓN FINALIZADA")
    print("===================================\n")

    print(f"Productos del catálogo : {len(productos_maestro)}")
    print(f"Productos encontrados  : {productos_catalogo}")
    print(f"Precios modificados    : {precios_modificados}")
    print(f"Precios sin cambios    : {productos_catalogo - precios_modificados}")

    if productos_faltantes:

        print("\n===================================")
        print(" PRODUCTOS NO ENCONTRADOS")
        print("===================================\n")

        for producto in productos_faltantes:

            print(f'{producto["codigo"]} - {producto["nombre"]}')

        print(f"\nTotal: {len(productos_faltantes)}")

    else:
    
        print("\nTodos los productos del catálogo fueron encontrados.")

    print("\nGenerando productos.json...")

    generar_json()

    print("[OK] productos.json actualizado correctamente.")

if __name__ == "__main__":
    main()

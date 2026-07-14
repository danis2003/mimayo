from scripts.config import RUTA_IMAGENES

def validar_productos(productos):

    errores = []

    validar_codigos(productos, errores)
    validar_nombres(productos, errores)
    validar_categorias(productos, errores)
    validar_precios(productos, errores)
    validar_activos(productos, errores)
    validar_imagenes(productos, errores)
    validar_marcas(productos, errores)

    return productos, errores

def validar_codigos(productos, errores):

    codigos = set()

    for fila_excel, producto in enumerate(productos, start=2):

        codigo = producto["codigo"]

        if not codigo:
            errores.append(
                f"Fila {fila_excel} | Nombre: {producto['nombre']} | Código vacío."
            )
            continue

        if codigo in codigos:
            errores.append(
                f"Fila {fila_excel} | Código: {codigo} | Código duplicado."
            )
        else:
            codigos.add(codigo)

def validar_nombres(productos, errores):

    for fila_excel, producto in enumerate(productos, start=2):

        nombre = producto["nombre"]



        if not nombre:
            errores.append(
                f"Fila {fila_excel} | Código: {producto['codigo']} | Nombre vacío."
            )

def validar_categorias(productos, errores):

    for fila_excel, producto in enumerate(productos, start=2):

        categoria = producto["categoria"]



        if not categoria:
            errores.append(
                f"Fila {fila_excel} | Código: {producto['codigo']} | Categoría vacía."
            )

def validar_precios(productos, errores):

    for fila_excel, producto in enumerate(productos, start=2):

        precio = producto["precio"]

        if precio is None:
            errores.append(
                f"Fila {fila_excel} | Código: {producto['codigo']} | Precio vacío."
            )
            continue

        if precio <= 0:
            errores.append(
                f"Fila {fila_excel} | Código: {producto['codigo']} | Precio inválido ({precio})."
            )

def validar_activos(productos, errores):

    for fila_excel, producto in enumerate(productos, start=2):

        activo = producto["activo"]

        if not isinstance(activo, bool):
            errores.append(
                f"Fila {fila_excel} | Código: {producto['codigo']} | Valor de 'Activo' inválido."
            )

def validar_imagenes(productos, errores):

    for fila_excel, producto in enumerate(productos, start=2):

        ruta_imagen = RUTA_IMAGENES / producto["imagen"]

        if not ruta_imagen.exists():

            print(
                f"[AVISO] Fila {fila_excel} | Código: {producto['codigo']} | "
                f"No existe '{producto['imagen']}'. Se utilizará sin-imagen.png."
            )

            producto["imagen"] = "sin-imagen.png"

def validar_marcas(productos, errores):

    for producto in productos:

        if producto["marca"] is None:
            producto["marca"] = ""

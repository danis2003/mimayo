def mostrar_errores(errores):

    mensaje = (
        "===================================\n"
        "ERRORES EN EL EXCEL\n"
        "===================================\n\n"
    )

    for error in errores:
        mensaje += error + "\n"

    mensaje += (
        f"\nSe encontraron {len(errores)} errores.\n"
        "No se generó productos.json."
    )

    return mensaje
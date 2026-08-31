import json

def guardar_json(productos, ruta_json):

    with open(ruta_json, "w", encoding="utf-8") as archivo:
        json.dump(productos, archivo, ensure_ascii=False, indent=4)
        
from pathlib import Path
import sys
from tkinter import filedialog
from shutil import copy2
import os
import platform
import subprocess

ROOT = Path(__file__).resolve().parent.parent

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.actualizar_precios import main as actualizar_precios
from scripts.generar_json import main as generar_json

# Carpeta raíz del proyecto
RAIZ = Path(__file__).resolve().parent.parent

# Carpeta de datos
DATOS = RAIZ / "data"


def importar_excel():

    archivo = filedialog.askopenfilename(
        title="Seleccionar Excel del proveedor",
        filetypes=[
            ("Archivos Excel", "*.xlsx")
        ]
    )

    if not archivo:
        return None

    destino = DATOS / "excel_proveedor.xlsx"

    copy2(archivo, destino)

    return destino


def ejecutar_actualizacion():

    actualizar_precios()

    return True

def abrir_excel_maestro():

    archivo = DATOS / "Excel_Maestro.xlsx"

    if not archivo.exists():
        raise FileNotFoundError(
            "No se encontró Excel_Maestro.xlsx"
        )

    sistema = platform.system()

    if sistema == "Windows":
        os.startfile(archivo)

    elif sistema == "Darwin":
        subprocess.run(["open", archivo])

    else:
        subprocess.run(["xdg-open", archivo])

    return True

def abrir_asistente():

    subprocess.Popen(
        [
            sys.executable,
            str(ROOT / "scripts" / "asistente_imagenes.py")
        ]
    )

    return True

def ejecutar_generacion_json():

    generar_json()

    return True

def publicar_github(mensaje):

    resultado = subprocess.run(
        ["git", "status", "--short"],
        cwd=RAIZ,
        capture_output=True,
        text=True,
        check=False
    )

    if resultado.returncode != 0:

        error = resultado.stderr.strip()

        if not error:
            error = resultado.stdout.strip()

        raise RuntimeError(error)

    if resultado.stdout.strip() == "":
        return "SIN_CAMBIOS"

    comandos = [

        ["git", "add", "."],

        ["git", "commit", "-m", mensaje],

        ["git", "push"]

    ]

    for comando in comandos:

        proceso = subprocess.run(
            comando,
            cwd=RAIZ,
            capture_output=True,
            text=True,
            check=False
        )

        if proceso.returncode != 0:

            error = proceso.stderr.strip()

            if not error:
                error = proceso.stdout.strip()

            raise RuntimeError(error)

    return "OK"

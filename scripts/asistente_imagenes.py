from openpyxl import load_workbook
from pathlib import Path
from scripts.config import HOJA_PRODUCTOS, BASE_DIR, RUTA_ICONO
import tkinter as tk
from tkinter import filedialog, messagebox
# Pillow nos permite abrir, redimensionar y mostrar imágenes.
from PIL import Image, ImageTk, ImageFile
# Permite abrir PNG ligeramente truncados o incompletos
ImageFile.LOAD_TRUNCATED_IMAGES = True
import shutil

# ==========================================
# RUTAS
# ==========================================

EXCEL = BASE_DIR / "data" / "Excel_Maestro.xlsx"

CARPETA_PENDIENTES = BASE_DIR / "img" / "pendientes"

CARPETA_PRODUCTOS = BASE_DIR / "img" / "productos"

# ==========================================
# VARIABLES GLOBALES
# ==========================================

# Guarda la ruta de la imagen seleccionada
archivo_seleccionado = None

# ==========================================
# CARGAR EXCEL
# ==========================================

wb = load_workbook(EXCEL)

ws = wb[HOJA_PRODUCTOS]

# ==========================================
# BUSCAR EL PRIMER PRODUCTO SIN IMAGEN
# Devuelve el primer producto pendiente junto
# con su posición y la cantidad total.
# ==========================================

def obtener_producto_pendiente():

    total_productos = ws.max_row - 1
    numero_producto = 0

    # Recorremos todas las filas del Excel
    for fila in range(2, ws.max_row + 1):

        numero_producto += 1

        imagen = ws[fila][5].value

        # Si la columna Imagen está vacía,
        # encontramos el siguiente producto.
        if imagen is None or str(imagen).strip() == "":

            return {
                "fila": fila,
                "numero": numero_producto,
                "total": total_productos,
                "codigo": ws[fila][0].value,
                "nombre": ws[fila][1].value,
                "marca": ws[fila][2].value,
                "categoria": ws[fila][3].value,
            }

    return None
# ==========================================
# MOSTRAR EL PRODUCTO EN LA INTERFAZ
# Actualiza los Labels con la información
# del producto encontrado.
# ==========================================

def mostrar_producto():

    producto = obtener_producto_pendiente()

    if producto is None:

        lblProducto.config(text="¡No quedan productos pendientes!")

        lblCodigo.config(text="-")
        lblNombre.config(text="-")
        lblMarca.config(text="-")
        lblCategoria.config(text="-")

        return

    lblProducto.config(
        text=f"Producto {producto['numero']} de {producto['total']}"
    )

    lblCodigo.config(text=producto["codigo"])
    lblNombre.config(text=producto["nombre"])
    lblMarca.config(text=producto["marca"])
    lblCategoria.config(text=producto["categoria"])


# ==========================================
# SELECCIONAR IMAGEN
# Abre el explorador y muestra una vista previa.
# No guarda nada todavía.
# ==========================================

def seleccionar_imagen():

    global archivo_seleccionado

    archivo = filedialog.askopenfilename(

        title="Seleccione una imagen",

        filetypes=[
            ("Imágenes", "*.png *.jpg *.jpeg *.webp")
        ]
    )

    if not archivo:
        return

    archivo_seleccionado = archivo
    
    actualizar_estado("Imagen seleccionada. Presione Confirmar para continuar.")

    mostrar_vista_previa(archivo)

    # Habilitar el botón Confirmar
    btnConfirmar.config(state="normal")


# ==========================================
# MOSTRAR VISTA PREVIA
# Carga la imagen elegida y la muestra
# dentro del recuadro.
# ==========================================

def mostrar_vista_previa(ruta):

    # Abrimos la imagen
    imagen = Image.open(ruta)

    # Mantiene la proporción
    imagen.thumbnail((420,420))

    # Conversión para Tkinter
    foto = ImageTk.PhotoImage(imagen)

    # Mostrar la imagen
    lblImagen.config(
        image=foto,
        text=""
    )

    # Evita que Python elimine la imagen
    lblImagen.image = foto

# ==========================================
# GUARDAR IMAGEN
# Convierte la imagen a WEBP, la renombra,
# la mueve a la carpeta productos y
# actualiza el Excel.
# ==========================================

def guardar_imagen():

    global archivo_seleccionado

    if archivo_seleccionado is None:
        return False

    producto = obtener_producto_pendiente()

    if producto is None:
        return False

    # --------------------------------------
    # Nombre final del archivo
    # --------------------------------------

    nuevo_nombre = f"{producto['codigo']}.webp"

    destino = CARPETA_PRODUCTOS / nuevo_nombre

    # --------------------------------------
    # Si ya existe, preguntar si se reemplaza
    # --------------------------------------

    if destino.exists():

        respuesta = messagebox.askyesno(
            "Imagen existente",
            f"Ya existe la imagen:\n\n{nuevo_nombre}\n\n¿Desea reemplazarla?"
        )

        if not respuesta:
            return False
        
    # --------------------------------------
    # Abrir la imagen
    # --------------------------------------
    imagen = Image.open(archivo_seleccionado)

    # --------------------------------------
    # Convertir al modo adecuado
    # --------------------------------------

    # Si la imagen está indexada (PNG con paleta),
    # convertirla a RGBA para conservar transparencia.
    if imagen.mode == "P":
        imagen = imagen.convert("RGBA")

    # Si viene en un formato distinto,
    # convertirlo a RGBA.
    elif imagen.mode not in ("RGB", "RGBA"):
        imagen = imagen.convert("RGBA")

    # --------------------------------------
    # Guardar como WEBP
    # --------------------------------------
    imagen.save(
        destino,
        format="WEBP",
        quality=90,
        method=0
    )

    # Liberar el archivo
    imagen.close()

    # --------------------------------------
    # Verificar que se creó correctamente
    # y mover el original
    # --------------------------------------

    if destino.exists():

        carpeta_procesadas = BASE_DIR / "img" / "procesadas_png"
        carpeta_procesadas.mkdir(exist_ok=True)

        shutil.move(
            archivo_seleccionado,
            carpeta_procesadas / Path(archivo_seleccionado).name
        )
    else:

        messagebox.showerror(
            "Error",
            "No se pudo guardar la imagen."
        )

        return False

    # --------------------------------------
    # Actualizar Excel
    # --------------------------------------

    ws[producto["fila"]][5].value = nuevo_nombre
    wb.save(EXCEL)
    actualizar_estado(f"Imagen guardada: {nuevo_nombre}")
    
    return True

# ==========================================
# CONFIRMAR IMAGEN
# Guarda la imagen y avanza al siguiente
# producto.
# ==========================================

def confirmar_imagen():

    global archivo_seleccionado

    # Guarda la imagen. Si hubo un error, termina la función.
    if not guardar_imagen():
        return

    archivo_seleccionado = None

    btnConfirmar.config(state="disabled")

    lblImagen.config(
        image="",
        text="Vista previa\n\n(Sin imagen)"
    )

    lblImagen.image = None

    # Mostrar el siguiente producto
    mostrar_producto()

    # Esperar 2 segundos antes de cambiar el mensaje
    root.after(
        2000,
        lambda: actualizar_estado(
            "Seleccione una imagen para el siguiente producto."
        )
    )

# ==========================================
# OMITIR IMAGEN
# Asigna la imagen genérica y avanza al
# siguiente producto.
# ==========================================

def omitir_imagen():

    producto = obtener_producto_pendiente()

    if producto is None:
        return

    ws[producto["fila"]][5].value = "sin-imagen.png"
    wb.save(EXCEL)

    btnConfirmar.config(state="disabled")

    lblImagen.config(
        image="",
        text="Vista previa\n\n(Sin imagen)"
    )

    lblImagen.image = None

    mostrar_producto()

    actualizar_estado(
        "Producto omitido. Se asignó la imagen genérica."
    )

    root.after(
        2000,
        lambda: actualizar_estado(
            "Seleccione una imagen para el siguiente producto."
        )
    )
# ==========================================
# ACTUALIZAR ESTADO
# Muestra un mensaje en la barra de estado.
# ==========================================

def actualizar_estado(texto):

    subtitulo.config(text=texto)

    root.update_idletasks()

# ==========================================
# CREACIÓN DE LA VENTANA PRINCIPAL
# ==========================================

# Creamos la ventana principal de la aplicación.
root = tk.Tk()
try:
    root.iconbitmap(str(RUTA_ICONO))
except Exception:
    pass

root.after(
    100,
    lambda: root.focus_force()
)

# Título que aparecerá en la barra superior.
root.title("Asistente de imágenes - Catálogo Mi Mayo")

# Centrar la ventana en la pantalla
root.update_idletasks()

ancho = 1150
alto = 780

x = (root.winfo_screenwidth() - ancho) // 2
y = (root.winfo_screenheight() - alto) // 2

root.geometry(f"{ancho}x{alto}+{x}+{y}")

# Impide que la ventana sea demasiado pequeña.
root.minsize(800, 580)

# Color de fondo.
root.configure(bg="#f3f4f6")

# ==========================================
# TÍTULO PRINCIPAL
# ==========================================

titulo = tk.Label(
    root,
    text="Asistente de imágenes",
    font=("Segoe UI", 22, "bold"),
    bg="#f3f4f6",
)

titulo.pack(pady=(20, 10))

# ==========================================
# SUBTÍTULO
# ==========================================

subtitulo = tk.Label(
    root,
    text="",
    font=("Segoe UI", 11),
    fg="#2563EB",
    bg="#f3f4f6"
)

subtitulo.pack()

# ==========================================
# CONTENEDOR PRINCIPAL
# Agrupa todos los controles de la aplicación.
# ==========================================

frame = tk.Frame(
    root,
    bg="white",
    bd=1,
    relief="solid"
)

frame.pack(
    fill="both",
    expand=True,
    padx=25,
    pady=25
)

# ==========================================
# ESTRUCTURA PRINCIPAL DE LA APLICACIÓN
# ==========================================

# -------------------------------------------------
# Frame superior
# Contendrá:
#   • Imagen del producto (izquierda)
#   • Información del producto (derecha)
# -------------------------------------------------

frameSuperior = tk.Frame(frame, bg="white")

frameSuperior.pack(
    fill="x",
    padx=25,
    pady=20
)


# -------------------------------------------------
# Frame izquierdo
# Vista previa de la imagen
# -------------------------------------------------

frameImagen = tk.Frame(
    frameSuperior,
    bg="#f5f5f5",
    width=440,
    height=440,
    relief="solid",
    bd=1
)

frameImagen.pack(
    side="left",
    padx=(0,30)
)

frameImagen.pack_propagate(False)

# Texto temporal
lblImagen = tk.Label(
    frameImagen,
    text="Vista previa\n\n(Sin imagen)",
    bg="#f5f5f5",
    fg="#777",
    font=("Segoe UI",11)
)

lblImagen.pack(expand=True)

# -------------------------------------------------
# Frame derecho
# Información del producto
# -------------------------------------------------

frameInfo = tk.Frame(
    frameSuperior,
    bg="white"
)

frameInfo.pack(
    side="left",
    anchor="n"
)

# Producto actual

lblProducto = tk.Label(
    frameInfo,
    text="Producto 0 de 0",
    font=("Segoe UI",18,"bold"),
    bg="white"
)

lblProducto.pack(anchor="w", pady=(0,20))

# Código

tk.Label(
    frameInfo,
    text="Código",
    font=("Segoe UI",10,"bold"),
    bg="white"
).pack(anchor="w")

lblCodigo = tk.Label(
    frameInfo,
    text="-",
    font=("Segoe UI",13),
    bg="white"
)

lblCodigo.pack(anchor="w", pady=(0,15))

# Nombre

tk.Label(
    frameInfo,
    text="Nombre",
    font=("Segoe UI",10,"bold"),
    bg="white"
).pack(anchor="w")

lblNombre = tk.Label(
    frameInfo,
    text="-",
    font=("Segoe UI",13),
    bg="white",
    wraplength=320,
    justify="left"
)

lblNombre.pack(anchor="w", pady=(0,15))

# Marca

tk.Label(
    frameInfo,
    text="Marca",
    font=("Segoe UI",10,"bold"),
    bg="white"
).pack(anchor="w")

lblMarca = tk.Label(
    frameInfo,
    text="-",
    font=("Segoe UI",13),
    bg="white"
)

lblMarca.pack(anchor="w", pady=(0,15))

# Categoría

tk.Label(
    frameInfo,
    text="Categoría",
    font=("Segoe UI",10,"bold"),
    bg="white"
).pack(anchor="w")

lblCategoria = tk.Label(
    frameInfo,
    text="-",
    font=("Segoe UI",13),
    bg="white"
)

lblCategoria.pack(anchor="w")

# ==========================================
# BOTÓN SELECCIONAR IMAGEN
# ==========================================

tk.Frame(frameInfo, height=15, bg="white").pack()

btnSeleccionar = tk.Button(
    frameInfo,
    text="📂 Seleccionar imagen",
    font=("Segoe UI", 11, "bold"),
    bg="#2563EB",
    fg="white",
    padx=20,
    pady=10,
    cursor="hand2",
    command=seleccionar_imagen
)

btnSeleccionar.pack(
    anchor="w",
    fill="x"
)

# ==========================================
# BOTÓN CONFIRMAR
# Guarda definitivamente la imagen.
# ==========================================

tk.Frame(frameInfo, height=10, bg="white").pack()

btnConfirmar = tk.Button(
    frameInfo,
    text="✔ Confirmar",
    font=("Segoe UI", 11, "bold"),
    bg="#16A34A",
    fg="white",
    padx=20,
    pady=10,
    cursor="hand2",
    state="disabled",
    command=confirmar_imagen
)

btnConfirmar.pack(
    anchor="w",
    fill="x"
)

# ==========================================
# BOTÓN OMITIR
# Asigna la imagen genérica al producto.
# ==========================================

tk.Frame(frameInfo, height=10, bg="white").pack()

btnOmitir = tk.Button(
    frameInfo,
    text="⏭ Omitir",
    font=("Segoe UI", 11, "bold"),
    bg="#F59E0B",
    fg="white",
    padx=20,
    pady=10,
    cursor="hand2",
    command=omitir_imagen
)

btnOmitir.pack(
    anchor="w",
    fill="x"
)

# ==========================================
# INICIAR LA APLICACIÓN
# ==========================================

def main():
    # Mostrar el primer producto pendiente
    mostrar_producto()
    actualizar_estado("Seleccione una imagen para comenzar.")
    root.mainloop()

if __name__ == "__main__":
    main()

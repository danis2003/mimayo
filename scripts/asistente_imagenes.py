from openpyxl import load_workbook
from pathlib import Path
from scripts.config import (
    HOJA_PRODUCTOS,
    BASE_DIR,
    RUTA_ICONO,
    RUTA_CONFIG
)
import tkinter as tk
from tkinter import filedialog, messagebox
# Pillow nos permite abrir, redimensionar y mostrar imágenes.
from PIL import Image, ImageTk, ImageFile
# Permite abrir PNG ligeramente truncados o incompletos
ImageFile.LOAD_TRUNCATED_IMAGES = True
import shutil
import json
import re

# ==========================================
# RUTAS
# ==========================================

EXCEL = BASE_DIR / "data" / "Excel_Maestro.xlsx"

CARPETA_PENDIENTES = BASE_DIR / "img" / "pendientes"

CARPETA_PRODUCTOS = BASE_DIR / "img" / "productos"
# ==========================================
# CONFIGURACIÓN DE VENTANA
# ==========================================

RUTA_VENTANA_ASISTENTE = (
    RUTA_CONFIG / "asistente_imagenes_ventana.json"
)

# ==========================================
# VARIABLES GLOBALES
# ==========================================

# Imagen utilizada en el flujo normal
archivo_seleccionado = None

# Imágenes seleccionadas para agregar variantes
archivos_variantes = []

# Producto seleccionado para agregar variantes
producto_variantes = None

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
# SELECCIONAR PRODUCTO PARA VARIANTES
# Permite elegir un producto existente del Excel.
# ==========================================

def seleccionar_producto_variantes():

    global producto_variantes
    global archivos_variantes

    ventana = tk.Toplevel(root)
    ventana.title("Seleccionar producto")
    ventana.geometry("900x650")
    ventana.minsize(750, 550)
    ventana.configure(bg="white")

    # ------------------------------------------
    # TÍTULO
    # ------------------------------------------

    tk.Label(
        ventana,
        text="Seleccione el producto",
        font=("Segoe UI", 18, "bold"),
        bg="white"
    ).pack(
        pady=(20, 10)
    )

    # ------------------------------------------
    # BUSCADOR
    # ------------------------------------------

    tk.Label(
        ventana,
        text="Buscar por código o nombre:",
        font=("Segoe UI", 10, "bold"),
        bg="white"
    ).pack(
        anchor="w",
        padx=25
    )

    entrada_busqueda = tk.Entry(
        ventana,
        font=("Segoe UI", 12)
    )

    entrada_busqueda.pack(
        fill="x",
        padx=25,
        pady=(5, 10)
    )

    # ------------------------------------------
    # CONTENEDOR DE LISTA + SCROLLBAR
    # ------------------------------------------

    frameLista = tk.Frame(
        ventana,
        bg="white"
    )

    frameLista.pack(
        fill="both",
        expand=True,
        padx=25,
        pady=5
    )

    scrollbar = tk.Scrollbar(
        frameLista
    )

    scrollbar.pack(
        side="right",
        fill="y"
    )

    lista = tk.Listbox(
        frameLista,
        font=("Segoe UI", 11),
        selectmode=tk.SINGLE,
        yscrollcommand=scrollbar.set
    )

    lista.pack(
        side="left",
        fill="both",
        expand=True
    )

    scrollbar.config(
        command=lista.yview
    )

    # ------------------------------------------
    # CARGAR PRODUCTOS
    # ------------------------------------------

    productos = []

    for fila in range(2, ws.max_row + 1):

        codigo = ws[fila][0].value
        nombre = ws[fila][1].value
        imagen = ws[fila][5].value

        if codigo is not None and nombre is not None:

            productos.append({
                "fila": fila,
                "codigo": codigo,
                "nombre": nombre,
                "imagen": imagen
            })

    # ------------------------------------------
    # ORDENAR POR CÓDIGO ASCENDENTE
    # ------------------------------------------

    def clave_codigo(producto):

        codigo = str(producto["codigo"]).strip()

        try:
            return (0, int(codigo))
        except ValueError:
            return (1, codigo.lower())

    productos.sort(
        key=clave_codigo
    )

    # ------------------------------------------
    # ACTUALIZAR LISTA SEGÚN BÚSQUEDA
    # ------------------------------------------

    productos_filtrados = []

    def actualizar_lista(event=None):

        nonlocal productos_filtrados

        texto = entrada_busqueda.get().strip().lower()

        productos_filtrados = [
            producto
            for producto in productos
            if texto in str(producto["codigo"]).lower()
            or texto in str(producto["nombre"]).lower()
        ]

        lista.delete(
            0,
            "end"
        )

        for producto in productos_filtrados:

            lista.insert(
                "end",
                f"{producto['codigo']} - {producto['nombre']}"
            )

    entrada_busqueda.bind(
        "<KeyRelease>",
        actualizar_lista
    )

    actualizar_lista()

    # ------------------------------------------
    # CONFIRMAR PRODUCTO
    # ------------------------------------------

    def confirmar_producto():

        global producto_variantes
        global archivos_variantes

        seleccion = lista.curselection()

        if not seleccion:

            messagebox.showwarning(
                "Producto",
                "Seleccione un producto."
            )

            return

        producto_variantes = productos_filtrados[
            seleccion[0]
        ]

        archivos_variantes = []

        ventana.destroy()

        actualizar_estado(
            f"Producto seleccionado: "
            f"{producto_variantes['codigo']} - "
            f"{producto_variantes['nombre']}"
        )

        lblCodigo.config(
            text=producto_variantes["codigo"]
        )

        lblNombre.config(
            text=producto_variantes["nombre"]
        )

        if producto_variantes["imagen"]:

            actualizar_estado(
                f"Producto seleccionado. "
                f"Imagen principal: "
                f"{producto_variantes['imagen']}"
            )

    # ------------------------------------------
    # BOTÓN
    # ------------------------------------------

    tk.Button(
        ventana,
        text="Seleccionar producto",
        font=("Segoe UI", 11, "bold"),
        bg="#2563EB",
        fg="white",
        padx=20,
        pady=10,
        cursor="hand2",
        command=confirmar_producto
    ).pack(
        pady=(10, 20)
    )
# ==========================================
# SELECCIONAR IMAGEN
# Abre el explorador y muestra una vista previa.
# No guarda nada todavía.
# ==========================================

def seleccionar_imagen():

    global archivo_seleccionado
    global archivos_variantes

    archivos = filedialog.askopenfilenames(
        title="Seleccione una o varias imágenes",
        filetypes=[
            ("Imágenes", "*.png *.jpg *.jpeg *.jfif *.webp")
        ]
    )

    if not archivos:
        return

    # Guardamos todas las imágenes seleccionadas
    archivos_variantes = list(archivos)

    # Limpiar cualquier previsualización anterior
    limpiar_previsualizacion()

    # La primera también queda registrada como imagen principal
    archivo_seleccionado = archivos_variantes[0]

    actualizar_estado(
        f"{len(archivos_variantes)} imagen(es) seleccionada(s). "
        "Presione Confirmar para continuar."
    )

    # Una sola imagen
    if len(archivos_variantes) == 1:
        mostrar_vista_previa(archivos_variantes[0])

    # Varias imágenes
    else:
        mostrar_previsualizacion_variantes()

    # Un único botón de confirmación
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
# PREVISUALIZAR VARIANTES
# Muestra miniaturas de todas las imágenes
# seleccionadas.
# ==========================================

def mostrar_previsualizacion_variantes():

    # ------------------------------------------
    # Ocultar la vista previa principal
    # ------------------------------------------

    lblImagen.pack_forget()

    # ------------------------------------------
    # Hacer que el área de variantes ocupe
    # todo el recuadro disponible
    # ------------------------------------------

    frameVariantes.pack_forget()

    frameVariantes.pack(
        fill="both",
        expand=True,
        padx=10,
        pady=10
    )

    # ------------------------------------------
    # Limpiar previsualización anterior
    # ------------------------------------------

    for widget in frameVariantes.winfo_children():
        widget.destroy()

    # ------------------------------------------
    # Configurar cuadrícula
    # ------------------------------------------

    columnas = 3

    for columna in range(columnas):
        frameVariantes.grid_columnconfigure(
            columna,
            weight=1
        )

    # ------------------------------------------
    # Crear miniaturas
    # ------------------------------------------

    for indice, ruta in enumerate(archivos_variantes):

        try:

            imagen = Image.open(ruta)

            imagen.thumbnail((120, 120))

            foto = ImageTk.PhotoImage(imagen)

            fila = indice // columnas
            columna = indice % columnas

            contenedor = tk.Frame(
                frameVariantes,
                bg="#f5f5f5",
                bd=1,
                relief="solid"
            )

            contenedor.grid(
                row=fila,
                column=columna,
                padx=5,
                pady=5,
                sticky="nsew"
            )

            label = tk.Label(
                contenedor,
                image=foto,
                bg="#f5f5f5"
            )

            label.image = foto

            label.pack(
                padx=5,
                pady=5
            )

            tk.Label(
                contenedor,
                text=f"Imagen {indice + 1}",
                font=("Segoe UI", 9),
                bg="#f5f5f5"
            ).pack(
                pady=(0, 5)
            )

        except Exception:
            continue

# ==========================================
# Limpiar imagen principal
# ==========================================
def limpiar_previsualizacion():

    # ------------------------------------------
    # Limpiar imagen principal
    # ------------------------------------------

    lblImagen.config(
        image="",
        text="Vista previa\n\n(Sin imagen)"
    )

    lblImagen.image = None

    # ------------------------------------------
    # Limpiar miniaturas
    # ------------------------------------------

    for widget in frameVariantes.winfo_children():
        widget.destroy()

    # ------------------------------------------
    # Restaurar distribución original
    # ------------------------------------------

    frameVariantes.pack_forget()

    lblImagen.pack(
        expand=True
    )

    frameVariantes.pack(
        fill="x",
        padx=10,
        pady=10
    )
# ==========================================
# FUNCION PARA CAMBIAR FORMATO DE IMAGENES A WEBP Y MOVERLAS A /PROCESADAS_PNG
# ==========================================
def procesar_imagen(archivo, nuevo_nombre):
    
    destino = CARPETA_PRODUCTOS / nuevo_nombre

    # --------------------------------------
    # Abrir la imagen
    # --------------------------------------

    imagen = Image.open(archivo)

    # --------------------------------------
    # Convertir al modo adecuado
    # --------------------------------------

    # PNG con paleta → RGBA para conservar transparencia
    if imagen.mode == "P":
        imagen = imagen.convert("RGBA")

    # Otros modos → RGB/RGBA compatible con WEBP
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

    imagen.close()

    # --------------------------------------
    # Verificar y mover original
    # --------------------------------------

    if destino.exists():

        carpeta_procesadas = (
            BASE_DIR / "img" / "procesadas_png"
        )

        carpeta_procesadas.mkdir(
            exist_ok=True
        )

        shutil.move(
            archivo,
            carpeta_procesadas / Path(archivo).name
        )

        return True

    return False
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
    # Procesar imagen
    # --------------------------------------

    if not procesar_imagen(
        archivo_seleccionado,
        nuevo_nombre
    ):
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
# función que guarda las variantes
# ==========================================
def guardar_variantes(producto, archivos):

    if not archivos:
        return True

    VARIANTES_JSON = BASE_DIR / "data" / "variantes.json"

    # ------------------------------------------
    # Cargar variantes existentes
    # ------------------------------------------

    if VARIANTES_JSON.exists():

        try:
            with open(
                VARIANTES_JSON,
                "r",
                encoding="utf-8"
            ) as archivo:

                variantes = json.load(archivo)

        except (json.JSONDecodeError, OSError):

            variantes = {}

    else:
        variantes = {}

    codigo = str(producto["codigo"])

    if codigo not in variantes:
        variantes[codigo] = []

    # ------------------------------------------
    # Determinar siguiente número
    # ------------------------------------------

    existentes = variantes[codigo]

    # ------------------------------------------
    # Determinar próximo número de variante
    # ------------------------------------------

    numeros = []

    patron = re.compile(
        rf"^{re.escape(codigo)}-(\d+)\.webp$"
    )

    for nombre in existentes:

        coincidencia = patron.match(nombre)

        if coincidencia:
            numeros.append(
                int(coincidencia.group(1))
            )

    siguiente = max(numeros, default=1) + 1

    # ------------------------------------------
    # Procesar imágenes
    # ------------------------------------------

    for archivo in archivos:

        nuevo_nombre = (
            f"{codigo}-{siguiente}.webp"
        )

        if procesar_imagen(
            archivo,
            nuevo_nombre
        ):

            variantes[codigo].append(
                nuevo_nombre
            )

            siguiente += 1


    # ------------------------------------------
    # Guardar variantes.json
    # ------------------------------------------

    with open(
        VARIANTES_JSON,
        "w",
        encoding="utf-8"
    ) as archivo:

        json.dump(
            variantes,
            archivo,
            indent=4,
            ensure_ascii=False
        )

    return True
# ==========================================
# CONFIRMAR IMAGEN
# Guarda la imagen y avanza al siguiente
# producto.
# ==========================================

def confirmar_imagen():

    global archivo_seleccionado
    global archivos_variantes
    global producto_variantes

    # ------------------------------------------
    # VALIDAR QUE HAYA IMÁGENES
    # ------------------------------------------

    if not archivos_variantes:
        messagebox.showwarning(
            "Sin imágenes",
            "Seleccione al menos una imagen."
        )
        return

    # ------------------------------------------
    # PRODUCTO EXISTENTE → AGREGAR VARIANTES
    # ------------------------------------------

    if producto_variantes is not None:

        if guardar_variantes(
            producto_variantes,
            archivos_variantes
        ):
            actualizar_estado(
                "Variantes guardadas correctamente."
            )

            producto_variantes = None
            archivo_seleccionado = None
            archivos_variantes = []

            btnConfirmar.config(
                state="disabled"
            )

            limpiar_previsualizacion()

        return

    # ------------------------------------------
    # PRODUCTO SIN IMAGEN
    # ------------------------------------------

    producto = obtener_producto_pendiente()

    if producto is None:
        return

    # La primera imagen es la principal
    archivo_seleccionado = archivos_variantes[0]

    if not guardar_imagen():
        return

    # Si hay más imágenes, son variantes
    if len(archivos_variantes) > 1:

        guardar_variantes(
            producto,
            archivos_variantes[1:]
        )

    # ------------------------------------------
    # LIMPIAR ESTADO
    # ------------------------------------------

    archivo_seleccionado = None
    archivos_variantes = []

    btnConfirmar.config(
        state="disabled"
    )

    limpiar_previsualizacion()

    # Mostrar siguiente producto
    mostrar_producto()

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
# GEOMETRÍA DE LA VENTANA
# ==========================================

def cargar_geometria():

    if not RUTA_VENTANA_ASISTENTE.exists():
        return

    try:

        with open(
            RUTA_VENTANA_ASISTENTE,
            "r",
            encoding="utf-8"
        ) as archivo:

            datos = json.load(archivo)

        root.geometry(
            datos["geometry"]
        )

        if datos.get("state") == "zoomed":

            root.after(
                50,
                lambda: root.state("zoomed")
            )

    except Exception:
        pass


def guardar_geometria():

    try:

        RUTA_CONFIG.mkdir(
            exist_ok=True
        )

        datos = {
            "geometry": root.geometry(),
            "state": root.state()
        }

        with open(
            RUTA_VENTANA_ASISTENTE,
            "w",
            encoding="utf-8"
        ) as archivo:

            json.dump(
                datos,
                archivo,
                indent=4,
                ensure_ascii=False
            )

    except Exception:
        pass


def cerrar_aplicacion():

    guardar_geometria()

    root.destroy()
# ==========================================
# CREACIÓN DE LA VENTANA PRINCIPAL
# ==========================================

# Creamos la ventana principal de la aplicación.
root = tk.Tk()

root.protocol(
    "WM_DELETE_WINDOW",
    cerrar_aplicacion
)
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

# Tamaño inicial de la ventana.

root.geometry("1150x850")

# Impide que la ventana sea demasiado pequeña.

root.minsize(900, 700)
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

titulo.pack(pady=(8, 4))

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

subtitulo.pack(pady=(0, 2))

# ==========================================
# LEYENDA DE USO
# ==========================================

instrucciones = tk.Label(
    root,
    text=(
        "¿Qué desea hacer?\n"
        "• Producto sin imagen → "
        "Seleccionar imagen y elegir una o varias imágenes.\n"
        "• Producto con imagen → "
        "Agregar variantes para incorporar imágenes adicionales.\n"
        "• Confirmar → guarda las imágenes seleccionadas.\n"
        "• Omitir → asigna la imagen genérica y continúa."
    ),
    font=("Segoe UI", 10),
    fg="#555",
    bg="#f3f4f6",
    justify="left",
    anchor="w",
    wraplength=1000
)

instrucciones.pack(
    padx=30,
    pady=(2, 4),
    anchor="w"
)
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

frameVariantes = tk.Frame(
    frameImagen,
    bg="#f5f5f5"
)

frameVariantes.pack(
    fill="x",
    padx=10,
    pady=10
)
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
# BOTÓN AGREGAR VARIANTES
# Permite seleccionar un producto existente
# y agregarle imágenes adicionales.
# ==========================================

tk.Frame(
    frameInfo,
    height=10,
    bg="white"
).pack()

btnVariantes = tk.Button(
    frameInfo,
    text="🖼 Agregar variantes",
    font=("Segoe UI", 11, "bold"),
    bg="#7C3AED",
    fg="white",
    padx=20,
    pady=10,
    cursor="hand2",
    command=seleccionar_producto_variantes
)

btnVariantes.pack(
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
    cargar_geometria()
    root.mainloop()

if __name__ == "__main__":
    main()

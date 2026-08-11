import customtkinter as ctk
from tkinter import filedialog, messagebox
from pathlib import Path
from PIL import Image, ImageFile
from rembg import remove, new_session
sesion_rembg = new_session("birefnet-general")
import threading
import shutil

from scripts.config import BASE_DIR, RUTA_ICONO


# ==========================================
# CONFIGURACIÓN
# ==========================================

TAMAÑO_LIENZO = 800
OCUPACION = 0.90
TAMAÑO_PRODUCTO = int(TAMAÑO_LIENZO * OCUPACION)

EXTENSIONES_VALIDAS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".jfif",
    ".webp",
}

CARPETA_ENTRADA = BASE_DIR / "img" / "pendientes"
CARPETA_NORMALIZADAS = BASE_DIR / "img" / "normalizadas"
CARPETA_ORIGINALES = BASE_DIR / "img" / "originales_descargadas"


ImageFile.LOAD_TRUNCATED_IMAGES = True


# ==========================================
# UTILIDADES
# ==========================================

def obtener_nombre_disponible(carpeta, nombre):
    """
    Evita sobrescribir archivos existentes.
    Ejemplo:
        producto.png
        producto_1.png
        producto_2.png
    """

    destino = carpeta / nombre

    if not destino.exists():
        return destino

    contador = 1

    while True:
        nuevo_nombre = f"{destino.stem}_{contador}{destino.suffix}"
        nuevo_destino = carpeta / nuevo_nombre

        if not nuevo_destino.exists():
            return nuevo_destino

        contador += 1


def normalizar_imagen(ruta_origen):
    """
    Procesa una imagen:

    1. Elimina el fondo.
    2. Obtiene el área visible del producto.
    3. Redimensiona conservando proporción.
    4. Lo centra en un lienzo transparente 800x800.
    5. Guarda el resultado como PNG.
    6. Mueve el original a originales_descargadas.
    """

    ruta_origen = Path(ruta_origen)

    # --------------------------------------
    # Abrir imagen
    # --------------------------------------

    imagen = Image.open(ruta_origen).convert("RGBA")

    # --------------------------------------
    # Eliminar fondo
    # --------------------------------------

    imagen_sin_fondo = remove(imagen, session=sesion_rembg)

    if not imagen_sin_fondo.getbbox():
        raise ValueError(
            "No se pudo detectar el producto."
        )

    # --------------------------------------
    # Recortar al contenido visible
    # --------------------------------------

    bbox = imagen_sin_fondo.getbbox()

    producto = imagen_sin_fondo.crop(bbox)

    # --------------------------------------
    # Redimensionar manteniendo proporción
    # --------------------------------------

    ancho, alto = producto.size

    escala = TAMAÑO_PRODUCTO / max(ancho, alto)

    nuevo_ancho = max(1, int(ancho * escala))
    nuevo_alto = max(1, int(alto * escala))

    producto = producto.resize(
        (nuevo_ancho, nuevo_alto),
        Image.Resampling.LANCZOS,
    )

    # --------------------------------------
    # Crear lienzo transparente
    # --------------------------------------

    lienzo = Image.new(
        "RGBA",
        (TAMAÑO_LIENZO, TAMAÑO_LIENZO),
        (0, 0, 0, 0),
    )

    # --------------------------------------
    # Centrar producto
    # --------------------------------------

    posicion_x = (TAMAÑO_LIENZO - nuevo_ancho) // 2
    posicion_y = (TAMAÑO_LIENZO - nuevo_alto) // 2

    lienzo.alpha_composite(
        producto,
        (posicion_x, posicion_y),
    )

    # --------------------------------------
    # Nombre de salida
    # --------------------------------------

    nombre_salida = f"{ruta_origen.stem}.png"

    destino_normalizado = obtener_nombre_disponible(
        CARPETA_NORMALIZADAS,
        nombre_salida,
    )

    # --------------------------------------
    # Guardar normalizada
    # --------------------------------------

    lienzo.save(
        destino_normalizado,
        format="PNG",
    )

    # --------------------------------------
    # Mover original
    # --------------------------------------

    destino_original = obtener_nombre_disponible(
        CARPETA_ORIGINALES,
        ruta_origen.name,
    )

    shutil.move(
        str(ruta_origen),
        str(destino_original),
    )

    return destino_normalizado


# ==========================================
# INTERFAZ
# ==========================================

class Normalizador(ctk.CTk):

    def __init__(self):
        super().__init__()

        self.title("Normalizador de imágenes")
        self.geometry("850x650")
        self.minsize(750, 550)

        if RUTA_ICONO.exists():
            try:
                self.iconbitmap(str(RUTA_ICONO))
            except Exception:
                pass

        self.crear_interfaz()

    # ======================================
    # INTERFAZ
    # ======================================

    def crear_interfaz(self):

        titulo = ctk.CTkLabel(
            self,
            text="Normalizador de imágenes",
            font=("Segoe UI", 26, "bold"),
        )

        titulo.pack(
            pady=(25, 5)
        )

        descripcion = ctk.CTkLabel(
            self,
            text=(
                "Prepara imágenes de productos para el catálogo.\n"
                "600 × 600 px · Fondo transparente · 90% de ocupación"
            ),
            font=("Segoe UI", 14),
        )

        descripcion.pack(
            pady=(0, 25)
        )

        # ----------------------------------
        # Carpeta de entrada
        # ----------------------------------

        self.frame_carpeta = ctk.CTkFrame(
            self,
            corner_radius=12,
        )

        self.frame_carpeta.pack(
            fill="x",
            padx=30,
            pady=10,
        )

        self.lbl_carpeta = ctk.CTkLabel(
            self.frame_carpeta,
            text=f"Carpeta de entrada:\n{CARPETA_ENTRADA}",
            justify="left",
            anchor="w",
        )

        self.lbl_carpeta.pack(
            side="left",
            fill="x",
            expand=True,
            padx=20,
            pady=15,
        )

        self.btn_carpeta = ctk.CTkButton(
            self.frame_carpeta,
            text="Seleccionar carpeta",
            command=self.seleccionar_carpeta,
            width=170,
        )

        self.btn_carpeta.pack(
            side="right",
            padx=20,
        )

        # ----------------------------------
        # Información del lote
        # ----------------------------------

        self.lbl_info = ctk.CTkLabel(
            self,
            text="Preparado para procesar imágenes.",
            font=("Segoe UI", 14),
        )

        self.lbl_info.pack(
            pady=(20, 10)
        )

        # ----------------------------------
        # Progreso
        # ----------------------------------

        self.progreso = ctk.CTkProgressBar(
            self,
            width=650,
        )

        self.progreso.set(0)

        self.progreso.pack(
            pady=10,
        )

        # ----------------------------------
        # Imagen actual
        # ----------------------------------

        self.lbl_actual = ctk.CTkLabel(
            self,
            text="",
            font=("Segoe UI", 12),
        )

        self.lbl_actual.pack(
            pady=5
        )

        # ----------------------------------
        # Botón procesar
        # ----------------------------------

        self.btn_procesar = ctk.CTkButton(
            self,
            text="Normalizar imágenes",
            height=45,
            font=("Segoe UI", 15, "bold"),
            command=self.iniciar_proceso,
        )

        self.btn_procesar.pack(
            padx=30,
            pady=(25, 10),
            fill="x",
        )

        # ----------------------------------
        # Estado
        # ----------------------------------

        self.lbl_estado = ctk.CTkLabel(
            self,
            text="Listo.",
            font=("Segoe UI", 12),
        )

        self.lbl_estado.pack(
            pady=5
        )

    # ======================================
    # SELECCIONAR CARPETA
    # ======================================

    def seleccionar_carpeta(self):

        carpeta = filedialog.askdirectory(
            title="Seleccione la carpeta con las imágenes",
            initialdir=str(CARPETA_ENTRADA),
        )

        if not carpeta:
            return

        self.carpeta_seleccionada = Path(carpeta)

        self.lbl_carpeta.configure(
            text=f"Carpeta de entrada:\n{self.carpeta_seleccionada}"
        )

        cantidad = self.contar_imagenes()

        self.lbl_info.configure(
            text=f"{cantidad} imagen(es) encontrada(s)."
        )

    # ======================================
    # CONTAR IMÁGENES
    # ======================================

    def contar_imagenes(self):

        carpeta = getattr(
            self,
            "carpeta_seleccionada",
            CARPETA_ENTRADA,
        )

        if not carpeta.exists():
            return 0

        return sum(
            1
            for archivo in carpeta.iterdir()
            if archivo.is_file()
            and archivo.suffix.lower() in EXTENSIONES_VALIDAS
        )

    # ======================================
    # INICIAR PROCESO
    # ======================================

    def iniciar_proceso(self):

        carpeta = getattr(
            self,
            "carpeta_seleccionada",
            CARPETA_ENTRADA,
        )

        if not carpeta.exists():
            messagebox.showwarning(
                "Carpeta no encontrada",
                "La carpeta seleccionada no existe.",
            )
            return

        imagenes = [
            archivo
            for archivo in carpeta.iterdir()
            if archivo.is_file()
            and archivo.suffix.lower() in EXTENSIONES_VALIDAS
        ]

        if not imagenes:
            messagebox.showinfo(
                "Sin imágenes",
                "No se encontraron imágenes para procesar.",
            )
            return

        respuesta = messagebox.askyesno(
            "Confirmar procesamiento",
            (
                f"Se encontraron {len(imagenes)} imagen(es).\n\n"
                "Las imágenes procesadas serán:\n"
                "• normalizadas a 600 × 600 px\n"
                "• convertidas a fondo transparente\n"
                "• guardadas en img/normalizadas/\n"
                "• movidas a img/originales_descargadas/\n\n"
                "¿Desea continuar?"
            ),
        )

        if not respuesta:
            return

        self.btn_procesar.configure(
            state="disabled"
        )

        self.btn_carpeta.configure(
            state="disabled"
        )

        self.progreso.set(0)

        hilo = threading.Thread(
            target=self.procesar_lote,
            args=(imagenes,),
            daemon=True,
        )

        hilo.start()

    # ======================================
    # PROCESAR LOTE
    # ======================================

    def procesar_lote(self, imagenes):

        total = len(imagenes)
        correctas = 0
        errores = []

        CARPETA_NORMALIZADAS.mkdir(
            parents=True,
            exist_ok=True,
        )

        CARPETA_ORIGINALES.mkdir(
            parents=True,
            exist_ok=True,
        )

        for indice, imagen in enumerate(imagenes, start=1):

            self.after(
                0,
                lambda i=indice, t=total, nombre=imagen.name:
                    self.actualizar_progreso(i, t, nombre)
            )

            try:

                normalizar_imagen(imagen)

                correctas += 1

            except Exception as error:

                errores.append(
                    f"{imagen.name}: {error}"
                )

        self.after(
            0,
            lambda: self.finalizar_proceso(
                total,
                correctas,
                errores,
            )
        )

    # ======================================
    # ACTUALIZAR PROGRESO
    # ======================================

    def actualizar_progreso(
        self,
        indice,
        total,
        nombre,
    ):

        porcentaje = indice / total

        self.progreso.set(
            porcentaje
        )

        self.lbl_info.configure(
            text=f"Procesando {indice} de {total}"
        )

        self.lbl_actual.configure(
            text=nombre
        )

    # ======================================
    # FINALIZAR
    # ======================================

    def finalizar_proceso(
        self,
        total,
        correctas,
        errores,
    ):

        self.btn_procesar.configure(
            state="normal"
        )

        self.btn_carpeta.configure(
            state="normal"
        )

        self.lbl_estado.configure(
            text=(
                f"Proceso terminado: "
                f"{correctas} de {total} imagen(es) procesadas."
            )
        )

        self.lbl_actual.configure(
            text=""
        )

        if errores:

            detalle = "\n".join(
                errores[:15]
            )

            if len(errores) > 15:
                detalle += (
                    f"\n\n... y {len(errores) - 15} "
                    "error(es) más."
                )

            messagebox.showwarning(
                "Proceso terminado con errores",
                (
                    f"Procesadas correctamente: {correctas}\n"
                    f"Con errores: {len(errores)}\n\n"
                    f"{detalle}"
                ),
            )

        else:

            messagebox.showinfo(
                "Proceso terminado",
                (
                    f"Se procesaron correctamente "
                    f"{correctas} imagen(es).\n\n"
                    "Las imágenes normalizadas se encuentran en:\n"
                    "img/normalizadas/\n\n"
                    "Los originales fueron movidos a:\n"
                    "img/originales_descargadas/"
                ),
            )


# ==========================================
# EJECUCIÓN
# ==========================================

if __name__ == "__main__":

    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")

    app = Normalizador()
    app.mainloop()
import customtkinter as ctk
from tkinter import filedialog, messagebox
from pathlib import Path
from PIL import Image, ImageFile
import threading
import shutil
import time
import json

from scripts.config import (
    BASE_DIR,
    RUTA_ICONO,
    RUTA_CONFIG,
    RUTA_NORMALIZADOR_VENTANA,
)

sesion_rembg = None
remove = None
motor_rembg_listo = False


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
# CARGA DEL MOTOR REMBG
# ==========================================

def cargar_motor_rembg():

    global sesion_rembg
    global remove
    global motor_rembg_listo

    try:

        from rembg import remove as rembg_remove, new_session

        remove = rembg_remove

        motor_rembg_listo = True

    except Exception as error:

        motor_rembg_listo = False

        print(f"Error al cargar rembg: {error}")

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
    inicio = time.perf_counter()

    global sesion_rembg

    if sesion_rembg is None:

        from rembg import new_session

        sesion_rembg = new_session("bria-rmbg")

    ruta_origen = Path(ruta_origen)

    imagen = Image.open(ruta_origen).convert("RGBA")
    t_entrada = time.perf_counter()

    imagen_sin_fondo = remove(
        imagen,
        session=sesion_rembg,
    )
    tiempo_bria = time.perf_counter() - t_entrada
    t_post = time.perf_counter()

    if not imagen_sin_fondo.getbbox():
        raise ValueError(
            "No se pudo detectar el producto."
        )

    bbox = imagen_sin_fondo.getbbox()

    producto = imagen_sin_fondo.crop(bbox)

    ancho, alto = producto.size

    escala = TAMAÑO_PRODUCTO / max(ancho, alto)

    nuevo_ancho = max(
        1,
        int(ancho * escala)
    )

    nuevo_alto = max(
        1,
        int(alto * escala)
    )

    producto = producto.resize(
        (nuevo_ancho, nuevo_alto),
        Image.Resampling.LANCZOS,
    )

    lienzo = Image.new(
        "RGBA",
        (TAMAÑO_LIENZO, TAMAÑO_LIENZO),
        (0, 0, 0, 0),
    )

    posicion_x = (
        TAMAÑO_LIENZO - nuevo_ancho
    ) // 2

    posicion_y = (
        TAMAÑO_LIENZO - nuevo_alto
    ) // 2

    lienzo.alpha_composite(
        producto,
        (posicion_x, posicion_y),
    )

    nombre_salida = f"{ruta_origen.stem}.png"

    destino_normalizado = obtener_nombre_disponible(
        CARPETA_NORMALIZADAS,
        nombre_salida,
    )

    lienzo.save(
        destino_normalizado,
        format="PNG",
    )

    destino_original = obtener_nombre_disponible(
        CARPETA_ORIGINALES,
        ruta_origen.name,
    )

    shutil.move(
        str(ruta_origen),
        str(destino_original),
    )

    tiempo_post = time.perf_counter() - t_post
    tiempo_total = time.perf_counter() - inicio

    return {
        "destino": destino_normalizado,
        "bria": tiempo_bria,
        "post": tiempo_post,
        "total": tiempo_total,
    }


#return destino_normalizado
# ==========================================
# INTERFAZ
# ==========================================

class Normalizador(ctk.CTk):

    def __init__(self):
        super().__init__()
        self.carpeta_seleccionada = CARPETA_ENTRADA
        self.imagenes_seleccionadas = None

        self.title("Normalizador de imágenes")
        self.geometry("850x650")
        self.minsize(750, 550)

        if RUTA_ICONO.exists():
            try:
                self.iconbitmap(str(RUTA_ICONO))
            except Exception:
                pass

        self.crear_interfaz()

        self.cargar_geometria()
        self.protocol("WM_DELETE_WINDOW", self.cerrar_aplicacion)

        self.lbl_estado.configure(
            text="Preparando motor de imágenes..."
        )

        threading.Thread(
            target=self.preparar_motor,
            daemon=True
        ).start()

    # ======================================
    # GEOMETRÍA DE LA VENTANA
    # ======================================

    def cargar_geometria(self):

        if not RUTA_NORMALIZADOR_VENTANA.exists():
            return

        try:

            with open(RUTA_NORMALIZADOR_VENTANA, "r", encoding="utf-8") as archivo:
                datos = json.load(archivo)

            self.geometry(datos["geometry"])

            if datos.get("state") == "zoomed":
                self.after(
                    50,
                    lambda: self.state("zoomed")
                )

        except Exception:
            pass


    def guardar_geometria(self):

        try:

            RUTA_CONFIG.mkdir(exist_ok=True)

            datos = {
                "geometry": self.geometry(),
                "state": self.state()
            }

            with open(RUTA_NORMALIZADOR_VENTANA, "w", encoding="utf-8") as archivo:

                json.dump(
                    datos,
                    archivo,
                    indent=4,
                    ensure_ascii=False
                )

        except Exception:
            pass


    def cerrar_aplicacion(self):

        self.guardar_geometria()

        self.destroy()

    def preparar_motor(self):

        cargar_motor_rembg()

        if motor_rembg_listo:

            self.after(
                0,
                lambda: self.lbl_estado.configure(
                    text="Motor listo. Preparado para normalizar."
                )
            )

        else:

            self.after(
                0,
                lambda: self.lbl_estado.configure(
                    text="Error al preparar el motor."
                )
            )

    # ======================================
    # INTERFAZ
    # ======================================

    def crear_interfaz(self):

        titulo = ctk.CTkLabel(
            self,
            text="Normalizador de imágenes",
            font=("Segoe UI", 29, "bold"),
        )

        titulo.pack(
            pady=(25, 5)
        )

        descripcion = ctk.CTkLabel(
            self,
            text=(
                "Prepara imágenes de productos para el catálogo.\n"
                "800 × 800 px · Fondo transparente · 90% de ocupación"
            ),
            font=("Segoe UI", 17),
        )

        descripcion.pack(
            pady=(0, 25)
        )

        self.frame_carpeta = ctk.CTkFrame(
            self,
            corner_radius=12,
        )

        self.frame_carpeta.pack(
            fill="x",
            padx=30,
            pady=10,
        )

        # ----------------------------------
        # Carpeta de entrada
        # ----------------------------------

        self.btn_imagenes = ctk.CTkButton(
            self.frame_carpeta,
            text="Seleccionar imágenes",
            command=self.seleccionar_imagenes,
            width=170,
        )

        self.btn_imagenes.pack(
            side="right",
            padx=10,
        )

        self.btn_carpeta = ctk.CTkButton(
            self.frame_carpeta,
            text="Seleccionar carpeta",
            command=self.seleccionar_carpeta,
            width=170,
        )

        self.btn_carpeta.pack(
            side="right",
            padx=10,
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


        # ----------------------------------
        # Información del lote
        # ----------------------------------

        self.lbl_info = ctk.CTkLabel(
            self,
            text="Preparado para procesar imágenes.",
            font=("Segoe UI", 16),
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
            font=("Segoe UI", 16),
        )

        self.lbl_actual.pack(
            pady=5
        )

        # ----------------------------------
        # Estadísticas
        # ----------------------------------

        self.lbl_estadisticas = ctk.CTkLabel(
            self,
            text="",
            font=("Segoe UI", 16),
            justify="left",
        )

        self.lbl_estadisticas.pack(
            pady=(10, 5)
        )

        # ----------------------------------
        # Botón procesar
        # ----------------------------------

        self.btn_procesar = ctk.CTkButton(
            self,
            text="Normalizar imágenes",
            height=45,
            font=("Segoe UI", 16, "bold"),
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
            font=("Segoe UI", 16),
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

        self.imagenes_seleccionadas = None
        self.carpeta_seleccionada = Path(carpeta)

        self.lbl_carpeta.configure(
            text=f"Carpeta de entrada:\n{self.carpeta_seleccionada}"
        )

        cantidad = self.contar_imagenes()

        self.lbl_info.configure(
            text=f"{cantidad} imagen(es) encontrada(s)."
        )
    # ======================================
    # SELECCIONAR IMÁGENES
    # ======================================

    def seleccionar_imagenes(self):

        imagenes = filedialog.askopenfilenames(
            title="Seleccione las imágenes a normalizar",
            initialdir=str(CARPETA_ENTRADA),
            filetypes=[
                (
                    "Imágenes",
                    "*.png *.jpg *.jpeg *.jfif *.webp"
                ),
                ("Todos los archivos", "*.*"),
            ],
        )

        if not imagenes:
            return

        self.imagenes_seleccionadas = [
            Path(imagen)
            for imagen in imagenes
        ]

        self.carpeta_seleccionada = (
            self.imagenes_seleccionadas[0].parent
        )

        self.lbl_carpeta.configure(
            text=(
                f"Imágenes seleccionadas: "
                f"{len(self.imagenes_seleccionadas)}\n"
                f"{self.carpeta_seleccionada}"
            )
        )

        self.lbl_info.configure(
            text=(
                f"{len(self.imagenes_seleccionadas)} "
                f"imagen(es) seleccionada(s)."
            )
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

        if not motor_rembg_listo:

            self.lbl_estado.configure(
                text="El motor todavía se está preparando. Espere unos segundos e inténtelo nuevamente."
            )

            return

        carpeta = getattr(
            self,
            "carpeta_seleccionada",
            CARPETA_ENTRADA,
        )

        if not carpeta.exists():

            self.lbl_estado.configure(
                text="La carpeta seleccionada no existe."
            )

            return

        if self.imagenes_seleccionadas is not None:

            imagenes = self.imagenes_seleccionadas.copy()

        else:

            imagenes = [
                archivo
                for archivo in carpeta.iterdir()
                if archivo.is_file()
                and archivo.suffix.lower() in EXTENSIONES_VALIDAS
            ]

        if not imagenes:

            self.lbl_estado.configure(
                text="No se encontraron imágenes para procesar."
            )

            return

        self.btn_procesar.configure(
            state="disabled"
        )

        self.btn_carpeta.configure(
            state="disabled"
        )

        self.btn_imagenes.configure(
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
        tiempo_inicio = time.perf_counter()

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
                resultado = normalizar_imagen(imagen)

                correctas += 1

                self.after(
                    0,
                    lambda r=resultado:
                        self.actualizar_estadisticas(r)
                )

            except Exception as error:

                errores.append(
                    f"{imagen.name}: {error}"
                )
        tiempo_total = time.perf_counter() - tiempo_inicio
        promedio = tiempo_total / total

        self.after(
            0,
            lambda: self.finalizar_proceso(
                total,
                correctas,
                errores,
                tiempo_total,
                promedio,
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

    def actualizar_estadisticas(
        self,
        resultado,
        ):

        self.lbl_estadisticas.configure(
            text=(
                f"Última imagen: {resultado['total']:.2f} s\n"
                f"BRIA: {resultado['bria']:.2f} s · "
                f"Postprocesado: {resultado['post']:.2f} s"
            )
        )

    # ======================================
    # FINALIZAR
    # ======================================

    def finalizar_proceso(
        self,
        total,
        correctas,
        errores,
        tiempo_total,
        promedio,
    ):

        self.btn_procesar.configure(
            state="normal"
        )

        self.btn_carpeta.configure(
            state="normal"
        )

        self.btn_imagenes.configure(
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

        self.lbl_estadisticas.configure(
            text=(
                f"Imágenes: {total}\n"
                f"Correctas: {correctas} · Errores: {len(errores)}\n"
                f"Tiempo total: {tiempo_total:.2f} s\n"
                f"Promedio por imagen: {promedio:.2f} s"
            )
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



# ==========================================
# EJECUCIÓN
# ==========================================

if __name__ == "__main__":

    ctk.set_appearance_mode("light")
    ctk.set_default_color_theme("blue")

    app = Normalizador()
    app.mainloop()
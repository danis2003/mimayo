import customtkinter as ctk
from datetime import datetime
from estilos import *
import threading
import time
from acciones import (
    importar_excel,
    ejecutar_actualizacion,
    abrir_excel_maestro,
    abrir_asistente,
    ejecutar_generacion_json,
    publicar_github
)

class App(ctk.CTk):

    def __init__(self):
        super().__init__()

        self.title("Catálogo Mi Mayo")
        self.geometry("1120x760")
        self.minsize(1080, 730)

        # Configuración principal de la ventana
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1) # El dashboard se expande
        self.grid_rowconfigure(3, weight=0) # El registro mantiene su tamaño

        self.crear_interfaz()

    # =========================================================

    def crear_interfaz(self):

        titulo = ctk.CTkLabel(
            self,
            text="Catálogo Mi Mayo",
            font=FUENTE_TITULO
        )

        titulo.grid(
            row=0,
            column=0,
            pady=(15, 5)
        )

        self.indicador_estado = ctk.CTkLabel(
            self,
            text="🟢 Sistema listo",
            font=FUENTE_ESTADO,
            text_color="#2E8B57"
        )

        self.indicador_estado.grid(
            row=1,
            column=0,
            pady=(0, 10)
        )

        self.barra = ctk.CTkProgressBar(
            self,
            width=450,
            mode="indeterminate"
        )

        self.barra.grid(
            row=2,
            column=0,
            pady=(0, 10)
        )

        self.barra.grid_remove()

        # =====================================================
        # DASHBOARD
        # =====================================================

        self.dashboard = ctk.CTkFrame(
            self,
            fg_color="transparent"
        )

        self.dashboard.grid(
            row=3,
            column=0,
            sticky="nsew",
            padx=20,
            pady=(0, 10)
        )

        # Configuración vital para que las tarjetas se distribuyan uniformemente
        self.dashboard.grid_columnconfigure((0, 1), weight=1, uniform="col")
        self.dashboard.grid_rowconfigure((0, 1, 2), weight=1, uniform="row")

        # =====================================================
        # TARJETAS
        # =====================================================

        self.lbl_excel = self.crear_tarjeta(
            fila=0,
            columna=0,
            titulo="📄 Excel proveedor",
            descripcion="Importar la lista recibida del proveedor.",
            informacion="🔴 Archivo: No seleccionado",
            texto_boton="Importar Excel",
            comando=self.importar_excel_click
        )

        self.lbl_actualizacion = self.crear_tarjeta(
            fila=0,
            columna=1,
            titulo="💲 Actualización",
            descripcion="Actualizar el Excel Maestro.",
            informacion="🟡 Nunca ejecutado",
            texto_boton="Actualizar precios",
            comando=self.actualizar_precios_click
        )

        self.lbl_maestro = self.crear_tarjeta(
            fila=1,
            columna=0,
            titulo="📋 Excel Maestro",
            descripcion="Abrir el Excel Maestro.",
            informacion="🟢 Disponible",
            texto_boton="Abrir Excel",
            comando=self.abrir_excel_click
        )

        self.lbl_imagenes = self.crear_tarjeta(
            fila=1,
            columna=1,
            titulo="🖼 Asistente de imágenes",
            descripcion="Administrar las imágenes del catálogo.",
            informacion="🟢 Sin pendientes",
            texto_boton="Abrir asistente",
            comando=self.abrir_asistente_click
        )

        self.lbl_json = self.crear_tarjeta(
            fila=2,
            columna=0,
            titulo="🌐 Catálogo Web",
            descripcion="Regenerar el archivo productos.json.",
            informacion="🟡 No generado",
            texto_boton="Regenerar Catálogo JSON",
            comando=self.generar_json_click
        )

        self.lbl_github = self.crear_tarjeta(
            fila=2,
            columna=1,
            titulo="🚀 Publicación",
            descripcion="Publicar los cambios en GitHub Pages.",
            informacion="🔴 Nunca publicado",
            texto_boton="Publicar",
            comando=self.publicar_click
        )

        # =====================================================
        # REGISTRO
        # =====================================================

        self.frame_eventos = ctk.CTkFrame(
            self,
            corner_radius=12
        )

        self.frame_eventos.grid(
            row=4,
            column=0,
            sticky="ew",
            padx=20,
            pady=(0, 15)
        )

        lbl = ctk.CTkLabel(
            self.frame_eventos,
            text="Registro de actividad",
            font=FUENTE_PANEL
        )

        lbl.pack(
            anchor="w",
            padx=20,
            pady=(10, 5)
        )

        self.txt_eventos = ctk.CTkTextbox(
            self.frame_eventos,
            height=85
        )

        self.txt_eventos.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=(0, 15)
        )

        self.txt_eventos.insert(
            "end",
            "• Aplicación iniciada correctamente.\n"
        )

        self.txt_eventos.configure(
            state="disabled"
        )

    # =========================================================

    def crear_tarjeta(
        self,
        fila,
        columna,
        titulo,
        descripcion,
        informacion,
        texto_boton,
        comando=None
    ):

        tarjeta = ctk.CTkFrame(
            self.dashboard,
            corner_radius=12,
        )

        tarjeta.grid(
            row=fila,
            column=columna,
            padx=10,
            pady=8, # Reducido un poco para dar más espacio vertical
            sticky="nsew"
        )

        tarjeta.grid_columnconfigure(0, weight=1)
        # Hacemos que el espacio sobrante empuje la info y el botón hacia abajo
        tarjeta.grid_rowconfigure(2, weight=1)

        lbl_titulo = ctk.CTkLabel(
            tarjeta,
            text=titulo,
            font=FUENTE_PANEL
        )

        lbl_titulo.grid(
            row=0,
            column=0,
            sticky="w",
            padx=20,
            pady=(12, 5)
        )

        lbl_descripcion = ctk.CTkLabel(
            tarjeta,
            text=descripcion,
            font=FUENTE_DESCRIPCION,
            justify="left",
            wraplength=420
        )

        lbl_descripcion.grid(
            row=1,
            column=0,
            sticky="w",
            padx=20
        )

        separador = ctk.CTkFrame(
            tarjeta,
            height=2,
            fg_color="#D8D8D8"
        )

        separador.grid(
            row=2,
            column=0,
            sticky="ew",
            padx=20,
            pady=(10, 10)
        )

        lbl_info = ctk.CTkLabel(
            tarjeta,
            text=informacion,
            font=FUENTE_ESTADO,
            justify="left",
            anchor="w",
            text_color="#0F766E"
        )

        lbl_info.grid(
            row=3,
            column=0,
            sticky="sw",
            padx=20,
            pady=(0, 10)
        )
        boton = ctk.CTkButton(
            tarjeta,
            text=texto_boton,
            height=38,
            font=FUENTE_BOTON,
            command=comando
        )
        if not hasattr(self, "botones"):
            self.botones = []

        self.botones.append(boton)


        boton.grid(
            row=4,
            column=0,
            sticky="ew",
            padx=20,
            pady=(0, 15)
        )

        return lbl_info

    # =========================================================

    def agregar_evento(self, texto):

        hora = datetime.now().strftime("%H:%M:%S")

        self.txt_eventos.configure(
            state="normal"
        )

        self.txt_eventos.insert(
            "end",
            f"[{hora}] {texto}\n"
        )

        self.txt_eventos.see("end")

        self.txt_eventos.configure(
            state="disabled"
        )

    # =========================================================

    def actualizar_estado(
        self,
        texto,
        color="#2E8B57"
    ):

        self.indicador_estado.configure(
            text=texto,
            text_color=color
        )

    def mostrar_progreso(self):

        self.barra.grid()

        self.barra.start()


    def ocultar_progreso(self):

        self.barra.stop()

        self.barra.grid_remove()

    def deshabilitar_botones(self):

        for boton in self.botones:

            boton.configure(
                state="disabled"
            )

    def habilitar_botones(self):

        for boton in self.botones:

            boton.configure(
                state="normal"
            )

    def ejecutar_en_segundo_plano(self, tarea):

        def worker():

            try:

                tarea()

            finally:

                self.after(
                    0,
                    self.ocultar_progreso
                )

                self.after(
                    0,
                    self.habilitar_botones
                )

        self.deshabilitar_botones()

        self.mostrar_progreso()

        threading.Thread(
            target=worker,
            daemon=True
        ).start()


    def importar_excel_click(self):

        archivo = importar_excel()

        if archivo is None:
            return

        self.lbl_excel.configure(
            text=f"🟢 Archivo: {archivo.name}"
        )

        self.actualizar_estado(
            "🟢 Excel importado correctamente"
        )

        self.agregar_evento(
            f"Excel importado: {archivo.name}"
        )

    def actualizar_precios_click(self):

        self.actualizar_estado(
            "🟡 Actualizando precios...",
            "#d97706"
        )

        self.ejecutar_en_segundo_plano(
            self._actualizar_precios_worker
        )


    def _actualizar_precios_worker(self):

        try:
            ejecutar_actualizacion()

            self.after(
                0,
                lambda: self._actualizacion_ok()
            )

        except Exception as e:

            self.after(
                0,
                lambda: self._actualizacion_error(e)
            )


    def _actualizacion_ok(self):

        self.lbl_actualizacion.configure(
            text="🟢 Actualización completada"
    )

        self.actualizar_estado(
            "🟢 Precios actualizados correctamente"
        )

        self.agregar_evento(
            "Precios actualizados correctamente."
        )


    def _actualizacion_error(self, e):

        self.actualizar_estado(
            "🔴 Error durante la actualización",
            "#dc2626"
        )

        self.agregar_evento(
            f"ERROR: {e}"
        )
    
    def abrir_excel_click(self):

        try:

            abrir_excel_maestro()

            self.actualizar_estado(
                "🟢 Excel Maestro abierto"
            )

            self.agregar_evento(
                "Excel Maestro abierto."
            )

        except Exception as e:

            self.actualizar_estado(
                "🔴 Error al abrir el Excel",
                "#dc2626"
            )

            self.agregar_evento(
                f"ERROR: {e}"
            )
    def abrir_asistente_click(self):

        try:

            abrir_asistente()

            self.actualizar_estado(
                "🟢 Asistente de imágenes abierto"
            )

            self.agregar_evento(
                "Asistente de imágenes abierto."
            )

        except Exception as e:

            self.actualizar_estado(
                "🔴 Error al abrir el asistente",
                "#dc2626"
            )

            self.agregar_evento(
                f"ERROR: {e}"
            )
    
    def generar_json_click(self):

        try:

            ejecutar_generacion_json()

            self.actualizar_estado(
                "🟢 Catálogo JSON regenerado"
            )

            self.agregar_evento(
                "Catálogo JSON regenerado."
            )

        except Exception as e:

            self.actualizar_estado(
                "🔴 Error al generar JSON",
                "#dc2626"
            )

            self.agregar_evento(
                f"ERROR: {e}"
            )

    def publicar_click(self):

        dialogo = ctk.CTkInputDialog(
            text="Ingrese el mensaje del commit:",
            title="Publicar en GitHub"
        )

        mensaje = dialogo.get_input()

        if mensaje is None:
            return

        mensaje = mensaje.strip()

        if mensaje == "":
            return

        self.actualizar_estado(
            "🟡 Publicando en GitHub...",
            "#d97706"
        )

        self.ejecutar_en_segundo_plano(
            lambda: self._publicar_worker(mensaje)
        )


    def _publicar_worker(self, mensaje):

        try:

            resultado = publicar_github(mensaje)

            self.after(
                0,
                lambda: self._publicacion_ok(resultado)
            )

        except Exception as e:

            self.after(
                0,
                lambda: self._publicacion_error(e)
            )


    def _publicacion_ok(self, resultado):

        if resultado == "SIN_CAMBIOS":

            self.actualizar_estado(
                "🟡 No hay cambios para publicar",
                "#d97706"
            )

            self.agregar_evento(
                "No había cambios para publicar."
            )

            return

        self.actualizar_estado(
            "🟢 Publicación completada"
        )

        self.agregar_evento(
            "Catálogo publicado en GitHub."
        )


    def _publicacion_error(self, e):

        self.actualizar_estado(
            "🔴 Error durante la publicación",
            "#dc2626"
        )

        self.agregar_evento(
            f"ERROR: {e}"
        )
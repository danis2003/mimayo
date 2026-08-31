import ctypes

import customtkinter as ctk

from ui import App


def main():

    ctk.set_appearance_mode("Light")
    ctk.set_default_color_theme("blue")

    try:
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(
            "com.mimayo.catalogo"
        )
    except Exception:
        pass

    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
    
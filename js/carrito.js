// =========================================
// CONFIGURACIÓN
// =========================================

const CLAVE_CARRITO = "mimayo_carrito";
const NUMERO_WHATSAPP = "5491161731286";

// =========================================
// ELEMENTOS DEL DOM
// =========================================

const listaCarrito = document.getElementById("listaCarrito");
const cantidadProductos = document.getElementById("cantidadProductos");
const totalCarrito = document.getElementById("totalCarrito");
const carritoConProductos = document.getElementById("carritoConProductos");
const carritoVacio = document.getElementById("carritoVacio");
const btnVaciarCarrito = document.getElementById("btnVaciarCarrito");
const btnContinuarPedido = document.getElementById("btnContinuarPedido");
const btnVolverCatalogo = document.getElementById("btnVolverCatalogo");
const btnSeguirComprando = document.getElementById("btnSeguirComprando");
const modalConfirmacionPedido = document.getElementById(
  "modalConfirmacionPedido",
);
const btnCerrarModalPedido = document.getElementById("btnCerrarModalPedido");
const btnCancelarPedido = document.getElementById("btnCancelarPedido");
const btnConfirmarPedido = document.getElementById("btnConfirmarPedido");
const modalPedidoEnviado = document.getElementById("modalPedidoEnviado");

// =========================================
// VACIAR/CONSERVAR CARRITO DESDE MODAL
// =========================================
const btnConservarCarrito = document.getElementById("btnConservarCarrito");
const btnVaciarCarritoConfirmado = document.getElementById(
  "btnVaciarCarritoConfirmado",
);
const datosEnvio = document.getElementById("datosEnvio");
const advertenciaEnvio = document.getElementById("advertenciaEnvio");
const opcionesModalidad = document.querySelectorAll(
  'input[name="modalidadPedido"]',
);
const cantidadProductosConfirmacion = document.getElementById(
  "cantidadProductosConfirmacion",
);
const totalConfirmacion = document.getElementById("totalConfirmacion");

// =========================================
// VACIAR CARRITO DESDE BTN VACIAR EN CARRITO
// =========================================

const modalVaciarCarrito = document.getElementById("modalVaciarCarrito");
const btnCancelarVaciado = document.getElementById("btnCancelarVaciado");
const btnConfirmarVaciado = document.getElementById("btnConfirmarVaciado");

// =========================================
// toast producto eliminado
// =========================================

const toastProductoEliminado = document.getElementById(
  "toastProductoEliminado",
);

const toastProductoEliminadoNombre = document.getElementById(
  "toastProductoEliminadoNombre",
);

// =========================================
// CAMPOS DEL FORMULARIO DE CONFIRMACIÓN
// =========================================

const nombreCliente = document.getElementById("nombreCliente");

const calleEntrega = document.getElementById("calleEntrega");

const numeroEntrega = document.getElementById("numeroEntrega");

const localidadEntrega = document.getElementById("localidadEntrega");

const referenciaEntrega = document.getElementById("referenciaEntrega");

// =========================================
// ALERTA DE VALIDACIÓN
// =========================================

const errorConfirmacionPedido = document.getElementById(
  "errorConfirmacionPedido",
);

const mensajeErrorConfirmacion = document.getElementById(
  "mensajeErrorConfirmacion",
);

// =========================================
// CARGAR CARRITO
// =========================================

function obtenerCarrito() {
  try {
    const carritoGuardado = localStorage.getItem(CLAVE_CARRITO);

    if (!carritoGuardado) {
      return [];
    }

    const carrito = JSON.parse(carritoGuardado);

    return Array.isArray(carrito) ? carrito : [];
  } catch (error) {
    console.error("Error al cargar el carrito:", error);
    return [];
  }
}

// =========================================
// GUARDAR CARRITO
// =========================================

function guardarCarrito(carrito) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

// =========================================
// FORMATEAR PRECIO
// =========================================

function formatearPrecio(valor) {
  return Number(valor).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escaparHTML(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================================
// RENDERIZAR CARRITO
// =========================================

function renderizarCarrito() {
  const carrito = obtenerCarrito();

  listaCarrito.innerHTML = "";

  // -----------------------------------------
  // CARRITO VACÍO
  // -----------------------------------------

  if (carrito.length === 0) {
    carritoConProductos.classList.add("oculto");
    carritoVacio.classList.remove("oculto");

    cantidadProductos.textContent = "0";
    totalCarrito.textContent = "$ 0,00";

    return;
  }

  // -----------------------------------------
  // CARRITO CON PRODUCTOS
  // -----------------------------------------

  carritoConProductos.classList.remove("oculto");
  carritoVacio.classList.add("oculto");

  let cantidadTotal = 0;
  let total = 0;

  carrito.forEach((producto) => {
    const cantidad = Number(producto.cantidad) || 0;
    const precio = Number(producto.precio) || 0;

    const subtotal = precio * cantidad;

    cantidadTotal += cantidad;
    total += subtotal;

    const item = document.createElement("article");

    item.className = "item-carrito";

    item.innerHTML = `
      <div class="item-carrito-imagen">
        <img
          src="img/productos/${escaparHTML(producto.imagen)}"
          alt="${escaparHTML(producto.nombre)}"
          loading="lazy"
        />
      </div>
      
      <div class="item-carrito-info">

        <h3>${escaparHTML(producto.nombre)}</h3>

        <p>
          <strong>Marca:</strong>
          ${escaparHTML(producto.marca || "-")}
        </p>

        <p>
          <strong>Código:</strong>
          ${escaparHTML(producto.codigo)}
        </p>

      </div>

      <div class="item-carrito-cantidad">

        <button
          type="button"
          class="btn-cantidad btn-cantidad-menos"
          data-codigo="${escaparHTML(producto.codigo)}"
          aria-label="Disminuir cantidad"
        >
          −
        </button>

        <span class="cantidad-producto">
          ${cantidad}
        </span>

        <button
          type="button"
          class="btn-cantidad btn-cantidad-mas"
          data-codigo="${escaparHTML(producto.codigo)}"
          aria-label="Aumentar cantidad"
        >
          +
        </button>

      </div>
      ${
        producto.requiereVariantes
          ? `
            <div class="detalle-variantes">
              <label for="detalleVariantes-${escaparHTML(producto.codigo)}">
                <strong>Variedades / sabores</strong>
              </label>

              <textarea
                id="detalleVariantes-${escaparHTML(producto.codigo)}"
                class="input-detalle-variantes"
                data-codigo="${escaparHTML(producto.codigo)}"
                rows="3"
                maxlength="300"
                placeholder="Indicá las cantidades y sabores. Ejemplo: 5 chocolate, 3 dulce de leche, 2 mousse"
              ></textarea>
              <span class="contador-variantes">0/300 caracteres</span>
            </div>
          `
          : ""
      }

      <div class="item-carrito-precio">

        <span>
          $ ${formatearPrecio(precio)} c/u
        </span>

        <strong>
          $ ${formatearPrecio(subtotal)}
        </strong>

      </div>

      <button
        type="button"
        class="btn-eliminar-producto"
        data-codigo="${escaparHTML(producto.codigo)}"
        aria-label="Eliminar producto"
      >
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    // -----------------------------------------
    // RECUPERAR DETALLE DE VARIANTES
    // -----------------------------------------

    if (producto.requiereVariantes) {
      const campoVariantes = item.querySelector(".input-detalle-variantes");
      const contadorVariantes = item.querySelector(".contador-variantes");

      campoVariantes.value = producto.detalleVariantes || "";

      if (contadorVariantes) {
        contadorVariantes.textContent = `${campoVariantes.value.length}/300 caracteres`;
      }
    }

    listaCarrito.appendChild(item);
  });

  cantidadProductos.textContent = cantidadTotal;
  totalCarrito.textContent = `$ ${formatearPrecio(total)}`;
}

// =========================================
// TOAST PRODUCTO ELIMINADO
// =========================================

let timeoutToastProductoEliminado;

function mostrarToastProductoEliminado(nombreProducto) {
  clearTimeout(timeoutToastProductoEliminado);

  toastProductoEliminadoNombre.textContent = nombreProducto;

  toastProductoEliminado.classList.remove("visible");

  // Reiniciar la animación
  void toastProductoEliminado.offsetWidth;

  toastProductoEliminado.classList.add("visible");

  timeoutToastProductoEliminado = setTimeout(() => {
    toastProductoEliminado.classList.remove("visible");
  }, 2500);
}

// =========================================
// ELIMINAR PRODUCTO
// =========================================

listaCarrito.addEventListener("click", (e) => {
  const boton = e.target.closest(".btn-eliminar-producto");

  if (!boton) {
    return;
  }

  const codigo = Number(boton.dataset.codigo);

  const carrito = obtenerCarrito();

  const productoEliminado = carrito.find(
    (producto) => Number(producto.codigo) === codigo,
  );

  const carritoActualizado = carrito.filter(
    (producto) => Number(producto.codigo) !== codigo,
  );

  guardarCarrito(carritoActualizado);

  renderizarCarrito();

  if (productoEliminado) {
    mostrarToastProductoEliminado(productoEliminado.nombre);
  }

  if (carritoActualizado.length === 0) {
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
    return;
  }
});

// =========================================
// MODIFICAR CANTIDAD
// =========================================

listaCarrito.addEventListener("click", (e) => {
  const boton = e.target.closest(".btn-cantidad");

  if (!boton) {
    return;
  }

  const codigo = String(boton.dataset.codigo);

  const carrito = obtenerCarrito();

  const producto = carrito.find((item) => String(item.codigo) === codigo);

  if (!producto) {
    return;
  }

  let cantidadActual = Number(producto.cantidad) || 1;

  if (boton.classList.contains("btn-cantidad-mas")) {
    cantidadActual += 1;
  }

  if (boton.classList.contains("btn-cantidad-menos")) {
    cantidadActual -= 1;
  }

  // Nunca permitir cantidades menores a 1
  if (cantidadActual < 1) {
    cantidadActual = 1;
  }

  producto.cantidad = cantidadActual;

  guardarCarrito(carrito);

  renderizarCarrito();
});

// =========================================
// DETALLE DE VARIANTES
// =========================================

listaCarrito.addEventListener("input", (e) => {
  if (!e.target.classList.contains("input-detalle-variantes")) {
    return;
  }

  const codigo = String(e.target.dataset.codigo);

  const carrito = obtenerCarrito();

  const producto = carrito.find((item) => String(item.codigo) === codigo);

  if (!producto) {
    return;
  }

  producto.detalleVariantes = e.target.value;

  guardarCarrito(carrito);

  const contador = e.target.parentElement.querySelector(".contador-variantes");

  if (contador) {
    contador.textContent = `${e.target.value.length}/300 caracteres`;
  }
});

// =========================================
// VALIDAR VARIEDADES / SABORES
// =========================================

function validarVariantes(carrito) {
  const MAX_CARACTERES_VARIANTES = 300;

  for (const producto of carrito) {
    if (!producto.requiereVariantes) {
      continue;
    }

    const detalle = String(producto.detalleVariantes || "").trim();

    if (!detalle) {
      return {
        valido: false,
        mensaje: `Completá las variedades o sabores de "${producto.nombre}".`,
      };
    }

    if (detalle.length > MAX_CARACTERES_VARIANTES) {
      return {
        valido: false,
        mensaje: `Las variedades o sabores de "${producto.nombre}" no pueden superar los ${MAX_CARACTERES_VARIANTES} caracteres.`,
      };
    }
  }

  return {
    valido: true,
  };
}

// =========================================
// VALIDAR CANTIDADES
// =========================================

function validarCantidades(carrito) {
  const MIN_CANTIDAD = 1;
  const MAX_CANTIDAD = 10000;

  for (const producto of carrito) {
    const cantidad = Number(producto.cantidad);

    if (
      !Number.isInteger(cantidad) ||
      cantidad < MIN_CANTIDAD ||
      cantidad > MAX_CANTIDAD
    ) {
      return {
        valido: false,
        mensaje: `La cantidad del producto "${producto.nombre}" no es válida. Debe ser un número entero entre ${MIN_CANTIDAD} y ${MAX_CANTIDAD}.`,
      };
    }
  }

  return {
    valido: true,
  };
}

// =========================================
// VALIDAR ESTRUCTURA DEL CARRITO
// =========================================

function validarEstructuraCarrito(carrito) {
  if (!Array.isArray(carrito)) {
    return {
      valido: false,
      mensaje: "El formato del carrito no es válido.",
    };
  }

  for (const producto of carrito) {
    if (!producto || typeof producto !== "object") {
      return {
        valido: false,
        mensaje: "Se encontró un producto con datos inválidos.",
      };
    }

    if (
      producto.codigo === undefined ||
      producto.nombre === undefined ||
      producto.precio === undefined
    ) {
      return {
        valido: false,
        mensaje: "Se encontró un producto con datos incompletos.",
      };
    }
  }

  return {
    valido: true,
  };
}

// =========================================
// MODAL DE CONFIRMACIÓN DEL PEDIDO
// =========================================

function abrirModalConfirmacion() {
  const carrito = obtenerCarrito();

  let cantidadTotal = 0;
  let total = 0;

  carrito.forEach((producto) => {
    const cantidad = Number(producto.cantidad) || 0;
    const precio = Number(producto.precio) || 0;

    cantidadTotal += cantidad;
    total += precio * cantidad;
  });

  cantidadProductosConfirmacion.textContent = cantidadTotal;
  totalConfirmacion.textContent = `$ ${formatearPrecio(total)}`;
  advertenciaEnvio.classList.add("oculto");

  modalConfirmacionPedido.classList.remove("oculto");
  modalConfirmacionPedido.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-abierto");
}

function cerrarModalConfirmacion() {
  modalConfirmacionPedido.classList.add("oculto");
  modalConfirmacionPedido.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-abierto");
}

// =========================================
// MODAL PEDIDO ENVIADO
// =========================================

function abrirModalPedidoEnviado() {
  modalPedidoEnviado.classList.remove("oculto");
  modalPedidoEnviado.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-abierto");
}

function cerrarModalPedidoEnviado() {
  modalPedidoEnviado.classList.add("oculto");
  modalPedidoEnviado.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-abierto");
}

opcionesModalidad.forEach((opcion) => {
  opcion.addEventListener("change", () => {
    if (opcion.value === "envio" && opcion.checked) {
      datosEnvio.classList.remove("oculto");
      advertenciaEnvio.classList.remove("oculto");
    }

    if (opcion.value === "retiro" && opcion.checked) {
      datosEnvio.classList.add("oculto");
      advertenciaEnvio.classList.add("oculto");
    }
  });
});

// =========================================
// ALERTA DE VALIDACIÓN DEL PEDIDO
// =========================================

function mostrarErrorConfirmacion(mensaje) {
  mensajeErrorConfirmacion.textContent = mensaje;

  errorConfirmacionPedido.classList.remove("oculto");
}

function ocultarErrorConfirmacion() {
  mensajeErrorConfirmacion.textContent = "";

  errorConfirmacionPedido.classList.add("oculto");
}

// =========================================
// VALIDAR DATOS DE CONFIRMACIÓN
// =========================================

function validarDatosConfirmacion() {
  const nombre = nombreCliente.value.trim();

  // Validar nombre
  if (!nombre) {
    return {
      valido: false,
      mensaje: "Ingresá el nombre del cliente.",
      campo: nombreCliente,
    };
  }

  // Validar modalidad
  const modalidadSeleccionada = document.querySelector(
    'input[name="modalidadPedido"]:checked',
  );

  if (!modalidadSeleccionada) {
    return {
      valido: false,
      mensaje: "Seleccioná cómo querés recibir tu pedido.",
      campo: null,
    };
  }

  // Si es retiro, no validar datos de dirección
  if (modalidadSeleccionada.value === "retiro") {
    return {
      valido: true,
    };
  }

  // Si es envío, validar dirección
  if (!calleEntrega.value.trim()) {
    return {
      valido: false,
      mensaje: "Ingresá la calle de entrega.",
      campo: calleEntrega,
    };
  }

  if (!numeroEntrega.value.trim()) {
    return {
      valido: false,
      mensaje: "Ingresá el número de la dirección.",
      campo: numeroEntrega,
    };
  }

  if (!localidadEntrega.value.trim()) {
    return {
      valido: false,
      mensaje: "Ingresá la localidad de entrega.",
      campo: localidadEntrega,
    };
  }

  return {
    valido: true,
  };
}

// =========================================
// GENERAR MENSAJE DE WHATSAPP
// =========================================

function generarMensajeWhatsApp() {
  const carrito = obtenerCarrito();

  const nombre = nombreCliente.value.trim();

  const modalidadSeleccionada = document.querySelector(
    'input[name="modalidadPedido"]:checked',
  );

  const modalidad = modalidadSeleccionada.value;

  // Emojis mediante Unicode para evitar problemas de codificación
  const emojiCarrito = String.fromCodePoint(0x1f6d2);
  const emojiCliente = String.fromCodePoint(0x1f464);
  const emojiCaja = String.fromCodePoint(0x1f4e6);
  const emojiProductos = String.fromCodePoint(0x1f6cd);
  const emojiDinero = String.fromCodePoint(0x1f4b0);
  const emojiAdvertencia = String.fromCodePoint(0x26a0);
  const emojiEnvio = String.fromCodePoint(0x1f69a);

  let mensaje = "";

  // ENCABEZADO
  mensaje += `${emojiCarrito} *NUEVO PEDIDO — Mi-Mayo*\n\n`;

  // CLIENTE
  mensaje += `${emojiCliente} *Cliente:* ${nombre}\n\n`;

  // MODALIDAD
  if (modalidad === "retiro") {
    mensaje += `${emojiCaja} *Modalidad:* Retiro en tienda\n\n`;
  } else {
    mensaje += `${emojiCaja} *Modalidad:* Envío a domicilio\n\n`;

    mensaje += "📍 *Dirección:*\n";
    mensaje += `${calleEntrega.value.trim()} ${numeroEntrega.value.trim()}\n`;
    mensaje += `${localidadEntrega.value.trim()}\n`;

    const referencia = referenciaEntrega.value.trim();

    if (referencia) {
      mensaje += `Entre calles / referencia: ${referencia}\n`;
    }

    mensaje += "\n";
  }

  // SEPARADOR
  mensaje += "──────────────────────\n";

  // PRODUCTOS
  mensaje += `${emojiProductos} *PRODUCTOS | Cód. | P.Unit. | Subtotal*\n`;

  mensaje += "──────────────────────\n\n";

  let total = 0;

  carrito.forEach((producto) => {
    const cantidad = Number(producto.cantidad) || 0;
    const precio = Number(producto.precio) || 0;
    const subtotal = precio * cantidad;

    total += subtotal;

    mensaje += `• ${producto.nombre} (${producto.codigo}) ×${cantidad} — $${formatearPrecio(precio)}c/u — $${formatearPrecio(subtotal)}\n`;

    if (
      producto.requiereVariantes &&
      producto.detalleVariantes &&
      producto.detalleVariantes.trim()
    ) {
      mensaje += `  Var.: ${producto.detalleVariantes.trim()}\n`;
    }

    mensaje += "\n";
  });

  // SEPARADOR ANTES DEL TOTAL
  mensaje += "──────────────────────\n";

  // TOTAL
  mensaje += `${emojiDinero} *TOTAL: $${formatearPrecio(total)}*\n`;

  // SEPARADOR
  mensaje += "──────────────────────\n\n";

  // ACLARACIONES
  mensaje += `${emojiAdvertencia} *Importante:* El monto final queda sujeto a confirmación por parte de Mi-Mayo.\n\n`;

  if (modalidad === "envio") {
    mensaje += `${emojiEnvio} El envío queda sujeto a confirmación por parte de Mi-Mayo.\n\n`;
  }

  mensaje += "¡Gracias!";

  return mensaje;
}
// =========================================
// ENVIAR PEDIDO POR WHATSAPP
// =========================================

btnConfirmarPedido.addEventListener("click", () => {
  const validacion = validarDatosConfirmacion();

  if (!validacion.valido) {
    mostrarErrorConfirmacion(validacion.mensaje);

    if (validacion.campo) {
      validacion.campo.focus();
    }

    return;
  }

  ocultarErrorConfirmacion();

  const mensaje = generarMensajeWhatsApp();

  const urlWhatsApp = `https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP}&text=${encodeURIComponent(mensaje)}`;

  window.open(urlWhatsApp, "_blank");

  cerrarModalConfirmacion();
  abrirModalPedidoEnviado();
});

// =========================================
// VACIAR CARRITO
// =========================================

// function vaciarCarrito() {
//   const carrito = obtenerCarrito();

//   if (carrito.length === 0) {
//     return;
//   }

//   const confirmar = confirm("¿Seguro que querés vaciar todo el pedido?");

//   if (!confirmar) {
//     return;
//   }

//   localStorage.removeItem(CLAVE_CARRITO);

//   renderizarCarrito();
// }

function abrirModalVaciarCarrito() {
  const carrito = obtenerCarrito();

  if (carrito.length === 0) {
    return;
  }

  modalVaciarCarrito.classList.remove("oculto");
  modalVaciarCarrito.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-abierto");
}

function cerrarModalVaciarCarrito() {
  modalVaciarCarrito.classList.add("oculto");
  modalVaciarCarrito.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-abierto");
}

// btnVaciarCarrito.addEventListener("click", vaciarCarrito);

btnVaciarCarrito.addEventListener("click", abrirModalVaciarCarrito);

const btnVaciarCarritoDesktop = document.getElementById(
  "btnVaciarCarritoDesktop",
);

if (btnVaciarCarritoDesktop) {
  btnVaciarCarritoDesktop.addEventListener("click", abrirModalVaciarCarrito);
}

btnCancelarVaciado.addEventListener("click", () => {
  cerrarModalVaciarCarrito();
});

btnConfirmarVaciado.addEventListener("click", () => {
  localStorage.removeItem(CLAVE_CARRITO);

  window.location.href = "index.html";
});

// =========================================
// VOLVER AL CATÁLOGO y SEGUIR COMPRANDO
// =========================================

btnVolverCatalogo.addEventListener("click", () => {
  window.location.href = "index.html";
});

btnSeguirComprando.addEventListener("click", () => {
  window.location.href = "index.html";
});

// =========================================
// ABRIR MODAL DE CONFIRMACIÓN
// =========================================

btnContinuarPedido.addEventListener("click", () => {
  const carrito = obtenerCarrito();

  const validacionEstructura = validarEstructuraCarrito(carrito);

  if (!validacionEstructura.valido) {
    alert(validacionEstructura.mensaje);
    return;
  }

  const validacionCantidades = validarCantidades(carrito);

  if (!validacionCantidades.valido) {
    alert(validacionCantidades.mensaje);
    return;
  }

  const validacionVariantes = validarVariantes(carrito);

  if (!validacionVariantes.valido) {
    alert(validacionVariantes.mensaje);
    return;
  }

  abrirModalConfirmacion();
});

btnCerrarModalPedido.addEventListener("click", cerrarModalConfirmacion);

btnCancelarPedido.addEventListener("click", cerrarModalConfirmacion);

btnConservarCarrito.addEventListener("click", () => {
  cerrarModalPedidoEnviado();
});

btnVaciarCarritoConfirmado.addEventListener("click", () => {
  localStorage.removeItem(CLAVE_CARRITO);

  window.location.href = "index.html";
});
// =========================================
// HEADER COMPACTO AL HACER SCROLL
// =========================================

const headerCarrito = document.querySelector("header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 80) {
    headerCarrito.classList.add("header-compacto");
  } else {
    headerCarrito.classList.remove("header-compacto");
  }
});

// =========================================
// BOTÓN VOLVER ARRIBA
// =========================================

const btnArriba = document.getElementById("btnArriba");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    btnArriba.classList.add("visible");
  } else {
    btnArriba.classList.remove("visible");
  }
});

btnArriba.addEventListener("click", (e) => {
  e.preventDefault();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// =========================================
// ALTURA DEL HEADER PARA ELEMENTOS STICKY
// =========================================

const actualizarAlturasSticky = () => {
  const header = document.querySelector("header");
  const encabezado = document.querySelector(".carrito-encabezado");

  if (header) {
    const alturaHeader = header.getBoundingClientRect().height;

    document.documentElement.style.setProperty(
      "--altura-header",
      `${alturaHeader}px`,
    );
  }

  if (encabezado) {
    const alturaEncabezado = encabezado.getBoundingClientRect().height;

    document.documentElement.style.setProperty(
      "--altura-encabezado-carrito",
      `${alturaEncabezado}px`,
    );
  }
};

actualizarAlturasSticky();

window.addEventListener("resize", actualizarAlturasSticky);
window.addEventListener("scroll", actualizarAlturasSticky);

// =========================================
// SINCRONIZAR CARRITO ENTRE PESTAÑAS
// =========================================

window.addEventListener("storage", (e) => {
  if (e.key === CLAVE_CARRITO) {
    renderizarCarrito();
  }
});

// =========================================
// INICIALIZAR
// =========================================

renderizarCarrito();

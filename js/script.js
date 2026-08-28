// =========================================
// ELEMENTOS DEL DOM
// =========================================

const botonMenu = document.getElementById("btnMenu");
const botonCerrarMenu = document.getElementById("btnCerrarMenu");
const inputBuscar = document.getElementById("buscar");
const menu = document.getElementById("menuLateral");
const overlay = document.getElementById("overlay");
const btnWhatsapp = document.getElementById("btnWhatsapp");
const btnArriba = document.getElementById("btnArriba");
const marcasTrack = document.getElementById("marcasTrack");

// =========================================
// DATOS
// =========================================
let productos = [];
let variantes = {};
let categoriaSeleccionada = "Todos";
let marcaSeleccionada = "Todas";
let ultimoFiltro = null;
let textoBusqueda = "";
let criterioOrden = "default";
let productosVisibles = 50;
let productosFiltrados = [];

const contenedorProductos = document.getElementById("productos");
const contenedorCategorias = document.getElementById("categorias");
const contenedorCategoriasMenu = document.getElementById("categoriasMenu");
const btnMostrarMas = document.getElementById("btnMostrarMas");
const modalImagenAnterior = document.getElementById("modalImagenAnterior");
const modalImagenSiguiente = document.getElementById("modalImagenSiguiente");
const modalIndicadores = document.getElementById("modalIndicadores");
const modalImagenTrack = document.getElementById("modalImagenTrack");
const toastCarrito = document.getElementById("toastCarrito");
const toastNombreProducto = document.getElementById("toastNombreProducto");

let imagenesModal = [];
let indiceImagenModal = 0;

// =========================================
// CARRITO
// =========================================

const CLAVE_CARRITO = "mimayo_carrito";
let carrito = cargarCarrito();

function cargarCarrito() {
  try {
    const carritoGuardado = localStorage.getItem(CLAVE_CARRITO);

    if (!carritoGuardado) {
      return [];
    }

    const carritoParseado = JSON.parse(carritoGuardado);

    return Array.isArray(carritoParseado) ? carritoParseado : [];
  } catch (error) {
    console.error("Error al cargar el carrito:", error);
    return [];
  }
}

function guardarCarrito() {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));

  actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
  carrito = cargarCarrito();

  const cantidadTotal = carrito.reduce(
    (total, producto) => total + Number(producto.cantidad || 0),
    0,
  );

  // ==========================================
  // CARRITO DE PC
  // ==========================================
  const enlacesCarritoPc = document.querySelectorAll(
    '.menu-pc a[href="carrito.html"]',
  );

  enlacesCarritoPc.forEach((enlaceCarrito) => {
    enlaceCarrito.innerHTML = `
      <i class="fa-solid fa-cart-shopping"></i>
      Mi pedido${cantidadTotal > 0 ? ` (${cantidadTotal})` : " (0)"}
    `;
  });

  // ==========================================
  // CARRITO MÓVIL
  // ==========================================
  const contadorMovil = document.getElementById("contadorCarritoHeaderMovil");

  if (contadorMovil) {
    contadorMovil.textContent = cantidadTotal;
  }
}

actualizarContadorCarrito();

window.addEventListener("storage", (evento) => {
  if (evento.key === CLAVE_CARRITO) {
    actualizarContadorCarrito();
  }
});

let temporizadorToastCarrito;

function mostrarToastCarrito(nombreProducto) {
  clearTimeout(temporizadorToastCarrito);

  toastNombreProducto.textContent = nombreProducto;

  toastCarrito.classList.add("visible");

  temporizadorToastCarrito = setTimeout(() => {
    toastCarrito.classList.remove("visible");
  }, 3000);
}

function agregarAlCarrito(producto, cantidad) {
  carrito = cargarCarrito();
  const cantidadNumerica = Number(cantidad);

  if (!Number.isInteger(cantidadNumerica) || cantidadNumerica < 1) {
    alert("La cantidad debe ser un número entero mayor o igual a 1.");
    return;
  }

  const codigo = String(producto.codigo);

  const tieneVariantes = (variantes[codigo] || []).length > 0;

  const productoExistente = carrito.find(
    (item) => String(item.codigo) === codigo,
  );

  if (productoExistente) {
    productoExistente.cantidad += cantidadNumerica;
    productoExistente.requiereVariantes = tieneVariantes;
  } else {
    carrito.push({
      codigo: producto.codigo,
      nombre: producto.nombre,
      marca: producto.marca,
      precio: producto.precio,
      cantidad: cantidadNumerica,
      imagen: producto.imagen,
      requiereVariantes: tieneVariantes,
      detalleVariantes: "",
    });
  }

  guardarCarrito();

  console.log("Carrito actualizado:", carrito);
}

// ==========================================
// GOOGLE ANALYTICS
// ==========================================

function registrarEventoGA4(nombreEvento, parametros = {}) {
  if (typeof gtag !== "function") {
    return;
  }

  gtag("event", nombreEvento, parametros);
}

// ==========================================
// SWIPE TÁCTIL DEL CARRUSEL
// ==========================================

let inicioTouchX = 0;
let inicioTouchY = 0;

// ==========================================
// SWIPE TÁCTIL DEL MODAL
// ==========================================

let inicioTouchModalX = 0;
let inicioTouchModalY = 0;

contenedorProductos.addEventListener("click", (e) => {
  // Los controles del carrusel no deben abrir el modal.
  if (e.target.closest(".carrusel-control")) {
    return;
  }

  const tarjeta = e.target.closest(".tarjeta");

  if (!tarjeta) return;

  if (tarjeta.dataset.suprimirClick === "true") {
    tarjeta.dataset.suprimirClick = "false";
    return;
  }

  const codigo = Number(tarjeta.dataset.codigo);

  const producto = productos.find((p) => p.codigo === codigo);

  abrirModalProducto(producto);
});

function ocultarWhatsapp() {
  btnWhatsapp.classList.add("oculto");
}

function mostrarWhatsapp() {
  btnWhatsapp.classList.remove("oculto");
}

function ocultarBotonArriba() {
  btnArriba.classList.remove("visible");
}

function mostrarBotonArriba() {
  btnArriba.classList.add("visible");
}

// =========================================
// FUNCIONES
// =========================================
function renderizarProductos(listaProductos) {
  let html = "";

  if (listaProductos.length === 0) {
    html = `
      <div class="sin-resultados">
        <p>No encontramos productos que coincidan con estos filtros.</p>
        <span>Probá seleccionando otra categoría o marca.</span>
      </div>
    `;
  } else {
    listaProductos.forEach((producto) => {
      // ------------------------------------------
      // Construir lista de imágenes
      // ------------------------------------------

      const imagenes = [
        producto.imagen,
        ...(variantes[String(producto.codigo)] || []),
      ];

      const tieneCarrusel = imagenes.length > 1;

      // ------------------------------------------
      // Flechas
      // ------------------------------------------

      const controlesFlechas = tieneCarrusel
        ? `
          <button
            type="button"
            class="carrusel-control carrusel-anterior"
            data-carrusel="anterior"
            aria-label="Imagen anterior"
          >
            ‹
          </button>

          <button
            type="button"
            class="carrusel-control carrusel-siguiente"
            data-carrusel="siguiente"
            aria-label="Imagen siguiente"
          >
            ›
          </button>
        `
        : "";

      // ------------------------------------------
      // Puntos indicadores
      // ------------------------------------------

      const indicadores = tieneCarrusel
        ? `
          <div class="carrusel-indicadores">
            ${imagenes
              .map(
                (_, indice) => `
                  <button
                    type="button"
                    class="carrusel-control carrusel-punto ${
                      indice === 0 ? "activo" : ""
                    }"
                    data-carrusel="punto"
                    data-indice="${indice}"
                    aria-label="Ir a imagen ${indice + 1}"
                  ></button>
                `,
              )
              .join("")}
          </div>
        `
        : "";

      // ------------------------------------------
      // Construir área de imagen
      // ------------------------------------------

      const contenidoImagen = tieneCarrusel
        ? `
        <div class="carrusel-producto">

          <div class="carrusel-viewport">

            <div class="carrusel-track">

              ${imagenes
                .map(
                  (imagen) => `
                    <div class="carrusel-slide">
                      <img
                        src="img/productos/${imagen}"
                        alt="${producto.nombre}"
                        loading="lazy"
                      />
                    </div>
                  `,
                )
                .join("")}

            </div>

          </div>

          ${controlesFlechas}

          ${indicadores}

          </div>
          `
        : `
          <img
            src="img/productos/${imagenes[0]}"
            alt="${producto.nombre}"
            loading="lazy"
          />
        `;

      // ------------------------------------------
      // Tarjeta
      // ------------------------------------------

      html += `
        <article
          class="tarjeta"
          data-codigo="${producto.codigo}"
          data-imagenes='${JSON.stringify(imagenes)}'
          data-indice-imagen="0"
        >

          ${contenidoImagen}

          <div class="contenido-tarjeta">
            <h3>${producto.nombre}</h3>

            <p class="precio">
              $ ${producto.precio.toLocaleString("es-AR")}
            </p>

            <p class="marca">
              ${producto.marca}
            </p>

            <p class="codigo">
              Código: ${producto.codigo}
            </p>
          </div>

        </article>
      `;
    });
  }

  contenedorProductos.innerHTML = html;
  observarImpresionesProductos();

  document.getElementById("contadorResultados").textContent =
    `Mostrando ${listaProductos.length} de ${productosFiltrados.length} producto${
      productosFiltrados.length !== 1 ? "s" : ""
    }`;
}

// ==========================================
// IMPRESIONES DE PRODUCTOS
// ==========================================

const productosImpresos = new Set();
const temporizadoresImpresion = new Map();

function observarImpresionesProductos() {
  const tarjetas = document.querySelectorAll(".tarjeta");

  const porcentajeVisible = window.matchMedia("(max-width: 768px)").matches
    ? 0.7
    : 1.0;

  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        const tarjeta = entrada.target;
        const codigo = tarjeta.dataset.codigo;

        if (!codigo || productosImpresos.has(codigo)) {
          return;
        }

        if (
          entrada.isIntersecting &&
          entrada.intersectionRatio >= porcentajeVisible
        ) {
          if (temporizadoresImpresion.has(codigo)) {
            return;
          }

          const temporizador = setTimeout(() => {
            if (productosImpresos.has(codigo)) {
              return;
            }

            productosImpresos.add(codigo);
            temporizadoresImpresion.delete(codigo);

            const producto = productos.find(
              (item) => String(item.codigo) === String(codigo),
            );

            if (!producto) {
              return;
            }

            registrarEventoGA4("product_impression", {
              product_name: producto.nombre,
              product_code: String(producto.codigo),
              brand: producto.marca,
              category: producto.categoria,
            });
          }, 1000);

          temporizadoresImpresion.set(codigo, temporizador);
        } else {
          const temporizador = temporizadoresImpresion.get(codigo);

          if (temporizador) {
            clearTimeout(temporizador);
            temporizadoresImpresion.delete(codigo);
          }
        }
      });
    },
    {
      threshold: porcentajeVisible,
    },
  );

  tarjetas.forEach((tarjeta) => {
    observer.observe(tarjeta);
  });
}

// =========================================
// CARRUSEL DE PRODUCTOS
// =========================================

function cambiarImagenCarrusel(tarjeta, nuevoIndice) {
  const imagenes = JSON.parse(tarjeta.dataset.imagenes);

  if (nuevoIndice < 0 || nuevoIndice >= imagenes.length) {
    return;
  }

  // ------------------------------------------
  // Mover la pista del carrusel
  // ------------------------------------------

  const track = tarjeta.querySelector(".carrusel-track");

  const viewport = tarjeta.querySelector(".carrusel-viewport");
  const anchoViewport = viewport.clientWidth;

  track.style.transform = `translateX(-${nuevoIndice * anchoViewport}px)`;

  // ------------------------------------------
  // Guardar índice actual
  // ------------------------------------------

  tarjeta.dataset.indiceImagen = nuevoIndice;

  // ------------------------------------------
  // Actualizar indicador activo
  // ------------------------------------------

  const puntos = tarjeta.querySelectorAll(".carrusel-punto");

  puntos.forEach((punto, indice) => {
    punto.classList.toggle("activo", indice === nuevoIndice);
  });
}

contenedorProductos.addEventListener("click", (e) => {
  const control = e.target.closest(".carrusel-control");

  if (!control) {
    return;
  }

  // Evita que el clic llegue al listener
  // que abre el modal.

  e.preventDefault();
  e.stopPropagation();

  const tarjeta = control.closest(".tarjeta");

  if (!tarjeta) {
    return;
  }

  const imagenes = JSON.parse(tarjeta.dataset.imagenes);

  const indiceActual = Number(tarjeta.dataset.indiceImagen);

  let nuevoIndice = indiceActual;

  // ------------------------------------------
  // Flecha anterior
  // ------------------------------------------

  if (control.dataset.carrusel === "anterior") {
    nuevoIndice = indiceActual - 1;

    if (nuevoIndice < 0) {
      nuevoIndice = imagenes.length - 1;
    }
  }

  // ------------------------------------------
  // Flecha siguiente
  // ------------------------------------------
  else if (control.dataset.carrusel === "siguiente") {
    nuevoIndice = indiceActual + 1;

    if (nuevoIndice >= imagenes.length) {
      nuevoIndice = 0;
    }
  }

  // ------------------------------------------
  // Punto
  // ------------------------------------------
  else if (control.dataset.carrusel === "punto") {
    nuevoIndice = Number(control.dataset.indice);
  }

  cambiarImagenCarrusel(tarjeta, nuevoIndice);
});

// ==========================================
// DETECTAR SWIPE EN CARRUSEL
// ==========================================

contenedorProductos.addEventListener("touchstart", (e) => {
  const carrusel = e.target.closest(".carrusel-producto");

  if (!carrusel) return;

  const tarjeta = carrusel.closest(".tarjeta");

  if (!tarjeta) return;

  const imagenes = JSON.parse(tarjeta.dataset.imagenes);

  // Un producto con una sola imagen no tiene swipe.
  if (imagenes.length <= 1) return;

  const touch = e.touches[0];

  inicioTouchX = touch.clientX;
  inicioTouchY = touch.clientY;
});

contenedorProductos.addEventListener("touchend", (e) => {
  const carrusel = e.target.closest(".carrusel-producto");

  if (!carrusel) return;

  const tarjeta = carrusel.closest(".tarjeta");

  if (!tarjeta) return;

  const imagenes = JSON.parse(tarjeta.dataset.imagenes);

  if (imagenes.length <= 1) return;

  const touch = e.changedTouches[0];

  const diferenciaX = touch.clientX - inicioTouchX;
  const diferenciaY = touch.clientY - inicioTouchY;

  const distanciaMinima = 50;

  // Si el movimiento fue principalmente vertical,
  // no intervenimos en el scroll de la página.
  if (Math.abs(diferenciaX) <= Math.abs(diferenciaY)) {
    return;
  }

  // Movimiento horizontal demasiado pequeño:
  // se considera un toque normal.
  if (Math.abs(diferenciaX) < distanciaMinima) {
    return;
  }

  const indiceActual = Number(tarjeta.dataset.indiceImagen);

  let nuevoIndice;

  if (diferenciaX < 0) {
    // Deslizar hacia la izquierda → siguiente.
    nuevoIndice = indiceActual + 1;

    if (nuevoIndice >= imagenes.length) {
      nuevoIndice = 0;
    }
  } else {
    // Deslizar hacia la derecha → anterior.
    nuevoIndice = indiceActual - 1;

    if (nuevoIndice < 0) {
      nuevoIndice = imagenes.length - 1;
    }
  }

  cambiarImagenCarrusel(tarjeta, nuevoIndice);

  // Evita que el click generado después del gesto
  // abra accidentalmente el modal.
  tarjeta.dataset.suprimirClick = "true";
});

function renderizarCategorias() {
  contenedorCategorias.innerHTML = "";
  contenedorCategoriasMenu.innerHTML = "";

  const categorias = [
    ...new Set(productos.map((producto) => producto.categoria)),
  ];

  // Botón "Todos"
  const botonTodos = document.createElement("button");

  botonTodos.textContent = "Todos";
  if (categoriaSeleccionada === "Todos") {
    botonTodos.classList.add("activa");
  }

  botonTodos.addEventListener("click", () => {
    categoriaSeleccionada = "Todos";
    marcaSeleccionada = "Todas";
    ultimoFiltro = null;
    productosVisibles = 50;
    renderizarCategorias();
    aplicarFiltros();
  });

  contenedorCategorias.appendChild(botonTodos);

  const botonTodosMenu = botonTodos.cloneNode(true);

  botonTodosMenu.addEventListener("click", () => {
    categoriaSeleccionada = "Todos";
    marcaSeleccionada = "Todas";
    productosVisibles = 50;
    renderizarCategorias();
    aplicarFiltros();

    menu.classList.remove("abierto");
    overlay.classList.remove("activo");
    botonMenu.classList.remove("oculto");
    mostrarWhatsapp();
    if (window.scrollY > 300) {
      mostrarBotonArriba();
    }
  });

  contenedorCategoriasMenu.appendChild(botonTodosMenu);
  // Categorías dinámicas
  categorias.forEach((categoria) => {
    const boton = document.createElement("button");

    boton.textContent = categoria;
    if (categoria === categoriaSeleccionada) {
      boton.classList.add("activa");
    }
    boton.addEventListener("click", () => {
      filtrarPorCategoria(categoria);
    });

    contenedorCategorias.appendChild(boton);
    const botonMenu = boton.cloneNode(true);

    botonMenu.addEventListener("click", () => {
      filtrarPorCategoria(categoria);

      menu.classList.remove("abierto");
      overlay.classList.remove("activo");
      botonMenu.classList.remove("oculto");
      mostrarWhatsapp();
      if (window.scrollY > 300) {
        mostrarBotonArriba();
      }
    });

    contenedorCategoriasMenu.appendChild(botonMenu);
  });
}

function filtrarPorCategoria(categoria) {
  categoriaSeleccionada = categoria;

  registrarEventoGA4("select_category", {
    category: categoria,
  });

  // Si veníamos de una marca, al elegir una categoría
  // la categoría pasa a ser el filtro principal.
  if (ultimoFiltro === "marca") {
    marcaSeleccionada = "Todas";
  }

  ultimoFiltro = "categoria";
  productosVisibles = 50;

  renderizarCategorias();
  aplicarFiltros();
}

function aplicarFiltros() {
  let resultado = productos;

  // Filtrar por categoría
  if (categoriaSeleccionada !== "Todos") {
    resultado = resultado.filter(
      (producto) => producto.categoria === categoriaSeleccionada,
    );
  }
  // Filtrar por marca
  if (marcaSeleccionada !== "Todas") {
    resultado = resultado.filter(
      (producto) => producto.marca === marcaSeleccionada,
    );
  }
  // Filtrar por texto
  if (textoBusqueda !== "") {
    resultado = resultado.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
        producto.marca.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
        String(producto.codigo).includes(textoBusqueda),
    );
  }

  // Ordenar
  switch (criterioOrden) {
    case "nombre":
      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;

    case "precioAsc":
      resultado.sort((a, b) => a.precio - b.precio);
      break;

    case "precioDesc":
      resultado.sort((a, b) => b.precio - a.precio);
      break;
  }

  productosFiltrados = resultado;

  const productosAMostrar = resultado.slice(0, productosVisibles);

  renderizarProductos(productosAMostrar);

  const restantes = resultado.length - productosVisibles;

  if (restantes > 0) {
    btnMostrarMas.classList.remove("oculto");

    btnMostrarMas.querySelector(".btn-titulo").textContent =
      `Mostrar ${Math.min(50, restantes)} más`;

    btnMostrarMas.querySelector(".btn-restantes").textContent =
      `${restantes} restantes...`;
  } else {
    btnMostrarMas.classList.add("oculto");
  }
}

async function cargarProductos() {
  try {
    const [respuestaProductos, respuestaVariantes] = await Promise.all([
      fetch("data/productos.json"),
      fetch("data/variantes.json"),
    ]);

    productos = (await respuestaProductos.json()).filter(
      (producto) => producto.activo,
    );

    variantes = await respuestaVariantes.json();

    renderizarCategorias();
    aplicarFiltros();
  } catch (error) {
    console.error("Error al cargar productos o variantes:", error);
  }
}

function abrirModalProducto(producto) {
  registrarEventoGA4("view_product", {
    product_name: producto.nombre,
    product_code: String(producto.codigo),
    brand: producto.marca,
    category: producto.categoria,
  });
  // =========================================
  // IMÁGENES DEL PRODUCTO
  // =========================================

  imagenesModal = [
    producto.imagen,
    ...(variantes[String(producto.codigo)] || []),
  ];

  indiceImagenModal = 0;

  prepararCarruselModal();
  actualizarImagenModal();

  // =========================================
  // INFORMACIÓN DEL PRODUCTO
  // =========================================

  document.getElementById("modalNombre").textContent = producto.nombre;

  document.getElementById("modalMarca").textContent = producto.marca;

  document.getElementById("modalCategoria").textContent = producto.categoria;

  document.getElementById("modalCodigo").textContent = producto.codigo;

  document.getElementById("modalPrecio").textContent =
    `$ ${producto.precio.toLocaleString("es-AR")}`;

  document.getElementById("modalCantidad").value = 1;

  // =========================================
  // CANTIDAD EXISTENTE EN EL CARRITO
  // =========================================

  const avisoCantidadCarrito = document.getElementById("modalCantidadCarrito");

  const productoEnCarrito = carrito.find(
    (item) => String(item.codigo) === String(producto.codigo),
  );

  if (productoEnCarrito) {
    avisoCantidadCarrito.textContent = `Ya tenés ${productoEnCarrito.cantidad} unidades en tu pedido.`;

    avisoCantidadCarrito.classList.remove("oculto");
  } else {
    avisoCantidadCarrito.textContent = "";
    avisoCantidadCarrito.classList.add("oculto");
  }

  const avisoVariantes = document.getElementById("modalAvisoVariantes");
  const tieneVariantes = (variantes[String(producto.codigo)] || []).length > 0;

  if (tieneVariantes) {
    avisoVariantes.classList.remove("oculto");
  } else {
    avisoVariantes.classList.add("oculto");
  }

  document.getElementById("btnCantidadMenos").onclick = () => {
    const inputCantidad = document.getElementById("modalCantidad");

    const cantidadActual = Number(inputCantidad.value) || 1;

    inputCantidad.value = Math.max(1, cantidadActual - 1);
  };

  document.getElementById("btnCantidadMas").onclick = () => {
    const inputCantidad = document.getElementById("modalCantidad");

    const cantidadActual = Number(inputCantidad.value) || 1;

    inputCantidad.value = cantidadActual + 1;
  };

  document.getElementById("btnAgregarCarrito").onclick = () => {
    const cantidad = Number(document.getElementById("modalCantidad").value);

    agregarAlCarrito(producto, cantidad);

    registrarEventoGA4("add_to_cart", {
      product_name: producto.nombre,
      product_code: String(producto.codigo),
      quantity: cantidad,
    });
    // document.getElementById("modalProducto").classList.remove("abierto");
    // mostrarToastCarrito(producto.nombre);
    const modalProducto = document.getElementById("modalProducto");

    modalProducto.classList.add("cerrando");

    setTimeout(() => {
      modalProducto.classList.remove("abierto");
      modalProducto.classList.remove("cerrando");

      mostrarToastCarrito(producto.nombre);
    }, 100);
  };

  // =========================================
  // ABRIR MODAL
  // =========================================

  document.getElementById("modalProducto").classList.add("abierto");

  ocultarWhatsapp();
  ocultarBotonArriba();

  // =========================================
  // WHATSAPP
  // =========================================

  document.getElementById("btnWhatsappProducto").onclick = () => {
    const mensaje = `Hola, quisiera consultar por:\n\n${producto.nombre}\nCódigo: ${producto.codigo}`;

    registrarEventoGA4("contact_whatsapp", {
      source: "product",
      product_name: producto.nombre,
      product_code: String(producto.codigo),
    });

    window.open(
      `https://wa.me/5491169117952?text=${encodeURIComponent(mensaje)}`,
      "_blank",
    );
  };

  // =========================================
  // COMPARTIR
  // =========================================

  document.getElementById("btnCompartir").onclick = async () => {
    registrarEventoGA4("share_product", {
      product_name: producto.nombre,
      product_code: String(producto.codigo),
    });
    const datos = {
      title: producto.nombre,

      text: `${producto.nombre}\nCódigo: ${producto.codigo}\n$ ${producto.precio.toLocaleString("es-AR")}`,

      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(datos);
    } else {
      navigator.clipboard.writeText(`${datos.text}\n${datos.url}`);

      alert("Información copiada al portapapeles.");
    }
  };
}

function prepararCarruselModal() {
  // -----------------------------------------
  // Crear las slides una sola vez
  // -----------------------------------------

  modalImagenTrack.innerHTML = imagenesModal
    .map(
      (imagen, indice) => `
          <div class="modal-carrusel-slide">

            <img
              src="img/productos/${imagen}"
              alt=""
              loading="${indice === 0 ? "eager" : "lazy"}"
            />

          </div>
        `,
    )
    .join("");

  // -----------------------------------------
  // Crear indicadores
  // -----------------------------------------

  modalIndicadores.innerHTML = "";

  if (imagenesModal.length <= 1) {
    return;
  }

  imagenesModal.forEach((_, indice) => {
    const punto = document.createElement("button");

    punto.type = "button";

    punto.className = "modal-carrusel-punto";

    punto.dataset.indice = indice;

    punto.setAttribute("aria-label", `Ir a imagen ${indice + 1}`);

    modalIndicadores.appendChild(punto);
  });
}

function actualizarImagenModal() {
  const tieneCarrusel = imagenesModal.length > 1;

  // -----------------------------------------
  // Mover la pista
  // -----------------------------------------

  modalImagenTrack.style.transform = `translateX(-${indiceImagenModal * 100}%)`;

  // -----------------------------------------
  // Flechas
  // -----------------------------------------

  modalImagenAnterior.classList.toggle("oculto", !tieneCarrusel);

  modalImagenSiguiente.classList.toggle("oculto", !tieneCarrusel);

  // -----------------------------------------
  // Indicador activo
  // -----------------------------------------

  const puntos = modalIndicadores.querySelectorAll(".modal-carrusel-punto");

  puntos.forEach((punto, indice) => {
    punto.classList.toggle("activo", indice === indiceImagenModal);
  });
}

modalImagenAnterior.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  indiceImagenModal--;

  if (indiceImagenModal < 0) {
    indiceImagenModal = imagenesModal.length - 1;
  }

  actualizarImagenModal();
});

modalImagenSiguiente.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  indiceImagenModal++;

  if (indiceImagenModal >= imagenesModal.length) {
    indiceImagenModal = 0;
  }

  actualizarImagenModal();
});

modalIndicadores.addEventListener("click", (e) => {
  const punto = e.target.closest(".modal-carrusel-punto");

  if (!punto) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  indiceImagenModal = Number(punto.dataset.indice);

  actualizarImagenModal();
});

// ==========================================
// SWIPE TÁCTIL DEL MODAL
// ==========================================

const modalCarruselViewport = document.querySelector(
  ".modal-carrusel-viewport",
);

modalCarruselViewport.addEventListener("touchstart", (e) => {
  if (imagenesModal.length <= 1) {
    return;
  }

  const touch = e.touches[0];

  inicioTouchModalX = touch.clientX;
  inicioTouchModalY = touch.clientY;
});

modalCarruselViewport.addEventListener("touchend", (e) => {
  if (imagenesModal.length <= 1) {
    return;
  }

  const touch = e.changedTouches[0];

  const diferenciaX = touch.clientX - inicioTouchModalX;

  const diferenciaY = touch.clientY - inicioTouchModalY;

  const distanciaMinima = 50;

  // Si el movimiento fue principalmente vertical,
  // dejamos que el usuario haga scroll.
  if (Math.abs(diferenciaX) <= Math.abs(diferenciaY)) {
    return;
  }

  // Movimiento horizontal demasiado pequeño:
  // se considera un toque normal.
  if (Math.abs(diferenciaX) < distanciaMinima) {
    return;
  }

  if (diferenciaX < 0) {
    // Deslizar hacia la izquierda → siguiente imagen.
    indiceImagenModal++;

    if (indiceImagenModal >= imagenesModal.length) {
      indiceImagenModal = 0;
    }
  } else {
    // Deslizar hacia la derecha → imagen anterior.
    indiceImagenModal--;

    if (indiceImagenModal < 0) {
      indiceImagenModal = imagenesModal.length - 1;
    }
  }

  actualizarImagenModal();
});

async function cargarMarcas() {
  try {
    const respuesta = await fetch("data/marcas.json");
    const marcas = await respuesta.json();

    marcasTrack.innerHTML = "";

    // Primera copia
    marcas.forEach((marca) => {
      const item = crearMarca(marca);
      marcasTrack.appendChild(item);
    });

    // Segunda copia para crear el bucle infinito
    marcas.forEach((marca) => {
      const item = crearMarca(marca);
      item.setAttribute("aria-hidden", "true");
      marcasTrack.appendChild(item);
    });
  } catch (error) {
    console.error("Error al cargar las marcas:", error);
  }
}

function crearMarca(marca) {
  const boton = document.createElement("button");

  boton.className = "marca-item";
  boton.type = "button";
  boton.title = marca.nombre;

  const imagen = document.createElement("img");

  imagen.src = `img/marcas/${marca.imagen}`;
  imagen.alt = marca.nombre;
  //imagen.loading = "lazy";

  boton.appendChild(imagen);

  boton.addEventListener("click", () => {
    marcaSeleccionada = marca.nombre;

    registrarEventoGA4("select_brand", {
      brand: marca.nombre,
    });

    ultimoFiltro = "marca";

    productosVisibles = 50;
    aplicarFiltros();
  });

  return boton;
}
// =========================================
// EVENTOS
// =========================================

// ==========================================
// GOOGLE ANALYTICS - WHATSAPP E INSTAGRAM
// ==========================================

document.querySelectorAll('a[href*="wa.me"]').forEach((enlace) => {
  enlace.addEventListener("click", () => {
    registrarEventoGA4("contact_whatsapp", {
      source: enlace.id === "btnWhatsapp" ? "floating" : "menu",
    });
  });
});

document.querySelectorAll('a[href*="instagram.com"]').forEach((enlace) => {
  enlace.addEventListener("click", () => {
    registrarEventoGA4("visit_instagram", {
      source: "menu",
    });
  });
});

document.querySelectorAll('a[href*="maps.app.goo.gl"]').forEach((enlace) => {
  enlace.addEventListener("click", () => {
    registrarEventoGA4("get_directions", {
      source: "location_modal",
    });
  });
});

botonMenu.addEventListener("click", () => {
  menu.classList.add("abierto");
  overlay.classList.add("activo");

  botonMenu.classList.add("oculto");

  ocultarWhatsapp();
  ocultarBotonArriba();
});

botonCerrarMenu.addEventListener("click", () => {
  menu.classList.remove("abierto");
  overlay.classList.remove("activo");

  botonMenu.classList.remove("oculto");

  mostrarWhatsapp();

  if (window.scrollY > 300) {
    mostrarBotonArriba();
  }
});

overlay.addEventListener("click", () => {
  menu.classList.remove("abierto");
  overlay.classList.remove("activo");

  botonMenu.classList.remove("oculto");

  mostrarWhatsapp();

  if (window.scrollY > 300) {
    mostrarBotonArriba();
  }
});

let temporizadorBusqueda;

inputBuscar.addEventListener("input", (event) => {
  textoBusqueda = event.target.value;
  productosVisibles = 50;

  aplicarFiltros();

  clearTimeout(temporizadorBusqueda);

  const termino = textoBusqueda.trim();

  if (termino.length < 3) {
    return;
  }

  temporizadorBusqueda = setTimeout(() => {
    registrarEventoGA4("search", {
      search_term: termino,
    });
  }, 800);
});

document.getElementById("ordenar").addEventListener("change", (e) => {
  criterioOrden = e.target.value;
  productosVisibles = 50;
  aplicarFiltros();
});

// =========================================
// BOTÓN MOSTRAR MÁS
// =========================================

btnMostrarMas.addEventListener("click", () => {
  const cantidadAntes = productosVisibles;

  productosVisibles += 50;

  registrarEventoGA4("view_more_products", {
    products_before: cantidadAntes,
    products_after: productosVisibles,
  });

  aplicarFiltros();
});

// ==============================
// MODAL UBICACIÓN
// ==============================

const modalUbicacion = document.getElementById("modalUbicacion");
const btnMapa = document.getElementById("btnMapa");
const cerrarModal = document.getElementById("cerrarModal");

btnMapa.addEventListener("click", () => {
  registrarEventoGA4("view_location", {
    source: "menu",
  });
  modalUbicacion.classList.add("abierto");
  ocultarWhatsapp();
  ocultarBotonArriba();
});

cerrarModal.addEventListener("click", () => {
  modalUbicacion.classList.remove("abierto");
  mostrarWhatsapp();
  if (window.scrollY > 300) {
    mostrarBotonArriba();
  }
});

modalUbicacion.addEventListener("click", (e) => {
  if (e.target === modalUbicacion) {
    modalUbicacion.classList.remove("abierto");
    mostrarWhatsapp();
    if (window.scrollY > 300) {
      mostrarBotonArriba();
    }
  }
});

const modalProducto = document.getElementById("modalProducto");
const cerrarProducto = document.getElementById("cerrarProducto");

cerrarProducto.addEventListener("click", () => {
  modalProducto.classList.remove("abierto");
  mostrarWhatsapp();
  if (window.scrollY > 300) {
    mostrarBotonArriba();
  }
});

modalProducto.addEventListener("click", (e) => {
  if (e.target === modalProducto) {
    modalProducto.classList.remove("abierto");
    mostrarWhatsapp();
    if (window.scrollY > 300) {
      mostrarBotonArriba();
    }
  }
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    mostrarBotonArriba();
  } else {
    ocultarBotonArriba();
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
// MAPA MENU PC
// =========================================
const btnMapaPc = document.getElementById("btnMapaPc");

btnMapaPc.addEventListener("click", (e) => {
  registrarEventoGA4("view_location", {
    source: "desktop",
  });
  e.preventDefault();
  modalUbicacion.classList.add("abierto");
  ocultarWhatsapp();
  ocultarBotonArriba();
});
// =========================================
// INICIALIZACIÓN
// =========================================
cargarMarcas();
cargarProductos();

window.addEventListener("scroll", () => {
  const header = document.querySelector("header");

  if (window.scrollY > 80) {
    header.classList.add("header-compacto");
  } else {
    header.classList.remove("header-compacto");
  }
});

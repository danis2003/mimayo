// =========================================
// ELEMENTOS DEL DOM
// =========================================

const botonMenu = document.getElementById("btnMenu");
const inputBuscar = document.getElementById("buscar");
const menu = document.getElementById("menuLateral");
const iconoMenu = document.getElementById("iconoMenu");
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

let imagenesModal = [];
let indiceImagenModal = 0;

contenedorProductos.addEventListener("click", (e) => {
  // Los controles del carrusel no deben abrir el modal.
  if (e.target.closest(".carrusel-control")) {
    return;
  }

  const tarjeta = e.target.closest(".tarjeta");

  if (!tarjeta) return;

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
          </div>

        </article>
      `;
    });
  }

  contenedorProductos.innerHTML = html;

  document.getElementById("contadorResultados").textContent =
    `Mostrando ${listaProductos.length} de ${productosFiltrados.length} producto${
      productosFiltrados.length !== 1 ? "s" : ""
    }`;
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
    iconoMenu.textContent = "☰";
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
      iconoMenu.textContent = "☰";
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
        producto.marca.toLowerCase().includes(textoBusqueda.toLowerCase()),
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

    window.open(
      `https://wa.me/5491169117952?text=${encodeURIComponent(mensaje)}`,
      "_blank",
    );
  };

  // =========================================
  // COMPARTIR
  // =========================================

  document.getElementById("btnCompartir").onclick = async () => {
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

    ultimoFiltro = "marca";

    productosVisibles = 50;
    aplicarFiltros();
  });

  return boton;
}
// =========================================
// EVENTOS
// =========================================

botonMenu.addEventListener("click", () => {
  menu.classList.toggle("abierto");
  overlay.classList.toggle("activo");

  if (menu.classList.contains("abierto")) {
    iconoMenu.textContent = "✕";
    ocultarWhatsapp();
    ocultarBotonArriba();
  } else {
    iconoMenu.textContent = "☰";
    mostrarWhatsapp();
    if (window.scrollY > 300) {
      mostrarBotonArriba();
    }
  }
});

overlay.addEventListener("click", () => {
  menu.classList.remove("abierto");
  overlay.classList.remove("activo");
  iconoMenu.textContent = "☰";

  mostrarWhatsapp();
  if (window.scrollY > 300) {
    mostrarBotonArriba();
  }
});

inputBuscar.addEventListener("input", (event) => {
  textoBusqueda = event.target.value;
  productosVisibles = 50;
  aplicarFiltros();
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
  productosVisibles += 50;
  aplicarFiltros();
});

// ==============================
// MODAL UBICACIÓN
// ==============================

const modalUbicacion = document.getElementById("modalUbicacion");
const btnMapa = document.getElementById("btnMapa");
const cerrarModal = document.getElementById("cerrarModal");

btnMapa.addEventListener("click", () => {
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

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

contenedorProductos.addEventListener("click", (e) => {
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
      html += `
        <article class="tarjeta" data-codigo="${producto.codigo}">
          <img
            src="img/productos/${producto.imagen}"
            alt="${producto.nombre}"
            loading="lazy"
          />

          <div class="contenido-tarjeta">
            <h3>${producto.nombre}</h3>

            <p class="precio">$ ${producto.precio.toLocaleString("es-AR")}</p>

            <p class="marca">${producto.marca}</p>
          </div>
        </article>
      `;
    });
  }

  contenedorProductos.innerHTML = html;

  document.getElementById("contadorResultados").textContent =
    `Mostrando ${listaProductos.length} de ${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? "s" : ""}`;
}
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
    const respuesta = await fetch("data/productos.json");

    productos = (await respuesta.json()).filter((producto) => producto.activo);

    renderizarCategorias();
    aplicarFiltros();
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

function abrirModalProducto(producto) {
  document.getElementById("modalImagen").src =
    `img/productos/${producto.imagen}`;

  document.getElementById("modalImagen").alt = producto.nombre;

  document.getElementById("modalNombre").textContent = producto.nombre;

  document.getElementById("modalMarca").textContent = producto.marca;

  document.getElementById("modalCategoria").textContent = producto.categoria;

  document.getElementById("modalCodigo").textContent = producto.codigo;

  document.getElementById("modalPrecio").textContent =
    `$ ${producto.precio.toLocaleString("es-AR")}`;

  document.getElementById("modalProducto").classList.add("abierto");
  ocultarWhatsapp();
  ocultarBotonArriba();
  document.getElementById("btnWhatsappProducto").onclick = () => {
    const mensaje = `Hola, quisiera consultar por:\n\n${producto.nombre}\nCódigo: ${producto.codigo}`;

    window.open(
      `https://wa.me/5491169117952?text=${encodeURIComponent(mensaje)}`,
      "_blank",
    );
  };

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

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

// =========================================
// DATOS
// =========================================
let productos = [];
let categoriaSeleccionada = "Todos";
let textoBusqueda = "";
let criterioOrden = "default";
const contenedorProductos = document.getElementById("productos");
const contenedorCategorias = document.getElementById("categorias");
const contenedorCategoriasMenu = document.getElementById("categoriasMenu");

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
  contenedorProductos.innerHTML = "";

  listaProductos.forEach((producto) => {
    contenedorProductos.innerHTML += `
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

  //contador de procutos a mostrar
  document.getElementById("contadorResultados").textContent =
    `Mostrando ${listaProductos.length} producto${listaProductos.length !== 1 ? "s" : ""}`;

  // evento para abrir modal del producto
  document.querySelectorAll(".tarjeta").forEach((tarjeta) => {
    tarjeta.addEventListener("click", () => {
      const codigo = Number(tarjeta.dataset.codigo);

      const producto = productos.find((p) => p.codigo === codigo);

      abrirModalProducto(producto);
    });
  });
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

    renderizarCategorias();
    aplicarFiltros();
  });

  contenedorCategorias.appendChild(botonTodos);

  const botonTodosMenu = botonTodos.cloneNode(true);

  botonTodosMenu.addEventListener("click", () => {
    categoriaSeleccionada = "Todos";

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

  renderizarProductos(resultado);
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

  aplicarFiltros();
});

document.getElementById("ordenar").addEventListener("change", (e) => {
  criterioOrden = e.target.value;

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

cargarProductos();

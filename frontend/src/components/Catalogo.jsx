import React, { useState, useContext } from "react";
import { CartContext } from "./CartContext"; // Asegúrate de ajustar esta ruta según la ubicación de tu archivo

function Catalogo({ productos }) {
  // Estado para la categoría seleccionada
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");

  // Obtenemos la función addToCart del contexto global del carrito
  const { cart, addToCart } = useContext(CartContext);

  // Lógica para filtrar los productos según la categoría activa
  const productosFiltrados =
    categoriaActiva === "Todos"
      ? productos
      : productos.filter((producto) => producto.categoria === categoriaActiva);

  return (
    <section
      id="catalogo"
      className="container my-5 py-4"
      style={{ backgroundColor: "#FBF8F3" }}
    >
      {/* Cabecera de la Vitrina */}
      <div className="row align-items-end mb-5">
        <div className="col-lg-8">
          <span
            className="text-uppercase fw-bold"
            style={{ color: "#7b3f2e", fontSize: "11px", letterSpacing: "2px" }}
          >
            NUESTROS FAVORITOS
          </span>
          <h2
            className="display-5 fw-normal mt-2"
            style={{ fontFamily: "Georgia, serif", color: "#141413" }}
          >
            La vitrina de hoy
          </h2>
        </div>
        <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
          <p
            className="text-muted small mb-0"
            style={{ maxWidth: "300px", marginLeft: "auto", lineHeight: "1.5" }}
          >
            Cada semana cambia, siguiendo el ritmo de las estaciones y la
            inspiración de nuestro obrador.
          </p>
        </div>
      </div>

      {/* Pestañas de Filtro (Estilo minimalista) */}
      <div
        className="d-flex gap-4 border-bottom pb-2 mb-5 catalog-filters"
        style={{ borderColor: "#383128" }}
      >
        {["Todos", "Tartas", "Individuales", "Cajas"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className="btn p-0 border-0 bg-transparent text-uppercase small fw-bold"
            style={{
              color: categoriaActiva === cat ? "#7b3f2e" : "#8c7a74",
              letterSpacing: "1px",
              borderBottom:
                categoriaActiva === cat ? "2px solid #7b3f2e" : "none",
              borderRadius: "0",
              paddingBottom: "4px",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cuadrícula de Productos Filtrados */}
      <div className="row g-4">
        {productosFiltrados.length > 0 ? (
          productosFiltrados.map((producto) => {
            const cantidadEnCarrito = cart.find(
              (item) => item.id_producto === producto.id_producto
            )?.cantidad || 0;
            const sinStockDisponible = cantidadEnCarrito >= Number(producto.stock);

            return (
            <div
              key={producto.id_producto}
              className="col-lg-3 col-md-6 col-sm-6"
            >
              <div className="card h-100 border-0 bg-transparent position-relative">
                {/* Imagen del producto con diseño limpio */}
                <div
                  className="position-relative overflow-hidden mb-3 catalog-product-image"
                  style={{ backgroundColor: "#11100f", height: "250px" }}
                >
                  <img
                    src={
                      producto.imagen ||
                      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={producto.nombre}
                    className="w-100 h-100 object-fit-cover"
                  />

                  {/* Botón funcional "AÑADIR +" conectado al Carrito */}
                  <button
                    onClick={() => {
                      addToCart(producto);
                      if (!sinStockDisponible) {
                        alert(`¡"${producto.nombre}" se agregó al carrito! 🛒`);
                      }
                    }}
                    disabled={sinStockDisponible}
                    className="btn btn-light position-absolute bottom-0 end-0 m-3 rounded-0 px-3 py-2 shadow-sm fw-bold"
                    style={{
                      fontSize: "11px",
                      letterSpacing: "1px",
                      backgroundColor: "#fbf8f3",
                      color: "#3d2c29",
                      border: "1px solid #dcd2c5",
                    }}
                  >
                    {sinStockDisponible ? "SIN STOCK" : "AÑADIR +"}
                  </button>
                </div>

                {/* Información del producto debajo de la imagen */}
                <div className="card-body px-0 pt-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span
                      className="text-uppercase text-muted"
                      style={{ fontSize: "10px", letterSpacing: "1.5px" }}
                    >
                      {producto.categoria || "ARTESANAL"}
                    </span>
                    <span
                      className="fw-bold"
                      style={{ color: "#3d2c29", fontSize: "14px" }}
                    >
                      ${Number(producto.precio).toLocaleString()}
                    </span>
                  </div>
                  <h5
                    className="fw-normal mb-1"
                    style={{
                      fontFamily: "Georgia, serif",
                      color: "#3d2c29",
                      fontSize: "17px",
                    }}
                  >
                    {producto.nombre}
                  </h5>
                  <p
                    className="text-muted small mb-0"
                    style={{ fontSize: "12px", lineHeight: "1.4" }}
                  >
                    {producto.descripcion}
                  </p>
                </div>
              </div>
            </div>
            );
          })
        ) : (
          <div className="text-center py-5">
            <p className="text-muted">
              No hay productos disponibles en esta categoría.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Catalogo;

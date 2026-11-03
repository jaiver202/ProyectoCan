
import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Inicializar el carrito con lo que haya guardado en el navegador (localStorage)
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart_candykane');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart_candykane', JSON.stringify(cart));
    }, [cart]);

    // Función para agregar productos
    const addToCart = (product) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id_producto === product.id_producto);
            const stock = Number(product.stock);

            if (Number.isFinite(stock) && (existing?.cantidad || 0) >= stock) {
                return prevCart;
            }

            if (existing) {
                return prevCart.map(item => 
                    item.id_producto === product.id_producto 
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, cantidad: 1 }];
        });
    };

    const updateQuantity = (id_producto, cantidad) => {
        if (!Number.isInteger(cantidad) || cantidad < 1) {
            throw new RangeError('La cantidad debe ser un número entero mayor que cero.');
        }

        setCart(prevCart => prevCart.map(item => {
            if (item.id_producto !== id_producto) return item;
            const stock = Number(item.stock);
            if (Number.isFinite(stock) && cantidad > stock) return item;
            return { ...item, cantidad };
        }));
    };

    // Función para eliminar un producto
    const removeFromCart = (id_producto) => {
        setCart(prevCart => prevCart.filter(item => item.id_producto !== id_producto));
    };

    // Vaciar carrito
    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
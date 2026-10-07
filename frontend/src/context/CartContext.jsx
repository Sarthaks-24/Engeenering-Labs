import { useCallback, useState } from "react";
import { createContext } from "react";
import api from "../services/api";

const CartContext = createContext();

const CartProvider = ({ children }) => {

    // cart state
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // API functions
    const addCart = async (id) => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.post(`/cart/${id}`);

            setCartItems(response.data.cart);
            return { success: true, cart: response.data.cart };
        } catch (err) {
            const errorMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to add product";
            setError(errorMsg);
            return {
                success: false,
                error: errorMsg,
                status: err.response?.status,
            };
        } finally {
            setLoading(false);
        }
    };
    
    const updateCart = async (id, quantity) => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.patch(`/cart/${id}`, {
                quantity: quantity
            });

            setCartItems(response.data.cart);
        } catch (err) {
            setError(
                err.response?.data?.error || "Unable to update cart"
            );
        } finally {
            setLoading(false);
        }
    };

    const deleteCart = async (id) => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.delete(`/cart/${id}`);

            setCartItems(response.data.cart);
        } catch (err) {
            setError(
                err.response?.data?.error || "Unable to remove product"
            );
        } finally {
            setLoading(false);
        }
    };

    const getCart = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get("/cart");

            setCartItems(response.data.cart);
        } catch (err) {
            setError(
                err.response?.data?.error || "Unable to load cart"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                loading,
                error,
                addCart,
                updateCart,
                deleteCart,
                getCart,
                clearCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export { CartProvider };
export default CartContext;
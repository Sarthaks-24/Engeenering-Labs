import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useEffect, useState } from "react";
import { useContext } from "react";
import CartContext from "../context/CartContext";

function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const { cartItems, getCart } = useContext(CartContext);
  const [count,setCount] = useState();
  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const handleLogout=async()=>{
    try{
      const logout  = await api.post('/customers/logout');
      console.log(logout);
      nav('/login');
    }catch {
        console.log("Something went wrong while loading products.");
      }

  }

  useEffect(() => {
    const loadWishlistCount = async () => {
      try {
        const res = await api.get('/wishlist/count');
        setCount(res.data.count);
      } catch (err) {
        console.log(err);
      }
    };

    loadWishlistCount();
  }, []);

  useEffect(() => {
    if (location.pathname !== "/cart") {
      getCart();
    }
  }, [getCart, location.pathname]);
  return (
    <nav className="bg-gray-900 text-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        <Link
          to="/"
          className="text-2xl font-bold"
        >
          ShopKart
        </Link>

        <div className="flex items-center gap-6">

          <Link
            to="/"
            className="hover:text-gray-300"
          >
            Home
          </Link>

          <Link
            to="/products"
            className="hover:text-gray-300"
          >
            Products
          </Link>

          <Link
            to="/wishlist"
            className="hover:text-gray-300"
          >
            Wishlist {' ('+count+')'}
          </Link>

          <Link
            to="/cart"
            className="hover:text-gray-300"
          >
            Cart ({cartCount})
          </Link>

          <Link
            to="/orders"
            className="hover:text-gray-300"
          >
            Orders
          </Link>

          <button className="hover:text-gray-300" onClick={handleLogout}>
            Logout
          </button>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useEffect, useState } from "react";

function Navbar() {
  const nav = useNavigate();
  const [count,setCount] = useState();
  const handleLogout=async()=>{
    try{
      const logout  = await api.post('/customers/logout');
      console.log(logout);
      nav('/login');
    }catch (err) {
        console.log("Something went wrong while loading products.");
      }

  }

  const getCount = async()=>{
    try{
      const res = await api.get('/wishlist/count');
      setCount(res.data.count);
    }catch(err){
      console.log(err);
    }
  }
  useEffect(()=>{getCount()},[])
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

          <button className="hover:text-gray-300" onClick={handleLogout}>
            Logout
          </button>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;
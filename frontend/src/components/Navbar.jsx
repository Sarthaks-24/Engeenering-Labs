import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Navbar() {
    const navigate = useNavigate();
    const handleLogout = async ()=>{
        try{
            const logout = await api.post('/customers/logout');
            console.log(logout);
            navigate('/login');
        }catch(err){
            console.log(err);
        }
    }

  return (
    <nav className="bg-black text-white px-6 py-4 flex items-center justify-between">
      <Link to="/home" className="text-xl font-bold">
        ShopKart
      </Link>

      <button className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200"
      onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}

export default Navbar;
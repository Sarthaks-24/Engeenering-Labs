import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";



function Home() {
  const [data,setData] = useState({
    name:'guest',
    email:'guest@gmail.com',
    phone:'1234567890'
  });
  const getData = async()=>{
    try{
      const tdata = await api.post('customers/me');
      console.log(tdata);
      setData(tdata.data);
    }catch(err){
      console.log(err);
    }

  }
  useEffect(() => {
      getData();
  }, []);
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex flex-col items-center justify-center py-20">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to ShopKart
        </h1>

        <p className="text-gray-600 text-lg">
          Welcome back, Customer!
        </p>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            Customer Information
          </h2>

          <p className="mb-2">
            <span className="font-semibold">Name:</span> {data.name}
          </p>

          <p className="mb-2">
            <span className="font-semibold">Email:</span> {data.email}
          </p>

          <p>
            <span className="font-semibold">Phone:</span> {data.phone}
          </p>
        </div>
      </main>
    </div>
  );
}

export default Home;
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

export const getProducts = async (search = "", category = "") => {
  const params = {};

  if (search) params.search = search;
  if (category) params.category = category;

  const response = await api.get("/products", {
    params,
  });

  return response.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);

  return response.data;
};

export default api;
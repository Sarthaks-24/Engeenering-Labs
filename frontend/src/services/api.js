import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const getProducts = async (search = "", category = "", sort="") => {
  const params = {};

  if (search) params.search = search;
  if (category) params.category = category;
  if (sort) params.sort = sort;

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
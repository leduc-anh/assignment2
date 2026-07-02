const BASE_URL = 'https://dummyjson.com';

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function fetchProducts({ limit = 10, skip = 0 } = {}) {
  return request(`/products?limit=${limit}&skip=${skip}`);
}

export function searchProducts({ q, limit = 10, skip = 0 }) {
  return request(`/products/search?q=${encodeURIComponent(q)}&limit=${limit}&skip=${skip}`);
}

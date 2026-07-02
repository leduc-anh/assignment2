import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProducts, searchProducts } from '../api/productsApi';

const PAGE_SIZE = 10;

export function useProducts(searchQuery) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const runQuery = useCallback(async (query, skip, { append }) => {
    const currentRequestId = ++requestId.current;
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = query
        ? await searchProducts({ q: query, limit: PAGE_SIZE, skip })
        : await fetchProducts({ limit: PAGE_SIZE, skip });
      if (currentRequestId !== requestId.current) return;
      setTotal(data.total);
      setProducts((current) => (append ? [...current, ...data.products] : data.products));
    } catch (err) {
      if (currentRequestId !== requestId.current) return;
      setError(err.message || 'Something went wrong');
      if (!append) {
        setProducts([]);
      }
    } finally {
      if (currentRequestId !== requestId.current) return;
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    runQuery(searchQuery, 0, { append: false });
  }, [searchQuery, runQuery]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || products.length >= total) return;
    runQuery(searchQuery, products.length, { append: true });
  }, [loading, loadingMore, products.length, total, searchQuery, runQuery]);

  const refresh = useCallback(() => {
    runQuery(searchQuery, 0, { append: false });
  }, [searchQuery, runQuery]);

  return { products, total, loading, loadingMore, error, loadMore, refresh };
}

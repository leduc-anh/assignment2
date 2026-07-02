import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../api/productsApi';

const PAGE_SIZE = 10;
const CATALOG_SIZE = 194;

export function useProducts({ searchQuery, minPrice, maxPrice }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({ limit: CATALOG_SIZE, skip: 0 });
      setCatalog(data.products);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filtered = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    const min = minPrice === '' || minPrice == null ? -Infinity : Number(minPrice);
    const max = maxPrice === '' || maxPrice == null ? Infinity : Number(maxPrice);
    return catalog.filter((product) => {
      const matchesQuery = query === '' || product.title.toLowerCase().includes(query);
      const matchesPrice = product.price >= min && product.price <= max;
      return matchesQuery && matchesPrice;
    });
  }, [catalog, searchQuery, minPrice, maxPrice]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, minPrice, maxPrice]);

  const products = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  const refresh = useCallback(() => {
    loadCatalog();
  }, [loadCatalog]);

  return { products, total: filtered.length, loading, error, loadMore, refresh };
}

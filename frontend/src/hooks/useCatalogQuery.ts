import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, wishlistService, bannerService } from '../services/api';
import type { Product, Category, PlatformBanner, WishlistItem, ApiResponse } from '../types';

/**
 * High-performance cached query for active product categories.
 * Stored in memory to prevent refetching during catalog page navigation.
 */
export function useCategoriesQuery() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      return await productService.getCategories();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache freshness
  });
}

/**
 * High-performance cached query for active promotional and alert banners.
 */
export function useActiveBannersQuery() {
  return useQuery<PlatformBanner[]>({
    queryKey: ['activeBanners'],
    queryFn: async () => {
      return await bannerService.getActiveBanners();
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Cached query for paginated/filtered products catalog.
 */
export function useProductsQuery(params: Record<string, string | number | boolean | undefined>) {
  return useQuery<ApiResponse<Product>>({
    queryKey: ['products', params],
    queryFn: async () => {
      const cleanParams: Record<string, string> = {};
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') {
          cleanParams[k] = String(v);
        }
      });
      return await productService.getProducts(cleanParams);
    },
    placeholderData: (prev) => prev, // Smooth pagination transition without flickering
  });
}

/**
 * Optimistic and cached customer wishlist hook.
 */
export function useWishlistQuery(enabled: boolean = true) {
  const qc = useQueryClient();

  const query = useQuery<WishlistItem[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      return await wishlistService.getWishlist();
    },
    enabled,
    staleTime: 1000 * 60 * 3,
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: number) => wishlistService.toggleWishlist(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  return {
    ...query,
    toggleWishlist: toggleMutation.mutateAsync,
  };
}

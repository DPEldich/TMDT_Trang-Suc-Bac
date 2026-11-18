export type ProductCategory = 'nhan' | 'day-chuyen' | 'lac-tay' | 'bong-tai';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  description: string;
}

export const CATEGORIES: readonly CategoryInfo[] = [
  {
    id: 'nhan',
    name: 'Nhẫn bạc',
    description: 'Các mẫu nhẫn bạc đính đá và điểm đá.',
  },
  {
    id: 'day-chuyen',
    name: 'Dây chuyền & Mặt dây',
    description: 'Dây chuyền trơn và mặt dây chuyền độc lập.',
  },
  {
    id: 'lac-tay',
    name: 'Lắc & Vòng tay',
    description: 'Lắc tay đính đá và lắc tay mắt xích trơn.',
  },
  {
    id: 'bong-tai',
    name: 'Bông tai',
    description: 'Các mẫu bông tai nụ và bông tai đính đá.',
  },
] as const;

export type JewelryItemType = 'ring' | 'chain' | 'pendant' | 'bracelet' | 'earring';

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: ProductCategory;
  itemType: JewelryItemType;
  /** Demo price in VND */
  price: number;
  /** Demo inventory count */
  stock: number;
  image: string;
  imageAlt: string;
  shortDescription: string;
  description: string;
  featured?: boolean;
}

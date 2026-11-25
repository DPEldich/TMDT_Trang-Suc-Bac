export type ProductCategory =
  | 'nhan'
  | 'day-chuyen'
  | 'lac-tay'
  | 'bong-tai'
  | 'lac-chan';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  description: string;
}

export const CATEGORIES: readonly CategoryInfo[] = [
  {
    id: 'nhan',
    name: 'Nhẫn',
    description: 'Các mẫu nhẫn trơn, nhẫn điểm đá và nhẫn đính đá.',
  },
  {
    id: 'day-chuyen',
    name: 'Dây chuyền & Mặt dây',
    description: 'Dây chuyền trơn, dây cổ liền mặt và mặt dây chuyền độc lập.',
  },
  {
    id: 'lac-tay',
    name: 'Lắc & Vòng tay',
    description: 'Các mẫu lắc tay và vòng tay trơn hoặc đính đá.',
  },
  {
    id: 'bong-tai',
    name: 'Bông tai',
    description: 'Các mẫu bông tai nụ, bông tai khoen và bông tai dáng thả.',
  },
  {
    id: 'lac-chan',
    name: 'Lắc chân',
    description: 'Mẫu lắc chân mảnh thanh lịch.',
  },
] as const;

export type ProductMaterial = 'silver' | 'gold' | 'platinum';

export interface MaterialInfo {
  id: ProductMaterial;
  name: string;
  description: string;
}

export const MATERIALS: readonly MaterialInfo[] = [
  {
    id: 'silver',
    name: 'Bạc',
    description: 'Trang sức bạc trơn và bạc đính đá.',
  },
  {
    id: 'gold',
    name: 'Vàng',
    description: 'Trang sức vàng 10K, 14K và 18K.',
  },
  {
    id: 'platinum',
    name: 'Bạch kim',
    description: 'Trang sức bạch kim thanh lịch.',
  },
] as const;

export const MATERIAL_OPTIONS = MATERIALS;

export type JewelryItemType =
  | 'ring'
  | 'chain'
  | 'necklace'
  | 'pendant'
  | 'bracelet'
  | 'earring'
  | 'anklet';

export function getItemTypeLabel(itemType: JewelryItemType): string {
  switch (itemType) {
    case 'ring':
      return 'Nhẫn';
    case 'chain':
      return 'Dây chuyền trơn';
    case 'necklace':
      return 'Dây cổ';
    case 'pendant':
      return 'Mặt dây chuyền';
    case 'bracelet':
      return 'Lắc & Vòng tay';
    case 'earring':
      return 'Bông tai';
    case 'anklet':
      return 'Lắc chân';
  }
}

export function getSeparationNotice(itemType: JewelryItemType): string | null {
  if (itemType === 'chain') {
    return 'Chỉ gồm sợi dây chuyền, không kèm mặt dây.';
  }
  if (itemType === 'pendant') {
    return 'Chỉ gồm mặt dây, không kèm dây chuyền.';
  }
  return null;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: ProductCategory;
  itemType: JewelryItemType;
  material: ProductMaterial;
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

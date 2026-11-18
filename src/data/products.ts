import type { Product } from '../types/product';

/**
 * Danh mục 8 sản phẩm demo của cửa hàng NFA.
 * Giá và tồn kho là dữ liệu demo.
 * Mô tả dựa trên hình dáng quan sát thực tế và phân định rõ ràng giữa Dây chuyền và Mặt dây chuyền.
 */
export const PRODUCTS: readonly Product[] = [
  // 1. Nhẫn đính đá một viên
  {
    id: 'prod-01',
    slug: 'nhan-bac-dinh-da-solitaire-xm0088',
    sku: 'NFA-RNG-XM0088',
    name: 'Nhẫn bạc điểm đá NFA',
    category: 'nhan',
    itemType: 'ring',
    price: 480000,
    stock: 7,
    image: '/products/SP-nhan-bac-dinh-da-pnjsilver-xm00k000088-1.png',
    imageAlt: 'Nhẫn bạc thân trơn đính chìm một viên đá nhỏ',
    shortDescription: 'Nhẫn bạc thân trơn với một viên đá nhỏ đính chìm trên đai nhẫn.',
    description: 'Nhẫn bạc với đai thân trơn nhẵn, điểm xuyết một viên đá nhỏ được gắn chìm khéo léo trên bề mặt đai nhẫn.',
    featured: true,
  },

  // 2. Nhẫn đính đá viền
  {
    id: 'prod-02',
    slug: 'nhan-bac-dinh-da-luon-song-sn0144',
    sku: 'NFA-RNG-SN0144',
    name: 'Nhẫn bạc đính đá viền NFA',
    category: 'nhan',
    itemType: 'ring',
    price: 520000,
    stock: 5,
    image: '/products/sp-snxmxmk000144-nhan-bac-dinh-da-pnjsilver-1.png',
    imageAlt: 'Nhẫn bạc có một viên đá chủ nổi bật và các viên đá nhỏ đính dọc thân nhẫn',
    shortDescription: 'Nhẫn bạc đính một viên đá chủ nhô cao kết hợp dải đá nhỏ dọc thân nhẫn.',
    description: 'Nhẫn bạc với một viên đá chủ nổi bật ở giữa và hai bên thân nhẫn được đính các viên đá nhỏ dọc theo đai nhẫn.',
    featured: false,
  },

  // 3. Dây chuyền trơn (Chain - Không kèm mặt)
  {
    id: 'prod-03',
    slug: 'day-chuyen-bac-dan-chu-cong-sd0028',
    sku: 'NFA-CHN-SD0028',
    name: 'Dây chuyền bạc đan chữ công NFA',
    category: 'day-chuyen',
    itemType: 'chain',
    price: 790000,
    stock: 4,
    image: '/products/sp-sd0000k000028-day-chuyen-nam-bac-pnjsilver-day-dan-kieu-chu-cong-1.png',
    imageAlt: 'Sợi dây chuyền bạc đan mắt xích kiểu chữ công',
    shortDescription: 'Sợi dây chuyền bạc mắt xích đan kiểu chữ công, không kèm mặt dây chuyền.',
    description: 'Sợi dây chuyền bạc dạng đan mắt xích kiểu chữ công trơn, bản dẹp vừa phải với móc khóa tròn. Đây là sợi dây chuyền đơn lẻ, không có mặt dây kèm theo.',
    featured: true,
  },

  // 4. Mặt dây chuyền (Pendant - Không kèm dây)
  {
    id: 'prod-04',
    slug: 'mat-day-chuyen-bac-trai-tim-sm0122',
    sku: 'NFA-PD-SM0122',
    name: 'Mặt dây chuyền bạc đính đá trái tim NFA',
    category: 'day-chuyen',
    itemType: 'pendant',
    price: 390000,
    stock: 9,
    image: '/products/sp-smxmxmk000122-mat-day-chuyen-bac-dinh-da-pnjsilver-hinh-trai-tim-1.png',
    imageAlt: 'Mặt dây chuyền bạc hình trái tim đính đá',
    shortDescription: 'Mặt dây chuyền hình trái tim đính đá viền, không bao gồm sợi dây.',
    description: 'Mặt dây chuyền bạc tạo hình trái tim với viền đính các hạt đá nhỏ và khoen xỏ phía trên. Đây là mặt dây chuyền độc lập, không kèm sợi dây chuyền.',
    featured: false,
  },

  // 5. Lắc tay đính đá
  {
    id: 'prod-05',
    slug: 'lac-tay-bac-dinh-da-thanh-manh-sl0015',
    sku: 'NFA-BR-SL0015',
    name: 'Lắc tay bạc đính đá thanh mảnh NFA',
    category: 'lac-tay',
    itemType: 'bracelet',
    price: 650000,
    stock: 6,
    image: '/products/sp-slxmxmk000015-lac-tay-bac-dinh-da-pnjsilver-1.png',
    imageAlt: 'Lắc tay bạc dạng chuỗi xích mảnh điểm đá tròn',
    shortDescription: 'Lắc tay bạc chuỗi xích mảnh xen kẽ các điểm đá tròn nhỏ.',
    description: 'Lắc tay bạc dạng chuỗi xích thanh mảnh với các điểm gắn đá tròn nhỏ phân bố dọc theo dây lắc, có đoạn xích phụ điều chỉnh độ dài.',
    featured: true,
  },

  // 6. Lắc tay mắt xích trơn
  {
    id: 'prod-06',
    slug: 'lac-tay-bac-mat-xich-tron-sl12836',
    sku: 'NFA-BR-SL12836',
    name: 'Lắc tay bạc mắt xích trơn NFA',
    category: 'lac-tay',
    itemType: 'bracelet',
    price: 580000,
    stock: 8,
    image: '/products/slh2ky12836.000-lac-tay-bac-pnjsilver-01.png',
    imageAlt: 'Lắc tay bạc dạng chuỗi mắt xích oval trơn',
    shortDescription: 'Lắc tay bạc dạng các mắt xích oval trơn nối tiếp nhau.',
    description: 'Lắc tay bạc với các vòng mắt xích oval trơn nối liền nhau tạo thành chuỗi, có móc khóa tròn ở đầu lắc.',
    featured: false,
  },

  // 7. Bông tai trái tim
  {
    id: 'prod-07',
    slug: 'bong-tai-bac-dinh-da-trai-tim-sb0114',
    sku: 'NFA-ER-SB0114',
    name: 'Bông tai bạc đính đá trái tim NFA',
    category: 'bong-tai',
    itemType: 'earring',
    price: 420000,
    stock: 6,
    image: '/products/sp-sbxmxmk000114-bong-tai-bac-dinh-da-pnjsilver-hinh-trai-tim-1.png',
    imageAlt: 'Đôi bông tai bạc hình trái tim đính đá',
    shortDescription: 'Đôi bông tai nụ bạc hình trái tim đính đá nhỏ.',
    description: 'Đôi bông tai bạc dạng nụ với mặt trước hình trái tim đính đá nhỏ, mặt sau có chốt gài giữ khuyên tai.',
    featured: true,
  },

  // 8. Bông tai nụ đính đá
  {
    id: 'prod-08',
    slug: 'bong-tai-bac-dinh-da-nu-tron-sb0121',
    sku: 'NFA-ER-SB0121',
    name: 'Bông tai nụ bạc đính đá NFA',
    category: 'bong-tai',
    itemType: 'earring',
    price: 350000,
    stock: 10,
    image: '/products/sp-sbxm00k000121-bong-tai-bac-dinh-da-pnjsilver-1.png',
    imageAlt: 'Đôi bông tai nụ bạc đính một viên đá trung tâm',
    shortDescription: 'Đôi bông tai nụ bạc đính một viên đá ở vị trí trung tâm.',
    description: 'Đôi bông tai bạc dạng nụ với một viên đá đơn đính ở vị trí trung tâm, kèm chốt gài phía sau.',
    featured: false,
  },
] as const;

export function getAllProducts(): readonly Product[] {
  return PRODUCTS;
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): readonly Product[] {
  if (category === 'all') return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === category);
}

export function getFeaturedProducts(): readonly Product[] {
  return PRODUCTS.filter((p) => p.featured);
}

import {
  CATEGORIES,
  type Product,
  type ProductCategory,
} from '../../types/product';

export type CategoryStageTone =
  | 'midnight'
  | 'champagne'
  | 'mist'
  | 'charcoal'
  | 'pearl';

export type CategoryMediaFraming =
  | 'ring'
  | 'pendant'
  | 'bracelet'
  | 'earring'
  | 'anklet';

export interface CategoryShowcaseEditorialSpec {
  readonly previewProductId: string;
  readonly headline: string;
  readonly paragraphs: readonly string[];
  readonly note: string | null;
  readonly ctaLabel: string;
  readonly tone: CategoryStageTone;
  readonly framing: CategoryMediaFraming;
  readonly featured: boolean;
}

export interface CategoryShowcaseItem {
  readonly id: ProductCategory;
  readonly label: string;
  readonly headline: string;
  readonly paragraphs: readonly string[];
  readonly note: string | null;
  readonly ctaLabel: string;
  readonly href: string;
  readonly tone: CategoryStageTone;
  readonly framing: CategoryMediaFraming;
  readonly featured: boolean;
  readonly previewProductId: string;
  readonly previewImage: string;
  readonly previewImageAlt: string;
}

export const CATEGORY_SHOWCASE_SPRING_DURATION_SEC = 0.45;
export const CATEGORY_SHOWCASE_SPRING_BOUNCE = 0.12;
export const CATEGORY_SHOWCASE_EXIT_FALLBACK_MS = 900;

export const CATEGORY_EDITORIAL_SPECS: Readonly<
  Record<ProductCategory, CategoryShowcaseEditorialSpec>
> = {
  nhan: {
    previewProductId: 'prod-01',
    headline: 'Một điểm sáng, một dấu ấn riêng.',
    paragraphs: [
      'Đai nhẫn trơn giữ vẻ gọn gàng; những thiết kế điểm đá mang thêm nét nổi bật.',
      'Chọn một chiếc làm điểm nhấn hoặc phối cùng những dáng nhẫn thanh mảnh.',
    ],
    note: null,
    ctaLabel: 'Khám phá nhẫn',
    tone: 'midnight',
    framing: 'ring',
    featured: true,
  },
  'day-chuyen': {
    previewProductId: 'prod-04',
    headline: 'Đường nét thanh mảnh, điểm nhìn cuốn hút.',
    paragraphs: [
      'Dây chuyền trơn, dây cổ liền mặt và mặt dây độc lập mang đến nhiều cách phối.',
      'Một thiết kế vừa vặn có thể tạo điểm nhấn cho áo sơ mi, cổ áo mở hoặc chiếc váy tối giản.',
    ],
    note: 'Dây chuyền và mặt dây được bán riêng, trừ thiết kế dây cổ liền mặt.',
    ctaLabel: 'Khám phá dây chuyền & mặt dây',
    tone: 'champagne',
    framing: 'pendant',
    featured: false,
  },
  'lac-tay': {
    previewProductId: 'prod-06',
    headline: 'Theo từng chuyển động của bạn.',
    paragraphs: [
      'Từ mắt xích gọn gàng đến những chi tiết điểm đá, trang sức cổ tay thêm nét mềm mại cho mỗi cử chỉ.',
      'Đeo riêng để giữ sự nhẹ nhàng hoặc phối cùng đồng hồ theo phong cách của bạn.',
    ],
    note: null,
    ctaLabel: 'Khám phá lắc & vòng tay',
    tone: 'mist',
    framing: 'bracelet',
    featured: false,
  },
  'bong-tai': {
    previewProductId: 'prod-08',
    headline: 'Một điểm nhấn, sáng cả gương mặt.',
    paragraphs: [
      'Dáng nụ nhỏ gọn, khoen thanh lịch hay thiết kế dáng thả tạo những sắc thái khác nhau.',
      'Chọn theo kiểu tóc, đường nét gương mặt và dịp bạn muốn diện.',
    ],
    note: null,
    ctaLabel: 'Khám phá bông tai',
    tone: 'charcoal',
    framing: 'earring',
    featured: false,
  },
  'lac-chan': {
    previewProductId: 'prod-51',
    headline: 'Nét duyên trong từng bước chân.',
    paragraphs: [
      'Sợi lắc mảnh tạo điểm nhấn quanh cổ chân, dễ kết hợp cùng sandal hoặc trang phục có độ dài trên mắt cá.',
      'Một chi tiết nhỏ cho những ngày bạn muốn chăm chút thêm cho diện mạo.',
    ],
    note: null,
    ctaLabel: 'Khám phá lắc chân',
    tone: 'pearl',
    framing: 'anklet',
    featured: false,
  },
};

export function getCategoryCatalogHref(categoryId: ProductCategory): string {
  return `/san-pham?category=${categoryId}`;
}

export function resolveCategoryPreviewProduct(
  categoryId: ProductCategory,
  products: readonly Product[]
): Product | undefined {
  const preferredId = CATEGORY_EDITORIAL_SPECS[categoryId].previewProductId;
  const preferred = products.find(
    (product) => product.id === preferredId && product.category === categoryId
  );
  if (preferred) {
    return preferred;
  }
  return products.find((product) => product.category === categoryId);
}

export function buildCategoryShowcaseItems(
  products: readonly Product[]
): CategoryShowcaseItem[] {
  return CATEGORIES.map((category) => {
    const spec = CATEGORY_EDITORIAL_SPECS[category.id];
    const previewProduct = resolveCategoryPreviewProduct(category.id, products);

    if (!previewProduct) {
      throw new Error(
        `Missing preview product for category "${category.id}" (preferred "${spec.previewProductId}").`
      );
    }

    return {
      id: category.id,
      label: category.name,
      headline: spec.headline,
      paragraphs: [...spec.paragraphs],
      note: spec.note,
      ctaLabel: spec.ctaLabel,
      href: getCategoryCatalogHref(category.id),
      tone: spec.tone,
      framing: spec.framing,
      featured: spec.featured,
      previewProductId: previewProduct.id,
      previewImage: previewProduct.image,
      previewImageAlt: previewProduct.imageAlt,
    };
  });
}

export interface ClickEventLike {
  readonly button: number;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly defaultPrevented?: boolean;
}

/**
 * Allows Ctrl/Cmd/Shift/Alt/middle-click to fall through to native anchor navigation
 * while intercepting ordinary primary activation for the editorial modal.
 */
export function isModifiedAnchorActivation(event: ClickEventLike): boolean {
  return (
    Boolean(event.defaultPrevented) ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export interface FocusTrapQuery {
  readonly focusableCount: number;
  readonly activeIndex: number;
  readonly shiftKey: boolean;
}

/**
 * Returns the index to focus when wrapping keyboard Tab/Shift+Tab inside a modal,
 * or null when native Tab order should proceed within the modal.
 */
export function resolveFocusTrapTarget({
  focusableCount,
  activeIndex,
  shiftKey,
}: FocusTrapQuery): number | null {
  if (focusableCount <= 0) {
    return null;
  }
  if (focusableCount === 1) {
    return 0;
  }
  if (activeIndex < 0 || activeIndex >= focusableCount) {
    return shiftKey ? focusableCount - 1 : 0;
  }
  if (shiftKey && activeIndex === 0) {
    return focusableCount - 1;
  }
  if (!shiftKey && activeIndex === focusableCount - 1) {
    return 0;
  }
  return null;
}

/**
 * Computes scrollbar gutter width to compensate body & fixed header padding
 * so locking scroll never introduces horizontal shift.
 */
export function resolveScrollLockCompensation(
  innerWidth: number,
  clientWidth: number
): number {
  if (!Number.isFinite(innerWidth) || !Number.isFinite(clientWidth)) {
    return 0;
  }
  return Math.max(0, Math.round(innerWidth - clientWidth));
}

export interface CategoryMotionConfig {
  readonly enableSharedLayout: boolean;
  readonly shellTransition:
    | { readonly type: 'spring'; readonly visualDuration: number; readonly bounce: number }
    | { readonly duration: number; readonly ease: 'easeOut' };
  readonly backdropTransition: {
    readonly duration: number;
    readonly ease: readonly [number, number, number, number];
  };
  readonly bodyEnterTransition: {
    readonly duration: number;
    readonly delay: number;
    readonly ease: readonly [number, number, number, number];
  };
  readonly bodyExitTransition: {
    readonly duration: number;
    readonly ease: 'easeOut';
  };
  readonly closeButtonTransition: {
    readonly duration: number;
    readonly delay: number;
    readonly ease: 'easeOut';
  };
}

export function resolveCategoryMotionConfig(
  prefersReducedMotion: boolean
): CategoryMotionConfig {
  if (prefersReducedMotion) {
    return {
      enableSharedLayout: false,
      shellTransition: {
        duration: 0.14,
        ease: 'easeOut',
      },
      backdropTransition: {
        duration: 0.14,
        ease: [0.22, 1, 0.36, 1],
      },
      bodyEnterTransition: {
        duration: 0.14,
        delay: 0,
        ease: [0.22, 1, 0.36, 1],
      },
      bodyExitTransition: {
        duration: 0.1,
        ease: 'easeOut',
      },
      closeButtonTransition: {
        duration: 0.12,
        delay: 0,
        ease: 'easeOut',
      },
    };
  }

  return {
    enableSharedLayout: true,
    shellTransition: {
      type: 'spring',
      visualDuration: CATEGORY_SHOWCASE_SPRING_DURATION_SEC,
      bounce: CATEGORY_SHOWCASE_SPRING_BOUNCE,
    },
    backdropTransition: {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
    },
    bodyEnterTransition: {
      duration: 0.24,
      delay: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
    bodyExitTransition: {
      duration: 0.12,
      ease: 'easeOut',
    },
    closeButtonTransition: {
      duration: 0.2,
      delay: 0.16,
      ease: 'easeOut',
    },
  };
}

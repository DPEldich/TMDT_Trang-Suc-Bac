export type HomeSectionId =
  | 'featured-heading'
  | 'categories-heading'
  | 'feedback-heading';

export interface HomeSectionLink {
  readonly id: HomeSectionId;
  readonly href: `/#${HomeSectionId}`;
  readonly label: string;
}

export const HOME_SECTION_LINKS: readonly HomeSectionLink[] = [
  {
    id: 'featured-heading',
    href: '/#featured-heading',
    label: 'Mẫu nổi bật',
  },
  {
    id: 'categories-heading',
    href: '/#categories-heading',
    label: 'Danh mục',
  },
  {
    id: 'feedback-heading',
    href: '/#feedback-heading',
    label: 'Đánh giá khách hàng',
  },
] as const;

export type DesktopMegaMenuId = 'home' | 'collection';

export interface OpenMegaMenuState {
  readonly menuId: DesktopMegaMenuId;
  readonly path: string;
  readonly pinned: boolean;
}

export const DESKTOP_MEGA_PANEL_IDS: Readonly<Record<DesktopMegaMenuId, string>> = {
  home: 'home-navigation',
  collection: 'collection-navigation',
};

const HOME_SECTION_ID_SET: ReadonlySet<string> = new Set<HomeSectionId>([
  'featured-heading',
  'categories-heading',
  'feedback-heading',
]);

export function isHomeSectionId(value: string): value is HomeSectionId {
  return HOME_SECTION_ID_SET.has(value);
}

export function extractHomeSectionId(href: string): HomeSectionId | null {
  const hashIndex = href.indexOf('#');
  if (hashIndex === -1) {
    return null;
  }
  const prefix = href.slice(0, hashIndex);
  if (prefix !== '' && prefix !== '/') {
    return null;
  }
  const candidate = href.slice(hashIndex + 1);
  return isHomeSectionId(candidate) ? candidate : null;
}

export function resolveActiveMegaMenu(
  openMenu: OpenMegaMenuState | null,
  pathname: string | null | undefined
): DesktopMegaMenuId | null {
  if (!openMenu || !pathname || openMenu.path !== pathname) {
    return null;
  }
  return openMenu.menuId;
}

export function resolvePointerEnterMegaMenu(params: {
  readonly openMenu: OpenMegaMenuState | null;
  readonly pathname: string;
  readonly menuId: DesktopMegaMenuId;
  readonly canHover: boolean;
}): OpenMegaMenuState | null {
  const { openMenu, pathname, menuId, canHover } = params;
  if (!canHover) {
    return openMenu;
  }
  const activeMenuId = resolveActiveMegaMenu(openMenu, pathname);
  if (activeMenuId === menuId) {
    return openMenu;
  }
  return {
    menuId,
    path: pathname,
    pinned: false,
  };
}

export function resolveClickMegaMenu(params: {
  readonly openMenu: OpenMegaMenuState | null;
  readonly pathname: string;
  readonly menuId: DesktopMegaMenuId;
}): OpenMegaMenuState | null {
  const { openMenu, pathname, menuId } = params;
  const activeMenuId = resolveActiveMegaMenu(openMenu, pathname);
  if (activeMenuId === menuId && openMenu?.pinned) {
    return null;
  }
  return {
    menuId,
    path: pathname,
    pinned: true,
  };
}

export function resolveScheduledCloseMegaMenu(params: {
  readonly openMenu: OpenMegaMenuState | null;
  readonly pathname: string;
  readonly scheduledForMenuId?: DesktopMegaMenuId;
}): OpenMegaMenuState | null {
  const { openMenu, pathname, scheduledForMenuId } = params;
  if (!openMenu || openMenu.path !== pathname) {
    return null;
  }
  if (openMenu.pinned) {
    return openMenu;
  }
  if (scheduledForMenuId && openMenu.menuId !== scheduledForMenuId) {
    return openMenu;
  }
  return null;
}

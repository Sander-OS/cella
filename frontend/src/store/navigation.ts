import { config } from 'config';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getUserMenu } from '~/api/users';
import type { NavItem } from '~/modules/common/app-nav';
import { menuSections } from '~/modules/common/nav-sheet/sheet-menu';
import type { UserMenu } from '~/types';

interface NavigationState {
  activeSheet: NavItem | null;
  setSheet: (activeSheet: NavItem | null) => void;
  menu: UserMenu;
  getMenu(): Promise<UserMenu | null>;
  keepMenuOpen: boolean;
  toggleKeepMenu: (status: boolean) => void;
  activeSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

// Build the initial menu (for menu sheet)
const initialMenuState = menuSections.reduce<UserMenu>((acc, section) => {
  acc[section.id as keyof UserMenu] = { active: [], inactive: [], canCreate: false };
  return acc;
}, {} as UserMenu);

export const useNavigationStore = create<NavigationState>()(
  devtools(
    immer(
      persist(
        (set) => ({
          activeSheet: null as NavItem | null,
          keepMenuOpen: false as boolean,
          menu: initialMenuState,
          activeSections: {},
          setSheet: (component) => {
            set((state) => {
              state.activeSheet = component;
            });
          },
          async getMenu() {
            const menu = await getUserMenu();
            set((state) => {
              state.menu = menu as UserMenu;
            });

            return menu || null;
          },
          toggleKeepMenu: (status) => {
            set((state) => {
              state.keepMenuOpen = status;
            });
          },
          toggleSection: (section) => {
            set((state) => {
              state.activeSections[section] = !state.activeSections[section];
            });
          },
        }),
        {
          name: `${config.slug}-navigation`,
          partialize: (state) => ({
            keepMenuOpen: state.keepMenuOpen,
            activeSections: state.activeSections,
          }),
          storage: createJSONStorage(() => localStorage),
        },
      ),
    ),
  ),
);

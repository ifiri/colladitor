import BellIcon from '@/assets/icons/editor/bell.svg?raw';

import { Dropdown, DropdownSubmenu, type MenuElement } from '@/features/CollaborativeEditor/plugins/menu';
import { Schema } from 'prosemirror-model';

import { cutUnsupportedBlocks } from '@/features/CollaborativeEditor/utils/menu';

import { getBlocksFor } from '@/features/CollaborativeEditor/blocks';
import { type BlocksResult } from '@/features/CollaborativeEditor/types';

type MenusResult = {
  blockMenu: MenuElement[][];
  listMenu: MenuElement[][];
  inlineMenu: MenuElement[][];
  actionsMenu: MenuElement[][] | Dropdown[][];
  linkMenu: MenuElement[][];
  supportMenu: MenuElement[][];
};

export function buildMenuItems(schema: Schema): MenuElement[][] {
  const blocks: BlocksResult = getBlocksFor(schema);

  const menus: MenusResult = {
    inlineMenu: [
      cutUnsupportedBlocks([
        blocks.makeHead2,
        blocks.makeHead3,
        blocks.toggleStrong,
        blocks.toggleEm,
        blocks.toggleUnderline,
        blocks.toggleStrike,
      ]),
    ],

    listMenu: [
      cutUnsupportedBlocks([
        blocks.wrapBulletList,
        blocks.liftItemBullet,
        blocks.wrapOrderedList,
        blocks.liftItemOrdered,
      ]),
    ],

    blockMenu: [cutUnsupportedBlocks([blocks.insertImage, blocks.wrapBlockQuote, blocks.insertEmbed])],

    linkMenu: [cutUnsupportedBlocks([blocks.toggleLink])],
    supportMenu: [cutUnsupportedBlocks([blocks.imageDataHelper, blocks.imageCaptionHelper])],

    actionsMenu: [
      [
        new Dropdown(
          [
            blocks.makeContainerSmall,
            blocks.makeDisclaimer,
            new DropdownSubmenu(
              [
                blocks.subscriptionFormLawDecoded,
                blocks.subscriptionFormMarketsOutlook,
                blocks.subscriptionFormDefi,
                blocks.subscriptionFormResearch,
                blocks.subscriptionFormNifty,
                blocks.subscriptionFormCryptobiz,
              ],
              {
                label: 'Subscription Form',
                iconRaw: BellIcon,
              },
            ),
          ],
          {
            class: 'ProseMirror-Imperium-blocks-menu',
          },
        ),
        blocks.undo,
        blocks.redo,
      ],
    ],
  };

  return ([] as MenuElement[][]).concat(
    menus.actionsMenu,
    menus.inlineMenu,
    menus.listMenu,
    menus.blockMenu,
    menus.linkMenu,
    menus.supportMenu,
  );
}

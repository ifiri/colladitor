import DisclaimerIcon from '@/assets/icons/editor/disclaimer.svg?raw';

import { wrapItem } from '@/features/CollaborativeEditor/plugins/menu';
import type { NodeType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';

export const buildDisclaimer = (node: NodeType): InstallableBlock => {
  return {
    key: 'makeDisclaimer',
    item: wrapItem(node, {
      enable: () => true,
      render: () => {
        const label = 'Disclaimer';

        const template = `<div>${DisclaimerIcon}<div>${label}</div></div>`;
        return new DOMParser().parseFromString(template, 'text/html').body.firstElementChild as HTMLElement;
      },
    }),
  };
};

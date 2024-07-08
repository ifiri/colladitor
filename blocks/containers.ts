import ContainerIcon from '@/assets/icons/editor/container.svg?raw';

import { wrapItem } from '@/features/CollaborativeEditor/plugins/menu';
import type { NodeType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';

export const buildContainers = (node: NodeType): InstallableBlock => {
  return {
    key: 'makeContainerSmall',
    item: wrapItem(node, {
      enable: () => true,
      render: () => {
        const label = 'Container';

        const template = `<div>${ContainerIcon}<div>${label}</div></div>`;
        return new DOMParser().parseFromString(template, 'text/html').body.firstElementChild as HTMLElement;
      },
    }),
  };
};

import Heading2Icon from '@/assets/icons/editor/heading-2.svg?raw';
import Heading3Icon from '@/assets/icons/editor/heading-3.svg?raw';

import { blockTypeItem } from '@/features/CollaborativeEditor/plugins/menu';

import type { NodeType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';
import { schema } from '@/features/CollaborativeEditor/schema';

export const buildHeadings = (node: NodeType): InstallableBlock[] => {
  const heading2IconNode = new DOMParser().parseFromString(Heading2Icon, 'text/html').body.firstElementChild;
  const heading3IconNode = new DOMParser().parseFromString(Heading3Icon, 'text/html').body.firstElementChild;

  return [
    {
      key: 'makeHead2',
      item: blockTypeItem(schema.nodes.h2, {
        title: 'Change to heading 2',
        icon: { dom: heading2IconNode as Node },
        attrs: {},
      }),
    },
    {
      key: 'makeHead3',
      item: blockTypeItem(schema.nodes.h3, {
        title: 'Change to heading 3',
        icon: { dom: heading3IconNode as Node },
        attrs: {},
      }),
    },
  ];
};

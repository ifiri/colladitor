import LawDecoded from '@/assets/icons/editor/subscriptions/law-decoded.svg?raw';
import MarketsOutlook from '@/assets/icons/editor/subscriptions/markets-outlook.svg?raw';
import Defi from '@/assets/icons/editor/subscriptions/defi.svg?raw';
import Research from '@/assets/icons/editor/subscriptions/research.svg?raw';
import Nifty from '@/assets/icons/editor/subscriptions/nifty.svg?raw';
import Cryptobiz from '@/assets/icons/editor/subscriptions/cryptobiz.svg?raw';

import { wrapItem } from '@/features/CollaborativeEditor/plugins/menu';
import {
  wrapIn,
  splitBlock,
  exitCode,
  selectTextblockEnd,
  createParagraphNear,
  selectNodeBackward,
  selectNodeForward,
  selectParentNode,
  lift,
  deleteSelection,
} from 'prosemirror-commands';

import type { NodeType } from 'prosemirror-model';
import type { BlocksResult, InstallableBlock } from '@/features/CollaborativeEditor/types';

const getIconFrom = (rawSvg: string): Element => {
  return rawSvg;
  return new DOMParser().parseFromString(rawSvg, 'text/html').body.firstElementChild;
};

const FORMS = [
  {
    type: 'law_decoded',
    key: 'LawDecoded',
    label: 'Law Decoded',
    description: 'A weekly summary of the latest news in crypto legislation and regulations',
    icon: getIconFrom(LawDecoded),
  },
  {
    type: 'markets_outlook',
    key: 'MarketsOutlook',
    label: 'Markets Outlook',
    description: 'Weekly newsletter that covers the main factors influencing Bitcoin’s plice and the week ahead',
    icon: getIconFrom(MarketsOutlook),
  },
  {
    type: 'defi_newsletter',
    key: 'Defi',
    label: 'DeFi Newsletter',
    description: 'A weekly summary of the most impactful DeFi stories, insights and education developments',
    icon: getIconFrom(Defi),
  },
  {
    type: 'consulting_newsletter',
    key: 'Research',
    label: 'Consulting Newsletter',
    description: 'In-depth Market Insights report from our Research team',
    icon: getIconFrom(Research),
  },
  {
    type: 'nifty_newsletter',
    key: 'Nifty',
    label: 'Nifty Newsletter',
    description: 'A weekly summary of the last NFT headlines',
    icon: getIconFrom(Nifty),
  },
  {
    type: 'crypto_biz',
    key: 'Cryptobiz',
    label: 'Crypto Biz Newsletter',
    description: 'A weekly plus of the business behind blockchain and crypto',
    icon: getIconFrom(Cryptobiz),
  },
];

const render = (icon: string, label: string, description: string): HTMLElement => {
  const template = `<div>
    <div class="subscription-form-item">
      <div class="subscription-form-item__icon">
        ${icon}
      </div>

      <div>
        <div>
          ${label}
        </div>

        <div class="description">${description}</div>
      </div>
    </div>
  </div>`;

  return new DOMParser().parseFromString(template, 'text/html').body.firstElementChild as HTMLElement;
};

export const buildSubscriptionForms = (node: NodeType): InstallableBlock[] => {
  return FORMS.map((formData) => ({
    key: `subscriptionForm${formData.key}` as keyof BlocksResult,
    item: wrapItem(node, {
      run(state, dispatch, view, event) {
        const { $from, $to } = state.selection;

        if ($from.depth === $to.depth) {
          const nearestElement = $to.path[$to.path.length - 3];

          if (nearestElement && nearestElement?.content.size === 0) {
            deleteSelection(view.state, view.dispatch);
          } else {
            // XXX: not a bug. Need to split twicely.
            splitBlock(view.state, view.dispatch);
            splitBlock(view.state, view.dispatch);
            selectNodeBackward(view.state, view.dispatch);
          }
        } else {
          deleteSelection(view.state, view.dispatch);
        }

        wrapIn(node, {
          type: formData.type,
          label: `Subscription Form: ${formData.label}`,
        })(view.state, view.dispatch);

        // XXX: not a bug. Need to go up twicely.
        selectParentNode(view.state, view.dispatch);
        selectParentNode(view.state, view.dispatch);
        createParagraphNear(view.state, view.dispatch, view);
      },
      render: () => {
        return render(formData.icon, formData.label, formData.description);
      },
    }),
  }));
};

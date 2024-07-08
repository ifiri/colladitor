import type { MarkType, NodeType, Schema } from 'prosemirror-model';

import type { InstallableBlock, BlocksResult } from '../types';

import { buildBold } from './bold';
import { buildEm } from './em';
import { buildCode } from './code';
import { buildLink } from './link';
import { buildBulletList } from './bulletList';
import { buildOrderedList } from './orderedList';
import { buildBlockquote } from './blockquote';
import { buildHeadings } from './headings';
import { buildContainers } from './containers';
import { buildDisclaimer } from './disclaimer';
import { buildUnderline } from './underline';
import { buildPicture } from './picture';
import { buildAdvertisement } from './advertisement';
import { buildHistory } from './history';
import { buildSubscriptionForms } from './subscriptionForms';
import { imagesDataHelper } from './imagesDataHelper';
import { buildEmbed } from './embed';
import { buildStrike } from '@/features/CollaborativeEditor/blocks/strike';

const MARKS_MAP: Record<string, (mark: MarkType) => InstallableBlock> = {
  strong: buildBold,
  em: buildEm,
  code: buildCode,
  a: buildLink,
  u: buildUnderline,
  s: buildStrike,
};

const NODES_MAP: Record<string, (node: NodeType) => InstallableBlock | InstallableBlock[]> = {
  ul: buildBulletList,
  ol: buildOrderedList,
  blockquote: buildBlockquote,
  heading: buildHeadings,
  container: buildContainers,
  disclaimer: buildDisclaimer,
  advertisement: buildAdvertisement,
  subscription_form: buildSubscriptionForms,
  figure: buildPicture,
  embed: buildEmbed,
  img: imagesDataHelper,
};

export const getBlocksFor = (schema: Schema<string, any>): BlocksResult => {
  const result: Partial<BlocksResult> = {};

  Object.keys(MARKS_MAP).forEach((key: string) => {
    const build = MARKS_MAP[key];
    const block = build(schema.marks[key]);

    result[block.key] = block.item;
  });

  Object.keys(NODES_MAP).forEach((key: string) => {
    const build = NODES_MAP[key];
    const blocks = build(schema.nodes[key]);

    if (Array.isArray(blocks)) {
      blocks.forEach((block) => {
        result[block.key] = block.item;
      });
    } else {
      result[blocks.key] = blocks.item;
    }
  });

  // History
  const historyBlocks = buildHistory();

  historyBlocks.forEach((block) => {
    result[block.key] = block.item;
  });

  // Helpers
  const helpersBlocks = imagesDataHelper();

  helpersBlocks.forEach((block) => {
    result[block.key] = block.item;
  });

  return result as BlocksResult;
};

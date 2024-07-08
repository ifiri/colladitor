import { MenuItem } from '@/features/CollaborativeEditor/plugins/menu';

export interface DocumentCreatePayload {
  title: string;
  content: string;
}

export type DocumentCreateRequest = DocumentCreatePayload;

export type InstallableBlock = {
  key: keyof BlocksResult;
  item: MenuItem;
};

export type BlocksResult = {
  makeHead2: MenuItem;
  makeHead3: MenuItem;
  toggleStrong: MenuItem;
  toggleEm: MenuItem;
  toggleUnderline: MenuItem;
  toggleStrike: MenuItem;
  toggleCode: MenuItem;
  insertEmbed: MenuItem;
  toggleLink: MenuItem;
  insertImage: MenuItem;
  imageDataHelper: MenuItem;
  imageCaptionHelper: MenuItem;
  insertAdvertisement: MenuItem;
  wrapBulletList: MenuItem;
  wrapOrderedList: MenuItem;
  wrapBlockQuote: MenuItem;
  makeParagraph: MenuItem;
  makeContainerSmall: MenuItem;
  makeDisclaimer: MenuItem;

  liftItemBullet: MenuItem;
  liftItemOrdered: MenuItem;

  undo: MenuItem;
  redo: MenuItem;

  subscriptionFormLawDecoded: MenuItem;
  subscriptionFormMarketsOutlook: MenuItem;
  subscriptionFormDefi: MenuItem;
  subscriptionFormResearch: MenuItem;
  subscriptionFormNifty: MenuItem;
  subscriptionFormCryptobiz: MenuItem;
};

export enum EmbedType {
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  BUZZSPROUT = 'buzzsprout_podcast',
  DOCUMENT = 'document_cloud',
}

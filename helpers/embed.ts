import { EmbedType } from '@/features/CollaborativeEditor/types';

export const getTwitterId = (url: string) => {
  if (!url) {
    return null;
  }
  const regex = /(twitter|x)\.com\/.*status(?:es)?\/([\d]+)/gi;
  const result = regex.exec(url) || [];
  const embedId = result.pop();
  if (!embedId) {
    return null;
  }
  return embedId;
};

export const getInstagramId = (url: string) => {
  if (!url) {
    return null;
  }
  const regex = /https?:\/\/(?:www.)?instagram.com\/(?:p|reel)\/([^/?#&]+).*/gm;
  const [, embedId] = regex.exec(url) || [];
  if (!embedId) {
    return null;
  }
  return embedId;
};

export const getYoutubeId = (url: string) => {
  if (!url) {
    return null;
  }
  const regex = /youtu(?:be\.com\/|\.be\/)(?:[-\w]+\?v=|embed\/|v\/)?([-\w]{11})/gi;
  const [, embedId] = regex.exec(url) || [];
  if (!embedId) {
    return null;
  }
  return embedId;
};

export const getVimeoId = (url: string) => {
  if (!url) {
    return null;
  }
  const regex = /vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|)(\d+)(?:|\/\?)/gi;
  const [, embedId] = regex.exec(url) || [];
  if (!embedId) {
    return null;
  }
  return embedId;
};

export const getDocumentCloudId = (url: string) => {
  const regex = /^https:\/\/embed.documentcloud.org/;
  if (!url || !regex.test(url)) {
    return null;
  }

  return url;
};

export const getBuzzsproutPodcastId = (url: string) => {
  /**
   * @example url https://www.buzzsprout.com/2072690?client_source=large_player&iframe=true
   */

  try {
    const parsedUrl = new URL(url);
    const podcastId = parsedUrl.pathname.slice(1);

    if (parsedUrl.hostname.endsWith('buzzsprout.com') && Number.isSafeInteger(Number(podcastId))) {
      return podcastId;
    }

    return null;
  } catch (error) {
    return null;
  }
};

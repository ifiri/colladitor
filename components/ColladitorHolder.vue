<template>
  <div
    v-show="!isLoading"
    id="editor-holder"
    ref="holder"
    :class="$style['colladitor-holder']"
  />
  <div
    v-if="isLoading"
    class="flex justify-center items-center font-normal text-sm text-imperium-fg-muted"
  >
    Connection in progress...
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, nextTick, onMounted, onUnmounted } from 'vue';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo } from 'y-prosemirror';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { colladitorWs } from '@/config';

import { schema } from '../schema';
import { setupProsemirror } from '../plugins/prosemirror';
import { htmlToProseMirrorDoc } from '@/features/CollaborativeEditor/helpers/htmlToProseMirrorDoc';
import { TokenService } from '@/features/Auth/service';
import { useToast } from '@/composables';
import { backspaceDeletePlugin } from '@/features/CollaborativeEditor/plugins/prosemirror/deleteFigurePlugin';
import { enterKeymap } from '@/features/CollaborativeEditor/helpers/enterBindings';
import { useActiveArticleStore } from '@/stores/users.store';
import noRussian, { hasCyrillic } from '@/helpers/no-russian';
import { Plugin } from 'prosemirror-state';
import { useArticleUpdatedAt } from '@/stores/article.store';

const props = defineProps<{
  documentId: string;
  userId: string;
  userName: string;
  languageId: string;
  text: string;
}>();

const articleUpdatedAt = useArticleUpdatedAt();

const handleLinkClicks = (e) => {
  if (e.target?.tagName === 'A' && holder.value.contains(e.target)) {
    const href = e.target.href;

    window.open(href, '_blank').focus();
  }
};

const useUsersAvatarStore = useActiveArticleStore();

const ydoc = new Y.Doc();
const provider = new WebsocketProvider(
  colladitorWs,
  `${props.documentId}?userId=${props.userId}&languageId=${props.languageId}&token=${TokenService.getToken()}`,
  ydoc,
);

const ws = provider.ws;
const toast = useToast();
const isLoading = ref<boolean>(true);
const isConnected = ref<boolean>(false);
const wasContentPutted = ref<boolean>(false);

const type = ydoc.getXmlFragment(`${props.documentId}`);

const holder = ref<HTMLDivElement>();

const unwatch = watchEffect(() => {
  if (!holder.value) {
    return;
  }

  const editor = document.createElement('div');

  // Create prosemirrors nodes from our article full text
  const proseMirrorDoc = htmlToProseMirrorDoc(props.text || '');

  const state = EditorState.create({
    schema,
    plugins: [
      ySyncPlugin(type),
      yCursorPlugin(provider.awareness),
      yUndoPlugin(),
      keymap({
        'Mod-z': undo,
        'Mod-y': redo,
        'Mod-Shift-z': redo,
        ...enterKeymap,
      }),
    ]
      .concat(setupProsemirror({ schema }))
      .concat(backspaceDeletePlugin)
      .concat([
        new Plugin({
          props: {
            handleTextInput(view, from, to, text) {
              return !noRussian(text);
            },
            handlePaste(view, event, slice) {
              return (
                hasCyrillic(slice.content.firstChild.textContent) || hasCyrillic(slice.content.lastChild.textContent)
              );
            },
          },
        }),
      ]),
  });

  const view = new EditorView(editor, {
    state,
    attributes: {
      dir: 'ltr',
    },
  });

  holder.value.appendChild(editor);

  nextTick(() => {
    document.addEventListener('click', handleLinkClicks);
    unwatch();
  });

  setTimeout(() => {
    // put text from database to prosemirror
    if (isConnected.value) {
      isLoading.value = false;
    }

    wasContentPutted.value = true;

    if (!props.text?.length) {
      return;
    }

    if (view.state.doc.content.size > 2) {
      return;
    }

    if (view.state.doc.canAppend(proseMirrorDoc)) {
      const transaction = view.state.tr;

      transaction.replaceWith(0, view.state.doc.content.size, proseMirrorDoc.content);

      view.dispatch(transaction);
    }
  }, 800);
});

ws?.addEventListener('message', (event) => {
  try {
    const currentTime = new Intl.DateTimeFormat('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date());
    articleUpdatedAt.setArticleUpdatedAt(currentTime);
    const message = JSON.parse(event.data);
    if (message.type === 'error') {
      toast.errorTemporary({ id: 'WS_ERROR', message: 'Cannot save changes in article, please try again later' });
      console.error('Received error message from server:', message.message);
      provider.disconnect();
      isLoading.value = true;
    }
  } catch (e) {}
});

// Set cursor with current user name
provider.on('status', (event) => {
  if (event.status === 'disconnected') {
    articleUpdatedAt.setConnection(false);
  }

  if (event.status === 'connecting') {
    isLoading.value = true;
  }

  if (event.status === 'connected') {
    isConnected.value = true;

    if (wasContentPutted.value) {
      isLoading.value = false;
    }
    articleUpdatedAt.setConnection(true);
    const awareness = provider.awareness;
    awareness.setLocalStateField('user', { name: props.userName, id: props.userId });
  }
});

const getUsers = () => {
  const states = provider.awareness.getStates();
  return Array.from(states.values());
};

provider.awareness.on('change', () => {
  const users = getUsers();
  const mappedUsers = users.map((user) => {
    return user['user'];
  });
  useUsersAvatarStore.setUsersStore(mappedUsers);
});

provider.on('sync', (isSynced: boolean) => {
  if (isSynced) {
    const users = getUsers();

    const mappedUsers = users.map((user) => {
      return user['user'];
    });

    useUsersAvatarStore.setUsersStore(mappedUsers);
  }
});

// Remove cursor before reloading page or closing page
window.addEventListener('unload', () => {
  const awareness = provider.awareness;
  awareness.destroy();
});

onMounted(() => {
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target;

      if (target.tagName === 'TEMPLATE') {
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    },
    {
      capture: true,
    },
  );
});

onUnmounted(() => {
  document.removeEventListener('click', handleLinkClicks);
});
</script>

<style lang="scss" module>
.colladitor-holder {
  @apply relative bg-imperium-bg-sub-base text-base text-imperium-fg-extreme h-full;

  > div {
    @apply h-full flex;
  }

  // Customization
  :global(.ProseMirror-menubar-wrapper) {
    @apply w-full;
  }

  :global(.ProseMirror) {
    @apply h-full py-4 px-4;
  }

  :global(.ProseMirror-menubar) {
    @apply flex flex-wrap justify-start items-center bg-imperium-bg-1 shadow-imperium-border rounded-3xl p-1 min-h-10 top-[80px] gap-0 sm:gap-0.5;

    // Need to override "style" which added by ProseMirror with this modern way to make menu sticky
    position: sticky !important;
    width: 100% !important;
  }

  :global(.ProseMirror-menuitem) {
    &:first-child {
      @apply rounded-full;
    }

    &:last-child {
      @apply mr-2;

      @media (max-width: 1274px) and (min-width: 1024px) {
        @apply mr-auto;
      }

      @media (max-width: 675px) {
        @apply mr-auto;
      }
    }
  }

  :global(.ProseMirror-menuitem > *:not(.ProseMirror-menu-disabled)) {
    @apply mr-0 hover:bg-imperium-bg-3;
  }

  :global(.ProseMirror-icon) {
    @apply p-2 rounded;
  }

  :global(.ProseMirror-menuseparator) {
    @apply bg-imperium-border-base border-0 mr-0 w-[1px] h-8;
    display: block !important;
  }
  :global(.ProseMirror-separator) {
    display: none !important;
  }

  // Blocks
  :global(.ProseMirror-menu-dropdown-wrap) {
    @apply p-0 border border-imperium-border-base rounded-3xl;

    display: block !important;
  }

  :global(.ProseMirror-Imperium-blocks-menu.ProseMirror-menu-dropdown) {
    @apply min-w-8 p-2 text-imperium-fg-muted flex gap-2 rounded-3xl;
  }

  :global(.ProseMirror-Imperium-blocks-menu.ProseMirror-menu-dropdown::before) {
    @apply static block top-0 left-0 w-4 h-4;

    content: '';
    background-image: url('~/src/assets/icons/editor/plus.svg');
    background-size: 24px;
    background-repeat: no-repeat;
    background-position: center;
  }

  :global(.ProseMirror-Imperium-blocks-menu.ProseMirror-menu-dropdown::after) {
    @apply static border-0 w-4 h-4 top-0 left-0 block;

    background-image: url('~/src/assets/icons/caret-down.svg');
    background-size: 10px;
    background-repeat: no-repeat;
    background-position: center;
  }

  :global(.ProseMirror-Imperium-blocks-menu.ProseMirror-menu-dropdown-menu),
  :global(.ProseMirror-menu-submenu) {
    @apply top-full left-0 shadow-imperium-base rounded-lg bg-imperium-bg-sub-base py-2 px-0 border border-imperium-border-weak;
  }

  :global(.ProseMirror-Imperium-blocks-menu .ProseMirror-menu-dropdown-item) {
    @apply hover:bg-imperium-bg-3 p-2 font-semibold text-base text-imperium-fg-base flex items-center justify-start gap-2;

    > div {
      @apply flex items-center justify-start gap-2 w-full;
    }
  }

  // Sub Dropdown
  :global(.ProseMirror-menu-submenu-label) {
    @apply pr-8 relative flex items-center gap-2;
  }

  :global(.ProseMirror-menu-submenu-label > svg) {
    @apply w-5 h-5;
  }

  :global(.ProseMirror-menu-submenu-label::after) {
    @apply content-[''] block border-0 absolute right-1 top-1/2 w-3 h-4;

    margin-top: -8px;
    opacity: 0.6;

    background-image: url('~/src/assets/icons/caret-right.svg');
    background-size: 8px;
    background-repeat: no-repeat;
    background-position: center;
  }

  :global(.ProseMirror-menu-submenu) {
    @apply -top-2 px-2 py-3;

    left: 105%;
    width: 320px;
  }
  :global(.ProseMirror-menu-submenu::before) {
    @apply content-[''] block absolute w-4 h-full -left-3 top-0;
  }

  :global(.ProseMirror-menu-dropdown-item .ProseMirror-icon) {
    @apply p-0 w-5 h-5;

    > svg {
      @apply w-5 h-5;
    }
  }

  :global(.ProseMirror-menu-submenu .ProseMirror-menu-dropdown-item) {
    @apply rounded-lg;
  }

  :global(.ProseMirror-menu-submenu .ProseMirror-menu-dropdown-item > div) {
    @apply pt-1 pb-1;
  }

  :global(.ProseMirror-menu-submenu .subscription-form-item) {
    @apply flex items-center w-full;
  }
  :global(.ProseMirror-menu-submenu .subscription-form-item__icon) {
    @apply w-6 min-w-6 h-6 min-h-6;
  }
  :global(.ProseMirror-menu-submenu .subscription-form-item__icon > svg) {
    @apply w-full h-auto;
  }
  :global(.ProseMirror-menu-submenu .subscription-form-item > div:not(:first-child)) {
    @apply overflow-hidden ml-3;
  }

  :global(.ProseMirror-menu-submenu .description) {
    @apply text-imperium-fg-muted font-normal text-sm overflow-hidden text-ellipsis;
  }

  // Styling content in editor
  :global(.ProseMirror-Imperium) {
    h2 {
      @apply font-bold text-xl text-imperium-fg-strong;
    }

    h3 {
      @apply font-semibold text-imperium-fg-strong text-lg;
    }

    em,
    i {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    ul {
      list-style: disc;
    }

    ol {
      list-style: decimal;
    }

    blockquote {
      @apply relative min-h-10 text-lg;

      padding-left: 56px;
      padding-top: 4px;
      border-left: 0px none;

      p:first-child {
        @apply mt-0;
      }
    }

    blockquote::before {
      @apply block absolute;

      content: '';
      top: 2px;
      left: 2px;
      width: 36px;
      height: 36px;
      background-image: url('~/src/assets/icons/editor/representation/blockquote.svg');
      background-size: 36px;
      background-repeat: no-repeat;
      background-position: top left;
    }

    a[href],
    span[href] {
      color: currentColor;

      @apply border-b-2 border-imperium-ds-primary-base no-underline cursor-pointer;
    }

    img {
      min-width: 100px;
      min-height: 80px;
      max-width: 100%;
      max-height: 100%;
      position: relative;
      @apply bg-imperium-bg-3;
    }

    template {
      @apply relative flex items-center justify-center text-center w-full bg-imperium-bg-sub-base border border-imperium-border-base shadow-imperium-form h-96 mb-5 rounded-xl overflow-hidden cursor-pointer;

      &:not(:first-child) {
        @apply mt-5;
      }

      &::before {
        @apply relative inline-block font-semibold text-xl text-imperium-fg-input;

        z-index: 8;
        content: attr(data-label);
      }

      &::after {
        @apply absolute block bg-transparent top-0 left-0 right-0 bottom-0;

        z-index: 9;
        content: '';
      }
    }

    template * {
      user-select: none;
      pointer-events: none;
      display: none;
    }
  }

  :global(template.ProseMirror-selectednode) {
    @apply outline-0 border-0 shadow-imperium-form-selected;
  }

  :global(.ProseMirror-Imperium .container) {
    @apply text-imperium-fg-strong font-semibold text-xl text-center m-auto;

    padding: 20px;
    background: #f0eff0;
    max-width: none;
  }

  :global(.ProseMirror-Imperium .figcaption) {
    @apply text-imperium-fg-strong text-sm text-center m-auto rounded mt-6;

    padding: 0 8px 8px 8px;
    max-width: none;
    min-width: 100%;
  }

  :global(.ProseMirror-Imperium .image-container) {
    @apply relative flex justify-center;
  }

  :global(.ProseMirror-Imperium .image-container:hover .article-image-edit-button) {
    display: block !important;
  }

  :global(.ProseMirror-Imperium .image-container:hover .article-image-caption-button) {
    display: block !important;
  }

  :global(.ProseMirror-Imperium .disclaimer) {
    @apply text-imperium-fg-muted font-normal text-left m-auto leading-tight;

    font-size: 11px;

    &:not(:first-child) {
      @apply mt-4;
    }

    @apply mb-4;
  }

  // Styling elements in content blocks
  :global(.ProseMirror .article-image-edit-button) {
    @apply border-t border-b border-r rounded-tr-lg rounded-br-lg cursor-pointer h-11 w-11 absolute p-2 block md:hidden;

    background-size: 18px;
    width: 44px;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url('~/src/assets/icons/menu-dots.svg');
    background-color: white;
    bottom: -20px;
    left: 50%;
  }

  :global(.ProseMirror .article-image-edit-button:hover) {
    @apply bg-imperium-bg-1;
  }

  :global(.ProseMirror .article-image-caption-button) {
    @apply border rounded-tl-lg rounded-bl-lg cursor-pointer h-11 absolute p-2 block md:hidden;

    width: 45px;
    background-size: 24px;
    background-repeat: no-repeat;
    background-image: url('~/src/assets/icons/leading-visual.svg');
    background-position: center;
    background-color: white;
    bottom: -20px;
    left: calc(50% - 44px);
  }

  :global(.ProseMirror .article-image-caption-button:hover) {
    @apply bg-imperium-bg-1;
  }

  // Styling prompts
  :global(.ProseMirror-prompt) {
    @apply absolute right-0 top-[calc(100%+20px)] z-50;
  }
}
</style>

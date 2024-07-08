<template>
  <ModalHolder
    :is-visible="props.isVisible"
    :size="SIZES.SMALL"
    data-testid="edit-image-data-modal"
    @close="emits('close')"
  >
    <template #title>Embed content</template>
    <div class="flex flex-col">
      <form
        class="flex flex-col mt-2"
        @submit="onSubmit"
      >
        <FormSelect
          :model-value="type"
          name="type"
          class="mb-2"
          placeholder="Select embed type"
          :is-errored="isTypeErrored"
          :attrs="typeAttrs"
          :values="EmbedTypesLabels"
          :size="SIZES.MEDIUM"
          data-anchor="embed-field"
          @update:model-value="
            (value) => {
              setValues({ type: value });
            }
          "
        >
          <template #label>Type of embed</template>
          <template #error>Select embed type</template>
        </FormSelect>

        <FormInput
          v-model="url"
          :attrs="urlAttrs"
          :is-errored="isUrlErrored"
          class="w-full"
          name="url"
          placeholder="Paste the link"
          type="text"
        >
          <template #label>
            <span class="font-semibold">URL</span>
          </template>
          <template #help>
            Embed content from YouTube, Vimeo, X (Twitter), Instagram, Buzzsprout podcast (To embed from Buzzsprout,
            navigate to podcast account and copy the embed code).
          </template>
          <template #error>
            {{ errors.url }}
          </template>
        </FormInput>
        <Button
          :size="SIZES.MEDIUM"
          class="mt-4"
          is-full-width
          type="submit"
        >
          Insert content
        </Button>
      </form>
    </div>
  </ModalHolder>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import zod from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { useFormData } from '@/composables/useFormData';

import Button from '@/components/Button.vue';
import FormInput from '@/components/FormInput.vue';
import ModalHolder from '@/components/ModalHolder.vue';

import { EmbedType } from '@/features/CollaborativeEditor/types';
import { SIZES } from '@/types';
import FormSelect, { type SelectItem } from '@/components/FormSelect.vue';

const EmbedTypesLabels: SelectItem[] = [
  {
    id: EmbedType.TWITTER,
    label: 'Twitter',
  },
  {
    id: EmbedType.INSTAGRAM,
    label: 'Instagram',
  },
  {
    id: EmbedType.DOCUMENT,
    label: 'Document Cloud',
  },
  {
    id: EmbedType.BUZZSPROUT,
    label: 'Buzzsprout podcast',
  },
  {
    id: EmbedType.YOUTUBE,
    label: 'Youtube',
  },
  {
    id: EmbedType.VIMEO,
    label: 'Vimeo',
  },
];

const props = withDefaults(
  defineProps<{
    isVisible?: boolean;
  }>(),
  {
    isVisible: false,
  },
);

const emits = defineEmits<{
  (event: 'close'): void;
  (event: 'insert', value: { url: string; type: EmbedType }): void;
}>();

const { defineField, errors, values, setValues, meta } = useFormData({
  data: {
    type: EmbedType.TWITTER,
    url: '',
  },
  validator: toTypedSchema(
    zod.object({
      url: zod.string().url('Enter a valid url'),
      type: zod.string(),
    }),
  ),
});

const [url, urlAttrs] = defineField('url');
const [type, typeAttrs] = defineField('type');

const isUrlErrored = computed(() => meta.value.touched && !!errors.value.url);
const isTypeErrored = computed(() => !!errors.value.type);

const onSubmit = (event: Event) => {
  event.preventDefault();
  emits('insert', {
    url: values.url,
    type: values.type,
  });
};
</script>

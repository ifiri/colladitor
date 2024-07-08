<template>
  <ModalHolder
    :is-visible="props.isVisible"
    :size="SIZES.SMALL"
    data-testid="edit-link-data-modal"
    @close="onClose"
    :is-click-outside-close-modal="false"
  >
    <template #title> Insert link </template>
    <div class="flex flex-col">
      <form
        class="flex flex-col mt-2"
        @submit="onSubmit"
      >
        <FormInput
          v-model="textField"
          :attrs="textAttrs"
          :is-errored="isTextErrored"
          class="w-full"
          is-disabled
          name="imageAlt"
          type="text"
        >
          <template #label>
            <span class="font-semibold">Text</span>
          </template>
          <template #error>
            {{ errors.textField }}
          </template>
        </FormInput>
        <FormInput
          v-model="link"
          :attrs="linkAttrs"
          :is-errored="isLinkErrored"
          class="w-full mt-2"
          name="link"
          placeholder="Paste link"
          type="text"
        >
          <template #label>
            <span class="font-semibold">Link</span>
          </template>
          <template #suffix>
            <a
              :href="values.link"
              v-if="!errors.link"
              target="_blank"
            >
              <LinkIcon class="w-5 h-5 text-imperium-fg-muted" />
            </a>
          </template>
          <template #error>
            {{ errors.link }}
          </template>
        </FormInput>
        <div class="flex gap-2">
          <Button
            v-if="isEdit"
            :size="SIZES.MEDIUM"
            class="mt-4"
            :visual-type="BUTTON_TYPE.TERTIARY"
            is-full-width
            @click="onRemoveLink"
          >
            Remove link </Button
          ><Button
            :size="SIZES.MEDIUM"
            class="mt-4"
            is-full-width
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  </ModalHolder>
</template>
<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';
import zod from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { useFormData } from '@/composables/useFormData';

import LinkIcon from '@/assets/icons/open-link.svg?component';
import Button from '@/components/Button.vue';
import FormInput from '@/components/FormInput.vue';
import ModalHolder from '@/components/ModalHolder.vue';

import { BUTTON_TYPE, SIZES } from '@/types';

const props = withDefaults(
  defineProps<{
    isVisible?: boolean;
    data: { link: string; text: string; isEdit?: boolean };
  }>(),
  {
    isVisible: false,
  },
);

const emits = defineEmits<{
  (event: 'close'): void;
  (event: 'reset', value: { link: string }): void;
  (event: 'insert', value: { link: string }): void;
}>();

const isEdit = ref<boolean>(false);

const { defineField, errors, values, setValues, meta, resetForm } = useFormData({
  data: {
    textField: props.data.text || '',
    link: props.data.link || '',
  },
  validator: toTypedSchema(
    zod.object({
      textField: zod.string(),
      link: zod.string().url('Enter a valid url'),
    }),
  ),
});

const [textField, textAttrs] = defineField('textField');
const [link, linkAttrs] = defineField('link');

watchEffect(() => {
  const data = { ...props.data };
  setValues({ textField: data.text || '', link: data.link || '' });
  isEdit.value = data.isEdit || false;
});

const isTextErrored = computed(() => meta.value.touched && !!errors.value.textField);
const isLinkErrored = computed(() => meta.value.touched && !!errors.value.link);

const onSubmit = (event: Event) => {
  event.preventDefault();
  if (errors.value.link) {
    return;
  }

  emits('insert', {
    link: values.link,
  });

  resetForm();
};

const onRemoveLink = () => {
  resetForm();
  emits('reset', { link: values.link });
};

const onClose = () => {
  resetForm();
  emits('close');
};
</script>

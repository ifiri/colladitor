export const modalWrapperTemplate = `
<div
  tabindex="-1"
  class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 h-full max-h-full bg-white/60 modal-overlay"
>
  <div
    class="relative w-full max-h-full bg-imperium-bg-sub-base border border-imperium-border-base rounded-2xl shadow-imperium-base max-w-[500px] p-2"
  >
    <div
      class="flex flex-col items-center justify-between border-imperium-border-weak rounded-t-2xl relative"
    >
      <h3 class="font-semibold text-imperium-fg-strong text-left w-full text-lg mb-5 p-2 modal-title">
        <slot name="title" />
      </h3>
      <div class="modal-content w-full" />
    </div>
  </div>
</div>
`;

import { useRoute } from 'vue-router';

export const useCurrentAbsoluteUrl = () => {
  const route = useRoute();
  const path = route.fullPath;
  return `${window.location.origin}${path}`;
};

import { computed } from 'vue';

/**
 * A composable hook to get an icon based on a MIME type
 * @param {string} mimeType - The MIME type of the file
 * @returns {Object} - An object with `icon` and `classes` properties
 */
export function useMimeIcon(mimeType) {
  const getIcon = computed(() => {
    if (!mimeType)
      return {
        icon: 'radix-icons:file-question',
        classes: 'text-gray-400 bg-gray-100',
      };

    const categories = {
      application: 'lucide:app-window',
      'application/msword': 'lucide:newspaper',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'lucide:newspaper',
      'application/vnd.ms-powerpoint': 'lucide:presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'lucide:presentation',
      'application/vnd.ms-excel': 'lucide:file-spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'lucide:file-spreadsheet',
      'image/': 'lucide:image',
      'video/': 'lucide:video',
      'audio/': 'lucide:audio-lines',
      'text/': 'lucide:file-text',
      'application/zip': 'lucide:archive',
      'application/x-tar': 'lucide:archive',
      'application/gzip': 'lucide:archive',
    };

    const colors: Record<string, string> = {
      'application/msword': 'text-blue-500 bg-blue-100',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'text-blue-500 bg-blue-100',
      'application/vnd.ms-powerpoint': 'text-orange-500 bg-orange-100',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'text-orange-500 bg-orange-100',
      'application/vnd.ms-excel': 'text-green-500 bg-green-100',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'text-green-500 bg-green-100',
      'image/': 'text-amber-500 bg-amber-100',
      'video/': 'text-fuchsia-500 bg-fuchsia-100',
      'audio/': 'text-teal-500 bg-teal-100',
      'text/': 'text-zync-500 bg-zync-100',
      'application/zip': 'text-blue-500 bg-blue-100',
      'application/x-tar': 'text-blue-500 bg-blue-100',
      'application/gzip': 'text-blue-500 bg-blue-100',
    };

    // Match specific MIME types
    for (const [key, value] of Object.entries(categories)) {
      if (mimeType.startsWith(key)) {
        return {
          icon: value,
          classes: colors[key] || 'text-blue-500 bg-blue-100',
        };
      }
    }

    // Default icon
    return {
      icon: 'radix-icons:file-question',
      classes: 'text-gray-400 bg-gray-100',
    };
  });

  return getIcon;
}

export const isLocalAvatar = (avatar: string | null | undefined): avatar is string =>
  Boolean(
    avatar &&
      ((avatar.startsWith('/') && !avatar.startsWith('//')) ||
        avatar.startsWith('data:image/'))
  );

export const getAvatarInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

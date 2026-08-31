export default function todoCardIconUrl(
  iconPath: string | undefined,
  urls: Readonly<Record<string, string>>,
): string | undefined {
  if (iconPath === undefined) {
    return undefined;
  }
  return urls[iconPath];
}

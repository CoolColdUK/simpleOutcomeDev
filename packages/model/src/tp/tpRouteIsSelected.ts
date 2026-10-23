export default function tpRouteIsSelected(
  routeId: string,
  selectedRouteId: string | undefined,
  storedIsSelected: boolean,
): boolean {
  if (selectedRouteId !== undefined) {
    return routeId === selectedRouteId;
  }
  return storedIsSelected;
}

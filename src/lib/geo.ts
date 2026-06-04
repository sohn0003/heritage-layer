export const isValidKoreaCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= 30 &&
  lat <= 45 &&
  lng >= 120 &&
  lng <= 135;

export const hasValidKoreaCoordinate = (value: { latitude: number | null; longitude: number | null }) => {
  if (value.latitude == null || value.longitude == null) return false;
  return isValidKoreaCoordinate(Number(value.latitude), Number(value.longitude));
};
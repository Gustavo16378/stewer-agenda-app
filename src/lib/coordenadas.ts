/** "-10.195029, -48.328703" (como o Google Maps copia) vira as duas coordenadas. */
export function lerCoordenadas(texto: string): { latitude: number; longitude: number } | null {
  const m = texto.trim().match(/^(-?\d{1,2}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/);
  if (!m) return null;
  const latitude = Number(m[1]!.replace(',', '.'));
  const longitude = Number(m[2]!.replace(',', '.'));
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/** O link do Google Maps traz o ponto? (@lat,lng, ?q=lat,lng, query=lat%2Clng ou !3d..!4d..) */
export function linkTemCoordenadas(link: string): boolean {
  return (
    /(?:@|[?&](?:q|query|ll)=)-?\d{1,2}\.\d+(?:,|%2C)\s*-?\d{1,3}\.\d+/i.test(link) ||
    /!3d-?\d{1,2}\.\d+!4d-?\d{1,3}\.\d+/.test(link)
  );
}

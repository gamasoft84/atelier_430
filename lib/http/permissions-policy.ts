/**
 * Sin `browsing-topics` (Topics API / Chrome) para evitar avisos en Safari y otros.
 * Aplicar en next.config y en middleware para sustituir cabeceras del edge.
 */
export const PERMISSIONS_POLICY = [
  "accelerometer=(self)",
  "camera=(self)",
  "gyroscope=(self)",
  "magnetometer=(self)",
  "geolocation=()",
  "microphone=()",
  "payment=()",
  "usb=()",
  "xr-spatial-tracking=(self)",
].join(", ")

const GOLD   = "#B8860B"
const CARBON = "#0F0F0F"
const CREAM  = "#FAF7F0"
const STONE  = "#57534E"

export function welcomeEmailHtml(name?: string | null): string {
  const greeting = name ? `Hola, ${name}` : "Hola"
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atelier430.com"

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Atelier 430</title>
</head>
<body style="margin:0;padding:0;background-color:${CREAM};font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E5E0;">

          <!-- Header -->
          <tr>
            <td style="background-color:${CARBON};padding:28px 36px;">
              <p style="margin:0;font-size:20px;letter-spacing:2px;color:#ffffff;font-weight:400;">
                ATELIER 430
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#ffffff80;letter-spacing:1px;">
                430 PIEZAS ÚNICAS · ARTE PARA TU HOGAR
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <p style="margin:0 0 16px;font-size:22px;color:${CARBON};font-weight:600;">
                ${greeting}
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:${STONE};line-height:1.7;">
                Gracias por suscribirte a Atelier 430. A partir de ahora serás de los primeros en enterarte
                cuando agreguemos obras nuevas al catálogo o tengamos precios especiales.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:${STONE};line-height:1.7;">
                Somos una galería privada con 430 obras de arte — paisajes nacionales, reproducciones europeas
                clásicas, arte moderno y piezas religiosas. Todo disponible para tu hogar o negocio.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background-color:${GOLD};">
                    <a href="${siteUrl}/catalogo"
                       style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;
                              color:#ffffff;text-decoration:none;letter-spacing:0.5px;">
                      Ver catálogo completo
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;">
              <div style="border-top:1px solid #E7E5E0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 28px;">
              <p style="margin:0;font-size:11px;color:#A8A29E;line-height:1.7;">
                Recibiste este correo porque te suscribiste en atelier430.com.<br />
                Si no fuiste tú, puedes ignorar este mensaje con tranquilidad.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

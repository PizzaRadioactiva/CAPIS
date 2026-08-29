interface ProductRow {
  name: string;
  quantity: number;
  minimumStock: number;
  unit: string;
  expirationDate?: Date | null;
}

const UNIT_LABELS: Record<string, string> = {
  UNIT: "unidad(es)",
  BOX: "caja(s)",
  BLISTER: "blister(s)",
  BOTTLE: "frasco(s)",
  VIAL: "vial(es)",
  AMPOULE: "ampolla(s)",
  TUBE: "tubo(s)",
  ROLL: "rollo(s)",
  PACK: "paquete(s)",
  ML: "ml",
  L: "L",
  MG: "mg",
  G: "g",
  KG: "kg",
};

function baseLayout(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0891b2,#0e7490);padding:28px 32px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">C.A.P.S.</div>
                    <div style="color:#cffafe;font-size:13px;margin-top:2px;">Centro de Atención Primaria de la Salud</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Este es un mensaje automático del Sistema de Gestión de Stock de C.A.P.S. No responder a este correo.
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">
                Generado el ${new Date().toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function productTable(products: ProductRow[], highlightLow = false): string {
  const rows = products
    .map((p) => {
      const expired = p.expirationDate ? new Date(p.expirationDate) < new Date() : false;
      const qtyColor = p.quantity <= 0 ? "#dc2626" : highlightLow ? "#d97706" : "#0f172a";
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;">${p.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:${qtyColor};font-size:13px;font-weight:600;text-align:center;">${p.quantity} ${UNIT_LABELS[p.unit] ?? ""}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;text-align:center;">${p.minimumStock}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:${expired ? "#dc2626" : "#64748b"};font-size:13px;text-align:center;">
          ${p.expirationDate ? new Date(p.expirationDate).toLocaleDateString("es-AR") : "—"}
        </td>
      </tr>`;
    })
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;">
    <thead>
      <tr style="background-color:#f1f5f9;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Producto</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Stock actual</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Mínimo</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Vencimiento</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function lowStockEmail(products: ProductRow[]): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 4px;color:#0f172a;font-size:20px;">⚠️ Alerta de stock bajo</h1>
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">
      Se detectaron <strong>${products.length}</strong> producto(s) con stock igual o por debajo del mínimo configurado.
    </p>
    ${productTable(products, true)}
  `;
  return { subject: `⚠️ CAPS — ${products.length} producto(s) con stock bajo`, html: baseLayout("Alerta de stock bajo", body) };
}

export function fullStockEmail(products: ProductRow[]): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 4px;color:#0f172a;font-size:20px;">📦 Reporte de stock actual</h1>
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">
      Listado completo de <strong>${products.length}</strong> producto(s) en inventario.
    </p>
    ${productTable(products)}
  `;
  return { subject: `📦 CAPS — Reporte de stock (${products.length} productos)`, html: baseLayout("Reporte de stock", body) };
}

export function outOfStockEmail(products: ProductRow[]): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 4px;color:#0f172a;font-size:20px;">🚨 Productos sin stock</h1>
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">
      Hay <strong>${products.length}</strong> producto(s) agotados que requieren reposición urgente.
    </p>
    ${productTable(products, true)}
  `;
  return { subject: `🚨 CAPS — ${products.length} producto(s) sin stock`, html: baseLayout("Productos sin stock", body) };
}

export function expiringEmail(products: ProductRow[]): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 4px;color:#0f172a;font-size:20px;">⏳ Productos por vencer</h1>
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">
      Hay <strong>${products.length}</strong> producto(s) vencidos o próximos a vencer (60 días).
    </p>
    ${productTable(products, true)}
  `;
  return { subject: `⏳ CAPS — ${products.length} producto(s) por vencer/vencidos`, html: baseLayout("Productos por vencer", body) };
}

export function singleProductEmail(product: ProductRow & { batchNumber?: string | null; supplier?: string | null }): {
  subject: string;
  html: string;
} {
  const body = `
    <h1 style="margin:0 0 4px;color:#0f172a;font-size:20px;">📋 Ficha de producto</h1>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Información detallada del producto solicitado.</p>
    <table role="presentation" width="100%" style="border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:160px;">Nombre</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${product.name}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Stock actual</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${product.quantity} ${UNIT_LABELS[product.unit] ?? ""}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Stock mínimo</td><td style="padding:8px 0;color:#0f172a;font-size:13px;">${product.minimumStock}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Lote</td><td style="padding:8px 0;color:#0f172a;font-size:13px;">${product.batchNumber ?? "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Proveedor</td><td style="padding:8px 0;color:#0f172a;font-size:13px;">${product.supplier ?? "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Vencimiento</td><td style="padding:8px 0;color:#0f172a;font-size:13px;">${product.expirationDate ? new Date(product.expirationDate).toLocaleDateString("es-AR") : "—"}</td></tr>
    </table>
  `;
  return { subject: `📋 CAPS — Ficha de ${product.name}`, html: baseLayout("Ficha de producto", body) };
}

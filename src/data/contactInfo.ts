export const contactInfo = {
  // Siempre con código de área: el `tel:` se arma desde aquí y un fijo de Lima
  // sin "(01)" marcado desde un celular sale con 7 dígitos y no entra.
  phones: ["(01) 330-4400", "(01) 424-6409", "(01) 332-1005", "(01) 333-0933"],
  whatsapp: ["+51 998 134 102"],
  emails: ["ventas@hyc.com.pe", "ventas@dihyc.com.pe"],
  address: "Av. Oscar R. Benavides N° 553 Lima Industrial",
  schedule: "Lun-Vie: 09:00-18:00 | Sáb: 09:00-13:00"
};

/**
 * Enlace `tel:` en formato internacional E.164 (+51…), que marca bien desde un
 * celular, un fijo de provincia o el extranjero.
 *
 *   "(01) 330-4400"   -> tel:+5113304400   (fijo: se quita el 0 del código de área)
 *   "998 134 102"     -> tel:+51998134102  (celular: 9 dígitos que empiezan por 9)
 *   "+51 998 134 102" -> tel:+51998134102  (ya internacional)
 *
 * Un número sin código de área rompe el build a propósito: publicarlo daría
 * otra vez un botón de llamada que no conecta.
 */
export const telHref = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  if (phone.trim().startsWith("+")) return `tel:+${digits}`;
  if (/^9\d{8}$/.test(digits)) return `tel:+51${digits}`;
  if (/^0\d{8}$/.test(digits)) return `tel:+51${digits.slice(1)}`;

  throw new Error(
    `contactInfo: el teléfono "${phone}" no tiene código de área. Escríbelo como "(01) 330-4400" (fijo) o "998 134 102" (celular).`
  );
};

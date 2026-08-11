import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const FROM = 'Makay Beach Club <noreply@makay.club>';
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}

interface MembershipEmailData {
  to: string;
  name: string;
  tier: string;
  duration: string;
  amount: number;
  orderId: string;
  expiresAt?: string;
  locale?: string;
}

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronce', silver: 'Plata', gold: 'Oro', vip: 'VIP',
};
const DURATION_LABEL: Record<string, string> = {
  trimestral: '3 meses', semestral: '6 meses', anual: '12 meses',
};

export async function sendMembershipWelcomeEmail(data: MembershipEmailData) {
  if (!process.env.RESEND_API_KEY) return;

  const tierLabel = TIER_LABEL[data.tier] ?? data.tier;
  const durationLabel = DURATION_LABEL[data.duration] ?? data.duration;

  const detailRows: [string, string][] = [
    ['Plan', tierLabel],
    ['Duración', durationLabel],
    ['Monto', `$${data.amount.toFixed(2)}`],
    ['Orden', `#${data.orderId}`],
  ];
  if (data.expiresAt) detailRows.push(['Vence', new Date(data.expiresAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })]);
  const detailRowsHtml = detailRows.map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #ede5da;">
      <span style="font-family:Arial,sans-serif;font-size:13px;color:#9c8070;">${k}</span>
      <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#2C2C2C;">${v}</span>
    </div>
  `).join('');

  await getResend().emails.send({
    from: FROM,
    to: data.to,
    subject: `🔒 Bienvenido a Makay: Ya estás en nuestro Close Friends`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body style="margin:0;padding:0;background:#fff8f0;font-family:Georgia,serif;">
        <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;margin-top:32px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1e1611,#2c1f14);padding:40px 32px;text-align:center;">
            <p style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#D4A574;margin:0 0 6px;">Makay Beach Club</p>
            <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin:0;">Membresía ${tierLabel} · Close Friends</p>
          </div>

          <!-- Body -->
          <div style="padding:40px 32px;">
            <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#2C2C2C;margin:0 0 8px;">¡Hola, ${data.name}!</h1>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:#6B5C4E;line-height:1.65;margin:0 0 20px;">
              Que alegría saber que formas parte de nuestro close friends. Queríamos tomarnos un segundo para darte la bienvenida oficial a Makay, nuestro círculo más cercano y exclusivo.
            </p>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:#6B5C4E;line-height:1.65;margin:0 0 28px;">
              Si estás recibiendo este correo, es porque eres parte fundamental de la casa. Queremos premiar tu fidelidad y mantener una conexión mucho más directa contigo.
            </p>

            <!-- What it means -->
            <div style="background:#1e1611;border-radius:12px;padding:24px 28px;margin-bottom:28px;">
              <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#D4A574;margin:0 0 16px;">¿Qué significa ser un Miembro Makay?</p>
              <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.75);margin:0 0 12px;line-height:1.6;">A partir de hoy, tienes acceso prioritario a todo lo que pase tras bambalinas:</p>
              ${[
                ['🎯 Reservas con Prioridad', 'Acceso antes que nadie a mesas en fechas especiales y eventos exclusivos.'],
                ['🤫 Beneficios Secretos', 'Cortesías especiales, degustaciones a puerta cerrada y promociones que nunca publicaremos de forma abierta.'],
                ['✨ Primicias & Vibe', 'Entérate antes que el resto sobre nuestros nuevos menús, DJs invitados y fiestas temáticas.'],
                ['💬 Trato Directo', 'Un canal abierto y directo para tus peticiones especiales cuando nos visites.'],
              ].map(([title, desc]) => `
                <div style="display:flex;gap:10px;margin-bottom:10px;">
                  <div style="flex:1;">
                    <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#D4A574;margin:0 0 2px;">${title}</p>
                    <p style="font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);margin:0;line-height:1.5;">${desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Membership includes -->
            <div style="background:#f9f4ef;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9c8070;margin:0 0 12px;">Lo que incluye tu Membresía ${tierLabel}</p>
              ${detailRowsHtml}
              <div style="padding:8px 0;border-bottom:1px solid #ede5da;">
                <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#2C2C2C;margin:0 0 2px;">Asesoría personalizada con tu Vacation Planner</p>
                <p style="font-family:Arial,sans-serif;font-size:12px;color:#9c8070;margin:0;line-height:1.5;">Un asesor asignado te ayudará a planificar tu temporada, coordinar tus fechas especiales y maximizar todos tus beneficios.</p>
              </div>
              <div style="padding:8px 0;">
                <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#2C2C2C;margin:0 0 2px;">Membresía Transferible</p>
                <p style="font-family:Arial,sans-serif;font-size:12px;color:#9c8070;margin:0;line-height:1.5;">Tu contrato te permite registrar hasta 3 personas autorizadas para que familiares o amigos puedan hacer uso de tus beneficios.</p>
              </div>
            </div>

            <!-- Tier benefits -->
            <div style="background:#f9f4ef;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
              <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9c8070;margin:0 0 12px;">Tus Beneficios Exclusivos — Membresía ${tierLabel}</p>
              ${data.tier === 'bronze' ? `
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ 10% de descuento en todos nuestros productos y servicios</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ Priority Access: Reservas prioritarias en fechas especiales y eventos</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0;">✓ Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados</p>
              ` : data.tier === 'silver' ? `
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ Toldo GRATIS durante la temporada baja</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ 10% de descuento en todos nuestros productos y servicios</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ Priority Access: Reservas prioritarias en fechas especiales y eventos</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0;">✓ Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados</p>
              ` : `
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ Toldo GRATIS durante la temporada baja</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ 10% de descuento en todos nuestros productos y servicios</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ Priority Access: Reservas prioritarias en fechas especiales y eventos</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0 0 8px;">✓ Acceso Deportivo GRATIS: Canchas de Beach Tennis y Voleibol de playa</p>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2C2C;margin:0;">✓ Descuentos Exclusivos en todas nuestras marcas aliadas</p>
              `}
            </div>

            <!-- Instagram tip -->
            <div style="border-left:3px solid #D4A574;padding:12px 16px;margin-bottom:28px;background:#fffaf5;border-radius:0 8px 8px 0;">
              <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B5C4E;margin:0;line-height:1.6;">
                <strong>Tip de miembro:</strong> Asegúrate de seguirnos en Instagram (<strong>@makaybeachclub</strong>) y estar atento a nuestras historias con la etiqueta verde de Close Friends, donde estaremos anunciando las próximas catas y beneficios sorpresas.
              </p>
            </div>

            <p style="font-family:Arial,sans-serif;font-size:15px;color:#6B5C4E;line-height:1.6;margin:0 0 28px;">
              Estamos listos para hacer de tu próxima visita algo inolvidable. ¡Gracias por ser parte de la familia Makay!
            </p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:#6B5C4E;margin:0 0 4px;">Nos vemos muy pronto,</p>
            <p style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#2C2C2C;margin:0 0 28px;">El equipo de Makay</p>

            <a href="https://wa.me/584142966058" style="display:inline-block;padding:14px 32px;background:#D4A574;color:#fff;text-decoration:none;border-radius:100px;font-family:Arial,sans-serif;font-weight:700;font-size:14px;">
              💬 Reservar en WhatsApp VIP
            </a>
          </div>

          <!-- Footer -->
          <div style="padding:24px 32px;border-top:1px solid #f0e8de;text-align:center;">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#b0a090;margin:0;">
              Makay Beach Club · Membresía ${tierLabel} activada · Validez 3 meses
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

const TIER_BENEFITS_ES: Record<string, string[]> = {
  bronze: [
    '10% de descuento en todos los productos y servicios.',
    'Priority Access: reservas prioritarias en fechas especiales y eventos.',
    'Acceso Exclusivo: invitación a catas y eventos cerrados.',
  ],
  silver: [
    'Toldo GRATIS durante la temporada baja.',
    '10% de descuento en todos los productos y servicios.',
    'Priority Access: reservas prioritarias en fechas especiales y eventos.',
    'Acceso Exclusivo: invitación a catas y eventos cerrados.',
  ],
  gold: [
    'Toldo GRATIS durante la temporada baja.',
    '10% de descuento en todos los productos y servicios.',
    'Priority Access: reservas prioritarias en fechas especiales y eventos.',
    'Acceso Exclusivo: invitación a catas y eventos cerrados.',
    'Acceso Deportivo GRATIS: Beach Tennis y Voleibol de playa.',
    'Descuentos Exclusivos en marcas aliadas.',
  ],
  vip: [
    'Toldo GRATIS durante la temporada baja.',
    '10% de descuento en todos los productos y servicios.',
    'Priority Access: reservas prioritarias en fechas especiales y eventos.',
    'Acceso Exclusivo: invitación a catas y eventos cerrados.',
    'Acceso Deportivo GRATIS: Beach Tennis y Voleibol de playa.',
    'Descuentos Exclusivos en marcas aliadas.',
    'Atención VIP personalizada y acceso a eventos privados.',
  ],
};

const TIER_BENEFITS_EN: Record<string, string[]> = {
  bronze: [
    '10% discount on all products and services.',
    'Priority Access: priority reservations for special dates and events.',
    'Exclusive Access: invitation to private tastings and closed-door events.',
  ],
  silver: [
    'FREE beach umbrella during the low season.',
    '10% discount on all products and services.',
    'Priority Access: priority reservations for special dates and events.',
    'Exclusive Access: invitation to private tastings and closed-door events.',
  ],
  gold: [
    'FREE beach umbrella during the low season.',
    '10% discount on all products and services.',
    'Priority Access: priority reservations for special dates and events.',
    'Exclusive Access: invitation to private tastings and closed-door events.',
    'FREE Sports Access: Beach Tennis and Beach Volleyball courts.',
    'Exclusive discounts at all partner brands.',
  ],
  vip: [
    'FREE beach umbrella during the low season.',
    '10% discount on all products and services.',
    'Priority Access: priority reservations for special dates and events.',
    'Exclusive Access: invitation to private tastings and closed-door events.',
    'FREE Sports Access: Beach Tennis and Beach Volleyball courts.',
    'Exclusive discounts at all partner brands.',
    'Personalized VIP service and access to private events.',
  ],
};

const DURATION_LABEL_EN: Record<string, string> = {
  trimestral: '3 months', semestral: '6 months', anual: '12 months',
};

function loadTemplate(filename: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'src', 'emails', filename), 'utf-8');
  } catch {
    return '';
  }
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

export async function sendMembershipContractEmail(data: MembershipEmailData) {
  if (!process.env.RESEND_API_KEY) return;

  const locale = data.locale ?? 'es';
  const isEs = locale !== 'en';

  const tierLabel = TIER_LABEL[data.tier] ?? data.tier;
  const durationLabel = isEs
    ? (DURATION_LABEL[data.duration] ?? data.duration)
    : (DURATION_LABEL_EN[data.duration] ?? data.duration);

  const dateLocale = isEs ? 'es' : 'en';
  const issuedDate = new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  const expiresDate = data.expiresAt
    ? new Date(data.expiresAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const benefitsMap = isEs ? TIER_BENEFITS_ES : TIER_BENEFITS_EN;
  const benefitsList = (benefitsMap[data.tier] ?? benefitsMap.bronze)
    .map(b => `<li>${b}</li>`).join('');

  const template = loadTemplate(isEs ? 'contract-es.html' : 'contract-en.html');
  const html = renderTemplate(template, {
    ORDER_ID: data.orderId,
    NAME: data.name,
    EMAIL: data.to,
    AMOUNT: data.amount.toFixed(2),
    TIER_LABEL: tierLabel,
    DURATION_LABEL: durationLabel,
    ISSUED_DATE: issuedDate,
    EXPIRES_DATE: expiresDate,
    BENEFITS_LIST: benefitsList,
  });

  const subject = isEs
    ? `Contrato y Comprobante — Membresía Makay ${tierLabel} #${data.orderId}`
    : `Membership Agreement & Receipt — Makay ${tierLabel} #${data.orderId}`;

  await getResend().emails.send({ from: FROM, to: data.to, subject, html });
}

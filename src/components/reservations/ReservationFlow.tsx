'use client';

import { useMemo, useState } from 'react';
import {
  Calendar, Clock, Users, Check, ChevronRight, ChevronLeft,
  ChevronLeft as ArrowLeft, ChevronRight as ArrowRight, Minus, Plus, Sparkles,
} from 'lucide-react';
import { EXPERIENCES, EXTRA_ADDON, priceForDate, extraPaxCount, totalPrice, type Experience } from '@/lib/reservationExperiences';
import '@/styles/reservations.css';

type Step = 1 | 2 | 3 | 4;
type DateTimeSubStep = 'date' | 'time';

const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const STEP_LABELS_ES = ['Experiencia', 'Fecha y Hora', 'Tus Datos', 'Confirmar'];
const STEP_LABELS_EN = ['Experience', 'Date & Time', 'Your Info', 'Confirm'];

const WEEKDAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function useLocale(): 'es' | 'en' {
  if (typeof document === 'undefined') return 'en';
  const m = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  return m?.[1] === 'es' ? 'es' : 'en';
}

function toISODate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Mon-first calendar grid for a given month; returns 6 weeks of 7 days (nulls for padding). */
function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = (firstDay + 6) % 7; // convert to Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

interface ReservationFlowProps {
  /** Renders just the wizard card, without the customer-facing hero/page chrome — for embedding inside another panel (e.g. seller "New Reservation"). */
  embedded?: boolean;
  /** Called after a reservation is created; only rendered when embedded. */
  onDone?: () => void;
  /** Lets the calendar select dates before today — for staff backfilling reservations made on past days. */
  allowPastDates?: boolean;
}

export default function ReservationFlow({ embedded = false, onDone, allowPastDates = false }: ReservationFlowProps = {}) {
  const locale = useLocale();
  const t = <T,>(es: T, en: T) => (locale === 'es' ? es : en);

  const [step, setStep] = useState<Step>(1);
  const [experienceKey, setExperienceKey] = useState('');
  const [dateSubStep, setDateSubStep] = useState<DateTimeSubStep>('date');
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [addExtra, setAddExtra] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmationId, setConfirmationId] = useState<number | null>(null);

  const experience = EXPERIENCES.find(e => e.key === experienceKey);
  const maxPax = experience ? (experience.extraPaxPrice > 0 ? experience.paxIncluded + 20 : experience.paxIncluded) : 20;

  const canContinueStep1 = !!experienceKey;
  const canContinueStep2 = !!date && !!time && partySize > 0;
  const canContinueStep3 = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && phone.trim().length > 5;

  const goNext = () => setStep(s => (Math.min(4, s + 1) as Step));
  const goBack = () => setStep(s => (Math.max(1, s - 1) as Step));

  const selectExperience = (exp: Experience) => {
    setExperienceKey(exp.key);
    setPartySize(exp.paxMin);
  };

  const pickDate = (d: number) => {
    const iso = toISODate(viewYear, viewMonth, d);
    setDate(iso);
    setTime('');
    setDateSubStep('time');
  };

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m); setViewYear(y);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const months = t(MONTHS_ES, MONTHS_EN);
  const weekdays = t(WEEKDAYS_ES, WEEKDAYS_EN);

  const computedTotal = experience && date ? totalPrice(experience, date, partySize, addExtra) : 0;
  const extraGuests = experience ? extraPaxCount(experience, partySize) : 0;
  const basePrice = experience && date ? priceForDate(experience, date) : 0;

  const submit = async () => {
    if (!experience) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, partySize, date, time,
          experienceKey: experience.key,
          experienceName: t(experience.nameEs, experience.nameEn),
          totalPrice: computedTotal,
          hasExtraAddon: addExtra,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t('No se pudo completar la reserva. Intenta de nuevo.', 'Could not complete the reservation. Please try again.'));
        setSubmitting(false);
        return;
      }
      setConfirmationId(data.id);
      setSubmitting(false);
    } catch {
      setError(t('Error de conexión. Intenta de nuevo.', 'Connection error. Please try again.'));
      setSubmitting(false);
    }
  };

  const dateLabel = date
    ? new Date(date + 'T00:00:00').toLocaleDateString(locale === 'es' ? 'es' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  const reset = () => {
    setStep(1);
    setExperienceKey('');
    setDateSubStep('date');
    setDate('');
    setTime('');
    setPartySize(1);
    setAddExtra(false);
    setName(''); setEmail(''); setPhone(''); setNotes('');
    setError('');
    setConfirmationId(null);
  };

  if (confirmationId) {
    const successBody = (
      <div className="res-success">
        <div className="res-success-icon"><Check size={32} /></div>
        <h2 className="res-success-title">{t(`¡Nos vemos pronto, ${name.split(' ')[0]}!`, `See you soon, ${name.split(' ')[0]}!`)}</h2>
        <p className="res-success-sub">{t(`Tu reserva #${confirmationId} ha sido confirmada.`, `Your reservation #${confirmationId} has been confirmed.`)}</p>
        <div className="res-success-card">
          <div className="res-success-row"><Sparkles size={16} /> {t(experience?.nameEs, experience?.nameEn)}</div>
          <div className="res-success-row"><Calendar size={16} /> {dateLabel}</div>
          <div className="res-success-row"><Clock size={16} /> {time}</div>
          <div className="res-success-row"><Users size={16} /> {partySize} {t('persona', 'guest')}{partySize !== 1 ? 's' : ''}</div>
          <div className="res-success-row" style={{ fontWeight: 700 }}>${computedTotal.toFixed(2)}</div>
        </div>
        <p className="res-success-hint">{t(`Enviamos los detalles a ${email}. Si necesitas modificar tu reserva, contáctanos.`, `We sent the details to ${email}. Contact us if you need to change your reservation.`)}</p>
        {embedded && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="res-btn-primary" onClick={() => { reset(); onDone?.(); }}>
              {t('Ver reservas', 'View reservations')}
            </button>
            <button className="res-btn-ghost" onClick={reset}>
              {t('Crear otra reserva', 'Create another reservation')}
            </button>
          </div>
        )}
      </div>
    );
    if (embedded) return <div className="res-container">{successBody}</div>;
    return (
      <main className="res-page">
        <div className="res-hero-mini">
          <p className="res-hero-tag">Makay Beach Club</p>
          <h1 className="res-hero-title">{t('Reserva Confirmada', 'Reservation Confirmed')}</h1>
        </div>
        <div className="res-container">{successBody}</div>
      </main>
    );
  }

  const STEP_LABELS = t(STEP_LABELS_ES, STEP_LABELS_EN);

  const wizard = (
      <div className={`res-container${step === 1 ? ' res-container--wide' : ''}`}>
        {/* Step indicator */}
        <div className="res-steps">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            const state = n === step ? 'active' : n < step ? 'done' : '';
            return (
              <div key={label} className={`res-step ${state}`}>
                <span className="res-step-circle">{n < step ? <Check size={14} /> : n}</span>
                <span className="res-step-label">{label}</span>
              </div>
            );
          })}
        </div>

        <div className="res-card">
          {/* STEP 1: Experience */}
          {step === 1 && (
            <div className="res-step-content">
              <h2 className="res-step-title">{t('Elige tu experiencia', 'Choose your experience')}</h2>
              <div className="res-exp-grid">
                {EXPERIENCES.map(exp => {
                  const selected = experienceKey === exp.key;
                  const hasWeekendPricing = exp.priceWeekday != null;
                  return (
                    <button key={exp.key} className={`res-exp-card${selected ? ' selected' : ''}`} onClick={() => selectExperience(exp)}>
                      <div className="res-exp-media" style={exp.image ? { backgroundImage: `url(${exp.image})` } : undefined}>
                        {!exp.image && <Sparkles size={28} className="res-exp-media-icon" />}
                        {selected && <span className="res-exp-check"><Check size={13} /></span>}
                      </div>
                      <div className="res-exp-body">
                        <h3 className="res-exp-name">{t(exp.nameEs, exp.nameEn)}</h3>
                        {(exp.tierNoteEs || exp.tierNoteEn) && (
                          <span className="res-exp-tier">{t(exp.tierNoteEs, exp.tierNoteEn)}</span>
                        )}
                        <div className="res-exp-price-row">
                          {hasWeekendPricing ? (
                            <span className="res-exp-price">
                              ${exp.priceWeekday} <span className="res-exp-price-note">{t('L-V', 'Mon-Fri')}</span> · ${exp.priceWeekend} <span className="res-exp-price-note">{t('S-D', 'Sat-Sun')}</span>
                            </span>
                          ) : (
                            <span className="res-exp-price">${exp.price}</span>
                          )}
                        </div>
                        <span className="res-exp-pax">
                          {t(`De ${exp.paxMin} a ${exp.paxIncluded} pax`, `${exp.paxMin} to ${exp.paxIncluded} guests`)}
                          {exp.extraPaxPrice > 0 && ` · ${t('adicional', 'extra')} $${exp.extraPaxPrice}`}
                        </span>
                        <ul className="res-exp-benefits">
                          {t(exp.benefitsEs, exp.benefitsEn).slice(0, 3).map(b => <li key={b}>{b}</li>)}
                          {exp.benefitsEs.length > 3 && (
                            <li className="res-exp-more">+{exp.benefitsEs.length - 3} {t('más', 'more')}</li>
                          )}
                        </ul>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="res-step-footer">
                <span />
                <button className="res-btn-primary" disabled={!canContinueStep1} onClick={goNext}>
                  {t('Continuar', 'Continue')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Date, time, party size */}
          {step === 2 && experience && (
            <div className="res-step-content">
              <h2 className="res-step-title">
                {allowPastDates ? t('¿Cuándo se realizó la reserva?', 'When was the reservation made?') : t('¿Cuándo te esperamos?', 'When can we expect you?')}
              </h2>
              <p className="res-schedule-note">
                {allowPastDates
                  ? t('Selecciona la fecha y hora reales de la reserva, incluyendo días anteriores.', 'Select the real date and time of the reservation, including past days.')
                  : t('Disponible de lunes a domingo, 10:00 AM a 6:00 PM', 'Available Monday to Sunday, 10:00 AM to 6:00 PM')}
              </p>

              {dateSubStep === 'date' ? (
                <div className="res-calendar" key="date-view">
                  <div className="res-calendar-header">
                    <button className="res-cal-nav" onClick={() => changeMonth(-1)}><ArrowLeft size={16} /></button>
                    <span className="res-cal-month">{months[viewMonth]} {viewYear}</span>
                    <button className="res-cal-nav" onClick={() => changeMonth(1)}><ArrowRight size={16} /></button>
                  </div>
                  <div className="res-cal-weekdays">
                    {weekdays.map((w, i) => <span key={i}>{w}</span>)}
                  </div>
                  <div className="res-cal-grid">
                    {grid.map((week, wi) => week.map((d, di) => {
                      if (d === null) return <span key={`${wi}-${di}`} className="res-cal-cell empty" />;
                      const iso = toISODate(viewYear, viewMonth, d);
                      const cellDate = new Date(viewYear, viewMonth, d);
                      const isPast = !allowPastDates && cellDate < today;
                      const isToday = cellDate.getTime() === today.getTime();
                      const isSelected = date === iso;
                      return (
                        <button
                          key={`${wi}-${di}`}
                          className={`res-cal-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                          disabled={isPast}
                          onClick={() => pickDate(d)}
                        >
                          {d}
                        </button>
                      );
                    }))}
                  </div>
                </div>
              ) : (
                <div className="res-time-view" key="time-view">
                  <div className="res-selected-date-bar">
                    <Calendar size={15} /> <strong>{dateLabel}</strong>
                    <button className="res-change-date-btn" onClick={() => setDateSubStep('date')}>{t('Cambiar fecha', 'Change date')}</button>
                  </div>
                  <div className="res-field-group">
                    <label className="res-label"><Clock size={14} /> {t('Hora', 'Time')}</label>
                    <div className="res-time-grid">
                      {TIME_SLOTS.map(slot => (
                        <button key={slot} className={`res-time-btn${time === slot ? ' selected' : ''}`} onClick={() => setTime(slot)}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="res-field-group">
                    <label className="res-label"><Users size={14} /> {t('Número de personas', 'Number of guests')}</label>
                    <div className="res-party-stepper">
                      <button className="res-stepper-btn" onClick={() => setPartySize(p => Math.max(experience.paxMin, p - 1))}><Minus size={16} /></button>
                      <span className="res-party-count">{partySize}</span>
                      <button className="res-stepper-btn" onClick={() => setPartySize(p => Math.min(maxPax, p + 1))}><Plus size={16} /></button>
                    </div>
                    {extraGuests > 0 && (
                      <p className="res-extra-note">
                        {t(`${extraGuests} pax adicional × $${experience.extraPaxPrice} = $${(extraGuests * experience.extraPaxPrice).toFixed(2)}`,
                           `${extraGuests} extra guest${extraGuests !== 1 ? 's' : ''} × $${experience.extraPaxPrice} = $${(extraGuests * experience.extraPaxPrice).toFixed(2)}`)}
                      </p>
                    )}
                  </div>

                  <div className="res-field-group">
                    <label className="res-addon-toggle">
                      <input type="checkbox" checked={addExtra} onChange={e => setAddExtra(e.target.checked)} />
                      <span>
                        <strong>{t(EXTRA_ADDON.labelEs, EXTRA_ADDON.labelEn)} (+${EXTRA_ADDON.pricePerPax}/{t('pax', 'guest')})</strong>
                        <span className="res-addon-desc">{t(EXTRA_ADDON.descEs, EXTRA_ADDON.descEn)}</span>
                      </span>
                    </label>
                  </div>

                  {date && (
                    <div className="res-price-preview">
                      <span>{t('Total estimado', 'Estimated total')}</span>
                      <strong>${computedTotal.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="res-step-footer">
                <button className="res-btn-ghost" onClick={goBack}><ChevronLeft size={16} /> {t('Atrás', 'Back')}</button>
                <button className="res-btn-primary" disabled={!canContinueStep2} onClick={goNext}>
                  {t('Continuar', 'Continue')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Contact */}
          {step === 3 && (
            <div className="res-step-content">
              <h2 className="res-step-title">{t('Tus datos de contacto', 'Your contact info')}</h2>
              <div className="res-field-group">
                <label className="res-label">{t('Nombre completo', 'Full name')}</label>
                <input className="res-input" value={name} onChange={e => setName(e.target.value)} placeholder={t('Tu nombre', 'Your name')} />
              </div>
              <div className="res-field-row">
                <div className="res-field-group">
                  <label className="res-label">{t('Correo electrónico', 'Email')}</label>
                  <input className="res-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="res-field-group">
                  <label className="res-label">{t('Teléfono', 'Phone')}</label>
                  <input className="res-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+57 300 000 0000" />
                </div>
              </div>
              <div className="res-field-group">
                <label className="res-label">{t('Solicitudes especiales (opcional)', 'Special requests (optional)')}</label>
                <textarea className="res-textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('Celebración, alergias, preferencias...', 'Celebration, allergies, preferences...')} />
              </div>
              <div className="res-step-footer">
                <button className="res-btn-ghost" onClick={goBack}><ChevronLeft size={16} /> {t('Atrás', 'Back')}</button>
                <button className="res-btn-primary" disabled={!canContinueStep3} onClick={goNext}>
                  {t('Continuar', 'Continue')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirm */}
          {step === 4 && experience && (
            <div className="res-step-content">
              <h2 className="res-step-title">{t('Confirma tu reserva', 'Confirm your reservation')}</h2>
              <div className="res-summary">
                <div className="res-summary-row"><Sparkles size={16} /><span>{t(experience.nameEs, experience.nameEn)}</span></div>
                <div className="res-summary-row"><Calendar size={16} /><span>{dateLabel}</span></div>
                <div className="res-summary-row"><Clock size={16} /><span>{time}</span></div>
                <div className="res-summary-row"><Users size={16} /><span>{partySize} {t('persona(s)', 'guest(s)')}</span></div>
                <div className="res-summary-divider" />
                <div className="res-summary-row"><span className="res-summary-label">{t('Base', 'Base')}:</span><span>${basePrice.toFixed(2)}</span></div>
                {extraGuests > 0 && (
                  <div className="res-summary-row"><span className="res-summary-label">{t('Pax adicional', 'Extra guests')}:</span><span>${(extraGuests * experience.extraPaxPrice).toFixed(2)}</span></div>
                )}
                {addExtra && (
                  <div className="res-summary-row"><span className="res-summary-label">{t('Extra', 'Add-on')}:</span><span>${(partySize * EXTRA_ADDON.pricePerPax).toFixed(2)}</span></div>
                )}
                <div className="res-summary-row" style={{ fontWeight: 700 }}><span className="res-summary-label">{t('Total', 'Total')}:</span><span>${computedTotal.toFixed(2)}</span></div>
                <div className="res-summary-divider" />
                <div className="res-summary-row"><span className="res-summary-label">{t('Nombre', 'Name')}:</span><span>{name}</span></div>
                <div className="res-summary-row"><span className="res-summary-label">{t('Correo', 'Email')}:</span><span>{email}</span></div>
                <div className="res-summary-row"><span className="res-summary-label">{t('Teléfono', 'Phone')}:</span><span>{phone}</span></div>
                {notes && <div className="res-summary-row"><span className="res-summary-label">{t('Notas', 'Notes')}:</span><span>{notes}</span></div>}
              </div>

              {error && <p className="res-error">{error}</p>}

              <div className="res-step-footer">
                <button className="res-btn-ghost" onClick={goBack} disabled={submitting}><ChevronLeft size={16} /> {t('Atrás', 'Back')}</button>
                <button className="res-btn-primary" onClick={submit} disabled={submitting}>
                  {submitting ? t('Confirmando…', 'Confirming…') : t('Confirmar Reserva', 'Confirm Reservation')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (embedded) return wizard;

  return (
    <main className="res-page">
      {/* Hero */}
      <div className="res-hero-mini">
        <p className="res-hero-tag">Makay Beach Club</p>
        <h1 className="res-hero-title">{t('Reserva tu Experiencia', 'Book Your Experience')}</h1>
        <p className="res-hero-sub">{t('Asegura tu lugar frente al mar en cuatro simples pasos.', 'Secure your spot on the beach in four simple steps.')}</p>
      </div>
      {wizard}
    </main>
  );
}

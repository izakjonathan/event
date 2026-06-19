'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

type ProductCategory = 'Beer' | 'Wine' | 'Cocktail' | 'Shot' | 'Soft drink' | 'Coffee' | 'Other';

type BarProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  supplier: string;
  unitType: string;
  unitSize: string;
  buyPrice: number;
  sellPrice: number;
  expectedQty: number;
  menuVisible: boolean;
  menuDescription: string;
};

type BarStaffLine = {
  id: string;
  role: string;
  staffCount: number;
  startTime: string;
  endTime: string;
  hourlyWage: number;
};

type BarPlannerPayload = {
  products: BarProduct[];
  staff: BarStaffLine[];
  notes: string;
};

type EventPayload = {
  id?: string;
  meta?: { name?: string; date?: string; location?: string; status?: string };
  barPlanner?: BarPlannerPayload;
  [key: string]: unknown;
};

type EventRow = {
  id: string;
  name: string;
  event_date: string | null;
  payload: EventPayload | null;
  updated_at: string;
};

const categories: ProductCategory[] = ['Beer', 'Wine', 'Cocktail', 'Shot', 'Soft drink', 'Coffee', 'Other'];

function uid() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function number(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function moneyText(value: number) {
  return `${new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(Math.round(value || 0))} DKK`;
}

function moneyNode(value: number) {
  return (
    <span className="money-inline">
      <span className="money-number">{new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(Math.round(value || 0))}</span>
      <span className="money-currency">DKK</span>
    </span>
  );
}

function percent(value: number) {
  return `${new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 }).format(value || 0)}%`;
}

function formatDate(value?: string | null) {
  if (!value) return 'No date';
  try {
    return new Intl.DateTimeFormat('da-DK', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
}

function eventTitle(event: EventRow) {
  return event.name || event.payload?.meta?.name || 'Untitled event';
}

function blankProduct(): BarProduct {
  return {
    id: uid(),
    name: '',
    category: 'Beer',
    supplier: '',
    unitType: 'unit',
    unitSize: '',
    buyPrice: 0,
    sellPrice: 0,
    expectedQty: 0,
    menuVisible: true,
    menuDescription: ''
  };
}

function starterProducts(): BarProduct[] {
  return [
    { ...blankProduct(), name: 'House beer', category: 'Beer', unitType: 'bottle', unitSize: '33cl', buyPrice: 12, sellPrice: 45, expectedQty: 80, menuVisible: true },
    { ...blankProduct(), name: 'House wine', category: 'Wine', unitType: 'glass', unitSize: '15cl', buyPrice: 18, sellPrice: 65, expectedQty: 40, menuVisible: true },
    { ...blankProduct(), name: 'Shot', category: 'Shot', unitType: 'shot', unitSize: '2cl', buyPrice: 8, sellPrice: 35, expectedQty: 60, menuVisible: true }
  ];
}

function blankStaff(): BarStaffLine {
  return {
    id: uid(),
    role: 'Bartender',
    staffCount: 1,
    startTime: '',
    endTime: '',
    hourlyWage: 170
  };
}

function hydrateBarPlan(payload?: EventPayload | null): BarPlannerPayload {
  const current = payload?.barPlanner;
  return {
    products: Array.isArray(current?.products) && current.products.length
      ? current.products.map((product) => ({
          ...blankProduct(),
          ...product,
          id: product.id || uid(),
          buyPrice: number(product.buyPrice),
          sellPrice: number(product.sellPrice),
          expectedQty: number(product.expectedQty),
          menuVisible: product.menuVisible !== false
        }))
      : starterProducts(),
    staff: Array.isArray(current?.staff) && current.staff.length
      ? current.staff.map((line) => ({
          ...blankStaff(),
          ...line,
          id: line.id || uid(),
          staffCount: number(line.staffCount),
          hourlyWage: number(line.hourlyWage)
        }))
      : [{ ...blankStaff(), staffCount: 2 }],
    notes: current?.notes || ''
  };
}

function hoursBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return 0;
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

export default function BarPlanner() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activeEventId, setActiveEventId] = useState('');
  const [plan, setPlan] = useState<BarPlannerPayload>({ products: starterProducts(), staff: [{ ...blankStaff(), staffCount: 2 }], notes: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    products: true,
    staff: false,
    menu: false,
    notes: false
  });
  const [openProducts, setOpenProducts] = useState<Record<string, boolean>>({});

  function toggleSection(section: string) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function isSectionOpen(section: string) {
    return openSections[section] !== false;
  }

  function toggleProductCard(id: string) {
    setOpenProducts((current) => ({ ...current, [id]: !(current[id] ?? false) }));
  }

  function isProductOpen(id: string) {
    return openProducts[id] ?? false;
  }

  const activeEvent = events.find((event) => event.id === activeEventId) || events[0];

  async function load() {
    setLoading(true);
    setMessage('');
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('event_plans')
      .select('id,name,event_date,payload,updated_at')
      .order('event_date', { ascending: true, nullsFirst: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as EventRow[];
    setEvents(rows);
    const nextActive = activeEventId ? rows.find((event) => event.id === activeEventId) : rows[0];
    if (nextActive) {
      setActiveEventId(nextActive.id);
      setPlan(hydrateBarPlan(nextActive.payload));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function chooseEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    setActiveEventId(event.id);
    setPlan(hydrateBarPlan(event.payload));
    setMessage('');
  }

  function patchProduct(id: string, patch: Partial<BarProduct>) {
    setPlan((current) => ({
      ...current,
      products: current.products.map((product) => product.id === id ? { ...product, ...patch } : product)
    }));
  }

  function patchStaff(id: string, patch: Partial<BarStaffLine>) {
    setPlan((current) => ({
      ...current,
      staff: current.staff.map((line) => line.id === id ? { ...line, ...patch } : line)
    }));
  }

  function addProduct() {
    const product = blankProduct();
    setPlan((current) => ({ ...current, products: [...current.products, product] }));
    setOpenProducts((current) => ({ ...current, [product.id]: true }));
    setOpenSections((current) => ({ ...current, products: true }));
  }

  function removeProduct(id: string) {
    setPlan((current) => ({ ...current, products: current.products.filter((product) => product.id !== id) }));
  }

  function addStaffLine() {
    setPlan((current) => ({ ...current, staff: [...current.staff, blankStaff()] }));
  }

  function removeStaffLine(id: string) {
    setPlan((current) => ({ ...current, staff: current.staff.filter((line) => line.id !== id) }));
  }

  async function savePlan() {
    if (!activeEvent) {
      setMessage('Choose an event first.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const nextPayload = {
      ...(activeEvent.payload || {}),
      barPlanner: plan,
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('event_plans')
      .update({ payload: nextPayload, updated_at: new Date().toISOString() })
      .eq('id', activeEvent.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setEvents((current) => current.map((event) => event.id === activeEvent.id ? { ...event, payload: nextPayload, updated_at: new Date().toISOString() } : event));
    setMessage('Bar plan saved to event.');
  }

  async function copyMenu() {
    const menuText = groupedMenu.map(([category, items]) => [
      category.toUpperCase(),
      ...items.map((item) => `${item.name} — ${moneyText(item.sellPrice)}${item.menuDescription ? `\n${item.menuDescription}` : ''}`)
    ].join('\n')).join('\n\n');

    try {
      await navigator.clipboard.writeText(menuText || 'No menu items yet.');
      setCopied(true);
      setMessage('Menu copied.');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setMessage(menuText || 'No menu items yet.');
    }
  }

  const totals = useMemo(() => {
    const productRevenue = plan.products.reduce((sum, product) => sum + number(product.sellPrice) * number(product.expectedQty), 0);
    const productCost = plan.products.reduce((sum, product) => sum + number(product.buyPrice) * number(product.expectedQty), 0);
    const productProfit = productRevenue - productCost;
    const margin = productRevenue ? (productProfit / productRevenue) * 100 : 0;
    const staffCost = plan.staff.reduce((sum, line) => sum + hoursBetween(line.startTime, line.endTime) * number(line.hourlyWage) * number(line.staffCount), 0);
    const netAfterStaff = productProfit - staffCost;
    const totalQty = plan.products.reduce((sum, product) => sum + number(product.expectedQty), 0);
    return { productRevenue, productCost, productProfit, margin, staffCost, netAfterStaff, totalQty };
  }, [plan]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!activeEvent) list.push('No event selected');
    if (!plan.products.length) list.push('No products');
    if (!plan.staff.length) list.push('No staffing');
    plan.products.forEach((product) => {
      if (!product.name) list.push('Product missing name');
      if (!product.sellPrice) list.push(`${product.name || 'Product'}: no sell price`);
      if (!product.buyPrice) list.push(`${product.name || 'Product'}: no buy price`);
      if (!product.expectedQty) list.push(`${product.name || 'Product'}: no quantity`);
      if (product.sellPrice && product.buyPrice && product.sellPrice <= product.buyPrice) list.push(`${product.name || 'Product'}: low/negative margin`);
    });
    plan.staff.forEach((line) => {
      if (!line.startTime || !line.endTime) list.push(`${line.role || 'Staff'}: missing shift time`);
    });
    return list;
  }, [activeEvent, plan]);

  const groupedMenu = useMemo(() => {
    const visible = plan.products.filter((product) => product.menuVisible && product.name);
    return categories
      .map((category) => [category, visible.filter((product) => product.category === category)] as [ProductCategory, BarProduct[]])
      .filter(([, items]) => items.length);
  }, [plan.products]);

  return (
    <main className="system-shell bar-planner-page no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="system-wrap">
        <div className="bar-top-nav bar-top-nav-v39">
          <Link href="/" className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">System</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Dashboard</strong>
          </Link>
          <Link href="/event-planner" className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">Open</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Planner</strong>
          </Link>
          <button onClick={savePlan} className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">Save</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Bar plan</strong>
          </button>
        </div>

        <section className="bar-forecast-card passport-card">
          <div className="bar-forecast-top-row">
            <div>
              <p className="system-kicker">Bar Planner</p>
              <h1>{activeEvent ? eventTitle(activeEvent) : 'Bar plan'}</h1>
            </div>
            <div className="bar-status-pill">
              <span>Margin</span>
              <strong>{percent(totals.margin)}</strong>
            </div>
          </div>

          <div className="bar-forecast-main">
            <div className="bar-event-selector-inline">
              <label>
                <span>Event</span>
                <select value={activeEvent?.id || ''} onChange={(event) => chooseEvent(event.target.value)}>
                  {!events.length && <option value="">No events</option>}
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {eventTitle(event)} · {formatDate(event.event_date || event.payload?.meta?.date)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="bar-meta-pill">
                <span>Date</span>
                <strong>{formatDate(activeEvent?.event_date || activeEvent?.payload?.meta?.date)}</strong>
              </div>
              <div className="bar-meta-pill">
                <span>Products</span>
                <strong>{plan.products.length}</strong>
              </div>
            </div>

            <div className="bar-profit-orb">
              <span>After staff</span>
              <strong>{moneyNode(totals.netAfterStaff)}</strong>
              <em>projected</em>
            </div>
          </div>
        </section>

        {message && <div className="artist-message">{message}</div>}
        {loading && <div className="artist-message">Loading events…</div>}

        <section className="bar-summary-grid bar-summary-grid-v39">
          <div className="booking-overview-card passport-card"><span>Revenue</span><strong>{moneyNode(totals.productRevenue)}</strong></div>
          <div className="booking-overview-card passport-card"><span>Stock cost</span><strong>{moneyNode(totals.productCost)}</strong></div>
          <div className="booking-overview-card passport-card"><span>Gross profit</span><strong>{moneyNode(totals.productProfit)}</strong></div>
          <div className="booking-overview-card passport-card"><span>Staff cost</span><strong>{moneyNode(totals.staffCost)}</strong></div>
        </section>

        {warnings.length > 0 && (
          <section className="bar-warning-row">
            {warnings.slice(0, 5).map((warning, index) => <span key={`${warning}-${index}`}>{warning}</span>)}
            {warnings.length > 5 && <span>+{warnings.length - 5} more</span>}
          </section>
        )}

        <section className="bar-module-grid">
          <div className={`bar-panel bar-collapsible-panel passport-card ${isSectionOpen('products') ? 'is-open' : 'is-collapsed'}`}>
            <div className="bar-panel-head bar-collapsible-head">
              <button type="button" className="bar-section-toggle" onClick={() => toggleSection('products')}>
                <span>Products</span>
                <em>{isSectionOpen('products') ? '−' : '+'}</em>
              </button>
              <button onClick={addProduct}>Add product</button>
            </div>

            {isSectionOpen('products') && (
              <div className="bar-product-list">
              {plan.products.map((product) => {
                const revenue = number(product.sellPrice) * number(product.expectedQty);
                const cost = number(product.buyPrice) * number(product.expectedQty);
                const profit = revenue - cost;
                const margin = revenue ? (profit / revenue) * 100 : 0;

                return (
                  <article key={product.id} className={`bar-product-card bar-product-card-v50 ${isProductOpen(product.id) ? 'is-open' : 'is-collapsed'}`}>
                    <button type="button" className="bar-product-collapse-head" onClick={() => toggleProductCard(product.id)}>
                      <span>{product.name || 'Unnamed product'}</span>
                      <small>{product.category} · {product.expectedQty || 0} qty</small>
                      <em>{isProductOpen(product.id) ? '−' : '+'}</em>
                    </button>

                    {isProductOpen(product.id) && (
                      <>
                    <div className="bar-product-top">
                      <input value={product.name} placeholder="Product name" onChange={(event) => patchProduct(product.id, { name: event.target.value })} />
                      <select value={product.category} onChange={(event) => patchProduct(product.id, { category: event.target.value as ProductCategory })}>
                        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>

                    <div className="bar-product-fields">
                      <label><span>Supplier</span><input value={product.supplier} placeholder="Supplier" onChange={(event) => patchProduct(product.id, { supplier: event.target.value })} /></label>
                      <label><span>Unit</span><input value={product.unitType} placeholder="Bottle, keg, glass..." onChange={(event) => patchProduct(product.id, { unitType: event.target.value })} /></label>
                      <label><span>Size</span><input value={product.unitSize} placeholder="33cl, 20L..." onChange={(event) => patchProduct(product.id, { unitSize: event.target.value })} /></label>
                      <label><span>Buy price</span><input inputMode="decimal" value={product.buyPrice || ''} onChange={(event) => patchProduct(product.id, { buyPrice: number(event.target.value) })} /></label>
                      <label><span>Sell price</span><input inputMode="decimal" value={product.sellPrice || ''} onChange={(event) => patchProduct(product.id, { sellPrice: number(event.target.value) })} /></label>
                      <label><span>Quantity</span><input inputMode="decimal" value={product.expectedQty || ''} onChange={(event) => patchProduct(product.id, { expectedQty: number(event.target.value) })} /></label>
                    </div>

                    <div className="bar-product-total-row">
                      <div className="bar-product-total-card">
                        <span>Revenue</span>
                        <strong>{moneyNode(revenue)}</strong>
                      </div>
                      <div className="bar-product-total-card">
                        <span>Cost</span>
                        <strong>{moneyNode(cost)}</strong>
                      </div>
                      <div className="bar-product-total-card">
                        <span>Profit</span>
                        <strong>{moneyNode(profit)}</strong>
                      </div>
                      <div className="bar-product-total-card">
                        <span>Margin</span>
                        <strong>{percent(margin)}</strong>
                      </div>
                    </div>

                    <div className="bar-product-actions">
                      <label className="bar-menu-toggle">
                        <input type="checkbox" checked={product.menuVisible} onChange={(event) => patchProduct(product.id, { menuVisible: event.target.checked })} />
                        Show on menu
                      </label>
                      <button onClick={() => removeProduct(product.id)}>Remove</button>
                    </div>
                      </>
                    )}
                  </article>
                );
              })}
              </div>
            )}
          </div>

          <div className="bar-side-stack">
            <div className={`bar-panel bar-collapsible-panel passport-card ${isSectionOpen('staff') ? 'is-open' : 'is-collapsed'}`}>
              <div className="bar-panel-head bar-collapsible-head">
                <button type="button" className="bar-section-toggle" onClick={() => toggleSection('staff')}>
                  <span>Staff plan</span>
                  <em>{isSectionOpen('staff') ? '−' : '+'}</em>
                </button>
                <button onClick={addStaffLine}>Add shift</button>
              </div>

              {isSectionOpen('staff') && (
                <div className="bar-staff-list">
                {plan.staff.map((line) => {
                  const hours = hoursBetween(line.startTime, line.endTime);
                  const cost = hours * line.hourlyWage * line.staffCount;
                  return (
                    <article key={line.id} className="bar-staff-card">
                      <div className="bar-staff-fields">
                        <label><span>Role</span><input value={line.role} onChange={(event) => patchStaff(line.id, { role: event.target.value })} /></label>
                        <label><span>Staff</span><input inputMode="numeric" value={line.staffCount || ''} onChange={(event) => patchStaff(line.id, { staffCount: number(event.target.value) })} /></label>
                        <label><span>Start</span><input type="time" value={line.startTime} onChange={(event) => patchStaff(line.id, { startTime: event.target.value })} /></label>
                        <label><span>End</span><input type="time" value={line.endTime} onChange={(event) => patchStaff(line.id, { endTime: event.target.value })} /></label>
                        <label><span>Wage</span><input inputMode="decimal" value={line.hourlyWage || ''} onChange={(event) => patchStaff(line.id, { hourlyWage: number(event.target.value) })} /></label>
                      </div>
                      <div className="bar-staff-total">
                        <span>{hours ? `${hours} hours` : 'No time'}</span>
                        <strong>{moneyNode(cost)}</strong>
                        <button onClick={() => removeStaffLine(line.id)}>Remove</button>
                      </div>
                    </article>
                  );
                })}
                </div>
              )}
            </div>

            <div className={`bar-panel bar-collapsible-panel passport-card ${isSectionOpen('menu') ? 'is-open' : 'is-collapsed'}`}>
              <div className="bar-panel-head bar-collapsible-head">
                <button type="button" className="bar-section-toggle" onClick={() => toggleSection('menu')}>
                  <span>Menu builder</span>
                  <em>{isSectionOpen('menu') ? '−' : '+'}</em>
                </button>
                <button onClick={copyMenu}>{copied ? 'Copied' : 'Copy menu'}</button>
              </div>

              {isSectionOpen('menu') && (
                <>
              <div className="bar-menu-builder">
                {plan.products.map((product) => (
                  <article key={product.id} className="bar-menu-edit-row">
                    <label>
                      <span>{product.name || 'Unnamed product'}</span>
                      <textarea
                        rows={2}
                        value={product.menuDescription}
                        placeholder="Short menu description"
                        onChange={(event) => patchProduct(product.id, { menuDescription: event.target.value })}
                      />
                    </label>
                  </article>
                ))}
              </div>

              <div className="bar-menu-preview">
                <p className="system-kicker">Menu preview</p>
                {!groupedMenu.length && <p className="bar-empty-text">No menu items visible.</p>}
                {groupedMenu.map(([category, items]) => (
                  <section key={category}>
                    <h3>{category}</h3>
                    {items.map((item) => (
                      <div key={item.id} className="bar-menu-preview-item">
                        <div>
                          <strong>{item.name}</strong>
                          {item.menuDescription && <span>{item.menuDescription}</span>}
                        </div>
                        <em>{moneyNode(item.sellPrice)}</em>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
                </>
              )}
            </div>

            <div className={`bar-panel bar-collapsible-panel passport-card ${isSectionOpen('notes') ? 'is-open' : 'is-collapsed'}`}>
              <div className="bar-panel-head bar-collapsible-head">
                <button type="button" className="bar-section-toggle" onClick={() => toggleSection('notes')}>
                  <span>Bar notes</span>
                  <em>{isSectionOpen('notes') ? '−' : '+'}</em>
                </button>
              </div>
              {isSectionOpen('notes') && (
                <textarea
                className="bar-notes"
                rows={5}
                value={plan.notes}
                placeholder="Setup notes, service style, special stock, supplier notes..."
                onChange={(event) => setPlan((current) => ({ ...current, notes: event.target.value }))}
              />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

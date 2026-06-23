'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell, Badge, Button, Card, CheckboxRow, Field, Row, Section, Stat, SubCard } from './ui/AppShell';
import { useEventStore } from './EventStore';
import { defaultBarPlanner, id } from '@/lib/defaults';
import { BarPlannerPayload, BarProduct, BarStaffLine, ProductCategory } from '@/lib/types';
import { barProductTotal, barStaffCost, dkk } from '@/lib/calculations';

const categories: ProductCategory[] = ['Beer', 'Wine', 'Cocktail', 'Shot', 'Soft drink', 'Coffee', 'Other'];

export default function BarPlanner() {
 const { events, current, saveEvent, setCurrentId } = useEventStore();
 const [plan, setPlan] = useState<BarPlannerPayload>(current?.barPlanner || defaultBarPlanner());

 useEffect(() => {
  setPlan(current?.barPlanner || defaultBarPlanner());
 }, [current?.id]);

 const totals = useMemo(() => {
  const productTotals = plan.products.map(barProductTotal);
  const revenue = productTotals.reduce((sum, item) => sum + item.revenue, 0);
  const stock = productTotals.reduce((sum, item) => sum + item.stockCost, 0);
  const gross = revenue - stock;
  const staff = plan.staff.reduce((sum, item) => sum + barStaffCost(item), 0);

  return {
   revenue,
   stock,
   gross,
   staff,
   profit: gross - staff,
   margin: revenue ? ((gross - staff) / revenue) * 100 : 0,
   warnings: plan.staff.filter((item) => !item.startTime || !item.endTime).length,
  };
 }, [plan]);

 const save = async () => {
  if (current) {
   await saveEvent({ ...current, barPlanner: plan });
  }
 };

 const updateProduct = (productId: string, patch: Partial<BarProduct>) => {
  setPlan((currentPlan) => ({
   ...currentPlan,
   products: currentPlan.products.map((item) => (item.id === productId ? { ...item, ...patch } : item)),
  }));
 };

 const updateStaff = (staffId: string, patch: Partial<BarStaffLine>) => {
  setPlan((currentPlan) => ({
   ...currentPlan,
   staff: currentPlan.staff.map((item) => (item.id === staffId ? { ...item, ...patch } : item)),
  }));
 };

 const menu = categories
  .map((category) => {
   const items = plan.products.filter((product) => product.menuVisible && product.category === category);
   return items.length
    ? `${category}\n${items
      .map((item) => `- ${item.name} ${item.menuDescription ? `— ${item.menuDescription}` : ''} ${dkk(item.sellPrice)}`)
      .join('\n')}`
    : '';
  })
  .filter(Boolean)
  .join('\n\n');

 return (
  <AppShell title="Bar Planner" actions={<Button kind="soft" onClick={save}>Save</Button>}>
   <div className="space-y-5">
    <Card>
     <p className="text-sm eos-muted">Attached to event</p>
     <h2 className="eos-heading mt-2">Bar plan</h2>

     <div className="mt-4">
      <Field label="Select event">
       <select value={current?.id || ''} onChange={(event) => setCurrentId(event.target.value)}>
        {events.map((event) => (
         <option key={event.id} value={event.id}>
          {event.meta.name}
         </option>
        ))}
       </select>
      </Field>
     </div>

     <div className="mt-4 grid grid-cols-2 gap-2">
      <Stat label="Revenue" value={dkk(totals.revenue)} />
      <Stat label="Stock cost" value={dkk(totals.stock)} />
      <Stat label="After staff" value={dkk(totals.profit)} />
      <Stat label="Margin" value={`${Math.round(totals.margin)}%`} />
     </div>

     {totals.warnings > 0 && (
      <div className="mt-4">
       <Badge tone="warn">{totals.warnings} staff shift warnings</Badge>
      </div>
     )}
    </Card>

    {!current && (
     <Card>
      <p className="eos-muted">No selected event. Create or select an event first.</p>
     </Card>
    )}

    <Section title="Products" openDefault>
     <div className="space-y-3">
      {plan.products.map((product) => {
       const totalsForProduct = barProductTotal(product);
       return (
        <Section key={product.id} title={product.name || 'Product'} right={<Badge>{dkk(totalsForProduct.profit)}</Badge>}>
         <Row>
          <Field label="Name">
           <input value={product.name} onChange={(event) => updateProduct(product.id, { name: event.target.value })} />
          </Field>
          <Field label="Category">
           <select value={product.category} onChange={(event) => updateProduct(product.id, { category: event.target.value as ProductCategory })}>
            {categories.map((category) => (
             <option key={category}>{category}</option>
            ))}
           </select>
          </Field>
         </Row>

         <Row>
          <Field label="Supplier">
           <input value={product.supplier} onChange={(event) => updateProduct(product.id, { supplier: event.target.value })} />
          </Field>
          <Field label="Unit type">
           <input value={product.unitType} onChange={(event) => updateProduct(product.id, { unitType: event.target.value })} />
          </Field>
         </Row>

         <Row>
          <Field label="Unit size">
           <input value={product.unitSize} onChange={(event) => updateProduct(product.id, { unitSize: event.target.value })} />
          </Field>
          <Field label="Expected qty">
           <input type="number" value={product.expectedQty} onChange={(event) => updateProduct(product.id, { expectedQty: Number(event.target.value) })} />
          </Field>
         </Row>

         <Row>
          <Field label="Buy price">
           <input type="number" value={product.buyPrice} onChange={(event) => updateProduct(product.id, { buyPrice: Number(event.target.value) })} />
          </Field>
          <Field label="Sell price">
           <input type="number" value={product.sellPrice} onChange={(event) => updateProduct(product.id, { sellPrice: Number(event.target.value) })} />
          </Field>
         </Row>

         <div className="grid grid-cols-2 gap-2">
          <Stat label="Revenue" value={dkk(totalsForProduct.revenue)} />
          <Stat label="Cost" value={dkk(totalsForProduct.stockCost)} />
          <Stat label="Profit" value={dkk(totalsForProduct.profit)} />
          <Stat label="Margin" value={`${Math.round(totalsForProduct.margin)}%`} />
         </div>

         <CheckboxRow label="Show on menu" checked={product.menuVisible} onChange={(checked) => updateProduct(product.id, { menuVisible: checked })} />

         <Field label="Menu description">
          <textarea value={product.menuDescription} onChange={(event) => updateProduct(product.id, { menuDescription: event.target.value })} />
         </Field>

         <Button kind="danger" className="w-fit" onClick={() => setPlan((currentPlan) => ({ ...currentPlan, products: currentPlan.products.filter((item) => item.id !== product.id) }))}>
          Remove product
         </Button>
        </Section>
       );
      })}
     </div>

     <Button
      kind="ghost"
      className="w-fit"
      onClick={() =>
       setPlan((currentPlan) => ({
        ...currentPlan,
        products: [
         ...currentPlan.products,
         {
          id: id(),
          name: 'New product',
          category: 'Other',
          supplier: '',
          unitType: '',
          unitSize: '',
          buyPrice: 0,
          sellPrice: 0,
          expectedQty: 0,
          menuVisible: false,
          menuDescription: '',
         },
        ],
       }))
      }
     >
      Add product
     </Button>
    </Section>

    <Section title="Staff plan" right={dkk(totals.staff)}>
     <div className="space-y-3">
      {plan.staff.map((staffLine) => (
       <SubCard key={staffLine.id}>
        <Row>
         <Field label="Role">
          <input value={staffLine.role} onChange={(event) => updateStaff(staffLine.id, { role: event.target.value })} />
         </Field>
         <Field label="Staff count">
          <input type="number" value={staffLine.staffCount} onChange={(event) => updateStaff(staffLine.id, { staffCount: Number(event.target.value) })} />
         </Field>
        </Row>

        <Row>
         <Field label="Start">
          <input type="time" value={staffLine.startTime} onChange={(event) => updateStaff(staffLine.id, { startTime: event.target.value })} />
         </Field>
         <Field label="End">
          <input type="time" value={staffLine.endTime} onChange={(event) => updateStaff(staffLine.id, { endTime: event.target.value })} />
         </Field>
        </Row>

        <Field label="Hourly wage">
         <input type="number" value={staffLine.hourlyWage} onChange={(event) => updateStaff(staffLine.id, { hourlyWage: Number(event.target.value) })} />
        </Field>

        <Badge>{dkk(barStaffCost(staffLine))}</Badge>

        <Button kind="danger" className="w-fit" onClick={() => setPlan((currentPlan) => ({ ...currentPlan, staff: currentPlan.staff.filter((item) => item.id !== staffLine.id) }))}>
         Remove staff
        </Button>
       </SubCard>
      ))}
     </div>

     <Button
      kind="ghost"
      className="w-fit"
      onClick={() =>
       setPlan((currentPlan) => ({
        ...currentPlan,
        staff: [...currentPlan.staff, { id: id(), role: 'Bartender', staffCount: 1, startTime: '', endTime: '', hourlyWage: 160 }],
       }))
      }
     >
      Add staff line
     </Button>
    </Section>

    <Section title="Menu builder">
     <textarea readOnly value={menu || 'No menu-visible products yet.'} />
     <Button kind="ghost" className="w-fit" onClick={() => navigator.clipboard.writeText(menu)}>
      Copy menu text
     </Button>
    </Section>

    <Section title="Bar notes">
     <textarea value={plan.notes} onChange={(event) => setPlan((currentPlan) => ({ ...currentPlan, notes: event.target.value }))} />
    </Section>
   </div>
  </AppShell>
 );
}

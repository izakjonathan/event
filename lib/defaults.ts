import { BarPlannerPayload, PlannerEvent, EventMeta, TicketTier, MoneyLine, StaffLine, BarPlan, Scenario, TermsPlan, Project, Task, ArtistSubmission } from './types';
export const id = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
export const now = () => new Date().toISOString();
export const defaultMeta = (): EventMeta => ({ name:'Untitled event', date:'', endDate:'', location:'', time:'', endTime:'', terms:'', notes:'', status:'idea' });
export const defaultBar = (): BarPlan => ({ enabled:false, useTicketGuests:true, customGuests:0, spendPerGuest:80, costPercent:28, notes:'' });
export const defaultTerms = (): TermsPlan => ({ enabled:false, organizerTicketShare:100, organizerBarProfitShare:100, flatVenueHire:0, minimumVenueGuarantee:0, notes:'' });
export const defaultScenarios = (): Scenario[] => ['Low','Expected','Best case'].map((name,i)=>({ id:id(), name, ticketsSold:[30,75,120][i], averageTicketPrice:90, barSpendPerGuest:[55,80,110][i], extraExpenses:0, notes:'' }));
export const ticket = (name='Tickets', price=90, capacity=100): TicketTier => ({ id:id(), name, price, sold:0, capacity, notes:'' });
export const line = (kind:'income'|'expense', name=kind==='income'?'Extra income':'Expense'): MoneyLine => ({ id:id(), kind, name, amount:0, quantity:1, mode:'fixed', notes:'' });
export const staff = (): StaffLine => ({ id:id(), role:'Bartender', people:1, hours:5, hourlyWage:160, extraPercent:12.5, notes:'' });
export const defaultBarPlanner = (): BarPlannerPayload => ({ notes:'', products:[
  { id:id(), name:'House beer', category:'Beer', supplier:'', unitType:'keg', unitSize:'20L', buyPrice:650, sellPrice:55, expectedQty:60, menuVisible:true, menuDescription:'House draft beer' },
  { id:id(), name:'House wine', category:'Wine', supplier:'', unitType:'bottle', unitSize:'75cl', buyPrice:55, sellPrice:65, expectedQty:18, menuVisible:true, menuDescription:'House wine by the glass' },
  { id:id(), name:'Shot', category:'Shot', supplier:'', unitType:'bottle', unitSize:'70cl', buyPrice:110, sellPrice:35, expectedQty:30, menuVisible:true, menuDescription:'House shot' }
], staff:[{id:id(), role:'Bartender', staffCount:2, startTime:'18:00', endTime:'01:00', hourlyWage:160}] });
const baseEvent = (): PlannerEvent => ({ id:id(), meta:defaultMeta(), tickets:[], lines:[], staff:[], bar:defaultBar(), scenarios:defaultScenarios(), termsPlan:defaultTerms(), files:[], artists:[], updatedAt:now() });
export function eventFromTemplate(template:string): PlannerEvent { const e=baseEvent(); e.meta.name=template==='Blank'?'Untitled event':template; if(template==='Concert'){ e.tickets=[ticket('Presale',90,80),ticket('Door',110,40)]; e.lines=[line('expense','Sound technician'),line('expense','Marketing')]; e.staff=[staff()]; e.bar.enabled=true; }
 else if(template==='Quiz night'){ e.tickets=[ticket('Team ticket',50,80)]; e.lines=[line('expense','Quiz host')]; e.staff=[staff()]; e.bar.enabled=true; e.bar.spendPerGuest=65; }
 else if(template==='Private party'){ e.tickets=[]; e.lines=[{...line('income','Room hire'),amount:3500}]; e.staff=[staff()]; e.bar.enabled=true; }
 else if(template==='DJ night'){ e.tickets=[ticket('Entry',80,120)]; e.lines=[line('expense','DJ fee')]; e.staff=[staff()]; e.bar.enabled=true; e.bar.spendPerGuest=100; }
 else if(template==='Football screening'){ e.tickets=[ticket('Table reservation',0,80)]; e.staff=[staff()]; e.bar.enabled=true; }
 else if(template==='Corporate event'){ e.lines=[{...line('income','Event package'),amount:12000}]; e.staff=[staff(),{...staff(),id:id(),role:'Host'}]; e.bar.enabled=true; }
 else { e.tickets=[ticket()]; e.staff=[staff()]; }
 return hydrateEvent(e); }
export function hydrateEvent(raw:any): PlannerEvent { const e=baseEvent(); const x={...e,...raw}; x.meta={...e.meta,...(raw?.meta||{})}; x.tickets=Array.isArray(raw?.tickets)?raw.tickets:[]; x.lines=Array.isArray(raw?.lines)?raw.lines:[]; x.staff=Array.isArray(raw?.staff)?raw.staff:[]; x.bar={...e.bar,...(raw?.bar||{})}; x.scenarios=Array.isArray(raw?.scenarios)&&raw.scenarios.length?raw.scenarios:e.scenarios; x.termsPlan={...e.termsPlan,...(raw?.termsPlan||{})}; x.files=Array.isArray(raw?.files)?raw.files:[]; x.artists=Array.isArray(raw?.artists)?raw.artists:[]; if(raw?.barPlanner) x.barPlanner={...defaultBarPlanner(),...raw.barPlanner,products:Array.isArray(raw.barPlanner.products)?raw.barPlanner.products:[],staff:Array.isArray(raw.barPlanner.staff)?raw.barPlanner.staff:[]}; return x; }
export const blankSubmission = (): ArtistSubmission => ({ id:id(), artist_name:'', contact_name:'', email:'', phone:'', genre:'', description:'', image_url:'', availability:'', availability_start_time:'', availability_end_time:'', preferred_fee:0, technical_needs:'', hospitality_needs:'', notes:'', links:{}, status:'new', created_at:now(), updated_at:now() });
export const blankProject = (): Project => ({ id:id(), title:'New project', status:'idea', priority:'medium', owner:'', due_date:null, linked_event_id:null, description:'', notes:'', created_at:now(), updated_at:now() });
export const blankTask = (): Task => ({ id:id(), project_id:null, title:'New task', status:'pending', priority:'medium', owner:'', due_date:null, linked_event_id:null, notes:'', checklist:[], image_urls:[], created_at:now(), updated_at:now() });

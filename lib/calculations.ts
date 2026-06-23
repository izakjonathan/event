import { BarProduct, BarStaffLine, MoneyLine, PlannerEvent, Scenario, StaffLine } from './types';

export function num(value: unknown) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function dkk(value: unknown) {
  return `${new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(num(value))} DKK`;
}

export function pct(value: unknown) {
  return `${Math.round(num(value) * 10) / 10}%`;
}

export function ticketTotals(event: PlannerEvent) {
  const sold = event.tickets.reduce((sum, tier) => sum + num(tier.sold), 0);
  const cap = event.tickets.reduce((sum, tier) => sum + num(tier.capacity), 0);
  const rev = event.tickets.reduce((sum, tier) => sum + num(tier.sold) * num(tier.price), 0);

  return {
    sold,
    cap,
    rev,
    fill: cap ? (sold / cap) * 100 : 0,
    avg: sold ? rev / sold : 0,
  };
}

export function lineTotal(line: MoneyLine, event: PlannerEvent) {
  const tickets = ticketTotals(event);

  if (line.mode === 'perTicketHolder') {
    return num(line.amount) * tickets.sold * num(line.quantity);
  }

  if (line.mode === 'percentageOfTickets') {
    return tickets.rev * (num(line.amount) / 100);
  }

  return num(line.amount) * num(line.quantity);
}

export function staffTotal(line: StaffLine) {
  const base = num(line.people) * num(line.hours) * num(line.hourlyWage);
  return base + (base * num(line.extraPercent)) / 100;
}

export function barTotals(event: PlannerEvent) {
  const tickets = ticketTotals(event);
  const guests = event.bar.useTicketGuests ? tickets.sold : num(event.bar.customGuests);
  const revenue = event.bar.enabled ? guests * num(event.bar.spendPerGuest) : 0;
  const stockCost = (revenue * num(event.bar.costPercent)) / 100;

  return {
    guests,
    revenue,
    stockCost,
    profit: revenue - stockCost,
  };
}

export function eventTotals(event: PlannerEvent) {
  const tickets = ticketTotals(event);
  const extraIncome = event.lines.filter((line) => line.kind === 'income').reduce((sum, line) => sum + lineTotal(line, event), 0);
  const expenses = event.lines.filter((line) => line.kind === 'expense').reduce((sum, line) => sum + lineTotal(line, event), 0);
  const staffCost = event.staff.reduce((sum, line) => sum + staffTotal(line), 0);
  const artistCost = event.artists.reduce((sum, artist) => sum + num(artist.fee), 0);
  const bar = barTotals(event);

  const totalIncome = tickets.rev + extraIncome + bar.revenue;
  const totalCosts = expenses + staffCost + artistCost + bar.stockCost;
  const profit = totalIncome - totalCosts;
  const profitPerGuest = tickets.sold ? profit / tickets.sold : 0;
  const margin = totalIncome ? (profit / totalIncome) * 100 : 0;

  const breakEvenPerGuest = tickets.avg + num(event.bar.spendPerGuest) * (1 - num(event.bar.costPercent) / 100);
  const breakEvenGuests = breakEvenPerGuest > 0 ? Math.ceil((expenses + staffCost + artistCost) / breakEvenPerGuest) : 0;

  let organizer = profit;
  let venue = 0;

  if (event.termsPlan.enabled) {
    const organizerTickets = (tickets.rev * num(event.termsPlan.organizerTicketShare)) / 100;
    const organizerBar = (bar.profit * num(event.termsPlan.organizerBarProfitShare)) / 100;

    organizer = organizerTickets + organizerBar + extraIncome - expenses - staffCost - artistCost - num(event.termsPlan.flatVenueHire);
    venue = tickets.rev - organizerTickets + (bar.profit - organizerBar) + num(event.termsPlan.flatVenueHire);

    if (num(event.termsPlan.minimumVenueGuarantee) > venue) {
      organizer -= num(event.termsPlan.minimumVenueGuarantee) - venue;
      venue = num(event.termsPlan.minimumVenueGuarantee);
    }
  }

  return {
    tickets,
    extraIncome,
    expenses,
    staffCost,
    artistCost,
    bar,
    totalIncome,
    totalCosts,
    profit,
    profitPerGuest,
    margin,
    breakEvenGuests,
    organizer,
    venue,
  };
}

export function scenarioTotal(scenario: Scenario, fixedCost = 0) {
  const tickets = num(scenario.ticketsSold) * num(scenario.averageTicketPrice);
  const bar = num(scenario.ticketsSold) * num(scenario.barSpendPerGuest);

  return {
    revenue: tickets + bar,
    costs: fixedCost + num(scenario.extraExpenses),
    profit: tickets + bar - fixedCost - num(scenario.extraExpenses),
  };
}

export function barProductTotal(product: BarProduct) {
  const revenue = num(product.sellPrice) * num(product.expectedQty);
  const stockCost = num(product.buyPrice) * num(product.expectedQty);
  const profit = revenue - stockCost;

  return {
    revenue,
    stockCost,
    profit,
    margin: revenue ? (profit / revenue) * 100 : 0,
  };
}

export function hoursBetween(start: string, end: string) {
  if (!start || !end) return 0;

  const [startHour, startMinute] = start.split(':').map(num);
  const [endHour, endMinute] = end.split(':').map(num);

  let from = startHour + (startMinute || 0) / 60;
  let to = endHour + (endMinute || 0) / 60;

  if (to < from) to += 24;
  return Math.max(0, to - from);
}

export function barStaffCost(line: BarStaffLine) {
  return num(line.staffCount) * hoursBetween(line.startTime, line.endTime) * num(line.hourlyWage);
}

export function comparisonTotals(event: PlannerEvent) {
  const totals = eventTotals(event);
  const plannedGuests = num(event.review.expectedGuests) || totals.tickets.sold || totals.bar.guests;
  const actualGuests = num(event.review.actualGuests) || totals.tickets.sold || totals.bar.guests || plannedGuests;
  const plannedStaff = num(event.review.plannedStaff) || event.staff.reduce((sum, line) => sum + num(line.people), 0);
  const actualStaff = num(event.review.actualStaff) || plannedStaff;
  const totalStaffHours = num(event.review.totalStaffHours) || event.staff.reduce((sum, line) => sum + num(line.people) * num(line.hours), 0);
  const ticketRevenue = num(event.review.ticketRevenue) || totals.tickets.rev;
  const barRevenue = num(event.review.barRevenue) || totals.bar.revenue;
  const otherRevenue = num(event.review.otherRevenue) || totals.extraIncome;
  const supplierCost = num(event.review.supplierCost);
  const equipmentCost = num(event.review.equipmentCost);
  const otherCost = num(event.review.otherCost) || totals.expenses;
  const revenue = ticketRevenue + barRevenue + otherRevenue;
  const cost = totals.staffCost + totals.artistCost + totals.bar.stockCost + supplierCost + equipmentCost + otherCost;
  const profit = revenue - cost;

  return {
    plannedGuests,
    actualGuests,
    guestDelta: actualGuests - plannedGuests,
    plannedStaff,
    actualStaff,
    totalStaffHours,
    ticketRevenue,
    barRevenue,
    otherRevenue,
    supplierCost,
    equipmentCost,
    otherCost,
    staffCost: totals.staffCost,
    artistCost: totals.artistCost,
    stockCost: totals.bar.stockCost,
    revenue,
    cost,
    profit,
    margin: revenue ? (profit / revenue) * 100 : 0,
    revenuePerGuest: actualGuests ? revenue / actualGuests : 0,
    costPerGuest: actualGuests ? cost / actualGuests : 0,
    profitPerGuest: actualGuests ? profit / actualGuests : 0,
    staffCostPercent: revenue ? (totals.staffCost / revenue) * 100 : 0,
  };
}

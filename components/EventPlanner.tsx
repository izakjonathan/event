"use client";

import { useEffect, useMemo, useState } from "react";
import { useEventStore } from "./EventStore";
import {
  AppShell,
  Badge,
  Button,
  Card,
  CheckboxRow,
  Field,
  Row,
  Section,
  Stat,
  SubCard,
} from "./ui/AppShell";
import {
  blankEventTemplate,
  defaultTemplateOptions,
  eventFromTemplate,
  hydrateEvent,
  id,
  line,
  now,
  staff,
  ticket,
} from "@/lib/defaults";
import { dkk, eventTotals, scenarioTotal } from "@/lib/calculations";
import { EventFile, EventTemplateOptions, PlannerEvent } from "@/lib/types";
import { fileToDataUrl } from "@/lib/utils";

const templates = [
  "Blank",
  "Concert",
  "Quiz night",
  "Private party",
  "DJ night",
  "Football screening",
  "Corporate event",
];
const statuses = ["idea", "quoted", "confirmed", "cancelled", "completed"];
const modes = ["fixed", "perTicketHolder", "percentageOfTickets"];

const templateOptionLabels: {
  key: keyof EventTemplateOptions;
  label: string;
  description: string;
}[] = [
  { key: "metaName", label: "Event name", description: "Reuse the event name" },
  { key: "metaDate", label: "Date", description: "Reuse date" },
  { key: "metaEndDate", label: "End date", description: "Reuse end date" },
  { key: "metaTime", label: "Start time", description: "Reuse start time" },
  { key: "metaEndTime", label: "End time", description: "Reuse end time" },
  {
    key: "metaLocation",
    label: "Location",
    description: "Reuse venue/location",
  },
  { key: "metaStatus", label: "Status", description: "Reuse event status" },
  { key: "metaTerms", label: "Terms", description: "Reuse terms text" },
  { key: "metaNotes", label: "Notes", description: "Reuse notes text" },
  { key: "tickets", label: "Tickets", description: "Reuse ticket tiers" },
  {
    key: "lines",
    label: "Income / expenses",
    description: "Reuse money lines",
  },
  { key: "staff", label: "Staff costs", description: "Reuse staff cost lines" },
  { key: "bar", label: "Bar calculation", description: "Reuse bar settings" },
  {
    key: "scenarios",
    label: "Scenarios",
    description: "Reuse scenario planning",
  },
  {
    key: "termsPlan",
    label: "Venue terms",
    description: "Reuse venue terms / split",
  },
  { key: "artists", label: "Artists", description: "Reuse linked artist rows" },
];

function cloneWithoutIds<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function stripTemplateIds(event: PlannerEvent): PlannerEvent {
  return hydrateEvent({
    ...cloneWithoutIds(event),
    id: id(),
    tickets: event.tickets.map((item) => ({
      ...cloneWithoutIds(item),
      id: id(),
    })),
    lines: event.lines.map((item) => ({ ...cloneWithoutIds(item), id: id() })),
    staff: event.staff.map((item) => ({ ...cloneWithoutIds(item), id: id() })),
    scenarios: event.scenarios.map((item) => ({
      ...cloneWithoutIds(item),
      id: id(),
    })),
    files: [],
    artists: event.artists.map((item) => ({
      ...cloneWithoutIds(item),
      id: id(),
    })),
    updatedAt: now(),
  });
}

function buildTemplatePayload(
  event: PlannerEvent,
  options: EventTemplateOptions,
): Partial<PlannerEvent> {
  const payload: Partial<PlannerEvent> = {
    meta: {
      name: options.metaName ? event.meta.name : "",
      date: options.metaDate ? event.meta.date : "",
      endDate: options.metaEndDate ? event.meta.endDate : "",
      location: options.metaLocation ? event.meta.location : "",
      time: options.metaTime ? event.meta.time : "",
      endTime: options.metaEndTime ? event.meta.endTime : "",
      terms: options.metaTerms ? event.meta.terms : "",
      notes: options.metaNotes ? event.meta.notes : "",
      status: options.metaStatus ? event.meta.status : "idea",
    },
  };
  if (options.tickets) payload.tickets = event.tickets.map(cloneWithoutIds);
  if (options.lines) payload.lines = event.lines.map(cloneWithoutIds);
  if (options.staff) payload.staff = event.staff.map(cloneWithoutIds);
  if (options.bar) payload.bar = cloneWithoutIds(event.bar);
  if (options.scenarios)
    payload.scenarios = event.scenarios.map(cloneWithoutIds);
  if (options.termsPlan) payload.termsPlan = cloneWithoutIds(event.termsPlan);
  if (options.artists) payload.artists = event.artists.map(cloneWithoutIds);
  return payload;
}

function applyTemplatePayload(
  base: PlannerEvent,
  payload: Partial<PlannerEvent>,
): PlannerEvent {
  return stripTemplateIds(
    hydrateEvent({
      ...base,
      ...payload,
      meta: { ...base.meta, ...(payload.meta || {}) },
      tickets: payload.tickets !== undefined ? payload.tickets : base.tickets,
      lines: payload.lines !== undefined ? payload.lines : base.lines,
      staff: payload.staff !== undefined ? payload.staff : base.staff,
      bar: payload.bar !== undefined ? payload.bar : base.bar,
      scenarios:
        payload.scenarios !== undefined ? payload.scenarios : base.scenarios,
      termsPlan:
        payload.termsPlan !== undefined ? payload.termsPlan : base.termsPlan,
      artists: payload.artists !== undefined ? payload.artists : base.artists,
    }),
  );
}

function num(value: string) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows
    .slice(1)
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] || ""]),
      ),
    );
}

function csvValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key.toLowerCase()];
    if (value !== undefined && value !== "") return value;
  }
  return "";
}

function csvBool(value: string, fallback = false) {
  if (!value) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(value.toLowerCase());
}

function downloadTextFile(filename: string, text: string) {
  const anchor = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const eventCsvTemplate = `event_key,template,event_name,date,end_date,start_time,end_time,location,status,terms,notes,ticket_name,ticket_price,ticket_sold,ticket_capacity,ticket_notes,line_kind,line_name,line_amount,line_quantity,line_mode,line_notes,staff_role,staff_people,staff_hours,staff_hourly_wage,staff_extra_percent,staff_notes,bar_enabled,bar_use_ticket_guests,bar_custom_guests,bar_spend_per_guest,bar_cost_percent,bar_notes,terms_enabled,organizer_ticket_share,organizer_bar_share,flat_venue_hire,minimum_venue_guarantee,terms_notes,scenario_name,scenario_tickets_sold,scenario_average_ticket_price,scenario_bar_spend_per_guest,scenario_extra_expenses,scenario_notes,artist_name,artist_contact,artist_email,artist_phone,artist_genre,artist_fee,artist_start_time,artist_end_time,artist_status,artist_notes,review_event_type,review_label,review_expected_guests,review_actual_guests,review_planned_staff,review_actual_staff,review_total_staff_hours,review_supplier_cost,review_equipment_cost,review_other_cost,review_ticket_revenue,review_bar_revenue,review_other_revenue,review_notes
sample-001,Blank,Example event,2026-08-19,,19:00,01:00,Temple Bar,idea,Terms here,Internal notes,Presale,100,50,100,Ticket note,expense,Marketing,500,1,fixed,Line note,Bartender,2,6,160,12.5,Staff note,true,true,0,80,28,Bar notes,true,100,100,0,0,Terms note,Expected,80,100,80,0,Scenario note,Artist name,Contact,email@example.com,12345678,Techno,2500,21:00,22:00,proposed,Artist note,Concert,Summer,100,90,2,2,12,0,0,0,5000,7200,0,Review note`;

export default function EventPlanner() {
  const store = useEventStore();
  const [draft, setDraft] = useState<PlannerEvent>(
    store.current ? hydrateEvent(store.current) : eventFromTemplate("Blank"),
  );
  const [selectedTemplate, setSelectedTemplate] = useState("Blank");
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateOptions, setTemplateOptions] = useState<EventTemplateOptions>(
    defaultTemplateOptions,
  );
  const [templateResult, setTemplateResult] = useState("");
  const [csvResult, setCsvResult] = useState("");

  useEffect(() => {
    if (store.current) {
      setDraft(hydrateEvent(store.current));
    }
  }, [store.current?.id]);

  const totals = useMemo(() => eventTotals(draft), [draft]);
  const fixed = totals.expenses + totals.staffCost + totals.artistCost;
  const guestsForInsight =
    totals.tickets.sold || totals.bar.guests || draft.bar.customGuests || 0;
  const insightStats = [
    { label: "Profit", value: dkk(totals.profit) },
    { label: "Revenue", value: dkk(totals.totalIncome) },
    { label: "Costs", value: dkk(totals.totalCosts) },
    { label: "Margin", value: `${Math.round(totals.margin)}%` },
    {
      label: "Tickets",
      value: totals.tickets.sold,
      sub: `${totals.tickets.cap} capacity`,
    },
    { label: "Fill", value: `${Math.round(totals.tickets.fill)}%` },
    { label: "Avg ticket", value: dkk(Math.round(totals.tickets.avg)) },
    { label: "Break-even", value: totals.breakEvenGuests, sub: "guests" },
    {
      label: "Profit / guest",
      value: dkk(
        Math.round(guestsForInsight ? totals.profit / guestsForInsight : 0),
      ),
    },
    {
      label: "Revenue / guest",
      value: dkk(
        Math.round(
          guestsForInsight ? totals.totalIncome / guestsForInsight : 0,
        ),
      ),
    },
    { label: "Bar revenue", value: dkk(totals.bar.revenue) },
    { label: "Bar profit", value: dkk(totals.bar.profit) },
    { label: "Staff", value: dkk(totals.staffCost) },
    { label: "Artists", value: dkk(totals.artistCost) },
    { label: "Stock cost", value: dkk(totals.bar.stockCost) },
    { label: "Organizer", value: dkk(totals.organizer) },
  ];

  const warnings = [
    !draft.meta.date && "Missing date",
    !draft.meta.time && "Missing start time",
    !draft.meta.location && "Missing location",
    draft.artists.some((artist) => !artist.startTime) && "Artist time missing",
    draft.artists.some((artist) => !artist.fee) && "Artist fee missing",
  ].filter(Boolean) as string[];

  const summaryText = `Event: ${draft.meta.name}
Date: ${draft.meta.date} ${draft.meta.time}
Location: ${draft.meta.location}
Tickets sold: ${totals.tickets.sold}
Ticket revenue: ${dkk(totals.tickets.rev)}
Bar profit: ${dkk(totals.bar.profit)}
Projected profit: ${dkk(totals.profit)}
Warnings: ${warnings.join(", ") || "None"}`;

  const set = (patch: Partial<PlannerEvent>) =>
    setDraft((current) => hydrateEvent({ ...current, ...patch }));

  const save = async () => {
    await store.saveEvent(draft);
  };
  const selectedSavedTemplate = store.eventTemplates.find(
    (template) => template.id === selectedSavedTemplateId,
  );

  const saveCurrentAsTemplate = async () => {
    const template = {
      ...blankEventTemplate(),
      id: selectedSavedTemplateId || id(),
      owner_key: store.ownerKey,
      name:
        templateName.trim() ||
        `${draft.meta.name || "Untitled event"} template`,
      description: templateDescription,
      options: templateOptions,
      payload: buildTemplatePayload(draft, templateOptions),
      updated_at: now(),
    };
    await store.saveEventTemplate(template);
    setSelectedSavedTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setTemplateResult("Template saved.");
  };

  const loadTemplateSettings = (templateId: string) => {
    const template = store.eventTemplates.find(
      (item) => item.id === templateId,
    );
    setSelectedSavedTemplateId(templateId);
    if (!template) return;
    setTemplateName(template.name);
    setTemplateDescription(template.description || "");
    setTemplateOptions({
      ...defaultTemplateOptions(),
      ...(template.options || {}),
    });
    setTemplateResult("Template settings loaded.");
  };

  const loadTemplateAsNewDraft = () => {
    if (!selectedSavedTemplate) return;
    const next = applyTemplatePayload(
      eventFromTemplate("Blank"),
      selectedSavedTemplate.payload || {},
    );
    next.id = id();
    next.meta.name = next.meta.name || "Untitled event";
    setDraft(next);
    store.setCurrentId("");
    setTemplateResult(
      "Template loaded as a new unsaved event. Fill the missing info, then press Save.",
    );
  };

  const applyTemplateToDraft = () => {
    if (!selectedSavedTemplate) return;
    setDraft(applyTemplatePayload(draft, selectedSavedTemplate.payload || {}));
    setTemplateResult("Template info applied to current draft.");
  };

  const load = (eventId: string) => {
    const event = store.events.find((item) => item.id === eventId);
    if (event) {
      store.setCurrentId(eventId);
      setDraft(hydrateEvent(event));
    }
  };

  const input = (
    label: string,
    value: string | number,
    onChange: (value: string | number) => void,
    type: "text" | "number" | "date" | "time" = "text",
  ) => (
    <Field label={label}>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            type === "number" ? num(event.target.value) : event.target.value,
          )
        }
      />
    </Field>
  );

  const importEventsCsv = async (file: File) => {
    const rows = parseCsv(await file.text());
    const eventsByKey = new Map<string, PlannerEvent>();

    rows.forEach((row, index) => {
      const eventName = csvValue(row, ["event_name", "name", "title"]);
      const eventDate = csvValue(row, ["date", "event_date"]);
      const key =
        csvValue(row, ["event_key", "event_id"]) ||
        `${eventName || "event"}-${eventDate || index}`;
      if (
        !eventName &&
        !eventDate &&
        !csvValue(row, [
          "ticket_name",
          "line_name",
          "staff_role",
          "scenario_name",
          "artist_name",
        ])
      )
        return;

      if (!eventsByKey.has(key)) {
        const event = eventFromTemplate(csvValue(row, ["template"]) || "Blank");
        event.id = csvValue(row, ["event_id"]) || id();
        event.tickets = [];
        event.lines = [];
        event.staff = [];
        event.scenarios = [];
        event.artists = [];
        eventsByKey.set(key, event);
      }

      const event = eventsByKey.get(key)!;
      event.meta = {
        ...event.meta,
        name: eventName || event.meta.name,
        date: eventDate || event.meta.date,
        endDate: csvValue(row, ["end_date"]) || event.meta.endDate,
        time: csvValue(row, ["start_time", "time"]) || event.meta.time,
        endTime: csvValue(row, ["end_time"]) || event.meta.endTime,
        location: csvValue(row, ["location", "venue"]) || event.meta.location,
        terms: csvValue(row, ["terms"]) || event.meta.terms,
        notes: csvValue(row, ["notes", "event_notes"]) || event.meta.notes,
        status: (csvValue(row, ["status"]) || event.meta.status) as any,
      };

      event.bar = {
        ...event.bar,
        enabled: csvBool(csvValue(row, ["bar_enabled"]), event.bar.enabled),
        useTicketGuests: csvBool(
          csvValue(row, ["bar_use_ticket_guests"]),
          event.bar.useTicketGuests,
        ),
        customGuests: csvValue(row, ["bar_custom_guests"])
          ? num(csvValue(row, ["bar_custom_guests"]))
          : event.bar.customGuests,
        spendPerGuest: csvValue(row, ["bar_spend_per_guest"])
          ? num(csvValue(row, ["bar_spend_per_guest"]))
          : event.bar.spendPerGuest,
        costPercent: csvValue(row, ["bar_cost_percent"])
          ? num(csvValue(row, ["bar_cost_percent"]))
          : event.bar.costPercent,
        notes: csvValue(row, ["bar_notes"]) || event.bar.notes,
      };

      event.termsPlan = {
        ...event.termsPlan,
        enabled: csvBool(
          csvValue(row, ["terms_enabled"]),
          event.termsPlan.enabled,
        ),
        organizerTicketShare: csvValue(row, ["organizer_ticket_share"])
          ? num(csvValue(row, ["organizer_ticket_share"]))
          : event.termsPlan.organizerTicketShare,
        organizerBarProfitShare: csvValue(row, [
          "organizer_bar_share",
          "organizer_bar_profit_share",
        ])
          ? num(
              csvValue(row, [
                "organizer_bar_share",
                "organizer_bar_profit_share",
              ]),
            )
          : event.termsPlan.organizerBarProfitShare,
        flatVenueHire: csvValue(row, ["flat_venue_hire"])
          ? num(csvValue(row, ["flat_venue_hire"]))
          : event.termsPlan.flatVenueHire,
        minimumVenueGuarantee: csvValue(row, ["minimum_venue_guarantee"])
          ? num(csvValue(row, ["minimum_venue_guarantee"]))
          : event.termsPlan.minimumVenueGuarantee,
        notes: csvValue(row, ["terms_notes"]) || event.termsPlan.notes,
      };

      event.review = {
        ...event.review,
        eventType:
          csvValue(row, ["review_event_type", "event_type"]) ||
          event.review.eventType,
        label: csvValue(row, ["review_label", "label"]) || event.review.label,
        expectedGuests: csvValue(row, [
          "review_expected_guests",
          "expected_guests",
        ])
          ? num(csvValue(row, ["review_expected_guests", "expected_guests"]))
          : event.review.expectedGuests,
        actualGuests: csvValue(row, ["review_actual_guests", "actual_guests"])
          ? num(csvValue(row, ["review_actual_guests", "actual_guests"]))
          : event.review.actualGuests,
        plannedStaff: csvValue(row, ["review_planned_staff", "planned_staff"])
          ? num(csvValue(row, ["review_planned_staff", "planned_staff"]))
          : event.review.plannedStaff,
        actualStaff: csvValue(row, ["review_actual_staff", "actual_staff"])
          ? num(csvValue(row, ["review_actual_staff", "actual_staff"]))
          : event.review.actualStaff,
        totalStaffHours: csvValue(row, [
          "review_total_staff_hours",
          "total_staff_hours",
        ])
          ? num(
              csvValue(row, ["review_total_staff_hours", "total_staff_hours"]),
            )
          : event.review.totalStaffHours,
        supplierCost: csvValue(row, ["review_supplier_cost", "supplier_cost"])
          ? num(csvValue(row, ["review_supplier_cost", "supplier_cost"]))
          : event.review.supplierCost,
        equipmentCost: csvValue(row, [
          "review_equipment_cost",
          "equipment_cost",
        ])
          ? num(csvValue(row, ["review_equipment_cost", "equipment_cost"]))
          : event.review.equipmentCost,
        otherCost: csvValue(row, ["review_other_cost", "other_cost"])
          ? num(csvValue(row, ["review_other_cost", "other_cost"]))
          : event.review.otherCost,
        ticketRevenue: csvValue(row, [
          "review_ticket_revenue",
          "ticket_revenue",
        ])
          ? num(csvValue(row, ["review_ticket_revenue", "ticket_revenue"]))
          : event.review.ticketRevenue,
        barRevenue: csvValue(row, ["review_bar_revenue", "bar_revenue"])
          ? num(csvValue(row, ["review_bar_revenue", "bar_revenue"]))
          : event.review.barRevenue,
        otherRevenue: csvValue(row, ["review_other_revenue", "other_revenue"])
          ? num(csvValue(row, ["review_other_revenue", "other_revenue"]))
          : event.review.otherRevenue,
        reviewNotes:
          csvValue(row, ["review_notes"]) || event.review.reviewNotes,
      };

      const ticketName = csvValue(row, ["ticket_name"]);
      if (
        ticketName ||
        csvValue(row, ["ticket_price", "ticket_sold", "ticket_capacity"])
      ) {
        event.tickets.push({
          ...ticket(ticketName || "Tickets"),
          name: ticketName || "Tickets",
          price: num(csvValue(row, ["ticket_price"])),
          sold: num(csvValue(row, ["ticket_sold"])),
          capacity: num(csvValue(row, ["ticket_capacity"])),
          notes: csvValue(row, ["ticket_notes"]),
        });
      }

      const lineName = csvValue(row, ["line_name"]);
      if (lineName || csvValue(row, ["line_amount"])) {
        event.lines.push({
          ...line(
            (csvValue(row, ["line_kind"]) || "expense") as any,
            lineName || "Line",
          ),
          kind: (csvValue(row, ["line_kind"]) || "expense") as any,
          name: lineName || "Line",
          amount: num(csvValue(row, ["line_amount"])),
          quantity: num(csvValue(row, ["line_quantity"])) || 1,
          mode: (csvValue(row, ["line_mode"]) || "fixed") as any,
          notes: csvValue(row, ["line_notes"]),
        });
      }

      const staffRole = csvValue(row, ["staff_role"]);
      if (
        staffRole ||
        csvValue(row, ["staff_people", "staff_hours", "staff_hourly_wage"])
      ) {
        event.staff.push({
          ...staff(),
          id: id(),
          role: staffRole || "Staff",
          people: num(csvValue(row, ["staff_people"])) || 1,
          hours: num(csvValue(row, ["staff_hours"])),
          hourlyWage: num(csvValue(row, ["staff_hourly_wage"])),
          extraPercent: num(csvValue(row, ["staff_extra_percent"])),
          notes: csvValue(row, ["staff_notes"]),
        });
      }

      const scenarioName = csvValue(row, ["scenario_name"]);
      if (scenarioName || csvValue(row, ["scenario_tickets_sold"])) {
        event.scenarios.push({
          id: id(),
          name: scenarioName || "Scenario",
          ticketsSold: num(csvValue(row, ["scenario_tickets_sold"])),
          averageTicketPrice: num(
            csvValue(row, ["scenario_average_ticket_price"]),
          ),
          barSpendPerGuest: num(
            csvValue(row, ["scenario_bar_spend_per_guest"]),
          ),
          extraExpenses: num(csvValue(row, ["scenario_extra_expenses"])),
          notes: csvValue(row, ["scenario_notes"]),
        });
      }

      const artistName = csvValue(row, ["artist_name"]);
      if (artistName) {
        event.artists.push({
          id: id(),
          artistName,
          contactName: csvValue(row, ["artist_contact"]),
          email: csvValue(row, ["artist_email"]),
          phone: csvValue(row, ["artist_phone"]),
          genre: csvValue(row, ["artist_genre"]),
          imageUrl: "",
          fee: num(csvValue(row, ["artist_fee"])),
          startTime: csvValue(row, ["artist_start_time"]),
          endTime: csvValue(row, ["artist_end_time"]),
          status: (csvValue(row, ["artist_status"]) || "proposed") as any,
          notes: csvValue(row, ["artist_notes"]),
        });
      }
    });

    const imported = Array.from(eventsByKey.values()).map(hydrateEvent);
    for (const event of imported) {
      await store.saveEvent(event);
    }
    if (imported[0]) setDraft(imported[0]);
    setCsvResult(
      imported.length
        ? `Imported ${imported.length} event${imported.length === 1 ? "" : "s"}.`
        : "No events found in CSV.",
    );
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eos-body eos-muted">Current plan</p>
              <h2 className="eos-title mt-1">{draft.meta.name}</h2>
              <p className="eos-body eos-muted">
                {draft.meta.date || "No date"} ·{" "}
                {draft.meta.location || "No location"}
              </p>
            </div>
            <Badge tone={warnings.length ? "warn" : "ok"}>
              {warnings.length ? `${warnings.length} warnings` : "Ready"}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {insightStats.map((stat) => (
              <Stat
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sub={stat.sub}
                className="eos-stat-compact"
              />
            ))}
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Workspace key">
              <input
                value={store.ownerKey}
                onChange={(event) => store.setOwnerKey(event.target.value)}
              />
            </Field>

            <Field label="Load event">
              <select
                value={store.currentId || ""}
                onChange={(event) => load(event.target.value)}
              >
                <option value="" disabled>
                  Choose saved event…
                </option>
                {store.events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.meta.name || "Untitled event"}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eos-caption eos-muted">Create event</p>
              <h2 className="eos-title mt-1">New event</h2>
              <p className="eos-body eos-muted">
                Choose a blank plan or a template, then add it as a saved event.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <Field label="Template">
              <select
                value={selectedTemplate}
                onChange={(event) => setSelectedTemplate(event.target.value)}
              >
                {templates.map((template) => (
                  <option key={template}>{template}</option>
                ))}
              </select>
            </Field>
            <Button
              onClick={async () => {
                const event = await store.createEvent(selectedTemplate);
                setDraft(hydrateEvent(event));
              }}
            >
              Add event
            </Button>
          </div>
        </Card>

        <Section title="Template builder" right={<Badge>{store.eventTemplates.length}</Badge>}>
          <div className="mb-4">
            <p className="eos-caption eos-muted">Reusable templates</p>
            <p className="eos-body eos-muted mt-1">
              Choose exactly what should be reused. Save the current plan as a
              template, then load it later as a new event draft.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Field label="Saved template">
              <select
                value={selectedSavedTemplateId}
                onChange={(event) => loadTemplateSettings(event.target.value)}
              >
                <option value="">Choose template…</option>
                {store.eventTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Template name">
              <input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="Template name"
              />
            </Field>
          </div>
          <Field label="Template description">
            <textarea
              value={templateDescription}
              onChange={(event) => setTemplateDescription(event.target.value)}
              placeholder="What this template is for"
            />
          </Field>

          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
            {templateOptionLabels.map((option) => (
              <CheckboxRow
                key={option.key}
                label={option.label}
                checked={templateOptions[option.key]}
                onChange={(checked) =>
                  setTemplateOptions((current) => ({
                    ...current,
                    [option.key]: checked,
                  }))
                }
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-4">
            <Button kind="ghost" onClick={saveCurrentAsTemplate}>
              Save current as template
            </Button>
            <Button
              kind="ghost"
              onClick={saveCurrentAsTemplate}
              disabled={!selectedSavedTemplateId}
            >
              Update selected template
            </Button>
            <Button
              kind="ghost"
              onClick={applyTemplateToDraft}
              disabled={!selectedSavedTemplateId}
            >
              Apply to current
            </Button>
            <Button
              onClick={loadTemplateAsNewDraft}
              disabled={!selectedSavedTemplateId}
            >
              Load as new event
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
            <Button
              kind="danger"
              onClick={() =>
                selectedSavedTemplateId &&
                store.deleteEventTemplate(selectedSavedTemplateId)
              }
              disabled={!selectedSavedTemplateId}
            >
              Delete template
            </Button>
            <Button
              kind="ghost"
              onClick={() => {
                setSelectedSavedTemplateId("");
                setTemplateName("");
                setTemplateDescription("");
                setTemplateOptions(defaultTemplateOptions());
                setTemplateResult("Ready for a new template.");
              }}
            >
              New empty template
            </Button>
          </div>
          {templateResult && (
            <p className="mt-3 eos-body eos-muted">{templateResult}</p>
          )}
        </Section>

        <Card>
          <div className="grid grid-cols-3 gap-2">
            <Button
              kind="ghost"
              onClick={() => store.duplicateEvent(draft.id)}
              disabled={!store.currentId}
            >
              Duplicate
            </Button>
            <Button
              kind="danger"
              onClick={() => store.deleteEvent(draft.id)}
              disabled={!store.currentId}
            >
              Delete
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </Card>

        <Section title="Basic details">
          <input
            value={draft.meta.name}
            onChange={(event) =>
              set({ meta: { ...draft.meta, name: event.target.value } })
            }
          />
          <Row>
            {input(
              "Date",
              draft.meta.date,
              (value) => set({ meta: { ...draft.meta, date: String(value) } }),
              "date",
            )}
            {input(
              "End date",
              draft.meta.endDate,
              (value) =>
                set({ meta: { ...draft.meta, endDate: String(value) } }),
              "date",
            )}
          </Row>
          <Row>
            {input(
              "Start time",
              draft.meta.time,
              (value) => set({ meta: { ...draft.meta, time: String(value) } }),
              "time",
            )}
            {input(
              "End time",
              draft.meta.endTime,
              (value) =>
                set({ meta: { ...draft.meta, endTime: String(value) } }),
              "time",
            )}
          </Row>
          {input("Location", draft.meta.location, (value) =>
            set({ meta: { ...draft.meta, location: String(value) } }),
          )}
          <Field label="Status">
            <select
              value={draft.meta.status}
              onChange={(event) =>
                set({
                  meta: { ...draft.meta, status: event.target.value as any },
                })
              }
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          <Field label="Terms">
            <textarea
              value={draft.meta.terms}
              onChange={(event) =>
                set({ meta: { ...draft.meta, terms: event.target.value } })
              }
            />
          </Field>
          <Field label="Notes">
            <textarea
              value={draft.meta.notes}
              onChange={(event) =>
                set({ meta: { ...draft.meta, notes: event.target.value } })
              }
            />
          </Field>
        </Section>

        <Section title="Tickets" right={dkk(totals.tickets.rev)}>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Sold" value={totals.tickets.sold} />
            <Stat label="Capacity" value={totals.tickets.cap} />
            <Stat label="Fill" value={`${Math.round(totals.tickets.fill)}%`} />
          </div>

          <div className="space-y-3">
            {draft.tickets.map((tier) => (
              <SubCard key={tier.id}>
                <Row>
                  {input("Name", tier.name, (value) =>
                    set({
                      tickets: draft.tickets.map((item) =>
                        item.id === tier.id
                          ? { ...item, name: String(value) }
                          : item,
                      ),
                    }),
                  )}
                  {input(
                    "Price",
                    tier.price,
                    (value) =>
                      set({
                        tickets: draft.tickets.map((item) =>
                          item.id === tier.id
                            ? { ...item, price: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                </Row>
                <Row>
                  {input(
                    "Sold",
                    tier.sold,
                    (value) =>
                      set({
                        tickets: draft.tickets.map((item) =>
                          item.id === tier.id
                            ? { ...item, sold: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                  {input(
                    "Capacity",
                    tier.capacity,
                    (value) =>
                      set({
                        tickets: draft.tickets.map((item) =>
                          item.id === tier.id
                            ? { ...item, capacity: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                </Row>
                {input("Notes", tier.notes, (value) =>
                  set({
                    tickets: draft.tickets.map((item) =>
                      item.id === tier.id
                        ? { ...item, notes: String(value) }
                        : item,
                    ),
                  }),
                )}
                <Button
                  kind="danger"
                  className="w-fit"
                  onClick={() =>
                    set({
                      tickets: draft.tickets.filter(
                        (item) => item.id !== tier.id,
                      ),
                    })
                  }
                >
                  Remove tier
                </Button>
              </SubCard>
            ))}
          </div>

          <Button
            kind="ghost"
            className="w-fit"
            onClick={() => set({ tickets: [...draft.tickets, ticket()] })}
          >
            Add ticket tier
          </Button>
        </Section>

        <Section title="Income and expenses">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Extra income" value={dkk(totals.extraIncome)} />
            <Stat label="Expenses" value={dkk(totals.expenses)} />
          </div>

          <div className="space-y-3">
            {draft.lines.map((moneyLine) => (
              <SubCard key={moneyLine.id}>
                <Row>
                  <Field label="Kind">
                    <select
                      value={moneyLine.kind}
                      onChange={(event) =>
                        set({
                          lines: draft.lines.map((item) =>
                            item.id === moneyLine.id
                              ? { ...item, kind: event.target.value as any }
                              : item,
                          ),
                        })
                      }
                    >
                      <option>income</option>
                      <option>expense</option>
                    </select>
                  </Field>
                  {input("Name", moneyLine.name, (value) =>
                    set({
                      lines: draft.lines.map((item) =>
                        item.id === moneyLine.id
                          ? { ...item, name: String(value) }
                          : item,
                      ),
                    }),
                  )}
                </Row>
                <Row>
                  {input(
                    "Amount",
                    moneyLine.amount,
                    (value) =>
                      set({
                        lines: draft.lines.map((item) =>
                          item.id === moneyLine.id
                            ? { ...item, amount: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                  {input(
                    "Quantity",
                    moneyLine.quantity,
                    (value) =>
                      set({
                        lines: draft.lines.map((item) =>
                          item.id === moneyLine.id
                            ? { ...item, quantity: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                </Row>
                <Field label="Mode">
                  <select
                    value={moneyLine.mode}
                    onChange={(event) =>
                      set({
                        lines: draft.lines.map((item) =>
                          item.id === moneyLine.id
                            ? { ...item, mode: event.target.value as any }
                            : item,
                        ),
                      })
                    }
                  >
                    {modes.map((mode) => (
                      <option key={mode}>{mode}</option>
                    ))}
                  </select>
                </Field>
                {input("Notes", moneyLine.notes, (value) =>
                  set({
                    lines: draft.lines.map((item) =>
                      item.id === moneyLine.id
                        ? { ...item, notes: String(value) }
                        : item,
                    ),
                  }),
                )}
                <Button
                  kind="danger"
                  className="w-fit"
                  onClick={() =>
                    set({
                      lines: draft.lines.filter(
                        (item) => item.id !== moneyLine.id,
                      ),
                    })
                  }
                >
                  Remove line
                </Button>
              </SubCard>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              kind="ghost"
              onClick={() => set({ lines: [...draft.lines, line("income")] })}
            >
              Add income
            </Button>
            <Button
              kind="ghost"
              onClick={() => set({ lines: [...draft.lines, line("expense")] })}
            >
              Add expense
            </Button>
          </div>
        </Section>

        <Section title="Staff costs" right={dkk(totals.staffCost)}>
          <div className="space-y-3">
            {draft.staff.map((member) => (
              <SubCard key={member.id}>
                <Row>
                  {input("Role", member.role, (value) =>
                    set({
                      staff: draft.staff.map((item) =>
                        item.id === member.id
                          ? { ...item, role: String(value) }
                          : item,
                      ),
                    }),
                  )}
                  {input(
                    "People",
                    member.people,
                    (value) =>
                      set({
                        staff: draft.staff.map((item) =>
                          item.id === member.id
                            ? { ...item, people: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                </Row>
                <Row>
                  {input(
                    "Hours",
                    member.hours,
                    (value) =>
                      set({
                        staff: draft.staff.map((item) =>
                          item.id === member.id
                            ? { ...item, hours: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                  {input(
                    "Hourly wage",
                    member.hourlyWage,
                    (value) =>
                      set({
                        staff: draft.staff.map((item) =>
                          item.id === member.id
                            ? { ...item, hourlyWage: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                </Row>
                {input(
                  "Extra %",
                  member.extraPercent,
                  (value) =>
                    set({
                      staff: draft.staff.map((item) =>
                        item.id === member.id
                          ? { ...item, extraPercent: num(String(value)) }
                          : item,
                      ),
                    }),
                  "number",
                )}
                {input("Notes", member.notes, (value) =>
                  set({
                    staff: draft.staff.map((item) =>
                      item.id === member.id
                        ? { ...item, notes: String(value) }
                        : item,
                    ),
                  }),
                )}
                <Button
                  kind="danger"
                  className="w-fit"
                  onClick={() =>
                    set({
                      staff: draft.staff.filter(
                        (item) => item.id !== member.id,
                      ),
                    })
                  }
                >
                  Remove staff
                </Button>
              </SubCard>
            ))}
          </div>

          <Button
            kind="ghost"
            className="w-fit"
            onClick={() => set({ staff: [...draft.staff, staff()] })}
          >
            Add staff line
          </Button>
        </Section>

        <Section title="Bar calculation" right={dkk(totals.bar.profit)}>
          <CheckboxRow
            label="Enable bar calculation"
            checked={draft.bar.enabled}
            onChange={(checked) =>
              set({ bar: { ...draft.bar, enabled: checked } })
            }
          />
          <CheckboxRow
            label="Use ticket guests"
            checked={draft.bar.useTicketGuests}
            onChange={(checked) =>
              set({ bar: { ...draft.bar, useTicketGuests: checked } })
            }
          />
          <Row>
            {input(
              "Custom guests",
              draft.bar.customGuests,
              (value) =>
                set({
                  bar: { ...draft.bar, customGuests: num(String(value)) },
                }),
              "number",
            )}
            {input(
              "Spend per guest",
              draft.bar.spendPerGuest,
              (value) =>
                set({
                  bar: { ...draft.bar, spendPerGuest: num(String(value)) },
                }),
              "number",
            )}
          </Row>
          {input(
            "Stock/cost %",
            draft.bar.costPercent,
            (value) =>
              set({ bar: { ...draft.bar, costPercent: num(String(value)) } }),
            "number",
          )}
          <div className="eos-bar-result-grid grid grid-cols-3 gap-2">
            <Stat
              label="Revenue"
              value={dkk(totals.bar.revenue)}
              className="eos-stat-compact"
            />
            <Stat
              label="Cost"
              value={dkk(totals.bar.stockCost)}
              className="eos-stat-compact"
            />
            <Stat
              label="Profit"
              value={dkk(totals.bar.profit)}
              className="eos-stat-compact"
            />
          </div>
          <Field label="Notes">
            <textarea
              value={draft.bar.notes}
              onChange={(event) =>
                set({ bar: { ...draft.bar, notes: event.target.value } })
              }
            />
          </Field>
        </Section>

        <Section title="Scenario planning">
          <div className="space-y-3">
            {draft.scenarios.map((scenario) => {
              const output = scenarioTotal(scenario, fixed);
              return (
                <SubCard key={scenario.id}>
                  <div className="eos-inline-input">
                    <input
                      value={scenario.name}
                      onChange={(event) =>
                        set({
                          scenarios: draft.scenarios.map((item) =>
                            item.id === scenario.id
                              ? { ...item, name: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <Badge tone={output.profit >= 0 ? "ok" : "bad"}>
                      {dkk(output.profit)}
                    </Badge>
                  </div>
                  <Row>
                    {input(
                      "Tickets sold",
                      scenario.ticketsSold,
                      (value) =>
                        set({
                          scenarios: draft.scenarios.map((item) =>
                            item.id === scenario.id
                              ? { ...item, ticketsSold: num(String(value)) }
                              : item,
                          ),
                        }),
                      "number",
                    )}
                    {input(
                      "Avg ticket",
                      scenario.averageTicketPrice,
                      (value) =>
                        set({
                          scenarios: draft.scenarios.map((item) =>
                            item.id === scenario.id
                              ? {
                                  ...item,
                                  averageTicketPrice: num(String(value)),
                                }
                              : item,
                          ),
                        }),
                      "number",
                    )}
                  </Row>
                  <Row>
                    {input(
                      "Bar spend",
                      scenario.barSpendPerGuest,
                      (value) =>
                        set({
                          scenarios: draft.scenarios.map((item) =>
                            item.id === scenario.id
                              ? {
                                  ...item,
                                  barSpendPerGuest: num(String(value)),
                                }
                              : item,
                          ),
                        }),
                      "number",
                    )}
                    {input(
                      "Extra expenses",
                      scenario.extraExpenses,
                      (value) =>
                        set({
                          scenarios: draft.scenarios.map((item) =>
                            item.id === scenario.id
                              ? { ...item, extraExpenses: num(String(value)) }
                              : item,
                          ),
                        }),
                      "number",
                    )}
                  </Row>
                </SubCard>
              );
            })}
          </div>
        </Section>

        <Section title="Venue terms / profit split">
          <CheckboxRow
            label="Enable venue terms"
            checked={draft.termsPlan.enabled}
            onChange={(checked) =>
              set({ termsPlan: { ...draft.termsPlan, enabled: checked } })
            }
          />
          <Row>
            {input(
              "Organizer ticket %",
              draft.termsPlan.organizerTicketShare,
              (value) =>
                set({
                  termsPlan: {
                    ...draft.termsPlan,
                    organizerTicketShare: num(String(value)),
                  },
                }),
              "number",
            )}
            {input(
              "Organizer bar %",
              draft.termsPlan.organizerBarProfitShare,
              (value) =>
                set({
                  termsPlan: {
                    ...draft.termsPlan,
                    organizerBarProfitShare: num(String(value)),
                  },
                }),
              "number",
            )}
          </Row>
          <Row>
            {input(
              "Flat venue hire",
              draft.termsPlan.flatVenueHire,
              (value) =>
                set({
                  termsPlan: {
                    ...draft.termsPlan,
                    flatVenueHire: num(String(value)),
                  },
                }),
              "number",
            )}
            {input(
              "Minimum guarantee",
              draft.termsPlan.minimumVenueGuarantee,
              (value) =>
                set({
                  termsPlan: {
                    ...draft.termsPlan,
                    minimumVenueGuarantee: num(String(value)),
                  },
                }),
              "number",
            )}
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Organizer" value={dkk(totals.organizer)} />
            <Stat label="Venue" value={dkk(totals.venue)} />
          </div>
          <Field label="Notes">
            <textarea
              value={draft.termsPlan.notes}
              onChange={(event) =>
                set({
                  termsPlan: { ...draft.termsPlan, notes: event.target.value },
                })
              }
            />
          </Field>
        </Section>

        <Section
          title="Artists"
          right={`${draft.artists.length} artist${draft.artists.length === 1 ? "" : "s"}`}
        >
          {draft.artists.length === 0 && (
            <p className="eos-body eos-muted">
              No artists linked yet. Add submissions from Artist Management.
            </p>
          )}

          <div className="space-y-3">
            {draft.artists.map((artist) => (
              <SubCard key={artist.id}>
                <Row>
                  {input("Artist", artist.artistName, (value) =>
                    set({
                      artists: draft.artists.map((item) =>
                        item.id === artist.id
                          ? { ...item, artistName: String(value) }
                          : item,
                      ),
                    }),
                  )}
                  {input(
                    "Fee",
                    artist.fee,
                    (value) =>
                      set({
                        artists: draft.artists.map((item) =>
                          item.id === artist.id
                            ? { ...item, fee: num(String(value)) }
                            : item,
                        ),
                      }),
                    "number",
                  )}
                </Row>
                <Row>
                  {input(
                    "Start",
                    artist.startTime,
                    (value) =>
                      set({
                        artists: draft.artists.map((item) =>
                          item.id === artist.id
                            ? { ...item, startTime: String(value) }
                            : item,
                        ),
                      }),
                    "time",
                  )}
                  {input(
                    "End",
                    artist.endTime,
                    (value) =>
                      set({
                        artists: draft.artists.map((item) =>
                          item.id === artist.id
                            ? { ...item, endTime: String(value) }
                            : item,
                        ),
                      }),
                    "time",
                  )}
                </Row>
                <Field label="Status">
                  <select
                    value={artist.status}
                    onChange={(event) =>
                      set({
                        artists: draft.artists.map((item) =>
                          item.id === artist.id
                            ? { ...item, status: event.target.value as any }
                            : item,
                        ),
                      })
                    }
                  >
                    {["proposed", "contacted", "confirmed", "cancelled"].map(
                      (status) => (
                        <option key={status}>{status}</option>
                      ),
                    )}
                  </select>
                </Field>
                <Button
                  kind="danger"
                  className="w-fit"
                  onClick={() =>
                    set({
                      artists: draft.artists.filter(
                        (item) => item.id !== artist.id,
                      ),
                    })
                  }
                >
                  Remove artist
                </Button>
              </SubCard>
            ))}
          </div>
        </Section>

        <Section title="Files">
          <label className="block cursor-pointer rounded-2xl border border-dashed eos-border eos-panel p-4 text-center eos-body eos-muted">
            <span>Add event files</span>
            <input
              className="sr-only"
              type="file"
              multiple
              onChange={async (event) => {
                const files = Array.from(event.target.files || []);
                const next: EventFile[] = [];
                for (const file of files) {
                  next.push({
                    id: id(),
                    name: file.name,
                    originalName: file.name,
                    mimeType: file.type,
                    size: file.size,
                    dataUrl: await fileToDataUrl(file),
                    uploadedAt: new Date().toISOString(),
                  });
                }
                set({ files: [...draft.files, ...next] });
                event.currentTarget.value = "";
              }}
            />
          </label>

          <div className="space-y-3">
            {draft.files.map((file) => (
              <SubCard key={file.id}>
                <div>
                  <input
                    value={file.name}
                    onChange={(event) =>
                      set({
                        files: draft.files.map((item) =>
                          item.id === file.id
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <p className="mt-1 eos-caption eos-muted">
                    {Math.round(file.size / 1024)} KB
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a download={file.originalName} href={file.dataUrl}>
                    <Button kind="ghost">Download</Button>
                  </a>
                  <Button
                    kind="danger"
                    onClick={() =>
                      set({
                        files: draft.files.filter(
                          (item) => item.id !== file.id,
                        ),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </SubCard>
            ))}
          </div>
        </Section>

        <Section title="CSV import" right={<Badge>Events</Badge>}>
          <p className="eos-body eos-muted">
            Import one or more events from CSV. Use repeated rows with the same
            event_key to attach tickets, staff lines, money lines, scenarios and
            artists to the same event.
          </p>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <Button
              kind="ghost"
              onClick={() =>
                downloadTextFile(
                  "eventos-event-import-template.csv",
                  eventCsvTemplate,
                )
              }
            >
              Download CSV template
            </Button>
            <label className="eos-button eos-surface focus-ring flex cursor-pointer items-center justify-center rounded-[22px] border px-4 py-3 text-center">
              Import CSV
              <input
                className="sr-only"
                type="file"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) await importEventsCsv(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          {csvResult && <p className="eos-body eos-muted">{csvResult}</p>}
        </Section>

        <Section title="Summary / export">
          <textarea readOnly value={summaryText} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              kind="ghost"
              onClick={() => navigator.clipboard.writeText(summaryText)}
            >
              Copy text
            </Button>
            <Button
              kind="ghost"
              onClick={() => {
                const csv = `name,date,location,profit,revenue,costs\n${draft.meta.name},${draft.meta.date},${draft.meta.location},${totals.profit},${totals.totalIncome},${totals.totalCosts}`;
                const anchor = document.createElement("a");
                const url = URL.createObjectURL(
                  new Blob([csv], { type: "text/csv" }),
                );
                anchor.href = url;
                anchor.download = `${draft.meta.name || "event"}-summary.csv`;
                anchor.click();
                URL.revokeObjectURL(url);
              }}
            >
              CSV
            </Button>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

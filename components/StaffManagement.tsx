"use client";

import { useState } from "react";
import { blankStaffMember } from "@/lib/defaults";
import { publicVolunteerFormLink } from "@/lib/utils";
import { Project, StaffMember, StaffStatus } from "@/lib/types";
import { useEventStore } from "./EventStore";
import {
  AppShell,
  Badge,
  Button,
  Card,
  Field,
  Row,
  Section,
  Stat,
} from "./ui/AppShell";

const STATUSES = [
  "all",
  "new",
  "available",
  "assigned",
  "inactive",
  "archived",
] as const;
const STAFF_STATUSES: StaffStatus[] = [
  "new",
  "available",
  "assigned",
  "inactive",
  "archived",
];

function eventLabel(
  events: ReturnType<typeof useEventStore>["events"],
  eventId: string,
) {
  const event = events.find((item) => item.id === eventId);
  if (!event) return "Unknown event";
  return [
    event.meta.name || "Untitled event",
    event.meta.date || "No date",
  ].join(" · ");
}

function projectLabel(projects: Project[], projectId: string) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return "Unknown project";
  return project.title || "Untitled project";
}

function staffStatusTone(status: StaffStatus) {
  if (status === "assigned" || status === "available") return "ok";
  if (status === "inactive" || status === "archived") return "bad";
  return "neutral";
}

export default function StaffManagement() {
  const {
    events,
    projects,
    staffMembers,
    saveStaffMember,
    createStaffMember,
    deleteStaffMember,
  } = useEventStore();
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all");
  const [drafts, setDrafts] = useState<Record<string, StaffMember>>({});

  const list = staffMembers.filter(
    (staff) => filter === "all" || staff.status === filter,
  );
  const active = staffMembers.filter(
    (staff) => staff.status !== "archived",
  ).length;
  const assigned = staffMembers.filter(
    (staff) =>
      (staff.linked_event_ids?.length || staff.linked_project_ids?.length) &&
      staff.status !== "archived",
  ).length;
  const unassigned = staffMembers.filter(
    (staff) =>
      !(staff.linked_event_ids?.length || staff.linked_project_ids?.length) &&
      staff.status !== "archived",
  ).length;

  const getDraft = (staff: StaffMember) => drafts[staff.id] || staff;
  const updateDraft = (staff: StaffMember, patch: Partial<StaffMember>) => {
    setDrafts((current) => ({
      ...current,
      [staff.id]: {
        ...getDraft(staff),
        ...patch,
      },
    }));
  };

  const saveDraft = async (staff: StaffMember) => {
    await saveStaffMember(staff);
    setDrafts((current) => {
      const next = { ...current };
      delete next[staff.id];
      return next;
    });
  };

  const addManualStaff = async () => {
    await createStaffMember({
      ...blankStaffMember(),
      name: "New volunteer",
      status: "available",
    });
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eos-caption eos-muted">People management</p>
              <h2 className="eos-heading mt-2">Staff / volunteers</h2>
            </div>
            <Badge>{active}</Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Total" value={active} />
            <Stat label="Assigned" value={assigned} />
            <Stat label="Open" value={unassigned} />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`pill whitespace-nowrap border px-3 py-2 eos-body ${filter === status ? "eos-primary" : "eos-border eos-panel eos-muted"}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={addManualStaff}>Add staff</Button>
            <Button
              kind="ghost"
              onClick={() =>
                navigator.clipboard.writeText(publicVolunteerFormLink())
              }
            >
              Copy volunteer link
            </Button>
          </div>
        </Card>

        {list.length === 0 && (
          <Card>
            <p className="eos-body eos-muted">
              No staff or volunteers in this view.
            </p>
          </Card>
        )}

        {list.map((staff) => {
          const draft = getDraft(staff);
          const linkedEventIds = draft.linked_event_ids || [];
          const linkedProjectIds = draft.linked_project_ids || [];

          return (
            <Section
              key={staff.id}
              title={draft.name || "Unnamed volunteer"}
              right={
                <Badge tone={staffStatusTone(draft.status)}>
                  {draft.status}
                </Badge>
              }
            >
              <Card className="eos-panel">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="eos-title break-words">
                      {draft.name || "Unnamed volunteer"}
                    </h3>
                    <p className="eos-body eos-muted mt-1">
                      {draft.position || "No position"} ·{" "}
                      {linkedEventIds.length + linkedProjectIds.length}{" "}
                      assignment
                      {linkedEventIds.length + linkedProjectIds.length === 1
                        ? ""
                        : "s"}
                    </p>
                    <p className="eos-caption eos-muted mt-2 break-words">
                      {draft.email || "No email"} {draft.phone || ""}
                    </p>
                  </div>
                  <Badge tone={staffStatusTone(draft.status)}>
                    {draft.status}
                  </Badge>
                </div>
              </Card>

              <Card className="eos-panel artist-linked-events-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eos-caption eos-muted">Assignments</p>
                    <p className="mt-1 eos-body">
                      {linkedEventIds.length} event
                      {linkedEventIds.length === 1 ? "" : "s"} ·{" "}
                      {linkedProjectIds.length} project
                      {linkedProjectIds.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge>
                    {linkedEventIds.length + linkedProjectIds.length}
                  </Badge>
                </div>

                <Row>
                  <Field label="Assign to event">
                    <select
                      value=""
                      onChange={(event) => {
                        const eventId = event.target.value;
                        if (!eventId) return;
                        updateDraft(staff, {
                          status: "assigned",
                          linked_event_ids: Array.from(
                            new Set([...linkedEventIds, eventId]),
                          ),
                        });
                      }}
                    >
                      <option value="">Choose event</option>
                      {events
                        .filter((event) => !linkedEventIds.includes(event.id))
                        .map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.meta.name || "Untitled event"} ·{" "}
                            {event.meta.date || "No date"}
                          </option>
                        ))}
                    </select>
                  </Field>

                  <Field label="Assign to project">
                    <select
                      value=""
                      onChange={(event) => {
                        const projectId = event.target.value;
                        if (!projectId) return;
                        updateDraft(staff, {
                          status: "assigned",
                          linked_project_ids: Array.from(
                            new Set([...linkedProjectIds, projectId]),
                          ),
                        });
                      }}
                    >
                      <option value="">Choose project</option>
                      {projects
                        .filter(
                          (project) => !linkedProjectIds.includes(project.id),
                        )
                        .map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.title || "Untitled project"}
                          </option>
                        ))}
                    </select>
                  </Field>
                </Row>

                <div className="flex flex-wrap gap-2">
                  {linkedEventIds.map((eventId) => (
                    <button
                      key={eventId}
                      type="button"
                      className="artist-linked-event-chip pill border eos-border eos-surface px-3 py-2 text-left eos-body"
                      onClick={() =>
                        updateDraft(staff, {
                          linked_event_ids: linkedEventIds.filter(
                            (id) => id !== eventId,
                          ),
                        })
                      }
                    >
                      Event: {eventLabel(events, eventId)} ×
                    </button>
                  ))}
                  {linkedProjectIds.map((projectId) => (
                    <button
                      key={projectId}
                      type="button"
                      className="artist-linked-event-chip pill border eos-border eos-surface px-3 py-2 text-left eos-body"
                      onClick={() =>
                        updateDraft(staff, {
                          linked_project_ids: linkedProjectIds.filter(
                            (id) => id !== projectId,
                          ),
                        })
                      }
                    >
                      Project: {projectLabel(projects, projectId)} ×
                    </button>
                  ))}
                </div>
              </Card>

              <Row>
                <Field label="Name">
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      updateDraft(staff, { name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Position">
                  <input
                    value={draft.position}
                    onChange={(event) =>
                      updateDraft(staff, { position: event.target.value })
                    }
                    placeholder="Bar, door, stage, runner..."
                  />
                </Field>
              </Row>

              <Row>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(event) =>
                      updateDraft(staff, { phone: event.target.value })
                    }
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(event) =>
                      updateDraft(staff, { email: event.target.value })
                    }
                  />
                </Field>
              </Row>

              <Row>
                <Field label="Availability">
                  <input
                    value={draft.availability}
                    onChange={(event) =>
                      updateDraft(staff, { availability: event.target.value })
                    }
                    placeholder="Weekends, evenings, specific dates..."
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft(staff, {
                        status: event.target.value as StaffStatus,
                      })
                    }
                  >
                    {STAFF_STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </Field>
              </Row>

              <Field label="Description">
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft(staff, { description: event.target.value })
                  }
                  placeholder="Skills, preferred work, experience, restrictions..."
                />
              </Field>

              <Field label="Internal notes">
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    updateDraft(staff, { notes: event.target.value })
                  }
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => saveDraft(draft)}>Save staff</Button>
                <Button
                  kind="danger"
                  onClick={() => saveDraft({ ...draft, status: "archived" })}
                >
                  Archive
                </Button>
                <Button
                  kind="danger"
                  onClick={() => deleteStaffMember(draft.id)}
                >
                  Delete
                </Button>
              </div>
            </Section>
          );
        })}
      </div>
    </AppShell>
  );
}

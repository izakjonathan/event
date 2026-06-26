"use client";

import { type FormEvent, useState } from "react";
import { blankStaffMember, id } from "@/lib/defaults";
import { useEventStore } from "./EventStore";
import { Button, Card, Field, PublicShell, Row } from "./ui/AppShell";

export default function VolunteerSignupForm() {
  const { createStaffMember } = useEventStore();
  const [form, setForm] = useState(blankStaffMember());
  const [message, setMessage] = useState("");

  const setValue = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();

    try {
      await createStaffMember({
        ...blankStaffMember(),
        ...form,
        id: id(),
        status: "new",
        linked_event_ids: [],
        linked_project_ids: [],
      });
      setForm(blankStaffMember());
      setMessage("Volunteer details received. Thank you.");
    } catch (error: any) {
      setMessage(`Submission failed: ${error?.message || "Unknown error"}`);
    }
  }

  return (
    <PublicShell>
      <form onSubmit={submit} className="space-y-5">
        <Card>
          <p className="eos-body eos-muted">Public volunteer form</p>
          <h2 className="eos-heading mt-2">Volunteer signup</h2>
          <p className="mt-3 eos-body eos-muted">
            Send your contact details so the team can assign you to events or
            projects.
          </p>
          {message && (
            <p className="mt-4 rounded-2xl border eos-border eos-panel p-3 eos-body">
              {message}
            </p>
          )}
        </Card>

        <Card className="space-y-3">
          <Field label="Name">
            <input
              required
              value={form.name}
              onChange={(event) => setValue("name", event.target.value)}
            />
          </Field>
          <Row>
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setValue("phone", event.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setValue("email", event.target.value)}
              />
            </Field>
          </Row>
          <Button type="submit" className="w-full">
            Submit volunteer details
          </Button>
        </Card>
      </form>
    </PublicShell>
  );
}

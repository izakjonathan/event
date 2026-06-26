export type EventStatus =
  | "idea"
  | "quoted"
  | "confirmed"
  | "cancelled"
  | "completed";
export type LineKind = "income" | "expense";
export type LineMode = "fixed" | "perTicketHolder" | "percentageOfTickets";
export type ArtistSubmissionStatus =
  | "new"
  | "interested"
  | "contacted"
  | "booked"
  | "rejected"
  | "archived";
export type StaffStatus =
  | "new"
  | "available"
  | "assigned"
  | "inactive"
  | "archived";
export type EventArtistStatus =
  | "proposed"
  | "contacted"
  | "confirmed"
  | "cancelled";
export type ProductCategory =
  | "Beer"
  | "Wine"
  | "Cocktail"
  | "Shot"
  | "Soft drink"
  | "Coffee"
  | "Other";
export type ProjectStatus =
  | "idea"
  | "planning"
  | "in-progress"
  | "waiting"
  | "done"
  | "cancelled";
export type TaskStatus = "pending" | "doing" | "done" | "archived";
export type Priority = "low" | "medium" | "high" | "urgent";

export type EventMeta = {
  name: string;
  date: string;
  endDate: string;
  location: string;
  time: string;
  endTime: string;
  terms: string;
  notes: string;
  status: EventStatus;
};

export type EventReviewMetrics = {
  eventType: string;
  label: string;
  expectedGuests: number;
  actualGuests: number;
  plannedStaff: number;
  actualStaff: number;
  totalStaffHours: number;
  supplierCost: number;
  equipmentCost: number;
  otherCost: number;
  barRevenue: number;
  ticketRevenue: number;
  otherRevenue: number;
  reviewNotes: string;
};

export type TicketTier = {
  id: string;
  name: string;
  price: number;
  sold: number;
  capacity: number;
  notes: string;
};

export type MoneyLine = {
  id: string;
  kind: LineKind;
  name: string;
  amount: number;
  quantity: number;
  mode: LineMode;
  notes: string;
};

export type StaffLine = {
  id: string;
  role: string;
  people: number;
  hours: number;
  hourlyWage: number;
  extraPercent: number;
  notes: string;
};

export type BarPlan = {
  enabled: boolean;
  useTicketGuests: boolean;
  customGuests: number;
  spendPerGuest: number;
  costPercent: number;
  notes: string;
};

export type Scenario = {
  id: string;
  name: string;
  ticketsSold: number;
  averageTicketPrice: number;
  barSpendPerGuest: number;
  extraExpenses: number;
  notes: string;
};

export type TermsPlan = {
  enabled: boolean;
  organizerTicketShare: number;
  organizerBarProfitShare: number;
  flatVenueHire: number;
  minimumVenueGuarantee: number;
  notes: string;
};

export type EventFile = {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

export type EventArtist = {
  id: string;
  sourceSubmissionId?: string;
  artistName: string;
  contactName: string;
  email: string;
  phone: string;
  genre: string;
  imageUrl: string;
  fee: number;
  startTime: string;
  endTime: string;
  status: EventArtistStatus;
  notes: string;
};

export type BarProduct = {
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

export type BarStaffLine = {
  id: string;
  role: string;
  staffCount: number;
  startTime: string;
  endTime: string;
  hourlyWage: number;
};

export type BarPlannerPayload = {
  products: BarProduct[];
  staff: BarStaffLine[];
  notes: string;
};

export type PlannerEvent = {
  id: string;
  meta: EventMeta;
  tickets: TicketTier[];
  lines: MoneyLine[];
  staff: StaffLine[];
  bar: BarPlan;
  review: EventReviewMetrics;
  scenarios: Scenario[];
  termsPlan: TermsPlan;
  files: EventFile[];
  artists: EventArtist[];
  barPlanner?: BarPlannerPayload;
  updatedAt: string;
};

export type ArtistLinks = {
  instagram?: string;
  spotify?: string;
  soundcloud?: string;
  youtube?: string;
  website?: string;
};

export type ArtistSubmission = {
  id: string;
  artist_name: string;
  contact_name: string;
  email: string;
  phone: string;
  genre: string;
  description: string;
  image_url: string;
  availability: string;
  availability_start_time: string;
  availability_end_time: string;
  preferred_fee: number;
  technical_needs: string;
  hospitality_needs: string;
  notes: string;
  links: ArtistLinks;
  status: ArtistSubmissionStatus;
  updated_at: string;
  created_at: string;
};

export type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  priority: Priority;
  owner: string;
  due_date: string | null;
  linked_event_id: string | null;
  description: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  project_id: string | null;
  title: string;
  status: TaskStatus;
  priority: Priority;
  owner: string;
  due_date: string | null;
  linked_event_id: string | null;
  notes: string;
  checklist: string[];
  image_urls: string[];
  created_at: string;
  updated_at: string;
};

export type StaffMember = {
  id: string;
  owner_key: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  description: string;
  availability: string;
  status: StaffStatus;
  linked_event_ids: string[];
  linked_project_ids: string[];
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
  id: string;
  owner_key: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  webpage: string;
  type: string;
  label: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type Alert = {
  type: "ok" | "warn" | "bad";
  text: string;
};

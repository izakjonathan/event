# Event Operations System v37 + v38

Built from confirmed working v36.

v37 Bar Planner foundation:
- Added new Bar Planner module at `/bar-planner`.
- Added Bar Planner card to the dashboard.
- Connects bar plans to existing Event Planner events through Supabase `event_plans.payload.barPlanner`.
- Added event selector.
- Added product library per event.
- Product fields:
  - product name
  - category
  - supplier
  - unit type
  - unit size
  - buy price
  - sell price
  - expected quantity
- Added live calculations:
  - revenue
  - stock cost
  - gross profit
  - margin %
  - total quantity
- Added staffing plan:
  - role
  - staff count
  - start time
  - end time
  - hourly wage
  - wage cost
- Added bar summary:
  - revenue
  - stock cost
  - gross profit
  - margin
  - staff cost
  - profit after staff
- Added warnings for missing product prices, quantities, staff times and low/negative margin.

v38 Menu Builder:
- Added menu visibility toggle per product.
- Added menu descriptions per product.
- Added live menu preview grouped by category.
- Added copy menu button.
- Added bar notes field.
- Build passed.

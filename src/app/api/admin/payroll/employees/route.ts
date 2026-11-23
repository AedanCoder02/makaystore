import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return (user?.publicMetadata?.role as string) === 'admin';
}

export async function ensurePayrollTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS payroll_employees (
      id               SERIAL PRIMARY KEY,
      full_name        TEXT NOT NULL,
      department       TEXT NOT NULL,
      position         TEXT DEFAULT '',
      email            TEXT DEFAULT '',
      phone            TEXT DEFAULT '',
      start_date       DATE,
      weekly_wage      NUMERIC(10,2) NOT NULL DEFAULT 0,
      commission_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
      commission_fixed NUMERIC(10,2) NOT NULL DEFAULT 0,
      linked_seller_id TEXT DEFAULT '',
      status           TEXT NOT NULL DEFAULT 'active',
      notes            TEXT DEFAULT '',
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS payroll_runs (
      id            SERIAL PRIMARY KEY,
      period_start  DATE NOT NULL,
      period_end    DATE NOT NULL,
      status        TEXT NOT NULL DEFAULT 'draft',
      total_amount  NUMERIC(12,2) DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      finalized_at  TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS payroll_run_items (
      id              SERIAL PRIMARY KEY,
      run_id          INT REFERENCES payroll_runs(id) ON DELETE CASCADE,
      employee_id     INT,
      employee_name   TEXT,
      department      TEXT,
      base_pay        NUMERIC(10,2) DEFAULT 0,
      commission_pay  NUMERIC(10,2) DEFAULT 0,
      deductions      NUMERIC(10,2) DEFAULT 0,
      total_pay       NUMERIC(10,2) DEFAULT 0
    )
  `;
}

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ensurePayrollTables();
  const rows = await sql`SELECT * FROM payroll_employees ORDER BY status ASC, full_name ASC`;
  return NextResponse.json(rows);
}

interface EmployeeBody {
  full_name: string;
  department: string;
  position?: string;
  email?: string;
  phone?: string;
  start_date?: string | null;
  weekly_wage: number;
  commission_pct?: number;
  commission_fixed?: number;
  linked_seller_id?: string;
  status?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ensurePayrollTables();

  const body = await req.json() as EmployeeBody;
  if (!body.full_name?.trim() || !body.department?.trim()) {
    return NextResponse.json({ error: 'full_name y department son requeridos' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO payroll_employees (
      full_name, department, position, email, phone, start_date,
      weekly_wage, commission_pct, commission_fixed, linked_seller_id, status, notes
    )
    VALUES (
      ${body.full_name}, ${body.department}, ${body.position ?? ''}, ${body.email ?? ''}, ${body.phone ?? ''},
      ${body.start_date || null},
      ${body.weekly_wage ?? 0}, ${body.commission_pct ?? 0}, ${body.commission_fixed ?? 0},
      ${body.linked_seller_id ?? ''}, ${body.status ?? 'active'}, ${body.notes ?? ''}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}

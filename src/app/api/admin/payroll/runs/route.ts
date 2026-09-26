import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensurePayrollTables } from '../employees/route';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return (user?.publicMetadata?.role as string) === 'admin';
}

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ensurePayrollTables();

  const runs = await sql`SELECT * FROM payroll_runs ORDER BY period_start DESC, id DESC LIMIT 50`;
  const items = await sql`SELECT * FROM payroll_run_items ORDER BY employee_name ASC LIMIT 5000`.catch(() => []);

  const runsWithItems = runs.map((r: any) => ({
    ...r,
    items: (items as any[]).filter(i => i.run_id === r.id),
  }));

  return NextResponse.json(runsWithItems);
}

interface RunBody { period_start: string; period_end: string }

export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ensurePayrollTables();

  const { period_start, period_end } = await req.json() as RunBody;
  if (!period_start || !period_end) {
    return NextResponse.json({ error: 'period_start y period_end son requeridos' }, { status: 400 });
  }

  const employees = await sql`SELECT * FROM payroll_employees WHERE status = 'active'`;

  const periodDays = Math.max(1, Math.round(
    (new Date(period_end + 'T00:00:00').getTime() - new Date(period_start + 'T00:00:00').getTime()) / 86400000
  ) + 1);

  // Commission from real sales for employees linked to a seller account
  const salesRows = await sql`
    SELECT seller_id, COALESCE(SUM(subtotal::numeric), 0) AS revenue
    FROM seller_orders
    WHERE created_at >= ${period_start} AND created_at < (${period_end}::date + INTERVAL '1 day')
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY seller_id
  `.catch(() => []);
  const salesMap = new Map((salesRows as any[]).map(r => [r.seller_id, Number(r.revenue)]));

  const [run] = await sql`
    INSERT INTO payroll_runs (period_start, period_end, status)
    VALUES (${period_start}, ${period_end}, 'draft')
    RETURNING *
  `;

  let totalAmount = 0;
  for (const emp of employees as any[]) {
    const basePay = Number(emp.weekly_wage) * (periodDays / 7);
    const linkedSales = emp.linked_seller_id ? (salesMap.get(emp.linked_seller_id) ?? 0) : 0;
    const commissionFromSales = linkedSales * (Number(emp.commission_pct) / 100);
    const commissionPay = commissionFromSales + Number(emp.commission_fixed);
    const totalPay = basePay + commissionPay;
    totalAmount += totalPay;

    await sql`
      INSERT INTO payroll_run_items (run_id, employee_id, employee_name, department, base_pay, commission_pay, deductions, total_pay)
      VALUES (${run.id}, ${emp.id}, ${emp.full_name}, ${emp.department}, ${basePay.toFixed(2)}, ${commissionPay.toFixed(2)}, 0, ${totalPay.toFixed(2)})
    `;
  }

  await sql`UPDATE payroll_runs SET total_amount = ${totalAmount.toFixed(2)} WHERE id = ${run.id}`;

  const items = await sql`SELECT * FROM payroll_run_items WHERE run_id = ${run.id} ORDER BY employee_name ASC`;
  return NextResponse.json({ ...run, total_amount: totalAmount, items }, { status: 201 });
}

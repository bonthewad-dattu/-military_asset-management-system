import { Router } from "express";
import pool from "../config/db.js";
import { allowRoles, baseScope } from "../middleware/auth.js";

const router = Router();
const writeRoles = ["ADMIN", "LOGISTICS_OFFICER"];

async function addAudit(client, userId, action, details) {
  await client.query(
    "INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)",
    [userId, action, details],
  );
}

router.get("/bases", async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, location FROM bases ORDER BY name",
  );
  res.json(result.rows);
});

router.get("/equipment", async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, category FROM equipment_types ORDER BY name",
  );
  res.json(result.rows);
});

router.get("/dashboard", async (req, res) => {
  try {
    const { equipmentTypeId, startDate, endDate } = req.query;
    const scope = baseScope(req);
    const values = [
      scope,
      equipmentTypeId || null,
      startDate || null,
      endDate || null,
    ];
    const sql = `
      WITH movements AS (
        SELECT p.base_id, p.equipment_type_id, p.quantity, p.created_at, 'PURCHASE' AS kind FROM purchases p
        UNION ALL
        SELECT t.destination_base_id, t.equipment_type_id, t.quantity, t.created_at, 'TRANSFER_IN' FROM transfers t WHERE t.status = 'COMPLETED'
        UNION ALL
        SELECT t.source_base_id, t.equipment_type_id, -t.quantity, t.created_at, 'TRANSFER_OUT' FROM transfers t WHERE t.status = 'COMPLETED'
        UNION ALL
        SELECT a.base_id, a.equipment_type_id, -a.quantity, a.created_at, 'ASSIGNMENT' FROM assignments a
        UNION ALL
        SELECT e.base_id, e.equipment_type_id, -e.quantity, e.created_at, 'EXPENDITURE' FROM expenditures e
      )
      SELECT
        COALESCE(SUM(quantity) FILTER (WHERE created_at < COALESCE($3::date, CURRENT_DATE)), 0)::int AS opening_balance,
        COALESCE(SUM(quantity) FILTER (WHERE created_at >= COALESCE($3::date, '-infinity'::date) AND created_at < COALESCE($4::date + INTERVAL '1 day', 'infinity'::date) AND kind IN ('PURCHASE','TRANSFER_IN','TRANSFER_OUT')), 0)::int AS net_movement,
        COALESCE(SUM(-quantity) FILTER (WHERE created_at >= COALESCE($3::date, '-infinity'::date) AND created_at < COALESCE($4::date + INTERVAL '1 day', 'infinity'::date) AND kind = 'EXPENDITURE'), 0)::int AS expended,
        COALESCE(SUM(quantity) FILTER (WHERE created_at < COALESCE($4::date + INTERVAL '1 day', 'infinity'::date)), 0)::int AS closing_balance
      FROM movements
      WHERE ($1::int IS NULL OR base_id = $1) AND ($2::int IS NULL OR equipment_type_id = $2)`;
    const result = await pool.query(sql, values);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Could not load dashboard metrics." });
  }
});

router.get("/purchases", async (req, res) => {
  const scope = baseScope(req);
  const result = await pool.query(
    `SELECT p.*, b.name AS base_name, e.name AS equipment_name FROM purchases p JOIN bases b ON b.id=p.base_id JOIN equipment_types e ON e.id=p.equipment_type_id WHERE ($1::int IS NULL OR p.base_id=$1) ORDER BY p.created_at DESC`,
    [scope],
  );
  res.json(result.rows);
});

router.post("/purchases", allowRoles(...writeRoles), async (req, res) => {
  const { baseId, equipmentTypeId, quantity, notes } = req.body;
  const targetBase =
    req.user.role === "LOGISTICS_OFFICER" && req.user.baseId
      ? req.user.baseId
      : baseId;
  if (
    !targetBase ||
    !equipmentTypeId ||
    !Number.isInteger(Number(quantity)) ||
    Number(quantity) <= 0
  )
    return res
      .status(400)
      .json({
        message:
          "Select a base and equipment, and enter a positive whole quantity.",
      });
  if (
    req.user.role !== "ADMIN" &&
    Number(targetBase) !== Number(req.user.baseId)
  )
    return res
      .status(403)
      .json({
        message: "You can only record activity for your assigned base.",
      });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const saved = await client.query(
      "INSERT INTO purchases (base_id,equipment_type_id,quantity,notes,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [targetBase, equipmentTypeId, quantity, notes || "", req.user.id],
    );
    await addAudit(
      client,
      req.user.id,
      "PURCHASE",
      `Added ${quantity} units to base ${targetBase}.`,
    );
    await client.query("COMMIT");
    res.status(201).json(saved.rows[0]);
  } catch {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Purchase could not be saved." });
  } finally {
    client.release();
  }
});

router.get("/transfers", async (req, res) => {
  const scope = baseScope(req);
  const result = await pool.query(
    `SELECT t.*, s.name AS source_name, d.name AS destination_name, e.name AS equipment_name FROM transfers t JOIN bases s ON s.id=t.source_base_id JOIN bases d ON d.id=t.destination_base_id JOIN equipment_types e ON e.id=t.equipment_type_id WHERE ($1::int IS NULL OR t.source_base_id=$1 OR t.destination_base_id=$1) ORDER BY t.created_at DESC`,
    [scope],
  );
  res.json(result.rows);
});

router.post("/transfers", allowRoles(...writeRoles), async (req, res) => {
  const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity } =
    req.body;
  if (
    !sourceBaseId ||
    !destinationBaseId ||
    Number(sourceBaseId) === Number(destinationBaseId) ||
    !equipmentTypeId ||
    !Number.isInteger(Number(quantity)) ||
    Number(quantity) <= 0
  )
    return res
      .status(400)
      .json({
        message:
          "Enter different source and destination bases, equipment and a positive whole quantity.",
      });
  if (
    req.user.role !== "ADMIN" &&
    Number(sourceBaseId) !== Number(req.user.baseId)
  )
    return res
      .status(403)
      .json({
        message: "You can only transfer stock from your assigned base.",
      });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const stock = await client.query(
      `SELECT COALESCE(SUM(qty),0)::int AS balance FROM (
      SELECT quantity AS qty FROM purchases WHERE base_id=$1 AND equipment_type_id=$2
      UNION ALL SELECT quantity FROM transfers WHERE destination_base_id=$1 AND equipment_type_id=$2 AND status='COMPLETED'
      UNION ALL SELECT -quantity FROM transfers WHERE source_base_id=$1 AND equipment_type_id=$2 AND status='COMPLETED'
      UNION ALL SELECT -quantity FROM assignments WHERE base_id=$1 AND equipment_type_id=$2
      UNION ALL SELECT -quantity FROM expenditures WHERE base_id=$1 AND equipment_type_id=$2
    ) stock_rows`,
      [sourceBaseId, equipmentTypeId],
    );
    if (stock.rows[0].balance < Number(quantity)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({
          message: `Not enough stock. Available: ${stock.rows[0].balance}`,
        });
    }
    const saved = await client.query(
      "INSERT INTO transfers (source_base_id,destination_base_id,equipment_type_id,quantity,status,created_by) VALUES ($1,$2,$3,$4,'COMPLETED',$5) RETURNING *",
      [sourceBaseId, destinationBaseId, equipmentTypeId, quantity, req.user.id],
    );
    await addAudit(
      client,
      req.user.id,
      "TRANSFER",
      `Moved ${quantity} units from base ${sourceBaseId} to base ${destinationBaseId}.`,
    );
    await client.query("COMMIT");
    res.status(201).json(saved.rows[0]);
  } catch {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Transfer failed. No stock was moved." });
  } finally {
    client.release();
  }
});

router.get("/assignments", async (req, res) => {
  const result = await pool.query(
    "SELECT a.*, b.name AS base_name, e.name AS equipment_name FROM assignments a JOIN bases b ON b.id=a.base_id JOIN equipment_types e ON e.id=a.equipment_type_id WHERE ($1::int IS NULL OR a.base_id=$1) ORDER BY a.created_at DESC",
    [baseScope(req)],
  );
  res.json(result.rows);
});
router.post("/assignments", allowRoles(...writeRoles), async (req, res) =>
  saveStockUse(req, res, "assignments", "ASSIGNMENT"),
);
router.get("/expenditures", async (req, res) => {
  const result = await pool.query(
    "SELECT x.*, b.name AS base_name, e.name AS equipment_name FROM expenditures x JOIN bases b ON b.id=x.base_id JOIN equipment_types e ON e.id=x.equipment_type_id WHERE ($1::int IS NULL OR x.base_id=$1) ORDER BY x.created_at DESC",
    [baseScope(req)],
  );
  res.json(result.rows);
});
router.post("/expenditures", allowRoles(...writeRoles), async (req, res) =>
  saveStockUse(req, res, "expenditures", "EXPENDITURE"),
);

async function saveStockUse(req, res, table, action) {
  const { baseId, equipmentTypeId, quantity, notes, assignedTo } = req.body;
  const targetBase =
    req.user.role === "LOGISTICS_OFFICER" && req.user.baseId
      ? req.user.baseId
      : baseId;
  if (
    !targetBase ||
    !equipmentTypeId ||
    !Number.isInteger(Number(quantity)) ||
    Number(quantity) <= 0
  )
    return res
      .status(400)
      .json({
        message:
          "Select a base and equipment, and enter a positive whole quantity.",
      });
  if (
    req.user.role !== "ADMIN" &&
    Number(targetBase) !== Number(req.user.baseId)
  )
    return res
      .status(403)
      .json({ message: "You can only update your assigned base." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const stock = await client.query(
      `SELECT COALESCE(SUM(qty),0)::int AS balance FROM (
      SELECT quantity AS qty FROM purchases WHERE base_id=$1 AND equipment_type_id=$2
      UNION ALL SELECT quantity FROM transfers WHERE destination_base_id=$1 AND equipment_type_id=$2 AND status='COMPLETED'
      UNION ALL SELECT -quantity FROM transfers WHERE source_base_id=$1 AND equipment_type_id=$2 AND status='COMPLETED'
      UNION ALL SELECT -quantity FROM assignments WHERE base_id=$1 AND equipment_type_id=$2
      UNION ALL SELECT -quantity FROM expenditures WHERE base_id=$1 AND equipment_type_id=$2
    ) stock_rows`,
      [targetBase, equipmentTypeId],
    );
    if (stock.rows[0].balance < Number(quantity)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({
          message: `Not enough stock. Available: ${stock.rows[0].balance}`,
        });
    }
    const saved = await client.query(
      `INSERT INTO ${table} (base_id,equipment_type_id,quantity,notes,assigned_to,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        targetBase,
        equipmentTypeId,
        quantity,
        notes || "",
        assignedTo || null,
        req.user.id,
      ],
    );
    await addAudit(
      client,
      req.user.id,
      action,
      `${action.toLowerCase()} of ${quantity} units at base ${targetBase}.`,
    );
    await client.query("COMMIT");
    res.status(201).json(saved.rows[0]);
  } catch {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Record could not be saved." });
  } finally {
    client.release();
  }
}

router.get("/audit-logs", allowRoles("ADMIN"), async (req, res) => {
  const result = await pool.query(
    "SELECT l.*,u.username FROM audit_logs l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 200",
  );
  res.json(result.rows);
});

export default router;

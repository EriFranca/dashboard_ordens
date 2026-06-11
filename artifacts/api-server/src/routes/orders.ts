import { Router } from "express"
import { eq, and, like, sql } from "drizzle-orm"

const router = Router()

async function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurado")
  }
  return import("@workspace/db")
}

router.post("/sap/orders", async (req, res) => {
  const body = req.body

  if (!body || !Array.isArray(body.ordens) || body.ordens.length === 0) {
    res.status(400).json({
      success: false,
      error: "Campo 'ordens' é obrigatório e deve ser um array não vazio",
    })
    return
  }

  let dbModule: Awaited<ReturnType<typeof getDb>>
  try {
    dbModule = await getDb()
  } catch {
    res.status(503).json({ success: false, error: "Banco de dados não configurado" })
    return
  }

  const { db, ordensTable, insertOrdemSchema } = dbModule

  const invalid: number[] = []
  const valid = []

  for (let i = 0; i < body.ordens.length; i++) {
    const parsed = insertOrdemSchema.safeParse(body.ordens[i])
    if (!parsed.success) {
      invalid.push(i)
    } else {
      valid.push(parsed.data)
    }
  }

  if (valid.length === 0) {
    res.status(400).json({
      success: false,
      error: "Nenhuma ordem válida encontrada",
      invalidCount: invalid.length,
    })
    return
  }

  try {
    const agora = new Date()

    await db
      .insert(ordensTable)
      .values(valid.map((o) => ({ ...o, sincronizadoEm: agora })))
      .onConflictDoUpdate({
        target: ordensTable.ordem,
        set: {
          op: sql`excluded.op`,
          material: sql`excluded.material`,
          unid: sql`excluded.unid`,
          qtd: sql`excluded.qtd`,
          qtdEntrada: sql`excluded.qtd_entrada`,
          qtdPlan: sql`excluded.qtd_plan`,
          desvio: sql`excluded.desvio`,
          valor: sql`excluded.valor`,
          dtAbertura: sql`excluded.dt_abertura`,
          dtInicio: sql`excluded.dt_inicio`,
          dtRemessaPlan: sql`excluded.dt_remessa_plan`,
          dtRemessaReal: sql`excluded.dt_remessa_real`,
          recebConcluido: sql`excluded.receb_concluido`,
          dataFim: sql`excluded.data_fim`,
          centro: sql`excluded.centro`,
          tipoOrdem: sql`excluded.tipo_ordem`,
          sincronizadoEm: sql`excluded.sincronizado_em`,
        },
      })

    res.json({
      success: true,
      processados: valid.length,
      ignorados: invalid.length,
      fonte: typeof body.fonte === "string" ? body.fonte : "desconhecida",
      timestamp: typeof body.timestamp === "string" ? body.timestamp : agora.toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    })
  }
})

router.get("/orders", async (req, res) => {
  const { centro, material, tipoOrdem, busca, limit: rawLimit, offset: rawOffset } = req.query

  const limit = Math.min(Math.max(parseInt(String(rawLimit ?? "1000"), 10) || 1000, 1), 5000)
  const offset = Math.max(parseInt(String(rawOffset ?? "0"), 10) || 0, 0)

  let dbModule: Awaited<ReturnType<typeof getDb>>
  try {
    dbModule = await getDb()
  } catch {
    res.status(503).json({ error: "Banco de dados não configurado" })
    return
  }

  const { db, ordensTable } = dbModule

  try {
    const conditions = []
    if (centro && typeof centro === "string") conditions.push(eq(ordensTable.centro, centro))
    if (material && typeof material === "string") conditions.push(eq(ordensTable.material, material))
    if (tipoOrdem && typeof tipoOrdem === "string") conditions.push(eq(ordensTable.tipoOrdem, tipoOrdem))
    if (busca && typeof busca === "string") conditions.push(like(ordensTable.ordem, `%${busca}%`))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [ordens, countResult] = await Promise.all([
      db.select().from(ordensTable).where(where).orderBy(ordensTable.dtAbertura).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(ordensTable).where(where),
    ])

    res.json({ ordens, total: countResult[0]?.total ?? 0, limit, offset })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro interno",
    })
  }
})

export default router

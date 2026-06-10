import { pgTable, text, doublePrecision, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod/v4"

export const ordensTable = pgTable(
  "ordens",
  {
    ordem: text("ordem").primaryKey(),
    op: text("op"),
    material: text("material").notNull(),
    unid: text("unid").notNull(),
    qtd: doublePrecision("qtd").notNull().default(0),
    qtdEntrada: doublePrecision("qtd_entrada").notNull().default(0),
    qtdPlan: doublePrecision("qtd_plan").notNull().default(0),
    desvio: doublePrecision("desvio").notNull().default(0),
    valor: doublePrecision("valor").notNull().default(0),
    dtAbertura: text("dt_abertura"),
    dtInicio: text("dt_inicio"),
    dtRemessaPlan: text("dt_remessa_plan"),
    dtRemessaReal: text("dt_remessa_real"),
    recebConcluido: boolean("receb_concluido").notNull().default(false),
    dataFim: text("data_fim"),
    centro: text("centro").notNull(),
    tipoOrdem: text("tipo_ordem").notNull(),
    sincronizadoEm: timestamp("sincronizado_em").defaultNow(),
  },
  (t) => [
    index("idx_ordens_material").on(t.material),
    index("idx_ordens_centro").on(t.centro),
    index("idx_ordens_dt_abertura").on(t.dtAbertura),
  ],
)

export const insertOrdemSchema = createInsertSchema(ordensTable).omit({
  sincronizadoEm: true,
})

export const selectOrdemSchema = createSelectSchema(ordensTable)

export type InsertOrdem = z.infer<typeof insertOrdemSchema>
export type Ordem = z.infer<typeof selectOrdemSchema>

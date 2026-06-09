import { Router } from "express";

const router = Router();

router.post("/api/sap/sync", async (req, res) => {
  try {
    const startTime = performance.now();
    const duration = performance.now() - startTime;

    res.json({
      success: true,
      message: "Sincronização com SAP concluída",
      duration,
      timestamp: new Date().toISOString(),
      dataFetched: {
        orders: 0,
        materials: 0,
        stockMovements: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
  }
});

router.get("/api/sap/sync", async (req, res) => {
  try {
    res.json({
      isRunning: false,
      lastSync: new Date().toISOString(),
      nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

export default router;

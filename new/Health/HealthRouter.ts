import express, {Request, Response} from "express";
import HealthService from "./HealthService";


const router = express.Router();
router.get('/health', (req: Request, res: Response) => {
    res.send({Response: HealthService.status()})
})

router.get('/health/database', async (req: Request, res: Response) => {
    res.send({Response: await HealthService.databaseStatus()})
})

router.get('/health/geoloc', async (req: Request, res: Response) => {
    res.send({Response: await HealthService.geolocStatus()})
})

export default router;

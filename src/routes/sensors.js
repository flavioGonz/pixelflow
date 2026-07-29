// Sensors CRUD routes — extracted from server.js.
// deps: { app: expressApp, Sensor }
module.exports = function registerSensorsRoutes({ app: expressApp, Sensor }) {

            // Sensors CRUD
        expressApp.get('/api/sensors', async (req, res) => {
            try { res.json(await Sensor.find().sort({ name: 1 })); } catch (e) { res.status(500).json({ error: e.message }); }
        });
        expressApp.post('/api/sensors', async (req, res) => {
            try { res.json(await Sensor.create(req.body)); } catch (e) { res.status(400).json({ error: e.message }); }
        });
        expressApp.put('/api/sensors/:id', async (req, res) => {
            try { res.json(await Sensor.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { res.status(400).json({ error: e.message }); }
        });
        expressApp.delete('/api/sensors/:id', async (req, res) => {
            try { await Sensor.findByIdAndDelete(req.params.id); res.json({ ok: true }); } catch (e) { res.status(400).json({ error: e.message }); }
        });
};

// activities CRUD routes — extracted from server.js.
// deps: { app: expressApp, Activity }
module.exports = function registerActivitiesRoutes({ app: expressApp, Activity }) {

        expressApp.get('/api/activities', async (req, res) => {
            try {
                const activities = await Activity.find().sort({ order: 1 });
                res.json(activities);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/activities:
         *   post:
         *     summary: Create an activity
         *     responses:
         *       200:
         *         description: Activity created
         */
        expressApp.post('/api/activities', async (req, res) => {
            try {
                const activity = await Activity.create(req.body);
                res.json(activity);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/activities/{id}:
         *   put:
         *     summary: Update an activity
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Activity updated
         */
        expressApp.put('/api/activities/:id', async (req, res) => {
            try {
                const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
                res.json(activity);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/activities/{id}:
         *   delete:
         *     summary: Delete an activity
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Activity deleted
         */
        expressApp.delete('/api/activities/:id', async (req, res) => {
            try {
                await Activity.findByIdAndDelete(req.params.id);
                res.json({ message: 'Deleted' });
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
};

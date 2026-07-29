// categories CRUD routes — extracted from server.js.
// deps: { app: expressApp, Category }
module.exports = function registerCategoriesRoutes({ app: expressApp, Category }) {

        expressApp.get('/api/categories', async (req, res) => {
            try {
                const categories = await Category.find().sort({ order: 1 });
                res.json(categories);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/categories:
         *   post:
         *     summary: Create a category
         *     responses:
         *       200:
         *         description: Category created
         */
        expressApp.post('/api/categories', async (req, res) => {
            try {
                const category = await Category.create(req.body);
                res.json(category);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/categories/{id}:
         *   put:
         *     summary: Update a category
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Category updated
         */
        expressApp.put('/api/categories/:id', async (req, res) => {
            try {
                const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
                res.json(category);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/categories/{id}:
         *   delete:
         *     summary: Delete a category
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Category deleted
         */
        expressApp.delete('/api/categories/:id', async (req, res) => {
            try {
                await Category.findByIdAndDelete(req.params.id);
                res.json({ message: 'Deleted' });
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
};

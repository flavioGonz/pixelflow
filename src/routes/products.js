// products CRUD routes — extracted from server.js.
// deps: { app: expressApp, Product }
module.exports = function registerProductsRoutes({ app: expressApp, Product }) {

        expressApp.get('/api/products', async (req, res) => {
            try {
                const products = await Product.find().sort({ createdAt: -1 });
                res.json(products);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/products:
         *   post:
         *     summary: Create a product
         *     responses:
         *       200:
         *         description: Product created
         */
        expressApp.post('/api/products', async (req, res) => {
            try {
                const product = await Product.create(req.body);
                res.json(product);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/products/{id}:
         *   put:
         *     summary: Update a product
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Product updated
         */
        expressApp.put('/api/products/:id', async (req, res) => {
            try {
                const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
                res.json(product);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
    
        /**
         * @swagger
         * /api/products/{id}:
         *   delete:
         *     summary: Delete a product
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Product deleted
         */
        expressApp.delete('/api/products/:id', async (req, res) => {
            try {
                await Product.findByIdAndDelete(req.params.id);
                res.json({ message: 'Deleted' });
            } catch (err) { res.status(500).json({ error: err.message }); }
        });
};

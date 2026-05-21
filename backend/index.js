const express= require('express');
const cors= require('cors');
const dotenv= require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const app= express();
const connectDB= require('./config/db');
const { initializeCloudinary } = require('./config/cloudinary');
const { seedAdminUser } = require('./seeders/adminSeed');
const User = require('./models/user');

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
const authRoutes= require('./routes/authroutes');
const adminRoutes = require('./routes/adminroutes');
app.use('/api/auth',authRoutes);
app.use('/api/admin', adminRoutes);


app.get('/',(req,res)=>{
    res.send('Hello World');
})

const startServer = async () => {
    try {
        initializeCloudinary();
        await connectDB();
        await User.syncIndexes();
        await seedAdminUser();

        const PORT= process.env.PORT || 5000;
        app.listen(PORT,()=>{
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Server startup failed:', err.message);
        process.exit(1);
    }
};

startServer();

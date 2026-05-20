const express= require('express');
const cors= require('cors');
const dotenv= require('dotenv');
dotenv.config();
const app= express();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
const connectDB= require('./config/db');
const authRoutes= require('./routes/authroutes');
const adminRoutes = require('./routes/adminroutes');
app.use('/api/auth',authRoutes);
app.use('/api/admin', adminRoutes);


connectDB();
app.get('/',(req,res)=>{
    res.send('Hello World');
})

const PORT= process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});

import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const TUNNEL_ENABLED = process.env.TUNNEL_ENABLED !== 'false';

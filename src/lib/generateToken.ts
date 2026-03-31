import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export const generateAccessToken = (user: any) => {
        return jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                ACCESS_SECRET,
                { expiresIn: "15m" }
        );
};

export const generateRefreshToken = (user: any) => {
        return jwt.sign(
                { id: user.id },
                REFRESH_SECRET,
                { expiresIn: "7d" }
        );
};
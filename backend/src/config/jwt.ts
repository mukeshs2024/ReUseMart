import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
    userType: 'BUYER' | 'SELLER' | 'BOTH';
    isSeller: boolean;
    activeMode: 'BUYER' | 'SELLER';
}

export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

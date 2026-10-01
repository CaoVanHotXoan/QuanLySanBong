import { Request } from 'express';

export interface JwtPayload {
    id: number;
    email: string;
    ho_ten: string;
    vai_tro: string;
    [key: string]: any;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

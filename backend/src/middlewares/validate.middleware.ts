import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues ?? [];
        return res.status(400).json({
          error: issues.length > 0 ? issues[0].message : 'Validation Error',
          errors: issues.map((e: any) => ({ path: e.path?.join('.'), message: e.message })),
        });
      }
      next(error);
    }
  };
};

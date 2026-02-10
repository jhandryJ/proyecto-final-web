import { z } from 'zod';

// Validación de contraseña segura
const passwordSchema = z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .describe('Contraseña segura');

// Validación de email institucional UIDE
const uideEmailSchema = z.string()
    .email('Email inválido')
    .refine((email) => email.endsWith('@uide.edu.ec'), {
        message: 'Debe usar un correo institucional UIDE (@uide.edu.ec)'
    })
    .describe('Correo institucional UIDE');

export const registerUserSchema = z.object({
    cedula: z.string().length(10).describe('Ecuadorian ID number').default('1712345678'),
    nombres: z.string().min(2).default('Juan'),
    apellidos: z.string().min(2).default('Perez'),
    email: uideEmailSchema.default('juan.perez@uide.edu.ec'),
    password: passwordSchema.default('UidePass2024!'),
    // facultad: z.string().optional().default('Ingeniería'), // Deprecated
    // carrera: z.string().optional().default('Software'), // Deprecated
    carreraId: z.number().int().positive().describe('ID de la Carrera').default(1),
    rol: z.enum(['ADMIN', 'CAPITAN', 'ESTUDIANTE']).default('ESTUDIANTE'),
    genero: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.enum(['Masculino', 'Femenino', 'Otro']).optional()
    )
});

export const loginUserSchema = z.object({
    email: z.string().email().default('estudiante@uide.edu.ec'),
    password: z.string().default('password123')
});

export const loginResponseSchema = z.object({
    accessToken: z.string().describe('JWT Access Token'),
    user: z.object({
        id: z.number(),
        cedula: z.string(),
        email: z.string(),
        nombres: z.string(),
        apellidos: z.string(),
        rol: z.string(),
        genero: z.string().optional().nullable(),
        createdAt: z.string().or(z.date()),
        carrera: z.any().optional()
    })
});

// Schemas para recuperación de contraseña
export const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido')
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token requerido'),
    newPassword: passwordSchema
});


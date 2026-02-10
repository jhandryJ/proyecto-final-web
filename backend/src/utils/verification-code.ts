/**
 * Utilidades para generar y validar códigos de verificación 2FA
 */

/**
 * Genera un código de verificación de 6 dígitos
 * @returns {string} Código numérico de 6 dígitos
 */
export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calcula la fecha de expiración (10 minutos desde ahora)
 * @returns {Date} Fecha de expiración
 */
export function getExpirationDate(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    return now;
}

/**
 * Verifica si un código ha expirado
 * @param {Date} expirationDate - Fecha de expiración del código
 * @returns {boolean} true si el código ha expirado, false en caso contrario
 */
export function isCodeExpired(expirationDate: Date): boolean {
    return new Date() > expirationDate;
}

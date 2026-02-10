#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import { getTeamFilter, getTournamentFilter, getMatchFilter } from '../utils/rls-helpers.js';
import { generateVerificationCode, getExpirationDate, isCodeExpired } from '../utils/verification-code.js';
import { sendVerificationCode } from '../services/email.service.js';

// Estado de sesión en memoria
interface Session {
    isAuthenticated: boolean;
    userId: number;
    userRole: 'ADMIN' | 'CAPITAN' | 'ESTUDIANTE';
    userEmail: string;
    userName: string;
}

let currentSession: Session = {
    isAuthenticated: false,
    userId: 0,
    userRole: 'ESTUDIANTE',
    userEmail: '',
    userName: ''
};

// Inicializar Prisma
const prisma = new PrismaClient();

/**
 * Helper para verificar autenticación antes de ejecutar herramientas protegidas
 */
function requireAuth(): void {
    if (!currentSession.isAuthenticated) {
        throw new Error('Usuario no autenticado. Por favor, usa la herramienta "solicitar_codigo_acceso" con tu email para iniciar sesión.');
    }
}

// Crear servidor MCP
const server = new Server(
    {
        name: 'uideportes-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Definir herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'solicitar_codigo_acceso',
                description: 'Solicita un código de verificación para iniciar sesión. Se enviará al correo electrónico proporcionado.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            description: 'Correo electrónico institucional o registrado',
                        },
                    },
                    required: ['email'],
                },
            },
            {
                name: 'verificar_codigo_acceso',
                description: 'Verifica el código recibido por correo para completar el inicio de sesión.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            description: 'Correo electrónico',
                        },
                        codigo: {
                            type: 'string',
                            description: 'Código de verificación de 6 dígitos',
                        },
                    },
                    required: ['email', 'codigo'],
                },
            },
            {
                name: 'query_my_teams',
                description: 'Consulta los equipos del usuario autenticado. Requiere inicio de sesión previo.',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'query_tournaments',
                description: 'Consulta torneos disponibles. Requiere inicio de sesión previo.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        disciplina: {
                            type: 'string',
                            description: 'Filtrar por disciplina (opcional): Futbol, Basket, Ecuavoley',
                        },
                    },
                },
            },
            {
                name: 'query_matches',
                description: 'Consulta partidos del usuario. Requiere inicio de sesión previo.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        torneoId: {
                            type: 'number',
                            description: 'Filtrar por ID de torneo (opcional)',
                        },
                    },
                },
            },
            {
                name: 'query_team_stats',
                description: 'Obtiene estadísticas de un equipo. Requiere inicio de sesión previo.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        equipoId: {
                            type: 'number',
                            description: 'ID del equipo',
                        },
                    },
                    required: ['equipoId'],
                },
            },
        ],
    };
});

// Implementar handlers de herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'solicitar_codigo_acceso': {
                const { email } = args as { email: string };

                const user = await prisma.usuario.findUnique({
                    where: { email },
                    select: { id: true, email: true, nombres: true, apellidos: true }
                });

                if (!user) {
                    throw new Error(`No se encontró ningún usuario con el correo ${email}`);
                }

                // Generar código
                const code = generateVerificationCode();
                const expirationDate = getExpirationDate();

                // Guardar en base de datos
                await prisma.codigoVerificacionMCP.create({
                    data: {
                        usuarioId: user.id,
                        codigo: code,
                        expiraEn: expirationDate,
                    }
                });

                // Enviar correo
                const userName = `${user.nombres} ${user.apellidos}`;
                const result = await sendVerificationCode(user.email, code, userName);

                if (!result.success) {
                    throw new Error('Error al enviar el correo de verificación');
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Se ha enviado un código de verificación a ${email}. Por favor, verifica tu correo y usa la herramienta 'verificar_codigo_acceso' con el código recibido.`,
                        },
                    ],
                };
            }

            case 'verificar_codigo_acceso': {
                const { email, codigo } = args as { email: string; codigo: string };

                const user = await prisma.usuario.findUnique({
                    where: { email },
                    select: { id: true, email: true, nombres: true, apellidos: true, rol: true }
                });

                if (!user) {
                    throw new Error('Usuario no encontrado');
                }

                // Verificar código
                const verification = await prisma.codigoVerificacionMCP.findFirst({
                    where: {
                        usuarioId: user.id,
                        codigo: codigo,
                        verificado: false
                    },
                    orderBy: { creadoEn: 'desc' }
                });

                if (!verification) {
                    throw new Error('Código inválido');
                }

                if (isCodeExpired(verification.expiraEn)) {
                    throw new Error('El código ha expirado, por favor solicita uno nuevo');
                }

                // Marcar verificado
                await prisma.codigoVerificacionMCP.update({
                    where: { id: verification.id },
                    data: { verificado: true }
                });

                // ACTUALIZAR SESIÓN
                currentSession = {
                    isAuthenticated: true,
                    userId: user.id,
                    userRole: user.rol,
                    userEmail: user.email,
                    userName: `${user.nombres} ${user.apellidos}`
                };

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                message: `¡Inicio de sesión exitoso! Bienvenido ${currentSession.userName}.`,
                                rol: currentSession.userRole,
                                availableInfo: "Ahora puedes consultar tus equipos, torneos y partidos."
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'query_my_teams': {
                requireAuth(); // 🔒 PROTEGIDO

                // Aplicar filtro RLS
                const filter = getTeamFilter(currentSession.userId, currentSession.userRole);

                const teams = await prisma.equipo.findMany({
                    where: filter,
                    include: {
                        capitan: {
                            select: {
                                id: true,
                                nombres: true,
                                apellidos: true,
                                email: true,
                            },
                        },
                        miembros: {
                            include: {
                                usuario: {
                                    select: {
                                        id: true,
                                        nombres: true,
                                        apellidos: true,
                                    },
                                },
                            },
                        },
                    },
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                userId: currentSession.userId,
                                userRole: currentSession.userRole,
                                teams: teams.map(team => ({
                                    id: team.id,
                                    nombre: team.nombre,
                                    facultad: team.facultad,
                                    capitan: `${team.capitan.nombres} ${team.capitan.apellidos}`,
                                    miembros: team.miembros.length,
                                })),
                                message: `Encontrados ${teams.length} equipo(s) para el usuario`,
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'query_tournaments': {
                requireAuth(); // 🔒 PROTEGIDO

                const { disciplina } = args as { disciplina?: string };

                // Aplicar filtro RLS
                const filter = getTournamentFilter(currentSession.userId, currentSession.userRole);

                const tournaments = await prisma.torneo.findMany({
                    where: {
                        ...filter,
                        ...(disciplina ? { disciplina } : {}),
                    },
                    include: {
                        campeonato: {
                            select: {
                                nombre: true,
                                anio: true,
                            },
                        },
                        equiposInscritos: {
                            include: {
                                equipo: {
                                    select: {
                                        nombre: true,
                                    },
                                },
                            },
                        },
                    },
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                userId: currentSession.userId,
                                userRole: currentSession.userRole,
                                tournaments: tournaments.map(t => ({
                                    id: t.id,
                                    disciplina: t.disciplina,
                                    categoria: t.categoria,
                                    campeonato: t.campeonato.nombre,
                                    anio: t.campeonato.anio,
                                    equiposInscritos: t.equiposInscritos.length,
                                })),
                                message: `Encontrados ${tournaments.length} torneo(s)`,
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'query_matches': {
                requireAuth(); // 🔒 PROTEGIDO

                const { torneoId } = args as { torneoId?: number };

                // Aplicar filtro RLS
                const filter = getMatchFilter(currentSession.userId, currentSession.userRole);

                const matches = await prisma.partido.findMany({
                    where: {
                        ...filter,
                        ...(torneoId ? { torneoId } : {}),
                    },
                    include: {
                        equipoLocal: {
                            select: {
                                nombre: true,
                            },
                        },
                        equipoVisitante: {
                            select: {
                                nombre: true,
                            },
                        },
                        cancha: {
                            select: {
                                nombre: true,
                            },
                        },
                        torneo: {
                            select: {
                                disciplina: true,
                            },
                        },
                    },
                    orderBy: {
                        fechaHora: 'asc',
                    },
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                userId: currentSession.userId,
                                userRole: currentSession.userRole,
                                matches: matches.map(m => ({
                                    id: m.id,
                                    local: m.equipoLocal?.nombre || 'TBD',
                                    visitante: m.equipoVisitante?.nombre || 'TBD',
                                    fecha: m.fechaHora,
                                    cancha: m.cancha?.nombre,
                                    estado: m.estado,
                                    marcador: `${m.marcadorLocal || 0} - ${m.marcadorVisitante || 0}`,
                                    disciplina: m.torneo.disciplina,
                                })),
                                message: `Encontrados ${matches.length} partido(s)`,
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'query_team_stats': {
                requireAuth(); // 🔒 PROTEGIDO

                const { equipoId } = args as { equipoId: number };

                if (!equipoId) {
                    throw new Error('equipoId es requerido');
                }

                // Validar acceso con RLS
                const filter = getTeamFilter(currentSession.userId, currentSession.userRole);
                const team = await prisma.equipo.findFirst({
                    where: {
                        id: equipoId,
                        ...filter,
                    },
                    include: {
                        capitan: {
                            select: {
                                nombres: true,
                                apellidos: true,
                            },
                        },
                        miembros: {
                            include: {
                                usuario: {
                                    select: {
                                        nombres: true,
                                        apellidos: true,
                                    },
                                },
                            },
                        },
                        partidosLocal: {
                            where: {
                                estado: 'FINALIZADO',
                            },
                        },
                        partidosVisitante: {
                            where: {
                                estado: 'FINALIZADO',
                            },
                        },
                    },
                });

                if (!team) {
                    throw new Error('Equipo no encontrado o no tienes permiso para verlo');
                }

                // Calcular estadísticas
                const partidosJugados = team.partidosLocal.length + team.partidosVisitante.length;
                const victorias = team.partidosLocal.filter(p => (p.marcadorLocal || 0) > (p.marcadorVisitante || 0)).length +
                    team.partidosVisitante.filter(p => (p.marcadorVisitante || 0) > (p.marcadorLocal || 0)).length;
                const derrotas = team.partidosLocal.filter(p => (p.marcadorLocal || 0) < (p.marcadorVisitante || 0)).length +
                    team.partidosVisitante.filter(p => (p.marcadorVisitante || 0) < (p.marcadorLocal || 0)).length;
                const empates = partidosJugados - victorias - derrotas;

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                userId: currentSession.userId,
                                userRole: currentSession.userRole,
                                team: {
                                    id: team.id,
                                    nombre: team.nombre,
                                    facultad: team.facultad,
                                    capitan: `${team.capitan.nombres} ${team.capitan.apellidos}`,
                                    miembros: team.miembros.length,
                                    estadisticas: {
                                        partidosJugados,
                                        victorias,
                                        derrotas,
                                        empates,
                                        porcentajeVictorias: partidosJugados > 0 ? ((victorias / partidosJugados) * 100).toFixed(1) : '0',
                                    },
                                },
                                message: 'Estadísticas obtenidas exitosamente',
                            }, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Herramienta desconocida: ${name}`);
        }
    } catch (error: any) {
        console.error(`[MCP Server] Error en ${name}:`, error);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        userId: currentSession.userId,
                        userRole: currentSession.userRole,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});

// Iniciar servidor
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🚀 [MCP Server] Servidor MCP iniciado. Esperando autenticación de usuario...');
}

main().catch((error) => {
    console.error('[MCP Server] Error fatal:', error);
    process.exit(1);
});

// ============================================
// TIPOS Y CONSTANTES - Alineados con el backend
// ============================================

export const Rol = {
    ADMIN: 'ADMIN',
    CAPITAN: 'CAPITAN',
    ESTUDIANTE: 'ESTUDIANTE'
} as const;
export type Rol = typeof Rol[keyof typeof Rol];

export const EstadoPago = {
    PENDIENTE: 'PENDIENTE',
    VALIDADO: 'VALIDADO',
    RECHAZADO: 'RECHAZADO'
} as const;
export type EstadoPago = typeof EstadoPago[keyof typeof EstadoPago];

export const EstadoPartido = {
    PROGRAMADO: 'PROGRAMADO',
    EN_CURSO: 'EN_CURSO',
    FINALIZADO: 'FINALIZADO',
    CANCELADO: 'CANCELADO'
} as const;
export type EstadoPartido = typeof EstadoPartido[keyof typeof EstadoPartido];

export const Disciplina = {
    FUTBOL: 'FUTBOL',
    BASKET: 'BASKET',
    ECUAVOLEY: 'ECUAVOLEY'
} as const;
export type Disciplina = typeof Disciplina[keyof typeof Disciplina];

export const Categoria = {
    ELIMINATORIA: 'ELIMINATORIA',
    FASE_GRUPOS: 'FASE_GRUPOS',
    TODOS_CONTRA_TODOS: 'TODOS_CONTRA_TODOS'
} as const;
export type Categoria = typeof Categoria[keyof typeof Categoria];

export const Genero = {
    MASCULINO: 'MASCULINO',
    FEMENINO: 'FEMENINO',
    MIXTO: 'MIXTO'
} as const;
export type Genero = typeof Genero[keyof typeof Genero];

export const TipoFeedback = {
    RECLAMO: 'RECLAMO',
    SUGERENCIA: 'SUGERENCIA'
} as const;
export type TipoFeedback = typeof TipoFeedback[keyof typeof TipoFeedback];


// ============================================
// INTERFACES - Entidades del Backend
// ============================================

export interface Facultad {
    id: number;
    nombre: string;
    carreras?: Carrera[];
}

export interface Carrera {
    id: number;
    nombre: string;
    facultadId: number;
    facultad?: Facultad;
}

export interface Usuario {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    rol: Rol;
    carreraId?: number;
    carrera?: Carrera;
    facultad?: string; // Legacy optional for compatibility if needed, but better remove
    // carrera?: string; // Legacy
    createdAt: Date;
}

export interface MiembroEquipo {
    id: number;
    equipoId: number;
    usuarioId: number;
    usuario?: Usuario;
}

export interface Team {
    id: number;
    nombre: string;
    logoUrl?: string;
    facultad?: string;
    disciplina?: Disciplina | string;
    capitanId: number;
    capitan?: {
        id: number;
        nombres: string;
        apellidos: string;
        email: string;
        carrera?: Carrera;
    };
    miembros?: MiembroEquipo[];
    createdAt?: Date;
    // Campos calculados (legacy - mantener para compatibilidad)
    name?: string; // Alias de nombre
    sport?: string; // Alias de facultad
    color?: string; // Para UI
    captainId?: number; // Alias de capitanId
    players?: Player[];
    wins?: number;
    losses?: number;
    draws?: number;
    goalsFor?: number;
    goalsAgainst?: number;
    codigoAcceso?: string;
}

export interface Player {
    id: number;
    name: string;
    number: number;
    position: string;
}

export interface Championship {
    id: number;
    nombre: string;
    anio: number;
    fechaInicio: Date;
    fechaFin?: Date;
    torneos?: Tournament[];
}

export interface Tournament {
    id: number;
    campeonatoId: number;
    disciplina: Disciplina | string;
    categoria: Categoria | string;
    genero: Genero | string;
    tipoSorteo?: 'BRACKET' | 'GRUPOS';
    configuracion?: any;
    campeonato?: Championship;
    // Campos calculados/legacy
    name?: string;
    sport?: string;
    format?: 'groups' | 'knockout' | 'single-elimination';
    teams?: string[];
    teamDetails?: { id: number; name: string }[];
    image?: string;
    matchups?: Matchup[];
    groups?: Group[];
    status?: 'pending' | 'drawn' | 'in-progress' | 'completed';
    createdAt?: Date;
    costoInscripcion?: number;
}

export interface Cancha {
    id: number;
    nombre: string;
    ubicacion?: string;
}

export interface Arbitro {
    id: number;
    nombres: string;
    contacto?: string;
}

export interface MatchResult {
    team1Score: number;
    team2Score: number;
    played: boolean;
    date?: Date;
}

export interface Matchup {
    id: number;
    torneoId?: number;
    canchaId?: number;
    arbitroId?: number;
    equipoLocalId?: number;
    equipoVisitanteId?: number;
    fechaHora: Date;
    estado: EstadoPartido | string;
    marcadorLocal?: number;
    marcadorVisitante?: number;
    fase?: string; // Octavos, Cuartos, Semifinales, Final
    llave?: string;
    siguientePartidoId?: number;
    // Relaciones
    cancha?: Cancha;
    arbitro?: Arbitro;
    equipoLocal?: Team;
    equipoVisitante?: Team;
    // Campos legacy
    team1?: string;
    team2?: string;
    round?: number;
    result?: MatchResult;
    scheduledDate?: Date;
}

export interface Group {
    id: number;
    nombre: string;
    equipoTorneoId: number;
    // Campos legacy
    name?: string;
    teams?: string[];
}

export interface EquipoTorneo {
    id: number;
    equipoId: number;
    torneoId: number;
    estado: 'INSCRITO' | 'ACEPTADO' | 'PENDIENTE_PAGO' | 'PAGO_EN_REVISION' | 'RECHAZADO';
    equipo?: Team;
    torneo?: Tournament;
}

export interface ValidacionPago {
    id: number;
    equipoId: number;
    torneoId?: number; // Should be mandatory logically but optional for backwards compatibility if needed
    usuarioPagoId: number;
    monto: number;
    comprobanteUrl: string;
    estado: EstadoPago;
    fechaSubida: Date;
    validadoPorId?: number;
    observacion?: string;
    equipo?: Team;
    usuarioPago?: Usuario;
    validadoPor?: Usuario;
}

export interface Streaming {
    id: number;
    partidoId: number;
    url: string;
    isLive: boolean;
    partido?: Matchup;
}

export interface StreamMatchup {
    id: number;
    team1: string;
    team2: string;
    date: Date;
    location?: string;
    round?: number;
}

export interface StreamEvent {
    id: number;
    title: string;
    matchup: StreamMatchup;
    streamUrl: string;
    scheduledDate: Date;
    status: 'upcoming' | 'live' | 'ended';
    viewers?: number;
    likes?: number;
}

export interface Feedback {
    id: number;
    usuarioId?: number;
    mensaje: string;
    tipo: TipoFeedback | string;
    fecha: Date;
    usuario?: Usuario;
}

export interface TeamStanding {
    equipoId: number;
    equipoNombre: string;
    logoUrl?: string;
    partidosJugados: number;
    ganados: number;
    empatados: number;
    perdidos: number;
    golesFavor: number;
    golesContra: number;
    diferencia: number;
    puntos: number;
    grupo?: string;
}

export interface TournamentStandings {
    torneoId: number;
    torneoNombre: string;
    tipoSorteo: string;
    equipos: TeamStanding[];
    grupos?: { [key: string]: TeamStanding[] };
}

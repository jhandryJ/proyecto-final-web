export interface Player {
    id: string;
    name: string;
    number: number;
    position: string;
}

export interface Team {
    id: string;
    name: string;
    sport: string;
    color: string;
    players: Player[];
    createdAt: Date;
    wins?: number;
    losses?: number;
    draws?: number;
    goalsFor?: number;
    goalsAgainst?: number;
}

export interface MatchResult {
    team1Score: number;
    team2Score: number;
    played: boolean;
    date?: Date;
}

export interface Matchup {
    id: string;
    team1: string;
    team2: string;
    round: number;
    result?: MatchResult;
    scheduledDate?: Date;
}

export interface Group {
    name: string;
    teams: string[];
}

export interface Tournament {
    id: string;
    name: string;
    sport: string;
    format: 'groups' | 'knockout' | 'single-elimination';
    teams: string[];
    image?: string;
    matchups?: Matchup[];
    groups?: Group[];
    status: 'pending' | 'drawn' | 'in-progress' | 'completed';
    createdAt: Date;
}

export interface StreamEvent {
    id: string;
    title: string;
    matchup: Matchup;
    streamUrl: string;
    scheduledDate: Date;
    status: 'upcoming' | 'live' | 'ended';
    viewers?: number;
}

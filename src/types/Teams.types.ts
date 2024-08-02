export interface TeamsResponse {
    data:  Team[];
    total: number;
}

export interface Team {
    id:          number;
    franchiseId: number | null;
    fullName:    string;
    leagueId:    number;
    rawTricode:  string;
    triCode:     string;
}
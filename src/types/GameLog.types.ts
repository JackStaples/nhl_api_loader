export interface GameLogResponse {
    seasonId:           number;
    gameTypeId:         number;
    playerStatsSeasons: PlayerStatsSeason[];
    gameLog:            GameLog[] | GoalieGameLog[];
}

export interface GameLog {
    gameId:             number;
    teamAbbrev:         string;
    homeRoadFlag:       HomeRoadFlag;
    gameDate:           Date;
    goals:              number;
    assists:            number;
    commonName:         CommonName;
    opponentCommonName: OpponentCommonName;
    points:             number;
    plusMinus:          number;
    powerPlayGoals:     number;
    powerPlayPoints:    number;
    gameWinningGoals:   number;
    otGoals:            number;
    shots:              number;
    shifts:             number;
    shorthandedGoals:   number;
    shorthandedPoints:  number;
    opponentAbbrev:     string;
    pim:                number;
    toi:                string;
}

export interface GoalieGameLog {
    gameId:             number;
    teamAbbrev:         string;
    homeRoadFlag:       string;
    gameDate:           Date;
    goals:              number;
    assists:            number;
    commonName:         CommonName;
    opponentCommonName: CommonName;
    gamesStarted:       number;
    decision:           string;
    shotsAgainst:       number;
    goalsAgainst:       number;
    savePctg:           number;
    shutouts:           number;
    opponentAbbrev:     string;
    pim:                number;
    toi:                string;
}

export function isGoalieGameLog(log: GameLog | GoalieGameLog): log is GoalieGameLog {
    return (log as GoalieGameLog).gamesStarted !== undefined && 
           (log as GoalieGameLog).shotsAgainst !== undefined && 
           (log as GoalieGameLog).goalsAgainst !== undefined && 
           (log as GoalieGameLog).shutouts !== undefined;
}

export interface CommonName {
    default: string;
}


export enum HomeRoadFlag {
    H = 'H',
    R = 'R',
}

export interface OpponentCommonName {
    default: string;
    fr?:     string;
}

export interface PlayerStatsSeason {
    season:    number;
    gameTypes: number[];
}
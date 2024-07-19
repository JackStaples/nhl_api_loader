export type PlayByPlayResponse = {
    id:                number;
    season:            number;
    gameType:          number;
    limitedScoring:    boolean;
    gameDate:          Date;
    venue:             ItemName;
    venueLocation:     ItemName;
    startTimeUTC:      Date;
    easternUTCOffset:  string;
    venueUTCOffset:    string;
    gameState:         string;
    gameScheduleState: string;
    periodDescriptor:  PeriodDescriptor;
    awayTeam:          Team;
    homeTeam:          Team;
    shootoutInUse:     boolean;
    otInUse:           boolean;
    displayPeriod:     number;
    maxPeriods:        number;
    plays:             Play[];
    rosterSpots:       RosterSpot[];
    regPeriods:        number;
}

export type Team = {
    id:        number;
    name:      ItemName;
    abbrev:    string;
    logo:      string;
    score?:     number;
    placeName?: ItemName;
    sog?:       number;
}

export type ItemName = {
    default: string;
}

export enum PeriodType {
    Ot = "OT",
    Reg = "REG",
}

export type PeriodDescriptor = {
    number:               number;
    periodType:           PeriodType;
    maxRegulationPeriods: number;
}

export type Play = {
    eventId:               number;
    periodDescriptor:      PeriodDescriptor;
    timeInPeriod:          string;
    timeRemaining:         string;
    situationCode:         string;
    homeTeamDefendingSide: HomeTeamDefendingSide;
    typeCode:              number;
    typeDescKey:           TypeDescKey;
    sortOrder:             number;
    details?:              Details;
}

export type Details = {
    eventOwnerTeamId?:    number;
    losingPlayerId?:      number;
    winningPlayerId?:     number;
    xCoord?:              number;
    yCoord?:              number;
    zoneCode?:            ZoneCode;
    typeCode?:            string;
    descKey?:             string;
    duration?:            number;
    committedByPlayerId?: number;
    drawnByPlayerId?:     number;
    shotType?:            ShotType;
    shootingPlayerId?:    number;
    goalieInNetId?:       number;
    awaySOG?:             number;
    homeSOG?:             number;
    blockingPlayerId?:    number;
    reason?:              string;
    hittingPlayerId?:     number;
    hitteePlayerId?:      number;
    playerId?:            number;
    secondaryReason?:     SecondaryReason;
    scoringPlayerId?:     number;
    scoringPlayerTotal?:  number;
    assist1PlayerId?:     number;
    assist1PlayerTotal?:  number;
    awayScore?:           number;
    homeScore?:           number;
    assist2PlayerId?:     number;
    assist2PlayerTotal?:  number;
}

export enum SecondaryReason {
    TvTimeout = "tv-timeout",
    VideoReview = "video-review",
    VisitorTimeout = "visitor-timeout",
}

export enum ShotType {
    Backhand = "backhand",
    Deflected = "deflected",
    Slap = "slap",
    Snap = "snap",
    TipIn = "tip-in",
    Wrist = "wrist",
}

export enum ZoneCode {
    D = "D",
    N = "N",
    O = "O",
}

export enum HomeTeamDefendingSide {
    Left = "left",
    Right = "right",
}

export enum TypeDescKey {
    BlockedShot = "blocked-shot",
    DelayedPenalty = "delayed-penalty",
    Faceoff = "faceoff",
    GameEnd = "game-end",
    Giveaway = "giveaway",
    Goal = "goal",
    Hit = "hit",
    MissedShot = "missed-shot",
    Penalty = "penalty",
    PeriodEnd = "period-end",
    PeriodStart = "period-start",
    ShotOnGoal = "shot-on-goal",
    Stoppage = "stoppage",
    Takeaway = "takeaway",
}

export type RosterSpot = {
    teamId:        number;
    playerId:      number;
    firstName:     ItemName;
    lastName:      ItemName;
    sweaterNumber: number;
    positionCode:  PositionCode;
    headshot:      string;
}

export enum PositionCode {
    C = "C",
    D = "D",
    G = "G",
    L = "L",
    R = "R",
}

export type GameInfo = {
    referees: ItemName[];
    linesmen: ItemName[];
    awayTeam: GameScratches;
    homeTeam: GameScratches;
}

export type GameScratches = {
    scratches: Person[];
}

export type Person = {
    id:        number;
    firstName: ItemName;
    lastName:  ItemName;
}

export type GameReports = {
    gameSummary:       string;
    eventSummary:      string;
    playByPlay:        string;
    faceoffSummary:    string;
    faceoffComparison: string;
    rosters:           string;
    shotSummary:       string;
    shiftChart:        string;
    toiAway:           string;
    toiHome:           string;
}

export type Linescore = {
    byPeriod: ByPeriod[];
    totals:   Totals;
}

export type ByPeriod = {
    periodDescriptor: PeriodDescriptor;
    away:             number;
    home:             number;
}

export type Totals = {
    away: number;
    home: number;
}
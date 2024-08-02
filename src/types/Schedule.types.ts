export interface ScheduleResponse {
    previousSeason: number;
    currentSeason:  number;
    nextSeason:     number;
    clubTimezone:   string;
    clubUTCOffset:  UTCOffset;
    games:          Game[];
}

export enum UTCOffset {
    The0400 = '-04:00',
    The0500 = '-05:00',
    The0600 = '-06:00',
    The0700 = '-07:00',
    The0800 = '-08:00',
}

export interface Game {
    id:                 number;
    season:             number;
    gameType:           number;
    gameDate:           Date;
    venue:              Venue;
    neutralSite:        boolean;
    startTimeUTC:       Date;
    easternUTCOffset:   UTCOffset;
    venueUTCOffset:     UTCOffset;
    venueTimezone:      string;
    gameState:          GameState;
    gameScheduleState:  GameScheduleState;
    tvBroadcasts:       TvBroadcast[];
    awayTeam:           Team;
    homeTeam:           Team;
    periodDescriptor:   PeriodDescriptor;
    gameOutcome:        GameOutcome;
    winningGoalie:      WinningGoal;
    winningGoalScorer?: WinningGoal;
    gameCenterLink:     string;
    threeMinRecap?:     string;
    threeMinRecapFr?:   string;
}

export interface Team {
    id:                       number;
    placeName:                PlaceName;
    placeNameWithPreposition: PlaceName;
    abbrev:                   string;
    logo:                     string;
    darkLogo:                 string;
    awaySplitSquad?:          boolean;
    score:                    number;
    airlineLink?:             string;
    airlineDesc?:             string;
    hotelLink?:               string;
    hotelDesc?:               string;
    homeSplitSquad?:          boolean;
}

export interface PlaceName {
    default: string;
    fr?:     string;
}

export interface GameOutcome {
    lastPeriodType: PeriodType;
}

export enum PeriodType {
    Ot = 'OT',
    Reg = 'REG',
    So = 'SO',
}

export enum GameScheduleState {
    Ok = 'OK',
}

export enum GameState {
    Final = 'FINAL',
    Off = 'OFF',
}

export interface PeriodDescriptor {
    periodType:           PeriodType;
    maxRegulationPeriods: number;
}

export interface TvBroadcast {
    id:             number;
    market:         Market;
    countryCode:    CountryCode;
    network:        string;
    sequenceNumber: number;
}

export enum CountryCode {
    CA = 'CA',
    Us = 'US',
}

export enum Market {
    A = 'A',
    H = 'H',
    N = 'N',
}

export interface Venue {
    default: string;
    es?:     Es;
    fr?:     Fr;
}

export enum Es {
    SAPCenterEnSANJose = 'SAP Center en San Jose',
}

export enum Fr {
    CentreCanadianTire = 'Centre Canadian Tire',
    SAPCenterDeSANJose = 'SAP Center de San Jose',
}

export interface WinningGoal {
    playerId:     number;
    firstInitial: FirstInitial;
    lastName:     LastName;
}

export interface FirstInitial {
    default: string;
}

export interface LastName {
    default: string;
    cs?:     string;
    fi?:     string;
    sk?:     string;
}

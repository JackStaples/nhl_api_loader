export interface Player {
    playerId:                     number;
    isActive:                     boolean;
    currentTeamId:                number;
    currentTeamAbbrev:            string;
    fullTeamName:                 FullTeamName;
    teamCommonName:               BirthCity;
    teamPlaceNameWithPreposition: FullTeamName;
    firstName:                    BirthCity;
    lastName:                     BirthCity;
    teamLogo:                     string;
    sweaterNumber:                number;
    position:                     string;
    headshot:                     string;
    heroImage:                    string;
    heightInInches:               number;
    heightInCentimeters:          number;
    weightInPounds:               number;
    weightInKilograms:            number;
    birthDate:                    Date;
    birthCity:                    BirthCity;
    birthStateProvince:           BirthCity;
    birthCountry:                 string;
    shootsCatches:                string;
    draftDetails:                 DraftDetails;
    playerSlug:                   string;
    inTop100AllTime:              number;
    inHHOF:                       number;
    featuredStats:                FeaturedStats;
    careerTotals:                 CareerTotals;
    shopLink:                     string;
    twitterLink:                  string;
    watchLink:                    string;
    last5Games:                   Last5Game[];
    seasonTotals:                 SeasonTotal[];
    awards:                       Award[];
    currentTeamRoster:            CurrentTeamRoster[];
}

export interface Award {
    trophy:  FullTeamName;
    seasons: { [key: string]: number }[];
}

export interface FullTeamName {
    default: string;
    fr?:     string;
}

export interface BirthCity {
    default: string;
}

export interface CareerTotals {
    regularSeason: CareerClass;
    playoffs:      CareerClass;
}

export interface CareerClass {
    assists:             number;
    avgToi?:             string;
    faceoffWinningPctg?: number;
    gameWinningGoals:    number;
    gamesPlayed:         number;
    goals:               number;
    otGoals:             number;
    pim:                 number;
    plusMinus:           number;
    points:              number;
    powerPlayGoals:      number;
    powerPlayPoints:     number;
    shootingPctg:        number;
    shorthandedGoals:    number;
    shorthandedPoints:   number;
    shots:               number;
}

export interface CurrentTeamRoster {
    playerId:   number;
    lastName:   LastName;
    firstName:  Name;
    playerSlug: string;
}

export interface Name {
    default: string;
    cs?:     string;
    de?:     string;
    es?:     string;
    fi?:     string;
    sk?:     string;
    sv?:     string;
    fr?:     string;
}

export interface LastName {
    default: string;
    sv?:     string;
}

export interface DraftDetails {
    year:        number;
    teamAbbrev:  string;
    round:       number;
    pickInRound: number;
    overallPick: number;
}

export interface FeaturedStats {
    season:        number;
    regularSeason: FeaturedStatsPlayoffs;
    playoffs:      FeaturedStatsPlayoffs;
}

export interface FeaturedStatsPlayoffs {
    subSeason: CareerClass;
    career:    CareerClass;
}

export interface Last5Game {
    assists:          number;
    gameDate:         Date;
    gameId:           number;
    gameTypeId:       number;
    goals:            number;
    homeRoadFlag:     string;
    opponentAbbrev:   string;
    pim:              number;
    plusMinus:        number;
    points:           number;
    powerPlayGoals:   number;
    shifts:           number;
    shorthandedGoals: number;
    shots:            number;
    teamAbbrev:       string;
    toi:              string;
}

export interface SeasonTotal {
    assists:                       number;
    gameTypeId:                    number;
    gamesPlayed:                   number;
    goals:                         number;
    leagueAbbrev:                  string;
    pim?:                          number;
    points:                        number;
    season:                        number;
    sequence:                      number;
    teamName:                      Name;
    gameWinningGoals?:             number;
    plusMinus?:                    number;
    powerPlayGoals?:               number;
    shorthandedGoals?:             number;
    shots?:                        number;
    teamCommonName?:               Name;
    avgToi?:                       string;
    faceoffWinningPctg?:           number;
    otGoals?:                      number;
    powerPlayPoints?:              number;
    shootingPctg?:                 number;
    shorthandedPoints?:            number;
    teamPlaceNameWithPreposition?: FullTeamName;
}
